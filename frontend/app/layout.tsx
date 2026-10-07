import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agent Run Explorer",
  description: "Browse, filter and inspect AI agent runs.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <header className="border-b border-slate-200 bg-white">
          <nav className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
            <span className="font-semibold">Agent Run Explorer</span>
            <Link href="/runs" className="text-sm text-slate-600 hover:text-slate-900">
              Runs
            </Link>
            <Link href="/dashboard" className="text-sm text-slate-600 hover:text-slate-900">
              Dashboard
            </Link>
          </nav>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
