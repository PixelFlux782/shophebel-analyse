"use client";

import Image from "next/image";
import Link from "next/link";

import { ANALYSE_TOOL_URL, SHOPHEBEL_HOME_URL } from "@/lib/env";

function homepageAnchor(id: string) {
  return `${SHOPHEBEL_HOME_URL.replace(/\/$/, "")}/#${id}`;
}

const homepageLinks = [
  { label: "Analyse", href: homepageAnchor("analyse") },
  { label: "Leistungen", href: homepageAnchor("leistungen") },
  { label: "Plattform", href: homepageAnchor("plattform") },
  { label: "Preise", href: homepageAnchor("preise") },
];

export function Navbar() {
  return (
    <nav className="fixed left-0 right-0 top-0 z-50 flex justify-center p-3 sm:p-5">
      <div className="flex w-full max-w-7xl items-center justify-between rounded-2xl border border-white/10 bg-black/50 px-4 py-3 shadow-[0_0_40px_rgba(37,99,235,0.10)] backdrop-blur-xl sm:px-8 sm:py-4">
        <div className="flex min-w-0 items-center gap-5 lg:gap-8">
          <Link href={SHOPHEBEL_HOME_URL} className="group flex items-center gap-3 transition-opacity hover:opacity-80">
            <Image
              src="/branding/logo_only_letter.jpeg"
              alt="Logo"
              width={26}
              height={26}
              className="rounded-sm grayscale brightness-200"
              priority
            />
            <span className="text-base font-semibold uppercase tracking-tighter text-white/90">SHOPHEBEL</span>
          </Link>

          <div className="hidden items-center gap-8 text-sm font-medium text-white/75 md:flex">
            {homepageLinks.map((item) => (
              <Link key={item.label} href={item.href} className="transition-all duration-300 hover:text-white">
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <Link
          href={ANALYSE_TOOL_URL}
          className="hidden rounded-lg bg-blue-600/80 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-600 sm:inline-flex"
        >
          Website analysieren
        </Link>
      </div>
    </nav>
  );
}
