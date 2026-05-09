import { describe, expect, it } from "vitest";

import { buildPremiumReport } from "@/lib/premium/buildPremiumReport";
import { AnalysisResult, Finding } from "@/types/analysis";

function finding(input: Partial<Finding> & Pick<Finding, "title" | "category">): Finding {
  return {
    title: input.title,
    category: input.category,
    status: input.status ?? "warning",
    priority: input.priority ?? "medium",
    description: input.description ?? `${input.title} bremst Anfragen.`,
  };
}

function createAnalysis(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    url: "https://shop.test/",
    createdAt: "2026-05-08T12:00:00.000Z",
    requestedUrl: "https://shop.test",
    scannedAt: "2026-05-08T12:00:00.000Z",
    analysisMode: "rendered",
    finalUrl: "https://shop.test/",
    technicalNotes: [],
    screenshots: {
      viewport: "/generated-screenshots/test-viewport.png",
      mobile: "/generated-screenshots/test-mobile.png",
    },
    visualPreviewAvailable: true,
    isPremium: false,
    totalFindings: 0,
    visibleFindings: 0,
    overallScore: 64,
    categories: {
      seo: { score: 82, label: "SEO", summary: "OK", checks: [] },
      performance: { score: 70, label: "Performance", summary: "OK", checks: [] },
      trust: { score: 50, label: "Trust", summary: "Trust fehlt", checks: [] },
      conversion: { score: 45, label: "Conversion", summary: "CTA unklar", checks: [] },
      design: { score: 58, label: "Design", summary: "Design fuehrt wenig", checks: [] },
      aiVisibility: { score: 80, label: "AI", summary: "OK", checks: [] },
    },
    quickWins: [{
      title: "CTA im Hero klarer machen",
      text: "CTA verbessern",
      description: "CTA verbessern",
      impact: "high",
      effort: "low",
      category: "conversion",
      weight: 1,
    }],
    criticalIssues: [],
    premiumInsightsPreview: [],
    revenueBlockers: [],
    measures: [{
      title: "Hero und CTA schaerfen",
      description: "Hero und CTA klarer formulieren.",
      effort: "niedrig",
      impact: "hoch",
      priority: 1,
      category: "CTA",
      sourceProblem: "CTA unklar",
    }],
    categoryScores: {},
    findings: [
      finding({ title: "Meta Title technisch ungenau", category: "seo", priority: "high", status: "error" }),
      finding({ title: "CTA im Hero ist unklar", category: "conversion", priority: "high", status: "warning" }),
      finding({ title: "Zu wenig Vertrauen vor der Anfrage", category: "trust", priority: "high", status: "warning" }),
      finding({ title: "Mobile Struktur wirkt schwer erfassbar", category: "ux", priority: "medium" }),
    ],
    recommendations: [],
    aiSuggestions: [],
    ...overrides,
  };
}

describe("buildPremiumReport", () => {
  it("erstellt Premium-Inhalte fuer bezahlte Reports", () => {
    const report = buildPremiumReport({
      analysis: createAnalysis(),
      paymentStatus: "paid",
    });

    expect(report.isPaid).toBe(true);
    expect(report.premiumSummary.mainReason).toBeTruthy();
    expect(report.topRevenueBlockers).toHaveLength(4);
    expect(report.quickImplementationPlan).toHaveLength(4);
    expect(report.priorityRoadmap.length).toBeGreaterThan(0);
  });

  it("funktioniert ohne Screenshots mit sauberem Visual-Hinweis", () => {
    const report = buildPremiumReport({
      analysis: createAnalysis({
        screenshots: undefined,
        visualPreviewAvailable: false,
      }),
      paymentStatus: "paid",
    });

    expect(report.visualAuditNotes[0]?.area).toBe("Visuelle Vorschau");
    expect(report.visualAuditNotes[0]?.note).toContain("keine visuelle Vorschau");
  });

  it("priorisiert Conversion und Trust vor rein technischem SEO", () => {
    const report = buildPremiumReport({
      analysis: createAnalysis(),
      paymentStatus: "paid",
    });

    expect(report.topRevenueBlockers[0]?.category).toBe("Anfrage-/Kaufwahrscheinlichkeit");
    expect(report.topRevenueBlockers[1]?.category).toBe("Vertrauen");
    expect(report.topRevenueBlockers.findIndex((item) => item.category === "SEO")).toBeGreaterThan(1);
  });

  it("markiert unbezahlte Reports nicht als paid", () => {
    const report = buildPremiumReport({
      analysis: createAnalysis(),
      paymentStatus: "open",
    });

    expect(report.isPaid).toBe(false);
  });

  it("formuliert die Conversion-Hypothese als sauberen deutschen Absatz", () => {
    const report = buildPremiumReport({
      analysis: createAnalysis({
        findings: [
          finding({
            title: "der nächste schritt ist nicht stark genug erkennbar.",
            category: "conversion",
            priority: "high",
            status: "warning",
            description: "Above the fold fehlt ein klarer CTA",
          }),
        ],
      }),
      paymentStatus: "paid",
    });

    expect(report.conversionHypothesis).toBe(
      "Wenn der nächste Schritt auf der Seite klarer sichtbar wird, verstehen Besucher schneller, was sie tun sollen. Dadurch sinkt die Reibung im sichtbaren Startbereich und die Wahrscheinlichkeit für Anfragen oder Käufe steigt.",
    );
    expect(report.conversionHypothesis).not.toMatch(/reduziert wird|der nächste schritt ist|CTA|Above the fold|\.\./i);
  });

  it("normalisiert Premium-Copy mit Umlauten und verständlichen Begriffen", () => {
    const report = buildPremiumReport({
      analysis: createAnalysis({
        quickWins: [{
          title: "CTA im Hero schaerfen",
          text: "CTA verbessern",
          description: "CTA verbessern",
          impact: "high",
          effort: "low",
          category: "conversion",
          weight: 1,
        }],
        measures: [{
          title: "CTA im Hero schaerfen",
          description: "CTA klarer formulieren.",
          effort: "niedrig",
          impact: "hoch",
          priority: 1,
          category: "CTA",
          sourceProblem: "CTA unklar",
        }],
      }),
      paymentStatus: "paid",
    });
    const text = JSON.stringify({
      premiumSummary: report.premiumSummary,
      topRevenueBlockers: report.topRevenueBlockers,
      quickImplementationPlan: report.quickImplementationPlan,
      visualAuditNotes: report.visualAuditNotes,
      conversionHypothesis: report.conversionHypothesis,
    });

    expect(text).toContain("schärfen");
    expect(text).toContain("Button");
    expect(text).toContain("Visuelle Führung");
    expect(text).not.toMatch(/\b(?:schaerfen|Fuehrung|naechste|naechsten|fuer)\b/);
    expect(text).not.toContain("Above the fold");
  });
});
