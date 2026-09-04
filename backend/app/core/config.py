from pydantic import field_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    secret_key: str
    access_token_expire_minutes: int = 60
    allowed_origins: str = "http://localhost:5173"
    frontend_url: str = "http://localhost:5173"

    @field_validator("database_url")
    @classmethod
    def _normalize_pg_scheme(cls, value: str) -> str:
        # Render/Heroku-style hosts hand out `postgres://`, which SQLAlchemy 2 rejects.
        if value.startswith("postgres://"):
            return "postgresql://" + value[len("postgres://") :]
        return value

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",")]

settings = Settings() # type: ignore[call-arg]
