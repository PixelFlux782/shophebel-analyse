import type { Metadata } from "next";
import Link from "next/link";

import { UrlForm } from "@/components/UrlForm";
import { APP_URL } from "@/lib/env";

interface ConversionOptimierungPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const canonicalPath = "/conversion-optimierung";
const pageUrl = `${APP_URL}${canonicalPath}`;

const faqs = [
  {
    question: "Was bedeutet Conversion-Optimierung mit Shophebel?",
    answer:
      "Shophebel analysiert, wo Website, Shop oder Landingpage Besucher verlieren: unklare Angebote, fehlendes Vertrauen, schwache CTAs, mobile Reibung und Formulare, die zu viele gute Anfragen kosten.",
  },
  {
    question: "Brauche ich erst mehr Traffic?",
    answer:
      "Nicht unbedingt. Wenn die Seite nicht überzeugt, macht mehr Traffic nur mehr Streuverlust sichtbar. Shophebel zeigt zuerst, welche Umsatzbremsen vorhandene Besucher am Handeln hindern.",
  },
  {
    question: "Ist das ein klassischer CRO-Test?",
    answer:
      "Nein. Die Analyse ist der strategische Einstieg vor Tests: Sie macht sichtbar, welche Trust-, UX- und Angebotsprobleme priorisiert werden sollten, bevor Budget in Experimente fliesst.",
  },
  {
    question: "Was liefert der Premium-Report?",
    answer:
      "Der Premium-Report verdichtet die Analyse zu einem Maßnahmenplan mit priorisierten Conversion-Hebeln, Screenshot-Befunden, konkreten CTA- und Formularhinweisen sowie nächsten Umsetzungsschritten.",
  },
];

const conversionBrakes = [
  {
    issue: "Der erste Eindruck beantwortet nicht, warum man jetzt handeln sollte.",
    impact: "Besucher bleiben passiv, obwohl Bedarf vorhanden ist.",
    signal: "Hero, Angebot",
  },
  {
    issue: "Vertrauensbeweise kommen erst nach der Entscheidung.",
    impact: "Interessenten zweifeln, bevor Referenzen, Garantien oder Beweise wirken.",
    signal: "Trust",
  },
  {
    issue: "CTAs konkurrieren statt zu führen.",
    impact: "Die nächste Aktion wirkt beliebig und Klicks verteilen sich ohne klare Priorität.",
    signal: "CTA Flow",
  },
  {
    issue: "Formulare fühlen sich nach Aufwand an.",
    impact: "Qualifizierte Anfragen brechen kurz vor dem Abschluss ab.",
    signal: "Lead Form",
  },
];

const trustFactors = [
  ["Klarheit", "Besucher verstehen in Sekunden, was sie bekommen und warum es relevant ist."],
  ["Beweise", "Referenzen, Ergebnisse, Garantien und konkrete Signale reduzieren Entscheidungsschmerz."],
  ["Fokus", "Layout, CTA und Text führen zu einer dominanten Handlung statt zu fuenf Nebenwegen."],
  ["Sicherheit", "Preise, Ablauf, Kontakt und Erwartung werden so klar, dass kein Risiko-Gefühl bleibt."],
  ["Relevanz", "Die Seite spricht kaufnahe Situationen an, nicht nur allgemeine Leistungsmerkmale."],
  ["Tempo", "Die Seite fühlt sich schnell, ruhig und kontrolliert an, besonders auf mobilen Einstiegen."],
];

const processSteps = [
  ["01", "Conversion-Signale lesen", "Shophebel prüft, wie klar Angebot, Trust und Handlung auf der Seite wirken."],
  ["02", "Bremsen priorisieren", "Aus sichtbaren Problemen werden Hebel mit Business-Wirkung statt Design-Meinungen."],
  ["03", "Vorher/Nachher ableiten", "Die Analyse zeigt, welche Änderung den Entscheidungsweg messbar klarer macht."],
  ["04", "Maßnahmen planen", "Der Premium-Report buendelt die nächsten Schritte für Website, Shop oder Landingpage."],
];

function SectionIntro({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">{title}</h2>
      <p className="mt-5 text-base leading-8 text-slate-300">{copy}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-2xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
    </div>
  );
}

