import { describe, expect, it } from "vitest";

import { runConversionChecks } from "@/lib/analyse/checks/conversion-checks";

const strongConversionHtml = `
<!doctype html>
<html>
  <body>
    <main>
      <p>Jetzt starten und das Angebot testen. Unsere Vorteile sind professionell, einfach und effizient.</p>
      <p>Kunden lieben unsere Bewertungen, Rezensionen und Erfahrungen mit dem Produkt.</p>
      <p>Heute kostenlos testen, Preis in Euro und attraktives Angebot sichtbar.</p>
      <a href="/starten">Jetzt starten</a>
      <a href="/angebot">Angebot anfragen</a>
      <button>Jetzt bestellen</button>
    </main>
  </body>
</html>
`;

const weakConversionHtml = `
<!doctype html>
<html>
  <body>
    <main>
      <p>Willkommen auf unserer Startseite ohne klare Produktkommunikation.</p>
    </main>
  </body>
</html>
`;

describe("runConversionChecks", () => {
  it("erkennt CTA, Nutzen, Social Proof und Preisbezug", () => {
    const result = runConversionChecks(strongConversionHtml);

    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(
      result.findings.some((finding) => finding.title === "CTA-Woerter im Text vorhanden"),
    ).toBe(true);
    expect(
      result.findings.some((finding) => finding.title === "Mehrere CTA-Elemente vorhanden"),
    ).toBe(true);
    expect(result.findings.some((finding) => finding.title === "Nutzenargumente vorhanden")).toBe(
      true,
    );
    expect(result.findings.some((finding) => finding.title === "Social Proof ist sichtbar")).toBe(
      true,
    );
  });

  it("meldet fehlende Conversion-Signale deutlich", () => {
    const result = runConversionChecks(weakConversionHtml);

    expect(result.score).toBeLessThan(40);
    expect(
      result.findings.some((finding) => finding.title === "Keine klaren CTA-Woerter gefunden"),
    ).toBe(true);
    expect(
      result.findings.some((finding) => finding.title === "Keine CTA-Buttons oder CTA-Links gefunden"),
    ).toBe(true);
    expect(result.findings.some((finding) => finding.title === "Social Proof fehlt")).toBe(true);
    expect(
      result.findings.some((finding) => finding.title === "Keine Preis- oder Angebotsbezug erkannt"),
    ).toBe(true);
  });
});
