import { NextResponse } from "next/server";
import { checkDb, checkR2 } from "@/server/health";

export const dynamic = "force-dynamic";

export async function GET() {
  const [db, r2] = await Promise.all([checkDb(), checkR2()]);
  const ok = db.ok && r2.ok;
  return NextResponse.json(
    { status: ok ? "ok" : "degraded", db: db.ok ? "OK" : "FAIL", r2: r2.ok ? "OK" : "FAIL" },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
