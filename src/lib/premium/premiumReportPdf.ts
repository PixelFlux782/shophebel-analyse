import PDFDocument from "pdfkit/js/pdfkit.standalone";

import type { StoredAnalysisResult } from "@/lib/analysisStore";
import type { PremiumBlocker, PremiumReport } from "@/lib/premium/buildPremiumReport";
import type { ConsultantNotes } from "@/lib/premium/consultantNotes";
import {
  hasCustomerFacingConsultantNotes,
  normalizeConsultantNotes,
} from "@/lib/premium/consultantNotes";
import { normalizeGermanText, polishPremiumText } from "@/lib/premium/premiumCopy";

type PremiumReportPdfInput = {
  analysis: StoredAnalysisResult;
  report: Partial<PremiumReport>;
  consultantNotes?: ConsultantNotes | null;
};

type BoxTone = "dark" | "cyan" | "emerald" | "amber" | "rose" | "slate";

const COLORS = {
  slate950: "#0f172a",
  slate800: "#1e293b",
  slate700: "#334155",
  slate500: "#64748b",
  slate200: "#e2e8f0",
  slate100: "#f1f5f9",
  slate50: "#f8fafc",
  cyan700: "#0e7490",
  cyan600: "#0891b2",
  cyan50: "#ecfeff",
  emerald700: "#047857",
  emerald50: "#ecfdf5",
  amber700: "#b45309",
  amber50: "#fffbeb",
  rose700: "#be123c",
  rose50: "#fff1f2",
  white: "#ffffff",
};

const TONE_COLORS: Record<BoxTone, { fill: string; border: string; title: string; text: string }> = {
  dark: { fill: COLORS.slate950, border: COLORS.slate950, title: COLORS.white, text: COLORS.slate200 },
  cyan: { fill: COLORS.cyan50, border: "#a5f3fc", title: COLORS.slate950, text: COLORS.slate700 },
  emerald: { fill: COLORS.emerald50, border: "#a7f3d0", title: COLORS.slate950, text: COLORS.slate700 },
  amber: { fill: COLORS.amber50, border: "#fde68a", title: COLORS.slate950, text: COLORS.slate700 },
  rose: { fill: COLORS.rose50, border: "#fecdd3", title: COLORS.slate950, text: COLORS.slate700 },
  slate: { fill: COLORS.slate50, border: COLORS.slate200, title: COLORS.slate950, text: COLORS.slate700 },
};

const LAYOUT = {
  sectionSpacing: 22,
  sectionDividerGap: 10,
  sectionBottomGap: 14,
  cardPadding: 14,
  cardSpacing: 16,
  cardBodyGap: 10,
  labelHeight: 22,
  labelMinWidth: 82,
  labelMaxWidth: 140,
  labelMarginRight: 14,
  labelMarginTop: 16,
};

export function getPremiumReportPdfStaticLabels() {
  return [
    "Dein Premium-Report",
    "Management-Zusammenfassung",
    "Top-Umsatzbremsen",
    "Conversion-Hypothese",
    "7-Tage-Plan",
    "Priorisierte Maßnahmen",
    "Visuelle Prüfung",
    "sichtbarer Startbereich",
  ].map((label) => normalizeGermanText(label));
}

function textValue(value: unknown, fallback = "Nicht im gespeicherten Report enthalten.") {
  if (typeof value === "string" && value.trim()) {
    return polishPremiumText(value.trim());
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return polishPremiumText(fallback);
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => textValue(item, ""))
    .filter(Boolean);
}

function formatDate(value: unknown) {
  const date = typeof value === "string" || value instanceof Date ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    return new Date().toLocaleDateString("de-DE");
  }

  return date.toLocaleDateString("de-DE");
}

function pageWidth(doc: PDFKit.PDFDocument) {
  return doc.page.width - doc.page.margins.left - doc.page.margins.right;
}

function ensureSpace(doc: PDFKit.PDFDocument, height: number) {
  const bottom = doc.page.height - doc.page.margins.bottom;

  if (doc.y + height > bottom) {
    doc.addPage();
  }
}

function estimateTextHeight(doc: PDFKit.PDFDocument, text: string, width: number, fontSize = 10.5) {
  return doc.font("Helvetica").fontSize(fontSize).heightOfString(text, {
    width,
    lineGap: 3,
  });
}

