import type { Metadata } from "next";
import Link from "next/link";

import { UrlForm } from "@/components/UrlForm";
import { APP_URL } from "@/lib/env";

interface WebsiteAnalysePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const canonicalPath = "/website-analyse";
const pageUrl = `${APP_URL}${canonicalPath}`;

const faqs = [
  {
    question: "Was ist eine Website-Analyse von Shophebel?",
    answer:
      "Shophebel prüft Website, Shop oder Landingpage auf sichtbare Umsatzbremsen: Vertrauen, Klarheit, mobile Wirkung, Conversion-Signale, technische Reibung und KI-Sichtbarkeit.",
  },
  {
    question: "Ist die Analyse nur ein SEO-Check?",
    answer:
      "Nein. SEO ist ein Teil der Diagnose, aber der Fokus liegt auf Business-Auswirkungen: mehr qualifizierte Besucher, mehr Vertrauen, bessere Anfragen und weniger verlorene Kaufabsicht.",
  },
  {
    question: "Brauche ich technische Daten oder Tracking-Zugriff?",
    answer:
      "Für den Start reicht die URL. Die Analyse bewertet öffentlich sichtbare Signale und macht die wichtigsten Hebel ohne Login, Registrierung oder Analytics-Zugriff sichtbar.",
  },
  {
    question: "Was bekomme ich im Premium-Report?",
    answer:
      "Der Premium-Report erweitert die Sofortanalyse um priorisierte Maßnahmen, visuelle Befunde, konkrete Text- und Strukturhinweise sowie einen kompakten Umsetzungsplan.",
  },
];

const analysisAreas = [
  ["Trust", "Beweise, Sicherheit, Markenwirkung und Einwände, die vor der Anfrage entstehen."],
  ["Conversion", "CTA-Klarheit, Entscheidungswege, Reibung und Priorität der nächsten Aktion."],
  ["Mobile", "Erster Eindruck, Lesbarkeit, Above-the-fold Wirkung und Kontaktfaehigkeit unterwegs."],
  ["Content", "Nutzenversprechen, Angebotslogik, Suchintention und Antworttiefe für kaufnahe Besucher."],
  ["Performance", "Gefühlte Geschwindigkeit, Stabilitaet und visuelle Ruhe auf kritischen Einstiegsseiten."],
  ["AI Visibility", "Struktur, Entitäten, semantische Eindeutigkeit und Zitierbarkeit für KI-Antwortsysteme."],
];

const blockers = [
  {
    issue: "Der Besucher versteht den Wert nicht schnell genug.",
    impact: "Kalte Besucher springen ab, obwohl das Angebot relevant waere.",
    signal: "Hero, Angebot, CTA",
  },
  {
    issue: "Vertrauen entsteht erst zu spät.",
    impact: "Anfragen bleiben aus, weil Beweise, Referenzen oder Sicherheit fehlen.",
    signal: "Trust, Social Proof",
  },
  {
    issue: "Mobile Seiten fühlen sich nach Arbeit an.",
    impact: "Lokale und kaufnahe Nutzer brechen ab, bevor sie Kontakt aufnehmen.",
    signal: "Mobile UX",
  },
  {
    issue: "KI-Systeme erkennen die Autoritaet nicht.",
    impact: "Die Marke taucht in generativen Antworten und Vergleichssituationen seltener auf.",
    signal: "AI Visibility",
  },
];

