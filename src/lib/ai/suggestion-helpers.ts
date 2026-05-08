import { AiSuggestion, AnalysisCategory, Finding, PriorityLevel } from "@/types/analysis";

export const FREE_VISIBLE_AI_SUGGESTIONS_LIMIT = 3;

export function buildFindingKey(finding: Finding) {
  return `${finding.category}:${finding.title.trim().toLowerCase()}`;
}

export function getImpactWeight(impact: PriorityLevel) {
  const weights: Record<PriorityLevel, number> = {
    high: 0,
    medium: 1,
    low: 2,
  };

  return weights[impact];
}

export function sortSuggestions(suggestions: AiSuggestion[]) {
  return [...suggestions].sort((left, right) => {
    const impactDifference =
      getImpactWeight(left.expectedImpact) - getImpactWeight(right.expectedImpact);

    if (impactDifference !== 0) {
      return impactDifference;
    }

    return left.title.localeCompare(right.title, "de-DE");
  });
}

export function getVisibleAiSuggestions(
  suggestions: AiSuggestion[],
  isPremium: boolean,
) {
  const sorted = sortSuggestions(suggestions);
  return isPremium ? sorted : sorted.slice(0, FREE_VISIBLE_AI_SUGGESTIONS_LIMIT);
}

export function getCategoryLabel(category: AnalysisCategory) {
  const labels: Record<AnalysisCategory, string> = {
    seo: "Auffindbarkeit",
    performance: "Ladegefuehl",
    trust: "Vertrauen",
    conversion: "Anfragen",
    design: "Design",
    aiVisibility: "KI-Sichtbarkeit",
    ux: "Nutzerfuehrung",
  };

  return labels[category];
}

interface SuggestionTemplate {
  title: string;
  summary: string;
  actionSteps: string[];
  expectedImpact: PriorityLevel;
}

function createFallbackTemplate(finding: Finding): SuggestionTemplate {
  return {
    title: `${getCategoryLabel(finding.category)} gezielt verbessern`,
    summary:
      "Setze dieses Thema zuerst in eine klar sichtbare Optimierung um, damit die Seite schneller Vertrauen, Orientierung oder Conversion gewinnt.",
    actionSteps: [
      "Den betroffenen Bereich auf der Startseite klar identifizieren.",
      "Eine sichtbare, konkrete Verbesserung fuer Nutzer und Kaufentscheidung umsetzen.",
      "Nach der Aenderung erneut pruefen, ob das Signal jetzt klar erkennbar ist.",
    ],
    expectedImpact: finding.priority,
  };
}

