/**
 * Run all probes once from the shell (for cron without hitting HTTP).
 * Usage: npx tsx scripts/run-checks-cli.ts
 */
import { getDb } from "../lib/db";
import { runAllChecks } from "../lib/run-checks";

getDb();
runAllChecks()
  .then((r) => {
    console.log(JSON.stringify({ ok: true, results: r }, null, 2));
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
