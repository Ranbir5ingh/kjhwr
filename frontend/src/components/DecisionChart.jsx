import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

function tick(iso) {
  if (!iso) return "";
  return iso.slice(11, 16);
}

function formatMw(v) {
  if (v == null || Number.isNaN(v)) return "—";
  return `${Math.round(v).toLocaleString()} MW`;
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        padding: "10px 12px",
        boxShadow: "0 4px 16px rgba(15,23,42,0.08)",
        fontSize: 12,
        color: "#334155",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 6, color: "#0f172a" }}>
        {row?.startTime?.replace("T", " ").replace("Z", " UTC") || ""}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <span>
          <span style={{ color: "#0f766e" }}>●</span> Forecast{" "}
          {formatMw(row?.forecastMw)}
        </span>
        <span>
          <span style={{ color: "#475569" }}>●</span> Actual{" "}
          {formatMw(row?.actualMw)}
        </span>
      </div>
    </div>
  );
}

export default function DecisionChart({ points, day }) {
  const data = (points || []).map((p) => ({
    ...p,
    label: tick(p.startTime),
  }));

  return (
    <div className="card">
      <h2>Forecast at decision time vs actuals{day ? ` · ${day}` : ""}</h2>
      <div className="chart-legend-hint">
        <span className="legend-item">
          <span className="legend-swatch forecast" />
          Forecast (MW)
        </span>
        <span className="legend-item">
          <span className="legend-swatch actual" />
          Actual (MW)
        </span>
      </div>
      {!data.length ? (
        <div className="empty-chart">No points for this delivery day</div>
      ) : (
        <div className="chart-wrap">
          <ResponsiveContainer>
            <ComposedChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#94a3b8"
                tick={{ fill: "#64748b", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="#94a3b8"
                tick={{ fill: "#64748b", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={64}
                tickFormatter={(v) =>
                  v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="forecastMw"
                name="Forecast"
                stroke="#0f766e"
                strokeWidth={2.25}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="actualMw"
                name="Actual"
                stroke="#475569"
                strokeWidth={2.25}
                strokeDasharray="5 4"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
