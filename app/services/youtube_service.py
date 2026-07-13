"""
Google OAuth and YouTube Data API / YouTube Analytics API calls.
"""

from typing import List

import httpx

from ..config import settings

GOOGLE_OAUTH_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"
YOUTUBE_ANALYTICS_BASE = "https://youtubeanalytics.googleapis.com/v2/reports"

SCOPES = " ".join(
    [
        "https://www.googleapis.com/auth/youtube.readonly",
        "https://www.googleapis.com/auth/yt-analytics.readonly",
    ]
)


def get_google_login_url(state: str) -> str:
    return (
        f"{GOOGLE_OAUTH_AUTHORIZE_URL}"
        f"?client_id={settings.GOOGLE_CLIENT_ID}"
        f"&redirect_uri={settings.GOOGLE_REDIRECT_URI}"
        f"&response_type=code"
        f"&access_type=offline"   # required to receive a refresh_token
        f"&prompt=consent"        # forces refresh_token on repeat connects too
        f"&scope={SCOPES}"
        f"&state={state}"
    )


def exchange_code_for_token(code: str) -> dict:
    resp = httpx.post(
        GOOGLE_TOKEN_URL,
        data={
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        },
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()  # access_token, refresh_token, expires_in, ...


def refresh_access_token(refresh_token: str) -> dict:
    resp = httpx.post(
        GOOGLE_TOKEN_URL,
        data={
            "refresh_token": refresh_token,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "grant_type": "refresh_token",
        },
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()


def _auth_headers(access_token: str) -> dict:
    return {"Authorization": f"Bearer {access_token}"}


def get_channel_info(access_token: str) -> dict:
    resp = httpx.get(
        f"{YOUTUBE_API_BASE}/channels",
        params={"part": "snippet,statistics", "mine": "true"},
        headers=_auth_headers(access_token),
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()


def get_channel_videos(access_token: str, channel_id: str, max_results: int = 10) -> List[dict]:
    resp = httpx.get(
        f"{YOUTUBE_API_BASE}/search",
        params={
            "part": "snippet",
            "channelId": channel_id,
            "order": "date",
            "maxResults": max_results,
            "type": "video",
        },
        headers=_auth_headers(access_token),
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json().get("items", [])


def get_video_statistics(access_token: str, video_ids: List[str]) -> List[dict]:
    if not video_ids:
        return []
    resp = httpx.get(
        f"{YOUTUBE_API_BASE}/videos",
        params={"part": "statistics,snippet", "id": ",".join(video_ids)},
        headers=_auth_headers(access_token),
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json().get("items", [])


def get_video_comments(access_token: str, video_id: str, max_results: int = 20) -> List[dict]:
    resp = httpx.get(
        f"{YOUTUBE_API_BASE}/commentThreads",
        params={"part": "snippet", "videoId": video_id, "maxResults": max_results},
        headers=_auth_headers(access_token),
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json().get("items", [])


def get_video_watch_time(access_token: str, video_ids: List[str], start_date: str, end_date: str) -> dict:
    """Per-video watch time and average view duration via the YouTube
    Analytics API (not available through the Data API). Returns a dict
    keyed by video_id: {"estimated_minutes_watched": .., "average_view_duration": ..}.
    """
    if not video_ids:
        return {}

    resp = httpx.get(
        YOUTUBE_ANALYTICS_BASE,
        params={
            "ids": "channel==MINE",
            "startDate": start_date,
            "endDate": end_date,
            "metrics": "estimatedMinutesWatched,averageViewDuration",
            "dimensions": "video",
            "filters": f"video=={','.join(video_ids)}",
        },
        headers=_auth_headers(access_token),
        timeout=15,
    )
    resp.raise_for_status()
    data = resp.json()

    # rows look like: [[video_id, estimatedMinutesWatched, averageViewDuration], ...]
    # column order is given by columnHeaders, so read it defensively rather
    # than assuming positions.
    headers_list = [h["name"] for h in data.get("columnHeaders", [])]
    result = {}
    for row in data.get("rows", []):
        row_dict = dict(zip(headers_list, row))
        vid = row_dict.get("video")
        if vid:
            result[vid] = {
                "estimated_minutes_watched": row_dict.get("estimatedMinutesWatched", 0),
                "average_view_duration": row_dict.get("averageViewDuration", 0),
            }
    return result


def get_channel_analytics(access_token: str, start_date: str, end_date: str) -> dict:
    """Channel-wide daily trend: views, watch time, average view duration."""
    resp = httpx.get(
        YOUTUBE_ANALYTICS_BASE,
        params={
            "ids": "channel==MINE",
            "startDate": start_date,
            "endDate": end_date,
            "metrics": "views,estimatedMinutesWatched,averageViewDuration",
            "dimensions": "day",
        },
        headers=_auth_headers(access_token),
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()
