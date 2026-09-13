from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Personal AI Seller Hub"
    app_version: str = "0.1.0"
    environment: str = "development"
    database_url: str = "sqlite:///./seller_hub.db"
    secret_key: str = "change-me-in-env"
    credentials_encryption_key: str | None = None
    allowed_origins: str = "http://localhost:5173"
    allowed_hosts: str = "localhost,127.0.0.1,testserver"
    rate_limit_per_minute: int = 120
    redis_url: str | None = None
    session_ttl_hours: int = 24

    worker_poll_interval_seconds: float = 2.0
    worker_batch_size: int = 5
    worker_max_attempts: int = 3
    worker_retry_backoff_seconds: int = 10
    worker_stale_after_seconds: int = 1800
    worker_concurrency: int = 1

    backup_enabled: bool = False
    backup_dir: str = "./backups"
    backup_retention_days: int = 14

    amazon_sp_api_base_url: str = "https://sellingpartnerapi-eu.amazon.com"
    amazon_sp_api_region: str = "eu-west-1"
    amazon_sp_api_marketplace_id: str = "A21TJRUUN4KGV"
    amazon_sp_api_role_arn: str | None = None
    amazon_lwa_token_url: str = "https://api.amazon.com/auth/o2/token"
    amazon_lwa_client_id: str | None = None
    amazon_lwa_client_secret: str | None = None
    amazon_lwa_refresh_token: str | None = None
    amazon_aws_access_key_id: str | None = None
    amazon_aws_secret_access_key: str | None = None
    amazon_aws_session_token: str | None = None
    amazon_request_timeout_seconds: float = 30.0
    amazon_max_retries: int = 3

    flipkart_api_base_url: str = "https://api.flipkart.net"
    flipkart_app_id: str | None = None
    flipkart_app_secret: str | None = None
    flipkart_request_timeout_seconds: float = 30.0
    flipkart_max_retries: int = 3

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
