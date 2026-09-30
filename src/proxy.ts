import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { isBasicAuthValid } from "@/lib/basic-auth";

const intl = createIntlMiddleware(routing);

/** Platform admin gate (not tenant owners). Replaced by an admin role in Phase 9. */
function adminGate(request: NextRequest) {
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

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin")) return adminGate(request);
  return intl(request);
}

export const config = {
  // Everything except API routes, Next internals and files with an extension.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
