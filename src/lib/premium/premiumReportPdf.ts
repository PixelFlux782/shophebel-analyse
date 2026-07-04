import PDFDocument from "pdfkit/js/pdfkit.standalone";
import { existsSync, readFileSync } from "fs";
import { readFile } from "fs/promises";
import path from "path";

import type { PremiumAiReport } from "@/lib/ai/premiumAiReport.schema";
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
  aiReport?: PremiumAiReport | null;
};

type BoxTone = "ink" | "mist" | "sage" | "gold" | "rose";
type PdfImageFormat = "png" | "jpeg" | "webp" | "unsupported";
type FontKey = "regular" | "medium" | "bold";
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
  ink: "#172033",
  ink2: "#253149",
  muted: "#657085",
  soft: "#eef2f6",
  line: "#d8dee8",
  paper: "#fbfcfd",
  white: "#ffffff",
  accent: "#0f766e",
  accentSoft: "#e7f4f1",
  gold: "#9a6a16",
  goldSoft: "#fff6df",
  rose: "#a23a43",
  roseSoft: "#fff1f2",
  sage: "#2f6f58",
  sageSoft: "#edf8f3",
};

const TONES: Record<BoxTone, { fill: string; border: string; title: string; text: string; label: string }> = {
  ink: { fill: COLORS.ink, border: COLORS.ink, title: COLORS.white, text: "#dbe3ee", label: "#a7f3d0" },
  mist: { fill: COLORS.paper, border: COLORS.line, title: COLORS.ink, text: COLORS.ink2, label: COLORS.accent },
  sage: { fill: COLORS.sageSoft, border: "#bfe5d3", title: COLORS.ink, text: COLORS.ink2, label: COLORS.sage },
  gold: { fill: COLORS.goldSoft, border: "#ead49d", title: COLORS.ink, text: COLORS.ink2, label: COLORS.gold },
  rose: { fill: COLORS.roseSoft, border: "#efc4ca", title: COLORS.ink, text: COLORS.ink2, label: COLORS.rose },
};

const PAGE = {
  marginX: 54,
  marginTop: 54,
  marginBottom: 70,
  footerTop: 32,
  gap: 13,
  radius: 3,
  cardPadding: 16,
};

const MIN_SCREENSHOT_BUFFER_LENGTH = 64;
const VISUAL_PREVIEW_EMBED_FALLBACK =
  "Die visuelle Vorschau wurde erfasst, konnte aber für diesen PDF-Export nicht eingebettet werden.";
const MISSING_REPORT_VALUE = "Für diesen Punkt liegt keine separate Kundenangabe vor.";

export function getPremiumReportPdfStaticLabels() {
  return [
    "Premium-Bericht inkl. KI-Beratung",
    "Executive Summary",
    "Management-Fazit",
    "KI-Einordnung",
    "Die wichtigsten 3 Hebel",
    "Management-Zusammenfassung",
    "Kurzüberblick",
    "Die wichtigsten 3 Umsatzbremsen",
    "Premium-Bericht inkl. KI-Beratung",
    REPORT_LABELS.sevenDayPlan,
    "Detailanhang",
    "Visuelle Website-Analyse",
    "Screenshot-Hinweis",
    REPORT_LABELS.websiteIntelligenceScore,
    REPORT_LABELS.screenshotIntelligenceConsole,
    "Shophebel-Analysewert",
    "Umsatzbremsen",
    "Maßnahmen",
    "Nächster Schritt",
    "Nutzerführung",
  ].map((label) => normalizeGermanText(label));
}

function textValue(value: unknown, fallback = MISSING_REPORT_VALUE) {
  if (typeof value === "string" && value.trim()) return polishPremiumText(value.trim());
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return polishPremiumText(fallback);
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => textValue(item, "")).filter(Boolean) : [];
}

function collectNormalizedTextLeaves(value: unknown, output: string[]) {
  if (typeof value === "string" || typeof value === "number") {
    const normalized = textValue(value, "");
    if (normalized) output.push(normalized);
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
  aiReport,
}: PremiumReportPdfInput) {
  const output = [
    ...getPremiumReportPdfStaticLabels(),
    textValue(analysis.analysis.url, "Unbekannt"),
  ];

  collectNormalizedTextLeaves(report, output);
  if (aiReport) {
    collectNormalizedTextLeaves(aiReport, output);
  }
  getCustomerFacingConsultantSections(consultantNotes).forEach((section) => {
    collectNormalizedTextLeaves(section, output);
  });

  return output;
}

