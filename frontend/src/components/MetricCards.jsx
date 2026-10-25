export default function MetricCards({ metrics, title }) {
  if (!metrics) return null;
  const items = [
    { key: "maeMw", label: "MAE (MW)" },
    { key: "rmseMw", label: "RMSE (MW)" },
    { key: "biasMw", label: "Bias (MW)" },
    { key: "mapePct", label: "MAPE (%)" },
    { key: "n", label: "Points" },
  ];
  return (
    <div className="card">
      <h2>{title}</h2>
      <div className="metrics">
        {items.map(({ key, label }) => (
          <div className="metric" key={key}>
            <div className="label">{label}</div>
            <div className="value">
              {metrics[key] === null || metrics[key] === undefined
                ? "—"
                : metrics[key]}
            </div>
          </div>
        ))}
      </div>
      <p className="muted" style={{ marginTop: 10 }}>
        Bias = forecast − actual (positive means over-forecast). MAE/RMSE in MW.
      </p>
    </div>
  );
}
