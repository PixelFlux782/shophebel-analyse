import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, expectTypeOf, it } from "vitest";

import { mockPremiumReportProvider } from "@/lib/ai/mockPremiumReportProvider";
import type { PremiumAiReport } from "@/lib/ai/premiumAiReport.schema";
import type { PremiumReportInput } from "@/lib/ai/premiumReportInput";
import type { PremiumReportProvider } from "@/lib/ai/premiumReportProvider";
import {
  buildFallbackPremiumAiReport,
  generatePremiumAiReport,
  generatePremiumAiReportWithUsage,
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
        title: "Naechster Schritt unklar",
        severity: "high",
        category: "conversion",
        evidence: ["Der wichtigste Button ist im oberen Bereich nicht eindeutig."],
      },
    ],
    revenueBlockers: [
      {
        title: "Button im Startbereich ist nicht eindeutig",
        description: "Besucher erkennen den naechsten Schritt nicht schnell genug.",
        action: "Primaeren Button im sichtbaren Startbereich klarer formulieren.",
        impact: "hoch",
        effort: "niedrig",
        category: "Button",
        priority: 1,
        severity: "high",
        evidence: ["Naechster Schritt ist nicht klar sichtbar."],
      },
    ],
    measures: [
      {
        title: "Startbereich und Button schaerfen",
        description: "Startbereich und Button klarer formulieren.",
        effort: "niedrig",
        impact: "hoch",
        priority: 1,
        category: "Button",
        source: "Naechster Schritt",
      },
    ],
    opportunities: [],
    websiteAnalysis: {
      overallWebsiteScore: 66,
      crossPageDiagnosis: "Die Website zeigt ueber mehrere Seiten dieselbe CTA-Reibung.",
      repeatedProblems: ["CTA ist unklar"],
      conversionPathAssessment: "Angebot und Kontaktweg brauchen klarere Verbindung.",
      trustConsistencyAssessment: "Vertrauen muss naeher an Angebots- und Anfragebereiche.",
      navigationAssessment: "Navigation und Hauptbutton sollten denselben Weg fuehren.",
      topPrioritiesWebsiteWide: ["CTA vereinheitlichen", "Trust sichtbarer machen"],
      missingPageTypes: ["product"],
      pages: [
        {
          label: "Startseite",
          role: "home",
          score: 64,
          analysisStatus: "analyzed",
          mainProblem: "CTA ist unklar",
          recommendation: "Button klarer formulieren.",
          shortDiagnosis: "Startseite mit CTA-Hebel.",
        },
      ],
    },
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

function createRawReport(): PremiumAiReport {
  return {
    executiveSummary: "Kurzfassung fuer den Shop mit Staerke und Bremse.",
    mainDiagnosis: "Das eigentliche Problem ist nicht der Button allein, sondern die unklare Entscheidungsfuehrung.",
    websiteSystem: {
      overallWebsiteScore: 66,
      crossPageDiagnosis: "Die Website zeigt ueber mehrere Seiten dieselbe CTA-Reibung.",
      repeatedProblems: ["CTA ist unklar"],
      conversionPathAssessment: "Angebot und Kontaktweg brauchen klarere Verbindung.",
      trustConsistencyAssessment: "Vertrauen muss naeher an Angebots- und Anfragebereiche.",
      navigationAssessment: "Navigation und Hauptbutton sollten denselben Weg fuehren.",
      topPrioritiesWebsiteWide: ["CTA vereinheitlichen", "Trust sichtbarer machen"],
      missingPageTypes: ["product"],
    },
    topLevers: [
      {
        title: "Button im Startbereich",
        whyItMatters: "Besucher verstehen den naechsten Schritt nicht.",
        shopObservation: "Der Hauptbutton beschreibt keinen konkreten Nutzen.",
        improvement: "Primaeren Button konkreter formulieren.",
        firstStep: "Button-Text pruefen.",
        difficulty: "leicht",
        expectedEffect: "Qualitativ: klarere Fuehrung bis zur Anfrage.",
      },
      {
        title: "Vertrauen frueher zeigen",
        whyItMatters: "Vertrauen entsteht zu spaet.",
        shopObservation: "Vertrauenssignale stehen nicht nah genug an der Entscheidung.",
        improvement: "Bewertungen frueher platzieren.",
        firstStep: "Zwei Belege auswaehlen.",
        difficulty: "mittel",
        expectedEffect: "Qualitativ: weniger Unsicherheit vor dem naechsten Schritt.",
      },
      {
        title: "Mobile Reihenfolge pruefen",
        whyItMatters: "Wichtige Signale kommen mobil zu spaet.",
        shopObservation: "Mobile Besucher muessen mehr suchen.",
        improvement: "Mobile Startansicht verdichten.",
        firstStep: "Mobile Ansicht oeffnen.",
        difficulty: "mittel",
        expectedEffect: "Qualitativ: schnelleres Verstehen auf kleinen Bildschirmen.",
      },
    ],
    sevenDayPlan: [
      { day: "Tag 1-2", focus: "Klarheit schaffen", tasks: ["Button pruefen."] },
      { day: "Tag 3-5", focus: "Umsetzung", tasks: ["Vertrauen platzieren."] },
      { day: "Tag 6-7", focus: "Kontrolle", tasks: ["Mobile Ansicht pruefen."] },
    ],
    ownerConclusion: "Erst Klarheit, dann Vertrauen, dann naechster Schritt.",
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
      difficulty: "leicht",
    });
    expect(report.websiteSystem).toMatchObject({
      overallWebsiteScore: 66,
      missingPageTypes: ["product"],
    });
    expect(report.sevenDayPlan.map((step) => step.day)).toEqual(["Tag 1-2", "Tag 3-5", "Tag 6-7"]);
    expect(validateReportCopyQuality(visibleReportText(report)).isValid).toBe(true);
  });

  it("liefert im Mock-Modus geschaetzte Usage-Daten", async () => {
    const result = await generatePremiumAiReportWithUsage(createInput(), mockPremiumReportProvider);

    expect(result.usage).toMatchObject({
      isEstimated: true,
      estimatedCost: 0,
    });
    expect(result.usage?.promptTokens).toBeGreaterThan(0);
    expect(result.usage?.completionTokens).toBeGreaterThan(0);
    expect(result.usage?.totalTokens).toBe(
      (result.usage?.promptTokens ?? 0) + (result.usage?.completionTokens ?? 0),
    );
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

  it("erzwingt die drei festen 7-Tage-Plan-Phasen", () => {
    const report = createRawReport();
    const raw = JSON.stringify({
      ...report,
      sevenDayPlan: [
        { ...report.sevenDayPlan[0], day: "Tag 1" },
        report.sevenDayPlan[1],
        report.sevenDayPlan[2],
      ],
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
          improvement: "Primaeren CTA schaerfen.",
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
    expect(report.websiteSystem.topPrioritiesWebsiteWide).toContain("Button vereinheitlichen");
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