export function mapFindingToSuggestionTemplate(finding: Finding): SuggestionTemplate {
  const text = `${finding.title} ${finding.description}`.toLowerCase();

  if (text.includes("meta description") || text.includes("kurzbeschreibung")) {
    return {
      title: "Kurzbeschreibung fuer Google und KI ergaenzen",
      summary:
        "Ergaenze eine klare Kurzbeschreibung, damit Suchende und KI-Systeme den Nutzen deiner Seite schneller verstehen.",
      actionSteps: [
        "Den Hauptnutzen der Startseite in einem klaren Satz formulieren.",
        "Angebot, Zielgruppe und wichtigsten Klickgrund konkret benennen.",
        "Den Text kurz halten, damit er in Suchergebnissen gut wirkt.",
      ],
      expectedImpact: "high",
    };
  }

  if (text.includes("title") || text.includes("seitenname")) {
    return {
      title: "Seitennamen schaerfen",
      summary:
        "Ein klarer Seitenname macht dein Angebot in Suchergebnissen sofort verstaendlich.",
      actionSteps: [
        "Zentrale Leistung oder Produktkategorie an den Anfang setzen.",
        "Markenname nur ergaenzen, wenn noch Platz bleibt.",
        "Kurz, konkret und gut lesbar formulieren.",
      ],
      expectedImpact: "high",
    };
  }

  if (text.includes("cta") || text.includes("call to action") || text.includes("hero")) {
    return {
      title: "Primaeren CTA im sichtbaren Bereich platzieren",
      summary:
        "Platziere im Hero einen klaren ersten Handlungsimpuls, damit Nutzer sofort wissen, was der naechste Schritt ist.",
      actionSteps: [
        "Einen primaeren CTA oberhalb des Folds platzieren.",
        "Eine konkrete Formulierung wie 'Jetzt Analyse starten' oder 'Kostenlos testen' verwenden.",
        "Farbe und Groesse so waehlen, dass der CTA klar heraussticht.",
      ],
      expectedImpact: "high",
    };
  }

  if (text.includes("impressum") || text.includes("datenschutz") || text.includes("kontakt")) {
    return {
      title: "Vertrauenslinks sichtbarer machen",
      summary:
        "Rechtliche und kontaktbezogene Links sollten ohne Suchen auffindbar sein, damit die Seite sofort serioeser wirkt.",
      actionSteps: [
        "Impressum, Datenschutz und Kontakt im Header oder Footer klar verlinken.",
        "Kontaktmoeglichkeiten mit E-Mail oder Telefonnummer sichtbar ergaenzen.",
        "Die Links auf allen wichtigen Seiten konsistent verfuegbar machen.",
      ],
      expectedImpact: "high",
    };
  }

  if (text.includes("alt") || text.includes("bild")) {
    return {
      title: "Bilder sauber beschreiben",
      summary:
        "Gute Bildbeschreibungen helfen Menschen mit Hilfssystemen, Google und KI beim Verstehen deiner Seite.",
      actionSteps: [
        "Allen relevanten Bildern kurze, konkrete Beschreibungen geben.",
        "Den Inhalt oder Nutzen des Bildes kurz und konkret benennen.",
        "Dekorative Bilder leer lassen statt generische Texte zu verwenden.",
      ],
      expectedImpact: "medium",
    };
  }

  if (text.includes("h1") || text.includes("h2") || text.includes("ueberschrift") || text.includes("struktur")) {
    return {
      title: "Seitenstruktur mit klaren Ueberschriften ordnen",
      summary:
        "Klare Botschaften und Abschnitte machen die Seite fuer Besucher, Google und KI leichter erfassbar.",
      actionSteps: [
        "Eine eindeutige Hauptbotschaft fuer das wichtigste Versprechen setzen.",
        "Inhalte in logische, gut benannte Abschnitte gliedern.",
        "Jede Ueberschrift so formulieren, dass sie Nutzen oder Thema direkt vermittelt.",
      ],
      expectedImpact: "high",
    };
  }

  if (text.includes("trust") || text.includes("bewertung") || text.includes("kundenservice") || text.includes("zahlung") || text.includes("versand") || text.includes("rueckgabe")) {
    return {
      title: "Vertrauenssignale sichtbar ausbauen",
      summary:
        "Zeige Sicherheit und Service nicht nur implizit, sondern direkt sichtbar in der kaufnahen Zone deiner Startseite.",
      actionSteps: [
        "Bewertungen, Siegel oder Kundenzitate im sichtbaren Bereich ergaenzen.",
        "Versand, Rueckgabe und sichere Zahlung in kurzen Trust-Bullets hervorheben.",
        "Kundenservice oder Erreichbarkeit als konkretes Signal sichtbar machen.",
      ],
      expectedImpact: "high",
    };
  }

  if (text.includes("formular") || text.includes("form")) {
    return {
      title: "Formulare klarer und reibungsarm gestalten",
      summary:
        "Ein schlankes, gut erklaertes Formular senkt Huerden und steigert die Abschlusswahrscheinlichkeit.",
      actionSteps: [
        "Nur die wirklich noetigen Felder abfragen.",
        "Nutzen und naechsten Schritt direkt ueber dem Formular erklaeren.",
        "Den Absende-Button mit einer klaren Handlungsformulierung versehen.",
      ],
      expectedImpact: "medium",
    };
  }

  if (finding.category === "seo") {
    return {
      title: "Auffindbarkeit und Verstaendlichkeit staerken",
      summary:
        "Klare Seitensignale helfen Besuchern, Google und KI, dein Angebot schneller richtig einzuordnen.",
      actionSteps: [
        "Seitenname, Kurzbeschreibung und Hauptbotschaft auf ein klares Kernthema ausrichten.",
        "Struktur und interne Verlinkung fuer Besucher und Suchsysteme konsistent halten.",
        "Linkvorschauen und Hauptseiten-Signale bewusst pflegen.",
      ],
      expectedImpact: finding.priority,
    };
  }

  if (finding.category === "trust") {
    return {
      title: "Vertrauen schneller aufbauen",
      summary:
        "Sichtbare Sicherheitssignale reduzieren Zweifel und helfen Nutzern, schneller zur Interaktion zu kommen.",
      actionSteps: [
        "Kontakt, Rechtliches und Service gut sichtbar platzieren.",
        "Sichere Zahlung, Versand und Rueckgabe kompakt kommunizieren.",
        "Mit Bewertungen oder echten Kundenstimmen soziale Sicherheit erhoehen.",
      ],
      expectedImpact: "high",
    };
  }

  if (finding.category === "conversion") {
    return {
      title: "Handlungsfuehrung auf Conversion ausrichten",
      summary:
        "Eine klare Nutzerfuehrung macht aus Aufmerksamkeit schneller echte Klicks und Anfragen.",
      actionSteps: [
        "Den wichtigsten CTA klar priorisieren.",
        "Nutzenargumente direkt am CTA oder im Hero verankern.",
        "Ablenkende Elemente reduzieren, damit der naechste Schritt eindeutig bleibt.",
      ],
      expectedImpact: "high",
    };
  }

  if (finding.category === "ux") {
    return {
      title: "Nutzerfuehrung und Lesbarkeit verbessern",
      summary:
        "Eine klarere Struktur hilft Besuchern, Inhalte schneller zu erfassen und sicherer weiterzugehen.",
      actionSteps: [
        "Wichtige Inhalte in klar erkennbare Abschnitte gliedern.",
        "Visuelle Hierarchien mit Ueberschriften, Abstaenden und Bildern schaerfen.",
        "Den oberen Bereich so gestalten, dass Nutzen und naechster Schritt sofort sichtbar sind.",
      ],
      expectedImpact: "medium",
    };
  }

  return createFallbackTemplate(finding);
}
