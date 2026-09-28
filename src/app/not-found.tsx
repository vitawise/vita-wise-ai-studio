import Link from "next/link";

// Fallback for paths outside [locale] (the proxy normally adds a locale prefix).
export default function GlobalNotFound() {
  return (
    <html lang="ar" dir="rtl">
      <body className="flex min-h-dvh items-center justify-center">
        <Link href="/ar" className="underline">
          الصفحة غير موجودة — العودة للرئيسية
        </Link>
      </body>
    </html>
  );
}
