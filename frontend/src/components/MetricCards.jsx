export default function MetricCards({
  metrics,
  title,
  compact = false,
  variant = "strip",
}) {
  if (!metrics) {
    return (
      <div className="panel">
        {title && (
          <div className="panel-head">
            <h2>{title}</h2>
          </div>
        )}
        <p className="muted">No metrics for this selection.</p>
      </div>
    );
  }

  const items = [
    { key: "maeMw", label: "MAE", unit: "MW" },
    { key: "rmseMw", label: "RMSE", unit: "MW" },
    { key: "biasMw", label: "Bias", unit: "MW" },
    { key: "mapePct", label: "MAPE", unit: "%" },
    { key: "n", label: "Points", unit: "" },
  ];

  const formatValue = (key, value) => {
    if (value === null || value === undefined) return "—";
    if (key === "n") return Number(value).toLocaleString();
    if (typeof value === "number") {
      return value.toLocaleString(undefined, {
        maximumFractionDigits: key === "mapePct" ? 1 : 0,
      });
    }
    return String(value);
  };

  if (variant === "stack") {
    return (
      <div className="panel">
        <div className="panel-head">
          <h2>{title || "Accuracy"}</h2>
        </div>
        <div className="day-metrics">
          {items.map(({ key, label, unit }) => (
            <div className="day-metric-row" key={key}>
              <span className="label">{label}</span>
              <span className="value">
                {formatValue(key, metrics[key])}
                {unit ? <span className="unit">{unit}</span> : null}
              </span>
            </div>
          ))}
        </div>
        <p className="metric-note">
          Bias = forecast − actual. Positive means the forecast ran high.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="kpi-strip" role="list">
        {items.map(({ key, label, unit }) => (
          <div className="kpi" key={key} role="listitem">
            <div className="label">{label}</div>
            <div className="value">
              {formatValue(key, metrics[key])}
              {unit ? <span className="unit">{unit}</span> : null}
            </div>
          </div>
        ))}
      </div>
      {!compact && (
        <p className="kpi-footnote">
          Bias = forecast − actual (positive means over-forecast).
        </p>
      )}
    </div>
  );
}