function pageWidth(doc: PDFKit.PDFDocument) {
  return doc.page.width - doc.page.margins.left - doc.page.margins.right;
}

function pageBottom(doc: PDFKit.PDFDocument) {
  return doc.page.height - doc.page.margins.bottom;
}

function ensureSpace(doc: PDFKit.PDFDocument, height: number) {
  if (doc.y + height > pageBottom(doc)) doc.addPage();
}

function registerFonts(doc: PDFKit.PDFDocument) {
  const geistRegular = path.join(process.cwd(), "node_modules", "next", "dist", "compiled", "@vercel", "og", "Geist-Regular.ttf");

  if (existsSync(geistRegular)) {
    const fontBuffer = readFileSync(geistRegular);
    doc.registerFont("ShophebelRegular", fontBuffer);
    doc.registerFont("ShophebelMedium", fontBuffer);
    doc.registerFont("ShophebelBold", fontBuffer);
    return { regular: "ShophebelRegular", medium: "ShophebelMedium", bold: "ShophebelBold" } satisfies Record<FontKey, string>;
  }

  return { regular: "Helvetica", medium: "Helvetica-Bold", bold: "Helvetica-Bold" } satisfies Record<FontKey, string>;
}

function font(doc: PDFKit.PDFDocument, fonts: Record<FontKey, string>, key: FontKey, size: number, color = COLORS.ink) {
  doc.font(fonts[key]).fontSize(size).fillColor(color);
}

function normalizedLines(lines: string[]) {
  return lines.map((line) => normalizeGermanText(line)).filter(Boolean);
}

function measureTextBlock(
  doc: PDFKit.PDFDocument,
  fonts: Record<FontKey, string>,
  text: string,
  width: number,
  size = 10.4,
  lineGap = 3,
  key: FontKey = "regular",
) {
  font(doc, fonts, key, size);
  return doc.heightOfString(normalizeGermanText(text || " "), { width, lineGap });
}

function drawWrappedText(
  doc: PDFKit.PDFDocument,
  fonts: Record<FontKey, string>,
  text: string,
  x: number,
  y: number,
  options: { width: number; size?: number; lineGap?: number; key?: FontKey; color?: string },
) {
  font(doc, fonts, options.key ?? "regular", options.size ?? 10.4, options.color ?? COLORS.ink2);
  doc.text(normalizeGermanText(text), x, y, {
    width: options.width,
    lineGap: options.lineGap ?? 3,
  });
  return doc.y;
}

function splitTextIntoChunks(
  doc: PDFKit.PDFDocument,
  fonts: Record<FontKey, string>,
  text: string,
  width: number,
  maxHeight: number,
) {
  const words = normalizeGermanText(text).split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (measureTextBlock(doc, fonts, candidate, width) <= maxHeight || !current) {
      current = candidate;
      return;
    }
    chunks.push(current);
    current = word;
  });

  if (current) chunks.push(current);
  return chunks;
}

function drawPageFooter(doc: PDFKit.PDFDocument, fonts: Record<FontKey, string>, pageNumber: number, pageCount: number) {
  const y = doc.page.height - PAGE.footerTop;
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;

  doc.moveTo(left, y - 12).lineTo(right, y - 12).strokeColor(COLORS.line).lineWidth(0.8).stroke();
  font(doc, fonts, "regular", 8.2, COLORS.muted);
  doc.text("Shophebel Premium-Bericht", left, y, { width: 220, height: 10, lineBreak: false });
  doc.text(`Seite ${pageNumber} von ${pageCount}`, right - 100, y, {
    width: 100,
    height: 10,
    align: "right",
    lineBreak: false,
  });
}

