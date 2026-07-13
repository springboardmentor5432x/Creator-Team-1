"""
The OAuth 'state' parameter round-trips through Google/Meta's login pages and
back to our callback. Since the callback is a plain browser redirect (no
Authorization header), we can't rely on a Bearer token to know which user is
connecting an account. Instead we sign the user id + platform into the state
value here, and verify+decode it in the callback.

This also serves as CSRF protection, which is the state parameter's original
purpose in the OAuth2 spec.
"""

from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from ..config import settings

_serializer = URLSafeTimedSerializer(settings.OAUTH_STATE_SECRET)


def create_state(user_id: str, platform: str) -> str:
    return _serializer.dumps({"user_id": user_id, "platform": platform})


def verify_state(state: str, max_age_seconds: int = 600) -> dict:
    """Raises BadSignature/SignatureExpired if the state is invalid or older
    than max_age_seconds (default 10 minutes — plenty for a login flow)."""
    return _serializer.loads(state, max_age=max_age_seconds)


__all__ = ["create_state", "verify_state", "BadSignature", "SignatureExpired"]
