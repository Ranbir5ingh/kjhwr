#!/usr/bin/env python3
"""Refresh January 2026 Elexon sample caches into backend/data/."""
from __future__ import annotations

import asyncio
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app import elexon  # noqa: E402


async def main() -> None:
    counts = await elexon.refresh_january_2026_cache()
    print("Refreshed:", counts)


if __name__ == "__main__":
    asyncio.run(main())
