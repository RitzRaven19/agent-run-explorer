import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import "./globals.css";
import HealthPill, { HealthPillPlaceholder } from "@/components/HealthPill";
import NavLinks, { NavLinksFallback } from "@/components/NavLinks";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "Agent Run Explorer",
  description: "Browse, filter and inspect AI agent runs.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        {/* overflow-hidden clips the wide horizon arc, so it cannot make the page scroll sideways. */}
        <div className="relative min-h-screen overflow-hidden">
          <div aria-hidden="true" className="stars pointer-events-none absolute inset-0 opacity-60" />
          <div aria-hidden="true" className="horizon" />

          <header className="relative border-b border-white/[0.07] bg-page/60 backdrop-blur-xl">
            <nav aria-label="Main" className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-7 px-6 py-3.5">
              <Link href="/runs" className="flex items-center gap-2.5 text-[15px] font-semibold tracking-[-0.01em]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="1.6" aria-hidden="true">
                  <path d="M4 17c3-8 6-8 8 0s5 8 8 0" />
                  <circle cx="12" cy="12" r="10" strokeOpacity=".35" />
                </svg>
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
