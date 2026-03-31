import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "SLA / uptime tracker",
  description: "HTTP probes, SQLite history, weekly SLA reports",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <nav className="border-b border-[var(--border)] bg-[var(--card)]/80 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center gap-6 text-sm">
            <Link href="/" className="font-semibold text-[var(--foreground)]">
              Uptime
            </Link>
            <Link href="/reports" className="text-[var(--muted)] hover:text-[var(--foreground)]">
              Weekly SLA report
            </Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
