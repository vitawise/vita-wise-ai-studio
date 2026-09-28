import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { after } from "next/server";
import { getDb } from "../db/client";
import * as schema from "../db/schema";
import { actionEmail, sendEmail } from "../email";

// Emails are sent after the response so response time doesn't reveal whether an account exists.
function sendLater(email: Parameters<typeof sendEmail>[0]) {
  after(() => sendEmail(email));
}

function createAuth() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
  return betterAuth({
    appName: "VitaWise AI Studio",
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    database: drizzleAdapter(getDb(), { provider: "mysql", schema }),
    advanced: {
      cookiePrefix: "vw",
      database: { generateId: () => crypto.randomUUID() },
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 10,
      revokeSessionsOnPasswordReset: true,
      resetPasswordTokenExpiresIn: 60 * 30,
      sendResetPassword: async ({ user, url }) => {
        sendLater(
          actionEmail({
            to: user.email,
            subjectAr: "إعادة تعيين كلمة المرور",
            subjectEn: "Reset your password",
            bodyAr: "طلبت إعادة تعيين كلمة المرور. الرابط صالح لمدة 30 دقيقة.",
            bodyEn: "You requested a password reset. The link is valid for 30 minutes.",
            url,
          }),
        );
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        sendLater(
          actionEmail({
            to: user.email,
            subjectAr: "تأكيد البريد الإلكتروني",
            subjectEn: "Verify your email",
            bodyAr: "أهلًا بك في فيتاوايز. اضغط الرابط لتأكيد بريدك الإلكتروني.",
            bodyEn: "Welcome to VitaWise. Click the link to verify your email.",
            url,
          }),
        );
      },
    },
    socialProviders:
      GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET
        ? { google: { clientId: GOOGLE_CLIENT_ID, clientSecret: GOOGLE_CLIENT_SECRET } }
        : {},
    verification: { storeIdentifier: "hashed" },
    rateLimit: {
      storage: "database",
      window: 60,
      max: 100,
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/sign-up/email": { window: 60, max: 3 },
        "/request-password-reset": { window: 60, max: 3 },
      },
    },
    plugins: [nextCookies()],
  });
}

type Auth = ReturnType<typeof createAuth>;
const globalForAuth = globalThis as unknown as { vwAuth?: Auth };

/** Lazy so `next build` works without DB/auth env vars. */
export function getAuth(): Auth {
  globalForAuth.vwAuth ??= createAuth();
  return globalForAuth.vwAuth;
}

export const googleEnabled = () =>
  Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
