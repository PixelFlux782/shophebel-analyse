import { describe, expect, it, vi } from "vitest";

import { discoverPremiumPages, premiumPageDiscoveryLimits } from "@/lib/premium/premiumPageDiscovery";

describe("discoverPremiumPages", () => {
  it("filtert externe Links, Downloads und Loginbereiche aus", async () => {
    const pages = await discoverPremiumPages("https://shop.test/", {
      fetchHtml: async () => `
        <html><head><title>Testshop</title></head><body>
          <a href="/leistungen">Leistungen</a>
          <a href="https://extern.test/kontakt">Externer Kontakt</a>
          <a href="/katalog.pdf">PDF</a>
          <a href="/login">Login</a>
          <a href="mailto:hallo@shop.test">Mail</a>
        </body></html>
      `,
    });

    expect(pages.map((page) => page.url)).toEqual([
      "https://shop.test/",
      "https://shop.test/leistungen",
    ]);
    expect(pages[1]).toMatchObject({
      role: "offer",
      reason: expect.stringContaining("Angebots"),
    });
  });

  it("priorisiert relevante Seitentypen deterministisch und begrenzt auf maximal 5 Seiten", async () => {
    const pages = await discoverPremiumPages("https://www.shop.test/start?utm=1#hero", {
      fetchHtml: async () => `
        <html><body>
          <a href="/blog">Blog</a>
          <a href="/kontakt">Kontakt</a>
          <a href="/produkte">Produkte</a>
          <a href="/ueber-uns">Über uns</a>
          <a href="/leistungen">Leistungen</a>
          <a href="/preise">Preise</a>
          <a href="/faq">FAQ</a>
        </body></html>
      `,
    });

    expect(pages).toHaveLength(premiumPageDiscoveryLimits.maxPages);
    expect(pages.map((page) => page.role)).toEqual(["home", "offer", "product", "trust", "contact"]);
    expect(pages[0]?.url).toBe("https://www.shop.test/start");
  });

  it("faellt bei Discovery-Fehlern sauber auf die Startseite zurueck", async () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const pages = await discoverPremiumPages("https://shop.test/", {
      fetchHtml: async () => {
        throw new Error("network");
      },
    });

    expect(pages).toEqual([
      expect.objectContaining({
        url: "https://shop.test/",
        role: "home",
      }),
    ]);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "[premium-discovery] start page discovery failed",
      expect.objectContaining({ reason: "network" }),
    );
  });
});
