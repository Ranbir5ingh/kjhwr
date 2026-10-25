"""kjhwr API — UK day-ahead wind forecast decision portal (pilot)."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from datetime import date
from functools import lru_cache
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from . import analysis, elexon
from .config import settings

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("kjhwr")


@lru_cache(maxsize=1)
def _cache() -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    return elexon.load_cached_actuals(), elexon.load_cached_forecasts()


def _reload_cache() -> None:
    _cache.cache_clear()
    _cache()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    try:
        a, f = _cache()
        log.info("Loaded cache: %s actuals, %s forecasts", len(a), len(f))
    except FileNotFoundError as exc:
        log.warning("Cache missing at startup: %s", exc)
    yield


app = FastAPI(
    title="kjhwr — Day-ahead wind decision portal",
    version="1.0.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, Any]:
    try:
        a, f = _cache()
        return {
            "ok": True,
            "actuals": len(a),
            "forecasts": len(f),
            "elexonBase": settings.elexon_base_url,
            "apiKeyConfigured": bool(settings.elexon_api_key),
        }
    except FileNotFoundError as exc:
        return {"ok": False, "error": str(exc)}


@app.get("/api/meta")
def meta() -> dict[str, Any]:
    return {
        "product": "Day-ahead wind generation decision portal (pilot)",
        "market": "GB national wind (Elexon BMRS)",
        "datasets": {
            "actuals": "FUELHH fuelType=WIND",
            "forecasts": "WINDFOR",
        },
        "scope": "Purchase decisions made in January 2026",
        "decisionRule": (
            f"For delivery day D, decide at D-1 "
            f"{settings.decision_hour_utc:02d}:{settings.decision_minute_utc:02d} UTC; "
            "use latest WINDFOR publishTime <= decision time."
        ),
        "units": "MW (average generation)",
        "alignment": (
            "WINDFOR is hourly; FUELHH is half-hourly. "
            "Actuals are averaged across the two half-hours in each forecast hour."
        ),
        "dataAccess": (
            "Elexon Insights Solution APIs are public (no key required). "
            "Optional ELEXON_API_KEY env var is supported if policies change. "
            "Shipped sample cache covers January 2026 so the app runs offline."
        ),
    }


@app.get("/api/days")
def list_days() -> dict[str, Any]:
    actuals, _ = _cache()
    return {"days": analysis.available_days(actuals)}


@app.get("/api/decision/{delivery_day}")
def decision(delivery_day: str) -> dict[str, Any]:
    try:
        day = date.fromisoformat(delivery_day)
    except ValueError as exc:
        raise HTTPException(400, f"Invalid date: {exc}") from exc
    if day.year != 2026 or day.month != 1:
        raise HTTPException(400, "Pilot scope is January 2026 only")
    actuals, forecasts = _cache()
    return analysis.delivery_day_series(day, actuals, forecasts)


@app.get("/api/accuracy")
def accuracy(
    year: int = Query(2026),
    month: int = Query(1),
) -> dict[str, Any]:
    if year != 2026 or month != 1:
        raise HTTPException(400, "Pilot scope is January 2026 only")
    actuals, forecasts = _cache()
    return analysis.month_summary(actuals, forecasts, year, month)


@app.post("/api/refresh")
async def refresh() -> dict[str, Any]:
    """Optional live refresh of the January 2026 sample cache from Elexon."""
    try:
        counts = await elexon.refresh_january_2026_cache()
    except Exception as exc:  # noqa: BLE001 — surface upstream errors
        raise HTTPException(502, f"Elexon refresh failed: {exc}") from exc
    _reload_cache()
    return {"refreshed": True, **counts}
