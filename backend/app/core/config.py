import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "R2M API"
    API_V1_STR: str = "/api"

    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", "postgresql://postgres:postgres@db:5432/r2m"
    )

    JWT_SECRET_KEY: str = os.getenv(
        "JWT_SECRET_KEY", "r2m_super_secret_jwt_key_change_in_production_2026_sahc"
    )
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
    )
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

    INITIAL_ADMIN_EMAIL: str = os.getenv("INITIAL_ADMIN_EMAIL", "admin@route2marketsolutions.com")
    INITIAL_ADMIN_PASSWORD: str = os.getenv(
        "INITIAL_ADMIN_PASSWORD", "Admin@R2M!"
    )
    INITIAL_ADMIN_USERNAME: str = os.getenv("INITIAL_ADMIN_USERNAME", "admin")

    # Email / SMTP configuration
    SMTP_HOST: str = os.getenv("SMTP_HOST", "").strip("'\"")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "").strip("'\"")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "").strip("'\"")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "no-reply@sahealthcare.co.za").strip("'\"")
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "SA Healthcare").strip("'\"")
    SMTP_TLS: bool = os.getenv("SMTP_TLS", "true").lower() in ("true", "1", "yes")
    SMTP_SSL: bool = os.getenv("SMTP_SSL", "false").lower() in ("true", "1", "yes")

    # Frontend URL for links in email
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

    # Storage configuration (local vs cloud/S3)
    STORAGE_BACKEND: str = os.getenv("STORAGE_BACKEND", "local")
    MEDIA_DIR: str = os.getenv(
        "MEDIA_DIR",
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "media"),
    )
    S3_BUCKET_NAME: str = os.getenv("S3_BUCKET_NAME", "")
    S3_ACCESS_KEY: str = os.getenv("S3_ACCESS_KEY", "")
    S3_SECRET_KEY: str = os.getenv("S3_SECRET_KEY", "")
    S3_REGION: str = os.getenv("S3_REGION", "us-east-1")
    S3_ENDPOINT_URL: str = os.getenv("S3_ENDPOINT_URL", "")
    S3_CUSTOM_DOMAIN: str = os.getenv("S3_CUSTOM_DOMAIN", "")

    model_config = SettingsConfigDict(case_sensitive=True)


settings = Settings()
