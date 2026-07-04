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
  fallbackObservation: string,
  fallbackImprovement: string,
  fallbackFirstStep: string,
  difficulty: "leicht" | "mittel" | "anspruchsvoll",
) {
  return {
    title: fallbackText(blocker?.title, fallbackTitle),
    whyItMatters: fallbackText(
      blocker?.description,
      "Dieser Punkt ist wichtig, weil Besucher vor einer Anfrage oder einem Kauf schnell Sicherheit brauchen.",
    ),
    shopObservation: fallbackText(blocker?.description, fallbackObservation),
    improvement: fallbackText(blocker?.action, fallbackImprovement),
    firstStep: fallbackText(blocker?.action, fallbackFirstStep),
    difficulty,
    expectedEffect: "Qualitativ: weniger Unsicherheit, klarere Orientierung und ein leichterer Weg zur nächsten Handlung.",
  };
}

function estimateMockUsage(messages: PremiumPromptMessage[], content: string) {
  const promptChars = messages.reduce((sum, message) => sum + message.content.length, 0);
  const completionChars = content.length;
  const promptTokens = Math.ceil(promptChars / 4);
  const completionTokens = Math.ceil(completionChars / 4);

  return {
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    estimatedCost: 0,
    isEstimated: true,
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

    const content = JSON.stringify({
      executiveSummary: `Die Analyse zeigt für ${url} einen Score von ${overallScore}/100: Der Shop hat eine brauchbare Grundlage, aber der erste Eindruck arbeitet noch nicht hart genug für die Entscheidung. Positiv ist, dass Angebot, Handlung und Vertrauen bereits erkennbare Anknüpfungspunkte haben. Gebremst wird der Shop vor allem, weil Besucher Nutzen, Sicherheit und nächsten Schritt noch zu stark selbst zusammensetzen müssen. Die nächsten sieben Tage sollten deshalb nicht in einen Komplettumbau gehen, sondern in eine klare Reihenfolge: erst Nutzen verstehen, dann Vertrauen spüren, dann eindeutig handeln.`,
      mainDiagnosis:
        "Das eigentliche Problem ist nicht, dass dem Shop einzelne Optimierungen fehlen, sondern dass die Entscheidungshilfe noch zu verteilt wirkt. Besucher bekommen vermutlich mehrere richtige Signale, aber nicht in der Reihenfolge, in der sie innerlich entscheiden: Was ist das Angebot, warum ist es glaubwürdig, was soll ich jetzt tun? Der erste Beratungshebel ist deshalb eine klarere Dramaturgie im sichtbaren und kaufnahen Bereich.",
      topLevers: [
        buildLever(
          firstBlocker,
          "Nächsten Schritt im Startbereich eindeutiger machen",
          "Im ersten Sichtbereich ist die empfohlene Handlung noch nicht stark genug geführt.",
          "Startbereich und wichtigsten Button so formulieren, dass Angebot, Nutzen und Handlung zusammen lesbar werden.",
          "Headline, Kurztext und Hauptbutton nebeneinander legen und alles streichen, was nicht direkt zur nächsten Entscheidung führt.",
          "leicht",
        ),
        buildLever(
          secondBlocker,
          "Vertrauen vor der Entscheidung sichtbar machen",
          "Vertrauenssignale wirken erst dann, wenn sie nahe an Angebot, Preis, Produkt oder Anfrageweg stehen.",
          "Vorhandene Belege wie Bewertungen, Servicehinweise, Kontakt oder Referenzen in die kaufnahe Zone rücken.",
          "Zwei vorhandene Vertrauensbelege auswählen und direkt an der Stelle platzieren, an der Besucher zögern könnten.",
          "mittel",
        ),
        buildLever(
          thirdBlocker,
          "Anfrage- oder Kaufweg ruhiger führen",
          "Mehrere gleich laute Signale können die Entscheidung unnötig anstrengend machen.",
          "Die wichtigste Handlung priorisieren und konkurrierende Elemente im Startbereich zurücknehmen.",
          "Alle sichtbaren Handlungsaufforderungen notieren und eine davon als klare Hauptaktion festlegen.",
          "mittel",
        ),
      ],
      sevenDayPlan: [
        {
          day: "Tag 1-2",
          focus: "Klarheit schaffen: Texte und wichtigste Handlung",
          tasks: [
            fallbackText(
              firstMeasure?.description,
              "Headline, kurzer Erklärungstext und Hauptbutton so gegenlesen, dass ein Erstbesucher Angebot, Nutzen und nächsten Schritt ohne Vorwissen versteht.",
            ),
            "Den wichtigsten Button auf eine konkrete Handlung zuspitzen und Nebenhandlungen sichtbar niedriger priorisieren.",
          ],
        },
        {
          day: "Tag 3-5",
          focus: "Umsetzung an Startseite, Produktseite, Vertrauen und Navigation",
          tasks: [
            "Startbereich und kaufnahe Produkt- oder Angebotsbereiche mit den drei priorisierten Hebeln überarbeiten.",
            "Vertrauensbelege näher an die Entscheidung rücken und die Navigation auf den wichtigsten Weg ausrichten.",
            "Mobile Ansicht prüfen: erst Nutzen, dann Beleg, dann Handlung.",
          ],
        },
        {
          day: "Tag 6-7",
          focus: "Kontrolle, Vergleich und nächste Optimierung",
          tasks: [
            "Vorher-Nachher-Vergleich auf Desktop und Mobil machen: Was versteht man in den ersten Sekunden besser?",
            "Eine nächste Variante für Headline, Button oder Vertrauensblock vorbereiten, ohne neue Zahlen zu versprechen.",
          ],
        },
      ],
      ownerConclusion:
        "Der Shop braucht keinen blinden Komplettumbau, sondern eine ruhigere und deutlichere Entscheidungsführung. Wenn du diese Woche nur drei Dinge angehst, dann bitte diese: Startbereich schärfen, Vertrauen näher an die Entscheidung bringen und den wichtigsten Weg konsequent führen. Das ist kein Ergebnisversprechen, aber die sauberste Reihenfolge, um aus der Analyse konkrete Verbesserung zu machen.",
    });

    return {
      content,
      usage: estimateMockUsage(messages, content),
    };
  },
};
