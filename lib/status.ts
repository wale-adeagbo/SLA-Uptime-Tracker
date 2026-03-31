import { getDb } from "./db";

export type MonitorStatus = {
  id: number;
  name: string;
  url: string;
  lastOk: boolean | null;
  lastLatencyMs: number | null;
  lastCheckedAt: string | null;
  lastError: string | null;
};

export function getMonitorStatuses(): MonitorStatus[] {
  const db = getDb();
  const monitors = db.prepare("SELECT id, name, url FROM monitors ORDER BY id").all() as {
    id: number;
    name: string;
    url: string;
  }[];

  const lastStmt = db.prepare(
    `SELECT ok, latency_ms, checked_at, error FROM check_results
     WHERE monitor_id = ? ORDER BY checked_at DESC LIMIT 1`,
  );

  return monitors.map((m) => {
    const row = lastStmt.get(m.id) as
      | { ok: number; latency_ms: number | null; checked_at: string; error: string | null }
      | undefined;
    return {
      id: m.id,
      name: m.name,
      url: m.url,
      lastOk: row ? row.ok === 1 : null,
      lastLatencyMs: row?.latency_ms ?? null,
      lastCheckedAt: row?.checked_at ?? null,
      lastError: row?.error ?? null,
    };
  });
}
