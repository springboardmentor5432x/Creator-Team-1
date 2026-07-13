import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
    GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")

    FACEBOOK_APP_ID = os.getenv("FACEBOOK_APP_ID")
    FACEBOOK_APP_SECRET = os.getenv("FACEBOOK_APP_SECRET")
    FACEBOOK_REDIRECT_URI = os.getenv("FACEBOOK_REDIRECT_URI")

    FRONTEND_URL = os.getenv("FRONTEND_URL")

    OAUTH_STATE_SECRET = os.getenv("OAUTH_STATE_SECRET")


settings = Settings()