import { describe, expect, it } from "vitest";

import { buildAnalysisOpportunities } from "@/lib/analyse/opportunity-engine";

describe("buildAnalysisOpportunities", () => {
  it("priorisiert Revenue Blocker und erzeugt businessorientierte Opportunities", () => {
    const opportunities = buildAnalysisOpportunities({
      revenueBlockers: [
        {
          problem: "Kontaktweg ist zu spaet sichtbar",
          whyItCostsCustomers: "Interessierte Besucher finden den naechsten Schritt nicht schnell genug.",
          action: "Kontaktmoeglichkeit frueher zeigen und klarer benennen.",
          estimatedEffort: "niedrig",
          estimatedImpact: "hoch",
          priority: 1,
          category: "CTA",
          sourceCheck: "Kontaktvertrauen",
        },
      ],
      measures: [
        {
          title: "Kundenfragen sichtbar beantworten",
          description: "FAQ-Bereich fuer kaufnahe Fragen ergaenzen.",
          effort: "mittel",
          impact: "mittel",
          priority: 2,
          category: "AI-Sichtbarkeit",
          sourceProblem: "Kundenfragen als Antworten",
        },
      ],
    });

    expect(opportunities[0]).toMatchObject({
      sourceType: "revenueBlocker",
      suggestedModule: "AI Lead Capture",
      suggestedService: "Conversion Sprint",
      ctaLabel: "KI-Modul anfragen",
      ctaHref: "/#kontakt",
      implementationEffort: "low",
    });
    expect(opportunities[0].id).toContain("revenueBlocker-1-kontaktweg-ist-zu-spaet-sichtbar");
  });

  it("vermeidet Dubletten und begrenzt die Ausgabe auf sechs Opportunities", () => {
    const findings = Array.from({ length: 8 }, (_, index) => ({
      title: index < 2 ? "Social Proof fehlt" : `Finding ${index}`,
      description: "Beschreibung",
      category: "trust",
      priority: "medium",
      status: "warning",
    }));

    const opportunities = buildAnalysisOpportunities({ findings });

    expect(opportunities).toHaveLength(6);
    expect(opportunities.filter((opportunity) => opportunity.title === "Social Proof fehlt")).toHaveLength(
      1,
    );
  });

  it("mappt Trust-Probleme auf Trust Booster Modul und Trust & Proof Sprint", () => {
    const opportunities = buildAnalysisOpportunities({
      findings: [
        {
          title: "Vertrauensbruch durch fehlende Belege",
          description: "Referenzen, Garantien und konkrete Proof-Elemente fehlen vor der Kaufentscheidung.",
          category: "trust",
          priority: "high",
          status: "warning",
        },
      ],
    });

    expect(opportunities[0]).toMatchObject({
      suggestedModule: "Trust Booster Modul",
      suggestedService: "Trust & Proof Sprint",
      ctaLabel: "Umsetzung besprechen",
      ctaHref: "/#kontakt",
    });
    expect(opportunities[0].businessImpact).toContain("verlorene Anfragen");
  });

  it("mappt CTA- und Conversion-Probleme auf Lead Capture oder Conversion Quick Wins", () => {
    const leadOpportunity = buildAnalysisOpportunities({
      revenueBlockers: [
        {
          problem: "Kontaktformular ist nach der Kaufentscheidung zu schwer erreichbar",
          category: "CTA",
          estimatedImpact: "hoch",
          estimatedEffort: "niedrig",
        },
      ],
    })[0];

    const quickWinOpportunity = buildAnalysisOpportunities({
      findings: [
        {
          title: "CTA Button bleibt zu unverbindlich",
          category: "conversion",
          priority: "medium",
        },
      ],
    })[0];

    expect(["AI Lead Capture", "Conversion Quick Wins"]).toContain(leadOpportunity.suggestedModule);
    expect(["Conversion Sprint", "Quick Fix Sprint"]).toContain(leadOpportunity.suggestedService);
    expect(quickWinOpportunity).toMatchObject({
      suggestedModule: "Conversion Quick Wins",
      suggestedService: "Quick Fix Sprint",
    });
  });

  it("mappt AI-Visibility-Probleme auf AI Visibility Check und AI Visibility Sprint", () => {
    const opportunities = buildAnalysisOpportunities({
      findings: [
        {
          title: "Sichtbarkeit in Google und KI-Antwortsystemen fehlt",
          description: "Kaufnahe Fragen werden nicht eindeutig beantwortet.",
          category: "AI-Sichtbarkeit",
          priority: "high",
        },
      ],
    });

    expect(opportunities[0]).toMatchObject({
      suggestedModule: "AI Visibility Check",
      suggestedService: "AI Visibility Sprint",
      ctaLabel: "KI-Modul anfragen",
      ctaHref: "/#kontakt",
    });
  });

  it("liefert defensive Fallback-Opportunities bei fehlenden Quellen", () => {
    const opportunities = buildAnalysisOpportunities({
      revenueBlockers: [null],
      measures: undefined,
      findings: [],
      aiSuggestions: [],
      overallScore: 62,
      url: "https://example.com",
    });

    expect(opportunities).toHaveLength(1);
    expect(opportunities[0]).toMatchObject({
      sourceType: "revenueBlocker",
      category: "Conversion",
    });

    const fallback = buildAnalysisOpportunities({
      revenueBlockers: [],
      measures: [],
      findings: [],
      aiSuggestions: [],
    });

    expect(fallback).toHaveLength(2);
    expect(fallback.every((opportunity) => opportunity.sourceType === "fallback")).toBe(true);
    expect(fallback[0]).toMatchObject({
      suggestedService: "Premium Roadmap",
      ctaHref: "/analyse",
    });
    expect(fallback[1]).toMatchObject({
      suggestedModule: "AI Visibility Check",
      suggestedService: "AI Visibility Sprint",
      ctaLabel: "Roadmap freischalten",
      ctaHref: "/preise",
    });
  });

  it("nutzt AI-Suggestions als eigene Opportunity-Quelle", () => {
    const opportunities = buildAnalysisOpportunities({
      aiSuggestions: [
        {
          id: "suggestion-1",
          title: "FAQ fuer kaufnahe Fragen aufbauen",
          summary: "Wichtige Kundenfragen sollten als strukturierte Antworten sichtbar werden.",
          actionSteps: ["Fragen sammeln", "Antworten priorisieren"],
          expectedImpact: "high",
          category: "aiVisibility",
        },
      ],
      overallScore: 68,
      url: "https://example.com",
    });

    expect(opportunities[0]).toMatchObject({
      sourceType: "aiSuggestion",
      suggestedModule: "AI Visibility Check",
      suggestedService: "AI Visibility Sprint",
      implementationEffort: "low",
    });
  });
});
