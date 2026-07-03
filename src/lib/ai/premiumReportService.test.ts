import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, expectTypeOf, it } from "vitest";

import { mockPremiumReportProvider } from "@/lib/ai/mockPremiumReportProvider";
import type { PremiumReportInput } from "@/lib/ai/premiumReportInput";
import type { PremiumReportProvider } from "@/lib/ai/premiumReportProvider";
import {
  generatePremiumAiReport,
  normalizePremiumAiReportCopy,
  parsePremiumAiReportResponse,
  PremiumAiReportValidationError,
} from "@/lib/ai/premiumReportService";
import { validateReportCopyQuality } from "@/lib/report/reportCopy";

function createInput(overrides: Partial<PremiumReportInput> = {}): PremiumReportInput {
  return {
    url: "https://shop.test/",
    requestedUrl: "https://shop.test",
    finalUrl: "https://shop.test/",
    analyzedAt: "2026-05-08T12:00:00.000Z",
    analysisMode: "rendered",
    overallScore: 64,
    totalFindings: 4,
    visibleFindings: 3,
    scores: [
      {
        category: "conversion",
        score: 45,
        label: "Conversion",
        summary: "CTA ist unklar.",
        evidence: ["Im Startbereich ist kein eindeutiger Hauptbutton sichtbar."],
      },
    ],
    criticalSignals: [
      {
        title: "Naechster Schritt unklar",
        severity: "high",
        category: "conversion",
        evidence: ["Der wichtigste Button ist im oberen Bereich nicht eindeutig."],
      },
    ],
    revenueBlockers: [
      {
        title: "CTA im Hero ist nicht eindeutig",
        description: "Besucher erkennen den naechsten Schritt nicht schnell genug.",
        action: "Primaeren CTA im sichtbaren Startbereich klarer formulieren.",
        impact: "hoch",
        effort: "niedrig",
        category: "CTA",
        priority: 1,
        severity: "high",
        evidence: ["Naechster Schritt ist nicht klar sichtbar."],
      },
    ],
    measures: [
      {
        title: "Hero und CTA schaerfen",
        description: "Hero und CTA klarer formulieren.",
        effort: "niedrig",
        impact: "hoch",
        priority: 1,
        category: "CTA",
        source: "Naechster Schritt",
      },
    ],
    opportunities: [],
    detectedPageSignals: {
      heroText: ["Bessere Shops fuer mehr Anfragen"],
      ctaTexts: ["Angebot anfragen"],
      trustSignals: ["Impressum", "Datenschutz"],
      technicalNotes: ["Die Analyse basiert auf der Seite, wie sie im Browser sichtbar wird."],
    },
    constraints: {
      language: "de",
      audience: "shop-owner-non-technical",
      noInventedFacts: true,
      baseFactsOnlyOnAnalysis: true,
    },
    ...overrides,
  };
}

