import { NextResponse } from "next/server";
import { getJob } from "@/server/jobs/queue";
import { getTenantContext } from "@/server/tenancy";

export const dynamic = "force-dynamic";

/** Polled by the UI every 2–3 s. Only returns jobs of the caller's pharmacy. */
export async function GET(_request: Request, { params }: RouteContext<"/api/jobs/[id]">) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const job = await getJob(ctx, (await params).id);
  if (!job) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(job, { headers: { "Cache-Control": "no-store" } });
}