const processSteps = [
  ["01", "URL analysieren", "Shophebel liest die öffentlich sichtbaren Signale deiner Website."],
  ["02", "Blocker priorisieren", "Die Analyse trennt Kosmetik von Hebeln mit echter Business-Wirkung."],
  ["03", "Visuell verstehen", "Screenshots, Scores und Befunde machen sichtbar, wo Vertrauen verloren geht."],
  ["04", "Premium planen", "Der Report verdichtet die nächsten Schritte zu einem klaren Maßnahmenplan."],
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

function AuditPreview() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(2,6,23,0.98))] shadow-[0_40px_140px_-80px_rgba(34,211,238,0.65)]">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300/80" />
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Live Audit Surface</span>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="border-b border-white/10 p-5 lg:border-b-0 lg:border-r">
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <div className="h-44 rounded-xl border border-white/10 bg-[linear-gradient(135deg,#0f172a_0%,#111827_42%,#082f49_100%)] p-4 sm:h-60">
              <div className="h-3 w-24 rounded-full bg-white/20" />
              <div className="mt-8 h-6 w-3/4 rounded-full bg-white/70" />
              <div className="mt-3 h-6 w-2/3 rounded-full bg-white/45" />
              <div className="mt-6 grid max-w-sm grid-cols-2 gap-3">
                <div className="h-11 rounded-xl bg-cyan-300/80" />
                <div className="h-11 rounded-xl border border-white/20 bg-white/10" />
              </div>
              <div className="mt-8 grid grid-cols-3 gap-3">
                <div className="h-16 rounded-xl bg-white/10" />
                <div className="h-16 rounded-xl bg-white/10" />
                <div className="h-16 rounded-xl bg-white/10" />
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <MiniMetric label="Trust gap" value="hoch" />
              <MiniMetric label="CTA clarity" value="62" />
              <MiniMetric label="AI fit" value="41" />
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="space-y-3">
            {[
              ["Revenue Blocker", "Hauptnutzen erst nach Scrolltiefe sichtbar", "kritisch"],
              ["Mobile Trust", "Beweise liegen unterhalb der ersten Interaktion", "hoch"],
              ["AI Visibility", "Leistungsversprechen nicht entitaetsklar formuliert", "mittel"],
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
  title: "Website Analyse für mehr Umsatz | Shophebel",
  description:
    "Premium Website-Analyse für Trust, Conversion, mobile Wirkung und AI Visibility. Erkenne Umsatzbremsen und starte direkt mit dem Shophebel Audit.",
  alternates: {
    canonical: canonicalPath,
  },
  openGraph: {
    title: "Website Analyse für mehr Umsatz | Shophebel",
    description:
      "Shophebel zeigt, welche Website-Probleme Vertrauen, Sichtbarkeit und Conversion kosten - inklusive visuellem Audit und Premium-Report.",
    url: pageUrl,
    siteName: "Shophebel Analyse",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Website Analyse für mehr Umsatz | Shophebel",
    description:
      "Finde Revenue Blockers, Trust-Lücken und AI-Visibility-Probleme mit einer hochwertigen Website-Analyse.",
  },
};

export default async function WebsiteAnalysePage({ searchParams }: WebsiteAnalysePageProps) {
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
              Website Intelligence für Wachstumsteams
            </div>

            <h1 className="mt-7 max-w-5xl text-4xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl lg:leading-[0.98]">
              Erkenne, welche Website-Probleme dich Umsatz kosten.
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">
              Shophebel analysiert nicht nur SEO. Die Analyse zeigt, wo Vertrauen, Klarheit, mobile Wirkung und KI-Sichtbarkeit verloren gehen - und welche Hebel als Erstes wirken.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="#analyse-start"
                className="inline-flex items-center justify-center rounded-2xl bg-cyan-300 px-5 py-4 text-sm font-bold text-slate-950 shadow-[0_18px_70px_-34px_rgba(34,211,238,0.95)] hover:bg-cyan-200"
              >
                Website kostenlos analysieren
              </a>
              <a
                href="#premium-report"
                className="inline-flex items-center justify-center rounded-2xl border border-white/12 bg-white/[0.04] px-5 py-4 text-sm font-bold text-white backdrop-blur-xl hover:bg-white/[0.08]"
              >
                Premium-Report ansehen
              </a>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              <MiniMetric label="Fokus" value="Umsatz" />
              <MiniMetric label="Output" value="Audit" />
              <MiniMetric label="Upgrade" value="Report" />
            </div>
          </div>

          <div className="lg:pl-2" id="analyse-start">
            <UrlForm initialUrl={initialUrl} />
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.025] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-500 sm:grid-cols-3">
          <p className="text-slate-300">Keine Registrierung</p>
          <p>Visuelle Befunde statt Tabellenfriedhof</p>
          <p>Premium-Report für Umsetzung</p>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <SectionIntro
            eyebrow="Analyseumfang"
            title="Ein Audit für die Dinge, die Besucher wirklich entscheiden lassen."
            copy="Die Website-Analyse verbindet technische Signale mit Wahrnehmung, Vertrauen und Suchintention. So entsteht ein Bild, das Geschaeftsfuehrer, Marketing und Umsetzungsteams gemeinsam verstehen."
          />

          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {analysisAreas.map(([title, copy]) => (
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
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="lg:sticky lg:top-32">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">Revenue Blockers</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Die teuersten Probleme sehen selten technisch aus.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-300">
              Schlechte Rankings sind oft nur das Symptom. Die größeren Verluste entstehen, wenn Besucher nicht sofort verstehen, warum sie bleiben, vertrauen oder handeln sollen.
            </p>
          </div>

          <div className="space-y-4">
            {blockers.map((blocker, index) => (
              <div
                key={blocker.issue}
                className="grid gap-4 rounded-2xl border border-white/10 bg-slate-900/55 p-5 shadow-2xl backdrop-blur-xl sm:grid-cols-[4rem_1fr_auto] sm:items-center"
              >
                <div className="grid h-14 w-14 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-sm font-bold text-cyan-100">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{blocker.issue}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{blocker.impact}</p>
                </div>
                <span className="w-fit rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                  {blocker.signal}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <SectionIntro
            eyebrow="Visual Audit"
            title="Screenshots machen sichtbar, wo Vertrauen bricht."
            copy="Shophebel betrachtet Seiten nicht als Checkliste, sondern als Entscheidungsoberflaeche. Der visuelle Audit zeigt, welche Elemente den ersten Eindruck tragen - und welche ihn verwischen."
          />
          <div className="mt-12">
            <AuditPreview />
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">AI Visibility</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Sichtbarkeit endet nicht mehr bei Google.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-300">
              Kaufentscheidungen entstehen zunehmend in KI-Antworten, Vergleichen und Zusammenfassungen. Shophebel prüft, ob dein Angebot klar genug ist, um als relevante Antwort verstanden zu werden.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(145deg,rgba(8,47,73,0.42),rgba(15,23,42,0.88))] p-6 shadow-2xl">
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Antwortsysteme erkennen</p>
              <div className="mt-5 space-y-3">
                {["Was bietet die Marke an?", "Für wen ist das Angebot relevant?", "Welche Beweise stuetzen die Aussage?", "Welche Region, Branche oder Kategorie passt?"].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                    <span className="h-2 w-2 rounded-full bg-cyan-300" />
                    <span className="text-sm font-medium text-slate-200">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="premium-report" className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-[linear-gradient(135deg,rgba(8,47,73,0.55),rgba(2,6,23,0.96)_48%,rgba(15,23,42,0.96))] shadow-[0_45px_160px_-85px_rgba(34,211,238,0.75)] lg:grid-cols-[1fr_0.9fr]">
          <div className="p-6 sm:p-10 lg:p-12">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-200">Premium Report</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Aus Diagnose wird ein klarer Umsetzungsplan.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
              Der Premium-Report ist für Teams gedacht, die nicht noch ein Dashboard brauchen, sondern eine belastbare Priorisierung: was ändern, warum es wirkt und womit starten.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {["Priorisierte Umsatzhebel", "Screenshot-Befunde", "Konkrete Copy- und Strukturhinweise", "7-Tage-Maßnahmenplan"].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm font-semibold text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 bg-slate-950/35 p-6 sm:p-10 lg:border-l lg:border-t-0 lg:p-12">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-sm font-semibold text-white">Report Snapshot</p>
              <div className="mt-5 space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    <span>Impact</span>
                    <span>hoch</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/10">
                    <div className="h-2 w-[86%] rounded-full bg-cyan-300" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    <span>Aufwand</span>
                    <span>mittel</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/10">
                    <div className="h-2 w-[54%] rounded-full bg-emerald-300" />
                  </div>
                </div>
                <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 p-4">
                  <p className="text-sm font-semibold text-amber-100">Erste Empfehlung</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Hero und Trust-Beweise zusammenführen, damit Besucher Nutzen und Sicherheit in einem Blick verstehen.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionIntro
            eyebrow="Prozess"
            title="Schnell genug für den ersten Impuls. Präzise genug für Entscheidungen."
            copy="Die Analyse ist bewusst schlank im Einstieg und tief genug im Ergebnis, damit daraus konkrete Arbeit entstehen kann."
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

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <SectionIntro
            eyebrow="FAQ"
            title="Kurz geklaert."
            copy="Die wichtigsten Fragen zur Website-Analyse, zum Premium-Report und zum Einstieg."
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
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">Startpunkt für bessere Entscheidungen</p>
          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            Lass deine Website nicht nur sichtbar sein. Lass sie überzeugen.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-300">
            Starte mit der kostenlosen Analyse und entscheide danach, ob du den Premium-Report für die Umsetzung brauchst.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href="#analyse-start"
              className="inline-flex items-center justify-center rounded-2xl bg-cyan-300 px-5 py-4 text-sm font-bold text-slate-950 hover:bg-cyan-200"
            >
              Analyse starten
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
