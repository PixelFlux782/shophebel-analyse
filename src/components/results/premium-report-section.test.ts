import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PremiumReportSection } from "@/components/results/premium-report-section";
import type { PremiumReport } from "@/lib/premium/buildPremiumReport";

function createReport(overrides: Partial<PremiumReport> = {}): PremiumReport {
  return {
    isPaid: true,
    premiumSummary: {
      headline: "Premium Conversion- und Trust-Audit",
      mainReason: "Der wahrscheinlich groesste Bremsfaktor ist: CTA unklar.",
      firstFocus: "Starte mit dem naechsten Schritt.",
      businessRelevance: "Mehr Klarheit fuer bestehende Besucher.",
      fastestWin: "Hero CTA schaerfen",
    },
    topRevenueBlockers: [
      {
        title: "CTA nicht sichtbar genug",
        category: "Conversion",
        severity: "kritisch",
        whyItMatters: "Besucher erkennen den naechsten Schritt nicht.",
        likelyBusinessImpact: "Mehr Abbrueche im oberen Seitenbereich.",
        recommendedFix: "Primaeren CTA oberhalb der Falz schaerfen.",
        effort: "niedrig",
        priority: 1,
      },
    ],
    priorityRoadmap: ["Primaeren CTA oberhalb der Falz schaerfen."],
    quickImplementationPlan: [
      {
        days: "Tag 1-2",
        focus: "Hero und CTA",
        actions: ["CTA sichtbarer machen."],
      },
    ],
    visualAuditNotes: [
      {
        area: "Above the fold",
        note: "Nutzenversprechen und CTA pruefen.",
      },
    ],
    conversionHypothesis: "Wenn der CTA klarer wird, steigen Anfragen.",
    ...overrides,
  };
}

describe("PremiumReportSection", () => {
  it("rendert den Premium-Bericht als eigene Produktbuehne mit KI-Beratung und PDF-Link", () => {
    const markup = renderToStaticMarkup(
      React.createElement(PremiumReportSection, {
        report: createReport(),
        analysisId: "analysis-123",
      }),
    );

    expect(markup).toContain("Premium freigeschaltet");
    expect(markup).toContain("Premium-Bericht inkl. KI-Beratung");
    expect(markup).toContain("wichtigste 3 Hebel");
    expect(markup).toContain("PDF-Bericht");
    expect(markup).toContain("PDF-Bericht herunterladen");
    expect(markup).toContain('href="/api/premium-report/analysis-123/pdf"');
    expect(markup).toContain("Kurz");
    expect(markup).toContain("Conversion-Hypothese");
    expect(markup).toContain("KI-Einordnung");
    expect(markup).toContain("Wichtigste 3 Hebel");
    expect(markup).toContain("7-Tage-Fahrplan und PDF");
    expect(markup).not.toContain("Top-Umsatzbremsen");
    expect(markup).not.toContain("Priorisierter Massnahmenplan");
    expect(markup).not.toContain("Executive Summary");
    expect(markup).not.toContain("Visual Audit Notes");
    expect(markup).not.toContain("Above the fold");
    expect(markup).not.toContain("CTA unklar");
  });

  it("bettet optionale Beratungsinhalte ein, statt einen zweiten Report zu stapeln", () => {
    const markup = renderToStaticMarkup(
      React.createElement(
        PremiumReportSection,
        {
          report: createReport(),
        },
        React.createElement("div", null, "Eingebettete KI-Einordnung"),
      ),
    );

    expect(markup).toContain("Eingebettete KI-Einordnung");
    expect(markup).not.toContain("Umsetzung besprechen");
  });

  it("rendert die Premium-Mehrseitenanalyse als Website-System statt als Stapel", () => {
    const markup = renderToStaticMarkup(
      React.createElement(PremiumReportSection, {
        report: createReport({
          websiteAnalysis: {
            pages: [
              {
                url: "https://shop.test/",
                label: "Startseite",
                role: "home",
                reason: "Startpunkt",
                analysisStatus: "analyzed",
                score: 70,
                strengths: ["SEO solide"],
                problems: ["CTA unklar"],
                recommendation: "CTA klarer formulieren.",
                shortDiagnosis: "Startseite mit CTA-Hebel.",
              },
              {
                url: "https://shop.test/kontakt",
                label: "Kontakt",
                role: "contact",
                reason: "Kontakt-Signal",
                analysisStatus: "analyzed",
                score: 82,
                strengths: ["Kontakt sichtbar"],
                problems: ["Trust fehlt"],
                recommendation: "Trust am Formular zeigen.",
                shortDiagnosis: "Kontaktseite mit Trust-Hebel.",
              },
            ],
            overallWebsiteScore: 76,
            crossPageDiagnosis: "Die Website wurde als System bewertet.",
            repeatedProblems: ["CTA unklar"],
            strongestPage: { label: "Kontakt", url: "https://shop.test/kontakt", score: 82 },
            weakestPage: { label: "Startseite", url: "https://shop.test/", score: 70 },
            conversionPathAssessment: "Angebot und Kontakt logisch verbinden.",
            trustConsistencyAssessment: "Trust konsistent machen.",
            navigationAssessment: "Navigation auf CTA ausrichten.",
            topPrioritiesWebsiteWide: ["CTA vereinheitlichen"],
            sevenDayPlan: [
              { days: "Tag 1-2", focus: "Klarheit", actions: ["CTA pruefen."] },
              { days: "Tag 3-5", focus: "Trust", actions: ["Trust platzieren."] },
              { days: "Tag 6-7", focus: "Kontrolle", actions: ["Mobile pruefen."] },
            ],
            missingPageTypes: ["offer"],
          },
        }),
      }),
    );

    expect(markup).toContain("Website-Gesamturteil");
    expect(markup).toContain("Seitenübersicht");
    expect(markup).toContain("Website-weite Muster");
    expect(markup).toContain("Einzelanalysen");
    expect(markup).toContain("Priorisierter 7-Tage-Plan");
    expect(markup).toContain("76/100");
    expect(markup).toContain("Kontakt");
  });
});
