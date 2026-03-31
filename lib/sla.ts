import { getDb } from "./db";

export type WeeklyRow = {
  monitorId: number;
  name: string;
  url: string;
  periodStart: string;
  periodEnd: string;
  totalChecks: number;
  successfulChecks: number;
  uptimePercent: number;
  avgLatencyMs: number | null;
};

/**
 * SLA from probe perspective: successful_checks / total_checks in the window.
 */
export function getWeeklyReport(days = 7): WeeklyRow[] {
  const db = getDb();
  const monitors = db
    .prepare("SELECT id, name, url FROM monitors ORDER BY id")
    .all() as { id: number; name: string; url: string }[];

  const rows: WeeklyRow[] = [];

  for (const m of monitors) {
    const agg = db
      .prepare(
        `SELECT
           COUNT(*) AS total,
           SUM(CASE WHEN ok = 1 THEN 1 ELSE 0 END) AS success,
           AVG(CASE WHEN ok = 1 THEN latency_ms END) AS avg_lat,
           MIN(checked_at) AS first_ts,
           MAX(checked_at) AS last_ts
         FROM check_results
         WHERE monitor_id = ?
           AND checked_at >= datetime('now', ?)`,
      )
      .get(m.id, `-${days} days`) as {
      total: number;
      success: number | null;
      avg_lat: number | null;
      first_ts: string | null;
      last_ts: string | null;
    };

    const total = agg.total ?? 0;
    const success = agg.success ?? 0;
    const uptimePercent = total === 0 ? 0 : Math.round((success / total) * 10000) / 100;

    rows.push({
      monitorId: m.id,
      name: m.name,
      url: m.url,
      periodStart: agg.first_ts ?? "",
      periodEnd: agg.last_ts ?? "",
      totalChecks: total,
      successfulChecks: success,
      uptimePercent: uptimePercent,
      avgLatencyMs:
        agg.avg_lat != null && !Number.isNaN(agg.avg_lat) ? Math.round(agg.avg_lat) : null,
    });
  }

  return rows;
}

export type DailyUptimeRow = {
  day: string;
  monitorId: number;
  chartKey: string;
  name: string;
  total: number;
  success: number;
  uptimePercent: number;
};

export function getDailyUptimeSeries(days = 14): DailyUptimeRow[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT
         date(c.checked_at) AS day,
         c.monitor_id AS monitor_id,
         m.name AS name,
         COUNT(*) AS total,
         SUM(CASE WHEN c.ok = 1 THEN 1 ELSE 0 END) AS success
       FROM check_results c
       JOIN monitors m ON m.id = c.monitor_id
       WHERE c.checked_at >= datetime('now', ?)
       GROUP BY day, c.monitor_id
       ORDER BY day ASC, m.name ASC`,
    )
    .all(`-${days} days`) as {
    day: string;
    monitor_id: number;
    name: string;
    total: number;
    success: number;
  }[];

  return rows.map((r) => ({
    day: r.day,
    monitorId: r.monitor_id,
    /** Stable chart key if two monitors share a name */
    chartKey: `${r.name} (#${r.monitor_id})`,
    name: r.name,
    total: r.total,
    success: r.success,
    uptimePercent: r.total === 0 ? 0 : Math.round((r.success / r.total) * 10000) / 100,
  }));
}
