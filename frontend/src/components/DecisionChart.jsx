import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

function tick(iso) {
  if (!iso) return "";
  return iso.slice(11, 16);
}

export default function DecisionChart({ points }) {
  const data = (points || []).map((p) => ({
    ...p,
    label: tick(p.startTime),
  }));
  return (
    <div className="card">
      <h2>Forecast at decision time vs actuals</h2>
      <div style={{ width: "100%", height: 340 }}>
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#475569" strokeDasharray="3 3" />
            <XAxis dataKey="label" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" unit=" MW" width={70} />
            <Tooltip
              contentStyle={{ background: "#1e293b", border: "1px solid #475569" }}
              labelFormatter={(_, payload) =>
                payload?.[0]?.payload?.startTime || ""
              }
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="forecastMw"
              name="Forecast (MW)"
              stroke="#38bdf8"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="actualMw"
              name="Actual (MW)"
              stroke="#34d399"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
