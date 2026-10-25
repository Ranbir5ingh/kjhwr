from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    elexon_base_url: str = "https://data.elexon.co.uk/bmrs/api/v1"
    elexon_api_key: str | None = None  # public API; reserved if access rules change
    data_dir: Path = Path(__file__).resolve().parent.parent / "data"
    # Day-ahead decision clock (UTC). GB N2EX gate is ~08:20 UTC in winter;
    # we use 09:00 UTC as a clear D-1 morning cutoff for the pilot.
    decision_hour_utc: int = 9
    decision_minute_utc: int = 0
    cors_origins: str = "*"

settings = Settings()
