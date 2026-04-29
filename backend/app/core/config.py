from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Path to the GeoJSON data file (relative to repo root)
    DATA_FILE: Path = Path(__file__).parents[3] / "my-app" / "public" / "data.json"

    # Comma-separated origins allowed for CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
