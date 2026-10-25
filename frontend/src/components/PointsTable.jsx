export default function PointsTable({ points }) {
  return (
    <div className="card">
      <h2>Hourly detail (forecast vs actual)</h2>
      <div style={{ overflowX: "auto", maxHeight: 320 }}>
        <table>
          <thead>
            <tr>
              <th>Start (UTC)</th>
              <th>Forecast</th>
              <th>Actual</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            {(points || []).map((p) => {
              const cls =
                p.errorMw > 0 ? "pos" : p.errorMw < 0 ? "neg" : "";
              return (
                <tr key={p.startTime}>
                  <td>{p.startTime.replace("T", " ").replace("Z", "")}</td>
                  <td>{p.forecastMw?.toFixed?.(0) ?? p.forecastMw}</td>
                  <td>
                    {p.actualMw == null
                      ? "—"
                      : p.actualMw.toFixed?.(0) ?? p.actualMw}
                  </td>
                  <td className={cls}>
                    {p.errorMw == null
                      ? "—"
                      : p.errorMw.toFixed?.(0) ?? p.errorMw}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
