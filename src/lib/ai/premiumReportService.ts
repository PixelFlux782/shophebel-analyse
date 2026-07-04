import { buildPremiumReportPrompt } from "@/lib/ai/promptBuilder";
import type { PremiumReportInput } from "@/lib/ai/premiumReportInput";
import { mockPremiumReportProvider } from "@/lib/ai/mockPremiumReportProvider";
import type {
  PremiumReportProvider,
  PremiumReportProviderResult,
  PremiumReportUsage,
} from "@/lib/ai/premiumReportProvider";
import { premiumAiReportSchema, type PremiumAiReport } from "@/lib/ai/premiumAiReport.schema";
import { normalizeGermanReportText, validateReportCopyQuality } from "@/lib/report/reportCopy";

export class PremiumAiReportValidationError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "PremiumAiReportValidationError";
  }
}

function stripJsonFence(raw: string): string {
  const trimmed = raw.trim();
  const fencedJson = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);

  return fencedJson?.[1]?.trim() ?? trimmed;
}

function extractJsonObject(raw: string): string {
  const unfenced = stripJsonFence(raw);
  const firstBrace = unfenced.indexOf("{");
  const lastBrace = unfenced.lastIndexOf("}");

  if (firstBrace < 0 || lastBrace < firstBrace) {
    return unfenced;
  }

  return unfenced.slice(firstBrace, lastBrace + 1);
}

function normalizeStringList(values: string[]) {
  return values.map((value) => normalizeGermanReportText(value)).filter(Boolean);
}

type SevenDayPlanDay = "Tag 1-2" | "Tag 3-5" | "Tag 6-7";

function normalizeSevenDayPlanDay(day: string, index: number): SevenDayPlanDay {
  const normalized = normalizeGermanReportText(day);

  if (normalized === "Tag 1-2" || normalized === "Tag 3-5" || normalized === "Tag 6-7") {
    return normalized;
  }

  const fallbackDays: SevenDayPlanDay[] = ["Tag 1-2", "Tag 3-5", "Tag 6-7"];
  return fallbackDays[index] ?? "Tag 1-2";
}

function collectReportText(value: unknown, output: string[] = []): string[] {
  if (typeof value === "string") {
    output.push(value);
    return output;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectReportText(item, output));
    return output;
  }

  if (value && typeof value === "object") {
    Object.values(value).forEach((item) => collectReportText(item, output));
  }

  return output;
}

export function normalizePremiumAiReportCopy(report: PremiumAiReport): PremiumAiReport {
  return {
    executiveSummary: normalizeGermanReportText(report.executiveSummary),
    mainDiagnosis: normalizeGermanReportText(report.mainDiagnosis),
    topLevers: report.topLevers.slice(0, 3).map((issue) => ({
      title: normalizeGermanReportText(issue.title),
      whyItMatters: normalizeGermanReportText(issue.whyItMatters),
      shopObservation: normalizeGermanReportText(issue.shopObservation),
      improvement: normalizeGermanReportText(issue.improvement),
      firstStep: normalizeGermanReportText(issue.firstStep),
      difficulty: issue.difficulty,
      expectedEffect: normalizeGermanReportText(issue.expectedEffect),
    })),
    sevenDayPlan: report.sevenDayPlan.map((step, index) => ({
      day: normalizeSevenDayPlanDay(step.day, index),
      focus: normalizeGermanReportText(step.focus),
      tasks: normalizeStringList(step.tasks).slice(0, 4),
    })),
    ownerConclusion: normalizeGermanReportText(report.ownerConclusion),
  };
}

function firstText(values: Array<string | undefined>, fallback: string) {
  return values.find((value) => typeof value === "string" && value.trim())?.trim() ?? fallback;
}

function normalizeDifficulty(value: string | undefined, fallback: "leicht" | "mittel" | "anspruchsvoll") {
  const normalized = value?.toLowerCase().trim();

  if (normalized === "hoch" || normalized === "high" || normalized === "anspruchsvoll") {
    return "anspruchsvoll";
  }

  if (normalized === "mittel" || normalized === "medium") {
    return "mittel";
  }

  if (normalized === "niedrig" || normalized === "low" || normalized === "leicht") {
    return "leicht";
  }

  return fallback;
}

