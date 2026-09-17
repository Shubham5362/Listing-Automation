from cryptography.fernet import Fernet

from app.core.config import Settings
from app.core.security import decrypt_credentials
from app.services.personal_marketplace import ensure_personal_marketplaces


def test_personal_marketplace_bootstrap_is_idempotent(db_session, monkeypatch):
    key = Fernet.generate_key().decode()
    settings = Settings(
        credentials_encryption_key=key,
        personal_seller_name="My Business",
        amazon_seller_id="SELLER123",
        amazon_lwa_client_id="client",
        amazon_lwa_client_secret="secret",
        amazon_lwa_refresh_token="refresh",
        amazon_aws_access_key_id="access",
        amazon_aws_secret_access_key="aws-secret",
        flipkart_seller_id="FK123",
        flipkart_app_id="fk-app",
        flipkart_app_secret="fk-secret",
    )
    monkeypatch.setattr("app.core.security.get_settings", lambda: settings)

    first = ensure_personal_marketplaces(db_session, settings)
    second = ensure_personal_marketplaces(db_session, settings)

    assert [account.marketplace for account in first] == ["amazon", "flipkart"]
    assert [account.id for account in first] == [account.id for account in second]
    assert first[0].credentials_ref
    assert decrypt_credentials(first[0].credentials_ref)["refresh_token"] == "refresh"
    assert second[0].external_account_id == "SELLER123"
