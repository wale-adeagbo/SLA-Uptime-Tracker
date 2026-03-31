import Link from "next/link";
import { getDailyUptimeSeries, getWeeklyReport } from "@/lib/sla";
import { DailyUptimeChart } from "./report-charts";

export const dynamic = "force-dynamic";

type PivotRow = { day: string } & Record<string, string | number>;

function pivotDaily(rows: ReturnType<typeof getDailyUptimeSeries>): PivotRow[] {
  const byDay = new Map<string, PivotRow>();
  for (const r of rows) {
    if (!byDay.has(r.day)) byDay.set(r.day, { day: r.day });
    const o = byDay.get(r.day)!;
    o[r.chartKey] = r.uptimePercent;
  }
  return [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day));
}

export default function ReportsPage() {
  const weekly = getWeeklyReport(7);
  const dailyRaw = getDailyUptimeSeries(14);
  const chartData = pivotDaily(dailyRaw);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Weekly SLA report</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Uptime = successful probes ÷ total probes in the window (not wall-clock unless your probe
          interval is uniform). Export JSON via{" "}
          <Link href="/api/report/weekly" className="text-[var(--accent)] underline">
            /api/report/weekly
          </Link>
          .
        </p>
      </header>

      <section className="mb-10 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
          Last 7 days
        </h2>
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--muted)]">
              <th className="pb-2 pr-4 font-medium">Monitor</th>
              <th className="pb-2 pr-4 font-medium">Checks</th>
              <th className="pb-2 pr-4 font-medium">Success</th>
              <th className="pb-2 pr-4 font-medium">Uptime</th>
              <th className="pb-2 font-medium">Avg latency (OK)</th>
            </tr>
          </thead>
          <tbody>
            {weekly.map((r) => (
              <tr key={r.monitorId} className="border-b border-[var(--border)]/60">
                <td className="py-3 pr-4">
                  <div className="font-medium">{r.name}</div>
                  <div className="font-mono text-xs text-[var(--muted)]">{r.url}</div>
                </td>
                <td className="py-3 pr-4 tabular-nums">{r.totalChecks}</td>
                <td className="py-3 pr-4 tabular-nums">{r.successfulChecks}</td>
                <td className="py-3 pr-4">
                  <span
                    className={
                      r.uptimePercent >= 99
                        ? "text-[var(--accent)]"
                        : r.uptimePercent >= 95
                          ? "text-yellow-400"
                          : "text-[var(--bad)]"
                    }
                  >
                    {r.uptimePercent}%
                  </span>
                </td>
                <td className="py-3 tabular-nums text-[var(--muted)]">
                  {r.avgLatencyMs != null ? `${r.avgLatencyMs} ms` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {weekly.every((w) => w.totalChecks === 0) && (
          <p className="mt-4 text-sm text-[var(--muted)]">
            No probe data yet. Run checks from the dashboard or schedule the cron endpoint.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
          Daily uptime % (last 14 days)
        </h2>
        <DailyUptimeChart series={chartData} />
      </section>
    </main>
  );
}
