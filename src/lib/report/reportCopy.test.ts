import { describe, expect, it } from "vitest";

import {
  CUSTOMER_FORBIDDEN_ASCII_UMLAUTS,
  CUSTOMER_FORBIDDEN_REPORT_LABELS,
  normalizeGermanReportText,
  REPORT_LABELS,
} from "@/lib/report/reportCopy";

describe("reportCopy", () => {
  it("normalisiert kundenkritische englische Reportlabels", () => {
    const text = normalizeGermanReportText(
      "Executive Snapshot, Website Intelligence Score, Visual Audit, Screenshot Intelligence Console, Full Page Screenshot, Capture",
    );

    expect(text).toContain(REPORT_LABELS.executiveSnapshot);
    expect(text).toContain(REPORT_LABELS.websiteIntelligenceScore);
    expect(text).toContain(REPORT_LABELS.visualAudit);
    expect(text).toContain(REPORT_LABELS.screenshotIntelligenceConsole);
    expect(text).toContain(REPORT_LABELS.fullPageScreenshot);
    expect(text).toContain(REPORT_LABELS.capture);
    CUSTOMER_FORBIDDEN_REPORT_LABELS.forEach((label) => {
      expect(text).not.toContain(label);
    });
  });

  it("korrigiert nur kuratierte ASCII-Umlautformen", () => {
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
  });

  it("zerstört URLs, technische Keys und Marken nicht durch blinde Ersetzungen", () => {
    const text = normalizeGermanReportText("https://example.com/checkout?utm_source=test openRouter_key_missing Shophebel");

    expect(text).toBe("https://example.com/checkout?utm_source=test openRouter_key_missing Shophebel");
  });
});
