import { describe, expect, it } from "vitest";

import { getPremiumReportPdfStaticLabels } from "@/lib/premium/premiumReportPdf";
import { normalizeGermanText } from "@/lib/premium/premiumCopy";

const forbiddenVisibleCopyPatterns = [
  /N\u00c3/,
  /\u00c3\u0192/,
  /fuer/i,
  /naech/i,
  /Massnahmen/,
  /Nutzerfuehrung/,
];

describe("premium copy normalization", () => {
  it("repariert Mojibake und ASCII-Umlautumschreibungen in sichtbarer Copy", () => {
    const normalized = normalizeGermanText(
      [
        "N\u00c3\u00a4chster Schritt",
        "Ma\u00c3\u0178nahmen",
        "Pr\u00c3\u00bcfung",
        "fuer den naechsten Schritt",
        "Nutzerfuehrung",
        "In Beratungssprache uebersetzen",
      ].join(" · "),
    );

    expect(normalized).toContain("Nächster Schritt");
    expect(normalized).toContain("Maßnahmen");
    expect(normalized).toContain("Prüfung");
    expect(normalized).toContain("für den nächsten Schritt");
    expect(normalized).toContain("Nutzerführung");
    expect(normalized).toContain("übersetzen");
    forbiddenVisibleCopyPatterns.forEach((pattern) => {
      expect(normalized).not.toMatch(pattern);
    });
  });

  it("poliert produktnahe Reportlabels zu beratender Premium-Copy", () => {
    const normalized = normalizeGermanText(
      "Opportunity Roadmap · Shophebel-Modul · Conversion Quick Wins · Business Impact",
    );

    expect(normalized).toContain("Priorisierter Maßnahmenplan");
    expect(normalized).toContain("Empfohlener Umsetzungspfad");
    expect(normalized).toContain("Sofortmaßnahmen für mehr Anfragen");
    expect(normalized).toContain("Geschäftliche Wirkung");
  });

  it("verhindert verbotene Encoding-Muster in statischen Reportlabels", () => {
    const labels = getPremiumReportPdfStaticLabels().join(" ");

    forbiddenVisibleCopyPatterns.forEach((pattern) => {
      expect(labels).not.toMatch(pattern);
    });
  });
});
