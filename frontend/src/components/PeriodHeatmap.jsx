import { useMemo, useState } from "react";

function fmtMw(v) {
  if (v == null || Number.isNaN(Number(v))) return "—";
  return Math.round(Number(v)).toLocaleString();
}

function hourLabel(iso) {
  if (!iso) return "";
  const t = iso.slice(11, 16);
  return t === "00:00" ? "00:00" : t;
}

export default function PeriodHeatmap({ points }) {
  const [active, setActive] = useState(null);

  const { cells, maxAbs, peak } = useMemo(() => {
    const list = points || [];
    let max = 0;
    let peakIdx = -1;
    list.forEach((p, i) => {
      const a = Math.abs(Number(p.absErrorMw ?? p.errorMw) || 0);
      if (a > max) {
        max = a;
        peakIdx = i;
      }
    });
    return { cells: list, maxAbs: max || 1, peak: peakIdx >= 0 ? list[peakIdx] : null };
  }, [points]);

  const colorFor = (p) => {
    if (p == null || p.errorMw == null) return "var(--border)";
    const err = Number(p.errorMw);
    const t = Math.min(1, Math.abs(err) / maxAbs);
    // Diverging: under-forecast (actual higher) = slate, over-forecast = copper
    if (err >= 0) {
      const a = 0.12 + t * 0.78;
      return `rgba(194, 65, 12, ${a.toFixed(3)})`;
    }
    const a = 0.12 + t * 0.72;
    return `rgba(68, 64, 60, ${a.toFixed(3)})`;
  };

  if (!cells.length) {
    return (
      <div className="panel">
        <div className="panel-head">
          <h2>Settlement periods</h2>
        </div>
        <p className="muted empty-inline">No periods for this day</p>
      </div>
    );
  }

  const tip = active;

  return (
    <div className="panel period-heatmap">
      <div className="panel-head">
        <h2>Error by period</h2>
        <span className="sub">Tap a cell · MW</span>
      </div>

      <div className="heat-legend" aria-hidden="true">
        <span className="heat-legend-label">Under</span>
        <span className="heat-swatch under" />
        <span className="heat-swatch mid" />
        <span className="heat-swatch over" />
        <span className="heat-legend-label">Over</span>
        <span className="heat-legend-hint">vs actual</span>
      </div>

      <div
        className="heat-grid"
        role="list"
        aria-label="Forecast error by settlement period"
      >
        {cells.map((p) => {
          const isOn = tip?.startTime === p.startTime;
          return (
            <button
              type="button"
              key={p.startTime}
              role="listitem"
              className={`heat-cell${isOn ? " is-active" : ""}`}
              style={{ background: colorFor(p) }}
              aria-label={`${hourLabel(p.startTime)} error ${fmtMw(p.errorMw)} MW`}
              onClick={() => setActive(isOn ? null : p)}
              onMouseEnter={() => setActive(p)}
              onFocus={() => setActive(p)}
            />
          );
        })}
      </div>

      <div className="heat-axis">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>24:00</span>
      </div>

      <div className="heat-detail" aria-live="polite">
        {tip ? (
          <>
            <div className="heat-detail-time">{hourLabel(tip.startTime)} UTC</div>
            <div className="heat-detail-metrics">
              <span>
                <em>Forecast</em> {fmtMw(tip.forecastMw)}
              </span>
              <span>
                <em>Actual</em> {fmtMw(tip.actualMw)}
              </span>
              <span className={Number(tip.errorMw) >= 0 ? "pos" : "neg"}>
                <em>Error</em> {fmtMw(tip.errorMw)} MW
              </span>
            </div>
          </>
        ) : peak ? (
          <p className="heat-detail-fallback">
            Largest miss at <strong>{hourLabel(peak.startTime)}</strong> ·{" "}
            {fmtMw(peak.errorMw)} MW. Hover or tap a cell for detail.
          </p>
        ) : null}
      </div>
    </div>
  );
}
