import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CCTS Atlas | Compliance Desk",
  description: "Every obligated entity under India's carbon market, with baseline, targets and implied cuts.",
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
              Compliance Desk
            </Link>
            <nav className="flex items-center gap-5 text-sm text-muted">
              <Link href="/" className="hover:text-ink">Atlas</Link>
              <Link href="/lab" className="hover:text-ink">Strategy Lab</Link>
              <a href="/#method" className="hover:text-ink">Method</a>
              <span className="rounded-full border border-line px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-accent">Beta</span>
            </nav>
          </div>
        </header>
        <div className="flex-1">{children}</div>
        <footer className="border-t border-line py-6 text-center text-xs text-muted">
          Compliance Desk · Built on MoEFCC gazette data · Illustrative analysis, not advice
        </footer>
      </body>
    </html>
  );
}
