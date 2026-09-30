import { NextResponse, type NextRequest } from "next/server";
import { safeEqual } from "@/lib/basic-auth";
import { jobHandlers } from "@/server/jobs/handlers";
import { runJobs } from "@/server/jobs/runner";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Cron-driven job runner (hPanel cron / any scheduler, every minute). */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided = request.headers.get("x-cron-secret") ?? "";
  if (!secret || !safeEqual(provided, secret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const summary = await runJobs({ handlers: jobHandlers, budgetMs: 45_000 });
  return NextResponse.json(summary);
}
