from cryptography.fernet import Fernet

from app.core.config import Settings
from app.core.security import decrypt_credentials, encrypt_credentials
from app.integrations.amazon.auth import AmazonLwaTokenProvider
from app.integrations.flipkart.auth import FlipkartAccessTokenProvider


class FakeResponse:
    status_code = 200
    is_error = False

    def json(self):
        return {"access_token": "token", "expires_in": 3600}


class FakeHttp:
    def __init__(self):
        self.calls = []

    def post(self, url, data):
        self.calls.append((url, data))
        return FakeResponse()

    def get(self, url, params, auth):
        self.calls.append((url, params, auth))
        return FakeResponse()


def test_credentials_round_trip(monkeypatch):
    key = Fernet.generate_key().decode()
    settings = Settings(credentials_encryption_key=key)
    monkeypatch.setattr("app.core.security.get_settings", lambda: settings)
    payload = {"client_id": "account-client", "refresh_token": "account-refresh"}
    assert decrypt_credentials(encrypt_credentials(payload)) == payload


def test_amazon_provider_prefers_account_credentials():
    settings = Settings(amazon_lwa_client_id="global-client", amazon_lwa_client_secret="global-secret", amazon_lwa_refresh_token="global-refresh")
    http = FakeHttp()
    provider = AmazonLwaTokenProvider(settings, http, {"client_id": "account-client", "client_secret": "account-secret", "refresh_token": "account-refresh"})
    assert provider.get_access_token() == "token"
    assert http.calls[0][1]["client_id"] == "account-client"
    assert http.calls[0][1]["refresh_token"] == "account-refresh"


def test_flipkart_provider_prefers_account_credentials():
    settings = Settings(flipkart_app_id="global-id", flipkart_app_secret="global-secret")
    http = FakeHttp()
    provider = FlipkartAccessTokenProvider(settings, http, {"app_id": "account-id", "app_secret": "account-secret"})
    assert provider.get_access_token() == "token"
    assert http.calls[0][2] == ("account-id", "account-secret")
