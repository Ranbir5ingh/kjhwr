export default function AccuracyTable({ days, selectedDay, onSelectDay }) {
  return (
    <div className="card">
      <h2>Daily accuracy · January 2026</h2>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Day</th>
              <th>Published</th>
              <th className="num">MAE</th>
              <th className="num">RMSE</th>
              <th className="num">Bias</th>
              <th className="num">MAPE %</th>
            </tr>
          </thead>
          <tbody>
            {(days || []).map((d) => {
              const m = d.metrics || {};
              const biasClass =
                m.biasMw > 0 ? "pos" : m.biasMw < 0 ? "neg" : "";
              const isActive = d.deliveryDay === selectedDay;
              return (
                <tr
                  key={d.deliveryDay}
                  onClick={() => onSelectDay?.(d.deliveryDay)}
                  style={{
                    cursor: onSelectDay ? "pointer" : "default",
                    background: isActive ? "#f0fdfa" : undefined,
                  }}
                >
                  <td
                    style={{
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? "#0f766e" : undefined,
                    }}
                  >
                    {d.deliveryDay}
                  </td>
                  <td className="muted" style={{ fontSize: "0.78rem" }}>
                    {d.forecastPublishTime
                      ? d.forecastPublishTime
                          .replace("T", " ")
                          .replace("Z", "")
                      : "—"}
                  </td>
                  <td className="num">{m.maeMw ?? "—"}</td>
                  <td className="num">{m.rmseMw ?? "—"}</td>
                  <td className={`num ${biasClass}`}>{m.biasMw ?? "—"}</td>
                  <td className="num">{m.mapePct ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
