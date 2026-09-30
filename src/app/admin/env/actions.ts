"use server";

import { headers } from "next/headers";
import { isBasicAuthValid } from "@/lib/basic-auth";
import { checkR2Upload, type CheckResult } from "@/server/health";

export async function runR2UploadTest(): Promise<CheckResult> {
  // /admin/* is gated in src/proxy.ts; re-check here since actions are POST endpoints.
  const authorized = isBasicAuthValid(
    (await headers()).get("authorization"),
    process.env.ADMIN_USER,
    process.env.ADMIN_PASSWORD,
  );
  if (!authorized) return { ok: false, latencyMs: 0, error: "Unauthorized" };
  return checkR2Upload();
}
