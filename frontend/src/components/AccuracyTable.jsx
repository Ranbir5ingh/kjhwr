export default function AccuracyTable({ days, selectedDay, onSelectDay }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Daily accuracy</h2>
        <span className="sub">Tap a row to jump</span>
      </div>
      <p className="table-scroll-hint" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M3 8h10M9.5 4.5L13 8l-3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Swipe sideways to see all columns
      </p>
      <div className="table-wrap">
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
    </div>
  );
}
