import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PremiumAiReportSection } from "@/components/results/premium-ai-report-section";
import type { PremiumAiReport } from "@/lib/ai/premiumAiReport.schema";

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

    expect(markup).toContain("KI-Premiumreport");
    expect(markup).toContain("KI-Premiumreport erzeugen");
    expect(markup).toContain("Bereit zur Erstellung");
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

    expect(markup).toContain("Executive Summary");
    expect(markup).toContain("Hauptdiagnose");
    expect(markup).toContain("Score-Erklaerung");
    expect(markup).toContain("Top Issues");
    expect(markup).toContain("Massnahmenplan");
    expect(markup).toContain("Beispiel-Verbesserungen");
    expect(markup).toContain("Gespeicherter KI-Bericht");
    expect(markup).toContain("Der Hero erklaert Nutzen");
    expect(markup).not.toContain("KI-Premiumreport erzeugen");
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

    expect(markup).toContain("KI-Bericht nicht verfuegbar");
    expect(markup).toContain("Der KI-Bericht konnte nicht sicher ausgewertet werden");
    expect(markup).toContain("Erneut versuchen");
  });
});
