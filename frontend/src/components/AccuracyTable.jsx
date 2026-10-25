export default function AccuracyTable({ days, selectedDay, onSelectDay }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Daily accuracy</h2>
        <span className="sub">Click a row to jump</span>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Day</th>
              <th>Published</th>
              <th className="num">MAE</th>
              <th className="num">RMSE</th>
              <th className="num">Bias</th>
              <th className="num">MAPE</th>
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
                  className={`is-interactive${isActive ? " is-selected" : ""}`}
                  onClick={() => onSelectDay?.(d.deliveryDay)}
                >
                  <td>{d.deliveryDay}</td>
                  <td className="mono muted">
                    {d.forecastPublishTime
                      ? d.forecastPublishTime
                          .replace("T", " ")
                          .replace("Z", "")
                      : "—"}
                  </td>
                  <td className="num">{m.maeMw ?? "—"}</td>
                  <td className="num">{m.rmseMw ?? "—"}</td>
                  <td className={`num ${biasClass}`}>{m.biasMw ?? "—"}</td>
                  <td className="num">
                    {m.mapePct != null ? `${m.mapePct}` : "—"}
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
