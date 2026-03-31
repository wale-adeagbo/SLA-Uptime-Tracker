import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const num = Number(id);
  if (!Number.isFinite(num)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  const db = getDb();
  const r = db.prepare("DELETE FROM monitors WHERE id = ?").run(num);
  if (r.changes === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
