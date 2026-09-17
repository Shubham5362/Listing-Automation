from __future__ import annotations
import json
from collections import Counter
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from app.models.learning import LearningEvent, SellerPreference, LearningRule, LearningOutcome

FEEDBACK_WEIGHT = {"approved": 1.0, "edited": 0.8, "rejected": -1.0, "incorrect": -1.0, "ignored": -0.1}

class LearningEngine:
    def __init__(self, db: Session, seller_id: int):
        self.db, self.seller_id = db, seller_id

    def record_feedback(self, source: str, entity_type: str, entity_id: str | None, action: str, feedback: str, confidence: float = .5, correction: dict | None = None, metadata: dict | None = None):
        event = LearningEvent(seller_account_id=self.seller_id, source=source, entity_type=entity_type, entity_id=entity_id, action=action, feedback=feedback, confidence=max(0,min(1,confidence)), correction_json=json.dumps(correction) if correction else None, metadata_json=json.dumps(metadata) if metadata else None)
        self.db.add(event); self.db.flush()
        self._learn_preference(event)
        return event

    def _learn_preference(self, event: LearningEvent):
        if not event.correction_json and event.feedback not in {"approved", "edited"}:
            return
        key = f"{event.source}.{event.action}"
        value = event.correction_json or "approved"
        pref = self.db.scalar(select(SellerPreference).where(SellerPreference.seller_account_id==self.seller_id, SellerPreference.key==key))
        if not pref:
            pref = SellerPreference(seller_account_id=self.seller_id,key=key,value=value,scope=event.entity_type,confidence=event.confidence,evidence_count=1,status="candidate")
            self.db.add(pref); self.db.flush(); return
        pref.evidence_count += 1
        pref.confidence = min(1.0, (pref.confidence*(pref.evidence_count-1)+event.confidence)/pref.evidence_count)
        if event.feedback == "edited": pref.value = value
        if pref.evidence_count >= 3 and pref.confidence >= .75: pref.status = "confirmed"

    def record_outcome(self, event_id: int, outcome: str, success: bool):
        event = self.db.scalar(select(LearningEvent).where(LearningEvent.id==event_id, LearningEvent.seller_account_id==self.seller_id))
        if not event: return None
        row = LearningOutcome(learning_event_id=event_id,seller_account_id=self.seller_id,outcome=outcome,success=success)
        self.db.add(row); self.db.flush(); return row

    def calibrated_confidence(self, source: str, action: str, raw: float) -> float:
        rows = self.db.execute(select(LearningEvent.feedback).where(LearningEvent.seller_account_id==self.seller_id, LearningEvent.source==source, LearningEvent.action==action)).all()
        if not rows: return max(0,min(1,raw))
        weights = [FEEDBACK_WEIGHT.get(str(r[0]),0) for r in rows]
        accuracy = (sum(w for w in weights if w > 0) / max(1, sum(abs(w) for w in weights)))
        return round(max(0,min(1, raw*.65 + accuracy*.35)), 4)

    def overview(self):
        events = self.db.scalar(select(func.count(LearningEvent.id)).where(LearningEvent.seller_account_id==self.seller_id)) or 0
        confirmed = self.db.scalar(select(func.count(SellerPreference.id)).where(SellerPreference.seller_account_id==self.seller_id,SellerPreference.status=="confirmed",SellerPreference.enabled.is_(True))) or 0
        candidates = self.db.scalar(select(func.count(SellerPreference.id)).where(SellerPreference.seller_account_id==self.seller_id,SellerPreference.status=="candidate",SellerPreference.enabled.is_(True))) or 0
        outcomes = self.db.scalar(select(func.count(LearningOutcome.id)).where(LearningOutcome.seller_account_id==self.seller_id)) or 0
        successful = self.db.scalar(select(func.count(LearningOutcome.id)).where(LearningOutcome.seller_account_id==self.seller_id,LearningOutcome.success.is_(True))) or 0
        return {"events":events,"confirmed_preferences":confirmed,"candidate_preferences":candidates,"outcomes":outcomes,"success_rate":round(successful/outcomes,4) if outcomes else None}

    def list_preferences(self, status: str | None = None):
        q=select(SellerPreference).where(SellerPreference.seller_account_id==self.seller_id)
        if status: q=q.where(SellerPreference.status==status)
        return list(self.db.scalars(q.order_by(SellerPreference.updated_at.desc())).all())

    def set_preference_status(self, preference_id: int, status: str):
        pref=self.db.scalar(select(SellerPreference).where(SellerPreference.id==preference_id,SellerPreference.seller_account_id==self.seller_id))
        if not pref: return None
        pref.status=status; pref.enabled=status not in {"disabled","rejected"}; self.db.commit(); return pref
