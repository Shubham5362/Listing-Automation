from __future__ import annotations

import hashlib
from urllib.parse import urlparse

from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest
from botocore.credentials import Credentials

from app.core.config import Settings
from app.integrations.base import MarketplaceAuthenticationError


def sign_request(
    settings: Settings,
    *,
    method: str,
    url: str,
    headers: dict[str, str],
    body: bytes = b"",
) -> dict[str, str]:
    if not settings.amazon_aws_access_key_id or not settings.amazon_aws_secret_access_key:
        raise MarketplaceAuthenticationError("Amazon AWS signing credentials are not configured")
    parsed = urlparse(url)
    credentials = Credentials(
        settings.amazon_aws_access_key_id,
        settings.amazon_aws_secret_access_key,
        settings.amazon_aws_session_token,
    )
    request = AWSRequest(
        method=method,
        url=url,
        data=body,
        headers={**headers, "host": parsed.netloc, "x-amz-content-sha256": hashlib.sha256(body).hexdigest()},
    )
    SigV4Auth(credentials, "execute-api", settings.amazon_sp_api_region).add_auth(request)
    return dict(request.headers.items())
