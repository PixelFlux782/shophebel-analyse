import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PremiumAiReportSection } from "@/components/results/premium-ai-report-section";
import type { PremiumAiReport } from "@/lib/ai/premiumAiReport.schema";
import { validateReportCopyQuality } from "@/lib/report/reportCopy";

function expectReportQuality(text: string) {
  const visibleText = text
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const quality = validateReportCopyQuality(visibleText);

  expect(quality.isValid, JSON.stringify(quality)).toBe(true);
}

function createReport(): PremiumAiReport {
  return {
    executiveSummary: "Die Seite hat Potenzial, verliert aber im ersten Eindruck zu viel Klarheit.",
    mainDiagnosis: "Der Hero erklaert Nutzen und naechsten Schritt nicht schnell genug.",
    scoreExplanation: "Der Score wird vor allem durch Conversion- und Trust-Signale gedrueckt.",
    topIssues: [
      {
        title: "CTA ist zu unkonkret",
        whyItMatters: "Besucher verstehen nicht sofort, welcher Schritt empfohlen wird.",
        evidence: ["Der Hauptbutton beschreibt keinen konkreten Nutzen."],
        recommendedAction: "Primaeren CTA nutzenorientiert umformulieren.",
        impact: "high",
        effort: "low",
      },
    ],
    actionPlan: [
      {
        step: 1,
        title: "Hero schaerfen",
        description: "Nutzenversprechen, Zielgruppe und CTA in einem sichtbaren Block klaeren.",
        priority: "now",
      },
    ],
    exampleImprovements: {
      heroTextIdeas: ["Mehr qualifizierte Anfragen aus deiner Website"],
      ctaIdeas: ["Website-Potenzial pruefen lassen"],
      trustElementIdeas: ["Kundenstimmen direkt unter dem CTA zeigen"],
    },
    disclaimer: "Diese Einschaetzung ersetzt keine manuelle Fachberatung.",
  };
}

describe("PremiumAiReportSection", () => {
  it("rendert fuer Premium einen manuellen Erstellen-Button", () => {
    const markup = renderToStaticMarkup(
      React.createElement(PremiumAiReportSection, {
        analysisId: "analysis-123",
        canViewPremium: true,
      }),
    );

    expect(markup).toContain("KI-Premiumbericht");
    expect(markup).toContain("KI-Premiumbericht erzeugen");
    expect(markup).toContain("Bereit zur Erstellung");
    expectReportQuality(markup);
  });

  it("rendert fuer Free keinen funktionsfaehigen KI-Button", () => {
    const markup = renderToStaticMarkup(
      React.createElement(PremiumAiReportSection, {
        analysisId: "analysis-123",
        canViewPremium: false,
      }),
    );

    expect(markup).toContain("Der KI-Beraterbericht ist in Premium enthalten");
    expect(markup).not.toContain("KI-Premiumreport erzeugen");
    expectReportQuality(markup);
  });

  it("rendert den Loading-State", () => {
    const markup = renderToStaticMarkup(
      React.createElement(PremiumAiReportSection, {
        analysisId: "analysis-123",
        canViewPremium: true,
        initialState: "loading",
      }),
    );

    expect(markup).toContain("KI-Bericht wird erstellt");
    expect(markup).toContain("Die KI-Premiumanalyse wird erstellt");
    expect(markup).toContain("nicht parallel gestartet");
    expectReportQuality(markup);
  });

  it("rendert den Success-State mit Beratungsbericht", () => {
    const markup = renderToStaticMarkup(
      React.createElement(PremiumAiReportSection, {
        analysisId: "analysis-123",
        canViewPremium: true,
        initialReport: createReport(),
        initialSource: "cache",
      }),
    );

    expect(markup).toContain("Kurzüberblick");
    expect(markup).toContain("Hauptdiagnose");
    expect(markup).toContain("Bewertung erklärt");
    expect(markup).toContain("Wichtigste Probleme");
    expect(markup).toContain("Maßnahmenplan");
    expect(markup).toContain("Beispiel-Verbesserungen");
    expect(markup).toContain("Gespeicherter KI-Bericht");
    expect(markup).toContain("Der Startbereich erklärt Nutzen");
    expect(markup).not.toContain("Executive Summary");
    expect(markup).not.toContain("Top Issues");
    expect(markup).not.toContain("Massnahmenplan");
    expect(markup).not.toContain("KI-Premiumreport erzeugen");
    expectReportQuality(markup);
  });

  it("rendert verstaendliche Fehlertexte", () => {
    const markup = renderToStaticMarkup(
      React.createElement(PremiumAiReportSection, {
        analysisId: "analysis-123",
        canViewPremium: true,
        initialState: "error",
        initialErrorCode: "invalid_ai_response",
      }),
    );

    expect(markup).toContain("KI-Bericht nicht verfügbar");
    expect(markup).toContain("Der KI-Bericht konnte nicht sicher ausgewertet werden");
    expect(markup).toContain("später erneut");
    expect(markup).toContain("Erneut versuchen");
    expectReportQuality(markup);
  });
});
