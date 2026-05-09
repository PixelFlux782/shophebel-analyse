import { describe, expect, it } from "vitest";

import {
  countPdfPages,
  getCustomerFacingConsultantSections,
  getPremiumReportPdfStaticLabels,
  renderPremiumReportPdfDiagnostics,
} from "@/lib/premium/premiumReportPdf";
import type { StoredAnalysisResult } from "@/lib/analysisStore";
import type { PremiumReport } from "@/lib/premium/buildPremiumReport";
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

function createReport(): PremiumReport {
  return {
    isPaid: true,
    premiumSummary: {
      headline: "Premium Conversion- und Trust-Audit",
      mainReason: "Der wahrscheinlich groesste Bremsfaktor ist Die Seite erklaert Angebot und Nutzen nicht schnell genug.",
      firstFocus: "Rueckgabe und Formularnaehe frueher erklaeren.",
      businessRelevance: "Besucher zoegern laenger und Abschluesse werden unwahrscheinlicher.",
      fastestWin: "Rueckgabe frueher erklaeren",
    },
    topRevenueBlockers: [
      {
        title: "Die Seite erklaert Angebot und Nutzen nicht schnell genug",
        category: "Conversion",
        severity: "kritisch",
        whyItMatters: "Besucher zoegern laenger.",
        likelyBusinessImpact: "Abschluesse sinken.",
        recommendedFix: "Rueckgabe und Formularnaehe frueher erklaeren.",
        effort: "niedrig",
        priority: 1,
      },
    ],
    priorityRoadmap: ["Rueckgabe und Formularnaehe frueher erklaeren."],
    quickImplementationPlan: [
      {
        days: "Tag 1-2",
        focus: "Rueckgabe und Formularnaehe",
        actions: ["Rueckgabe frueher erklaeren.", "Abschluesse nicht durch Formularnaehe bremsen."],
      },
    ],
    visualAuditNotes: [
      {
        area: "Sichtbarer Startbereich",
        note: "Angebot frueher erklaeren.",
      },
    ],
    conversionHypothesis: "Wenn die Seite Angebot und Nutzen frueher erklaert, zoegern Besucher kuerzer.",
  };
}

describe("premiumReportPdf consultant notes", () => {
  it("nimmt kundenrelevante Consultant-Kommentare in die PDF-Struktur auf", () => {
    const sections = getCustomerFacingConsultantSections({
      executiveComment: "Der Hero braucht mehr Klarheit.",
      priorityOverrideNotes: "CTA zuerst, Trust danach.",
      customActionItems: ["CTA-Text schaerfen"],
      upsellRecommendation: "Optional: Landingpage-Sprint.",
      internalNotes: "Marge intern pruefen.",
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

  it("verwendet deutsche Premium-Labels fuer den PDF-Report", () => {
    const labels = getPremiumReportPdfStaticLabels().join(" ");

    expect(labels).toContain("Management-Zusammenfassung");
    expect(labels).toContain("Conversion-Hypothese");
    expect(labels).toContain("Visuelle Prüfung");
    expect(labels).toContain("sichtbarer Startbereich");
    expect(labels).toContain("Umsatzbremsen");
    expect(labels).toContain("Maßnahmen");
    expect(labels).not.toContain("Executive Summary");
    expect(labels).not.toContain("Visual Audit Notes");
    expect(labels).not.toContain("Above the fold");
    expect(labels).not.toMatch(/\b(?:Pruefung|Massnahmen)\b/);
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
      executiveComment: "Rueckgabe frueher erklaeren, damit Besucher nicht laenger zoegern.",
      priorityOverrideNotes: "Abschluesse und Formularnaehe zuerst pruefen.",
      customActionItems: ["Rueckgabe erklaeren"],
    });
    const text = JSON.stringify(sections);

    expect(text).toContain("Rückgabe früher erklären");
    expect(text).toContain("länger zögern");
    expect(text).toContain("Abschlüsse und Formularnähe");
    expect(text).not.toMatch(/erklaert|erklaeren|frueher|Rueckgabe|Abschluesse|Formularnaehe|zoegern|laenger/);
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
});