function writeLabel(
  doc: PDFKit.PDFDocument,
  label: string,
  x: number,
  y: number,
  tone: BoxTone = "slate",
) {
  const colors = TONE_COLORS[tone];
  const normalizedLabel = normalizeGermanText(label).toUpperCase();
  const fontSize = normalizedLabel.length > 12 ? 7.0 : 8.0;
  const width = Math.min(
    LAYOUT.labelMaxWidth,
    Math.max(LAYOUT.labelMinWidth, doc.font("Helvetica-Bold").fontSize(fontSize).widthOfString(normalizedLabel) + 24),
  );

  doc.rect(x, y, width, LAYOUT.labelHeight).fillAndStroke(colors.fill, colors.border);
  doc.font("Helvetica-Bold").fontSize(fontSize).fillColor(colors.title).text(normalizedLabel, x + 10, y + 5, {
    width: width - 20,
    lineBreak: false,
  });

  return width;
}

function drawSectionHeader(doc: PDFKit.PDFDocument, title: string, eyebrow?: string) {
  ensureSpace(doc, 88);
  const x = doc.page.margins.left;
  const width = pageWidth(doc);

  if (eyebrow) {
    doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.cyan700).text(normalizeGermanText(eyebrow).toUpperCase(), x, doc.y, {
      width,
      lineGap: 1.5,
      characterSpacing: 0.7,
    });
    doc.moveDown(0.35);
  }

  doc.font("Helvetica-Bold").fontSize(18).fillColor(COLORS.slate950).text(normalizeGermanText(title), x, doc.y, {
    width,
    lineGap: 1.5,
  });
  doc.moveDown(0.4);

  doc.moveTo(x, doc.y).lineTo(x + width, doc.y).strokeColor(COLORS.slate200).lineWidth(1).stroke();
  doc.moveDown(1.25);
}

function writeCard(
  doc: PDFKit.PDFDocument,
  input: {
    title: string;
    body: string[];
    tone?: BoxTone;
    label?: string;
    minHeight?: number;
  },
) {
  const width = pageWidth(doc);
  const x = doc.page.margins.left;
  const contentX = x + LAYOUT.cardPadding;
  const contentWidth = width - LAYOUT.cardPadding * 2;
  const bodyText = input.body.map((item) => normalizeGermanText(item)).filter(Boolean).join("\n\n");
  const labelWidth = input.label
    ? Math.min(
        LAYOUT.labelMaxWidth,
        Math.max(
          LAYOUT.labelMinWidth,
          doc.font("Helvetica-Bold").fontSize(input.label.length > 12 ? 7.0 : 8.0).widthOfString(normalizeGermanText(input.label).toUpperCase()) + 24,
        ),
      )
    : 0;
  const titleWidth = contentWidth - (input.label ? labelWidth + LAYOUT.labelMarginRight : 0);
  const titleHeight = doc.font("Helvetica-Bold").fontSize(12.5).heightOfString(normalizeGermanText(input.title), {
    width: titleWidth,
    lineGap: 1.2,
  });
  const bodyHeight = estimateTextHeight(doc, bodyText || " ", titleWidth, 10.3);
  const height = Math.max(input.minHeight ?? 84, titleHeight + bodyHeight + LAYOUT.cardPadding * 2 + LAYOUT.cardBodyGap);
  const colors = TONE_COLORS[input.tone ?? "slate"];

  ensureSpace(doc, height + 12);

  const y = doc.y;
  doc.rect(x, y, width, height).fillAndStroke(colors.fill, colors.border);

  if (input.label) {
    writeLabel(doc, input.label, x + width - labelWidth - LAYOUT.labelMarginRight, y + LAYOUT.labelMarginTop, input.tone ?? "slate");
  }

  doc.font("Helvetica-Bold").fontSize(12.5).fillColor(colors.title).text(normalizeGermanText(input.title), contentX, y + LAYOUT.cardPadding, {
    width: titleWidth,
    lineGap: 1.2,
  });
  const titleEndY = doc.y;

  doc.font("Helvetica").fontSize(10.3).fillColor(colors.text).text(bodyText || "Nicht im gespeicherten Report enthalten.", contentX, titleEndY + LAYOUT.cardBodyGap, {
    width: contentWidth,
    lineGap: 3,
  });

  doc.y = y + height + LAYOUT.cardSpacing;
}

