import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FreeAuditPreview } from "@/components/results/free-audit-preview";
import { PremiumReportSection } from "@/components/results/premium-report-section";
import { RecommendationsList } from "@/components/results/recommendations-list";
import { validateReportCopyQuality } from "@/lib/report/reportCopy";
import type { PremiumReport } from "@/lib/premium/buildPremiumReport";
import type { Finding, Recommendation } from "@/types/analysis";

function visibleText(markup: string) {
  return markup
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function expectCleanOutput(markup: string) {
  const quality = validateReportCopyQuality(visibleText(markup));

  expect(quality.isValid, JSON.stringify(quality)).toBe(true);
}

const recommendations: Recommendation[] = [
  {
    title: "CTA im Hero schaerfen",
    text: "Primaeren CTA und Trust-Beleg frueher sichtbar machen.",
    description: "Primaeren CTA und Trust-Beleg frueher sichtbar machen.",
    impact: "high",
    effort: "low",
    category: "Conversion",
    weight: 1,
  },
  {
    title: "Trust Proof ausbauen",
    text: "Bewertungen und Kontaktmoeglichkeiten naeher an den Kaufbereich bringen.",
    description: "Bewertungen und Kontaktmoeglichkeiten naeher an den Kaufbereich bringen.",
    impact: "medium",
    effort: "medium",
    category: "Trust",
    weight: 2,
  },
];

const findings: Finding[] = [
  {
    title: "Hero CTA ist unklar",
    description: "Der naechste Schritt wird above the fold nicht klar genug.",
    category: "conversion",
    priority: "high",
    status: "warning",
  },
];

function premiumReport(): PremiumReport {
  return {
    isPaid: true,
    premiumSummary: {
      headline: "Premium Conversion- und Trust-Audit",
      mainReason: "Executive Summary: Hero und CTA bremsen den naechsten Schritt.",
      firstFocus: "Primaeren CTA frueher sichtbar machen.",
      businessRelevance: "Mehr Vertrauen kann Anfragen staerken.",
      fastestWin: "Quick Fix im Hero",
    },
    topRevenueBlockers: [
      {
        title: "CTA im Hero ist unklar",
        category: "Conversion",
        severity: "kritisch",
        whyItMatters: "Besucher erkennen den naechsten Schritt nicht.",
        likelyBusinessImpact: "Conversion Impact sinkt.",
        recommendedFix: "Primaeren CTA schaerfen.",
        effort: "niedrig",
        priority: 1,
      },
    ],
    opportunityRoadmap: {
      title: "Opportunity Roadmap",
      summary: "Quick Fix Sprint fuer die staerksten Hebel.",
      items: [
        {
          title: "Hero CTA schaerfen",
          businessImpact: "Mehr Besucher verstehen den naechsten Schritt.",
          suggestedModule: "Conversion Quick Wins",
          suggestedService: "Quick Fix Sprint",
          implementationEffort: "niedrig",
          expectedEffect: "Mehr qualifizierte Anfragen.",
          nextStep: "Als Quick Fix priorisieren.",
          priorityScore: 91,
        },
      ],
    },
    priorityRoadmap: ["Primaeren CTA und Trust-Beleg frueher zeigen."],
    quickImplementationPlan: [
      {
        days: "Tag 1-2",
        focus: "Hero und CTA",
        actions: ["CTA pruefen.", "Trust Proof ergaenzen."],
      },
    ],
    visualAuditNotes: [
      {
        area: "Visual Audit",
        note: "Full Page Screenshot fuer naechste Massnahmen pruefen.",
      },
    ],
    conversionHypothesis: "Wenn Hero, Trust und CTA klarer werden, steigt die Anfragewahrscheinlichkeit.",
  };
}

describe("Report copy quality for UI outputs", () => {
  it("sichert die Free-Ausgabe ab", () => {
    const markup = renderToStaticMarkup(
      React.createElement(FreeAuditPreview, {
        quickWins: recommendations,
        criticalIssues: [],
        fallbackFindings: findings,
      }),
    );

    expect(markup).toContain("Button im Startbereich schärfen");
    expectCleanOutput(markup);
  });

  it("sichert die Vollanalyse-Ausgabe ab", () => {
    const markup = renderToStaticMarkup(
      React.createElement(RecommendationsList, {
        recommendations,
        isPremium: true,
      }),
    );

    expect(markup).toContain("Wirkung hoch");
    expect(markup).toContain("Aufwand niedrig");
    expectCleanOutput(markup);
  });

  it("sichert die Premium-Ausgabe ab", () => {
    const markup = renderToStaticMarkup(
      React.createElement(PremiumReportSection, {
        report: premiumReport(),
        analysisId: "analysis-123",
      }),
    );

    expect(markup).toContain("Dein Premium-Bericht");
    expect(markup).toContain("Sofortmaßnahme");
    expectCleanOutput(markup);
  });
});
