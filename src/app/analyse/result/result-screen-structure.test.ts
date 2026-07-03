import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync(join(process.cwd(), "src/app/analyse/result/[id]/page.tsx"), "utf8");

function indexOf(text: string) {
  const index = pageSource.indexOf(text);
  expect(index, `${text} fehlt in der Result-Seite`).toBeGreaterThanOrEqual(0);
  return index;
}

describe("Result Screen Struktur", () => {
  it("ordnet die Hauptbloecke in der gewuenschten Reihenfolge", () => {
    const hero = indexOf("<MissionResultHero");
    const visual = indexOf("<VisualAuditSection");
    const premium = indexOf("<PremiumReportSection");
    const levers = indexOf("<OpportunityList");
    const roadmap = indexOf("<SevenDayRoadmap");
    const details = indexOf("Detailanalyse und weitere Befunde anzeigen");

    expect(hero).toBeLessThan(visual);
    expect(visual).toBeLessThan(premium);
    expect(premium).toBeLessThan(levers);
    expect(levers).toBeLessThan(roadmap);
    expect(roadmap).toBeLessThan(details);
  });

  it("stapelt alte Hauptueberschriften nicht mehr als eigene Hauptbloecke", () => {
    expect(pageSource).not.toContain("<RecommendationsList recommendations={analysis.recommendations} isPremium />\n            </section>");
    expect(pageSource.match(/<OpportunityList/g)).toHaveLength(1);
    expect(pageSource).toContain("<details");
    expect(indexOf("Detailanalyse und weitere Befunde anzeigen")).toBeLessThan(indexOf("<RevenueBlockersReport"));
  });
});
