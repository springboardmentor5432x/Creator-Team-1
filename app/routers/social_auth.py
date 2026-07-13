"""
OAuth connect flow for social platforms.

Flow (matches the guide):
  1. Logged-in user hits GET /auth/{platform}/login  -> we return an auth_url
  2. Frontend redirects the browser to auth_url
  3. User logs into Google/Meta and grants permission
  4. Provider redirects the browser to GET /auth/{platform}/callback?code=...&state=...
  5. We exchange the code for an Access Token, fetch the account identity,
     and store a SocialAccount row linked to the user encoded in `state`.

Because step 4 is a plain browser redirect (no Authorization header), the
`state` parameter carries a signed user id — see services/oauth_state.py.
"""

import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from .. import models
from ..config import settings
from ..database import get_db
from ..dependencies import get_current_user
from ..models_social import SocialAccount, SocialPlatform
from ..services import meta_service, youtube_service
from ..services.oauth_state import BadSignature, SignatureExpired, create_state, verify_state

router = APIRouter(prefix="/auth", tags=["Social OAuth"])


def _decode_state_or_400(state: str) -> uuid.UUID:
    """Decodes the signed state and returns the user id as a UUID object
    (the DB columns are UUID-typed, so a raw string won't bind correctly)."""
    try:
        payload = verify_state(state)
        return uuid.UUID(payload["user_id"])
    except (BadSignature, SignatureExpired):
        raise HTTPException(status_code=400, detail="Invalid or expired OAuth state")
    except (KeyError, ValueError):
        raise HTTPException(status_code=400, detail="Malformed OAuth state")


# ---------- Google / YouTube ----------

@router.get("/google/login")
def google_login(current_user: models.User = Depends(get_current_user)):
    """Returns the Google consent URL. The frontend should redirect the
    browser to `auth_url` (this is not something you fetch via axios)."""
    state = create_state(str(current_user.id), "youtube")
    return {"auth_url": youtube_service.get_google_login_url(state)}


@router.get("/google/callback")
def google_callback(code: str = Query(...), state: str = Query(...), db: Session = Depends(get_db)):
    user_id = _decode_state_or_400(state)

    token_data = youtube_service.exchange_code_for_token(code)
    access_token = token_data["access_token"]
    refresh_token = token_data.get("refresh_token")
    expires_at = datetime.utcnow() + timedelta(seconds=token_data.get("expires_in", 3600))

    channel_info = youtube_service.get_channel_info(access_token)
    items = channel_info.get("items", [])
    if not items:
        raise HTTPException(status_code=400, detail="No YouTube channel found for this Google account")

    channel = items[0]
    channel_id = channel["id"]
    channel_title = channel["snippet"]["title"]

    account = (
        db.query(SocialAccount)
        .filter(SocialAccount.user_id == user_id, SocialAccount.platform == SocialPlatform.YOUTUBE)
        .first()
    )
    if account:
        account.platform_account_id = channel_id
        account.account_name = channel_title
        account.access_token = access_token
        # Google only returns refresh_token on first consent; keep the old one otherwise
        account.refresh_token = refresh_token or account.refresh_token
        account.token_expires_at = expires_at
        account.is_active = True
    else:
        db.add(
            SocialAccount(
                user_id=user_id,
                platform=SocialPlatform.YOUTUBE,
                platform_account_id=channel_id,
                account_name=channel_title,
                access_token=access_token,
                refresh_token=refresh_token,
                token_expires_at=expires_at,
            )
        )
    db.commit()

    return RedirectResponse(url=f"{settings.FRONTEND_URL}/dashboard/youtube?connected=true")


# ---------- Meta / Facebook / Instagram ----------

@router.get("/facebook/login")
def facebook_login(current_user: models.User = Depends(get_current_user)):
    state = create_state(str(current_user.id), "meta")
    return {"auth_url": meta_service.get_facebook_login_url(state)}


@router.get("/facebook/callback")
def facebook_callback(code: str = Query(...), state: str = Query(...), db: Session = Depends(get_db)):
    user_id = _decode_state_or_400(state)

    short_token_data = meta_service.exchange_code_for_token(code)
    long_token_data = meta_service.get_long_lived_token(short_token_data["access_token"])
    user_access_token = long_token_data["access_token"]
    expires_at = datetime.utcnow() + timedelta(seconds=long_token_data.get("expires_in", 5184000))

    pages = meta_service.get_user_pages(user_access_token)
    if not pages:
        raise HTTPException(status_code=400, detail="No Facebook Pages found for this account")

    # NOTE: connects the first Page returned. If a creator manages multiple
    # Pages, a real UI would let them pick one — this keeps the flow simple
    # for now and can be extended with a page-selection step later.
    page = pages[0]
    page_id = page["id"]
    page_name = page["name"]
    page_access_token = page["access_token"]

    fb_account = (
        db.query(SocialAccount)
        .filter(SocialAccount.user_id == user_id, SocialAccount.platform == SocialPlatform.FACEBOOK)
        .first()
    )
    if fb_account:
        fb_account.platform_account_id = page_id
        fb_account.account_name = page_name
        fb_account.access_token = user_access_token
        fb_account.page_access_token = page_access_token
        fb_account.token_expires_at = expires_at
        fb_account.is_active = True
    else:
        db.add(
            SocialAccount(
                user_id=user_id,
                platform=SocialPlatform.FACEBOOK,
                platform_account_id=page_id,
                account_name=page_name,
                access_token=user_access_token,
                page_access_token=page_access_token,
                token_expires_at=expires_at,
            )
        )

    # Instagram Professional account, if linked to this Page (guide step 8)
    ig_account_id = meta_service.get_instagram_business_account(page_id, page_access_token)
    if ig_account_id:
        ig_profile = meta_service.get_instagram_profile(ig_account_id, page_access_token)
        ig_account = (
            db.query(SocialAccount)
            .filter(SocialAccount.user_id == user_id, SocialAccount.platform == SocialPlatform.INSTAGRAM)
            .first()
        )
        if ig_account:
            ig_account.platform_account_id = ig_account_id
            ig_account.account_name = ig_profile.get("username")
            ig_account.access_token = user_access_token
            ig_account.page_access_token = page_access_token
            ig_account.linked_page_id = page_id
            ig_account.token_expires_at = expires_at
            ig_account.is_active = True
        else:
            db.add(
                SocialAccount(
                    user_id=user_id,
                    platform=SocialPlatform.INSTAGRAM,
                    platform_account_id=ig_account_id,
                    account_name=ig_profile.get("username"),
                    access_token=user_access_token,
                    page_access_token=page_access_token,
                    linked_page_id=page_id,
                    token_expires_at=expires_at,
                )
            )

    db.commit()
    return RedirectResponse(url=f"{settings.FRONTEND_URL}/dashboard/social?connected=true")


# ---------- Manage connected accounts ----------

@router.get("/accounts")
def list_connected_accounts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    accounts = db.query(SocialAccount).filter(SocialAccount.user_id == current_user.id).all()
    return [
        {
            "id": a.id,
            "platform": a.platform,
            "account_name": a.account_name,
            "connected_at": a.connected_at,
            "is_active": a.is_active,
        }
        for a in accounts
    ]


@router.delete("/accounts/{account_id}")
def disconnect_account(
    account_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    account = (
        db.query(SocialAccount)
        .filter(SocialAccount.id == account_id, SocialAccount.user_id == current_user.id)
        .first()
    )
    if not account:
        raise HTTPException(status_code=404, detail="Connected account not found")
    db.delete(account)
    db.commit()
    return {"detail": "Account disconnected"}
