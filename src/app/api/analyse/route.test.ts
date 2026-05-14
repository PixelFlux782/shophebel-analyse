import { lookup } from "node:dns/promises";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/analyse/route";

vi.mock("node:dns/promises", () => ({
  lookup: vi.fn(),
}));

const lookupMock = vi.mocked(lookup);

const sampleHtml = `
<!doctype html>
<html lang="de">
  <head>
    <title>Shophebel Testshop für bessere Conversion</title>
    <meta name="description" content="Teste deinen Shop mit einer klaren Analyse für SEO, Vertrauen, Conversion und UX mit sichtbaren Optimierungspotenzialen." />
    <link rel="canonical" href="https://shop.test/" />
    <meta property="og:title" content="Shophebel Testshop" />
    <meta property="og:description" content="Mehr Klarheit für deinen Shop." />
  </head>
  <body>
    <header>
      <a href="/kontakt">Kontakt</a>
      <a href="/impressum">Impressum</a>
      <a href="/datenschutz">Datenschutz</a>
    </header>
    <main>
      <h1>Mehr Umsatz für deinen Shop</h1>
      <h2>Vorteile im Überblick</h2>
      <p>Unser Angebot ist professionell, einfach und effizient. Kunden lieben die schnelle Umsetzung.</p>
      <p>Sichere Zahlung, Versand, Rueckgabe und Kundenservice sind klar sichtbar.</p>
      <p>Bewertungen und Erfahrungen helfen bei der Kaufentscheidung.</p>
      ${"<p>Zusatzinhalt für eine aussagekraeftige statische Analyse mit ausreichend Text und Struktur.</p>".repeat(20)}
      <a href="/starten">Jetzt starten</a>
      <button>Jetzt bestellen</button>
      <img src="/hero.jpg" alt="Hero Bild" />
      <img src="/product.jpg" alt="Produktbild" />
      <a href="/produkte">Produkte</a>
      <a href="/angebote">Angebote</a>
      <a href="/bewertungen">Bewertungen</a>
    </main>
    <footer>
      <p>kontakt@shop.test</p>
      <p>+49 30 1234567</p>
    </footer>
  </body>
</html>
`;

function createRequest(body: unknown) {
  return new NextRequest("http://localhost:3001/api/analyse", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
    },
  });
}

describe("POST /api/analyse", () => {
  beforeEach(() => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    lookupMock.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        url: "https://shop.test/",
        headers: {
          get: (name: string) =>
            name.toLowerCase() === "content-type" ? "text/html; charset=utf-8" : null,
        },
        text: async () => sampleHtml,
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("liefert eine echte Analyse mit Scores, Findings und Empfehlungen", async () => {
    const response = await POST(createRequest({ url: "shop.test" }));
    const payload = (await response.json()) as {
      id: string;
      url: string;
      overallScore: number;
      analysisMode: "static" | "rendered";
      finalUrl?: string;
      technicalNotes?: string[];
      screenshots?: {
        fullPage?: string;
        viewport?: string;
      };
      visualPreviewAvailable?: boolean;
      aiSuggestions?: Array<{ title: string; actionSteps: string[] }>;
      isPremium: boolean;
      totalFindings: number;
      visibleFindings: number;
      categoryScores: {
        seo: { score: number };
        trust: { score: number };
        conversion: { score: number };
        ux: { score: number };
      };
      findings: Array<{ title: string }>;
      recommendations: Array<{ title: string; weight: number }>;
    };

    expect(response.status).toBe(200);
    expect(payload.id).toBeTruthy();
    expect(payload.url).toBe("https://shop.test/");
    expect(payload.analysisMode).toBe("static");
    expect(payload.finalUrl).toBe("https://shop.test/");
    expect(payload.overallScore).toBeGreaterThan(0);
    expect(payload.isPremium).toBe(false);
    expect(payload.visualPreviewAvailable).toBe(false);
    expect(payload.screenshots).toBeUndefined();
    expect(payload.aiSuggestions?.length).toBeGreaterThan(0);
    expect(payload.aiSuggestions?.every((entry) => entry.actionSteps.length > 0)).toBe(true);
    expect(payload.technicalNotes?.length).toBeGreaterThan(0);
    expect(payload.totalFindings).toBe(payload.findings.length);
    expect(payload.visibleFindings).toBeLessThanOrEqual(payload.totalFindings);
    expect(payload.categoryScores.seo.score).toBeGreaterThan(0);
    expect(payload.categoryScores.trust.score).toBeGreaterThan(0);
    expect(payload.categoryScores.conversion.score).toBeGreaterThan(0);
    expect(payload.categoryScores.ux.score).toBeGreaterThan(0);
    expect(payload.findings.length).toBeGreaterThan(0);
    expect(payload.recommendations.every((entry) => typeof entry.weight === "number")).toBe(true);
  });

  it("liefert die Analyse auch dann zurück, wenn die Supabase-Speicherung fehlschlaegt", async () => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        url: "https://shop.test/",
        headers: {
          get: (name: string) =>
            name.toLowerCase() === "content-type" ? "text/html; charset=utf-8" : null,
        },
        text: async () => sampleHtml,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        url: "https://shop.test/robots.txt",
        headers: {
          get: () => "text/plain",
        },
        text: async () => "",
      })
      .mockRejectedValueOnce(new Error("unable to verify the first certificate"));

    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(createRequest({ url: "shop.test" }));
    const payload = (await response.json()) as {
      id?: string;
      url: string;
      overallScore: number;
      error?: string;
    };

    expect(response.status).toBe(200);
    expect(payload.error).toBeUndefined();
    expect(payload.id).toBeTruthy();
    expect(payload.url).toBe("https://shop.test/");
    expect(payload.overallScore).toBeGreaterThan(0);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "analysis_persistence_failed",
      expect.any(Error),
    );
  });

  it("ignoriert ungültige Lead-IDs ohne die Analyse abzubrechen", async () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const response = await POST(createRequest({
      url: "shop.test",
      contactRequestId: "keine-uuid",
      auditContextId: "22222222-2222-4222-8222-222222222222",
      leadContext: { company: "Test GmbH" },
    }));
    const payload = (await response.json()) as {
      id?: string;
      metadata?: {
        contactRequestId?: string;
        auditContextId?: string;
        leadContext?: Record<string, unknown>;
      };
    };

    expect(response.status).toBe(200);
    expect(payload.id).toBeTruthy();
    expect(payload.metadata?.contactRequestId).toBeUndefined();
    expect(payload.metadata?.auditContextId).toBe("22222222-2222-4222-8222-222222222222");
    expect(payload.metadata?.leadContext).toEqual({ company: "Test GmbH" });
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "[analysis] Ignoring invalid lead linkage UUID",
      {
        fieldName: "contactRequestId",
        value: "keine-uuid",
      },
    );
  });

  it("gibt bei ungültiger URL einen 400-Fehler zurück", async () => {
    const response = await POST(createRequest({ url: "" }));
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(payload.error).toContain("URL");
  });

  it("gibt bei Abrufproblemen einen 500-Fehler zurück", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        url: "https://shop.test/",
        headers: {
          get: () => "text/html; charset=utf-8",
        },
        text: async () => "",
      }),
    );

    const response = await POST(createRequest({ url: "https://shop.test" }));
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(500);
    expect(payload.error).toContain("geladen");
  });
});
