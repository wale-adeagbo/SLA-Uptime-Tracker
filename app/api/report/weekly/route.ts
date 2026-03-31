import { NextResponse } from "next/server";
import { getWeeklyReport } from "@/lib/sla";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const days = Math.min(90, Math.max(1, Number(url.searchParams.get("days") ?? "7")));
  const report = getWeeklyReport(days);
  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    windowDays: days,
    monitors: report,
  });
}
