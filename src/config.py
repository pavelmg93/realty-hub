"""Application configuration loaded from environment variables."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables or .env file."""

    # Application Database (pgvector)
    app_db_host: str = "localhost"
    app_db_port: int = 5432
    app_db_name: str = "re_nhatrang"
    app_db_user: str = "re_nhatrang"
    app_db_password: str = "change_me_in_production"

    # Redis
    redis_host: str = "localhost"
    redis_port: int = 6379

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    @property
    def app_db_url(self) -> str:
        """Build the application database URL."""
        return (
            f"postgresql://{self.app_db_user}:{self.app_db_password}"
            f"@{self.app_db_host}:{self.app_db_port}/{self.app_db_name}"
        )

    @property
    def redis_url(self) -> str:
        """Build the Redis URL."""
        return f"redis://{self.redis_host}:{self.redis_port}/0"


def get_settings() -> Settings:
    """Create and return application settings."""
    return Settings()
