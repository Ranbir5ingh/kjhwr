# kjhwr — Day-ahead wind decision portal (pilot)

A small web app for a **GB energy utility** that buys wholesale day-ahead power.
It answers two questions for **national wind** (Elexon BMRS only), scoped to
purchase decisions made in **January 2026**:

1. What was the **latest wind generation forecast available at day-ahead decision time**?
2. How **accurate** were those forecasts versus outturn?

```
┌─────────────┐   GET /api/*    ┌──────────────────────┐   HTTPS    ┌─────────────────┐
│  React UI   │ ──────────────► │  FastAPI (Python)    │ ─────────► │ Elexon BMRS API │
│  :8080      │                 │  decision join +     │  (optional │ FUELHH / WINDFOR│
│  charts +   │ ◄────────────── │  MAE/RMSE/bias/MAPE  │   refresh) │                 │
│  tables     │                 │  + shipped Jan 2026  │            └─────────────────┘
└─────────────┘                 │    sample cache      │
                                └──────────────────────┘
```

## Problem statement

Traders need a clear view of **what they knew at decision time**, not a
retrospective “best available” forecast after the fact. This pilot:

- Pins a single **decision clock**: for delivery day `D`, decide at **`D−1 09:00 UTC`**.
- Selects the latest `WINDFOR` `publishTime` **at or before** that instant.
- Keeps forecast points whose `startTime` falls on day `D` (UTC date).
- Compares them to Elexon `FUELHH` wind actuals for the same hours.
- Reports **MAE**, **RMSE**, **bias** (forecast − actual), and **MAPE** for each day and for January overall.

Why 09:00 UTC? GB day-ahead gate timing is earlier in the morning; 09:00 UTC is a
deliberately clear D−1 morning cutoff for the pilot so the rule is unambiguous and
easy to audit in code (`backend/app/config.py`, `backend/app/analysis.py`).

## Data sources

| Role | Dataset | Resolution | Notes |
|------|---------|------------|--------|
| Actuals | Elexon `FUELHH` `fuelType=WIND` | Half-hourly MW | Averaged to hourly for comparison |
| Forecasts | Elexon `WINDFOR` | Hourly MW | Filtered by `publishTime` ≤ decision time |

**API access**

