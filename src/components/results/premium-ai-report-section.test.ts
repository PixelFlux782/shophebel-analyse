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
    mainDiagnosis: "Der Startbereich erklärt Nutzen und nächsten Schritt nicht schnell genug.",
    topLevers: [
      {
        title: "Button ist zu unkonkret",
        problem: "Besucher verstehen nicht sofort, welcher Schritt empfohlen wird.",
        businessImpact: "Der Hauptbutton beschreibt keinen konkreten Nutzen.",
        recommendation: "Primären Button nutzenorientiert umformulieren.",
        firstStep: "Button im Startbereich prüfen.",
      },
      {
        title: "Vertrauen fehlt früh",
        problem: "Vertrauen wird zu spät aufgebaut.",
        businessImpact: "Unsichere Besucher vergleichen eher weiter.",
        recommendation: "Bewertungen früher zeigen.",
        firstStep: "Zwei Vertrauensbelege auswählen.",
      },
      {
        title: "Mobile Reihenfolge prüfen",
        problem: "Mobile Nutzer sehen wichtige Signale später.",
        businessImpact: "Mehr Sucharbeit kann Anfragen bremsen.",
        recommendation: "Mobile Startansicht verdichten.",
        firstStep: "Mobile Ansicht gegenlesen.",
      },
    ],
    sevenDayPlan: [
      {
        day: "Tag 1-2",
        focus: "Sofortmaßnahmen",
        tasks: ["Nutzenversprechen, Zielgruppe und Button in einem sichtbaren Block klären."],
      },
      {
        day: "Tag 3-5",
        focus: "Umsetzung",
        tasks: ["Vertrauenssignale platzieren."],
      },
      {
        day: "Tag 6-7",
        focus: "Kontrolle",
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
    expect(markup).toContain("Die wichtigsten 3 Hebel");
    expect(markup).toContain("7-Tage-Fahrplan");
    expect(markup).toContain("Fazit");
    expect(markup).toContain("Gespeicherter KI-Bericht");
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

    expect(markup).toContain("Stabiler Ersatzbericht");
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
