import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import Link from "next/link";
import { Suspense } from "react";
import "./globals.css";
import AppMark from "@/components/AppMark";
import HealthPill, { HealthPillPlaceholder } from "@/components/HealthPill";
import NavLinks, { NavLinksFallback } from "@/components/NavLinks";

export const metadata: Metadata = {
  title: { default: "Agent Run Explorer", template: "%s · Agent Run Explorer" },
  description: "Browse, filter and inspect AI agent runs.",
};

export const viewport: Viewport = {
  themeColor: "#08040f",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans antialiased">
        {/* overflow-hidden clips the wide horizon arc, so it cannot make the page scroll sideways. */}
        <div className="relative min-h-screen overflow-hidden">
          <div aria-hidden="true" className="stars pointer-events-none absolute inset-0 opacity-60" />
          <div aria-hidden="true" className="horizon" />

          <header className="relative border-b border-white/[0.07] bg-page/60 backdrop-blur-xl">
            <nav aria-label="Main" className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-7 px-6 py-3.5">
              <Link href="/runs" className="flex items-center gap-2.5 text-[15px] font-semibold tracking-[-0.01em] max-md:min-h-10">
                <AppMark />
                Agent Run Explorer
              </Link>
              <Suspense fallback={<NavLinksFallback />}>
                <NavLinks />
              </Suspense>
              <Suspense fallback={<HealthPillPlaceholder />}>
                <HealthPill />
              </Suspense>
            </nav>
          </header>

          <main className="relative mx-auto max-w-[1240px] px-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
