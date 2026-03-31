"use server";

import { revalidatePath } from "next/cache";
import { runAllChecks } from "@/lib/run-checks";

export async function triggerChecksAction() {
  const results = await runAllChecks();
  revalidatePath("/");
  revalidatePath("/reports");
  return { ok: true as const, results };
}
