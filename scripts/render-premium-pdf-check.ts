import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { pathToFileURL } from "url";

import puppeteer from "puppeteer";

import { countPdfPages, renderPremiumReportPdf } from "@/lib/premium/premiumReportPdf";
import type { PremiumReport } from "@/lib/premium/buildPremiumReport";
import type { StoredAnalysisResult } from "@/lib/analysisStore";
import type { AnalysisResult } from "@/types/analysis";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createAnalysis(): StoredAnalysisResult {
  const now = "2026-07-03T12:00:00.000Z";
  const analysis: AnalysisResult = {
    url: "https://shophebel-demo.test/",
    createdAt: now,
    requestedUrl: "https://shophebel-demo.test",
    scannedAt: now,
    analysisMode: "rendered",
    finalUrl: "https://shophebel-demo.test/",
    technicalNotes: [],
    visualPreviewAvailable: false,
    isPremium: true,
    totalFindings: 4,
    visibleFindings: 4,
    overallScore: 64,
    categories: {
      seo: { score: 76, label: "SEO", summary: "Solide Auffindbarkeit.", checks: [] },
      performance: { score: 68, label: "Mobile UX", summary: "Mobile Führung braucht mehr Klarheit.", checks: [] },
      trust: { score: 58, label: "Vertrauen", summary: "Vertrauenssignale kommen zu spät.", checks: [] },
      conversion: { score: 54, label: "Anfrageklarheit", summary: "Der nächste Schritt ist noch zu schwach.", checks: [] },
      design: { score: 66, label: "Design", summary: "Visuelle Hierarchie ist ausbaufähig.", checks: [] },
      aiVisibility: { score: 72, label: "KI-Sichtbarkeit", summary: "Grundstruktur ist vorhanden.", checks: [] },
    },
    quickWins: [],
    criticalIssues: [],
    premiumInsightsPreview: [],
    revenueBlockers: [],
    measures: [],
    categoryScores: {},
    findings: [],
    recommendations: [],
    aiSuggestions: [],
  };

  return {
    id: "premium-pdf-quality-check",
    analysis,
    createdAt: now,
    isDemo: false,
    paymentStatus: "paid",
    paidAt: now,
  };
}

