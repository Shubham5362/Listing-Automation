from __future__ import annotations
import hashlib,json
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.autofill import AutofillAction,AutofillSession
from app.models.autofill_clarification import AutofillClarification
from app.models.browser_execution import BrowserExecution,BrowserExecutionStep
def _dump(v): return json.dumps(v,ensure_ascii=False,separators=(",",":"))
def _fingerprint(fields): return hashlib.sha256(_dump(sorted(fields,key=lambda x:str(x.get("name","")))).encode()).hexdigest()
def _selector(field):
    for key in ("name","id","autocomplete"):
        if field.get(key):
            value=str(field[key]).replace("\\","\\\\").replace('"','\\"')
            return key,f'[{key}="{value}"]'
    if field.get("label"):
        value=str(field["label"]).replace("\\","\\\\").replace('"','\\"')
        return "label",f'label="{value}"'
    return "field",str(field.get("canonical") or field.get("field") or "")
def build_execution_plan(db:Session,session:AutofillSession,page_fields:list[dict],mode="dry_run",page_url=None):
    if mode not in {"dry_run","armed"}: raise ValueError("Unsupported execution mode")
    pending=db.scalar(select(AutofillClarification.id).where(AutofillClarification.session_id==session.id,AutofillClarification.status=="pending"))
    if pending: raise ValueError("Clarification is pending; browser execution is paused")
    actions=db.scalars(select(AutofillAction).where(AutofillAction.session_id==session.id,AutofillAction.action=="fill").order_by(AutofillAction.id)).all()
    fields={str(x.get("name") or x.get("canonical")):x for x in page_fields}; commands=[]; errors=[]
    for action in actions:
        if action.status not in {"planned","approved"}: continue
        field=fields.get(action.field_name) or fields.get(action.canonical)
        if not field: errors.append({"field":action.field_name,"code":"FIELD_NOT_FOUND"}); continue
        strategy,selector=_selector(field)
        commands.append({"sequence":len(commands)+1,"action_id":action.id,"field":action.field_name,"selector_strategy":strategy,"selector":selector,"value":json.loads(action.proposed_value) if action.proposed_value else None})
    ex=BrowserExecution(session_id=session.id,state="planned" if not errors else "blocked",mode=mode,page_url=page_url,page_fingerprint=_fingerprint(page_fields),commands_json=_dump(commands),error_json=_dump(errors))
    db.add(ex); db.flush()
    for c in commands: db.add(BrowserExecutionStep(execution_id=ex.id,action_id=c["action_id"],sequence=c["sequence"],selector_strategy=c["selector_strategy"],selector=c["selector"],field_name=c["field"],value_json=_dump(c["value"])))
    db.commit(); db.refresh(ex); return ex
def execution_view(db,execution_id):
    ex=db.get(BrowserExecution,execution_id)
    if not ex: raise ValueError("Browser execution not found")
    return {"id":ex.id,"session_id":ex.session_id,"state":ex.state,"mode":ex.mode,"page_url":ex.page_url,"page_fingerprint":ex.page_fingerprint,"commands":json.loads(ex.commands_json or "[]"),"results":json.loads(ex.results_json or "[]"),"errors":json.loads(ex.error_json or "[]")}
def arm_execution(db,ex):
    if ex.state!="planned": raise ValueError("Only a planned execution can be armed")
    ex.mode="armed"; ex.state="armed"; db.commit(); db.refresh(ex); return ex
def record_result(db,ex,sequence,state,error=None):
    if ex.mode != "armed" or ex.state not in {"armed","running"}:
        raise ValueError("Execution is not armed")
    if state not in {"filled","failed","skipped"}: raise ValueError("Invalid step result")
    step=db.scalar(select(BrowserExecutionStep).where(BrowserExecutionStep.execution_id==ex.id,BrowserExecutionStep.sequence==sequence))
    if not step: raise ValueError("Execution step not found")
    if step.state in {"filled","failed","skipped"}:
        if step.state != state or step.error != error:
            raise ValueError("Execution step already recorded")
        return ex
    step.state=state; step.error=error
    steps=db.scalars(select(BrowserExecutionStep).where(BrowserExecutionStep.execution_id==ex.id).order_by(BrowserExecutionStep.sequence)).all()
    ex.results_json=_dump([{"sequence":s.sequence,"field":s.field_name,"state":s.state,"error":s.error} for s in steps])
    ex.state="failed" if any(s.state=="failed" for s in steps) else ("completed" if steps and all(s.state in {"filled","skipped"} for s in steps) else "running")
    db.commit(); db.refresh(ex); return ex

def resume_execution(db, ex):
    if ex.state not in {"armed","running","failed"}:
        raise ValueError("Only armed, running or failed executions can be resumed")
    steps=db.scalars(select(BrowserExecutionStep).where(BrowserExecutionStep.execution_id==ex.id).order_by(BrowserExecutionStep.sequence)).all()
    for s in steps:
        if s.state=="failed":
            s.state="planned"; s.error=None
    ex.mode="armed"; ex.state="armed"
    db.commit(); db.refresh(ex); return ex
