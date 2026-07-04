import type { PremiumPromptMessage } from "@/lib/ai/promptBuilder";
import type { PremiumReportProvider } from "@/lib/ai/premiumReportProvider";

type PromptPayload = {
  analysis?: {
    url?: string;
    overallScore?: number;
  };
  revenueBlockers?: Array<{
    title?: string;
    description?: string;
    action?: string;
  }>;
  measures?: Array<{
    title?: string;
    description?: string;
  }>;
};

type PromptRevenueBlocker = NonNullable<PromptPayload["revenueBlockers"]>[number];

function extractPromptPayload(messages: PremiumPromptMessage[]): PromptPayload {
  const userMessage = messages.find((message) => message.role === "user")?.content ?? "";
  const jsonStart = userMessage.indexOf("{");

  if (jsonStart < 0) {
    return {};
  }

  try {
    return JSON.parse(userMessage.slice(jsonStart)) as PromptPayload;
  } catch {
    return {};
  }
}

function fallbackText(value: string | undefined, fallback: string) {
  return value && value.trim() ? value : fallback;
}

function buildLever(
  blocker: PromptRevenueBlocker | undefined,
  fallbackTitle: string,
  fallbackProblem: string,
  fallbackRecommendation: string,
) {
  return {
    title: fallbackText(blocker?.title, fallbackTitle),
    problem: fallbackText(blocker?.description, fallbackProblem),
    businessImpact: fallbackText(
      blocker?.description,
      "Dieser Punkt kann Besucher genau vor Anfrage oder Kauf unsicher machen.",
    ),
    recommendation: fallbackText(blocker?.action, fallbackRecommendation),
    firstStep: fallbackText(
      blocker?.action,
      "Den betroffenen Abschnitt prüfen und eine konkrete Änderung direkt umsetzen.",
    ),
  };
}

export const mockPremiumReportProvider: PremiumReportProvider = {
  async generate(messages) {
    const payload = extractPromptPayload(messages);
    const firstBlocker = payload.revenueBlockers?.[0];
    const secondBlocker = payload.revenueBlockers?.[1];
    const thirdBlocker = payload.revenueBlockers?.[2];
    const firstMeasure = payload.measures?.[0];
    const overallScore = payload.analysis?.overallScore ?? 0;
    const url = payload.analysis?.url ?? "die analysierte Seite";

    return JSON.stringify({
      executiveSummary: `Die Analyse zeigt für ${url} einen Score von ${overallScore}/100 und klare Ansatzpunkte, um Orientierung, Vertrauen und Kaufbereitschaft zu verbessern.`,
      mainDiagnosis:
        "Das Hauptproblem ist fehlende Priorisierung im ersten Eindruck. Das kostet wahrscheinlich Umsatz, weil Besucher Nutzen, Sicherheit und nächsten Schritt nicht schnell genug zusammenbringen. Der wichtigste erste Schritt ist, die Hauptbotschaft und den primären Button gemeinsam zu schärfen.",
      topLevers: [
        buildLever(
          firstBlocker,
          "Nächster Schritt ist nicht klar genug",
          "Wenn der nächste Schritt nicht sofort erkennbar ist, verlieren Besucher leichter die Orientierung.",
          "Startbereich und primären Call to Action konkreter formulieren.",
        ),
        buildLever(
          secondBlocker,
          "Vertrauen früher sichtbar machen",
          "Vertrauenssignale senken Unsicherheit, bevor Besucher eine Anfrage oder einen Kauf erwägen.",
          "Bewertungen, Garantien, Kontaktoptionen oder Referenzen näher an kaufnahe Bereiche bringen.",
        ),
        buildLever(
          thirdBlocker,
          "Anfrageweg einfacher führen",
          "Wenn zu viele Signale gleichzeitig konkurrieren, wirkt die Entscheidung anstrengender als nötig.",
          "Die wichtigste Handlung priorisieren und ablenkende Elemente im Startbereich reduzieren.",
        ),
      ],
      sevenDayPlan: [
        {
          day: "Tag 1-2",
          focus: "Sofortmaßnahmen",
          tasks: [
            fallbackText(
              firstMeasure?.description,
              "Nutzenversprechen, Zielgruppe und Hauptaktion in einem sichtbaren Block klären.",
            ),
            "Wichtigsten Button auf eine konkrete Handlung zuspitzen.",
          ],
        },
        {
          day: "Tag 3-5",
          focus: "Umsetzung",
          tasks: [
            "Vertrauensbelege näher an den ersten Entscheidungsbereich rücken.",
            "Startbereich und mobile Ansicht auf klare Reihenfolge prüfen.",
          ],
        },
        {
          day: "Tag 6-7",
          focus: "Kontrolle und Optimierung",
          tasks: [
            "Nach der Umsetzung prüfen, ob Nutzen, Vertrauen und nächster Schritt ohne Vorwissen lesbar sind.",
            "Eine zweite Button- oder Headline-Variante für spätere Tests vorbereiten.",
          ],
        },
      ],
      ownerConclusion:
        "Der Bericht empfiehlt keinen großen Umbau, sondern eine klare Reihenfolge: erst Verstehen erleichtern, dann Vertrauen zeigen, dann den nächsten Schritt sichtbarer machen.",
    });
  },
};
