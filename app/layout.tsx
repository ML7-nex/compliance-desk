import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/lib/brand";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: `Cement Atlas | ${BRAND}`,
  description: "Every cement plant with a legal carbon target in India, with baseline, targets and implied cuts, plus a tool to price the options.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
              <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
                <rect x="1" y="1" width="22" height="22" rx="6" fill="var(--accent)" />
                <path d="M5 16l4-5 3 3 6-8" fill="none" stroke="var(--accent-ink)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {BRAND}
            </Link>
            <nav className="flex items-center gap-3 text-sm text-muted sm:gap-5">
              <Link href="/" className="hover:text-ink">Atlas</Link>
              <Link href="/lab" className="hover:text-ink">Strategy Lab</Link>
              <Link href="/impact" className="hover:text-ink">Impact</Link>
              <Link href="/#method" className="hidden hover:text-ink sm:inline">Method</Link>
              <span className="hidden rounded-full border border-line px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-accent sm:inline">Beta</span>
            </nav>
          </div>
        </header>
        <div className="flex-1">{children}</div>
        <footer className="border-t border-line py-6 text-center text-xs text-muted">
          {BRAND} · Built on MoEFCC gazette data · Illustrative analysis, not advice
        </footer>
      </body>
    </html>
  );
}