function ConversionSurface() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(2,6,23,0.98))] shadow-[0_40px_140px_-80px_rgba(34,211,238,0.65)]">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300/80" />
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Conversion Decision Map</span>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="border-b border-white/10 p-5 lg:border-b-0 lg:border-r">
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <div className="h-48 rounded-xl border border-white/10 bg-[linear-gradient(135deg,#0f172a_0%,#111827_44%,#083344_100%)] p-4 sm:h-64">
              <div className="h-3 w-24 rounded-full bg-white/20" />
              <div className="mt-7 h-7 w-4/5 rounded-full bg-white/75" />
              <div className="mt-3 h-5 w-3/5 rounded-full bg-white/35" />
              <div className="mt-7 grid max-w-md grid-cols-[1.2fr_0.8fr] gap-3">
                <div className="h-12 rounded-xl bg-cyan-300/85 shadow-[0_0_40px_rgba(34,211,238,0.24)]" />
                <div className="h-12 rounded-xl border border-white/20 bg-white/10" />
              </div>
              <div className="mt-8 grid grid-cols-3 gap-3">
                <div className="h-16 rounded-xl border border-emerald-300/20 bg-emerald-300/10" />
                <div className="h-16 rounded-xl border border-white/10 bg-white/10" />
                <div className="h-16 rounded-xl border border-white/10 bg-white/10" />
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <MiniMetric label="Intent match" value="74" />
              <MiniMetric label="Trust gap" value="hoch" />
              <MiniMetric label="Form drag" value="31%" />
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="space-y-3">
            {[
              ["CTA Priorität", "Primäre Handlung konkurriert mit zwei Nebenpfaden", "hoch"],
              ["Trust Timing", "Beweise erscheinen erst nach dem ersten Zweifel", "kritisch"],
              ["Formular-Reibung", "Zu viele Felder vor dem ersten Commitment", "mittel"],
            ].map(([title, copy, level]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-sm font-semibold text-white">{title}</h3>
                  <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-200">
                    {level}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-400">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FaqSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
    />
  );
}

export const metadata: Metadata = {
  title: "Conversion-Optimierung für mehr Anfragen | Shophebel",
  description:
    "Premium Conversion-Analyse für Websites, Shops und Landingpages. Erkenne Trust-Lücken, CTA-Probleme und Umsatzbremsen, bevor du mehr Traffic einkaufst.",
  alternates: {
    canonical: canonicalPath,
  },
  openGraph: {
    title: "Conversion-Optimierung für mehr Anfragen | Shophebel",
    description:
      "Shophebel zeigt, warum Besucher nicht handeln: Trust, UX, mobile Wirkung, CTAs und Formulare - inklusive Premium-Report und Maßnahmenplan.",
    url: pageUrl,
    siteName: "Shophebel Analyse",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Conversion-Optimierung für mehr Anfragen | Shophebel",
    description:
      "Mehr Traffic bringt wenig, wenn die Seite nicht überzeugt. Finde Conversion-Bremsen mit Shophebel.",
  },
};

export default async function ConversionOptimierungPage({ searchParams }: ConversionOptimierungPageProps) {
  const params = await searchParams;
  const urlParam = params.url;
  const initialUrl = typeof urlParam === "string" ? urlParam : "";

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <FaqSchema />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(180deg,#020617_0%,#06111f_32%,#020617_68%,#030712_100%)]" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.13),transparent_42%),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:auto,72px_72px,72px_72px] opacity-70" />

      <section className="relative px-4 pb-20 pt-10 sm:px-6 lg:px-8 lg:pb-28">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.04fr_0.96fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-300 shadow-2xl backdrop-blur-xl">
              <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.9)]" />
              Conversion-Analyse für Websites und Shops
            </div>

            <h1 className="mt-7 max-w-5xl text-4xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl lg:leading-[0.98]">
              Mehr Traffic bringt nichts, wenn deine Seite nicht überzeugt.
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">
              Shophebel zeigt, wo Besucher Vertrauen verlieren, CTAs übersehen, Formulare abbrechen oder den Wert deines Angebots nicht schnell genug verstehen.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="#analyse-start"
                className="inline-flex items-center justify-center rounded-2xl bg-cyan-300 px-5 py-4 text-sm font-bold text-slate-950 shadow-[0_18px_70px_-34px_rgba(34,211,238,0.95)] hover:bg-cyan-200"
              >
                Conversion kostenlos analysieren
              </a>
              <a
                href="#premium-report"
                className="inline-flex items-center justify-center rounded-2xl border border-white/12 bg-white/[0.04] px-5 py-4 text-sm font-bold text-white backdrop-blur-xl hover:bg-white/[0.08]"
              >
                Maßnahmenplan ansehen
              </a>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              <MiniMetric label="Fokus" value="Anfragen" />
              <MiniMetric label="Hebel" value="Trust" />
              <MiniMetric label="Ergebnis" value="Fahrplan" />
            </div>
          </div>

          <div className="lg:pl-2" id="analyse-start">
            <UrlForm initialUrl={initialUrl} />
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.025] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-500 sm:grid-cols-3">
          <p className="text-slate-300">Mehr Wert aus vorhandenem Traffic</p>
          <p>Trust- und CTA-Befunde statt Bauchgefühl</p>
          <p>Premium-Report für Umsetzung</p>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="lg:sticky lg:top-32">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">Conversion-Bremsen</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Die größten Verluste passieren vor dem Klick.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-300">
              Conversion scheitert selten an einem Button allein. Meist fehlt die Kette aus klarem Wert, Vertrauen, Priorität und einem Abschluss, der sich einfach anfühlt.
            </p>
          </div>

          <div className="space-y-4">
            {conversionBrakes.map((brake, index) => (
              <div
                key={brake.issue}
                className="grid gap-4 rounded-2xl border border-white/10 bg-slate-900/55 p-5 shadow-2xl backdrop-blur-xl sm:grid-cols-[4rem_1fr_auto] sm:items-center"
              >
                <div className="grid h-14 w-14 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-sm font-bold text-cyan-100">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{brake.issue}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{brake.impact}</p>
                </div>
                <span className="w-fit rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                  {brake.signal}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <SectionIntro
            eyebrow="Trust und UX"
            title="Besucher konvertieren, wenn sich die Entscheidung leicht anfühlt."
            copy="Shophebel bewertet nicht nur, ob Elemente vorhanden sind. Entscheidend ist, ob sie im richtigen Moment wirken: vor Zweifel, vor Vergleich und vor dem Absprung."
          />

          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {trustFactors.map(([title, copy]) => (
              <div
                key={title}
                className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] p-6 shadow-[0_24px_80px_-60px_rgba(15,23,42,1)]"
              >
                <h3 className="text-lg font-semibold tracking-tight text-white">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">Mobile Conversion</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Mobile Nutzer entscheiden schneller und verzeihen weniger.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-300">
              Wenn Nutzen, Vertrauen und Kontakt auf kleinen Screens nicht sofort erfassbar sind, wird aus Interesse keine Anfrage. Shophebel macht diese Reibung sichtbar.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(145deg,rgba(8,47,73,0.42),rgba(15,23,42,0.88))] p-6 shadow-2xl">
            <div className="mx-auto max-w-xs rounded-[2rem] border border-white/15 bg-slate-950/80 p-4">
              <div className="h-2 w-20 rounded-full bg-white/15 mx-auto" />
              <div className="mt-6 h-5 w-3/4 rounded-full bg-white/70" />
              <div className="mt-3 h-4 w-4/5 rounded-full bg-white/25" />
              <div className="mt-6 h-12 rounded-xl bg-cyan-300/85" />
              <div className="mt-5 space-y-3">
                <div className="h-14 rounded-xl border border-emerald-300/20 bg-emerald-300/10" />
                <div className="h-14 rounded-xl border border-white/10 bg-white/[0.06]" />
                <div className="h-14 rounded-xl border border-white/10 bg-white/[0.06]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <SectionIntro
            eyebrow="CTA und Formular"
            title="Der Abschluss darf sich nicht wie ein Projekt anfühlen."
            copy="Ein guter CTA führt, ein gutes Formular entlastet. Shophebel findet die Stellen, an denen Besucher zwar interessiert sind, aber nicht genug Sicherheit für den nächsten Schritt haben."
          />
          <div className="mt-12">
            <ConversionSurface />
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-white/10 bg-slate-900/50 p-6 shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-rose-300">Vorher</p>
            <h3 className="mt-4 text-2xl font-semibold tracking-tight text-white">Traffic trifft auf Unsicherheit.</h3>
            <div className="mt-6 space-y-3">
              {["Unklarer Hauptnutzen", "Trust-Beweise zu tief", "Mehrere gleich laute CTAs", "Formular fragt zu frueh zu viel"].map((item) => (
                <div key={item} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-slate-300">
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[2rem] border border-cyan-300/20 bg-[linear-gradient(145deg,rgba(8,47,73,0.48),rgba(15,23,42,0.86))] p-6 shadow-[0_35px_120px_-80px_rgba(34,211,238,0.8)]">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">Nachher</p>
            <h3 className="mt-4 text-2xl font-semibold tracking-tight text-white">Der Entscheidungsweg fühlt sich logisch an.</h3>
            <div className="mt-6 space-y-3">
              {["Wertversprechen in einem Blick", "Beweise vor dem Zweifel", "Eine dominante nächste Aktion", "Formular mit niedriger Einstiegshuerde"].map((item) => (
                <div key={item} className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm font-medium text-cyan-50">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionIntro
            eyebrow="SHOPHEBEL Prozess"
            title="Von sichtbarer Reibung zu priorisierten Conversion-Hebeln."
            copy="Der Prozess ist schlank genug für schnelle Entscheidungen und konkret genug, damit Design, Text und Umsetzung am selben Problem arbeiten."
          />
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {processSteps.map(([number, title, copy]) => (
              <div key={number} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                <p className="text-sm font-bold text-cyan-300">{number}</p>
                <h3 className="mt-6 text-lg font-semibold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="premium-report" className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-[linear-gradient(135deg,rgba(8,47,73,0.55),rgba(2,6,23,0.96)_48%,rgba(15,23,42,0.96))] shadow-[0_45px_160px_-85px_rgba(34,211,238,0.75)] lg:grid-cols-[1fr_0.9fr]">
          <div className="p-6 sm:p-10 lg:p-12">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-200">Premium Report</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Ein Maßnahmenplan für mehr Anfragen, nicht mehr Meetings.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
              Der Premium-Report zeigt, welche Conversion-Hebel zuerst wirken sollten: Trust-Aufbau, CTA-Hierarchie, Formularentlastung, mobile Prioritäten und konkrete Textverbesserungen.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {["Priorisierte Conversion-Hebel", "CTA- und Formularbefunde", "Trust- und UX-Empfehlungen", "7-Tage-Maßnahmenplan"].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm font-semibold text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 bg-slate-950/35 p-6 sm:p-10 lg:border-l lg:border-t-0 lg:p-12">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-sm font-semibold text-white">Report-Auszug</p>
              <div className="mt-5 space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    <span>Conversion Impact</span>
                    <span>hoch</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/10">
                    <div className="h-2 w-[88%] rounded-full bg-cyan-300" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    <span>Umsetzung</span>
                    <span>schnell</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/10">
                    <div className="h-2 w-[68%] rounded-full bg-emerald-300" />
                  </div>
                </div>
                <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 p-4">
                  <p className="text-sm font-semibold text-amber-100">Erste Empfehlung</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Primären CTA staerken, Trust-Beweise direkt daneben platzieren und das Formular auf den ersten Commitment-Schritt reduzieren.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <SectionIntro
            eyebrow="FAQ"
            title="Kurz geklaert."
            copy="Die wichtigsten Fragen zur Conversion-Optimierung, zum Analyse-Einstieg und zum Premium-Report."
          />
          <div className="mt-10 divide-y divide-white/10 rounded-[2rem] border border-white/10 bg-slate-900/45">
            {faqs.map((faq) => (
              <details key={faq.question} className="group p-6">
                <summary className="cursor-pointer list-none text-base font-semibold text-white">
                  <span className="flex items-center justify-between gap-6">
                    {faq.question}
                    <span className="text-cyan-300 group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-4 text-sm leading-7 text-slate-400">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 pt-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 text-center shadow-2xl sm:p-10 lg:p-14">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">Startpunkt für mehr Anfragen</p>
          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            Bevor du mehr Traffic kaufst, finde heraus, warum vorhandene Besucher nicht handeln.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-300">
            Starte mit der kostenlosen Analyse und nutze den Premium-Report, wenn du aus Befunden konkrete Umsetzung machen willst.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href="#analyse-start"
              className="inline-flex items-center justify-center rounded-2xl bg-cyan-300 px-5 py-4 text-sm font-bold text-slate-950 hover:bg-cyan-200"
            >
              Conversion analysieren
            </a>
            <Link
              href="/analyse"
              className="inline-flex items-center justify-center rounded-2xl border border-white/12 bg-white/[0.04] px-5 py-4 text-sm font-bold text-white hover:bg-white/[0.08]"
            >
              Zum kompakten Tool
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
