import { afterEach, describe, expect, it, vi } from "vitest";

import {
  countPdfPages,
  getCustomerFacingConsultantSections,
  getPremiumReportPdfStaticLabels,
  getPremiumReportPdfRenderTextData,
  renderPremiumReportPdfDiagnostics,
} from "@/lib/premium/premiumReportPdf";
import type { StoredAnalysisResult } from "@/lib/analysisStore";
import type { PremiumReport } from "@/lib/premium/buildPremiumReport";
import {
  CUSTOMER_FORBIDDEN_ASCII_UMLAUTS,
  CUSTOMER_FORBIDDEN_REPORT_LABELS,
  REPORT_LABELS,
} from "@/lib/report/reportCopy";
import type { AnalysisResult } from "@/types/analysis";

function createAnalysis(): StoredAnalysisResult {
  const now = "2026-05-08T12:00:00.000Z";
  const analysis: AnalysisResult = {
    url: "https://shop.test/",
    createdAt: now,
    requestedUrl: "https://shop.test",
    scannedAt: now,
    analysisMode: "rendered",
    finalUrl: "https://shop.test/",
    technicalNotes: [],
    visualPreviewAvailable: false,
    isPremium: true,
    totalFindings: 0,
    visibleFindings: 0,
    overallScore: 62,
    categories: {
      seo: { score: 80, label: "SEO", summary: "OK", checks: [] },
      performance: { score: 70, label: "Performance", summary: "OK", checks: [] },
      trust: { score: 55, label: "Trust", summary: "OK", checks: [] },
      conversion: { score: 50, label: "Conversion", summary: "OK", checks: [] },
      design: { score: 65, label: "Design", summary: "OK", checks: [] },
      aiVisibility: { score: 80, label: "AI", summary: "OK", checks: [] },
    },
    quickWins: [],
    criticalIssues: [],
    premiumInsightsPreview: [],
    revenueBlockers: [],
    measures: [],
    categoryScores: {},
    findings: [],
    recommendations: [],
    aiSuggestions: [],
  };

  return {
    id: "analysis-123",
    analysis,
    createdAt: now,
    isDemo: false,
    paymentStatus: "paid",
    paidAt: now,
  };
}

function largePngBuffer() {
  const onePixelPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/l2J7WQAAAABJRU5ErkJggg==",
    "base64",
  );

  return Buffer.concat([onePixelPng, Buffer.alloc(1200)]);
}

function createReport(): PremiumReport {
  return {
    isPaid: true,
    premiumSummary: {
      headline: "Premium Conversion- und Trust-Audit",
      mainReason: "Der wahrscheinlich größte Bremsfaktor ist Die Seite erklärt Angebot und Nutzen nicht schnell genug.",
      firstFocus: "Rueckgabe und Formularnaehe früher erklären.",
      businessRelevance: "Besucher zoegern laenger und Abschlüsse werden unwahrscheinlicher.",
      fastestWin: "Rueckgabe früher erklären",
    },
    topRevenueBlockers: [
      {
        title: "Die Seite erklärt Angebot und Nutzen nicht schnell genug",
        category: "Conversion",
        severity: "kritisch",
        whyItMatters: "Besucher zoegern laenger.",
        likelyBusinessImpact: "Abschlüsse sinken.",
        recommendedFix: "Rueckgabe und Formularnaehe früher erklären.",
        effort: "niedrig",
        priority: 1,
      },
    ],
    priorityRoadmap: ["Rueckgabe und Formularnaehe früher erklären."],
    quickImplementationPlan: [
      {
        days: "Tag 1-2",
        focus: "Rueckgabe und Formularnaehe",
        actions: ["Rueckgabe früher erklären.", "Abschlüsse nicht durch Formularnaehe bremsen."],
      },
    ],
    visualAuditNotes: [
      {
        area: "Sichtbarer Startbereich",
        note: "Angebot früher erklären.",
      },
    ],
    conversionHypothesis: "Wenn die Seite Angebot und Nutzen früher erklärt, zoegern Besucher kürzer.",
  };
}

