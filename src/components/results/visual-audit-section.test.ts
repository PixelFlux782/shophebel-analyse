import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { VisualAuditSection } from "@/components/results/visual-audit-section";
import type { AnalysisResult, ScoreBlock } from "@/types/analysis";

function block(title: string, message: string): ScoreBlock {
  return {
    score: 50,
    label: title,
    summary: message,
    checks: [
      {
        title,
        status: "warning",
        message,
      },
    ],
  };
}

function result(): AnalysisResult {
  return {
    url: "https://example.test",
    requestedUrl: "https://example.test",
    finalUrl: "https://example.test",
    createdAt: "2026-07-03T10:00:00.000Z",
    scannedAt: "2026-07-03T10:00:00.000Z",
    analysisMode: "static",
    overallScore: 55,
    categories: {
      trust: block("Kontaktvertrauen", "Vertrauen kommt zu spaet."),
      conversion: block("CTA-Erkennung", "Der Button ist nicht klar genug."),
      performance: block("Ladezeit", "Die Seite fuehlt sich langsam an."),
      design: block("Layout-Signale", "Die Blickfuehrung ist zu unruhig."),
      seo: block("Title/Description", "Suchvorschau ist zu unklar."),
      aiVisibility: block("Strukturierte Daten", "KI-Signale fehlen."),
    },
    categoryScores: {},
    quickWins: [],
    criticalIssues: [],
    recommendations: [],
    findings: [],
    totalFindings: 0,
    visibleFindings: 0,
    technicalNotes: [],
    screenshots: {},
    metadata: {},
    measures: [],
    revenueBlockers: [],
    opportunities: [],
    aiSuggestions: [],
  };
}

describe("VisualAuditSection", () => {
  it("zeigt nur wenige Marker direkt und legt weitere Befunde in Details", () => {
    const markup = renderToStaticMarkup(
      React.createElement(VisualAuditSection, {
        result: result(),
        plan: "premium",
        analysisId: "analysis-123",
      }),
    );

    expect(markup).toContain("Weitere Befunde anzeigen");
    expect(markup).toContain("1.");
    expect(markup).toContain("4.");
    expect(markup).not.toContain("5.");
  });
});
