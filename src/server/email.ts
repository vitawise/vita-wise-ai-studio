import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { logger } from "./logger";

const globalForMail = globalThis as unknown as { vwMailer?: Transporter | null };

function getTransport(): Transporter | null {
  if (globalForMail.vwMailer === undefined) {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
    globalForMail.vwMailer =
      SMTP_HOST && SMTP_USER && SMTP_PASSWORD
        ? nodemailer.createTransport({
            host: SMTP_HOST,
            port: Number(SMTP_PORT ?? 465),
            secure: Number(SMTP_PORT ?? 465) === 465,
            auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
          })
        : null;
  }
  return globalForMail.vwMailer;
}

export type Email = { to: string; subject: string; text: string; html: string };

/** Sends a transactional email. Never logs bodies (they carry tokens). */
export async function sendEmail(email: Email): Promise<void> {
  const transport = getTransport();
  if (!transport) {
    logger.error({ subject: email.subject }, "SMTP not configured; email not sent");
    return;
  }
  try {
    await transport.sendMail({ from: process.env.SMTP_FROM ?? process.env.SMTP_USER, ...email });
  } catch (err) {
    logger.error({ err, subject: email.subject }, "email send failed");
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** Bilingual (Arabic first) single-action email. */
export function actionEmail(opts: {
  to: string;
  subjectAr: string;
  subjectEn: string;
  bodyAr: string;
  bodyEn: string;
  url: string;
}): Email {
  const url = escapeHtml(opts.url);
  return {
    to: opts.to,
    subject: `${opts.subjectAr} | ${opts.subjectEn}`,
    text: `${opts.bodyAr}\n${opts.url}\n\n${opts.bodyEn}\n${opts.url}`,
    html: `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif">
<p>${escapeHtml(opts.bodyAr)}</p><p><a href="${url}">${escapeHtml(opts.subjectAr)}</a></p></div>
<hr><div dir="ltr" style="font-family:Arial,sans-serif">
<p>${escapeHtml(opts.bodyEn)}</p><p><a href="${url}">${escapeHtml(opts.subjectEn)}</a></p></div>`,
  };
}
