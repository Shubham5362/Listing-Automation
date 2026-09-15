from app.models.learning import LearningEvent, SellerPreference
from app.services.learning_engine import LearningEngine


def test_feedback_promotes_repeated_preference(db_session):
    engine = LearningEngine(db_session, 1)
    for _ in range(3):
        engine.record_feedback("listing_intelligence", "product", "1", "title", "edited", .9, {"style": "concise"})
    db_session.commit()
    prefs = engine.list_preferences()
    assert len(prefs) == 1
    assert prefs[0].status == "confirmed"
    assert prefs[0].evidence_count == 3


def test_seller_isolation_for_outcome(db_session):
    event = LearningEvent(seller_account_id=2, source="x", entity_type="product", action="y", feedback="approved", confidence=.9)
    db_session.add(event); db_session.commit()
    assert LearningEngine(db_session, 1).record_outcome(event.id, "success", True) is None


def test_confidence_calibration_uses_feedback(db_session):
    engine = LearningEngine(db_session, 1)
    engine.record_feedback("vision", "image", "1", "match", "approved", .9)
    engine.record_feedback("vision", "image", "2", "match", "rejected", .9)
    db_session.commit()
    calibrated = engine.calibrated_confidence("vision", "match", .9)
    assert 0 <= calibrated <= 1
    assert calibrated < .9
