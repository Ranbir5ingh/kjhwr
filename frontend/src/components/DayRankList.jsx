import { useMemo, useState } from "react";

function shortDay(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  return dt.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function fmt(v, digits = 0) {
  if (v == null) return "—";
  return Number(v).toLocaleString(undefined, { maximumFractionDigits: digits });
}

export default function DayRankList({ days, selectedDay, onSelectDay }) {
  const [sort, setSort] = useState("best"); // best = lowest MAE

  const ranked = useMemo(() => {
    const list = [...(days || [])];
    list.sort((a, b) => {
      const am = a.metrics?.maeMw ?? Infinity;
      const bm = b.metrics?.maeMw ?? Infinity;
      return sort === "best" ? am - bm : bm - am;
    });
    return list;
  }, [days, sort]);

  const maxMae = useMemo(() => {
    let m = 0;
    (days || []).forEach((d) => {
      const v = Number(d.metrics?.maeMw) || 0;
      if (v > m) m = v;
    });
    return m || 1;
  }, [days]);

  // Month sparkline of MAE in calendar order
  const spark = useMemo(() => {
    const list = [...(days || [])].sort((a, b) =>
      a.deliveryDay.localeCompare(b.deliveryDay)
    );
    return list.map((d) => ({
      day: d.deliveryDay,
      mae: Number(d.metrics?.maeMw) || 0,
    }));
  }, [days]);

  const sparkMax = useMemo(
    () => Math.max(1, ...spark.map((s) => s.mae)),
    [spark]
  );

  if (!ranked.length) {
    return (
      <div className="panel">
        <div className="panel-head">
          <h2>Days ranked</h2>
        </div>
        <p className="muted empty-inline">No daily accuracy yet</p>
      </div>
    );
  }

  return (
    <div className="panel day-rank">
      <div className="panel-head">
        <h2>Days ranked by MAE</h2>
        <div className="rank-toggle" role="group" aria-label="Sort order">
          <button
            type="button"
            className={sort === "best" ? "is-on" : ""}
            onClick={() => setSort("best")}
          >
            Best
          </button>
          <button
            type="button"
            className={sort === "worst" ? "is-on" : ""}
            onClick={() => setSort("worst")}
          >
            Worst
          </button>
        </div>
      </div>

      <div className="month-spark" aria-hidden="true">
        <div className="month-spark-label">January MAE shape</div>
        <div className="month-spark-bars">
          {spark.map((s) => (
            <button
              type="button"
              key={s.day}
              className={`month-spark-bar${
                s.day === selectedDay ? " is-selected" : ""
              }`}
              style={{ height: `${Math.max(8, (s.mae / sparkMax) * 100)}%` }}
              title={`${s.day}: ${fmt(s.mae)} MW`}
              onClick={() => onSelectDay?.(s.day)}
            />
          ))}
        </div>
      </div>

      <ul className="rank-list">
        {ranked.map((d, i) => {
          const m = d.metrics || {};
          const mae = Number(m.maeMw) || 0;
          const bias = Number(m.biasMw) || 0;
          const isActive = d.deliveryDay === selectedDay;
          return (
            <li key={d.deliveryDay}>
              <button
                type="button"
                className={`rank-card${isActive ? " is-selected" : ""}`}
                onClick={() => onSelectDay?.(d.deliveryDay)}
              >
                <span className="rank-pos">#{i + 1}</span>
                <span className="rank-main">
                  <span className="rank-day">{shortDay(d.deliveryDay)}</span>
                  <span className="rank-bar-track" aria-hidden="true">
                    <span
                      className="rank-bar-fill"
                      style={{ width: `${(mae / maxMae) * 100}%` }}
                    />
                  </span>
                </span>
                <span className="rank-stats">
                  <span className="rank-mae">
                    {fmt(mae)} <em>MAE</em>
                  </span>
                  <span className={`rank-bias ${bias >= 0 ? "pos" : "neg"}`}>
                    {bias >= 0 ? "Over" : "Under"} {fmt(Math.abs(bias))}
                  </span>
                  <span className="rank-mape">
                    {m.mapePct != null ? `${fmt(m.mapePct, 1)}%` : "—"}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
