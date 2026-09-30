import { NextResponse } from "next/server";
import { jobHandlers } from "@/server/jobs/handlers";
import { getJob } from "@/server/jobs/queue";
import { runJobs } from "@/server/jobs/runner";
import { getTenantContext } from "@/server/tenancy";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Runs the caller's own queued job right away so they don't wait for the next cron tick. */
export async function POST(_request: Request, { params }: RouteContext<"/api/jobs/[id]/nudge">) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const id = (await params).id;
  if (!(await getJob(ctx, id))) return NextResponse.json({ error: "not_found" }, { status: 404 });
  await runJobs({ handlers: jobHandlers, budgetMs: 45_000, onlyJobId: id });
  return NextResponse.json(await getJob(ctx, id));
}
