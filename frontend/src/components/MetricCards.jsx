export default function MetricCards({ metrics, title, compact = false }) {
  if (!metrics) {
    return (
      <div className="card">
        {title && <h2>{title}</h2>}
        <p className="muted">No metrics available.</p>
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

  return (
    <div className="card">
      {title && <h2>{title}</h2>}
      <div className="metrics">
        {items.map(({ key, label, unit }) => (
          <div className="metric" key={key}>
            <div className="label">
              {label}
              {unit ? ` (${unit})` : ""}
            </div>
            <div className="value">{formatValue(key, metrics[key])}</div>
          </div>
        ))}
      </div>
      {!compact && (
        <p className="metric-footnote">
          Bias = forecast − actual (positive means over-forecast). MAE and RMSE
          in MW.
        </p>
      )}
    </div>
  );
}
