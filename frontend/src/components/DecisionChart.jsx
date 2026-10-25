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
        background: "#fffcf7",
        border: "1px solid #e4e1da",
        borderRadius: 8,
        padding: "10px 12px",
        boxShadow: "0 8px 24px rgba(28,25,23,0.08)",
        fontSize: 12,
        color: "#44403c",
        fontFamily: '"Instrument Sans", system-ui, sans-serif',
      }}
    >
      <div
        style={{
          fontWeight: 600,
          marginBottom: 6,
          color: "#1c1917",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {row?.startTime?.replace("T", " ").replace("Z", " UTC") || ""}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span>
          <span style={{ color: "#c2410c" }}>●</span> Forecast{" "}
          <span style={{ fontFamily: '"IBM Plex Mono", monospace' }}>
            {formatMw(row?.forecastMw)}
          </span>
        </span>
        <span>
          <span style={{ color: "#44403c" }}>●</span> Actual{" "}
          <span style={{ fontFamily: '"IBM Plex Mono", monospace' }}>
            {formatMw(row?.actualMw)}
          </span>
        </span>
      </div>
    </div>
  );
}

export default function DecisionChart({ points, day, fading = false }) {
  const data = (points || []).map((p) => ({
    ...p,
    label: tick(p.startTime),
  }));

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Forecast vs outturn</h2>
        {day && <span className="sub">{day}</span>}
      </div>
      <div className="chart-legend">
        <span className="legend-item">
          <span className="legend-swatch forecast" />
          Forecast at decision
        </span>
        <span className="legend-item">
          <span className="legend-swatch actual" />
          Actual generation
        </span>
      </div>
      {!data.length ? (
        <div className="empty-chart">No settlement periods for this day</div>
      ) : (
        <div className={`chart-stage${fading ? " is-fading" : ""}`}>
          <ResponsiveContainer>
            <ComposedChart
              data={data}
              margin={{ top: 8, right: 4, left: -8, bottom: 0 }}
            >
              <CartesianGrid
                stroke="#e4e1da"
                strokeDasharray="3 6"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                stroke="#a8a29e"
                tick={{ fill: "#78716c", fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: "#e4e1da" }}
                interval="preserveStartEnd"
                minTickGap={28}
              />
              <YAxis
                stroke="#a8a29e"
                tick={{ fill: "#78716c", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={46}
                tickFormatter={(v) =>
                  v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="forecastMw"
                name="Forecast"
                stroke="#c2410c"
                strokeWidth={2.25}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: "#c2410c" }}
                isAnimationActive={!fading}
                animationDuration={420}
                animationEasing="ease-out"
              />
              <Line
                type="monotone"
                dataKey="actualMw"
                name="Actual"
                stroke="#44403c"
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: "#44403c" }}
                isAnimationActive={!fading}
                animationDuration={420}
                animationEasing="ease-out"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
