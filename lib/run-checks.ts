import { getDb } from "./db";

export type CheckRunSummary = {
  monitorId: number;
  name: string;
  ok: boolean;
  latencyMs: number | null;
  statusCode: number | null;
  error: string | null;
};

async function probeOne(
  url: string,
  expectedStatus: number,
  timeoutMs: number,
): Promise<{ ok: boolean; latencyMs: number; statusCode: number | null; error: string | null }> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  const started = performance.now();
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "sla-uptime-tracker/1.0" },
    });
    const latencyMs = Math.round(performance.now() - started);
    const ok = res.status === expectedStatus;
    return {
      ok,
      latencyMs,
      statusCode: res.status,
      error: ok ? null : `Expected ${expectedStatus}, got ${res.status}`,
    };
  } catch (e) {
    const latencyMs = Math.round(performance.now() - started);
    const msg = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      latencyMs,
      statusCode: null,
      error: msg,
    };
  } finally {
    clearTimeout(t);
  }
}

export async function runAllChecks(): Promise<CheckRunSummary[]> {
  const db = getDb();
  const monitors = db.prepare("SELECT * FROM monitors ORDER BY id").all() as {
    id: number;
    name: string;
    url: string;
    expected_status: number;
    timeout_ms: number;
  }[];

  const insert = db.prepare(
    `INSERT INTO check_results (monitor_id, checked_at, ok, latency_ms, status_code, error)
     VALUES (?, datetime('now'), ?, ?, ?, ?)`,
  );

  const results: CheckRunSummary[] = [];

  for (const m of monitors) {
    const r = await probeOne(m.url, m.expected_status, m.timeout_ms);
    insert.run(m.id, r.ok ? 1 : 0, r.latencyMs, r.statusCode, r.error);
    results.push({
      monitorId: m.id,
      name: m.name,
      ok: r.ok,
      latencyMs: r.latencyMs,
      statusCode: r.statusCode,
      error: r.error,
    });
  }

  return results;
}
