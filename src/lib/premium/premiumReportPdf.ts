import PDFDocument from "pdfkit/js/pdfkit.standalone";
import { readFile } from "fs/promises";
import path from "path";

import type { StoredAnalysisResult } from "@/lib/analysisStore";
import type { PremiumBlocker, PremiumReport } from "@/lib/premium/buildPremiumReport";
import type { ConsultantNotes } from "@/lib/premium/consultantNotes";
import {
  hasCustomerFacingConsultantNotes,
  normalizeConsultantNotes,
} from "@/lib/premium/consultantNotes";
import { normalizeGermanText, polishPremiumText } from "@/lib/premium/premiumCopy";
import { REPORT_LABELS } from "@/lib/report/reportCopy";

type PremiumReportPdfInput = {
  analysis: StoredAnalysisResult;
  report: Partial<PremiumReport>;
  consultantNotes?: ConsultantNotes | null;
};

type BoxTone = "dark" | "cyan" | "emerald" | "amber" | "rose" | "slate";
type PdfImageFormat = "png" | "jpeg" | "webp" | "unsupported";
type PdfImageAsset = {
  buffer: Buffer;
  src: string;
  label: string;
  contentType: string;
  detectedFormat: PdfImageFormat;
};
type VisualPreviewAsset =
  | { kind: "image"; asset: PdfImageAsset }
  | { kind: "fallback"; src: string; label: string }
  | null;

const COLORS = {
  slate950: "#0f172a",
  slate900: "#111827",
  slate800: "#1e293b",
  slate700: "#334155",
  slate600: "#475569",
  slate500: "#64748b",
  slate200: "#e2e8f0",
  slate150: "#eef2f7",
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

const MIN_SCREENSHOT_BUFFER_LENGTH = 1000;
const VISUAL_PREVIEW_EMBED_FALLBACK =
  "Die visuelle Vorschau wurde erfasst, konnte aber für diesen PDF-Export nicht eingebettet werden.";
const MISSING_REPORT_VALUE = "Für diesen Punkt liegt keine separate Kundenangabe vor.";

export function getPremiumReportPdfStaticLabels() {
  return [
    "Dein Premium-Bericht",
    "Management-Zusammenfassung",
    "Top-Umsatzbremsen",
    REPORT_LABELS.measuresPlan,
    "Conversion-Hypothese",
    REPORT_LABELS.sevenDayPlan,
    "Priorisierte Maßnahmen",
    "Visuelle Prüfung",
    REPORT_LABELS.websiteIntelligenceScore,
    REPORT_LABELS.screenshotIntelligenceConsole,
    "Strategische Premium-Ebene",
    "sichtbarer Startbereich",
    "Übersicht",
    "Einführung",
    "Nächster Schritt",
    "Nutzerführung",
  ].map((label) => normalizeGermanText(label));
}

function textValue(value: unknown, fallback = MISSING_REPORT_VALUE) {
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

function collectNormalizedTextLeaves(value: unknown, output: string[]) {
  if (typeof value === "string" || typeof value === "number") {
    const normalized = textValue(value, "");

    if (normalized) {
      output.push(normalized);
    }

    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectNormalizedTextLeaves(item, output));
    return;
  }

  if (value && typeof value === "object") {
    Object.values(value).forEach((item) => collectNormalizedTextLeaves(item, output));
  }
}

export function getPremiumReportPdfRenderTextData({
  analysis,
  report,
  consultantNotes,
}: PremiumReportPdfInput) {
  const output = [
    ...getPremiumReportPdfStaticLabels(),
    textValue(analysis.analysis.url, "Unbekannt"),
  ];

  collectNormalizedTextLeaves(report, output);
  getCustomerFacingConsultantSections(consultantNotes).forEach((section) => {
    collectNormalizedTextLeaves(section, output);
  });

  return output;
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
  doc.roundedRect(x, y, width, height, 4).fillAndStroke(colors.fill, colors.border);

  if (input.label) {
    writeLabel(doc, input.label, x + width - labelWidth - LAYOUT.labelMarginRight, y + LAYOUT.labelMarginTop, input.tone ?? "slate");
  }

  doc.font("Helvetica-Bold").fontSize(12.5).fillColor(colors.title).text(normalizeGermanText(input.title), contentX, y + LAYOUT.cardPadding, {
    width: titleWidth,
    lineGap: 1.2,
  });
  const titleEndY = doc.y;

  doc.font("Helvetica").fontSize(10.3).fillColor(colors.text).text(bodyText || MISSING_REPORT_VALUE, contentX, titleEndY + LAYOUT.cardBodyGap, {
    width: contentWidth,
    lineGap: 3,
  });

  doc.y = y + height + LAYOUT.cardSpacing;
}

function scoreStatus(score: unknown) {
  if (typeof score !== "number" || !Number.isFinite(score)) {
    return { label: "Einschätzung offen", tone: "slate" as BoxTone };
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

function subscoreRows(analysis: StoredAnalysisResult) {
  const categories = analysis.analysis.categories;

  return [
    ["Klarheit", categories.conversion.score],
    ["Vertrauen", categories.trust.score],
    ["Design", categories.design.score],
    ["Mobile UX", categories.performance.score],
    ["KI-Sichtbarkeit", categories.aiVisibility.score],
    ["SEO", categories.seo.score],
  ] as const;
}

function isDevelopment() {
  return process.env.NODE_ENV === "development";
}

function logScreenshotDebug(message: string, details: {
  contentType?: string;
  bufferLength?: number;
  detectedFormat?: PdfImageFormat;
  screenshotUrl: string;
  errorMessage?: string;
}) {
  if (!isDevelopment()) {
    return;
  }

  console.warn(`[premium-report-pdf] ${message}`, details);
}

function inferImageContentType(src: string) {
  const pathname = src.split("?")[0].toLowerCase();

  if (pathname.endsWith(".png")) return "image/png";
  if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) return "image/jpeg";
  if (pathname.endsWith(".webp")) return "image/webp";

  return "application/octet-stream";
}

function normalizeContentType(contentType: string) {
  return contentType.split(";")[0].trim().toLowerCase();
}

function detectImageFormat(buffer: Buffer): PdfImageFormat {
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "png";
  }

  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpeg";
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "webp";
  }

  return "unsupported";
}

