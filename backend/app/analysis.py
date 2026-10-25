"""Day-ahead decision views and forecast accuracy metrics.

Decision rule (documented, configurable):
  For each delivery day D in January 2026, the trader decides at
  (D - 1) 09:00 UTC. We take the latest WINDFOR publishTime <= that
  instant, then keep forecast points whose startTime falls on day D
  (UTC calendar date). Actuals come from FUELHH WIND. Forecasts are
  hourly; actuals are half-hourly — we average the two half-hours that
  cover each forecast hour.
"""
from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from statistics import mean
from typing import Any

from .config import settings


def _parse(ts: str) -> datetime:
    return datetime.fromisoformat(ts.replace("Z", "+00:00"))


def _fmt(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def decision_time_for(delivery_day: date) -> datetime:
    d1 = delivery_day - timedelta(days=1)
    return datetime(
        d1.year,
        d1.month,
        d1.day,
        settings.decision_hour_utc,
        settings.decision_minute_utc,
        tzinfo=timezone.utc,
    )


def hourly_actuals(actual_rows: list[dict[str, Any]]) -> dict[str, float]:
    """Map hourly startTime -> average MW of the two half-hours in that hour."""
    by_hour: dict[str, list[float]] = defaultdict(list)
    for row in actual_rows:
        st = _parse(row["startTime"])
        hour = st.replace(minute=0, second=0, microsecond=0)
        by_hour[_fmt(hour)].append(float(row["generation"]))
    return {h: mean(vals) for h, vals in by_hour.items()}


def latest_forecast_at(
    forecast_rows: list[dict[str, Any]], as_of: datetime
) -> tuple[str | None, list[dict[str, Any]]]:
    """Return (publishTime, rows) for the latest publish <= as_of."""
    pubs = sorted(
        {
            r["publishTime"]
            for r in forecast_rows
            if _parse(r["publishTime"]) <= as_of
        }
    )
    if not pubs:
        return None, []
    pub = pubs[-1]
    rows = [r for r in forecast_rows if r["publishTime"] == pub]
    rows.sort(key=lambda r: r["startTime"])
    return pub, rows


def delivery_day_series(
    delivery_day: date,
    actual_rows: list[dict[str, Any]],
    forecast_rows: list[dict[str, Any]],
) -> dict[str, Any]:
    as_of = decision_time_for(delivery_day)
    pub, all_fc = latest_forecast_at(forecast_rows, as_of)
    day_prefix = delivery_day.isoformat()
    fc_day = [r for r in all_fc if r["startTime"].startswith(day_prefix)]
    act = hourly_actuals(
        [r for r in actual_rows if r["startTime"].startswith(day_prefix)]
    )

    points = []
    errors = []
    for r in fc_day:
        st = r["startTime"]
        forecast_mw = float(r["generation"])
        actual_mw = act.get(st)
        err = None
        abs_err = None
        if actual_mw is not None:
            err = forecast_mw - actual_mw
            abs_err = abs(err)
            errors.append({"error": err, "abs": abs_err, "actual": actual_mw, "forecast": forecast_mw})
        points.append(
            {
                "startTime": st,
                "forecastMw": forecast_mw,
                "actualMw": actual_mw,
                "errorMw": err,
                "absErrorMw": abs_err,
            }
        )

    metrics = _metrics(errors)
    return {
        "deliveryDay": day_prefix,
        "decisionTime": _fmt(as_of),
        "forecastPublishTime": pub,
        "points": points,
        "metrics": metrics,
    }


def _metrics(errors: list[dict[str, float]]) -> dict[str, Any]:
    if not errors:
        return {
            "n": 0,
            "maeMw": None,
            "rmseMw": None,
            "biasMw": None,
            "mapePct": None,
        }
    n = len(errors)
    mae = mean(e["abs"] for e in errors)
    rmse = (mean(e["error"] ** 2 for e in errors)) ** 0.5
    bias = mean(e["error"] for e in errors)
    mape_vals = [
        e["abs"] / e["actual"] * 100
        for e in errors
        if e["actual"] and e["actual"] > 0
    ]
    mape = mean(mape_vals) if mape_vals else None
    return {
        "n": n,
        "maeMw": round(mae, 1),
        "rmseMw": round(rmse, 1),
        "biasMw": round(bias, 1),
        "mapePct": round(mape, 2) if mape is not None else None,
    }


def month_summary(
    actual_rows: list[dict[str, Any]],
    forecast_rows: list[dict[str, Any]],
    year: int = 2026,
    month: int = 1,
) -> dict[str, Any]:
    # Build list of delivery days in month that have both data
    days: list[date] = []
    d = date(year, month, 1)
    while d.month == month:
        days.append(d)
        d += timedelta(days=1)

    daily = []
    all_errors: list[dict[str, float]] = []
    for day in days:
        series = delivery_day_series(day, actual_rows, forecast_rows)
        daily.append(
            {
                "deliveryDay": series["deliveryDay"],
                "decisionTime": series["decisionTime"],
                "forecastPublishTime": series["forecastPublishTime"],
                "metrics": series["metrics"],
                "pointCount": len(series["points"]),
            }
        )
        for p in series["points"]:
            if p["errorMw"] is not None and p["actualMw"] is not None:
                all_errors.append(
                    {
                        "error": p["errorMw"],
                        "abs": p["absErrorMw"],
                        "actual": p["actualMw"],
                        "forecast": p["forecastMw"],
                    }
                )

    return {
        "scope": f"{year}-{month:02d}",
        "decisionRule": (
            f"D-1 {settings.decision_hour_utc:02d}:"
            f"{settings.decision_minute_utc:02d} UTC; latest WINDFOR publish "
            "at or before that time; hourly points on delivery day D"
        ),
        "overall": _metrics(all_errors),
        "days": daily,
    }


def available_days(actual_rows: list[dict[str, Any]]) -> list[str]:
    days = sorted({r["startTime"][:10] for r in actual_rows})
    return [d for d in days if d.startswith("2026-01")]