describe("premiumReportPdf consultant notes", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("nimmt kundenrelevante Consultant-Kommentare in die PDF-Struktur auf", () => {
    const sections = getCustomerFacingConsultantSections({
      executiveComment: "Der Hero braucht mehr Klarheit.",
      priorityOverrideNotes: "CTA zuerst, Trust danach.",
      customActionItems: ["CTA-Text schärfen"],
      upsellRecommendation: "Optional: Landingpage-Sprint.",
      internalNotes: "Marge intern prüfen.",
    });
    const text = JSON.stringify(sections);

    expect(text).toContain("Der Hero braucht mehr Klarheit.");
    expect(text).toContain("Button zuerst, Vertrauen danach.");
    expect(text).toContain("Button-Text schärfen");
    expect(text).toContain("Optional: Landingpage-Sprint.");
  });

  it("gibt internalNotes niemals als kundenrelevante PDF-Sektion aus", () => {
    const sections = getCustomerFacingConsultantSections({
      executiveComment: "Kundenkommentar",
      internalNotes: "Nicht ins Kunden-PDF",
    });
    const text = JSON.stringify(sections);

    expect(text).toContain("Kundenkommentar");
    expect(text).not.toContain("Nicht ins Kunden-PDF");
    expect(text).not.toContain("internalNotes");
  });

  it("verwendet deutsche Premium-Labels für den PDF-Report", () => {
    const labels = getPremiumReportPdfStaticLabels().join(" ");

    expect(labels).toContain("Management-Zusammenfassung");
    expect(labels).toContain("Conversion-Hypothese");
    expect(labels).toContain("Priorisierter Maßnahmenplan");
    expect(labels).toContain("Übersicht");
    expect(labels).toContain("Einführung");
    expect(labels).toContain("Nächster Schritt");
    expect(labels).toContain("Nutzerführung");
    expect(labels).toContain("Visuelle Prüfung");
    expect(labels).toContain(REPORT_LABELS.websiteIntelligenceScore);
    expect(labels).toContain(REPORT_LABELS.screenshotIntelligenceConsole);
    expect(labels).toContain("sichtbarer Startbereich");
    expect(labels).toContain("Umsatzbremsen");
    expect(labels).toContain("Maßnahmen");
    CUSTOMER_FORBIDDEN_REPORT_LABELS.forEach((label) => {
      expect(labels).not.toContain(label);
    });
    CUSTOMER_FORBIDDEN_ASCII_UMLAUTS.forEach((term) => {
      expect(labels).not.toContain(term);
    });
    expect(labels).not.toMatch(/N\u00c3|\u00c3\u0192/);
  });

  it("normalisiert alte premium_reports Texte vor dem PDF-Rendern", () => {
    const report: PremiumReport = {
      ...createReport(),
      premiumSummary: {
        ...createReport().premiumSummary,
        firstFocus: "NÃ¤chster Schritt: Nutzerfuehrung fuer den naechsten Kauf klaeren.",
        fastestWin: "Massnahmen fuer Formularnaehe priorisieren.",
      },
      opportunityRoadmap: {
        title: "Priorisierte Massnahmen",
        summary: "Nutzerfuehrung und naechste Schritte pruefen.",
        items: [
          {
            title: "Hero-Botschaft schÃƒÂ¤rfen",
            businessImpact: "NÃ¤chster Klick wird klarer.",
            suggestedModule: "Conversion Quick Wins",
            suggestedService: "Quick Fix Sprint",
            implementationEffort: "niedrig",
            expectedEffect: "Mehr qualifizierte Anfragen.",
            nextStep: "Massnahmen fuer naechste Woche ableiten.",
            priorityScore: 92,
          },
        ],
      },
    };
    const renderText = getPremiumReportPdfRenderTextData({
      analysis: createAnalysis(),
      report,
      consultantNotes: {
        executiveComment: "Nutzerfuehrung fuer den naechsten Schritt pruefen.",
      },
    }).join(" ");

    expect(renderText).toContain("Nächster Schritt");
    expect(renderText).toContain("Nutzerführung");
    expect(renderText).toContain("Maßnahmen");
    CUSTOMER_FORBIDDEN_REPORT_LABELS.forEach((label) => {
      expect(renderText).not.toContain(label);
    });
    CUSTOMER_FORBIDDEN_ASCII_UMLAUTS.forEach((term) => {
      expect(renderText).not.toContain(term);
    });
    expect(renderText).not.toMatch(/NÃ|Ãƒ/);
  });

  it("bereitet PDF-Textdaten ohne bekannte englische Reportlabels und ASCII-Umlaute auf", () => {
    const report: PremiumReport = {
      ...createReport(),
      premiumSummary: {
        ...createReport().premiumSummary,
        headline: "Executive Snapshot mit Website Intelligence Score",
        firstFocus: "Bildverstaendnis und Kontaktmoeglichkeiten pruefen.",
      },
      visualAuditNotes: [
        {
          area: "Visual Audit",
          note: "Full Page Screenshot Capture fuer naechste Massnahmen.",
        },
      ],
    };
    const text = getPremiumReportPdfRenderTextData({
      analysis: createAnalysis(),
      report,
      consultantNotes: {
        executiveComment: "Screenshot Intelligence Console nicht als Rohlabel zeigen.",
      },
    }).join(" ");

    expect(text).toContain(REPORT_LABELS.websiteIntelligenceScore);
    expect(text).toContain("Bildverständnis");
    CUSTOMER_FORBIDDEN_REPORT_LABELS.forEach((label) => {
      expect(text).not.toContain(label);
    });
    CUSTOMER_FORBIDDEN_ASCII_UMLAUTS.forEach((term) => {
      expect(text).not.toContain(term);
    });
  });

  it("verhindert zusammengeklebte Abschnittstexte im PDF", async () => {
    const { pdf } = await renderPremiumReportPdfDiagnostics({
      analysis: createAnalysis(),
      report: createReport(),
      consultantNotes: {},
    });
    const source = pdf.toString("latin1");

    expect(source).not.toMatch(/EINORDNUNGManagement/);
    expect(source).not.toMatch(/PRIORITÄTENTop/);
    expect(source).not.toMatch(/WIRKLOGIKConversion/);
    expect(source).not.toMatch(/UMSETZUNG7/);
    expect(source).not.toMatch(/SICHTBARKEITVisuelle/);
  });

  it("normalisiert bekannte deutsche Umschreibungen vor der PDF-Struktur", () => {
    const sections = getCustomerFacingConsultantSections({
      executiveComment: "Rueckgabe früher erklären, damit Besucher nicht laenger zoegern.",
      priorityOverrideNotes: "Abschlüsse und Formularnaehe zuerst prüfen.",
      customActionItems: ["Rueckgabe erklären"],
    });
    const text = JSON.stringify(sections);

    expect(text).toContain("Rückgabe früher erklären");
    expect(text).toContain("länger zögern");
    expect(text).toContain("Abschlüsse und Formularnähe");
    expect(text).not.toMatch(
      /Rueckgabe|Formularnaehe|zoegern|laenger|R\u00c3\u00bcckgabe|fr\u00c3\u00bcher|erkl\u00c3\u00a4ren|Abschl\u00c3\u00bcsse|Formularn\u00c3\u00a4he|l\u00c3\u00a4nger|z\u00c3\u00b6gern/,
    );
  });

  it("rendert PDF-Footer auf bestehenden Seiten ohne Extra-Seiten", async () => {
    const { pdf, footerPageStats } = await renderPremiumReportPdfDiagnostics({
      analysis: createAnalysis(),
      report: createReport(),
      consultantNotes: {},
    });
    const source = pdf.toString("latin1");
    const pageCount = countPdfPages(pdf);

    expect(pageCount).toBeGreaterThan(0);
    expect(footerPageStats.after).toBe(footerPageStats.before);
    expect(pageCount).toBe(footerPageStats.after);
    expect(source).not.toMatch(/KRITISC\s+H|WICHTI\s+G|KURZFA\s+ZIT|Zus\s+ammenfassung/);
  });

  it("rendert den priorisierten Maßnahmenplan als eigenen PDF-Abschnitt", async () => {
    const report: PremiumReport = {
      ...createReport(),
      opportunityRoadmap: {
        title: "Priorisierter Maßnahmenplan",
        summary: "Die wichtigsten Potenziale werden nach Wirkung und Aufwand sortiert.",
        items: [
          {
            title: "Hero-Botschaft als Anfrage-Hebel schÃ¤rfen",
            businessImpact: "Besucher verstehen schneller, warum sie anfragen sollten.",
            suggestedModule: "Conversion Quick Wins",
            suggestedService: "Quick Fix Sprint",
            implementationEffort: "niedrig",
            expectedEffect: "Mehr qualifizierte Anfragen aus bestehendem Traffic.",
            nextStep: "Als Quick Fix priorisieren.",
            priorityScore: 94,
          },
        ],
      },
    };
    const { pdf } = await renderPremiumReportPdfDiagnostics({
      analysis: createAnalysis(),
      report,
      consultantNotes: {},
    });
    const source = pdf.toString("latin1");

    expect(countPdfPages(pdf)).toBeGreaterThan(0);
    expect(source).toContain("5072696f726973696572");
    expect(source).toContain("456d7066");
  });

  it("laedt Supabase Storage Screenshots als Buffer und bettet PNGs in das PDF ein", async () => {
    const screenshotUrl =
      "https://example.supabase.co/storage/v1/object/public/analysis-screenshots/analysis-results/a/viewport.png";
    const analysis = createAnalysis();
    analysis.analysis.screenshots = { viewport: screenshotUrl };
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(largePngBuffer(), {
        status: 200,
        headers: { "content-type": "image/png" },
      }),
    );

    const { pdf } = await renderPremiumReportPdfDiagnostics({
      analysis,
      report: createReport(),
      consultantNotes: {},
    });

    expect(fetchSpy).toHaveBeenCalledWith(screenshotUrl, { cache: "no-store" });
    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
    expect(countPdfPages(pdf)).toBeGreaterThan(0);
  });

  it("fallbackt ohne Crash, wenn ein Screenshot nicht als PDF-Bild geeignet ist", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const screenshotUrl =
      "https://example.supabase.co/storage/v1/object/public/analysis-screenshots/analysis-results/a/viewport.png";
    const analysis = createAnalysis();
    analysis.analysis.screenshots = { viewport: screenshotUrl };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(Buffer.alloc(1500, "x"), {
        status: 200,
        headers: { "content-type": "text/html" },
      }),
    );
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { pdf } = await renderPremiumReportPdfDiagnostics({
      analysis,
      report: createReport(),
      consultantNotes: {},
    });

    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
    expect(warnSpy).toHaveBeenCalledWith(
      "[premium-report-pdf] Screenshot response is not an image",
      expect.objectContaining({
        contentType: "text/html",
        bufferLength: 1500,
        detectedFormat: "unsupported",
        screenshotUrl,
      }),
    );
  });
});