function validateScreenshotBuffer(input: {
  buffer: Buffer;
  src: string;
  label: string;
  contentType: string;
}): PdfImageAsset | null {
  const contentType = normalizeContentType(input.contentType);
  const bufferLength = input.buffer.length;
  const detectedFormat = detectImageFormat(input.buffer);
  const debugDetails = {
    contentType,
    bufferLength,
    detectedFormat,
    screenshotUrl: input.src,
  };

  if (bufferLength <= MIN_SCREENSHOT_BUFFER_LENGTH) {
    logScreenshotDebug("Screenshot buffer is too small for PDF embedding", debugDetails);
    return null;
  }

  if (!contentType.startsWith("image/")) {
    logScreenshotDebug("Screenshot response is not an image", debugDetails);
    return null;
  }

  if (detectedFormat === "unsupported") {
    logScreenshotDebug("Screenshot image signature is unsupported", debugDetails);
    return null;
  }

  return {
    buffer: input.buffer,
    src: input.src,
    label: input.label,
    contentType,
    detectedFormat,
  };
}

async function convertScreenshotForPdfKit(asset: PdfImageAsset): Promise<PdfImageAsset | null> {
  if (asset.detectedFormat === "png" || asset.detectedFormat === "jpeg") {
    return asset;
  }

  try {
    const sharpModule = await import("sharp");
    const sharp = sharpModule.default;
    const buffer = await sharp(asset.buffer).png().toBuffer();
    const convertedFormat = detectImageFormat(buffer);

    if (buffer.length <= MIN_SCREENSHOT_BUFFER_LENGTH || convertedFormat !== "png") {
      logScreenshotDebug("Screenshot conversion produced an invalid PDF image", {
        contentType: "image/png",
        bufferLength: buffer.length,
        detectedFormat: convertedFormat,
        screenshotUrl: asset.src,
      });
      return null;
    }

    return {
      ...asset,
      buffer,
      contentType: "image/png",
      detectedFormat: "png",
    };
  } catch (error) {
    logScreenshotDebug("Screenshot conversion for PDF embedding failed", {
      contentType: asset.contentType,
      bufferLength: asset.buffer.length,
      detectedFormat: asset.detectedFormat,
      screenshotUrl: asset.src,
      errorMessage: error instanceof Error ? error.message : "unknown",
    });
    return null;
  }
}

