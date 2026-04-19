"""Runtime settings loaded from environment + `.env`.

Single source of truth for the backend's configurable knobs. Currently just
`data_root` — the user's filesystem root for captured items. Later stories
add `llm_provider`, sensitivity defaults, shared-shelf paths, etc.
"""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration.

    Env vars are prefixed `LATESTNEWS_` (e.g. `LATESTNEWS_DATA_ROOT`).
    `.env` in the working directory is read if present.
    """

    model_config = SettingsConfigDict(
        env_prefix="LATESTNEWS_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    data_root: Path = Path("~/LatestNews/")

    def resolved_data_root(self) -> Path:
        """Expand `~` and resolve to an absolute path."""
        return self.data_root.expanduser().resolve()


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Cached singleton. Tests override via FastAPI's `dependency_overrides`."""
    return Settings()
