from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Blancboard API"
    API_V1_STR: str = "/api/v1"

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"

    # Short-lived access token (15 min is common)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15

    # Refresh token (30 days is common)
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    DATABASE_URL: str

    class Config:
        env_file = ".env"


settings = Settings()