function drawSectionTitle(
  doc: PDFKit.PDFDocument,
  fonts: Record<FontKey, string>,
  title: string,
  eyebrow?: string,
) {
  ensureSpace(doc, 74);
  const x = doc.page.margins.left;
  const width = pageWidth(doc);

  if (eyebrow) {
    font(doc, fonts, "bold", 8.4, COLORS.accent);
    doc.text(normalizeGermanText(eyebrow).toUpperCase(), x, doc.y, { width, lineGap: 1 });
    doc.y += 7;
  }

  font(doc, fonts, "bold", 17, COLORS.ink);
  doc.text(normalizeGermanText(title), x, doc.y, { width, lineGap: 2 });
  doc.y += 8;
  doc.moveTo(x, doc.y).lineTo(x + width, doc.y).strokeColor(COLORS.line).lineWidth(0.8).stroke();
  doc.y += 19;
}

function drawLabel(
  doc: PDFKit.PDFDocument,
  fonts: Record<FontKey, string>,
  label: string,
  x: number,
  y: number,
  color: string,
  maxWidth: number,
) {
  const text = normalizeGermanText(label).toUpperCase();
  font(doc, fonts, "bold", 7.2, color);
  doc.text(text, x, y, {
    width: maxWidth,
    lineGap: 1,
    align: "right",
  });
}

function drawTextBox(
  doc: PDFKit.PDFDocument,
  fonts: Record<FontKey, string>,
  input: {
    title: string;
    body: string[];
    tone?: BoxTone;
    label?: string;
    minHeight?: number;
    titleSize?: number;
  },
) {
  const tone = TONES[input.tone ?? "mist"];
  const x = doc.page.margins.left;
  const width = pageWidth(doc);
  const padding = PAGE.cardPadding;
  const contentWidth = width - padding * 2;
  const bodyText = normalizedLines(input.body).join("\n\n") || MISSING_REPORT_VALUE;
  const maxBoxHeight = pageBottom(doc) - doc.page.margins.top - 6;
  const titleSize = input.titleSize ?? 12.2;
  const titleWidth = input.label ? contentWidth - 118 : contentWidth;
  const titleHeight = measureTextBlock(doc, fonts, input.title, titleWidth, titleSize, 2, "bold");
  let segments = [bodyText];
  const bodyMaxHeight = maxBoxHeight - padding * 2 - titleHeight - 18;

  if (measureTextBlock(doc, fonts, bodyText, contentWidth) > bodyMaxHeight) {
    segments = splitTextIntoChunks(doc, fonts, bodyText, contentWidth, Math.max(80, bodyMaxHeight));
  }

  let currentTitle = input.title;
  segments.forEach((segment, index) => {
    const bodyHeight = measureTextBlock(doc, fonts, segment, contentWidth);
    const height = Math.min(
      maxBoxHeight,
      Math.max(input.minHeight ?? 0, padding * 2 + titleHeight + 10 + bodyHeight),
    );

    ensureSpace(doc, height + PAGE.gap);
    const y = doc.y;
    doc.roundedRect(x, y, width, height, PAGE.radius).fillAndStroke(tone.fill, tone.border);

    font(doc, fonts, "bold", titleSize, tone.title);
    doc.text(normalizeGermanText(currentTitle), x + padding, y + padding, {
      width: titleWidth,
      lineGap: 2,
    });

    if (input.label && index === 0) {
      drawLabel(doc, fonts, input.label, x + width - padding - 112, y + padding + 2, tone.label, 112);
    }

    drawWrappedText(doc, fonts, segment, x + padding, y + padding + titleHeight + 10, {
      width: contentWidth,
      size: 10.35,
      lineGap: 3.4,
      color: tone.text,
    });
    doc.y = y + height + PAGE.gap;
    currentTitle = `${input.title} (Fortsetzung)`;
  });
}

function drawInsightCard(
  doc: PDFKit.PDFDocument,
  fonts: Record<FontKey, string>,
  title: string,
  body: string,
  index: number,
) {
  drawTextBox(doc, fonts, {
    title: `${index}. ${title}`,
    body: [body],
    tone: index === 1 ? "rose" : index === 2 ? "gold" : "mist",
    minHeight: 86,
  });
}