function fallbackLever(input: PremiumReportInput, index: number): PremiumAiReport["topLevers"][number] {
  const blocker = input.revenueBlockers[index];
  const measure = input.measures[index] ?? input.measures[0];
  const opportunity = input.opportunities[index] ?? input.opportunities[0];

  if (blocker) {
    return {
      title: blocker.title,
      whyItMatters: blocker.impact
        ? `${blocker.description || blocker.title} Die Analyse bewertet die Wirkung als ${blocker.impact}.`
        : blocker.description || blocker.title,
      shopObservation: blocker.description || blocker.title,
      improvement: blocker.action || measure?.description || "Diesen Punkt zuerst sichtbar und verstaendlich ueberarbeiten.",
      firstStep: measure?.title
        ? `${measure.title}: ${measure.description}`
        : blocker.action || "Den betroffenen Abschnitt pruefen und die naechste Handlung klarer formulieren.",
      difficulty: normalizeDifficulty(blocker.effort, "mittel"),
      expectedEffect: "Qualitativ: mehr Orientierung und weniger Unsicherheit vor der Entscheidung.",
    };
  }

  if (opportunity) {
    return {
      title: opportunity.title,
      whyItMatters: opportunity.expectedEffect || opportunity.impact || "Dieser Punkt kann Entscheidungen unnoetig bremsen.",
      shopObservation: opportunity.description,
      improvement: opportunity.description,
      firstStep: opportunity.title,
      difficulty: normalizeDifficulty(opportunity.effort, "mittel"),
      expectedEffect: opportunity.expectedEffect || "Qualitativ: Besucher verstehen schneller, warum der naechste Schritt sinnvoll ist.",
    };
  }

  return {
    title: index === 0 ? "Klarheit im Startbereich" : index === 1 ? "Vertrauen frueher sichtbar machen" : "Naechsten Schritt vereinfachen",
    whyItMatters:
      index === 0
        ? "Besucher muessen sehr schnell verstehen, ob das Angebot zu ihrem Bedarf passt."
        : index === 1
          ? "Ohne fruehe Vertrauenssignale entsteht vor Anfrage oder Kauf unnoetige Unsicherheit."
          : "Wenn die wichtigste Handlung nicht eindeutig ist, gehen Besucher leichter verloren.",
    shopObservation:
      index === 0
        ? "Der erste Eindruck braucht eine klarere Reihenfolge aus Nutzen, Beleg und Handlung."
        : index === 1
          ? "Vertrauen wirkt erst stark, wenn es nahe an kauf- oder anfragenahen Bereichen steht."
          : "Die wichtigste Handlung sollte weniger mit Nebenwegen konkurrieren.",
    improvement:
      index === 0
        ? "Nutzen, Zielgruppe und Hauptaktion im ersten sichtbaren Bereich einfacher formulieren."
        : index === 1
          ? "Bewertungen, Kontakt, Garantien oder Referenzen naeher an kaufnahe Bereiche bringen."
          : "Den wichtigsten Button sprachlich konkreter machen und optisch priorisieren.",
    firstStep:
      index === 0
        ? "Eine Headline schreiben, die Angebot, Nutzen und Zielgruppe in einem Satz verbindet."
        : index === 1
          ? "Zwei vorhandene Vertrauensbelege auswaehlen und direkt unter dem Hauptangebot platzieren."
          : "Alle Hauptbuttons pruefen und auf eine eindeutige Handlungsaufforderung reduzieren.",
    difficulty: index === 0 ? "leicht" : "mittel",
    expectedEffect: "Qualitativ: Besucher koennen die Seite schneller einordnen und kommen leichter zur naechsten Handlung.",
  };
}

