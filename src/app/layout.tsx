import "./globals.css";

// <html> is rendered by [locale]/layout.tsx (lang/dir per locale) and admin/layout.tsx.
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
