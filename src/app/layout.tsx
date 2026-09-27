import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VitaWise AI Studio",
  description: "منصة الذكاء الاصطناعي للصيدليات السعودية",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