function drawMetricRow(doc: PDFKit.PDFDocument, fonts: Record<FontKey, string>, analysis: StoredAnalysisResult) {
  const x = doc.page.margins.left;
  const width = pageWidth(doc);
  const rowGap = 10;
  const cardWidth = (width - rowGap * 2) / 3;
  const y = doc.y;
  const status = scoreStatus(analysis.analysis.overallScore);
  const metrics = [
    ["Geprüfte URL", textValue(analysis.analysis.url, "Unbekannt")],
    ["Analysewert", typeof analysis.analysis.overallScore === "number" ? `${analysis.analysis.overallScore}/100` : "offen"],
    ["Einordnung", status.label],
  ] as const;

  ensureSpace(doc, 82);
  metrics.forEach(([label, value], index) => {
    const cardX = x + index * (cardWidth + rowGap);
    doc.roundedRect(cardX, y, cardWidth, 68, PAGE.radius).fillAndStroke(COLORS.paper, COLORS.line);
    font(doc, fonts, "bold", 7.7, COLORS.accent);
    doc.text(label.toUpperCase(), cardX + 12, y + 12, { width: cardWidth - 24, lineBreak: false });
    drawWrappedText(doc, fonts, value, cardX + 12, y + 31, {
      width: cardWidth - 24,
      size: index === 1 ? 15 : 10.3,
      lineGap: 2,
      key: index === 1 ? "bold" : "medium",
      color: COLORS.ink,
    });
  });
  doc.y = y + 84;
}

function scoreStatus(score: unknown) {
  if (typeof score !== "number" || !Number.isFinite(score)) return { label: "Einschätzung offen", tone: "mist" as BoxTone };
  if (score >= 80) return { label: "Stark", tone: "sage" as BoxTone };
  if (score >= 60) return { label: "Solide mit Potenzial", tone: "gold" as BoxTone };
  return { label: "Hoher Optimierungsbedarf", tone: "rose" as BoxTone };
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
  if (isDevelopment()) console.warn(`[premium-report-pdf] ${message}`, details);
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
  ) return "png";

  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpeg";
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) return "webp";

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
  const debugDetails = { contentType, bufferLength, detectedFormat, screenshotUrl: input.src };

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

  return { buffer: input.buffer, src: input.src, label: input.label, contentType, detectedFormat };
}

async function convertScreenshotForPdfKit(asset: PdfImageAsset): Promise<PdfImageAsset | null> {
  if (asset.detectedFormat === "png" || asset.detectedFormat === "jpeg") return asset;

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

    return { ...asset, buffer, contentType: "image/png", detectedFormat: "png" };
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
  if (!src.startsWith("/generated-screenshots/") || process.env.NODE_ENV === "production") return null;

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
  if (relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) return null;
  return absolutePath;
}

