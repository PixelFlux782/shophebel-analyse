import { describe, expect, it } from "vitest";

import {
  buildPremiumReportInput,
  compactEvidence,
  limitText,
  normalizeSeverity,
} from "@/lib/ai/premiumReportInput";
import { AnalysisOpportunity, AnalysisResult } from "@/types/analysis";

function createOpportunity(overrides: Partial<AnalysisOpportunity> = {}): AnalysisOpportunity {
  return {
    id: "opportunity-1",
    title: "Hero CTA als klaren Anfrage-Hebel schaerfen",
    description: "Der Einstieg erzeugt noch zu wenig Handlungsdruck.",
    category: "conversion",
    severity: "high",
    businessImpact: "Mehr Besucher verstehen den naechsten Schritt und brechen seltener ab.",
    aiOpportunity: "KI kann CTA-Varianten und Hero-Copy vorbereiten.",
    suggestedModule: "Conversion Quick Wins",
    suggestedService: "Quick Fix Sprint",
    implementationEffort: "low",
    expectedEffect: "Mehr qualifizierte Anfragen aus bestehendem Traffic.",
    recurringPotential: false,
    ctaLabel: "Quick Fix starten",
    ctaHref: "/#kontakt",
    sourceType: "revenueBlocker",
    priorityScore: 91,
    ...overrides,
  };
}

function createResult(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    url: "https://shop.test/",
    requestedUrl: "https://shop.test",
    scannedAt: "2026-05-08T12:00:00.000Z",
    createdAt: "2026-05-08T12:00:00.000Z",
    analysisMode: "rendered",
    finalUrl: "https://shop.test/",
    technicalNotes: ["Die Analyse basiert auf der Seite, wie sie im Browser sichtbar wird."],
    screenshots: {
      viewport: "/generated-screenshots/test-viewport.png",
      mobile: "/generated-screenshots/test-mobile.png",
    },
    visualPreviewAvailable: true,
    visualMap: {
      pageWidth: 1440,
      pageHeight: 2200,
      viewportWidth: 1440,
      viewportHeight: 900,
      buttons: [{ x: 120, y: 180, width: 220, height: 56, label: "Angebot anfragen" }],
      headings: [{ x: 100, y: 80, width: 640, height: 72, label: "Bessere Shops fuer mehr Anfragen" }],
      images: [{ x: 820, y: 140, width: 420, height: 320, label: "Hero Bild" }],
      forms: [],
      links: [
        { x: 100, y: 1980, width: 180, height: 24, label: "Impressum" },
        { x: 300, y: 1980, width: 180, height: 24, label: "Datenschutz" },
      ],
    },
    metadata: {
      contactRequestId: "contact-secret",
      leadContext: { email: "kunde@example.test" },
      auditContext: { internal: true },
    },
    isPremium: true,
    totalFindings: 3,
    visibleFindings: 2,
    overallScore: 64,
    categories: {
      seo: {
        score: 82,
        label: "SEO",
        summary: "Suchmaschinen verstehen die Seite groesstenteils.",
        checks: [],
      },
      performance: {
        score: 70,
        label: "Performance",
        summary: "Ladegefuehl ist solide.",
        checks: [],
      },
      trust: {
        score: 50,
        label: "Trust",
        summary: "Trust fehlt an kaufnahen Stellen.",
        checks: [
          {
            title: "Vertrauensbelege",
            status: "critical",
            message: "Bewertungen oder Referenzen sind nicht frueh sichtbar.",
          },
        ],
      },
      conversion: {
        score: 45,
        label: "Conversion",
        summary: "CTA ist unklar.",
        checks: [
          {
            title: "Naechster Schritt",
            status: "warning",
            message: "Im Startbereich ist kein eindeutiger Hauptbutton sichtbar.",
          },
        ],
      },
      design: {
        score: 58,
        label: "Design",
        summary: "Design fuehrt wenig.",
        checks: [],
      },
      aiVisibility: {
        score: 80,
        label: "AI",
        summary: "KI-Sichtbarkeit ist solide.",
        checks: [],
      },
    },
    quickWins: [],
    criticalIssues: [],
    premiumInsightsPreview: [],
    revenueBlockers: [
      {
        problem: "CTA im Hero ist nicht eindeutig",
        whyItCostsCustomers: "Besucher erkennen den naechsten Schritt nicht schnell genug.",
        action: "Primaeren CTA im sichtbaren Startbereich klarer formulieren.",
        estimatedEffort: "niedrig",
        estimatedImpact: "hoch",
        priority: 1,
        category: "CTA",
        sourceCheck: "Naechster Schritt",
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
        sourceProblem: "Naechster Schritt",
      },
    ],
    categoryScores: {},
    findings: [
      {
        category: "conversion",
        status: "error",
        title: "CTA im Hero ist unklar",
        description: "Der wichtigste Button ist im oberen Bereich nicht eindeutig.",
        priority: "high",
      },
      {
        category: "trust",
        status: "warning",
        title: "Zu wenig Vertrauen vor der Anfrage",
        description: "Bewertungen und Referenzen fehlen vor der Entscheidung.",
        priority: "high",
      },
    ],
    recommendations: [],
    aiSuggestions: [],
    opportunities: [
      createOpportunity({ id: "low", priorityScore: 45, title: "Trust Proof ausbauen" }),
      createOpportunity({ id: "high", priorityScore: 96, title: "CTA Roadmap priorisieren" }),
    ],
    ...overrides,
  };
}

