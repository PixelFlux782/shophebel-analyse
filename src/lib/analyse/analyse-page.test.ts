import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchHtmlMock = vi.hoisted(() => vi.fn());
const fetchRobotsTxtMock = vi.hoisted(() => vi.fn());
const generateSuggestionsMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/analyse/fetch-html", () => ({
  InvalidUrlError: class InvalidUrlError extends Error {},
  FetchHtmlError: class FetchHtmlError extends Error {},
  fetchHtml: fetchHtmlMock,
}));

vi.mock("@/lib/analyse/fetch-rendered-html", () => ({
  FetchRenderedHtmlError: class FetchRenderedHtmlError extends Error {},
  fetchRenderedHtml: vi.fn(),
}));

vi.mock("@/lib/analyse/fetch-robots", () => ({
  fetchRobotsTxt: fetchRobotsTxtMock,
}));

vi.mock("@/lib/analyse/content-quality", async () => {
  const actual = await vi.importActual<typeof import("@/lib/analyse/content-quality")>(
    "@/lib/analyse/content-quality",
  );

  return {
    ...actual,
    shouldUseRenderedFallback: vi.fn(() => false),
  };
});

vi.mock("@/lib/ai/generate-suggestions", () => ({
  generateSuggestions: generateSuggestionsMock,
}));

import { analysePage, shouldPreferRenderedAnalysis } from "@/lib/analyse/analyse-page";

const html = `
  <!doctype html>
  <html lang="de">
    <head>
      <title>Beispiel Shop fuer nachhaltige Pflegeprodukte und Geschenke</title>
      <meta
        name="description"
        content="Nachhaltige Pflegeprodukte, Geschenke und Beratung fuer bewusste Kundinnen und Kunden."
      />
    </head>
    <body>
      <header>
        <a href="/produkte">Produkte</a>
        <a href="/beratung">Beratung</a>
        <a href="/kontakt">Kontakt</a>
      </header>
      <main>
        <h1>Nachhaltige Pflegeprodukte fuer sensible Haut</h1>
        <p>
          Unser Shop zeigt handgemachte Pflegeprodukte, klare Inhaltsstoffe und persoenliche Beratung.
          Kundinnen und Kunden finden Geschenksets, Seifen, Cremes und saisonale Empfehlungen. Wir
          erklaeren Material, Herstellung, Pflegehinweise, Versand und Rueckgabe transparent, damit
          Besucherinnen und Besucher schnell Vertrauen aufbauen und den passenden naechsten Schritt
          finden.
        </p>
        <p>
          Fuer lokale Kunden gibt es Abholung, individuelle Beratung und Geschenkverpackung. Wiederkehrende
          Fragen zu Allergien, Inhaltsstoffen, Lieferzeiten, Nachhaltigkeit, Anwendung und Pflege werden in
          ausfuehrlichen Texten beantwortet. Dieser lange Inhalt verhindert, dass die Testseite als leere
          JavaScript-Shell eingestuft wird.
        </p>
        <button>Jetzt Beratung anfragen</button>
      </main>
    </body>
  </html>
`;

describe("rendered analysis policy", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("nutzt rendered analysis im Development standardmaessig", () => {
    vi.stubEnv("NODE_ENV", "development");

    expect(shouldPreferRenderedAnalysis()).toBe(true);
  });

  it("nutzt static analysis, wenn rendered explizit deaktiviert ist", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("SHOPHEBEL_RENDERED_ANALYSIS", "false");

    expect(shouldPreferRenderedAnalysis()).toBe(false);
  });

  it("aktiviert rendered analysis in Production per ENV-Schalter", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SHOPHEBEL_RENDERED_ANALYSIS", "true");

    expect(shouldPreferRenderedAnalysis()).toBe(true);
  });

  it("unterstuetzt den expliziten Modus-Schalter", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SHOPHEBEL_ANALYSIS_MODE", "rendered");

    expect(shouldPreferRenderedAnalysis()).toBe(true);

    vi.stubEnv("SHOPHEBEL_ANALYSIS_MODE", "static");

    expect(shouldPreferRenderedAnalysis()).toBe(false);
  });
});

describe("analysePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("SHOPHEBEL_ANALYSIS_MODE", "static");
    vi.stubEnv("SHOPHEBEL_RENDERED_ANALYSIS", "static");
    fetchRobotsTxtMock.mockResolvedValue(undefined);
    generateSuggestionsMock.mockResolvedValue([
      {
        id: "suggestion-trust",
        title: "Trust-Signale konkreter machen",
        summary: "Zeige Bewertungen und Kontaktwege naeher am ersten CTA.",
        actionSteps: ["Bewertungen zeigen", "Kontaktweg ergaenzen"],
        expectedImpact: "high",
        category: "trust",
        linkedFindingTitle: "Kontaktmoeglichkeiten sind wenig sichtbar",
      },
    ]);
  });

  it("reichert neue Analyse-Ergebnisse intern mit Opportunities an", async () => {
    fetchHtmlMock.mockResolvedValue({
      requestedUrl: "https://example.com/",
      finalUrl: "https://example.com/shop",
      html,
      loadTimeMs: 240,
    });

    const result = await analysePage("https://example.com");

    expect(result.aiSuggestions).toHaveLength(1);
    expect(result.opportunities).toBeDefined();
    expect(result.opportunities?.length).toBeGreaterThan(0);
    expect(result.opportunities?.[0]).toEqual(
      expect.objectContaining({
        ctaHref: expect.any(String),
        sourceType: expect.any(String),
      }),
    );
  });
});
