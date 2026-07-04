import { describe, expect, expectTypeOf, it } from "vitest";

import { buildPremiumReportPrompt } from "@/lib/ai/promptBuilder";
import type { PremiumReportInput } from "@/lib/ai/premiumReportInput";

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
        summary: "CTA ist unklar.",
        evidence: ["Im Startbereich ist kein eindeutiger Hauptbutton sichtbar."],
      },
      {
        category: "trust",
        score: 50,
        label: "Trust",
        summary: "Trust fehlt an kaufnahen Stellen.",
        evidence: ["Bewertungen oder Referenzen sind nicht frueh sichtbar."],
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
        title: "CTA im Hero ist nicht eindeutig",
        description: "Besucher erkennen den naechsten Schritt nicht schnell genug.",
        action: "Primaeren CTA im sichtbaren Startbereich klarer formulieren.",
        impact: "hoch",
        effort: "niedrig",
        category: "CTA",
        priority: 1,
        severity: "high",
        evidence: ["Naechster Schritt"],
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
        source: "Naechster Schritt",
      },
    ],
    opportunities: [
      {
        title: "Trust Proof ausbauen",
        description: "Vertrauensbelege frueher sichtbar machen.",
        category: "trust",
        severity: "medium",
        impact: "Mehr Sicherheit vor der Anfrage.",
        effort: "low",
        expectedEffect: "Mehr qualifizierte Anfragen aus bestehendem Traffic.",
        source: "finding",
        priorityScore: 83,
      },
    ],
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

function getUserPayload(input: PremiumReportInput) {
  const result = buildPremiumReportPrompt(input);
  const userPrompt = result.messages.find((message) => message.role === "user")?.content ?? "";
  const jsonStart = userPrompt.indexOf("{");

  return JSON.parse(userPrompt.slice(jsonStart)) as Record<string, unknown>;
}

describe("promptBuilder", () => {
  it("akzeptiert typisiert nur PremiumReportInput", () => {
    expectTypeOf(buildPremiumReportPrompt).parameters.toEqualTypeOf<[PremiumReportInput]>();
  });

  it("gibt eine stabile Message-Struktur und Summary zurueck", () => {
    const result = buildPremiumReportPrompt(createInput());

    expect(result.messages).toEqual([
      {
        role: "system",
        content: expect.any(String),
      },
      {
        role: "user",
        content: expect.any(String),
      },
    ]);
    expect(result.inputSummary).toEqual({
      url: "https://shop.test/",
      overallScore: 64,
      scoresCount: 2,
      criticalSignalsCount: 1,
      revenueBlockersCount: 1,
      measuresCount: 1,
      opportunitiesCount: 1,
    });
  });

  it("enthaelt die wichtigsten Sicherheits-Constraints", () => {
    const prompt = buildPremiumReportPrompt(createInput()).messages.map((message) => message.content).join("\n");

    expect(prompt).toContain("einzige Faktenbasis");
    expect(prompt).toContain("Bewerte keine Webseite frei");
    expect(prompt).toContain("Erfinde keine Fakten");
    expect(prompt).toContain("Behaupte nichts über Dinge, die nicht im Input stehen");
    expect(prompt).toContain("keine Garantien für Umsatzsteigerung");
    expect(prompt).toContain("Sprache: Deutsch");
    expect(prompt).toContain("Shop-Betreiber ohne technisches Spezialwissen");
  });

  it("enthaelt Score, Critical Signals, Revenue Blockers und Measures", () => {
    const payload = getUserPayload(createInput());

    expect(payload.analysis).toMatchObject({
      url: "https://shop.test/",
      analyzedAt: "2026-05-08T12:00:00.000Z",
      overallScore: 64,
    });
    expect(payload.scores).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ category: "conversion", score: 45 }),
        expect.objectContaining({ category: "trust", score: 50 }),
      ]),
    );
    expect(payload.criticalSignals).toEqual([
      expect.objectContaining({ title: "Naechster Schritt unklar", severity: "high" }),
    ]);
    expect(payload.revenueBlockers).toEqual([
      expect.objectContaining({ title: "CTA im Hero ist nicht eindeutig", action: expect.any(String) }),
    ]);
    expect(payload.measures).toEqual([
      expect.objectContaining({ title: "Hero und CTA schaerfen", priority: 1 }),
    ]);
  });

  it("fordert eine strukturierte JSON-Ausgabe an", () => {
    const payload = getUserPayload(createInput());

    expect(payload.requiredOutput).toMatchObject({
      format: "json",
      schema: {
        executiveSummary: "string",
        mainDiagnosis: "string",
        topLevers: [
          {
            title: "string",
            problem: "string",
            businessImpact: "string",
            recommendation: "string",
            firstStep: "string",
          },
        ],
        sevenDayPlan: [
          {
            day: "Tag 1-2 | Tag 3-5 | Tag 6-7",
            focus: "string",
            tasks: ["string"],
          },
        ],
        ownerConclusion: "string",
      },
    });
  });

  it("referenziert keine verbotenen Rohdaten- oder Zahlungsfelder", () => {
    const result = buildPremiumReportPrompt(
      createInput({
        detectedPageSignals: {
          heroText: ["HTML Audit"],
          ctaTexts: ["payment starten"],
          trustSignals: ["metadata sichtbar"],
          technicalNotes: ["screenshotUrl und contactRequestId duerfen nicht in Prompts."],
        },
      }),
    );
    const serialized = JSON.stringify(result.messages);

    expect(serialized).not.toMatch(/html/i);
    expect(serialized).not.toContain("screenshotUrl");
    expect(serialized).not.toMatch(/payment/i);
    expect(serialized).not.toContain("metadata");
    expect(serialized).not.toContain("contactRequestId");
  });

  it("hat einen stabilen Contract fuer einen Beispielinput", () => {
    const payload = getUserPayload(createInput());

    expect(payload).toMatchObject({
      analysis: {
        url: "https://shop.test/",
        requestedUrl: "https://shop.test",
        finalUrl: "https://shop.test/",
        analyzedAt: "2026-05-08T12:00:00.000Z",
        analysisMode: "rendered",
        overallScore: 64,
        totalFindings: 4,
        visibleFindings: 3,
      },
      detectedPageSignals: {
        heroText: ["Bessere Shops fuer mehr Anfragen"],
        ctaTexts: ["Angebot anfragen"],
        trustSignals: ["Impressum", "Datenschutz"],
      },
      technicalNotes: ["Die Analyse basiert auf der Seite, wie sie im Browser sichtbar wird."],
      constraints: {
        language: "de",
        audience: "shop-owner-non-technical",
        noInventedFacts: true,
        baseFactsOnlyOnAnalysis: true,
        noFreeWebsiteReview: true,
        noRevenueGuarantees: true,
        noClaimsOutsideInput: true,
      },
    });
  });
});