export function buildFallbackPremiumAiReport(input: PremiumReportInput): PremiumAiReport {
  const weakestScore = [...input.scores].sort((left, right) => left.score - right.score)[0];
  const mainProblem = firstText(
    [input.revenueBlockers[0]?.title, input.criticalSignals[0]?.title, weakestScore?.summary],
    "Die Seite braucht eine klarere Priorisierung im sichtbaren Startbereich.",
  );
  const firstStep = firstText(
    [input.revenueBlockers[0]?.action, input.measures[0]?.description],
    "Starte mit einer klareren Botschaft und einem eindeutigeren naechsten Schritt.",
  );

  return normalizePremiumAiReportCopy({
    executiveSummary:
      "Die Analyse zeigt einen Shop mit nutzbarer Grundlage und klaren Ansatzpunkten. Gut ist: Es gibt bereits verwertbare Signale fuer Angebot, Orientierung und naechste Handlung. Gebremst wird die Seite dort, wo Besucher Nutzen, Vertrauen und Entscheidung noch nicht schnell genug zusammenbringen. Am wichtigsten ist jetzt, den ersten Eindruck, die kaufnahen Belege und den naechsten Schritt in eine klare Reihenfolge zu bringen.",
    mainDiagnosis: `Das eigentliche Problem ist nicht ein einzelnes Detail, sondern die Priorisierung der Entscheidungshilfe. ${mainProblem} Besucher muessen dadurch mehr selbst zusammensetzen, bevor sie handeln. Der wichtigste erste Schritt ist: ${firstStep}`,
    topLevers: [fallbackLever(input, 0), fallbackLever(input, 1), fallbackLever(input, 2)],
    sevenDayPlan: [
      {
        day: "Tag 1-2",
        focus: "Klarheit schaffen: Texte und wichtigste Handlung",
        tasks: [
          firstStep,
          "Hauptbutton, Startbereich und wichtigste Vertrauenssignale gemeinsam pruefen.",
        ],
      },
      {
        day: "Tag 3-5",
        focus: "Umsetzung an Startseite, Produktseite, Vertrauen und Navigation",
        tasks: [
          "Die drei priorisierten Hebel nacheinander umsetzen.",
          "Texte kuerzen, Kauf- oder Anfrageweg vereinfachen und sichtbare Belege ergaenzen.",
        ],
      },
      {
        day: "Tag 6-7",
        focus: "Kontrolle, Vergleich und naechste Optimierung",
        tasks: [
          "Die Seite auf Desktop und Mobil erneut pruefen.",
          "Kontrollieren, ob Nutzen, Vertrauen und naechster Schritt ohne Erklaerung erkennbar sind.",
        ],
      },
    ],
    ownerConclusion:
      "Der sinnvollste Weg ist kein grosser Umbau, sondern eine klare Reihenfolge: erst Orientierung, dann Vertrauen, dann der naechste Schritt. So wird aus der Analyse ein umsetzbarer Wochenplan.",
  });
}

export function parsePremiumAiReportResponse(raw: string): PremiumAiReport {
  let parsed: unknown;

  try {
    parsed = JSON.parse(extractJsonObject(raw));
  } catch (error) {
    throw new PremiumAiReportValidationError("Premium AI report response is not valid JSON.", { cause: error });
  }

  const result = premiumAiReportSchema.safeParse(parsed);

  if (!result.success) {
    const details = result.error.issues.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`).join("; ");
    throw new PremiumAiReportValidationError(`Premium AI report response failed validation: ${details}`, {
      cause: result.error,
    });
  }

  const normalizedReport = normalizePremiumAiReportCopy(result.data);
  const quality = validateReportCopyQuality(collectReportText(normalizedReport).join(" "));

  if (!quality.isValid) {
    throw new PremiumAiReportValidationError(
      `Premium AI report response failed copy-quality validation: ${[
        ...quality.forbiddenTerms,
        ...quality.mojibakeMatches,
      ].join("; ")}`,
    );
  }

  return normalizedReport;
}

function unwrapProviderResult(result: string | PremiumReportProviderResult): PremiumReportProviderResult {
  return typeof result === "string" ? { content: result, usage: null } : result;
}

export async function generatePremiumAiReportWithUsage(
  input: PremiumReportInput,
  provider: PremiumReportProvider = mockPremiumReportProvider,
): Promise<{ report: PremiumAiReport; usage?: PremiumReportUsage | null }> {
  const prompt = buildPremiumReportPrompt(input);
  const providerResult = unwrapProviderResult(await provider.generate(prompt.messages));

  return {
    report: parsePremiumAiReportResponse(providerResult.content),
    usage: providerResult.usage ?? null,
  };
}

export async function generatePremiumAiReport(
  input: PremiumReportInput,
  provider: PremiumReportProvider = mockPremiumReportProvider,
): Promise<PremiumAiReport> {
  const result = await generatePremiumAiReportWithUsage(input, provider);

  return result.report;
}
