import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

let dbInstance: Database.Database | null = null;

export function getDataDir(): string {
  const dir = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function getDb(): Database.Database {
  if (dbInstance) return dbInstance;
  const file = path.join(getDataDir(), "sla.db");
  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS monitors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      expected_status INTEGER NOT NULL DEFAULT 200,
      timeout_ms INTEGER NOT NULL DEFAULT 10000,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS check_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      monitor_id INTEGER NOT NULL,
      checked_at TEXT NOT NULL,
      ok INTEGER NOT NULL,
      latency_ms INTEGER,
      status_code INTEGER,
      error TEXT,
      FOREIGN KEY (monitor_id) REFERENCES monitors(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_check_results_monitor_time
      ON check_results (monitor_id, checked_at);
  `);
  seedIfEmpty(db);
  dbInstance = db;
  return db;
}

function seedIfEmpty(db: Database.Database) {
  const row = db.prepare("SELECT COUNT(*) AS c FROM monitors").get() as { c: number };
  if (row.c > 0) return;

  const raw = process.env.SEED_MONITORS;
  const defaults = [
    { name: "Example HTTP", url: "https://example.com", expected_status: 200, timeout_ms: 10000 },
  ];
  let list = defaults;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as {
        name: string;
        url: string;
        expected_status?: number;
        timeout_ms?: number;
      }[];
      if (Array.isArray(parsed) && parsed.length > 0) list = parsed.map((m) => ({
        name: m.name,
        url: m.url,
        expected_status: m.expected_status ?? 200,
        timeout_ms: m.timeout_ms ?? 10000,
      }));
    } catch {
      /* keep defaults */
    }
  }

  const ins = db.prepare(
    "INSERT INTO monitors (name, url, expected_status, timeout_ms) VALUES (?,?,?,?)",
  );
  for (const m of list) {
    ins.run(m.name, m.url, m.expected_status, m.timeout_ms);
  }
}

export type MonitorRow = {
  id: number;
  name: string;
  url: string;
  expected_status: number;
  timeout_ms: number;
  created_at: string;
};
