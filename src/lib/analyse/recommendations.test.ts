import { describe, expect, it } from "vitest";

import { buildRecommendations } from "@/lib/analyse/recommendations";
import { Finding } from "@/types/analysis";

function createFinding(
  title: string,
  category: Finding["category"],
  priority: Finding["priority"],
): Finding {
  return {
    category,
    status: "error",
    title,
    description: `${title} Beschreibung`,
    priority,
  };
}

describe("buildRecommendations", () => {
  it("erzeugt gewichtete Empfehlungen fuer bekannte Findings", () => {
    const recommendations = buildRecommendations([
      createFinding("Google und KI bekommen keine klare Kurzbeschreibung", "seo", "high"),
      createFinding("Impressum fehlt", "trust", "high"),
      createFinding("Social Proof fehlt", "conversion", "medium"),
    ]);

    expect(recommendations).toHaveLength(3);
    expect(recommendations.every((recommendation) => typeof recommendation.weight === "number")).toBe(
      true,
    );
    expect(recommendations.find((recommendation) => recommendation.title.includes("Kurzbeschreibung")))
      .toMatchObject({
        impact: "high",
        effort: "low",
        weight: 0,
      });
  });

  it("verwendet fuer unbekannte Findings eine sinnvolle Fallback-Empfehlung", () => {
    const recommendations = buildRecommendations([
      createFinding("Unbekanntes Problem", "ux", "medium"),
    ]);

    expect(recommendations[0]).toMatchObject({
      title: "Unbekanntes Problem verbessern",
      category: "ux",
      impact: "medium",
    });
  });
});