function scoreStatus(score: unknown) {
  if (typeof score !== "number" || !Number.isFinite(score)) {
    return { label: "Status offen", tone: "slate" as BoxTone };
  }

  if (score >= 80) {
    return { label: "Stark", tone: "emerald" as BoxTone };
  }

  if (score >= 60) {
    return { label: "Solide mit Potenzial", tone: "amber" as BoxTone };
  }

  return { label: "Hoher Optimierungsbedarf", tone: "rose" as BoxTone };
}

function blockerTone(blocker: Partial<PremiumBlocker>): BoxTone {
  if (blocker.severity === "kritisch") return "rose";
  if (blocker.severity === "wichtig") return "amber";
  return "cyan";
}

function timelineLabel(index: number) {
  if (index === 0) return "Sofort";
  if (index <= 2) return "Diese Woche";
  return "Später";
}

export function getCustomerFacingConsultantSections(notes: ConsultantNotes | null | undefined) {
  const normalized = normalizeConsultantNotes(notes);
  const sections: Array<{ title: string; body: string[]; label?: string; tone?: BoxTone }> = [];

  if (normalized.executiveComment) {
    sections.push({
      title: "Consultant-Einschätzung",
      label: "Veredelt",
      tone: "emerald",
      body: [polishPremiumText(normalized.executiveComment)],
    });
  }

  if (normalized.priorityOverrideNotes) {
    sections.push({
      title: "Prioritäten nach manueller Prüfung",
      label: "Priorität",
      tone: "cyan",
      body: [polishPremiumText(normalized.priorityOverrideNotes)],
    });
  }

  if (normalized.customActionItems?.length) {
    sections.push({
      title: "Ergänzte Maßnahmen",
      label: "Nächste Schritte",
      tone: "amber",
      body: normalized.customActionItems.map((item) => polishPremiumText(item)),
    });
  }

  if (normalized.upsellRecommendation) {
    sections.push({
      title: "Empfohlener nächster Hebel",
      label: "Option",
      tone: "slate",
      body: [polishPremiumText(normalized.upsellRecommendation)],
    });
  }

  return sections;
}

function writeCover(doc: PDFKit.PDFDocument, analysis: StoredAnalysisResult) {
  const width = pageWidth(doc);
  const x = doc.page.margins.left;
  const y = doc.page.margins.top;
  const score = analysis.analysis.overallScore;
  const status = scoreStatus(score);

  doc.rect(x, y, width, 206).fill(COLORS.slate950);
  doc.rect(x, y + 170, width, 36).fill(COLORS.cyan600);

  doc.font("Helvetica-Bold").fontSize(11).fillColor("#67e8f9").text("SHOPHEBEL", x + 24, y + 24, {
    characterSpacing: 1.2,
  });
  doc.font("Helvetica-Bold").fontSize(28).fillColor(COLORS.white).text("Dein Premium-Report", x + 24, y + 58, {
    width: width - 48,
    lineGap: 2,
  });
  doc.font("Helvetica").fontSize(11.5).fillColor(COLORS.slate200).text(
    "Priorisierte Umsatzbremsen, 7-Tage-Plan und konkrete Maßnahmen.",
    x + 24,
    y + 104,
    { width: width - 48, lineGap: 3 },
  );
  doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.slate950).text(
    `Geprüfte URL: ${textValue(analysis.analysis.url, "Unbekannt")}`,
    x + 24,
    y + 181,
    { width: width - 48 },
  );

  doc.y = y + 230;

  const metricWidth = (width - 18) / 3;
  const metricY = doc.y;
  const metrics = [
    {
      title: "Erstellt",
      value: formatDate(analysis.paidAt ?? analysis.analysis.scannedAt ?? analysis.createdAt),
      tone: "slate" as BoxTone,
    },
    {
      title: "Score",
      value: typeof score === "number" ? `${score}/100` : "n/a",
      tone: status.tone,
    },
    {
      title: "Status",
      value: status.label,
      tone: status.tone,
    },
  ];

  metrics.forEach((metric, index) => {
    const metricX = x + index * (metricWidth + 9);
    const colors = TONE_COLORS[metric.tone];
    doc.rect(metricX, metricY, metricWidth, 68).fillAndStroke(colors.fill, colors.border);
    doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.slate500).text(metric.title.toUpperCase(), metricX + 12, metricY + 13);
    doc.font("Helvetica-Bold").fontSize(15).fillColor(colors.title).text(metric.value, metricX + 12, metricY + 32, {
      width: metricWidth - 24,
    });
  });

  doc.y = metricY + 86;
}

