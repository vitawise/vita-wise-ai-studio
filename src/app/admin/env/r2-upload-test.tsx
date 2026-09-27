"use client";

import { useActionState } from "react";
import type { CheckResult } from "@/server/health";
import { runR2UploadTest } from "./actions";

export function R2UploadTest() {
  const [result, action, pending] = useActionState<CheckResult | null>(runR2UploadTest, null);
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-emerald-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Testing…" : "Run R2 upload test"}
      </button>
      {result && (
        <span className={result.ok ? "text-emerald-600" : "text-red-600"}>
          {result.ok ? `R2 upload OK (${result.latencyMs} ms)` : `R2 upload FAIL: ${result.error}`}
        </span>
      )}
    </form>
  );
}
