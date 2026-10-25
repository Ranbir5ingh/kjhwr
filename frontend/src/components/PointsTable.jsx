export default function PointsTable({ points }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Settlement periods</h2>
        <span className="sub">MW · UTC</span>
      </div>
      <p className="table-scroll-hint" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M3 8h10M9.5 4.5L13 8l-3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Swipe sideways to see all columns
      </p>
      <div className="table-wrap">
        <div className="table-scroll" style={{ maxHeight: 360 }}>
          <table>
            <thead>
              <tr>
                <th>Start</th>
                <th className="num">Forecast</th>
                <th className="num">Actual</th>
                <th className="num">Error</th>
              </tr>
            </thead>
            <tbody>
              {(points || []).map((p) => {
                const cls =
                  p.errorMw > 0 ? "pos" : p.errorMw < 0 ? "neg" : "";
                const fmt = (v) =>
                  v == null ? "—" : Math.round(Number(v)).toLocaleString();
                return (
                  <tr key={p.startTime}>
                    <td className="mono">
                      {p.startTime.replace("T", " ").replace("Z", "")}
                    </td>
                    <td className="num">{fmt(p.forecastMw)}</td>
                    <td className="num">{fmt(p.actualMw)}</td>
                    <td className={`num ${cls}`}>{fmt(p.errorMw)}</td>
                  </tr>
                );
              })}
              {!(points || []).length && (
                <tr>
                  <td colSpan={4} className="muted" style={{ textAlign: "center" }}>
                    No periods for this day
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
