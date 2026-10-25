"""Elexon BMRS client with on-disk sample cache for offline runs.

Public API (no key required as of 2026): https://developer.data.elexon.co.uk/
Datasets used:
  - FUELHH/stream  (fuelType=WIND) — half-hourly actual generation MW
  - WINDFOR/stream                 — wind generation forecasts MW
"""
from __future__ import annotations

import json
import logging
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import httpx

from .config import settings

log = logging.getLogger(__name__)

ACTUALS_CACHE = "fuelhh_wind_jan2026.json"
FORECAST_CACHE = "windfor_jan2026.json"


def _headers() -> dict[str, str]:
    h = {"Accept": "application/json", "User-Agent": "kjhwr/1.0"}
    if settings.elexon_api_key:
        h["Authorization"] = f"Bearer {settings.elexon_api_key}"
    return h


def _load_json(path: Path) -> list[dict[str, Any]]:
    with path.open() as f:
        return json.load(f)


def load_cached_actuals() -> list[dict[str, Any]]:
    path = settings.data_dir / ACTUALS_CACHE
    if not path.exists():
        raise FileNotFoundError(
            f"Missing sample cache {path}. Run scripts/fetch_sample_data.py "
            "or set live refresh."
        )
    return _load_json(path)


def load_cached_forecasts() -> list[dict[str, Any]]:
    path = settings.data_dir / FORECAST_CACHE
    if not path.exists():
        raise FileNotFoundError(f"Missing sample cache {path}")
    return _load_json(path)


async def fetch_fuelhh_wind(
    settlement_from: date, settlement_to: date
) -> list[dict[str, Any]]:
    params = {
        "settlementDateFrom": settlement_from.isoformat(),
        "settlementDateTo": settlement_to.isoformat(),
        "fuelType": "WIND",
    }
    url = f"{settings.elexon_base_url}/datasets/FUELHH/stream"
    async with httpx.AsyncClient(timeout=180.0, headers=_headers()) as client:
        r = await client.get(url, params=params)
        r.raise_for_status()
        return r.json()


async def fetch_windfor(
    publish_from: datetime, publish_to: datetime
) -> list[dict[str, Any]]:
    params = {
        "publishDateTimeFrom": publish_from.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "publishDateTimeTo": publish_to.strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    url = f"{settings.elexon_base_url}/datasets/WINDFOR/stream"
    async with httpx.AsyncClient(timeout=300.0, headers=_headers()) as client:
        r = await client.get(url, params=params)
        r.raise_for_status()
        return r.json()


async def refresh_january_2026_cache() -> dict[str, int]:
    """Pull live January 2026 windows and overwrite the sample cache."""
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    actuals: list[dict[str, Any]] = []
    for a, b in [
        (date(2026, 1, 1), date(2026, 1, 10)),
        (date(2026, 1, 11), date(2026, 1, 20)),
        (date(2026, 1, 21), date(2026, 1, 31)),
    ]:
        chunk = await fetch_fuelhh_wind(a, b)
        actuals.extend(chunk)
    by_start = {row["startTime"]: row for row in actuals}
    actuals = [by_start[k] for k in sorted(by_start)]
    (settings.data_dir / ACTUALS_CACHE).write_text(json.dumps(actuals))

    forecasts: list[dict[str, Any]] = []
    cur = datetime(2025, 12, 30, tzinfo=timezone.utc)
    end = datetime(2026, 1, 31, 23, 59, tzinfo=timezone.utc)
    while cur < end:
        nxt = min(cur + timedelta(days=3), end)
        chunk = await fetch_windfor(cur, nxt)
        forecasts.extend(chunk)
        cur = nxt
    seen = {(r["publishTime"], r["startTime"]): r for r in forecasts}
    forecasts = [seen[k] for k in sorted(seen)]
    jan = [
        r
        for r in forecasts
        if r["startTime"].startswith("2026-01")
        or r["startTime"].startswith("2026-02-01")
        or r["startTime"].startswith("2025-12-31")
    ]
    (settings.data_dir / FORECAST_CACHE).write_text(json.dumps(jan))
    return {"actuals": len(actuals), "forecasts": len(jan)}
