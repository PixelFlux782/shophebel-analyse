import { describe, expect, it } from "vitest";

import {
  FREE_VISIBLE_FINDINGS_LIMIT,
  FREE_VISIBLE_RECOMMENDATIONS_LIMIT,
  getAnalysisSummary,
  getLockedFindingsPreview,
  getRecommendationLabel,
  getVisualHotspots,
  getVisibleFindings,
  getVisibleRecommendations,
} from "@/lib/result-ui";
import { AnalysisResult, Finding, Recommendation } from "@/types/analysis";

function createFinding(
  title: string,
  priority: Finding["priority"],
  status: Finding["status"] = "warning",
): Finding {
  return {
    category: "seo",
    status,
    title,
    description: `${title} Beschreibung`,
    priority,
  };
}

function createRecommendation(
  title: string,
  impact: Recommendation["impact"],
  effort: Recommendation["effort"],
  weight: number,
): Recommendation {
  return {
    title,
    description: `${title} Beschreibung`,
    category: "conversion",
    impact,
    effort,
    weight,
  };
}

function createAnalysisResult(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    url: "https://shop.test/",
    requestedUrl: "https://shop.test",
    scannedAt: "2026-04-20T20:00:00.000Z",
    analysisMode: "rendered",
    finalUrl: "https://shop.test/",
    technicalNotes: [],
    screenshots: {
      fullPage: "/generated-screenshots/shop-full.png",
    },
    visualPreviewAvailable: true,
    visualMap: {
      pageWidth: 1440,
      pageHeight: 2200,
      viewportWidth: 1440,
      viewportHeight: 900,
      buttons: [{ x: 120, y: 180, width: 220, height: 56, label: "Jetzt kaufen" }],
      headings: [{ x: 100, y: 80, width: 640, height: 72, label: "Hero Headline" }],
      images: [{ x: 860, y: 140, width: 420, height: 320, label: "Produktbild" }],
      forms: [{ x: 120, y: 520, width: 540, height: 340, label: "Kontaktformular" }],
      links: [{ x: 100, y: 1980, width: 180, height: 24, label: "Impressum" }],
    },
    isPremium: false,
    totalFindings: 0,
    visibleFindings: 0,
    overallScore: 68,
    categoryScores: {
      seo: { category: "seo", label: "SEO", score: 62 },
      trust: { category: "trust", label: "Trust", score: 55 },
      conversion: { category: "conversion", label: "Conversion", score: 58 },
      ux: { category: "ux", label: "UX", score: 75 },
    },
    findings: [],
    recommendations: [],
    ...overrides,
  };
}

describe("result-ui helpers", () => {
  it("zeigt in der Free-Version nur die wichtigsten Findings", () => {
    const findings = [
      createFinding("Low 1", "low"),
      createFinding("High 1", "high", "error"),
      createFinding("Medium 1", "medium"),
      createFinding("High 2", "high"),
      createFinding("Low 2", "low"),
      createFinding("Medium 2", "medium"),
      createFinding("High 3", "high"),
    ];

    const visible = getVisibleFindings(findings, false);

    expect(visible).toHaveLength(FREE_VISIBLE_FINDINGS_LIMIT);
    expect(visible.map((finding) => finding.title)).toEqual([
      "High 1",
      "High 2",
      "High 3",
      "Medium 1",
      "Medium 2",
    ]);
  });

  it("zeigt in Premium alle Findings und liefert gesperrte Vorschau für Free", () => {
    const findings = [
      createFinding("High 1", "high"),
      createFinding("High 2", "high"),
      createFinding("Medium 1", "medium"),
      createFinding("Medium 2", "medium"),
      createFinding("Low 1", "low"),
      createFinding("Low 2", "low"),
      createFinding("Low 3", "low"),
    ];

    expect(getVisibleFindings(findings, true)).toHaveLength(findings.length);
    expect(getLockedFindingsPreview(findings).map((finding) => finding.title)).toEqual([
      "Low 2",
      "Low 3",
    ]);
  });

  it("zeigt in Free nur die wichtigsten Empfehlungen anhand des Gewichts", () => {
    const recommendations = [
      createRecommendation("Langfristig", "medium", "high", 12),
      createRecommendation("Schnellster Hebel", "high", "low", 0),
      createRecommendation("Mittlerer Hebel", "high", "medium", 1),
      createRecommendation("Kleiner Hebel", "low", "low", 20),
    ];

    const visible = getVisibleRecommendations(recommendations, false);

    expect(visible).toHaveLength(Math.min(FREE_VISIBLE_RECOMMENDATIONS_LIMIT, recommendations.length));
    expect(visible.map((recommendation) => recommendation.title)).toEqual([
      "Schnellster Hebel",
      "Mittlerer Hebel",
      "Langfristig",
    ]);
  });

  it("leitet Labels für Empfehlungen aus Impact und Effort ab", () => {
    expect(getRecommendationLabel(createRecommendation("A", "high", "low", 0))).toBe(
      "Schnellster Hebel",
    );
    expect(getRecommendationLabel(createRecommendation("B", "high", "medium", 1))).toBe(
      "Größte Wirkung",
    );
    expect(getRecommendationLabel(createRecommendation("C", "medium", "high", 12))).toBe(
      "Langfristige Optimierung",
    );
  });

  it("ordnet visuelle Hotspots pragmatisch den passenden DOM-Bereichen zu", () => {
    const result = createAnalysisResult({
      findings: [
        {
          category: "conversion",
          status: "error",
          title: "Keine klare CTA im Hero",
          description: "Im oberen Bereich fehlt eine sofort sichtbare Handlungsaufforderung.",
          priority: "high",
        },
        {
          category: "trust",
          status: "warning",
          title: "Impressum und Datenschutz sind kaum sichtbar",
          description: "Wichtige Vertrauenslinks wirken schwer auffindbar.",
          priority: "medium",
        },
      ],
      totalFindings: 2,
      visibleFindings: 2,
    });

    const hotspots = getVisualHotspots(result, "fullPage");

    expect(hotspots).toHaveLength(2);
    expect(hotspots[0]?.tone).toBe("problem");
    expect(hotspots[0]?.label).toBe("Oberer Seitenbereich");
    expect(hotspots[1]?.label).toBe("Impressum");
  });

  it("erstellt ein natuerlich klingendes Kurzfazit aus den Scores", () => {
    const summary = getAnalysisSummary(createAnalysisResult());

    expect(summary).toContain("solide Basis");
    expect(summary).toContain("Vertrauen");
  });
});
