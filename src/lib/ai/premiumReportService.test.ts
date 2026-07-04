import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, expectTypeOf, it } from "vitest";

import { mockPremiumReportProvider } from "@/lib/ai/mockPremiumReportProvider";
import type { PremiumReportInput } from "@/lib/ai/premiumReportInput";
import type { PremiumReportProvider } from "@/lib/ai/premiumReportProvider";
import {
  buildFallbackPremiumAiReport,
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
        summary: "Button ist unklar.",
        evidence: ["Im Startbereich ist kein eindeutiger Hauptbutton sichtbar."],
      },
    ],
    criticalSignals: [
      {
        title: "Nächster Schritt unklar",
        severity: "high",
        category: "conversion",
        evidence: ["Der wichtigste Button ist im oberen Bereich nicht eindeutig."],
      },
    ],
    revenueBlockers: [
      {
        title: "Button im Startbereich ist nicht eindeutig",
        description: "Besucher erkennen den nächsten Schritt nicht schnell genug.",
        action: "Primären Button im sichtbaren Startbereich klarer formulieren.",
        impact: "hoch",
        effort: "niedrig",
        category: "Button",
        priority: 1,
        severity: "high",
        evidence: ["Nächster Schritt ist nicht klar sichtbar."],
      },
    ],
    measures: [
      {
        title: "Startbereich und Button schärfen",
        description: "Startbereich und Button klarer formulieren.",
        effort: "niedrig",
        impact: "hoch",
        priority: 1,
        category: "Button",
        source: "Nächster Schritt",
      },
    ],
    opportunities: [],
    detectedPageSignals: {
      heroText: ["Bessere Shops für mehr Anfragen"],
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

function createRawReport() {
  return {
    executiveSummary: "Kurzfassung für den Shop",
    mainDiagnosis: "Der Startbereich und Button sind unklar.",
    topLevers: [
      {
        title: "Button im Startbereich",
        problem: "Besucher verstehen den nächsten Schritt nicht.",
        businessImpact: "Das kann Anfragen unnötig bremsen.",
        recommendation: "Primären Button konkreter formulieren.",
        firstStep: "Button-Text prüfen.",
      },
      {
        title: "Vertrauen früher zeigen",
        problem: "Vertrauen entsteht zu spät.",
        businessImpact: "Unsicherheit kann Entscheidungen verlangsamen.",
        recommendation: "Bewertungen früher platzieren.",
        firstStep: "Zwei Belege auswählen.",
      },
      {
        title: "Mobile Reihenfolge prüfen",
        problem: "Wichtige Signale kommen mobil zu spät.",
        businessImpact: "Mobile Besucher müssen mehr suchen.",
        recommendation: "Mobile Startansicht verdichten.",
        firstStep: "Mobile Ansicht öffnen.",
      },
    ],
    sevenDayPlan: [
      { day: "Tag 1-2", focus: "Sofortmaßnahmen", tasks: ["Button prüfen."] },
      { day: "Tag 3-5", focus: "Umsetzung", tasks: ["Vertrauen platzieren."] },
      { day: "Tag 6-7", focus: "Kontrolle", tasks: ["Mobile Ansicht prüfen."] },
    ],
    ownerConclusion: "Erst Klarheit, dann Vertrauen, dann nächster Schritt.",
  };
}

function visibleReportText(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(visibleReportText).join(" ");
  }

  if (value && typeof value === "object") {
    return Object.values(value).map(visibleReportText).join(" ");
  }

  return "";
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
    expect(report.topLevers).toHaveLength(3);
    expect(report.topLevers[0]).toMatchObject({
      title: "Button im Startbereich ist nicht eindeutig",
    });
    expect(report.sevenDayPlan).toHaveLength(3);
    expect(validateReportCopyQuality(visibleReportText(report)).isValid).toBe(true);
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
${JSON.stringify(createRawReport(), null, 2)}
\`\`\``);

    expect(report.ownerConclusion).toContain("Klarheit");
    expect(validateReportCopyQuality(visibleReportText(report)).isValid).toBe(true);
  });

  it("normalisiert KI-Berichtskopie nach Schema-Validierung", () => {
    const report = normalizePremiumAiReportCopy({
      ...createRawReport(),
      mainDiagnosis: "Hero und CTA sind unklar.",
      topLevers: [
        {
          ...createRawReport().topLevers[0],
          title: "CTA im Hero",
          recommendation: "Primaeren CTA schaerfen.",
        },
        createRawReport().topLevers[1],
        createRawReport().topLevers[2],
      ],
    });

    expect(report.mainDiagnosis).toContain("Startbereich und Button");
    expect(report.topLevers[0]?.title).toContain("Button im Startbereich");
    expect(validateReportCopyQuality(visibleReportText(report)).isValid).toBe(true);
  });

  it("liefert einen datenbasierten Fallback-Bericht", () => {
    const report = buildFallbackPremiumAiReport(createInput());

    expect(report.topLevers).toHaveLength(3);
    expect(report.sevenDayPlan.map((step) => step.day)).toEqual(["Tag 1-2", "Tag 3-5", "Tag 6-7"]);
    expect(report.mainDiagnosis).toContain("Button im Startbereich");
    expect(validateReportCopyQuality(visibleReportText(report)).isValid).toBe(true);
  });

  it("haelt Provider- und AnalysisResult-Details aus dem Service heraus", () => {
    const serviceSource = readFileSync(join(process.cwd(), "src/lib/ai/premiumReportService.ts"), "utf8");

    expect(serviceSource).not.toMatch(/openrouter/i);
    expect(serviceSource).not.toContain("@/types/analysis");
    expect(serviceSource).not.toMatch(/AnalysisResult/);
  });
});