type FooterPageStats = {
  before: number;
  after: number;
};

function addFooters(doc: PDFKit.PDFDocument): FooterPageStats {
  const range = doc.bufferedPageRange();

  for (let index = range.start; index < range.start + range.count; index += 1) {
    doc.switchToPage(index);
    const pageNumber = index - range.start + 1;
    const y = doc.page.height - 44;
    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const previousX = doc.x;
    const previousY = doc.y;

    doc.moveTo(left, y - 10).lineTo(right, y - 10).strokeColor(COLORS.slate200).lineWidth(1).stroke();
    doc.font("Helvetica").fontSize(8.5).fillColor(COLORS.slate500).text("Shophebel Premium-Report", left, y, {
      width: 220,
      height: 12,
      lineBreak: false,
    });
    doc.text(`Seite ${pageNumber} von ${range.count}`, right - 90, y, {
      width: 90,
      height: 12,
      align: "right",
      lineBreak: false,
    });
    doc.x = previousX;
    doc.y = previousY;
  }

  return {
    before: range.count,
    after: doc.bufferedPageRange().count,
  };
}

async function renderPremiumReportPdfWithFooterStats({
  analysis,
  report,
  consultantNotes,
}: PremiumReportPdfInput): Promise<{ pdf: Buffer; footerPageStats: FooterPageStats }> {
  const doc = new PDFDocument({
    size: "A4",
    margin: 54,
    bufferPages: true,
    compress: false,
    info: {
      Title: "Shophebel Premium-Report",
      Author: "Shophebel",
      Subject: analysis.analysis.url,
    },
  });
  const chunks: Buffer[] = [];

  doc.page.margins.bottom = 72;
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  const completed = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const summary: Partial<PremiumReport["premiumSummary"]> = report.premiumSummary ?? {};
  const topRevenueBlockers: Array<Partial<PremiumBlocker>> = Array.isArray(report.topRevenueBlockers)
    ? report.topRevenueBlockers
    : [];
  const quickImplementationPlan = Array.isArray(report.quickImplementationPlan)
    ? report.quickImplementationPlan
    : [];
  const visualAuditNotes = Array.isArray(report.visualAuditNotes)
    ? report.visualAuditNotes
    : [];
  const priorityRoadmap = stringList(report.priorityRoadmap);
  const customerConsultantSections = getCustomerFacingConsultantSections(consultantNotes);

  writeCover(doc, analysis);

  drawSectionHeader(doc, "Management-Zusammenfassung", "Einordnung");
  writeCard(doc, {
    title: textValue(summary.headline, "Premium Anfrage- und Vertrauens-Audit"),
    tone: "cyan",
    label: "Kurzfazit",
    minHeight: 124,
    body: [
      textValue(summary.mainReason, "Der Premium-Report fasst die wichtigsten Anfrage- und Kaufhebel dieser Analyse zusammen."),
      textValue(summary.firstFocus, "Starte mit dem Hebel, der Klarheit, Vertrauen und den nächsten Schritt am schnellsten verbessert."),
      textValue(summary.businessRelevance, "Jede reduzierte Reibung kann mehr qualifizierte Anfragen aus bestehendem Traffic holen."),
      `Schnellster Hebel: ${textValue(summary.fastestWin, "Wichtigste Maßnahme zuerst umsetzen.")}`,
    ],
  });

  if (hasCustomerFacingConsultantNotes(consultantNotes)) {
    drawSectionHeader(doc, "Consultant-Kommentare", "Manuelle Veredelung");
    customerConsultantSections.forEach((section) => {
      writeCard(doc, section);
    });
  }

  drawSectionHeader(doc, "Top-Umsatzbremsen", "Prioritäten");
  if (topRevenueBlockers.length > 0) {
    topRevenueBlockers.forEach((blocker, index) => {
      writeCard(doc, {
        title: `${blocker.priority ?? index + 1}. ${textValue(blocker.title, "Umsatzblocker")}`,
        tone: blockerTone(blocker),
        label: textValue(blocker.severity, "Priorität"),
        body: [
          `${textValue(blocker.category, "Kategorie")} | Aufwand: ${textValue(blocker.effort, "n/a")}`,
          textValue(blocker.whyItMatters, "Warum es zählt: nicht im gespeicherten Report enthalten."),
          textValue(blocker.likelyBusinessImpact, "Business-Impact: nicht im gespeicherten Report enthalten."),
          `Empfehlung: ${textValue(blocker.recommendedFix, "Konkrete Maßnahme priorisieren.")}`,
        ],
      });
    });
  } else {
    writeCard(doc, {
      title: "Keine separaten Umsatzblocker gespeichert",
      tone: "slate",
      body: ["Der Export bleibt nutzbar; für diese Analyse liegen keine Top-Umsatzbremsen im gespeicherten Premium-Report vor."],
    });
  }

  drawSectionHeader(doc, "Conversion-Hypothese", "Wirklogik");
  writeCard(doc, {
    title: "Warum diese Maßnahmen wirken sollen",
    tone: "dark",
    body: [
      textValue(
        report.conversionHypothesis,
        "Wenn Klarheit, Vertrauen und der nächste Schritt sichtbarer werden, verstehen Besucher schneller, was sie tun sollen. Dadurch sinkt die Reibung im sichtbaren Startbereich und die Wahrscheinlichkeit für Anfragen oder Käufe steigt.",
      ),
    ],
  });

  drawSectionHeader(doc, "7-Tage-Plan", "Umsetzung");
  if (quickImplementationPlan.length > 0) {
    quickImplementationPlan.forEach((step, index) => {
      writeCard(doc, {
        title: `${textValue(step.days, "Zeitraum")}: ${textValue(step.focus, "Fokus")}`,
        tone: index === 0 ? "emerald" : "slate",
        label: timelineLabel(index),
        body: stringList(step.actions).length > 0
          ? stringList(step.actions)
          : ["Keine separaten Aktionen im gespeicherten Report vorhanden."],
      });
    });
  } else {
    writeCard(doc, {
      title: "Kein 7-Tage-Plan gespeichert",
      tone: "slate",
      body: ["Der Report enthaelt aktuell keinen separaten Umsetzungsplan."],
    });
  }

  drawSectionHeader(doc, "Priorisierte Maßnahmen", "Roadmap");
  if (priorityRoadmap.length > 0) {
    priorityRoadmap.forEach((item, index) => {
      const label = index === 0 ? "Sofort" : index <= 2 ? "Diese Woche" : "Später";
      writeCard(doc, {
        title: `Maßnahme ${index + 1}`,
        tone: index === 0 ? "emerald" : index <= 2 ? "amber" : "slate",
        label,
        minHeight: 58,
        body: [item],
      });
    });
  } else {
    writeCard(doc, {
      title: "Keine priorisierten Maßnahmen gespeichert",
      tone: "slate",
      body: ["Der Export bleibt stabil; priorisierte Maßnahmen können später aus dem Report ergänzt werden."],
    });
  }

  drawSectionHeader(doc, "Visuelle Prüfung", "Sichtbarkeit");
  if (visualAuditNotes.length > 0) {
    visualAuditNotes.forEach((note) => {
      writeCard(doc, {
        title: textValue(note.area, "Bereich"),
        tone: "slate",
        minHeight: 62,
        body: [textValue(note.note, "Keine Notiz im gespeicherten Report enthalten.")],
      });
    });
  } else {
    writeCard(doc, {
      title: "Keine Notizen zur visuellen Prüfung gespeichert",
      tone: "slate",
      body: ["Für diesen Export wurden bewusst keine Screenshots eingebettet. Die textlichen Hinweise zur visuellen Prüfung fehlen im gespeicherten Report."],
    });
  }

  const footerPageStats = addFooters(doc);
  doc.end();

  return {
    pdf: await completed,
    footerPageStats,
  };
}

export function countPdfPages(pdf: Buffer) {
  return (pdf.toString("latin1").match(/\/Type\s*\/Page\b/g) ?? []).length;
}

export async function renderPremiumReportPdf(input: PremiumReportPdfInput): Promise<Buffer> {
  const { pdf } = await renderPremiumReportPdfWithFooterStats(input);

  return pdf;
}

export async function renderPremiumReportPdfDiagnostics(input: PremiumReportPdfInput) {
  return renderPremiumReportPdfWithFooterStats(input);
}
