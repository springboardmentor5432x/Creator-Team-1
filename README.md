# CreatorIQ — Module 1: User Management

FastAPI backend implementing the User Management Module for the CreatorIQ
analytics dashboard: registration/login, role-based access control (RBAC),
creator/agency profile management, and account settings.

## Stack
- **FastAPI** — REST API framework
- **PostgreSQL + SQLAlchemy** — relational storage for users/profiles
- **JWT (python-jose)** — stateless auth tokens
- **passlib + bcrypt** — password hashing

## Roles implemented
- `creator` — individual content creators
- `agency` — influencer/talent agencies managing multiple creators
- `marketing_team` — marketing team members
- `administrator` — platform administrators

## Project structure
```
app/
  main.py            FastAPI app, CORS, router registration
  database.py        SQLAlchemy engine/session (PostgreSQL)
  models.py           User, CreatorProfile, AgencyProfile ORM models
  schemas.py           Pydantic request/response schemas
  auth.py               Password hashing + JWT create/verify
  crud.py                 DB helper functions
  dependencies.py           get_current_user + require_role (RBAC)
  routers/
    auth.py         POST /api/auth/register, /api/auth/login
    users.py        Account settings + admin user management
    profiles.py      Creator/agency profile CRUD
```

## Setup

1. Create a PostgreSQL database, e.g.:
   ```sql
   CREATE DATABASE creatoriq_db;
   CREATE USER creatoriq_user WITH PASSWORD 'creatoriq_pass';
   GRANT ALL PRIVILEGES ON DATABASE creatoriq_db TO creatoriq_user;
   ```

2. Copy `.env.example` to `.env` and fill in real values (especially
   `JWT_SECRET_KEY` — generate one with `openssl rand -hex 32`).

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the server:
   ```bash
   uvicorn app.main:app --reload
   ```
   Tables are auto-created on startup via `Base.metadata.create_all`. For a
   real deployment, swap this for **Alembic** migrations.

5. Interactive API docs: `http://localhost:8000/docs`

## Key endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register as creator/agency/marketing_team/administrator |
| POST | `/api/auth/login` | Public | Login (OAuth2 form: `username`=email, `password`) → JWT |
| GET | `/api/users/me` | Authenticated | View own account |
| PUT | `/api/users/me` | Authenticated | Update name/email |
| PUT | `/api/users/me/password` | Authenticated | Change password |
| GET | `/api/users` | Administrator | List all users |
| PUT | `/api/users/{id}/status` | Administrator | Enable/disable an account |
| GET/PUT | `/api/profiles/creator/me` | Creator | View/update creator profile |
| GET/PUT | `/api/profiles/agency/me` | Agency | View/update agency profile |
| GET | `/api/profiles/creator/{user_id}` | Agency/Marketing/Admin | View a creator's profile |

## RBAC design

`dependencies.require_role(*roles)` is a dependency factory used on routes,
e.g.:
```python
@router.get("/api/users")
def list_all_users(_admin = Depends(require_role(UserRole.ADMINISTRATOR))):
    ...
```
This keeps authorization logic declarative and out of business logic —
add or change allowed roles per-route without touching the handler body.

## Social Media Integration (YouTube, Instagram, Facebook)

Built on top of Module 1's auth system. Since Instagram and Facebook both
belong to Meta, they share one Meta Developer App, one OAuth flow, and one
Access Token mechanism (Meta only diverges after auth, in which Graph API
endpoints get called) — YouTube is a separate Google OAuth flow.

```
app/
  config.py                Google + Meta OAuth credentials (from .env)
  models_social.py          SocialAccount, SocialSnapshot ORM models
  services/
    oauth_state.py         Signs the OAuth "state" param with the user id
    meta_service.py         Facebook/Instagram Graph API calls
    youtube_service.py       YouTube Data API + Analytics API calls
  routers/
    social_auth.py          /auth/{google,facebook}/login + /callback, account management
    dashboards.py             /youtube/dashboard, /instagram/dashboard, /facebook/dashboard
```

### Why the "state" parameter matters here

The OAuth callback (`/auth/google/callback`, `/auth/facebook/callback`) is a
plain browser redirect from Google/Meta — it has no `Authorization` header,
so we can't use the normal JWT-based `get_current_user` dependency there.
Instead, `/auth/{platform}/login` (which *does* require login) signs the
current user's id into the `state` parameter before generating the OAuth
URL. The callback verifies that signature and decodes the user id back out.
This is also the state parameter's original purpose in the OAuth2 spec:
CSRF protection.

### Setup

1. **Google Cloud Console** → create an OAuth 2.0 Client (Web application) →
   add `http://localhost:8000/auth/google/callback` as an authorized
   redirect URI → copy the Client ID/Secret into `.env`.
2. **Meta Developer Portal** → create a Business app → add the *Facebook
   Login* and *Instagram Graph API* products → set the redirect URI to
   `http://localhost:8000/auth/facebook/callback` → copy the App ID/Secret
   into `.env`.
3. Instagram accounts must be **Professional (Business/Creator)** and linked
   to a Facebook Page — personal IG accounts have no Insights API access.

### Flow

```
User clicks "Connect YouTube" (already logged into CreatorIQ)
  → GET /auth/google/login          (returns Google's consent URL)
  → browser redirects to Google
  → user logs in + grants permission
  → Google redirects to /auth/google/callback?code=...&state=...
  → backend exchanges code for Access Token, fetches channel info,
    saves a SocialAccount row
  → redirects browser back to the React frontend
```

Once connected, `GET /youtube/dashboard` (or `/instagram/dashboard`,
`/facebook/dashboard`) reads the stored token, calls the relevant API(s),
combines the response into one clean payload, caches a snapshot for later
growth-chart/comparison features, and returns it to React.

