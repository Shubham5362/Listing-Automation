from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.agents.base import AgentTask
from app.agents.orchestrator import orchestrator
from app.models.ai_command import AICommand, AICommandStatus
from app.models.core import User


class AICommandExecutionService:
    """Execute only explicitly approved proposed command steps, preserving checkpoints."""

    def __init__(self, db: Session, user: User):
        self.db = db
        self.user = user

    def approve_and_execute(self, command_id: int, seller_account_id: int) -> AICommand:
        command = self.db.scalar(select(AICommand).where(
            AICommand.id == command_id,
            AICommand.seller_account_id == seller_account_id,
            AICommand.user_id == self.user.id,
        ))
        if command is None:
            raise LookupError("AI command not found")
        if command.status == AICommandStatus.completed:
            return command
        if command.status not in {AICommandStatus.needs_approval, AICommandStatus.failed}:
            raise ValueError("AI command is not awaiting approval")

        response = dict(command.response or {})
        actions = list(response.get("actions", []))
        if not actions:
            command.status = AICommandStatus.completed
            self.db.commit(); self.db.refresh(command)
            return command

        context = {"query": command.query, "trace_id": command.trace_id}
        failed = False
        for action in actions:
            if action.get("status") in {"completed", "success"}:
                continue
            dependencies = action.get("depends_on", [])
            if any(actions[d - 1].get("status") not in {"completed", "success", "skipped"}
                   for d in dependencies if 0 < d <= len(actions)):
                action["status"] = "blocked"
                failed = True
                continue
            if not action.get("requires_approval", True):
                action["status"] = "skipped"
                continue
            try:
                result = orchestrator.execute(
                    seller_account_id, self.user.id,
                    AgentTask(name=action["agent"], task=action["task"], input=context, requires_approval=True),
                )
                action["status"] = result.status
                action["output"] = result.output
                if result.status not in {"completed", "success"}:
                    failed = True
                    break
            except Exception as exc:
                action["status"] = "failed"
                action["output"] = {"error": str(exc)}
                failed = True
                break

        response["actions"] = actions
        response["execution"] = {"approved": True, "executed": not failed,
            "completed_steps": sum(a.get("status") in {"completed", "success", "skipped"} for a in actions),
            "total_steps": len(actions)}
        command.response = response
        command.status = AICommandStatus.failed if failed else AICommandStatus.completed
        self.db.commit(); self.db.refresh(command)
        return command
