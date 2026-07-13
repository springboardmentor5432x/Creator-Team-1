"""
Meta (Facebook + Instagram) OAuth and Graph API calls.

Both platforms share one Meta Developer App, one OAuth flow, one App ID/Secret,
and one Access Token mechanism. Facebook data is fetched with the Page Access
Token directly; Instagram data requires first locating the Instagram Business
Account linked to a Facebook Page, then using that same Page Access Token.
"""

from typing import Optional

import httpx

from ..config import settings

GRAPH_API_VERSION = "v19.0"
GRAPH_BASE = f"https://graph.facebook.com/{GRAPH_API_VERSION}"

# Scopes needed for Page + Instagram Business analytics
SCOPES = ",".join(
    [
        "pages_show_list",
        "pages_read_engagement",
        "pages_read_user_content",
        "instagram_basic",
        "instagram_manage_insights",
    ]
)


def get_facebook_login_url(state: str) -> str:
    return (
        f"https://www.facebook.com/{GRAPH_API_VERSION}/dialog/oauth"
        f"?client_id={settings.FACEBOOK_APP_ID}"
        f"&redirect_uri={settings.FACEBOOK_REDIRECT_URI}"
        f"&state={state}"
        f"&scope={SCOPES}"
    )


def exchange_code_for_token(code: str) -> dict:
    """Step 12 in the guide: exchange the Authorization Code for a
    short-lived Access Token."""
    resp = httpx.get(
        f"{GRAPH_BASE}/oauth/access_token",
        params={
            "client_id": settings.FACEBOOK_APP_ID,
            "client_secret": settings.FACEBOOK_APP_SECRET,
            "redirect_uri": settings.FACEBOOK_REDIRECT_URI,
            "code": code,
        },
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()


def get_long_lived_token(short_lived_token: str) -> dict:
    """Short-lived user tokens expire in ~1-2 hours. Exchange for a
    long-lived token (~60 days) so we don't need to re-auth constantly."""
    resp = httpx.get(
        f"{GRAPH_BASE}/oauth/access_token",
        params={
            "grant_type": "fb_exchange_token",
            "client_id": settings.FACEBOOK_APP_ID,
            "client_secret": settings.FACEBOOK_APP_SECRET,
            "fb_exchange_token": short_lived_token,
        },
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()


def get_user_pages(access_token: str) -> list[dict]:
    """Returns Facebook Pages managed by the user, each including its own
    Page Access Token — required for all subsequent Page/Instagram calls."""
    resp = httpx.get(
        f"{GRAPH_BASE}/me/accounts",
        params={"access_token": access_token},
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json().get("data", [])


def get_instagram_business_account(page_id: str, page_access_token: str) -> Optional[str]:
    resp = httpx.get(
        f"{GRAPH_BASE}/{page_id}",
        params={"fields": "instagram_business_account", "access_token": page_access_token},
        timeout=15,
    )
    resp.raise_for_status()
    ig_account = resp.json().get("instagram_business_account")
    return ig_account["id"] if ig_account else None


def get_instagram_profile(ig_account_id: str, access_token: str) -> dict:
    resp = httpx.get(
        f"{GRAPH_BASE}/{ig_account_id}",
        params={
            "fields": "username,followers_count,media_count,profile_picture_url",
            "access_token": access_token,
        },
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()


def get_instagram_media(ig_account_id: str, access_token: str, limit: int = 25) -> list[dict]:
    resp = httpx.get(
        f"{GRAPH_BASE}/{ig_account_id}/media",
        params={
            "fields": "id,caption,media_type,media_url,thumbnail_url,timestamp,permalink",
            "limit": limit,
            "access_token": access_token,
        },
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json().get("data", [])


def get_media_insights(media_id: str, access_token: str) -> dict:
    resp = httpx.get(
        f"{GRAPH_BASE}/{media_id}/insights",
        params={
            "metric": "reach,impressions,likes,comments,saved,shares",
            "access_token": access_token,
        },
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()


def get_facebook_page_details(page_id: str, page_access_token: str) -> dict:
    resp = httpx.get(
        f"{GRAPH_BASE}/{page_id}",
        params={"fields": "name,followers_count,fan_count", "access_token": page_access_token},
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()


def get_facebook_posts(page_id: str, page_access_token: str, limit: int = 25) -> list[dict]:
    resp = httpx.get(
        f"{GRAPH_BASE}/{page_id}/posts",
        params={
            "fields": (
                "id,message,created_time,full_picture,permalink_url,"
                "reactions.summary(true),comments.summary(true),shares"
            ),
            "limit": limit,
            "access_token": page_access_token,
        },
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json().get("data", [])


def get_post_insights(post_id: str, page_access_token: str) -> dict:
    """Reach/impressions aren't in the /posts fields above — they need a
    separate call to the post's own /insights edge."""
    resp = httpx.get(
        f"{GRAPH_BASE}/{post_id}/insights",
        params={
            "metric": "post_impressions,post_impressions_unique",
            "access_token": page_access_token,
        },
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()


def get_facebook_page_insights(page_id: str, page_access_token: str) -> dict:
    resp = httpx.get(
        f"{GRAPH_BASE}/{page_id}/insights",
        params={
            "metric": "page_impressions,page_engaged_users,page_fans",
            "access_token": page_access_token,
        },
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()
