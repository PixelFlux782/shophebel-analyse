import type { Metadata } from "next";
import "@/styles/globals.css";
import { Navbar } from "@/components/navbar";

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
      <body className="min-h-full bg-slate-950">
        <Navbar />
        <div className="pt-24 sm:pt-28">{children}</div>
      </body>
    </html>
  );
}
