import type { Metadata } from "next";
import "@/styles/globals.css";
import { Navbar } from "@/components/navbar";
import { APP_URL } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: "Shophebel Analyse",
  description:
    "Shophebel findet digitale Schwächen bei Websites und Onlineshops - und zeigt konkrete Hebel für mehr Sichtbarkeit, Vertrauen und Umsatz.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="h-full antialiased">
      <body className="min-h-full bg-slate-950">
        <Navbar />
        <div className="pt-24 sm:pt-28">{children}</div>
      </body>
    </html>
  );
}
