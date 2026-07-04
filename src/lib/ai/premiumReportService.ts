import { buildPremiumReportPrompt } from "@/lib/ai/promptBuilder";
import type { PremiumReportInput } from "@/lib/ai/premiumReportInput";
import { mockPremiumReportProvider } from "@/lib/ai/mockPremiumReportProvider";
import type { PremiumReportProvider } from "@/lib/ai/premiumReportProvider";
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
      problem: normalizeGermanReportText(issue.problem),
      businessImpact: normalizeGermanReportText(issue.businessImpact),
      recommendation: normalizeGermanReportText(issue.recommendation),
      firstStep: normalizeGermanReportText(issue.firstStep),
    })),
    sevenDayPlan: report.sevenDayPlan.map((step) => ({
      day: normalizeGermanReportText(step.day),
      focus: normalizeGermanReportText(step.focus),
      tasks: normalizeStringList(step.tasks).slice(0, 4),
    })),
    ownerConclusion: normalizeGermanReportText(report.ownerConclusion),
  };
}

function firstText(values: Array<string | undefined>, fallback: string) {
  return values.find((value) => typeof value === "string" && value.trim())?.trim() ?? fallback;
}

function fallbackLever(input: PremiumReportInput, index: number) {
  const blocker = input.revenueBlockers[index];
  const measure = input.measures[index] ?? input.measures[0];
  const opportunity = input.opportunities[index] ?? input.opportunities[0];

  if (blocker) {
    return {
      title: blocker.title,
      problem: blocker.description || blocker.title,
      businessImpact: blocker.impact
        ? `${blocker.description} Die Analyse bewertet die Wirkung als ${blocker.impact}.`
        : blocker.description,
      recommendation: blocker.action || measure?.description || "Diesen Punkt zuerst sichtbar und verständlich überarbeiten.",
      firstStep: measure?.title
        ? `${measure.title}: ${measure.description}`
        : blocker.action || "Den betroffenen Abschnitt prüfen und die nächste Handlung klarer formulieren.",
    };
  }

  if (opportunity) {
    return {
      title: opportunity.title,
      problem: opportunity.description,
      businessImpact: opportunity.expectedEffect || opportunity.impact || "Dieser Punkt kann Entscheidungen unnötig bremsen.",
      recommendation: opportunity.description,
      firstStep: opportunity.title,
    };
  }

  return {
    title: index === 0 ? "Klarheit im Startbereich" : index === 1 ? "Vertrauen früher sichtbar machen" : "Nächsten Schritt vereinfachen",
    problem:
      index === 0
        ? "Besucher müssen sehr schnell verstehen, ob das Angebot zu ihrem Bedarf passt."
        : index === 1
          ? "Ohne frühe Vertrauenssignale entsteht vor Anfrage oder Kauf unnötige Unsicherheit."
          : "Wenn die wichtigste Handlung nicht eindeutig ist, gehen Besucher leichter verloren.",
    businessImpact:
      index === 0
        ? "Unklare Orientierung kann dazu führen, dass vorhandener Traffic weniger Anfragen oder Käufe auslöst."
        : index === 1
          ? "Mehr Sicherheit vor der Entscheidung kann Reibung reduzieren, ohne einen Relaunch zu brauchen."
          : "Ein klarerer nächster Schritt senkt die Denkarbeit genau vor der Entscheidung.",
    recommendation:
      index === 0
        ? "Nutzen, Zielgruppe und Hauptaktion im ersten sichtbaren Bereich einfacher formulieren."
        : index === 1
          ? "Bewertungen, Kontakt, Garantien oder Referenzen näher an kaufnahe Bereiche bringen."
          : "Den wichtigsten Button sprachlich konkreter machen und optisch priorisieren.",
    firstStep:
      index === 0
        ? "Eine Headline schreiben, die Angebot, Nutzen und Zielgruppe in einem Satz verbindet."
        : index === 1
          ? "Zwei vorhandene Vertrauensbelege auswählen und direkt unter dem Hauptangebot platzieren."
          : "Alle Hauptbuttons prüfen und auf eine eindeutige Handlungsaufforderung reduzieren.",
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
    "Starte mit einer klareren Botschaft und einem eindeutigeren nächsten Schritt.",
  );

  return normalizePremiumAiReportCopy({
    executiveSummary: `Die Analyse zeigt einen Shop mit nutzbarer Grundlage, aber auch klaren Reibungspunkten. Am wichtigsten ist jetzt, den ersten Eindruck, Vertrauen und den nächsten Schritt so zu ordnen, dass Besucher schneller entscheiden können.`,
    mainDiagnosis: `${mainProblem} Das kann Umsatz kosten, weil Besucher bei Unsicherheit eher vergleichen, zögern oder abbrechen. Der wichtigste erste Schritt ist: ${firstStep}`,
    topLevers: [fallbackLever(input, 0), fallbackLever(input, 1), fallbackLever(input, 2)],
    sevenDayPlan: [
      {
        day: "Tag 1-2",
        focus: "Sofortmaßnahmen",
        tasks: [
          firstStep,
          "Hauptbutton, Startbereich und wichtigste Vertrauenssignale gemeinsam prüfen.",
        ],
      },
      {
        day: "Tag 3-5",
        focus: "Umsetzung",
        tasks: [
          "Die drei priorisierten Hebel nacheinander umsetzen.",
          "Texte kürzen, Kauf- oder Anfrageweg vereinfachen und sichtbare Belege ergänzen.",
        ],
      },
      {
        day: "Tag 6-7",
        focus: "Kontrolle und Optimierung",
        tasks: [
          "Die Seite auf Desktop und Mobil erneut prüfen.",
          "Kontrollieren, ob Nutzen, Vertrauen und nächster Schritt ohne Erklärung erkennbar sind.",
        ],
      },
    ],
    ownerConclusion:
      "Der sinnvollste Weg ist kein großer Umbau, sondern eine klare Reihenfolge: erst Orientierung, dann Vertrauen, dann der nächste Schritt. So wird aus der Analyse ein umsetzbarer Wochenplan.",
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

export async function generatePremiumAiReport(
  input: PremiumReportInput,
  provider: PremiumReportProvider = mockPremiumReportProvider,
): Promise<PremiumAiReport> {
  const prompt = buildPremiumReportPrompt(input);
  const rawReport = await provider.generate(prompt.messages);

  return parsePremiumAiReportResponse(rawReport);
}
