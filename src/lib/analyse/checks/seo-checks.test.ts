import { describe, expect, it } from "vitest";

import { runSeoChecks } from "@/lib/analyse/checks/seo-checks";

const strongSeoHtml = `
<!doctype html>
<html lang="de">
  <head>
    <title>Shophebel Testshop fuer starke SEO Signale</title>
    <meta name="description" content="Diese Startseite bietet eine starke SEO-Basis mit sauberer Struktur, guter Description und klaren Open-Graph-Signalen fuer bessere Sichtbarkeit." />
    <link rel="canonical" href="https://shop.test/" />
    <meta property="og:title" content="Shophebel Testshop" />
    <meta property="og:description" content="Mehr Sichtbarkeit fuer deinen Shop." />
  </head>
  <body>
    <h1>Shophebel Testshop</h1>
    <h2>Mehr Sichtbarkeit</h2>
    <img src="/hero.jpg" alt="Hero Motiv" />
    <img src="/product.jpg" alt="Produktfoto" />
  </body>
</html>
`;

const weakSeoHtml = `
<!doctype html>
<html>
  <head></head>
  <body>
    <h1>Erste H1</h1>
    <h1>Zweite H1</h1>
    <img src="/hero.jpg" />
    <img src="/product.jpg" />
    <img src="/team.jpg" />
  </body>
</html>
`;

describe("runSeoChecks", () => {
  it("erkennt starke SEO-Grundsignale", () => {
    const result = runSeoChecks(strongSeoHtml);

    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.findings.some((finding) => finding.title === "Der Seitenname ist klar genug")).toBe(true);
    expect(
      result.findings.some((finding) => finding.title === "Die Kurzbeschreibung ist gut vorbereitet"),
    ).toBe(true);
    expect(result.findings.some((finding) => finding.title === "Google erkennt die Hauptversion der Seite")).toBe(true);
  });

  it("meldet fehlende oder schwache SEO-Signale mit Punktabzug", () => {
    const result = runSeoChecks(weakSeoHtml);

    expect(result.score).toBeLessThan(60);
    expect(result.findings.some((finding) => finding.title === "Deine Seite hat keinen klaren Namen fuer Suchergebnisse")).toBe(true);
    expect(result.findings.some((finding) => finding.title === "Google und KI bekommen keine klare Kurzbeschreibung")).toBe(
      true,
    );
    expect(result.findings.some((finding) => finding.title === "Die Seite sendet mehrere Hauptbotschaften")).toBe(
      true,
    );
    expect(result.findings.some((finding) => finding.title === "Bilder erklaeren sich nicht gut genug")).toBe(
      true,
    );
  });
});