function resolveGeneratedScreenshotPath(src: string) {
  if (!src.startsWith("/generated-screenshots/") || process.env.NODE_ENV === "production") {
    return null;
  }

  const screenshotRoot = path.join(process.cwd(), "public", "generated-screenshots");
  let relativePath = "";

  try {
    relativePath = decodeURIComponent(src.slice("/generated-screenshots/".length));
  } catch (error) {
    logScreenshotDebug("Local screenshot path could not be decoded", {
      contentType: inferImageContentType(src),
      bufferLength: 0,
      detectedFormat: "unsupported",
      screenshotUrl: src,
      errorMessage: error instanceof Error ? error.message : "unknown",
    });
    return null;
  }

  const absolutePath = path.resolve(screenshotRoot, relativePath);
  const relativeToRoot = path.relative(screenshotRoot, absolutePath);

  if (relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) {
    logScreenshotDebug("Local screenshot path escaped the generated screenshot directory", {
      contentType: inferImageContentType(src),
      bufferLength: 0,
      detectedFormat: "unsupported",
      screenshotUrl: src,
    });
    return null;
  }

  return absolutePath;
}

async function fetchPdfImage(src: string, label: string): Promise<PdfImageAsset | null> {
  const localScreenshotPath = resolveGeneratedScreenshotPath(src);

  if (localScreenshotPath) {
    try {
      const buffer = await readFile(localScreenshotPath);
      const asset = validateScreenshotBuffer({
        buffer,
        src,
        label,
        contentType: inferImageContentType(src),
      });

      return asset ? convertScreenshotForPdfKit(asset) : null;
    } catch (error) {
      logScreenshotDebug("Local screenshot read failed", {
        contentType: inferImageContentType(src),
        bufferLength: 0,
        detectedFormat: "unsupported",
        screenshotUrl: src,
        errorMessage: error instanceof Error ? error.message : "unknown",
      });
      return null;
    }
  }

  if (!/^https?:\/\//i.test(src)) {
    return null;
  }

  try {
    const response = await fetch(src, { cache: "no-store" });

    if (!response.ok) {
      logScreenshotDebug("Screenshot fetch failed", {
        contentType: response.headers.get("content-type") ?? "",
        bufferLength: 0,
        detectedFormat: "unsupported",
        screenshotUrl: src,
        errorMessage: `HTTP ${response.status}`,
      });
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const asset = validateScreenshotBuffer({
      buffer,
      src,
      label,
      contentType: response.headers.get("content-type") ?? "",
    });

    return asset ? convertScreenshotForPdfKit(asset) : null;
  } catch (error) {
    logScreenshotDebug("Screenshot fetch threw", {
      contentType: "",
      bufferLength: 0,
      detectedFormat: "unsupported",
      screenshotUrl: src,
      errorMessage: error instanceof Error ? error.message : "unknown",
    });
    return null;
  }
}

async function resolveVisualPreviewAsset(analysis: StoredAnalysisResult) {
  const screenshots = analysis.analysis.screenshots;
  const candidates = [
    { src: screenshots?.viewport, label: REPORT_LABELS.desktopScreenshot },
    { src: screenshots?.fullPage, label: REPORT_LABELS.fullPageScreenshot },
    { src: screenshots?.mobile, label: REPORT_LABELS.mobileScreenshot },
    { src: screenshots?.hero, label: REPORT_LABELS.heroScreenshot },
  ];
  let attemptedScreenshot = null as { src: string; label: string } | null;

  for (const candidate of candidates) {
    if (!candidate.src) continue;
    attemptedScreenshot = { src: candidate.src, label: candidate.label };
    const asset = await fetchPdfImage(candidate.src, candidate.label);
    if (asset) return { kind: "image", asset } satisfies VisualPreviewAsset;
  }

  return attemptedScreenshot
    ? ({ kind: "fallback", ...attemptedScreenshot } satisfies VisualPreviewAsset)
    : null;
}

function writeScoreDashboard(doc: PDFKit.PDFDocument, analysis: StoredAnalysisResult) {
  drawSectionHeader(doc, REPORT_LABELS.websiteIntelligenceScore, REPORT_LABELS.executiveSnapshot);
  const width = pageWidth(doc);
  const x = doc.page.margins.left;
  const y = doc.y;
  const score = analysis.analysis.overallScore;
  const status = scoreStatus(score);
  const rows = subscoreRows(analysis);
  const leftWidth = 164;
  const rightX = x + leftWidth + 18;
  const rightWidth = width - leftWidth - 18;
  const height = 176;

  ensureSpace(doc, height + 18);
  doc.roundedRect(x, y, leftWidth, height, 4).fillAndStroke(COLORS.slate950, COLORS.slate950);
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#67e8f9").text("ANALYSEWERT", x + 16, y + 18, {
    width: leftWidth - 32,
  });
  doc.font("Helvetica-Bold").fontSize(42).fillColor(COLORS.white).text(typeof score === "number" ? String(score) : "offen", x + 16, y + 52, {
    width: leftWidth - 32,
  });
  doc.font("Helvetica").fontSize(10).fillColor(COLORS.slate200).text(status.label, x + 16, y + 108, {
    width: leftWidth - 32,
    lineGap: 2,
  });

  rows.forEach(([label, value], index) => {
    const rowY = y + index * 28;
    const numericValue = Number(value);
    const barWidth = Math.max(6, Math.min(100, numericValue)) / 100 * (rightWidth - 130);

    doc.font("Helvetica-Bold").fontSize(9.5).fillColor(COLORS.slate800).text(String(label), rightX, rowY + 2, {
      width: 104,
      height: 14,
      lineBreak: false,
    });
    doc.roundedRect(rightX + 112, rowY + 5, rightWidth - 130, 8, 2).fill(COLORS.slate100);
    doc.roundedRect(rightX + 112, rowY + 5, barWidth, 8, 2).fill(numericValue >= 70 ? COLORS.emerald700 : numericValue >= 55 ? COLORS.amber700 : COLORS.rose700);
    doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.slate700).text(`${value}/100`, rightX + rightWidth - 44, rowY + 1, {
      width: 44,
      align: "right",
      lineBreak: false,
    });
  });

  doc.y = y + height + LAYOUT.cardSpacing;
}

