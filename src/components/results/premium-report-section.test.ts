import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PremiumReportSection } from "@/components/results/premium-report-section";
import type { PremiumReport } from "@/lib/premium/buildPremiumReport";

function createReport(): PremiumReport {
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
  };
}

describe("PremiumReportSection", () => {
  it("rendert den schlanken Premium-Bericht mit KI-Beratung und PDF-Link", () => {
    const markup = renderToStaticMarkup(
      React.createElement(PremiumReportSection, {
        report: createReport(),
        analysisId: "analysis-123",
      }),
    );

    expect(markup).toContain("Premium freigeschaltet");
    expect(markup).toContain("Premium-Bericht inkl. KI-Beratung");
    expect(markup).toContain("Vollstaendige visuelle Analyse");
    expect(markup).toContain("KI-Premiumbericht");
    expect(markup).toContain("PDF herunterladen");
    expect(markup).toContain('href="/api/premium-report/analysis-123/pdf"');
    expect(markup).toContain("Kurzueberblick");
    expect(markup).toContain("Conversion-Hypothese");
    expect(markup).toContain("KI-Einordnung");
    expect(markup).toContain("Was bedeutet das konkret?");
    expect(markup).toContain("Nächste sinnvolle Schritte");
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
});
