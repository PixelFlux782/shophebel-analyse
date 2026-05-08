import type { Metadata } from "next";
import Link from "next/link";
import "@/styles/globals.css";
import { ANALYSE_TOOL_URL, SCOUT_TOOL_URL, SHOPHEBEL_HOME_URL } from "@/lib/env";

export const metadata: Metadata = {
  title: "Shophebel Analyse",
  description:
    "Shophebel findet digitale Schwaechen bei Websites und Onlineshops - und zeigt konkrete Hebel fuer mehr Sichtbarkeit, Vertrauen und Umsatz.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <Link href={ANALYSE_TOOL_URL} className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-900">
              Shophebel Analyse
            </Link>
            <nav className="flex flex-wrap gap-3 text-sm text-slate-600">
              <Link href={SHOPHEBEL_HOME_URL} className="hover:text-slate-900">Zur Shophebel Website</Link>
              <Link href={ANALYSE_TOOL_URL} className="hover:text-slate-900">Website-Analyse</Link>
              <Link href={SCOUT_TOOL_URL} className="hover:text-slate-900">Scout</Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