describe("premiumReportService", () => {
  it("akzeptiert typisiert nur PremiumReportInput und optionalen Provider", () => {
    expectTypeOf(generatePremiumAiReport).parameters.toEqualTypeOf<
      [PremiumReportInput, (PremiumReportProvider | undefined)?]
    >();
  });

  it("erzeugt mit dem Mock-Provider einen validen Report", async () => {
    const report = await generatePremiumAiReport(createInput(), mockPremiumReportProvider);

    expect(report.executiveSummary).toContain("https://shop.test/");
    expect(report.topIssues).toHaveLength(2);
    expect(report.topIssues[0]).toMatchObject({
      title: "Button im Startbereich ist nicht eindeutig",
      impact: "high",
      effort: "low",
    });
    expect(validateReportCopyQuality(JSON.stringify(report)).isValid).toBe(true);
    expect(report.actionPlan[0]).toMatchObject({
      step: 1,
      priority: "now",
    });
    expect(report.exampleImprovements.ctaIdeas.length).toBeGreaterThan(0);
  });

  it("faengt ungueltiges JSON ab", () => {
    expect(() => parsePremiumAiReportResponse("Das ist kein JSON")).toThrow(PremiumAiReportValidationError);
    expect(() => parsePremiumAiReportResponse("Das ist kein JSON")).toThrow("not valid JSON");
  });

  it("faengt fehlende Pflichtfelder ab", () => {
    const raw = JSON.stringify({
      executiveSummary: "Kurzfassung",
      mainDiagnosis: "Diagnose",
    });

    expect(() => parsePremiumAiReportResponse(raw)).toThrow(PremiumAiReportValidationError);
    expect(() => parsePremiumAiReportResponse(raw)).toThrow("failed validation");
  });

  it("parst JSON auch aus einer gefenceten Provider-Antwort", () => {
    const report = parsePremiumAiReportResponse(`\`\`\`json
{
  "executiveSummary": "Kurzfassung",
  "mainDiagnosis": "Diagnose",
  "scoreExplanation": "Score-Erklaerung",
  "topIssues": [
    {
      "title": "Problem",
      "whyItMatters": "Warum es wichtig ist",
      "evidence": ["Beleg"],
      "recommendedAction": "Aktion",
      "impact": "medium",
      "effort": "low"
    }
  ],
  "actionPlan": [
    {
      "step": 1,
      "title": "Schritt",
      "description": "Beschreibung",
      "priority": "now"
    }
  ],
  "exampleImprovements": {
    "heroTextIdeas": ["Hero"],
    "ctaIdeas": ["CTA"],
    "trustElementIdeas": ["Trust"]
  },
  "disclaimer": "Nur auf Basis der Analyse."
}
\`\`\``);

    expect(report.disclaimer).toBe("Nur auf Basis der Analyse.");
    expect(validateReportCopyQuality(JSON.stringify(report)).isValid).toBe(true);
  });

  it("normalisiert KI-Berichtskopie nach Schema-Validierung", () => {
    const report = normalizePremiumAiReportCopy({
      executiveSummary: "Executive Summary fuer den Shop",
      mainDiagnosis: "Hero und CTA sind unklar.",
      scoreExplanation: "Trust und Conversion werden gedrueckt.",
      topIssues: [
        {
          title: "Top Issues im Hero",
          whyItMatters: "Besucher verstehen den naechsten Schritt nicht.",
          evidence: ["CTA ist zu schwach."],
          recommendedAction: "Primaeren CTA schaerfen.",
          impact: "high",
          effort: "low",
        },
      ],
      actionPlan: [
        {
          step: 1,
          title: "Quick Fix",
          description: "Hero klaeren.",
          priority: "now",
        },
      ],
      exampleImprovements: {
        heroTextIdeas: ["Hero klarer machen"],
        ctaIdeas: ["CTA pruefen"],
        trustElementIdeas: ["Trust frueher zeigen"],
      },
      disclaimer: "Keine Garantie fuer Umsatz.",
    });

    expect(report.mainDiagnosis).toContain("Startbereich und Button");
    expect(report.scoreExplanation).toContain("Vertrauen");
    expect(report.topIssues[0]?.title).toContain("Wichtigste Probleme");
    expect(validateReportCopyQuality(JSON.stringify(report)).isValid).toBe(true);
  });

  it("liefert einen Disclaimer", async () => {
    const report = await generatePremiumAiReport(createInput());

    expect(report.disclaimer).toContain("ausschließlich");
    expect(report.disclaimer).toContain("keine Garantie");
  });

  it("haelt Provider- und AnalysisResult-Details aus dem Service heraus", () => {
    const serviceSource = readFileSync(join(process.cwd(), "src/lib/ai/premiumReportService.ts"), "utf8");

    expect(serviceSource).not.toMatch(/openrouter/i);
    expect(serviceSource).not.toContain("@/types/analysis");
    expect(serviceSource).not.toMatch(/AnalysisResult/);
  });
});
