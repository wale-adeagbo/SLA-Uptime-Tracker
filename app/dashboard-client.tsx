"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { triggerChecksAction } from "./actions";
import type { MonitorStatus } from "@/lib/status";

export default function DashboardClient({ initial }: { initial: MonitorStatus[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("https://");
  const [adding, setAdding] = useState(false);

  async function runChecks() {
    setMsg(null);
    startTransition(async () => {
      try {
        await triggerChecksAction();
        setMsg("Checks completed.");
        router.refresh();
      } catch {
        setMsg("Checks failed.");
      }
    });
  }

  async function addMonitor(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setAdding(true);
    try {
      const res = await fetch("/api/monitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, url }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setMsg(j.error ?? "Add failed");
        return;
      }
      setName("");
      setUrl("https://");
      router.refresh();
    } finally {
      setAdding(false);
    }
  }

  async function removeMonitor(id: number) {
    if (!confirm("Remove this monitor? Its probe history will be deleted too.")) return;
    setMsg(null);
    const res = await fetch(`/api/monitors/${id}`, { method: "DELETE" });
    if (!res.ok) setMsg("Delete failed");
    else router.refresh();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Service monitors</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            HTTP GET probes stored in SQLite. Schedule{" "}
            <code className="rounded bg-black/30 px-1 text-xs">/api/cron/check</code> for
            automatic runs.
          </p>
        </div>
        <button
          type="button"
          onClick={() => runChecks()}
          disabled={pending}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Running checks…" : "Run checks now"}
        </button>
      </header>

      {msg && (
        <p className="mb-4 rounded-lg border border-[var(--border)] bg-black/20 px-3 py-2 text-sm">
          {msg}
        </p>
      )}

      <section className="mb-10 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
          Add monitor
        </h2>
        <form onSubmit={addMonitor} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 text-sm">
            <span className="mb-1 block text-[var(--muted)]">Name</span>
            <input
              className="w-full rounded-lg border border-[var(--border)] bg-black/30 px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="API"
              required
            />
          </label>
          <label className="flex-[2] text-sm">
            <span className="mb-1 block text-[var(--muted)]">URL</span>
            <input
              className="w-full rounded-lg border border-[var(--border)] bg-black/30 px-3 py-2 font-mono text-xs"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </label>
          <button
            type="submit"
            disabled={adding}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
          >
            Add
          </button>
        </form>
      </section>

      <ul className="space-y-3">
        {initial.length === 0 && (
          <li className="text-sm text-[var(--muted)]">No monitors yet. Add one above.</li>
        )}
        {initial.map((m) => (
          <li
            key={m.id}
            className="flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="font-medium">{m.name}</div>
              <div className="font-mono text-xs text-[var(--muted)]">{m.url}</div>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--muted)]">
                {m.lastCheckedAt == null ? (
                  <span>No checks yet</span>
                ) : (
                  <>
                    <span
                      className={
                        m.lastOk ? "text-[var(--accent)]" : "font-semibold text-[var(--bad)]"
                      }
                    >
                      {m.lastOk ? "UP" : "DOWN"}
                    </span>
                    <span>{m.lastLatencyMs != null ? `${m.lastLatencyMs} ms` : "—"}</span>
                    <span>{new Date(m.lastCheckedAt).toLocaleString()}</span>
                  </>
                )}
              </div>
              {m.lastError && (
                <p className="mt-2 text-xs text-[var(--bad)]">{m.lastError}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeMonitor(m.id)}
              className="self-start text-xs text-[var(--muted)] hover:text-[var(--bad)]"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