function createReport(): PremiumReport {
  return {
    isPaid: true,
    premiumSummary: {
      headline: "Premium Anfrage- und Vertrauens-Audit",
      mainReason: "Der wahrscheinlich größte Bremsfaktor ist: Der sichtbare Startbereich erklärt Nutzen und nächsten Schritt noch nicht schnell genug.",
      firstFocus: "Starte mit Hauptnutzen, Vertrauensbeleg und primärem Button im ersten Sichtbereich.",
      businessRelevance: "Mehr Klarheit kann bestehende Besucher schneller zur Anfrage oder zum Kauf führen.",
      fastestWin: "Button und Nutzenversprechen im Startbereich schärfen.",
    },
    topRevenueBlockers: [
      {
        title: "Nächster Schritt ist nicht stark genug sichtbar",
        category: "Anfrageklarheit",
        severity: "kritisch",
        whyItMatters: "Besucher müssen selbst herausfinden, welcher Schritt sinnvoll ist.",
        likelyBusinessImpact: "Das erhöht Reibung direkt vor Anfrage oder Kauf.",
        recommendedFix: "Primären Button, Nutzenversprechen und Vertrauenssignal im sichtbaren Startbereich bündeln.",
        effort: "niedrig",
        priority: 1,
      },
      {
        title: "Vertrauenssignale erscheinen zu spät",
        category: "Vertrauen",
        severity: "wichtig",
        whyItMatters: "Ohne schnelle Sicherheit steigt die Abbruchwahrscheinlichkeit.",
        likelyBusinessImpact: "Qualifizierte Besucher vergleichen länger oder springen ab.",
        recommendedFix: "Bewertungen, Referenzen und Kontaktmöglichkeiten vor der ersten Entscheidung platzieren.",
        effort: "mittel",
        priority: 2,
      },
    ],
    priorityRoadmap: [
      "Startbereich auf eine klare Aussage, einen primären Button und einen Vertrauensbeleg reduzieren.",
      "Mobile Schriftgrößen, Abstände und Button-Reihenfolge auf dem ersten Smartphone-Viewport prüfen.",
      "Kontaktmöglichkeiten und Belege direkt vor dem Anfrageweg sichtbar machen.",
    ],
    quickImplementationPlan: [
      {
        days: "Tag 1-2",
        focus: "Startbereich schärfen",
        actions: ["Hauptnutzen kürzen.", "Primären Button eindeutiger formulieren.", "Ersten Vertrauensbeleg ergänzen."],
      },
      {
        days: "Tag 3-5",
        focus: "Vertrauen und Mobile UX",
        actions: ["Kontaktmöglichkeiten früher platzieren.", "Mobile Abstände prüfen.", "Nebeninformationen optisch zurücknehmen."],
      },
      {
        days: "Tag 6-7",
        focus: "Kontrolle",
        actions: ["Analyse erneut ausführen.", "Bewertung und neue Reibungspunkte vergleichen."],
      },
    ],
    visualAuditNotes: [
      {
        area: "Sichtbarer Startbereich",
        note: "Nutzen, Vertrauensbeleg und nächster Schritt sollten als klare Blickachse erscheinen.",
      },
      {
        area: "Mobile Ansicht",
        note: "Schriftgrößen und Button-Abstände müssen ohne Suchen erfassbar bleiben.",
      },
    ],
    conversionHypothesis:
      "Wenn Klarheit, Vertrauen und der nächste Schritt sichtbarer werden, verstehen Besucher schneller, warum sie handeln sollen. Dadurch sinkt Reibung im sichtbaren Startbereich.",
    opportunityRoadmap: {
      title: "Priorisierter Maßnahmenplan",
      summary: "Die stärksten Potenziale werden nach Wirkung und Umsetzbarkeit priorisiert.",
      items: [
        {
          title: "Startbereich als Anfrage-Hebel schärfen",
          businessImpact: "Besucher verstehen schneller, warum sie anfragen sollten.",
          suggestedModule: "Sofortmaßnahmen für mehr Anfragen",
          suggestedService: "Quick Fix Sprint",
          implementationEffort: "niedrig",
          expectedEffect: "Mehr qualifizierte Anfragen aus bestehendem Traffic.",
          nextStep: "Als erste Maßnahme umsetzen.",
          priorityScore: 94,
        },
      ],
    },
  };
}

async function main() {
  const outputDir = path.join(process.cwd(), "tmp", "premium-pdf-quality-check");
  await mkdir(outputDir, { recursive: true });

  const pdf = await renderPremiumReportPdf({
    analysis: createAnalysis(),
    report: createReport(),
    consultantNotes: {
      executiveComment: "Manuell geprüft: Startbereich und Anfrageweg zuerst priorisieren.",
      priorityOverrideNotes: "Die ersten zwei Maßnahmen haben die höchste geschäftliche Wirkung.",
      customActionItems: ["Kontaktmöglichkeiten vor dem Formular sichtbarer machen."],
    },
  });
  const pdfPath = path.join(outputDir, "premium-report-quality-check.pdf");
  await writeFile(pdfPath, pdf);

  const pageCount = countPdfPages(pdf);
  const pages = Array.from(new Set([1, 2, 3, 4, pageCount].filter((page) => page >= 1 && page <= pageCount)));
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--allow-file-access-from-files"],
  });

  try {
    for (const pageNumber of pages) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1240, height: 1754, deviceScaleFactor: 1 });
      await page.goto(`${pathToFileURL(pdfPath).href}#page=${pageNumber}`, { waitUntil: "networkidle0" });
      await wait(1200);
      await page.screenshot({
        path: path.join(outputDir, `page-${String(pageNumber).padStart(2, "0")}.png`),
        fullPage: false,
      });
      await page.close();
    }
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify({ pdfPath, pageCount, renderedPages: pages }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
