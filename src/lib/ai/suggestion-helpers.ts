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
    performance: "Ladegefühl",
    trust: "Vertrauen",
    conversion: "Anfragen",
    design: "Design",
    aiVisibility: "KI-Sichtbarkeit",
    ux: "Nutzerführung",
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
      "Eine sichtbare, konkrete Verbesserung für Nutzer und Kaufentscheidung umsetzen.",
      "Nach der Änderung erneut prüfen, ob das Signal jetzt klar erkennbar ist.",
    ],
    expectedImpact: finding.priority,
  };
}

export function mapFindingToSuggestionTemplate(finding: Finding): SuggestionTemplate {
  const text = `${finding.title} ${finding.description}`.toLowerCase();

  if (text.includes("meta description") || text.includes("kurzbeschreibung")) {
    return {
      title: "Kurzbeschreibung für Google und KI ergänzen",
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
      title: "Seitennamen schärfen",
      summary:
        "Ein klarer Seitenname macht dein Angebot in Suchergebnissen sofort verständlich.",
      actionSteps: [
        "Zentrale Leistung oder Produktkategorie an den Anfang setzen.",
        "Markenname nur ergänzen, wenn noch Platz bleibt.",
        "Kurz, konkret und gut lesbar formulieren.",
      ],
      expectedImpact: "high",
    };
  }

  if (text.includes("cta") || text.includes("call to action") || text.includes("hero")) {
    return {
      title: "Primären CTA im sichtbaren Bereich platzieren",
      summary:
        "Platziere im Hero einen klaren ersten Handlungsimpuls, damit Nutzer sofort wissen, was der nächste Schritt ist.",
      actionSteps: [
        "Einen primären CTA oberhalb des Folds platzieren.",
        "Eine konkrete Formulierung wie 'Jetzt Analyse starten' oder 'Kostenlos testen' verwenden.",
        "Farbe und Größe so wählen, dass der CTA klar heraussticht.",
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
        "Kontaktmöglichkeiten mit E-Mail oder Telefonnummer sichtbar ergänzen.",
        "Die Links auf allen wichtigen Seiten konsistent verfügbar machen.",
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

  if (text.includes("h1") || text.includes("h2") || text.includes("überschrift") || text.includes("struktur")) {
    return {
      title: "Seitenstruktur mit klaren Überschriften ordnen",
      summary:
        "Klare Botschaften und Abschnitte machen die Seite für Besucher, Google und KI leichter erfassbar.",
      actionSteps: [
        "Eine eindeutige Hauptbotschaft für das wichtigste Versprechen setzen.",
        "Inhalte in logische, gut benannte Abschnitte gliedern.",
        "Jede Überschrift so formulieren, dass sie Nutzen oder Thema direkt vermittelt.",
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
        "Bewertungen, Siegel oder Kundenzitate im sichtbaren Bereich ergänzen.",
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
        "Ein schlankes, gut erklärtes Formular senkt Hürden und steigert die Abschlusswahrscheinlichkeit.",
      actionSteps: [
        "Nur die wirklich nötigen Felder abfragen.",
        "Nutzen und nächsten Schritt direkt über dem Formular erklären.",
        "Den Absende-Button mit einer klaren Handlungsformulierung versehen.",
      ],
      expectedImpact: "medium",
    };
  }

  if (finding.category === "seo") {
    return {
      title: "Auffindbarkeit und Verständlichkeit staerken",
      summary:
        "Klare Seitensignale helfen Besuchern, Google und KI, dein Angebot schneller richtig einzuordnen.",
      actionSteps: [
        "Seitenname, Kurzbeschreibung und Hauptbotschaft auf ein klares Kernthema ausrichten.",
        "Struktur und interne Verlinkung für Besucher und Suchsysteme konsistent halten.",
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
      title: "Handlungsführung auf Conversion ausrichten",
      summary:
        "Eine klare Nutzerführung macht aus Aufmerksamkeit schneller echte Klicks und Anfragen.",
      actionSteps: [
        "Den wichtigsten CTA klar priorisieren.",
        "Nutzenargumente direkt am CTA oder im Hero verankern.",
        "Ablenkende Elemente reduzieren, damit der nächste Schritt eindeutig bleibt.",
      ],
      expectedImpact: "high",
    };
  }

  if (finding.category === "ux") {
    return {
      title: "Nutzerführung und Lesbarkeit verbessern",
      summary:
        "Eine klarere Struktur hilft Besuchern, Inhalte schneller zu erfassen und sicherer weiterzugehen.",
      actionSteps: [
        "Wichtige Inhalte in klar erkennbare Abschnitte gliedern.",
        "Visuelle Hierarchien mit Überschriften, Abständen und Bildern schärfen.",
        "Den oberen Bereich so gestalten, dass Nutzen und nächster Schritt sofort sichtbar sind.",
      ],
      expectedImpact: "medium",
    };
  }

  return createFallbackTemplate(finding);
}
