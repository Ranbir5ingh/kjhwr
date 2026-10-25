import { useEffect, useMemo, useState } from "react";
import { api } from "./api/client.js";
import DecisionChart from "./components/DecisionChart.jsx";
import MetricCards from "./components/MetricCards.jsx";
import AccuracyTable from "./components/AccuracyTable.jsx";
import PointsTable from "./components/PointsTable.jsx";

function formatUtc(iso) {
  if (!iso) return null;
  return iso.replace("T", " ").replace("Z", " UTC");
}

function formatChipLabel(day) {
  // "2026-01-15" → "15 Jan"
  const [y, m, d] = day.split("-").map(Number);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${d} ${months[(m || 1) - 1]}`;
}

export default function App() {
  const [meta, setMeta] = useState(null);
  const [days, setDays] = useState([]);
  const [day, setDay] = useState("2026-01-15");
  const [decision, setDecision] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [m, d, a] = await Promise.all([
          api.meta(),
          api.days(),
          api.accuracy(),
        ]);
        if (cancelled) return;
        setMeta(m);
        setDays(d.days || []);
        setAccuracy(a);
        if (d.days?.length) {
          const preferred = d.days.includes("2026-01-15")
            ? "2026-01-15"
            : d.days[Math.floor(d.days.length / 2)];
          setDay(preferred);
        }
      } catch (e) {
        if (!cancelled) setError(String(e.message || e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!day) return;
    let cancelled = false;
    (async () => {
      try {
        const dec = await api.decision(day);
        if (!cancelled) {
          setDecision(dec);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(String(e.message || e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [day]);

  const dayMeta = useMemo(() => {
    if (!decision) return null;
    const decideAt = formatUtc(decision.decisionTime);
    if (!decideAt) return null;
    if (decision.forecastPublishTime) {
      return `Decide at ${decideAt} · forecast published ${formatUtc(
        decision.forecastPublishTime
      )}`;
    }
    return `Decide at ${decideAt} · no forecast found before decision`;
  }, [decision]);

  if (loading) {
    return (
      <div className="app loading">
        <div className="spinner" aria-hidden="true" />
        <span>Loading decision portal…</span>
      </div>
    );
  }

  if (error && !meta) {
    return (
      <div className="app error-state">
        <div className="error">Failed to load API: {error}</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="site-header">
        <div className="brand-row">
          <div className="brand-mark" aria-hidden="true">
            k
          </div>
          <h1>Day-ahead wind decisions</h1>
        </div>
        <p className="subtitle">
          Pilot portal for a GB energy utility. Compare the national wind
          forecast available at day-ahead decision time with outturn, and track
          forecast accuracy across January 2026.
        </p>
        <span className="scope-pill">January 2026 · Elexon WIND only</span>
      </header>

      {meta && (
        <div className="rule-callout">
          <div className="rule-icon" aria-hidden="true">
            ∴
          </div>
          <div>
            <strong>Decision rule</strong>
            <p>{meta.decisionRule}</p>
            {meta.alignment && (
              <p className="alignment">{meta.alignment}</p>
            )}
          </div>
        </div>
      )}

      <section className="section">
        <p className="section-label">January 2026 · overall accuracy</p>
        <MetricCards metrics={accuracy?.overall} compact />
      </section>

      <section className="section">
        <div className="card day-panel">
          <div className="day-panel-header">
            <h2>Delivery day</h2>
            {dayMeta && <span className="day-meta">{dayMeta}</span>}
          </div>
          <div
            className="day-chips"
            role="listbox"
            aria-label="Select delivery day"
          >
            {days.map((d) => (
              <button
                key={d}
                type="button"
                role="option"
                aria-selected={d === day}
                className={`day-chip${d === day ? " active" : ""}`}
                onClick={() => setDay(d)}
              >
                {formatChipLabel(d)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section grid grid-2">
        <DecisionChart points={decision?.points} day={day} />
        <MetricCards title={`Accuracy · ${day}`} metrics={decision?.metrics} />
      </section>

      <section className="section grid grid-2">
        <PointsTable points={decision?.points} />
        <AccuracyTable days={accuracy?.days} selectedDay={day} onSelectDay={setDay} />
      </section>

      <footer className="site-footer">
        Data: Elexon BMRS FUELHH (actuals) and WINDFOR (forecasts). Sample cache
        ships with the app for offline demos; optional live refresh via API.
      </footer>
    </div>
  );
}
