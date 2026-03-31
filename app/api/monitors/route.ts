import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM monitors ORDER BY id").all();
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    name?: string;
    url?: string;
    expected_status?: number;
    timeout_ms?: number;
  };
  if (!body.name?.trim() || !body.url?.trim()) {
    return NextResponse.json({ error: "name and url required" }, { status: 400 });
  }
  const db = getDb();
  const info = db
    .prepare(
      "INSERT INTO monitors (name, url, expected_status, timeout_ms) VALUES (?,?,?,?)",
    )
    .run(
      body.name.trim(),
      body.url.trim(),
      body.expected_status ?? 200,
      body.timeout_ms ?? 10000,
    );
  const r = db.prepare("SELECT * FROM monitors WHERE id = ?").get(info.lastInsertRowid);
  return NextResponse.json(r);
}
