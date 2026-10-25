import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "./api/client.js";
import DecisionChart from "./components/DecisionChart.jsx";
import MetricCards from "./components/MetricCards.jsx";
import AccuracyTable from "./components/AccuracyTable.jsx";
import PointsTable from "./components/PointsTable.jsx";
import DayScrubber from "./components/DayScrubber.jsx";

function formatUtc(iso) {
  if (!iso) return null;
  return iso.replace("T", " ").replace("Z", " UTC");
}

function formatLongDay(day) {
  if (!day) return "";
  const [y, m, d] = day.split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  return dt.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function App() {
  const [meta, setMeta] = useState(null);
  const [days, setDays] = useState([]);
  const [day, setDay] = useState("2026-01-15");
  const [decision, setDecision] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartFading, setChartFading] = useState(false);
  const fadeTimer = useRef(null);

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
    setChartFading(true);
    if (fadeTimer.current) clearTimeout(fadeTimer.current);

    (async () => {
      try {
        const dec = await api.decision(day);
        if (cancelled) return;
        setDecision(dec);
        setError(null);
        fadeTimer.current = setTimeout(() => {
          if (!cancelled) setChartFading(false);
        }, 40);
      } catch (e) {
        if (!cancelled) {
          setError(String(e.message || e));
          setChartFading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
    };
  }, [day]);

  const selectDay = useCallback((next) => {
    setDay(next);
  }, []);

  const dayMeta = useMemo(() => {
    if (!decision) return null;
    const decideAt = formatUtc(decision.decisionTime);
    if (!decideAt) return null;
    if (decision.forecastPublishTime) {
      return `Decide ${decideAt} · forecast in at ${formatUtc(
        decision.forecastPublishTime
      )}`;
    }
    return `Decide ${decideAt} · no forecast before cut-off`;
  }, [decision]);

  if (loading) {
    return (
      <div className="app loading">
        <div className="spinner" aria-hidden="true" />
        <span>Loading January sample…</span>
      </div>
    );
  }

  if (error && !meta) {
    return (
      <div className="app error-state">
        <div className="error">Couldn’t reach the API: {error}</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="topbar-left">
            <a className="brand" href="/" aria-label="Updraft home">
              <span className="brand-mark" aria-hidden="true">
                <img
                  src="/updraft-mark.svg"
                  alt=""
                  width="28"
                  height="28"
                  className="brand-mark-svg"
                />
              </span>
              <span className="brand-text">
                <strong>Updraft</strong>
                <em>Day-ahead wind</em>
              </span>
            </a>
            <div className="topbar-context">
              <span className="topbar-day">{formatLongDay(day)}</span>
              {dayMeta ? <span className="topbar-meta">{dayMeta}</span> : null}
            </div>
          </div>
          <div className="topbar-right">
            <span className="scope-chip">Jan 2026 · Elexon WIND</span>
          </div>
        </div>
      </header>

      <section className="intro">
        <div>
          <h1>See what the forecast said at decision time</h1>
          <p>
            Pick a delivery day, compare the national wind forecast available
            before the day-ahead cut-off with outturn, then scan accuracy across
            January.
          </p>
        </div>
        {meta && (
          <aside className="rule-quiet">
            <p className="eyebrow">Decision rule</p>
            <p>{meta.decisionRule}</p>
            {meta.alignment && (
              <p className="alignment">{meta.alignment}</p>
            )}
          </aside>
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <h2>January overall</h2>
          <span className="hint">All delivery days in sample</span>
        </div>
        <MetricCards metrics={accuracy?.overall} compact />
      </section>

      <section className="section">
        <DayScrubber
          days={days}
          day={day}
          onSelect={selectDay}
          dayLabel={formatLongDay(day)}
          dayMeta={dayMeta}
        />
      </section>

      <section className="workspace">
        <DecisionChart
          points={decision?.points}
          day={day}
          fading={chartFading}
        />
        <MetricCards
          title="This day"
          metrics={decision?.metrics}
          variant="stack"
        />
      </section>

      <section className="tables">
        <PointsTable points={decision?.points} />
        <AccuracyTable
          days={accuracy?.days}
          selectedDay={day}
          onSelectDay={selectDay}
        />
      </section>

      {error && meta && (
        <p className="error" style={{ marginTop: 16 }}>
          {error}
        </p>
      )}

      <footer className="site-footer">
        Sources: Elexon BMRS FUELHH (actuals) and WINDFOR (forecasts). Sample
        cache ships with the app; live refresh is optional via the API.
      </footer>
    </div>
  );
}
