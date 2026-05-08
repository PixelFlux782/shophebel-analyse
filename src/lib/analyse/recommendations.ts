import { Finding, Recommendation } from "@/types/analysis";
import { getRecommendationWeight } from "@/lib/result-ui";

type RecommendationDraft = Omit<Recommendation, "text"> & { text?: string };

interface RecommendationRule {
  matches: (finding: Finding) => boolean;
  create: (finding: Finding) => RecommendationDraft;
}

const recommendationRules: RecommendationRule[] = [
  {
    matches: (finding) =>
      finding.title === "Google und KI bekommen keine klare Kurzbeschreibung" ||
      finding.title === "Meta Description fehlt",
    create: () => ({
      title: "Klare Kurzbeschreibung fuer Google und KI ergaenzen",
      description:
        "Formuliere in einem kurzen Text, was du anbietest, fuer wen es ist und warum jemand klicken oder Kontakt aufnehmen sollte.",
      impact: "high",
      effort: "low",
      category: "seo",
      weight: 0,
    }),
  },
  {
    matches: (finding) =>
      finding.title === "Ein Impressum ist nicht klar auffindbar" ||
      finding.title === "Impressum fehlt",
    create: () => ({
      title: "Impressum sichtbar verlinken",
      description: "Ergaenze einen klaren Impressums-Link im Footer oder Header, damit rechtliche Transparenz sofort erkennbar ist.",
      impact: "high",
      effort: "low",
      category: "trust",
      weight: 0,
    }),
  },
  {
    matches: (finding) =>
      finding.title === "Datenschutz ist nicht klar auffindbar" ||
      finding.title === "Datenschutz fehlt",
    create: () => ({
      title: "Datenschutzseite auffindbar machen",
      description: "Verlinke eine klare Datenschutzseite direkt von der Startseite oder dem Footer aus.",
      impact: "high",
      effort: "low",
      category: "trust",
      weight: 0,
    }),
  },
  {
    matches: (finding) =>
      finding.title === "Keine klaren CTA-Woerter gefunden" ||
      finding.title === "Keine CTA-Buttons oder CTA-Links gefunden",
    create: () => ({
      title: "Klare Handlungsaufforderungen einbauen",
      description: "Platziere gut sichtbare Buttons oder Links mit klaren CTA-Texten wie Jetzt starten, Angebot anfragen oder Kostenlos testen.",
      impact: "high",
      effort: "medium",
      category: "conversion",
      weight: 0,
    }),
  },
  {
    matches: (finding) =>
      finding.title === "Bilder erklaeren sich nicht gut genug" ||
      finding.title === "Bilder ohne Alt-Text",
    create: () => ({
      title: "Wichtige Bilder verstaendlich beschreiben",
      description:
        "Beschreibe relevante Bilder kurz und konkret, damit Besucher mit Hilfssystemen, Google und KI den Bildinhalt besser verstehen.",
      impact: "medium",
      effort: "medium",
      category: "seo",
      weight: 0,
    }),
  },
  {
    matches: (finding) => finding.title === "Social Proof fehlt",
    create: () => ({
      title: "Bewertungen oder Kundenstimmen sichtbar machen",
      description: "Ergaenze auf der Startseite echte Kundenstimmen, Bewertungen oder Referenzen als Social Proof.",
      impact: "high",
      effort: "medium",
      category: "conversion",
      weight: 0,
    }),
  },
  {
    matches: (finding) =>
      finding.title === "Zu wenig Vertrauen vor dem Kauf oder der Anfrage" ||
      finding.title === "Kaum Trust-Signale erkennbar",
    create: () => ({
      title: "Vertrauen vor Kauf oder Anfrage sichtbarer machen",
      description: "Hebe Versand, Rueckgabe, sichere Zahlung, Kundenservice oder Bewertungen frueher und klarer hervor.",
      impact: "high",
      effort: "medium",
      category: "trust",
      weight: 0,
    }),
  },
  {
    matches: (finding) => finding.title === "Sehr wenig Content auf der Startseite",
    create: () => ({
      title: "Startseite inhaltlich ausbauen",
      description: "Ergaenze mehr Nutzenargumente, Struktur und orientierende Inhalte, damit die Seite nicht zu duenn wirkt.",
      impact: "high",
      effort: "medium",
      category: "ux",
      weight: 0,
    }),
  },
  {
    matches: (finding) =>
      finding.title === "Wenig visuelle Struktur durch Headings" ||
      finding.title === "Visuelle Struktur ist ausbaufaehig",
    create: () => ({
      title: "Inhalte klarer strukturieren",
      description: "Arbeite mit klaren Ueberschriften, Abschnitten und visuellen Elementen, damit Besucher schneller Orientierung finden.",
      impact: "medium",
      effort: "medium",
      category: "ux",
      weight: 0,
    }),
  },
];

function createFallbackRecommendation(finding: Finding): RecommendationDraft {
  const recommendation: RecommendationDraft = {
    title: `${finding.title} verbessern`,
    description: finding.description,
    impact: finding.priority,
    effort: finding.status === "error" ? "medium" : "low",
    category: finding.category,
    weight: 0,
  };

  const normalizedRecommendation: Recommendation = {
    ...recommendation,
    text: recommendation.description,
    weight: recommendation.weight,
  };

  return {
    ...normalizedRecommendation,
    weight: getRecommendationWeight(normalizedRecommendation),
  };
}

export function buildRecommendations(findings: Finding[]): Recommendation[] {
  const actionableFindings = findings.filter((finding) => finding.status !== "success");
  const recommendations = actionableFindings.map((finding) => {
    const rule = recommendationRules.find((entry) => entry.matches(finding));
    const recommendation = rule ? rule.create(finding) : createFallbackRecommendation(finding);

    const normalizedBase: Recommendation = {
      ...recommendation,
      text: recommendation.text ?? recommendation.description,
      weight: recommendation.weight,
    };
    const normalizedRecommendation: Recommendation = {
      ...normalizedBase,
      weight: getRecommendationWeight(normalizedBase),
    };

    return normalizedRecommendation;
  });

  return recommendations.filter(
    (recommendation, index, list) =>
      list.findIndex((entry) => entry.title === recommendation.title) === index,
  );
}