async function fetchPdfImage(src: string, label: string): Promise<PdfImageAsset | null> {
  const localScreenshotPath = resolveGeneratedScreenshotPath(src);

  if (localScreenshotPath) {
    try {
      const buffer = await readFile(localScreenshotPath);
      const asset = validateScreenshotBuffer({ buffer, src, label, contentType: inferImageContentType(src) });
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

  if (!/^https?:\/\//i.test(src)) return null;

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

  return attemptedScreenshot ? ({ kind: "fallback", ...attemptedScreenshot } satisfies VisualPreviewAsset) : null;
}

function drawCover(
  doc: PDFKit.PDFDocument,
  fonts: Record<FontKey, string>,
  analysis: StoredAnalysisResult,
  report: Partial<PremiumReport>,
) {
  const x = doc.page.margins.left;
  const y = doc.page.margins.top;
  const width = pageWidth(doc);
  const score = analysis.analysis.overallScore;
  const summary: Partial<PremiumReport["premiumSummary"]> = report.premiumSummary ?? {};
  const blockers = Array.isArray(report.topRevenueBlockers) ? report.topRevenueBlockers.slice(0, 3) : [];
  const title = "Premium-Bericht inkl. KI-Beratung";
  const headerSubtitle = "Executive Summary f\u00fcr bessere Anfragen, mehr Vertrauen und klarere n\u00e4chste Schritte.";
  const titleY = y + 34;
  const titleWidth = width - 82;
  const titleSize = 25.5;
  const titleLineGap = 2.5;
  const subtitleGap = 15;
  const subtitleSize = 11.2;
  const subtitleLineGap = 3;
  const subtitleWidth = width - 78;
  const titleHeight = measureTextBlock(doc, fonts, title, titleWidth, titleSize, titleLineGap, "bold");
  const subtitleY = titleY + titleHeight + subtitleGap;
  const subtitleHeight = measureTextBlock(doc, fonts, headerSubtitle, subtitleWidth, subtitleSize, subtitleLineGap, "regular");
  const headerHeight = Math.ceil(Math.max(204, subtitleY + subtitleHeight + 28));
  const dividerHeight = 6;

  doc.rect(0, 0, doc.page.width, headerHeight).fill(COLORS.ink);
  doc.rect(0, headerHeight, doc.page.width, dividerHeight).fill(COLORS.accent);
  font(doc, fonts, "bold", 9.2, "#b8f3e5");
  doc.text("SHOPHEBEL PREMIUM", x, y + 2, { width, lineBreak: false });
  font(doc, fonts, "bold", titleSize, COLORS.white);
  doc.text(title, x, titleY, { width: titleWidth, lineGap: titleLineGap });
  font(doc, fonts, "regular", subtitleSize, "#dbe3ee");
  doc.text(headerSubtitle, x, subtitleY, {
    width: subtitleWidth,
    lineGap: subtitleLineGap,
  });

  doc.y = headerHeight + dividerHeight + 30;
  drawMetricRow(doc, fonts, analysis);
  drawTextBox(doc, fonts, {
    title: textValue(summary.headline, "Premium Anfrage- und Vertrauens-Audit"),
    label: typeof score === "number" ? `${score}/100` : "Analysewert",
    tone: "mist",
    minHeight: 124,
    body: [
      textValue(summary.mainReason, "Dieser Bericht verdichtet die wichtigsten Anfrage- und Kaufhebel der Analyse."),
      textValue(summary.businessRelevance, "Jede reduzierte Reibung kann mehr qualifizierte Anfragen aus bestehendem Traffic holen."),
    ],
  });

  if (blockers.length > 0) {
    font(doc, fonts, "bold", 12.8, COLORS.ink);
    doc.text("Wichtigste Erkenntnisse", x, doc.y + 2, { width });
    doc.y += 14;
    blockers.forEach((blocker, index) => {
      drawTextBox(doc, fonts, {
        title: `${index + 1}. ${textValue(blocker.title, "Umsatzbremse")}`,
        body: [textValue(blocker.likelyBusinessImpact ?? blocker.whyItMatters, "Dieser Punkt kann Entscheidungen unnötig erschweren.")],
        tone: index === 0 ? "rose" : "mist",
        minHeight: 64,
      });
    });
  }
}

function drawOverview(doc: PDFKit.PDFDocument, fonts: Record<FontKey, string>, analysis: StoredAnalysisResult) {
  drawSectionTitle(doc, fonts, "Kurzüberblick", "Analysewert");
  const width = pageWidth(doc);
  const x = doc.page.margins.left;
  const rows = subscoreRows(analysis);
  const y = doc.y;
  const height = 184;

  ensureSpace(doc, height + 20);
  doc.roundedRect(x, y, width, height, PAGE.radius).fillAndStroke(COLORS.paper, COLORS.line);
  rows.forEach(([label, value], index) => {
    const rowY = y + 18 + index * 26;
    const numericValue = Number(value);
    const barWidth = (Math.max(0, Math.min(100, numericValue)) / 100) * (width - 190);
    font(doc, fonts, "medium", 9.5, COLORS.ink);
    doc.text(label, x + 16, rowY - 1, { width: 112, lineBreak: false });
    doc.roundedRect(x + 132, rowY + 3, width - 190, 7, 2).fill("#e6ebf2");
    doc.roundedRect(x + 132, rowY + 3, Math.max(5, barWidth), 7, 2).fill(numericValue >= 70 ? COLORS.sage : numericValue >= 55 ? COLORS.gold : COLORS.rose);
    font(doc, fonts, "bold", 9, COLORS.muted);
    doc.text(`${value}/100`, x + width - 48, rowY - 2, { width: 32, align: "right", lineBreak: false });
  });

  doc.y = y + height + PAGE.gap;
}

function drawVisualAnalysis(
  doc: PDFKit.PDFDocument,
  fonts: Record<FontKey, string>,
  analysis: StoredAnalysisResult,
  visualPreview: VisualPreviewAsset,
  visualAuditNotes: Array<{ area?: string; note?: string }>,
) {
  drawSectionTitle(doc, fonts, "Visuelle Website-Analyse mit Screenshot", "Visual Audit");
  const x = doc.page.margins.left;
  const width = pageWidth(doc);

  if (!visualPreview) {
    drawTextBox(doc, fonts, {
      title: "Screenshot-Hinweis",
      tone: "gold",
      minHeight: 96,
      body: [
        "Für diesen Export liegt kein einbettbarer Screenshot vor. Der Bericht bleibt vollständig nutzbar; die visuelle Bewertung basiert auf strukturellen und inhaltlichen Signalen.",
        analysis.analysis.metadata?.screenshotError
          ? `Technischer Hinweis: ${analysis.analysis.metadata.screenshotError}`
          : "Bei einer erneuten gerenderten Analyse kann die Screenshot-Ansicht ergänzt werden.",
      ],
    });
    return;
  }

  const visualAsset = visualPreview.kind === "image" ? visualPreview.asset : null;
  const visualLabel = visualPreview.kind === "image" ? visualPreview.asset.label : visualPreview.label;
  const boxHeight = visualAsset ? 322 : 112;
  ensureSpace(doc, boxHeight + PAGE.gap);
  const y = doc.y;
  doc.roundedRect(x, y, width, boxHeight, PAGE.radius).fillAndStroke(COLORS.paper, COLORS.line);
  font(doc, fonts, "bold", 8.3, COLORS.accent);
  doc.text(normalizeGermanText(visualLabel).toUpperCase(), x + 16, y + 14, { width: width - 32 });

  if (visualAsset) {
    try {
      doc.image(`data:${visualAsset.contentType};base64,${visualAsset.buffer.toString("base64")}`, x + 16, y + 34, {
        fit: [width - 32, boxHeight - 50],
        align: "center",
        valign: "center",
      });
    } catch (error) {
      logScreenshotDebug("Screenshot embed failed", {
        contentType: visualAsset.contentType,
        bufferLength: visualAsset.buffer.length,
        detectedFormat: visualAsset.detectedFormat,
        screenshotUrl: visualAsset.src,
        errorMessage: error instanceof Error ? error.message : "unknown",
      });
      drawWrappedText(doc, fonts, VISUAL_PREVIEW_EMBED_FALLBACK, x + 16, y + 38, {
        width: width - 32,
        color: COLORS.ink2,
      });
    }
  } else {
    drawWrappedText(doc, fonts, VISUAL_PREVIEW_EMBED_FALLBACK, x + 16, y + 38, {
      width: width - 32,
      color: COLORS.ink2,
    });
  }

  doc.y = y + boxHeight + PAGE.gap;

  const notes = visualAuditNotes.slice(0, 4);
  if (notes.length > 0) {
    notes.forEach((note) => {
      drawTextBox(doc, fonts, {
        title: textValue(note.area, "Visueller Befund"),
        body: [textValue(note.note, "Visuellen Befund im Kontext der Umsatzbremsen prüfen.")],
        tone: "mist",
        minHeight: 62,
      });
    });
  }
}

export function getCustomerFacingConsultantSections(notes: ConsultantNotes | null | undefined) {
  const normalized = normalizeConsultantNotes(notes);
  const sections: Array<{ title: string; body: string[]; label?: string; tone?: BoxTone }> = [];

  if (normalized.executiveComment) {
    sections.push({
      title: "Consultant-Einschätzung",
      label: "Veredelt",
      tone: "sage",
      body: [polishPremiumText(normalized.executiveComment)],
    });
  }

  if (normalized.priorityOverrideNotes) {
    sections.push({
      title: "Prioritäten nach manueller Prüfung",
      label: "Priorität",
      tone: "mist",
      body: [polishPremiumText(normalized.priorityOverrideNotes)],
    });
  }

  if (normalized.customActionItems?.length) {
    sections.push({
      title: "Ergänzte Maßnahmen",
      label: "Nächste Schritte",
      tone: "gold",
      body: normalized.customActionItems.map((item) => polishPremiumText(item)),
    });
  }

  if (normalized.upsellRecommendation) {
    sections.push({
      title: "Empfohlener nächster Hebel",
      label: "Option",
      tone: "mist",
      body: [polishPremiumText(normalized.upsellRecommendation)],
    });
  }

  return sections;
}

type FooterPageStats = { before: number; after: number };

function addFooters(doc: PDFKit.PDFDocument, fonts: Record<FontKey, string>): FooterPageStats {
  const range = doc.bufferedPageRange();

  for (let index = range.start; index < range.start + range.count; index += 1) {
    doc.switchToPage(index);
    const previousX = doc.x;
    const previousY = doc.y;
    drawPageFooter(doc, fonts, index - range.start + 1, range.count);
    doc.x = previousX;
    doc.y = previousY;
  }

  return { before: range.count, after: doc.bufferedPageRange().count };
}

async function renderPremiumReportPdfWithFooterStats({
  analysis,
  report,
  consultantNotes,
  aiReport,
}: PremiumReportPdfInput): Promise<{ pdf: Buffer; footerPageStats: FooterPageStats }> {
  const doc = new PDFDocument({
    size: "A4",
    margins: {
      top: PAGE.marginTop,
      left: PAGE.marginX,
      right: PAGE.marginX,
      bottom: PAGE.marginBottom,
    },
    bufferPages: true,
    compress: false,
    info: {
      Title: "Shophebel Premium-Bericht",
      Author: "Shophebel",
      Subject: analysis.analysis.url,
    },
  });
  const fonts = registerFonts(doc);
  const chunks: Buffer[] = [];

  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const completed = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const summary: Partial<PremiumReport["premiumSummary"]> = report.premiumSummary ?? {};
  const topRevenueBlockers: Array<Partial<PremiumBlocker>> = Array.isArray(report.topRevenueBlockers)
    ? report.topRevenueBlockers
    : [];
  const quickImplementationPlan = Array.isArray(report.quickImplementationPlan) ? report.quickImplementationPlan : [];
  const visualAuditNotes = Array.isArray(report.visualAuditNotes) ? report.visualAuditNotes : [];
  const priorityRoadmap = stringList(report.priorityRoadmap);
  const opportunityRoadmap = report.opportunityRoadmap;
  const opportunityRoadmapItems = Array.isArray(opportunityRoadmap?.items) ? opportunityRoadmap.items : [];
  const customerConsultantSections = getCustomerFacingConsultantSections(consultantNotes);
  const visualAsset = await resolveVisualPreviewAsset(analysis);

  drawCover(doc, fonts, analysis, report);

  doc.addPage();
  drawOverview(doc, fonts, analysis);

  drawVisualAnalysis(doc, fonts, analysis, visualAsset, visualAuditNotes);

  drawSectionTitle(doc, fonts, "Die wichtigsten 3 Umsatzbremsen", "Prioritäten");
  if (topRevenueBlockers.length > 0) {
    topRevenueBlockers.slice(0, 3).forEach((blocker, index) => {
      drawInsightCard(
        doc,
        fonts,
        textValue(blocker.title, "Umsatzbremse"),
        [
          `${textValue(blocker.category, "Kategorie")} | Aufwand: ${textValue(blocker.effort, "offen")}`,
          textValue(blocker.whyItMatters, "Dieser Punkt kann Entscheidungen unnötig erschweren."),
          `Empfehlung: ${textValue(blocker.recommendedFix, "Konkrete Maßnahme priorisieren.")}`,
        ].join("\n\n"),
        index + 1,
      );
    });
  } else {
    drawTextBox(doc, fonts, {
      title: "Keine separaten Umsatzbremsen gespeichert",
      tone: "mist",
      body: ["Der Export bleibt nutzbar; für diese Analyse wurden keine separaten Top-Umsatzbremsen ermittelt."],
    });
  }

  drawSectionTitle(doc, fonts, "Premium-Bericht inkl. KI-Beratung", "Strategische Einordnung");
  if (aiReport) {
    drawTextBox(doc, fonts, {
      title: "Management-Fazit",
      tone: "ink",
      body: [aiReport.executiveSummary, aiReport.ownerConclusion],
    });
    drawTextBox(doc, fonts, {
      title: "KI-Einordnung",
      tone: "sage",
      body: [aiReport.mainDiagnosis],
    });
    aiReport.topLevers.slice(0, 3).forEach((lever, index) => {
      drawTextBox(doc, fonts, {
        title: `${index + 1}. ${lever.title}`,
        tone: index === 0 ? "rose" : index === 1 ? "gold" : "mist",
        label: "KI-Hebel",
        body: [
          `Problem: ${lever.problem}`,
          `Wirkung: ${lever.businessImpact}`,
          `Umsetzung: ${lever.recommendation}`,
          `Erster Schritt: ${lever.firstStep}`,
        ],
      });
    });
  } else {
    drawTextBox(doc, fonts, {
      title: "Management-Zusammenfassung",
      tone: "ink",
      body: [
        textValue(summary.firstFocus, "Starte mit dem Hebel, der Klarheit, Vertrauen und den nächsten Schritt am schnellsten verbessert."),
        textValue(report.conversionHypothesis, "Wenn Klarheit, Vertrauen und der nächste Schritt sichtbarer werden, sinkt Reibung im sichtbaren Startbereich."),
        `Schnellster Hebel: ${textValue(summary.fastestWin, "Wichtigste Maßnahme zuerst umsetzen.")}`,
      ],
    });
  }

  if (hasCustomerFacingConsultantNotes(consultantNotes)) {
    customerConsultantSections.forEach((section) => drawTextBox(doc, fonts, section));
  }

  if (opportunityRoadmapItems.length > 0) {
    drawTextBox(doc, fonts, {
      title: textValue(opportunityRoadmap?.title, "Priorisierter Maßnahmenplan"),
      label: REPORT_LABELS.plan,
      tone: "mist",
      body: [textValue(opportunityRoadmap?.summary, "Die wichtigsten Potenziale werden nach Wirkung und Umsetzbarkeit priorisiert.")],
    });
    opportunityRoadmapItems.forEach((item, index) => {
      drawTextBox(doc, fonts, {
        title: `${index + 1}. ${textValue(item.title, "Potenzial")}`,
        tone: index === 0 ? "sage" : index <= 2 ? "gold" : "mist",
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

  drawSectionTitle(doc, fonts, REPORT_LABELS.sevenDayPlan, "Umsetzung");
  if (aiReport?.sevenDayPlan.length) {
    aiReport.sevenDayPlan.forEach((step, index) => {
      drawTextBox(doc, fonts, {
        title: `${step.day}: ${step.focus}`,
        tone: index === 0 ? "sage" : "mist",
        label: timelineLabel(index),
        body: step.tasks,
      });
    });
  } else if (quickImplementationPlan.length > 0) {
    quickImplementationPlan.forEach((step, index) => {
      drawTextBox(doc, fonts, {
        title: `${textValue(step.days, "Zeitraum")}: ${textValue(step.focus, "Fokus")}`,
        tone: index === 0 ? "sage" : "mist",
        label: timelineLabel(index),
        body: stringList(step.actions).length > 0
          ? stringList(step.actions)
          : ["Die wichtigsten nächsten Schritte werden aus den priorisierten Maßnahmen abgeleitet."],
      });
    });
  } else {
    drawTextBox(doc, fonts, {
      title: "Kein 7-Tage-Fahrplan gespeichert",
      tone: "mist",
      body: ["Der Bericht enthält aktuell keinen separaten Umsetzungsfahrplan."],
    });
  }

  drawSectionTitle(doc, fonts, "Detailanhang", "Priorisierte Maßnahmen und visuelle Notizen");
  if (priorityRoadmap.length > 0) {
    priorityRoadmap.forEach((item, index) => {
      drawTextBox(doc, fonts, {
        title: `Maßnahme ${index + 1}`,
        tone: index === 0 ? "sage" : index <= 2 ? "gold" : "mist",
        label: index === 0 ? "Sofort" : index <= 2 ? "Diese Woche" : "Später",
        minHeight: 58,
        body: [item],
      });
    });
  } else {
    drawTextBox(doc, fonts, {
      title: "Keine priorisierten Maßnahmen gespeichert",
      tone: "mist",
      body: ["Der Export bleibt stabil; priorisierte Maßnahmen können später aus dem Bericht ergänzt werden."],
    });
  }

  const remainingVisualNotes = visualAuditNotes.slice(4);
  if (remainingVisualNotes.length > 0) {
    remainingVisualNotes.forEach((note) => {
      drawTextBox(doc, fonts, {
        title: textValue(note.area, "Visueller Befund"),
        tone: "mist",
        minHeight: 62,
        body: [textValue(note.note)],
      });
    });
  }

  const footerPageStats = addFooters(doc, fonts);
  doc.end();

  return { pdf: await completed, footerPageStats };
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
