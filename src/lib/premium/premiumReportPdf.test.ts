import { afterEach, describe, expect, it, vi } from "vitest";

import {
  countPdfPages,
  getCustomerFacingConsultantSections,
  getPremiumReportPdfStaticLabels,
  getPremiumReportPdfRenderTextData,
  renderPremiumReportPdfDiagnostics,
} from "@/lib/premium/premiumReportPdf";
import type { StoredAnalysisResult } from "@/lib/analysisStore";
import type { PremiumAiReport } from "@/lib/ai/premiumAiReport.schema";
import type { PremiumReport } from "@/lib/premium/buildPremiumReport";
import {
  REPORT_LABELS,
  validateReportCopyQuality,
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

async function largePngBuffer() {
  const sharpModule = await import("sharp");
  const sharp = sharpModule.default;

  return sharp({
    create: {
      width: 320,
      height: 180,
      channels: 3,
      background: "#0f766e",
    },
  }).png().toBuffer();
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

function createAiReport(): PremiumAiReport {
  return {
    executiveSummary: "Management-Fazit: Der Shop braucht zuerst mehr Klarheit im Startbereich.",
    mainDiagnosis: "Das eigentliche Problem ist nicht ein einzelner Button, sondern die unklare Reihenfolge aus Nutzen, Vertrauen und naechstem Schritt.",
    websiteSystem: {
      overallWebsiteScore: 64,
      crossPageDiagnosis: "Die Website braucht klarere Verbindung aus Angebot, Vertrauen und naechstem Schritt.",
      repeatedProblems: ["CTA ist unklar"],
      conversionPathAssessment: "Der Anfrageweg braucht klarere Fuehrung.",
      trustConsistencyAssessment: "Vertrauen muss naeher an die Entscheidung.",
      navigationAssessment: "Navigation und Button sollten denselben Weg fuehren.",
      topPrioritiesWebsiteWide: ["CTA vereinheitlichen"],
      missingPageTypes: [],
    },
    topLevers: [
      {
        title: "Button klarer formulieren",
        whyItMatters: "Der naechste Schritt ist nicht eindeutig.",
        shopObservation: "Unklarheit kann Anfragen bremsen.",
        improvement: "Den wichtigsten Button konkreter formulieren.",
        firstStep: "Button-Text im Startbereich pruefen.",
        difficulty: "leicht",
        expectedEffect: "Qualitativ: klarere Fuehrung bis zur Anfrage.",
      },
      {
        title: "Vertrauen frueher zeigen",
        whyItMatters: "Vertrauenssignale kommen zu spaet.",
        shopObservation: "Unsicherheit kann Entscheidungen verzoegern.",
        improvement: "Bewertungen naeher an den Startbereich bringen.",
        firstStep: "Zwei Vertrauensbelege auswaehlen.",
        difficulty: "mittel",
        expectedEffect: "Qualitativ: mehr Sicherheit vor der Entscheidung.",
      },
      {
        title: "Mobile Ansicht ordnen",
        whyItMatters: "Wichtige Signale erscheinen mobil zu spaet.",
        shopObservation: "Mobile Besucher muessen mehr suchen.",
        improvement: "Mobile Reihenfolge vereinfachen.",
        firstStep: "Mobile Startansicht gegenlesen.",
        difficulty: "mittel",
        expectedEffect: "Qualitativ: schnelleres Verstehen auf kleinen Bildschirmen.",
      },
    ],
    sevenDayPlan: [
      { day: "Tag 1-2", focus: "Klarheit schaffen", tasks: ["Button und Startbereich pruefen."] },
      { day: "Tag 3-5", focus: "Umsetzung", tasks: ["Trust-Signale platzieren."] },
      { day: "Tag 6-7", focus: "Kontrolle", tasks: ["Mobile Ansicht pruefen."] },
    ],
    ownerConclusion: "Erst Klarheit, dann Vertrauen, dann naechster Schritt.",
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

    expect(text).toContain("Der Startbereich braucht mehr Klarheit.");
    expect(text).toContain("Button zuerst, Vertrauen danach.");
    expect(text).toContain("Button-Text schärfen");
    expect(text).toContain("Optional: Landingpage-Umsetzung.");
    expect(validateReportCopyQuality(text).isValid).toBe(true);
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

    expect(labels).toContain("Premium-Bericht inkl. KI-Beratung");
    expect(labels).toContain("Management-Zusammenfassung");
    expect(labels).toContain("Kurzüberblick");
    expect(labels).toContain("Detailanhang");
    expect(labels).toContain("Screenshot-Hinweis");
    expect(labels).toContain("Nächster Schritt");
    expect(labels).toContain("Nutzerführung");
    expect(labels).toContain("Shophebel-Analysewert");
    expect(labels).toContain("Visueller Seitenüberblick");
    expect(labels).toContain("Umsatzbremsen");
    expect(labels).toContain("Maßnahmen");
    expect(labels).not.toContain("Findings");
    expect(labels).not.toContain("Premium Report");
    expect(labels).not.toContain("Critical Signals");
    expect(validateReportCopyQuality(labels).isValid).toBe(true);
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
    expect(validateReportCopyQuality(renderText).isValid).toBe(true);
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
    expect(text).toContain("Premium-Bericht inkl. KI-Beratung");
    expect(text).not.toContain("Findings");
    expect(text).not.toContain("Premium Report");
    expect(text).not.toContain("Critical Signals");
    expect(text).not.toMatch(/Prem ium|U m satz|M anagem ent|Zus ammenfassung/);
    expect(validateReportCopyQuality(text).isValid).toBe(true);
  });

  it("nimmt gespeicherte KI-Beratung in die PDF-Textstruktur auf", () => {
    const text = getPremiumReportPdfRenderTextData({
      analysis: createAnalysis(),
      report: createReport(),
      consultantNotes: {},
      aiReport: createAiReport(),
    }).join(" ");

    expect(text).toContain("Management-Fazit");
    expect(text).toContain("Button klarer formulieren");
    expect(text).toContain("Tag 1-2");
    expect(text).toContain("Erst Klarheit, dann Vertrauen");
    expect(validateReportCopyQuality(text).isValid).toBe(true);
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

  it("liefert ein gueltiges PDF ohne bekannte kaputte Wortabstands-Muster", async () => {
    const { pdf } = await renderPremiumReportPdfDiagnostics({
      analysis: createAnalysis(),
      report: createReport(),
      consultantNotes: {},
    });
    const source = pdf.toString("latin1");

    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
    expect(countPdfPages(pdf)).toBeGreaterThan(0);
    expect(source).not.toMatch(/Prem ium|U m satz|M anagem ent|Zus ammenfassung/);
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

    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
    expect(countPdfPages(pdf)).toBeGreaterThan(0);
  });

  it("laedt Supabase Storage Screenshots als Buffer und bettet PNGs in das PDF ein", async () => {
    const screenshotUrl =
      "https://example.supabase.co/storage/v1/object/public/analysis-screenshots/analysis-results/a/viewport.png";
    const analysis = createAnalysis();
    analysis.analysis.screenshots = { viewport: screenshotUrl };
    const imageBuffer = await largePngBuffer();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(new Uint8Array(imageBuffer), {
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

  it("rendert Premium-Unterseiten im PDF mit und ohne Screenshot", async () => {
    const screenshotUrl = "https://cdn.example.com/screenshots/kontakt.png";
    const imageBuffer = await largePngBuffer();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(new Uint8Array(imageBuffer), {
        status: 200,
        headers: { "content-type": "image/png" },
      }),
    );
    const report: PremiumReport = {
      ...createReport(),
      websiteAnalysis: {
        pages: [
          {
            url: "https://shop.test/kontakt",
            label: "Kontakt",
            role: "contact",
            reason: "Kontakt-Signal",
            analysisStatus: "analyzed",
            screenshot: screenshotUrl,
            score: 71,
            strengths: ["Kontakt sichtbar"],
            problems: ["Trust fehlt"],
            recommendation: "Trust am Formular zeigen.",
            shortDiagnosis: "Kontaktseite mit Trust-Hebel.",
          },
          {
            url: "https://shop.test/ueber-uns",
            label: "Ueber uns",
            role: "trust",
            reason: "Trust-Signal",
            analysisStatus: "analyzed",
            screenshotUnavailableReason: "Diese Seite wurde ohne gerenderte Vorschau ausgewertet.",
            score: 66,
            strengths: ["Team sichtbar"],
            problems: ["Belege fehlen"],
            recommendation: "Referenzen ergaenzen.",
            shortDiagnosis: "Trust-Seite mit Beleg-Hebel.",
          },
        ],
        overallWebsiteScore: 69,
        crossPageDiagnosis: "Die Website wurde als System bewertet.",
        repeatedProblems: ["Trust fehlt"],
        strongestPage: { label: "Kontakt", url: "https://shop.test/kontakt", score: 71 },
        weakestPage: { label: "Ueber uns", url: "https://shop.test/ueber-uns", score: 66 },
        conversionPathAssessment: "Kontakt logisch verbinden.",
        trustConsistencyAssessment: "Trust konsistent machen.",
        navigationAssessment: "Navigation auf CTA ausrichten.",
        topPrioritiesWebsiteWide: ["Trust vereinheitlichen"],
        sevenDayPlan: [
          { days: "Tag 1-2", focus: "Klarheit", actions: ["CTA pruefen."] },
        ],
        missingPageTypes: [],
      },
    };

    const { pdf } = await renderPremiumReportPdfDiagnostics({
      analysis: createAnalysis(),
      report,
      consultantNotes: {},
    });

    expect(fetchSpy).toHaveBeenCalledWith(screenshotUrl, { cache: "no-store" });
    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
    expect(countPdfPages(pdf)).toBeGreaterThan(0);
  });
});
