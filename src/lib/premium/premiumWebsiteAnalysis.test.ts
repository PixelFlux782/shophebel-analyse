import { describe, expect, it } from "vitest";

import { buildPremiumWebsiteAnalysis } from "@/lib/premium/premiumWebsiteAnalysis";
import type { PremiumDiscoveredPage } from "@/lib/premium/premiumPageDiscovery";
import type { AnalysisResult } from "@/types/analysis";

function createAnalysis(url: string, score: number, problem: string, overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  const now = "2026-07-06T10:00:00.000Z";

  return {
    url,
    createdAt: now,
    requestedUrl: url,
    scannedAt: now,
    analysisMode: "static",
    finalUrl: url,
    technicalNotes: [],
    visualPreviewAvailable: false,
    isPremium: false,
    totalFindings: 1,
    visibleFindings: 1,
    overallScore: score,
    categories: {
      seo: { score: 80, label: "SEO", summary: "OK", checks: [] },
      performance: { score: 70, label: "Performance", summary: "OK", checks: [] },
      trust: { score: score - 10, label: "Trust", summary: "Trust schwach", checks: [] },
      conversion: { score, label: "Conversion", summary: "CTA unklar", checks: [] },
      design: { score: 65, label: "Design", summary: "OK", checks: [] },
      aiVisibility: { score: 75, label: "AI", summary: "OK", checks: [] },
    },
    quickWins: [],
    criticalIssues: [],
    premiumInsightsPreview: [],
    revenueBlockers: [{
      problem,
      whyItCostsCustomers: "Besucher zoegern vor der Anfrage.",
      action: "CTA und Vertrauensbelege klarer platzieren.",
      estimatedEffort: "niedrig",
      estimatedImpact: "hoch",
      priority: 1,
      category: "CTA",
      sourceCheck: "CTA",
    }],
    measures: [{
      title: "CTA schaerfen",
      description: "CTA und Vertrauensbelege klarer platzieren.",
      effort: "niedrig",
      impact: "hoch",
      priority: 1,
      category: "CTA",
      sourceProblem: problem,
    }],
    categoryScores: {},
    findings: [],
    recommendations: [],
    ...overrides,
  };
}

function page(url: string, role: PremiumDiscoveredPage["role"], label: string): PremiumDiscoveredPage {
  return {
    url,
    role,
    label,
    title: label,
    reason: `Signal fuer ${role}`,
  };
}

describe("buildPremiumWebsiteAnalysis", () => {
  it("aggregiert mehrere Seiten zu einer Website-weiten Bewertung", () => {
    const home = page("https://shop.test/", "home", "Startseite");
    const offer = page("https://shop.test/leistungen", "offer", "Leistungen");
    const contact = page("https://shop.test/kontakt", "contact", "Kontakt");
    const website = buildPremiumWebsiteAnalysis({
      startAnalysis: createAnalysis(home.url, 70, "CTA ist unklar"),
      pageAnalyses: [
        { page: home, analysis: createAnalysis(home.url, 70, "CTA ist unklar") },
        { page: offer, analysis: createAnalysis(offer.url, 50, "CTA ist unklar") },
        { page: contact, analysis: createAnalysis(contact.url, 80, "Formular braucht Vertrauen") },
      ],
    });

    expect(website.pages).toHaveLength(3);
    expect(website.overallWebsiteScore).toBe(67);
    expect(website.weakestPage).toMatchObject({ label: "Leistungen", score: 50 });
    expect(website.strongestPage).toMatchObject({ label: "Kontakt", score: 80 });
    expect(website.repeatedProblems).toContain("CTA ist unklar");
    expect(website.conversionPathAssessment).toContain("Angebot und Kontakt");
    expect(website.topPrioritiesWebsiteWide).toHaveLength(3);
    expect(website.sevenDayPlan).toHaveLength(3);
  });

  it("faellt bei nur einer Seite auf eine ruhige Einzelseiten-Premiumanalyse zurueck", () => {
    const home = page("https://shop.test/", "home", "Startseite");
    const website = buildPremiumWebsiteAnalysis({
      startAnalysis: createAnalysis(home.url, 62, "Trust fehlt"),
      pageAnalyses: [
        { page: home, analysis: createAnalysis(home.url, 62, "Trust fehlt") },
      ],
    });

    expect(website.pages).toHaveLength(1);
    expect(website.fallbackNote).toContain("keine weiteren");
    expect(website.missingPageTypes).toEqual(["offer", "product", "trust", "contact"]);
    expect(website.crossPageDiagnosis).toContain("keine sinnvolle Unterseitenstruktur");
  });

  it("uebernimmt Screenshot-Referenzen pro Premium-Unterseite in das Aggregationsmodell", () => {
    const home = page("https://shop.test/", "home", "Startseite");
    const offer = page("https://shop.test/leistungen", "offer", "Leistungen");
    const screenshot = "https://cdn.example.com/screenshots/leistungen-viewport.png";
    const website = buildPremiumWebsiteAnalysis({
      startAnalysis: createAnalysis(home.url, 70, "CTA ist unklar"),
      pageAnalyses: [
        { page: home, analysis: createAnalysis(home.url, 70, "CTA ist unklar") },
        {
          page: offer,
          analysis: createAnalysis(offer.url, 76, "Angebot braucht Proof", {
            screenshots: { viewport: screenshot },
            visualPreviewAvailable: true,
          }),
        },
      ],
    });

    expect(website.pages[1]).toMatchObject({
      label: "Leistungen",
      screenshot,
      screenshotUnavailableReason: undefined,
    });
  });

  it("setzt fuer analysierte Premium-Unterseiten ohne Screenshot einen ruhigen Fallback-Grund", () => {
    const home = page("https://shop.test/", "home", "Startseite");
    const contact = page("https://shop.test/kontakt", "contact", "Kontakt");
    const website = buildPremiumWebsiteAnalysis({
      startAnalysis: createAnalysis(home.url, 70, "CTA ist unklar"),
      pageAnalyses: [
        { page: home, analysis: createAnalysis(home.url, 70, "CTA ist unklar") },
        {
          page: contact,
          analysis: createAnalysis(contact.url, 68, "Kontakt braucht Vertrauen", {
            analysisMode: "static",
          }),
        },
      ],
    });

    expect(website.pages[1].analysisStatus).toBe("analyzed");
    expect(website.pages[1].screenshot).toBeUndefined();
    expect(website.pages[1].screenshotUnavailableReason).toContain("ohne gerenderte Vorschau");
  });
});
