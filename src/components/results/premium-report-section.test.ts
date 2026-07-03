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
      mainReason: "Der wahrscheinlich größte Bremsfaktor ist: CTA unklar.",
      firstFocus: "Starte mit dem nächsten Schritt.",
      businessRelevance: "Mehr Klarheit für bestehende Besucher.",
      fastestWin: "Hero CTA schärfen",
    },
    topRevenueBlockers: [
      {
        title: "CTA nicht sichtbar genug",
        category: "Conversion",
        severity: "kritisch",
        whyItMatters: "Besucher erkennen den nächsten Schritt nicht.",
        likelyBusinessImpact: "Mehr Abbrüche im oberen Seitenbereich.",
        recommendedFix: "Primären CTA oberhalb der Falz schärfen.",
        effort: "niedrig",
        priority: 1,
      },
    ],
    priorityRoadmap: ["Primären CTA oberhalb der Falz schärfen."],
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
        note: "Nutzenversprechen und CTA prüfen.",
      },
    ],
    conversionHypothesis: "Wenn der CTA klarer wird, steigen Anfragen.",
  };
}

describe("PremiumReportSection", () => {
  it("rendert deutsche Premium-Labels und einen prominenten PDF-Link", () => {
    const markup = renderToStaticMarkup(
      React.createElement(PremiumReportSection, {
        report: createReport(),
        analysisId: "analysis-123",
      }),
    );

    expect(markup).toContain("Premium freigeschaltet");
    expect(markup).toContain("Dein Premium-Bericht");
    expect(markup).toContain("Priorisierte Umsatzbremsen, 7-Tage-Fahrplan und konkrete Maßnahmen");
    expect(markup).toContain("Premium-PDF herunterladen");
    expect(markup).toContain('href="/api/premium-report/analysis-123/pdf"');
    expect(markup).toContain("Management-Zusammenfassung");
    expect(markup).toContain("Conversion-Hypothese");
    expect(markup).toContain("Top-Umsatzbremsen");
    expect(markup).toContain("Visuelle Prüfung");
    expect(markup).toContain("sichtbarer Startbereich");
    expect(markup).toContain("Primären Button oberhalb der Falz schärfen");
    expect(markup).toContain("Premium Anfrage-/Kaufwahrscheinlichkeit- und Vertrauen-Audit");
    expect(markup).not.toContain("Executive Summary");
    expect(markup).not.toContain("Visual Audit Notes");
    expect(markup).not.toContain("Above the fold");
    expect(markup).not.toContain("CTA");
    expect(markup).not.toContain("Ma\u00c3\u0178nahmen");
  });

  it("rendert den optionalen Maßnahmenplan", () => {
    const report: PremiumReport = {
      ...createReport(),
      opportunityRoadmap: {
        title: "Priorisierter Maßnahmenplan",
        summary: "Die stärksten Chancen werden nach Wirkung und Aufwand geordnet.",
        items: [
          {
            title: "Hero-Botschaft als Anfrage-Hebel schärfen",
            businessImpact: "Besucher verstehen schneller, warum sie anfragen sollten.",
            suggestedModule: "Conversion Quick Wins",
            suggestedService: "Quick Fix Sprint",
            implementationEffort: "niedrig",
            expectedEffect: "Mehr qualifizierte Anfragen aus bestehendem Traffic.",
            nextStep: "Als Quick Fix priorisieren.",
            priorityScore: 94,
          },
        ],
      },
    };
    const markup = renderToStaticMarkup(
      React.createElement(PremiumReportSection, {
        report,
      }),
    );

    expect(markup).toContain("Priorisierter Maßnahmenplan");
    expect(markup).toContain("Geschäftliche Wirkung");
    expect(markup).toContain("Empfohlener Umsetzungspfad");
    expect(markup).toContain("Begleitung");
    expect(markup).toContain("Erwarteter Effekt");
    expect(markup).toContain("Nächster Schritt");
    expect(markup).toContain("Sofortmaßnahmen für mehr Anfragen");
    expect(markup).toContain("Sofort-Umsetzung");
    expect(markup).toContain("Als Sofortmaßnahme priorisieren");
    expect(markup).toContain("Umsetzung besprechen");
    expect(markup).toContain("https://shophebel.vercel.app/?opportunity=Hero-Botschaft+als+Anfrage-Hebel+sch%C3%A4rfen");
    expect(markup).toContain("opportunitySource=premium");
    expect(markup).toContain("module=Conversion+Quick+Wins");
    expect(markup).toContain("service=Quick+Fix+Sprint");
    expect(markup).toContain("#kontakt");
  });
});
