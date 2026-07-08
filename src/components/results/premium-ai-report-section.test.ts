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
    mainDiagnosis: "Das eigentliche Problem ist nicht der Button allein, sondern die unklare Reihenfolge aus Nutzen, Vertrauen und nächstem Schritt.",
    websiteSystem: {
      overallWebsiteScore: 68,
      crossPageDiagnosis: "Die Website wirkt als System brauchbar, aber Angebot, Vertrauen und Anfrageweg greifen noch nicht sauber ineinander.",
      repeatedProblems: ["Button und Vertrauensbelege sind nicht konsequent verbunden."],
      conversionPathAssessment: "Der Weg von Angebot zu Anfrage braucht eine klarere Fuehrung.",
      trustConsistencyAssessment: "Vertrauen muss naeher an die Entscheidung.",
      navigationAssessment: "Navigation und Hauptbutton sollten denselben Weg fuehren.",
      topPrioritiesWebsiteWide: ["CTA vereinheitlichen", "Trust sichtbarer machen"],
      missingPageTypes: ["product"],
    },
    topLevers: [
      {
        title: "Button ist zu unkonkret",
        whyItMatters: "Besucher verstehen nicht sofort, welcher Schritt empfohlen wird.",
        shopObservation: "Der Hauptbutton beschreibt keinen konkreten Nutzen.",
        improvement: "Primären Button nutzenorientiert umformulieren.",
        firstStep: "Button im Startbereich prüfen.",
        difficulty: "leicht",
        expectedEffect: "Qualitativ: klarere Orientierung bis zur Anfrage.",
      },
      {
        title: "Vertrauen fehlt früh",
        whyItMatters: "Vertrauen wird zu spät aufgebaut.",
        shopObservation: "Unsichere Besucher vergleichen eher weiter.",
        improvement: "Bewertungen früher zeigen.",
        firstStep: "Zwei Vertrauensbelege auswählen.",
        difficulty: "mittel",
        expectedEffect: "Qualitativ: weniger Unsicherheit vor der Entscheidung.",
      },
      {
        title: "Mobile Reihenfolge prüfen",
        whyItMatters: "Mobile Nutzer sehen wichtige Signale später.",
        shopObservation: "Mehr Sucharbeit kann Anfragen bremsen.",
        improvement: "Mobile Startansicht verdichten.",
        firstStep: "Mobile Ansicht gegenlesen.",
        difficulty: "mittel",
        expectedEffect: "Qualitativ: schnelleres Verstehen auf kleinen Bildschirmen.",
      },
    ],
    sevenDayPlan: [
      {
        day: "Tag 1-2",
        focus: "Klarheit schaffen: Texte und wichtigste Handlung",
        tasks: ["Nutzenversprechen, Zielgruppe und Button in einem sichtbaren Block klären."],
      },
      {
        day: "Tag 3-5",
        focus: "Umsetzung an Startseite, Produktseite, Vertrauen und Navigation",
        tasks: ["Vertrauenssignale platzieren."],
      },
      {
        day: "Tag 6-7",
        focus: "Kontrolle, Vergleich und nächste Optimierung",
        tasks: ["Mobile Ansicht prüfen."],
      },
    ],
    ownerConclusion: "Erst Klarheit, dann Vertrauen, dann nächster Schritt.",
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

    expect(markup).toContain("KI-Einordnung");
    expect(markup).toContain("KI-Einordnung erzeugen");
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

    expect(markup).toContain("Die KI-Einordnung ist in Premium enthalten");
    expect(markup).not.toContain("KI-Einordnung erzeugen");
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

    expect(markup).toContain("KI-Beratung wird erstellt");
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

    expect(markup).toContain("Management-Fazit");
    expect(markup).toContain("KI-Einordnung");
    expect(markup).toContain("Website-System");
    expect(markup).toContain("Gesamtberatung");
    expect(markup).toContain("68/100");
    expect(markup).toContain("Die wichtigsten 3 Hebel");
    expect(markup).toContain("Warum wichtig");
    expect(markup).toContain("Erwarteter Effekt");
    expect(markup).toContain("7-Tage-Fahrplan");
    expect(markup).toContain("Fazit");
    expect(markup).not.toContain("Top Issues");
    expect(markup).not.toContain("Beispiel-Verbesserungen");
    expect(markup).not.toContain("KI-Premiumreport erzeugen");
    expectReportQuality(markup);
  });

  it("rendert den Fallback-State kundenfreundlich", () => {
    const markup = renderToStaticMarkup(
      React.createElement(PremiumAiReportSection, {
        analysisId: "analysis-123",
        canViewPremium: true,
        initialReport: createReport(),
        initialSource: "fallback",
      }),
    );

    expect(markup).toContain("aus den vorhandenen Analyse-Daten");
    expectReportQuality(markup);
  });

  it("rendert verstaendliche Fehlertexte", () => {
    const markup = renderToStaticMarkup(
      React.createElement(PremiumAiReportSection, {
        analysisId: "analysis-123",
        canViewPremium: true,
        initialState: "error",
        initialErrorCode: "fallback_save_failed",
      }),
    );

    expect(markup).toContain("KI-Bericht nicht");
    expect(markup).toContain("Serverproblem");
    expect(markup).toContain("Erneut versuchen");
    expectReportQuality(markup);
  });
});
