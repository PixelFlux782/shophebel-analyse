import { describe, expect, it } from "vitest";

import {
  CUSTOMER_FORBIDDEN_ASCII_UMLAUTS,
  CUSTOMER_FORBIDDEN_REPLACEMENTS,
  CUSTOMER_FORBIDDEN_REPORT_LABELS,
  normalizeGermanReportText,
  REPORT_LABELS,
  validateReportCopyQuality,
} from "@/lib/report/reportCopy";

describe("reportCopy", () => {
  it("normalisiert kundenkritische englische Reportlabels", () => {
    const text = normalizeGermanReportText(
      "Executive Snapshot, Website Intelligence Score, Visual Audit, Screenshot Intelligence Console, Full Page Screenshot, Capture, Top Issues, Hero, Trust, CTA",
    );

    expect(text).toContain(REPORT_LABELS.executiveSnapshot);
    expect(text).toContain(REPORT_LABELS.websiteIntelligenceScore);
    expect(text).toContain(REPORT_LABELS.visualAudit);
    expect(text).toContain(REPORT_LABELS.screenshotIntelligenceConsole);
    expect(text).toContain(REPORT_LABELS.fullPageScreenshot);
    expect(text).toContain(REPORT_LABELS.capture);
    expect(text).toContain("Wichtigste Probleme");
    expect(text).toContain("Startbereich");
    expect(text).toContain("Vertrauen");
    expect(text).toContain("Button");
    expect(validateReportCopyQuality(text).isValid).toBe(true);
  });

  it("korrigiert kuratierte ASCII-Umlautformen", () => {
    const text = normalizeGermanReportText(
      "Bildverstaendnis, Kontaktmoeglichkeiten, verschluesselte Verbindung, Schriftgroessen groesser, zuruecknehmen, Massnahmen fuer naechste Pruefung.",
    );

    expect(text).toContain("Bildverständnis");
    expect(text).toContain("Kontaktmöglichkeiten");
    expect(text).toContain("verschlüsselte Verbindung");
    expect(text).toContain("Schriftgrößen größer");
    expect(text).toContain("zurücknehmen");
    expect(text).toContain("Maßnahmen für nächste Prüfung");
    CUSTOMER_FORBIDDEN_ASCII_UMLAUTS.forEach((term) => {
      expect(text).not.toContain(term);
    });
    expect(validateReportCopyQuality(text).isValid).toBe(true);
  });

  it("repariert bekannte Mojibake-Sequenzen", () => {
    const text = normalizeGermanReportText("KurzÃ¼berblick, MaÃŸnahmen, NÃ¤chster Schritt, fÃ¼r mehr KÃ¤ufe.");

    expect(text).toBe("Kurzüberblick, Maßnahmen, Nächster Schritt, für mehr Käufe.");
    expect(validateReportCopyQuality(text).isValid).toBe(true);
  });

  it("zerstört URLs, technische Keys und Marken nicht durch blinde Ersetzungen", () => {
    const text = normalizeGermanReportText("https://example.com/checkout?utm_source=test openRouter_key_missing Shophebel");

    expect(text).toBe("https://example.com/checkout?utm_source=test openRouter_key_missing Shophebel");
  });

  it("liefert die zentrale Ersetzungsliste und erkennt unprofessionelle Fallbacks", () => {
    expect(CUSTOMER_FORBIDDEN_REPLACEMENTS["Executive Summary"]).toBe("Management-Zusammenfassung");
    expect(CUSTOMER_FORBIDDEN_REPLACEMENTS["Premium-Report"]).toBe("Premium-Bericht");

    const quality = validateReportCopyQuality("Executive Summary: n/a. Premium-Report Fallback.");

    expect(quality.isValid).toBe(false);
    expect(quality.forbiddenTerms).toEqual(expect.arrayContaining(["Executive Summary", "Premium-Report", "n/a", "Fallback"]));
    CUSTOMER_FORBIDDEN_REPORT_LABELS.forEach((term) => {
      expect(normalizeGermanReportText(term)).not.toBe(term);
    });
  });
});