- Base URL: `https://data.elexon.co.uk/bmrs/api/v1`
- Docs: [Elexon developer portal](https://developer.data.elexon.co.uk/) · [BMRS API docs](https://bmrs.elexon.co.uk/api-documentation)
- Endpoints used:
  - `GET /datasets/FUELHH/stream?settlementDateFrom=&settlementDateTo=&fuelType=WIND`
  - `GET /datasets/WINDFOR/stream?publishDateTimeFrom=&publishDateTimeTo=`
- **No API key is required** for these public Insights Solution APIs today.
- Optional env var `ELEXON_API_KEY` is wired in case access rules change (see `.env.example`).

**Offline sample cache**

January 2026 data ships under `backend/data/` so demos run with **zero network**:

- `fuelhh_wind_jan2026.json` (~284 KB)
- `windfor_jan2026.json` (~2.2 MB)

Refresh from live Elexon (network required):

```bash
# from repo root, with backend deps installed
python scripts/fetch_sample_data.py
# or: POST http://localhost:8000/api/refresh
```

## Decision-time join (worked example)

For delivery day **2026-01-15**:

1. Decision instant = **2026-01-14 09:00:00 UTC**.
2. Among all cached `WINDFOR` rows with `publishTime ≤` that instant, take the
   latest `publishTime`.
3. Keep rows from that publication whose `startTime` is on `2026-01-15`.
4. For each forecast hour `H`, actual MW = mean of the two `FUELHH` half-hours in `H`.
5. Error = forecast − actual; roll up MAE / RMSE / bias / MAPE.

```
D-1 09:00 UTC ──► latest WINDFOR publish ≤ clock ──► hourly points on day D
                                                              │
                                                              ▼
                                                    FUELHH WIND (avg of 2 HH)
                                                              │
                                                              ▼
                                                    MAE · RMSE · bias · MAPE
```

## Accuracy (January 2026, shipped cache)

Computed locally against the shipped sample (31 delivery days, 744 hourly points):

| Metric | Value |
|--------|-------|
| MAE | **2142.1 MW** |
| RMSE | **2611.7 MW** |
| Bias (forecast − actual) | **+1851.9 MW** (systematic over-forecast in this sample) |
| MAPE | **22.38%** |

Re-run anytime via `GET /api/accuracy` after `docker compose up --build`.

## How to run

### Docker Compose (recommended)

```bash
git clone <this-repo-url>
cd kjhwr
docker compose up --build
```

| Service | URL |
|---------|-----|
| UI | http://localhost:8080 |
| API health | http://localhost:8000/api/health |
| OpenAPI | http://localhost:8000/docs |

Override the browser→API origin if needed:

```bash
VITE_API_BASE=https://your-api.example.com docker compose up --build
```

### Local (no Docker)

```bash
# API
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Vite proxies `/api` to `http://localhost:8000`. Open http://localhost:5173.

### Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `ELEXON_API_KEY` | _(empty)_ | Optional; public API today |
| `CORS_ORIGINS` | `*` | Comma-separated allowed origins for the API |
| `VITE_API_BASE` | `http://localhost:8000` (compose) | Frontend build-time API origin; empty = same-origin `/api` |

Copy `.env.example` → `.env` for local overrides (`.env` is gitignored).

## Repository layout

```
kjhwr/
  docker-compose.yml
  README.md
  .env.example
  Makefile
  scripts/fetch_sample_data.py
  backend/
    Dockerfile
    requirements.txt
    Procfile                 # Heroku-style process
    app/
      main.py                # FastAPI routes
      config.py              # settings / decision clock
      elexon.py              # BMRS client + cache I/O
      analysis.py            # decision-time join + accuracy
    data/
      fuelhh_wind_jan2026.json
      windfor_jan2026.json
  frontend/
    Dockerfile
    nginx.conf               # SPA + /api → api:8000
    vercel.json
    package.json
    vite.config.js
    src/
      App.jsx
      api/client.js
      components/
        DecisionChart.jsx
        MetricCards.jsx
        AccuracyTable.jsx
        PointsTable.jsx
```

## HTTP API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Cache sizes / readiness |
| GET | `/api/meta` | Product + decision rule copy |
| GET | `/api/days` | Available January 2026 delivery days |
| GET | `/api/decision/{YYYY-MM-DD}` | Forecast-at-decision + actuals + day metrics |
| GET | `/api/accuracy` | Month overall + per-day metrics |
| POST | `/api/refresh` | Re-download January 2026 sample cache |

## Live demo

| Layer | URL |
|-------|-----|
| **UI (Vercel)** | https://kjhwr-two.vercel.app |
| **API (Render)** | https://kjhwr-api.onrender.com |
| Health | https://kjhwr-api.onrender.com/api/health |

The UI is built with `VITE_API_BASE=https://kjhwr-api.onrender.com`. The API
ships the January 2026 sample cache, so demos need **no Elexon key**. Free-tier
Render services may sleep after idle; the first request can take ~30–60s to wake.

## Deploy notes

### Frontend on Vercel

1. Root directory: `frontend/`
2. Build: `npm run build` · output: `dist`
3. Set build env `VITE_API_BASE` to the public API origin (no trailing slash)
4. Redeploy after changing `VITE_API_BASE` (baked in at build time)

```bash
cd frontend
npx vercel --prod --yes \
  --build-env VITE_API_BASE=https://kjhwr-api.onrender.com
```

### API on Render (Python free web service)

- **Repo:** this GitHub repo · **branch:** `main` · **root dir:** `backend`
- **Build:** `pip install -r requirements.txt`
- **Start:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Health check:** `/api/health`
- **Env:** `PYTHON_VERSION=3.12.x`, `CORS_ORIGINS=https://kjhwr-two.vercel.app` (comma-separated)

`backend/data/*.json` is in the repo, so the service runs offline against the
shipped January 2026 cache. Optional live refresh: `POST /api/refresh`.

Procfile (also used locally / other PaaS):

```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

## AI tools disclosure

This pilot was built with assistance from AI coding tools (scaffolding, code
generation, and documentation drafts). Analysis logic, API contracts, Docker
wiring, and UI behaviour were reviewed and exercised locally against the shipped
Elexon sample cache. The decision rule and metrics are explicit in
`backend/app/analysis.py` — treat AI assistance as a productivity aid, not an
unreviewed black box.

## Limitations

- **Scope:** national GB wind only; January 2026 purchase window only.
- **Clock:** fixed D−1 09:00 UTC; real desks may use gate-relative or product-specific cutoffs.
- **Alignment:** hourly forecast vs half-hourly actuals (two-half-hour mean) is a modelling choice.
- **Cache freshness:** shipped JSON is a snapshot; live `/api/refresh` depends on Elexon availability.
- **No auth / multi-user:** pilot UI is open; not production-hardened.
- **MAPE:** undefined/skipped where actual MW is zero; reported average uses positive actuals only.

## Future work

- Configurable decision clock and multiple desks / books.
- Additional fuels and demand forecasts beyond WIND.
- Confidence bands / ensemble spreads if a richer forecast feed is available.
- Auth, audit log of “what the trader saw”, and export to CSV.
- Automated regression tests that pin metrics for a fixed cache fixture.

## Design notes

- **Offline-first cache** keeps demos reliable inside a short build budget.
- **One clear decision clock** avoids ambiguous “latest” definitions for traders.
- **Documented hourly alignment** surfaces the FUELHH↔WINDFOR resolution mismatch.
- Frontend is a single-page pilot: pick a delivery day, read the curve, scan January accuracy.

## License

Sample / pilot code. Elexon data remains subject to Elexon’s terms of use.
