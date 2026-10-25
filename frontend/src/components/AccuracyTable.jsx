export default function AccuracyTable({ days }) {
  return (
    <div className="card">
      <h2>Daily accuracy (January 2026)</h2>
      <div style={{ overflowX: "auto", maxHeight: 420 }}>
        <table>
          <thead>
            <tr>
              <th>Delivery day</th>
              <th>Forecast publish</th>
              <th>MAE</th>
              <th>RMSE</th>
              <th>Bias</th>
              <th>MAPE %</th>
            </tr>
          </thead>
          <tbody>
            {(days || []).map((d) => {
              const m = d.metrics || {};
              const biasClass =
                m.biasMw > 0 ? "pos" : m.biasMw < 0 ? "neg" : "";
              return (
                <tr key={d.deliveryDay}>
                  <td>{d.deliveryDay}</td>
                  <td className="muted">
                    {d.forecastPublishTime
                      ? d.forecastPublishTime.replace("T", " ").replace("Z", " UTC")
                      : "—"}
                  </td>
                  <td>{m.maeMw ?? "—"}</td>
                  <td>{m.rmseMw ?? "—"}</td>
                  <td className={biasClass}>{m.biasMw ?? "—"}</td>
                  <td>{m.mapePct ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