### Endpoints added

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/auth/google/login` | Authenticated | Get the Google OAuth consent URL |
| GET | `/auth/google/callback` | Public (state-verified) | Google redirects here after consent |
| GET | `/auth/facebook/login` | Authenticated | Get the Meta OAuth consent URL |
| GET | `/auth/facebook/callback` | Public (state-verified) | Meta redirects here after consent |
| GET | `/auth/accounts` | Authenticated | List the user's connected platforms |
| DELETE | `/auth/accounts/{id}` | Authenticated | Disconnect a platform |
| GET | `/youtube/analytics` | Authenticated | Channel-wide watch time / views trend (YouTube Analytics API) |
| GET | `/youtube/dashboard` | Authenticated | Channel stats + recent video performance |
| GET | `/instagram/dashboard` | Authenticated | Profile + recent post/reel insights |
| GET | `/facebook/dashboard` | Authenticated | Page details + posts + page insights |

### Production notes

- Access/refresh tokens are stored as plaintext `Text` columns for now —
  for a real deployment, encrypt them at rest (e.g. with `cryptography`'s
  Fernet) before saving to the DB.
- YouTube tokens auto-refresh using the stored `refresh_token` when they're
  within 2 minutes of expiring (`_refresh_youtube_token_if_needed`). Meta's
  long-lived tokens last ~60 days and currently require a manual reconnect
  after expiry — a refresh job could be added later.
- Facebook OAuth currently connects the **first** Page returned by
  `/me/accounts`. If a creator manages multiple Pages, add a page-picker
  step in the callback before saving.
- This was tested end-to-end with mocked API responses (login → callback →
  account saved → dashboard fetch → disconnect, plus a tampered-state
  rejection test) since it needs real Google/Meta app credentials to hit
  live APIs.

## Module 2: Content Analytics

Normalizes videos/posts from every connected platform into one shared
format, so "compare a YouTube video against an Instagram reel" is a single
query instead of platform-specific code everywhere.

```
app/
  models_content.py              ContentItem, ContentMetricSnapshot
  services/content_sync.py        Pulls content + metrics from each platform, stores them
  routers/content_analytics.py     All 6 required features (below)
```

### How it fits together

```
POST /content/sync
  → reads each connected SocialAccount
  → calls youtube_service / meta_service to fetch videos/posts
  → for each item: upserts a ContentItem row, inserts a new
    ContentMetricSnapshot row (a new row every sync, not an overwrite —
    that history is what powers "Performance trends")
```

### The 6 features

| # | Feature | Endpoint | What it does |
|---|---|---|---|
| i | Track content performance | `GET /content/performance` | Every synced video/post with its latest metrics |
| ii | Engagement monitoring | `GET /content/engagement` | Totals + per-platform averages, overall engagement rate |
| iii | Content comparison dashboard | `GET /content/compare?content_ids=id1,id2` | Side-by-side metrics for chosen items |
| iv | Top-performing content reports | `GET /content/top-performing?metric=views&limit=5` | Ranked list by any metric |
| v | Reach analysis | `GET /content/reach` | Total reach, reach by platform, top-reach content |
| vi | Performance trends | `GET /content/trends?metric=engagement_rate&days=30` | Time series — account-wide or for one content item |

### Metrics tracked

`views, likes, comments, shares, saves, watch_time_seconds, reach, impressions, engagement_rate`

**Engagement Rate formula:** `(likes + comments + shares + saves) / (reach or views) × 100`

### Known platform limitations (real, not bugs)

- **YouTube** doesn't expose `reach`, `shares`, or `saves` via any public
  API (Instagram/Facebook Insights are the only sources for those).
  Engagement rate falls back to using `views` as the denominator for
  YouTube content.
- **Facebook** post-level `reach`/`impressions` depend on Meta's Insights
  API returning data for that specific post — very old posts or certain
  post types sometimes don't have insights available, in which case those
  two fields stay `0` for that post (everything else — likes, comments,
  shares — always comes through).

### Tested

Ran a full mocked sync → performance → engagement → compare → top-performing
→ reach → trends chain, a YouTube watch-time sync + `/youtube/analytics`
trend check, a Facebook post-metrics verification (reactions/comments/
shares/reach/impressions all populated correctly, engagement rate
hand-verified), a CSV export check, and a bad-metric validation check
(422). All engagement rate and aggregation math was verified against
hand-calculated expected values.

## Deployment

### Docker

```bash
docker compose up --build
```

This starts two containers:
- `db` — PostgreSQL 16, with a persistent volume
- `app` — the FastAPI backend, connected to `db` automatically

The app will be live at `http://localhost:8000/docs`. Copy `.env.example`
to `.env` first and fill in your real OAuth credentials — `docker-compose.yml`
overrides `DATABASE_URL` to point at the `db` container, so you don't need
to change that one value, but everything else (JWT secret, Google/Meta
credentials) still comes from `.env`.

### CSV export

`GET /content/export/csv` (optionally `?platform=youtube`) downloads a CSV
of every synced content item with its latest metrics — useful for handing
a report to a brand/agency outside the dashboard itself.

## Notes / next steps for your internship writeup
- Passwords are hashed with bcrypt (never stored in plaintext).
- JWTs carry `sub` (user id) and `role`, checked on every protected request.
- Auto-provisioning: registering as `creator` or `agency` auto-creates the
  matching profile row, so the frontend doesn't need a second "complete
  profile" API call before the account is usable.
- This module was tested end-to-end (register → login → protected routes →
  RBAC rejection for unauthorized roles) before delivery.
- Ready to wire into your existing FastAPI/React CreatorIQ project — just
  merge the `app/` folder into your codebase, or mount its routers into
  your existing `main.py`.
