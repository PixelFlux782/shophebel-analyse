import { describe, expect, it } from "vitest";

import { runTrustChecks } from "@/lib/analyse/checks/trust-checks";

const strongTrustHtml = `
<!doctype html>
<html>
  <body>
    <nav>
      <a href="/impressum">Impressum</a>
      <a href="/datenschutz">Datenschutz</a>
      <a href="/kontakt">Kontakt</a>
    </nav>
    <main>
      <p>Versand, rueckgabe, sichere Zahlung, Kundenservice und Bewertungen sind wichtige Themen.</p>
      <p>Trusted Shops und kundenservice stehen fuer Sicherheit.</p>
      <p>kontakt@shop.test</p>
      <p>+49 30 1234567</p>
    </main>
  </body>
</html>
`;

const weakTrustHtml = `
<!doctype html>
<html>
  <body>
    <main>
      <p>Willkommen auf unserer Seite.</p>
    </main>
  </body>
</html>
`;

describe("runTrustChecks", () => {
  it("erkennt starke Vertrauenssignale", () => {
    const result = runTrustChecks(strongTrustHtml, { pageUrl: "https://shop.test" });

    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.findings.some((finding) => finding.title === "Die Seite wird sicher geladen")).toBe(true);
    expect(result.findings.some((finding) => finding.title === "Impressum erkennbar")).toBe(true);
    expect(
      result.findings.some((finding) => finding.title === "Direkte Kontaktangabe vorhanden"),
    ).toBe(true);
    expect(
      result.findings.some((finding) => finding.title === "Mehrere Vertrauenssignale sind sichtbar"),
    ).toBe(true);
  });

  it("meldet fehlende Trust-Signale klar", () => {
    const result = runTrustChecks(weakTrustHtml, { pageUrl: "http://shop.test" });

    expect(result.score).toBeLessThan(40);
    expect(result.findings.some((finding) => finding.title === "Die Seite wird nicht sicher geladen")).toBe(true);
    expect(result.findings.some((finding) => finding.title === "Ein Impressum ist nicht klar auffindbar")).toBe(true);
    expect(result.findings.some((finding) => finding.title === "Datenschutz ist nicht klar auffindbar")).toBe(true);
    expect(
      result.findings.some((finding) => finding.title === "Zu wenig Vertrauen vor dem Kauf oder der Anfrage"),
    ).toBe(true);
  });
});
