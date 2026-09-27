import { NextResponse, type NextRequest } from "next/server";
import { isBasicAuthValid } from "@/lib/basic-auth";

/** Phase 0 admin gate. Replaced by role-based auth in Phase 1. */
export function proxy(request: NextRequest) {
  const ok = isBasicAuthValid(
    request.headers.get("authorization"),
    process.env.ADMIN_USER,
    process.env.ADMIN_PASSWORD,
  );
  if (ok) return NextResponse.next();
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="VitaWise Admin", charset="UTF-8"' },
  });
}

export const config = {
  matcher: ["/admin/:path*"],
};
