from app.services.autonomous_command_center import AutonomousCommandCenter

def test_low_confidence_requires_approval(db_session):
    row = AutonomousCommandCenter(db_session, 1).propose("listing_update", .70, "low")
    assert row.approval_required is True

def test_high_risk_requires_approval(db_session):
    row = AutonomousCommandCenter(db_session, 1).propose("price_change", .99, "high")
    assert row.approval_required is True

def test_seller_isolation(db_session):
    row = AutonomousCommandCenter(db_session, 2).propose("safe_fix", .99, "low")
    assert AutonomousCommandCenter(db_session, 1).approve(row.id) is None

def test_verification_records_failure(db_session):
    row = AutonomousCommandCenter(db_session, 1).propose("safe_fix", .99, "low")
    result = AutonomousCommandCenter(db_session, 1).verify(row.id, False)
    assert result.status == "failed"
    assert result.verification_status == "failed"
