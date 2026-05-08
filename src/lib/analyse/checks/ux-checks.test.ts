import { describe, expect, it } from "vitest";

import { runUxChecks } from "@/lib/analyse/checks/ux-checks";

const strongUxHtml = `
<!doctype html>
<html>
  <body>
    <main>
      <h1>Shophebel Startseite</h1>
      <h2>Mehr Umsatz</h2>
      <h3>Die naechsten Schritte</h3>
      ${"<p>Das ist ein strukturierter Absatz mit relevanten Inhalten fuer Nutzer und Orientierung.</p>".repeat(30)}
      <img src="/hero.jpg" alt="Hero" />
      <img src="/team.jpg" alt="Team" />
      <a href="/produkte">Produkte</a>
      <a href="/preise">Preise</a>
      <a href="/kontakt">Kontakt</a>
      <a href="/bewertungen">Bewertungen</a>
    </main>
  </body>
</html>
`;

const weakUxHtml = `
<!doctype html>
<html>
  <body>
    <main>
      <p>Kurz.</p>
    </main>
  </body>
</html>
`;

describe("runUxChecks", () => {
  it("erkennt ausreichenden Content und Struktur", () => {
    const result = runUxChecks(strongUxHtml, { pageUrl: "https://shop.test" });

    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(
      result.findings.some((finding) => finding.title === "Ausreichend Textinhalt vorhanden"),
    ).toBe(true);
    expect(result.findings.some((finding) => finding.title === "Headings sind strukturiert")).toBe(
      true,
    );
    expect(
      result.findings.some((finding) => finding.title === "Interne Navigation ist vorhanden"),
    ).toBe(true);
  });

  it("meldet zu wenig Inhalt und fehlende Struktur", () => {
    const result = runUxChecks(weakUxHtml, { pageUrl: "https://shop.test" });

    expect(result.score).toBeLessThan(30);
    expect(
      result.findings.some((finding) => finding.title === "Sehr wenig Content auf der Startseite"),
    ).toBe(true);
    expect(
      result.findings.some((finding) => finding.title === "Keine visuellen Elemente gefunden"),
    ).toBe(true);
    expect(
      result.findings.some((finding) => finding.title === "Keine internen Links gefunden"),
    ).toBe(true);
    expect(result.findings.some((finding) => finding.title === "Seite wirkt sehr leer")).toBe(
      true,
    );
  });
});
