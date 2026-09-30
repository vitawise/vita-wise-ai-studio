import { toNextJsHandler } from "better-auth/next-js";
import { NextResponse } from "next/server";
import { getAuth } from "@/server/auth/auth";
import { isAuthConfigured } from "@/server/auth/configured";

async function handler(request: Request): Promise<Response> {
  if (!isAuthConfigured()) {
    return NextResponse.json({ code: "AUTH_NOT_CONFIGURED" }, { status: 503 });
  }
  return getAuth().handler(request);
}

export const { GET, POST } = toNextJsHandler(handler);
