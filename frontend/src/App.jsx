import { useEffect, useState } from "react";
import { api } from "./api/client.js";
import DecisionChart from "./components/DecisionChart.jsx";
import MetricCards from "./components/MetricCards.jsx";
import AccuracyTable from "./components/AccuracyTable.jsx";
import PointsTable from "./components/PointsTable.jsx";

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
        if (!cancelled) setDecision(dec);
      } catch (e) {
        if (!cancelled) setError(String(e.message || e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [day]);

  if (loading) return <div className="app loading">Loading portal…</div>;
  if (error) {
    return (
      <div className="app">
        <div className="error">Failed to load API: {error}</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header>
        <h1>Day-ahead wind decision portal</h1>
        <p>
          Pilot for a GB energy utility. Shows the latest national wind forecast
          available at day-ahead decision time, and how accurate those forecasts
          were against outturn. Scope: January 2026 · Elexon WIND only.
        </p>
      </header>

      {meta && (
        <div className="banner">
          <strong>Decision rule:</strong> {meta.decisionRule}
          <br />
          <span className="muted">{meta.alignment}</span>
        </div>
      )}

      <div className="grid" style={{ marginTop: 16 }}>
        <MetricCards
          title="January 2026 overall accuracy"
          metrics={accuracy?.overall}
        />
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="row">
          <label htmlFor="day">Delivery day</label>
          <select
            id="day"
            value={day}
            onChange={(e) => setDay(e.target.value)}
          >
            {days.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          {decision && (
            <span className="muted">
              Decide at {decision.decisionTime?.replace("T", " ").replace("Z", " UTC")}
              {decision.forecastPublishTime
                ? ` · using forecast published ${decision.forecastPublishTime
                    .replace("T", " ")
                    .replace("Z", " UTC")}`
                : " · no forecast found before decision"}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-2">
        <DecisionChart points={decision?.points} />
        <MetricCards
          title={`Accuracy for ${day}`}
          metrics={decision?.metrics}
        />
      </div>

      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <PointsTable points={decision?.points} />
        <AccuracyTable days={accuracy?.days} />
      </div>

      <p className="muted" style={{ marginTop: 24 }}>
        Data: Elexon BMRS FUELHH (actuals) and WINDFOR (forecasts). Sample cache
        ships with the app for offline demos; optional live refresh via API.
      </p>
    </div>
  );
}