describe("premiumReportInput", () => {
  it("normalisiert Texte und Severity-Werte", () => {
    expect(limitText(` ${"x".repeat(12)} `, 8)).toBe("xxxxxxx...");
    expect(normalizeSeverity("hoch")).toBe("high");
    expect(normalizeSeverity("warning")).toBe("medium");
    expect(normalizeSeverity("critical")).toBe("critical");
    expect(compactEvidence(["A", " A ", "", undefined, "B"], 4)).toEqual(["A", "B"]);
  });

  it("baut ein begrenztes, strukturiertes PremiumReportInput aus AnalysisResult", () => {
    const input = buildPremiumReportInput(createResult());

    expect(input).toMatchObject({
      url: "https://shop.test/",
      analyzedAt: "2026-05-08T12:00:00.000Z",
      analysisMode: "rendered",
      overallScore: 64,
      constraints: {
        language: "de",
        audience: "shop-owner-non-technical",
        noInventedFacts: true,
        baseFactsOnlyOnAnalysis: true,
      },
    });
    expect(input.scores).toHaveLength(6);
    expect(input.scores.find((score) => score.category === "trust")?.evidence).toEqual([
      "Vertrauensbelege: Bewertungen oder Referenzen sind nicht frueh sichtbar.",
    ]);
    expect(input.criticalSignals[0]).toMatchObject({
      title: "Vertrauensbelege",
      severity: "critical",
      category: "trust",
    });
    expect(input.revenueBlockers[0]).toMatchObject({
      title: "CTA im Hero ist nicht eindeutig",
      severity: "high",
      priority: 1,
    });
    expect(input.measures[0]).toMatchObject({
      title: "Hero und CTA schaerfen",
      source: "Naechster Schritt",
    });
    expect(input.opportunities.map((item) => item.priorityScore)).toEqual([96, 45]);
    expect(input.detectedPageSignals).toMatchObject({
      heroText: ["Bessere Shops fuer mehr Anfragen"],
      ctaTexts: ["Angebot anfragen"],
      trustSignals: ["Impressum", "Datenschutz"],
    });
  });

  it("uebernimmt keine Screenshots, Visual-Koordinaten, Metadata oder Premiumstatus", () => {
    const input = buildPremiumReportInput(createResult());
    const serialized = JSON.stringify(input);

    expect(serialized).not.toContain("generated-screenshots");
    expect(serialized).not.toContain("contact-secret");
    expect(serialized).not.toContain("kunde@example.test");
    expect(serialized).not.toContain("pageWidth");
    expect(serialized).not.toContain("isPremium");
    expect(serialized).not.toContain("ctaHref");
  });
});
