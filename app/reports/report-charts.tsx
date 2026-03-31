"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type ChartRow = { day: string } & Record<string, string | number>;

export function DailyUptimeChart({ series }: { series: ChartRow[] }) {
  if (series.length === 0) {
    return <p className="text-sm text-[var(--muted)]">No check history for this window.</p>;
  }

  const keys = Object.keys(series[0] ?? {}).filter((k) => k !== "day");

  return (
    <div className="h-72 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a3444" />
          <XAxis dataKey="day" tick={{ fill: "#8b939e", fontSize: 10 }} />
          <YAxis domain={[0, 100]} tick={{ fill: "#8b939e", fontSize: 10 }} unit="%" />
          <Tooltip
            contentStyle={{
              background: "#141a22",
              border: "1px solid #2a3444",
              borderRadius: 8,
            }}
            formatter={(v: number) => `${v}%`}
          />
          <Legend />
          {keys.map((k, i) => (
            <Bar
              key={k}
              dataKey={k}
              name={k}
              fill={["#22c55e", "#3b82f6", "#eab308", "#a855f7", "#f97316"][i % 5]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
