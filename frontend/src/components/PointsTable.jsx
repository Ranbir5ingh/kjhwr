export default function PointsTable({ points }) {
  return (
    <div className="card">
      <h2>Hourly detail · forecast vs actual</h2>
      <div className="table-scroll" style={{ maxHeight: 360 }}>
        <table>
          <thead>
            <tr>
              <th>Start (UTC)</th>
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
                  <td style={{ fontVariantNumeric: "tabular-nums" }}>
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
                  No hourly points
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