function writeVisualPreviewPage(
  doc: PDFKit.PDFDocument,
  analysis: StoredAnalysisResult,
  visualPreview: VisualPreviewAsset,
) {
  doc.addPage();
  drawSectionHeader(doc, REPORT_LABELS.screenshotIntelligenceConsole, REPORT_LABELS.visualAudit);
  const width = pageWidth(doc);
  const x = doc.page.margins.left;

  if (visualPreview) {
    const visualAsset = visualPreview.kind === "image" ? visualPreview.asset : null;
    const visualLabel = visualPreview.kind === "image" ? visualPreview.asset.label : visualPreview.label;

    writeCard(doc, {
      title: visualLabel,
      tone: "cyan",
      label: REPORT_LABELS.capture,
      minHeight: 68,
      body: [
        "Diese Vorschau dokumentiert den sichtbaren Website-Eindruck des Analyse-Laufs und dient als Grundlage für die markierten Umsatzbremsen.",
      ],
    });

    ensureSpace(doc, 390);
    const y = doc.y;
    doc.roundedRect(x, y, width, 370, 4).fillAndStroke(COLORS.slate50, COLORS.slate200);

    if (visualAsset) {
      try {
        doc.image(visualAsset.buffer, x + 12, y + 12, {
          fit: [width - 24, 346],
          align: "center",
        });
      } catch (error) {
        logScreenshotDebug("Screenshot embed failed", {
          contentType: visualAsset.contentType,
          bufferLength: visualAsset.buffer.length,
          detectedFormat: visualAsset.detectedFormat,
          screenshotUrl: visualAsset.src,
          errorMessage: error instanceof Error ? error.message : "unknown",
        });
        doc.font("Helvetica").fontSize(11).fillColor(COLORS.slate700).text(
          normalizeGermanText(VISUAL_PREVIEW_EMBED_FALLBACK),
          x + 20,
          y + 28,
          { width: width - 40, lineGap: 3 },
        );
      }
    } else {
      doc.font("Helvetica").fontSize(11).fillColor(COLORS.slate700).text(
        normalizeGermanText(VISUAL_PREVIEW_EMBED_FALLBACK),
        x + 20,
        y + 28,
        { width: width - 40, lineGap: 3 },
      );
    }
    doc.y = y + 392;
    return;
  }

  writeCard(doc, {
    title: "Visuelle Ansicht nicht verfügbar",
    tone: "amber",
    label: "Hinweis",
    minHeight: 150,
    body: [
      "Die visuelle Ansicht war in diesem Lauf nicht verfügbar. Der strategische Bericht basiert auf strukturellen, semantischen und anfragebezogenen Signalen.",
      "Für eine vollständige visuelle Analyse bitte die Analyse neu ausführen, damit Desktop- und Mobile-Ansichten gespeichert werden.",
      analysis.analysis.metadata?.screenshotError
        ? `Hinweis zur Ansicht: ${analysis.analysis.metadata.screenshotError}`
        : "Dieser Hinweis betrifft nur die visuelle Vorschau; Bewertung, Umsatzbremsen und strategische Einordnung bleiben auswertbar.",
    ],
  });
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

  doc.rect(x, y, width, 214).fill(COLORS.slate950);
  doc.rect(x, y + 174, width, 40).fill(COLORS.cyan600);

  doc.font("Helvetica-Bold").fontSize(11).fillColor("#67e8f9").text("SHOPHEBEL", x + 24, y + 24);
  doc.font("Helvetica-Bold").fontSize(29).fillColor(COLORS.white).text("Dein Premium-Bericht", x + 24, y + 58, {
    width: width - 48,
    lineGap: 2,
  });
  doc.font("Helvetica").fontSize(11.5).fillColor(COLORS.slate200).text(
    "Klare Einordnung, priorisierte Umsatzbremsen und nächste Schritte für die Umsetzung.",
    x + 24,
    y + 105,
    { width: width - 48, lineGap: 3 },
  );
  doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.slate950).text(
    `Geprüfte URL: ${textValue(analysis.analysis.url, "Unbekannt")}`,
    x + 24,
    y + 185,
    { width: width - 48 },
  );

  doc.y = y + 238;

  const metricWidth = (width - 18) / 3;
  const metricY = doc.y;
  const metrics = [
    {
      title: "Erstellt",
      value: formatDate(analysis.paidAt ?? analysis.analysis.scannedAt ?? analysis.createdAt),
      tone: "slate" as BoxTone,
    },
    {
      title: REPORT_LABELS.score,
    value: typeof score === "number" ? `${score}/100` : "offen",
      tone: status.tone,
    },
    {
      title: REPORT_LABELS.status,
      value: status.label,
      tone: status.tone,
    },
  ];

  metrics.forEach((metric, index) => {
    const metricX = x + index * (metricWidth + 9);
    const colors = TONE_COLORS[metric.tone];
    doc.roundedRect(metricX, metricY, metricWidth, 68, 4).fillAndStroke(colors.fill, colors.border);
    doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.slate500).text(metric.title.toUpperCase(), metricX + 12, metricY + 13, {
      width: metricWidth - 24,
      lineBreak: false,
    });
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
    doc.font("Helvetica").fontSize(8.5).fillColor(COLORS.slate500).text("Shophebel Premium-Bericht", left, y, {
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
      Title: "Shophebel Premium-Bericht",
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
  const opportunityRoadmap = report.opportunityRoadmap;
  const opportunityRoadmapItems = Array.isArray(opportunityRoadmap?.items)
    ? opportunityRoadmap.items
    : [];
  const customerConsultantSections = getCustomerFacingConsultantSections(consultantNotes);
  const visualAsset = await resolveVisualPreviewAsset(analysis);

  writeCover(doc, analysis);
  writeScoreDashboard(doc, analysis);

  drawSectionHeader(doc, "Management-Zusammenfassung", "Einordnung");
  writeCard(doc, {
    title: textValue(summary.headline, "Premium Anfrage- und Vertrauens-Audit"),
    tone: "cyan",
    label: "Kurzfazit",
    minHeight: 124,
    body: [
      textValue(summary.mainReason, "Der Premium-Bericht fasst die wichtigsten Anfrage- und Kaufhebel dieser Analyse zusammen."),
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

  writeVisualPreviewPage(doc, analysis, visualAsset);

  drawSectionHeader(doc, "Top-Umsatzbremsen", "Prioritäten");
  if (topRevenueBlockers.length > 0) {
    topRevenueBlockers.forEach((blocker, index) => {
      writeCard(doc, {
        title: `${blocker.priority ?? index + 1}. ${textValue(blocker.title, "Umsatzblocker")}`,
        tone: blockerTone(blocker),
        label: textValue(blocker.severity, "Priorität"),
        body: [
          `${textValue(blocker.category, "Kategorie")} | Aufwand: ${textValue(blocker.effort, "offen")}`,
          textValue(blocker.whyItMatters, "Warum es zählt: Dieser Punkt kann die Entscheidung unnötig erschweren."),
          textValue(blocker.likelyBusinessImpact, "Geschäftliche Wirkung: Weniger Reibung kann mehr qualifizierte Anfragen unterstützen."),
          `Empfehlung: ${textValue(blocker.recommendedFix, "Konkrete Maßnahme priorisieren.")}`,
        ],
      });
    });
  } else {
    writeCard(doc, {
      title: "Keine separaten Umsatzblocker gespeichert",
      tone: "slate",
      body: ["Der Export bleibt nutzbar; für diese Analyse wurden keine separaten Top-Umsatzbremsen ermittelt."],
    });
  }

  if (opportunityRoadmapItems.length > 0) {
    drawSectionHeader(doc, "Priorisierter Maßnahmenplan", "Potenziale");
    writeCard(doc, {
      title: textValue(opportunityRoadmap?.title, "Priorisierter Maßnahmenplan"),
      tone: "cyan",
      label: REPORT_LABELS.plan,
      minHeight: 82,
      body: [
        textValue(
          opportunityRoadmap?.summary,
          "Die wichtigsten Potenziale werden nach Wirkung und Umsetzbarkeit priorisiert.",
        ),
      ],
    });
    opportunityRoadmapItems.forEach((item, index) => {
      writeCard(doc, {
        title: `${index + 1}. ${textValue(item.title, "Potenzial")}`,
        tone: index === 0 ? "emerald" : index <= 2 ? "amber" : "slate",
        label: `${REPORT_LABELS.priorityScore} ${textValue(item.priorityScore, String(index + 1))}`,
        body: [
          `Geschäftliche Wirkung: ${textValue(item.businessImpact)}`,
          `Empfohlener Umsetzungspfad: ${textValue(item.suggestedModule)}`,
          `Begleitung: ${textValue(item.suggestedService)}`,
          `Aufwand: ${textValue(item.implementationEffort, "mittel")}`,
          `Erwarteter Effekt: ${textValue(item.expectedEffect)}`,
          `Nächster Schritt: ${textValue(item.nextStep, "In den priorisierten Maßnahmenplan aufnehmen.")}`,
        ],
      });
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

  drawSectionHeader(doc, REPORT_LABELS.sevenDayPlan, "Umsetzung");
  if (quickImplementationPlan.length > 0) {
    quickImplementationPlan.forEach((step, index) => {
      writeCard(doc, {
        title: `${textValue(step.days, "Zeitraum")}: ${textValue(step.focus, "Fokus")}`,
        tone: index === 0 ? "emerald" : "slate",
        label: timelineLabel(index),
        body: stringList(step.actions).length > 0
          ? stringList(step.actions)
          : ["Die wichtigsten nächsten Schritte werden aus den priorisierten Maßnahmen abgeleitet."],
      });
    });
  } else {
    writeCard(doc, {
      title: "Kein 7-Tage-Fahrplan gespeichert",
      tone: "slate",
      body: ["Der Bericht enthält aktuell keinen separaten Umsetzungsfahrplan."],
    });
  }

  drawSectionHeader(doc, "Priorisierte Maßnahmen", REPORT_LABELS.plan);
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
      body: ["Der Export bleibt stabil; priorisierte Maßnahmen können später aus dem Bericht ergänzt werden."],
    });
  }

  drawSectionHeader(doc, "Strategische Premium-Ebene", REPORT_LABELS.visualAudit);
  if (visualAuditNotes.length > 0) {
    visualAuditNotes.forEach((note) => {
      writeCard(doc, {
        title: textValue(note.area, "Bereich"),
        tone: "slate",
        minHeight: 62,
        body: [textValue(note.note)],
      });
    });
  } else {
    writeCard(doc, {
      title: "Visuelle Prüfung ergänzen",
      tone: "slate",
      body: ["Für diese Auswertung liegt keine separate visuelle Detailnotiz vor. Die übrigen Kapitel bleiben als Kundenreport nutzbar."],
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
