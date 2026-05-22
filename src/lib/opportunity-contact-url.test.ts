import { describe, expect, it } from "vitest";

import { buildOpportunityContactUrl } from "@/lib/opportunity-contact-url";

describe("buildOpportunityContactUrl", () => {
  it("baut eine sauber encodierte Kontakt-Handoff-URL", () => {
    const href = buildOpportunityContactUrl({
      opportunityTitle: "Größe & Vertrauen schärfen",
      businessImpact: "Mehr Anfragen über Bestands-Traffic",
      suggestedModule: "KI-Modul: CTA & Copy",
      suggestedService: "Quick Fix Sprint",
      ctaLabel: "Diesen Hebel besprechen",
      source: "analysis",
    });

    expect(href).toBe(
      "https://shophebel.vercel.app/?opportunity=Gr%C3%B6%C3%9Fe+%26+Vertrauen+sch%C3%A4rfen&opportunitySource=analysis&impact=Mehr+Anfragen+%C3%BCber+Bestands-Traffic&module=KI-Modul%3A+CTA+%26+Copy&service=Quick+Fix+Sprint&cta=Diesen+Hebel+besprechen#kontakt",
    );
  });
});
