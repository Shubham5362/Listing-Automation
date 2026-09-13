from app.models.ai_command import AICommandStatus
from app.services.ai_command_execution import AICommandExecutionService


def test_command_execution_statuses_are_explicit():
    assert AICommandStatus.completed == "completed"
    assert AICommandStatus.needs_approval == "needs_approval"
    assert AICommandStatus.failed == "failed"


def test_execution_service_requires_db_and_user_context():
    service = object.__new__(AICommandExecutionService)
    assert not hasattr(service, "db")
    assert not hasattr(service, "user")
