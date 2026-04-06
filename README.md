# SLA / uptime tracker

A lightweight service monitoring system designed to track uptime and measure SLA compliance across critical services, enabling proactive incident detection and reliability reporting.

## Features

- Dashboard: add/remove monitors, **run checks** on demand
- **Cron-friendly** endpoint: `GET` or `POST` `/api/cron/check` with `Authorization: Bearer <CRON_SECRET>` or `?secret=`
- **Weekly report** page + JSON: `/api/report/weekly?days=7`
- **CLI** one-shot (no HTTP): `npm run check-once` (uses same DB)

## Operational Value
- Improves visibility into service health.
- Enables SLA tracking and reporting.
- Supports proactive incident response.

## Requirements

- Node **22+**
- Writable **`data/`** directory (or set `DATA_DIR`)

> **Serverless note:** SQLite needs a persistent disk. Run on a **VM, Docker, or Fly.io/Railway with volume** — not ideal for vanilla Vercel serverless.

## Setup

```bash
cd sla-uptime-tracker
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The first boot seeds an **example.com** monitor unless `SEED_MONITORS` is set.

## Scheduling probes

Every probe is one row in `check_results`. For a meaningful weekly SLA, run checks on a **fixed interval** (e.g. every 1–5 minutes).

**Option A — HTTP cron** (app must be running):

```bash
curl -sS -H "Authorization: Bearer $CRON_SECRET" "https://your-host/api/cron/check"
```

**Option B — CLI cron**:

```bash
cd /path/to/sla-uptime-tracker && npm run check-once
```

Example crontab (every 5 minutes):

```cron
*/5 * * * * cd /path/to/sla-uptime-tracker && CRON_SECRET=unused npm run check-once >> /var/log/sla-check.log 2>&1
```

(`CRON_SECRET` is not read by the CLI; only the HTTP route uses it.)

## Production

Set `CRON_SECRET` in production so strangers cannot trigger probes.

```bash
npm run build
npm run start
```

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/report/weekly?days=7` | JSON aggregate |
| GET/POST | `/api/cron/check` | Run all probes (auth in prod) |
| GET/POST | `/api/monitors` | List / create |
| DELETE | `/api/monitors/:id` | Remove monitor and its history |

## License
No license is set as default, this is just a trial but you can use your org's default license as a starter. 
