import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { OpportunityList } from "@/components/results/opportunity-list";
import type { AnalysisOpportunity } from "@/types/analysis";

function createOpportunity(overrides: Partial<AnalysisOpportunity> = {}): AnalysisOpportunity {
  return {
    id: "opportunity-1",
    title: "CTA im Startbereich schaerfen",
    description: "Besucher erkennen den naechsten Schritt nicht schnell genug.",
    category: "conversion",
    severity: "high",
    businessImpact: "Mehr Besucher koennen in Anfragen umgewandelt werden.",
    aiOpportunity: "KI kann mehrere CTA-Varianten nach Nutzenversprechen vorbereiten.",
    suggestedModule: "AI CTA Rewrite",
    suggestedService: "Conversion Sprint",
    implementationEffort: "low",
    expectedEffect: "Klarerer Einstieg und mehr qualifizierte Klicks.",
    recurringPotential: true,
    ctaLabel: "Naechsten Schritt planen",
    ctaHref: "/kontakt?topic=conversion",
    sourceType: "revenueBlocker",
    priorityScore: 92,
    ...overrides,
  };
}

describe("OpportunityList", () => {
  it("rendert nichts ohne Opportunities", () => {
    expect(renderToStaticMarkup(React.createElement(OpportunityList, {}))).toBe("");
    expect(
      renderToStaticMarkup(React.createElement(OpportunityList, { opportunities: [] })),
    ).toBe("");
  });

  it("rendert businessorientierte Opportunity Cards und begrenzt die Liste", () => {
    const opportunities = Array.from({ length: 7 }, (_, index) =>
      createOpportunity({
        id: `opportunity-${index + 1}`,
        title: `Erkannter Hebel ${index + 1}`,
      }),
    );

    const markup = renderToStaticMarkup(
      React.createElement(OpportunityList, { opportunities }),
    );

    expect(markup).toContain("KI- und Umsatzchancen aus deiner Analyse");
    expect(markup).toContain("Erkannter Hebel 1");
    expect(markup).toContain("Business Impact");
    expect(markup).toContain("KI-Chance");
    expect(markup).toContain("Shophebel-Modul");
    expect(markup).toContain("Suggested Service");
    expect(markup).toContain("Expected Effect");
    expect(markup).toContain("Wiederkehrendes Potenzial");
    expect(markup).toContain("Naechsten Schritt planen");
    expect(markup).toContain("https://shophebel.vercel.app/?opportunity=Erkannter+Hebel+1");
    expect(markup).toContain("opportunitySource=analysis");
    expect(markup).toContain("module=AI+CTA+Rewrite");
    expect(markup).toContain("service=Conversion+Sprint");
    expect(markup).toContain("#kontakt");
    expect(markup).not.toContain("Erkannter Hebel 7");
  });

  it("faellt bei Opportunities ohne Modul oder Service auf den bestehenden CTA zurueck", () => {
    const opportunity = {
      ...createOpportunity({
        ctaHref: "/kontakt?topic=legacy",
      }),
      suggestedModule: undefined,
      suggestedService: undefined,
    } as unknown as AnalysisOpportunity;

    const markup = renderToStaticMarkup(
      React.createElement(OpportunityList, { opportunities: [opportunity] }),
    );

    expect(markup).toContain('href="/kontakt?topic=legacy"');
    expect(markup).toContain("Naechsten Schritt planen");
  });
});
