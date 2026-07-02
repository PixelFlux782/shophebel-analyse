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
    impact?: string;
    effort?: string;
    evidence?: string[];
  }>;
  measures?: Array<{
    title?: string;
    description?: string;
  }>;
  detectedPageSignals?: {
    heroText?: string[];
    ctaTexts?: string[];
    trustSignals?: string[];
  };
};

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

function normalizeLevel(value: string | undefined): "low" | "medium" | "high" {
  if (!value) {
    return "medium";
  }

  const normalized = value.toLowerCase();

  if (normalized.includes("hoch") || normalized.includes("high")) {
    return "high";
  }

  if (normalized.includes("niedrig") || normalized.includes("low")) {
    return "low";
  }

  return "medium";
}

function fallbackText(value: string | undefined, fallback: string) {
  return value && value.trim() ? value : fallback;
}

export const mockPremiumReportProvider: PremiumReportProvider = {
  async generate(messages) {
    const payload = extractPromptPayload(messages);
    const firstBlocker = payload.revenueBlockers?.[0];
    const secondBlocker = payload.revenueBlockers?.[1];
    const firstMeasure = payload.measures?.[0];
    const overallScore = payload.analysis?.overallScore ?? 0;
    const url = payload.analysis?.url ?? "die analysierte Seite";

    return JSON.stringify({
      executiveSummary: `Die Analyse zeigt fuer ${url} klare Ansatzpunkte, um Orientierung, Vertrauen und Kaufbereitschaft zu verbessern.`,
      mainDiagnosis: "Die Seite braucht vor allem klarere Priorisierung: Besucher sollen schneller verstehen, warum sie bleiben und was sie als Naechstes tun sollen.",
      scoreExplanation: `Der Gesamtscore von ${overallScore} zeigt, dass bereits Grundlagen vorhanden sind, aber zentrale Conversion- und Vertrauenselemente noch nicht stark genug arbeiten.`,
      topIssues: [
        {
          title: fallbackText(firstBlocker?.title, "Unklarer naechster Schritt"),
          whyItMatters: fallbackText(
            firstBlocker?.description,
            "Wenn der naechste Schritt nicht sofort erkennbar ist, verlieren Besucher leichter die Orientierung.",
          ),
          evidence: firstBlocker?.evidence?.length
            ? firstBlocker.evidence
            : ["Die Empfehlung basiert auf den strukturierten Shophebel-Analyse-Fakten."],
          recommendedAction: fallbackText(
            firstBlocker?.action,
            "Hero-Botschaft und primaeren Call to Action im sichtbaren Bereich konkreter formulieren.",
          ),
          impact: normalizeLevel(firstBlocker?.impact),
          effort: normalizeLevel(firstBlocker?.effort),
        },
        {
          title: fallbackText(secondBlocker?.title, "Vertrauen frueher sichtbar machen"),
          whyItMatters: fallbackText(
            secondBlocker?.description,
            "Vertrauenssignale senken Unsicherheit, bevor Besucher eine Anfrage oder einen Kauf erwaegen.",
          ),
          evidence: secondBlocker?.evidence?.length
            ? secondBlocker.evidence
            : ["Die Analyse enthaelt Hinweise auf ausbaufaehige Trust-Elemente."],
          recommendedAction: fallbackText(
            secondBlocker?.action,
            "Bewertungen, Garantien, Kontaktoptionen oder Referenzen naeher an die kaufnahen Bereiche bringen.",
          ),
          impact: normalizeLevel(secondBlocker?.impact),
          effort: normalizeLevel(secondBlocker?.effort),
        },
      ],
      actionPlan: [
        {
          step: 1,
          title: fallbackText(firstMeasure?.title, "Hero und CTA schaerfen"),
          description: fallbackText(
            firstMeasure?.description,
            "Formuliere Nutzenversprechen und Hauptaktion so, dass sie ohne Vorwissen in wenigen Sekunden verstanden werden.",
          ),
          priority: "now",
        },
        {
          step: 2,
          title: "Trust-Elemente platzieren",
          description: "Ergaenze sichtbare Belege wie Bewertungen, Siegel, Referenzen oder klare Kontaktinformationen an entscheidenden Stellen.",
          priority: "next",
        },
        {
          step: 3,
          title: "Wirkung nachpruefen",
          description: "Pruefe nach der Umsetzung, ob CTA, Nutzenversprechen und Vertrauenselemente im ersten sichtbaren Bereich zusammenspielen.",
          priority: "later",
        },
      ],
      exampleImprovements: {
        heroTextIdeas: payload.detectedPageSignals?.heroText?.length
          ? payload.detectedPageSignals.heroText.map((text) => `${text} - jetzt mit klarem Kundennutzen`)
          : ["Mehr passende Kundenanfragen aus deinem Shop"],
        ctaIdeas: payload.detectedPageSignals?.ctaTexts?.length
          ? payload.detectedPageSignals.ctaTexts.map((text) => `${text} starten`)
          : ["Kostenlose Ersteinschaetzung anfragen", "Passende Loesung finden"],
        trustElementIdeas: payload.detectedPageSignals?.trustSignals?.length
          ? payload.detectedPageSignals.trustSignals
          : ["Kundenbewertungen im sichtbaren Bereich", "Klare Kontaktmoeglichkeit", "Sichere Zahlungs- und Versandhinweise"],
      },
      disclaimer:
        "Diese Premiumanalyse basiert ausschliesslich auf den bereitgestellten Shophebel-Analyse-Fakten und ist keine Garantie fuer Umsatzsteigerungen.",
    });
  },
};
