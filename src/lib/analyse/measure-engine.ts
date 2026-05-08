import { ActionMeasure, AnalysisResultCategories, ScoreBlock } from "@/types/analysis";

type MeasureTemplate = Omit<ActionMeasure, "priority" | "sourceProblem">;

const categoryByBlock: Record<keyof AnalysisResultCategories, ActionMeasure["category"]> = {
  seo: "Klarheit",
  performance: "Ladegefuehl",
  trust: "Vertrauen",
  conversion: "CTA",
  design: "Design",
  aiVisibility: "AI-Sichtbarkeit",
};

const defaultByCategory: Record<ActionMeasure["category"], Omit<MeasureTemplate, "category">> = {
  Vertrauen: {
    title: "Vertrauen frueher sichtbar machen",
    description:
      "Ergaenze sichtbare Belege wie Kontakt, Bewertungen, rechtliche Links oder Sicherheitsargumente in kaufnahen Bereichen.",
    effort: "mittel",
    impact: "hoch",
  },
  Klarheit: {
    title: "Hauptbotschaft schaerfen",
    description:
      "Formuliere klarer, was angeboten wird, fuer wen es gedacht ist und welcher Nutzen sofort verstanden werden soll.",
    effort: "mittel",
    impact: "hoch",
  },
  "Mobile UX": {
    title: "Mobile Nutzung vereinfachen",
    description:
      "Optimiere Lesbarkeit, Abstaende, Button-Groessen und sichtbare Reihenfolge fuer kleine Bildschirme.",
    effort: "mittel",
    impact: "hoch",
  },
  CTA: {
    title: "Hauptbutton klarer fuehren",
    description:
      "Formuliere den wichtigsten Button konkreter und platziere ihn an mehreren entscheidenden Stellen.",
    effort: "niedrig",
    impact: "hoch",
  },
  Design: {
    title: "Visuelle Fuehrung verbessern",
    description:
      "Ordne Hero, Trust-Elemente, Bilder und Inhaltsbloecke so, dass Blick und Handlung klar gefuehrt werden.",
    effort: "mittel",
    impact: "mittel",
  },
  Ladegefuehl: {
    title: "Ladebremsen reduzieren",
    description:
      "Pruefe grosse Bilder, Skripte und externe Ressourcen und verschlanke die kritischsten Ladepfade.",
    effort: "mittel",
    impact: "hoch",
  },
  "AI-Sichtbarkeit": {
    title: "Fuer KI-Antworten verstaendlicher werden",
    description:
      "Ergaenze klare Kundenfragen, gut ausgezeichnete Informationen und eindeutig benannte Angaben zu Marke, Leistungen und Standort.",
    effort: "mittel",
    impact: "mittel",
  },
};

const templatesByProblem: Record<string, MeasureTemplate> = {
  Vertrauensbelege: {
    category: "Vertrauen",
    title: "Bewertungsbereich oberhalb des Footers einbauen",
    description:
      "Zeige Bewertungen, Siegel oder Zahlungsarten nicht erst ganz unten, sondern in einem sichtbaren Vertrauensbereich vor dem Footer oder nahe am Angebot.",
    effort: "mittel",
    impact: "hoch",
  },
  Impressum: {
    category: "Vertrauen",
    title: "Impressum sichtbar verlinken",
    description:
      "Platziere einen klaren Impressums-Link im Footer und optional in der mobilen Navigation, damit Seriositaet sofort belegbar ist.",
    effort: "niedrig",
    impact: "mittel",
  },
  Datenschutz: {
    category: "Vertrauen",
    title: "Datenschutz klar auffindbar machen",
    description:
      "Verlinke Datenschutz sichtbar im Footer und in der Naehe von Formularen, damit Nutzer wissen, wie ihre Daten verarbeitet werden.",
    effort: "niedrig",
    impact: "mittel",
  },
  Kontaktvertrauen: {
    category: "Vertrauen",
    title: "Kontaktweg prominenter machen",
    description:
      "Zeige Kontaktmoeglichkeiten frueher auf der Seite und wiederhole sie an Stellen, an denen Nutzer Rueckfragen haben koennten.",
    effort: "niedrig",
    impact: "hoch",
  },
  "Naechster Schritt": {
    category: "CTA",
    title: "Hauptbutton klarer formulieren und oefter platzieren",
    description:
      "Nutze einen eindeutigen primaeren CTA wie 'Angebot anfragen', 'Website pruefen' oder 'Termin buchen' und wiederhole ihn im Seitenverlauf.",
    effort: "niedrig",
    impact: "hoch",
  },
  "Einfacher Anfrageweg": {
    category: "CTA",
    title: "Einfachen Anfrageweg einbauen",
    description:
      "Baue ein kurzes Formular oder einen klaren Kontakt-CTA ein und erklaere direkt daneben, was nach dem Absenden passiert.",
    effort: "mittel",
    impact: "hoch",
  },
  Angebotsklarheit: {
    category: "Klarheit",
    title: "Angebot in einem Satz verstaendlich machen",
    description:
      "Ueberarbeite Hero und erste Textbloecke so, dass Besucher sofort Angebot, Zielgruppe und Nutzen verstehen.",
    effort: "mittel",
    impact: "hoch",
  },
  "Klarheit der Seitenbotschaft": {
    category: "Klarheit",
    title: "Seitenbotschaft klarer ordnen",
    description:
      "Setze eine klare Hauptbotschaft und ordne die wichtigsten Entscheidungsfragen in gut lesbare Abschnitte.",
    effort: "niedrig",
    impact: "mittel",
  },
  "Suchergebnis-Klarheit": {
    category: "Klarheit",
    title: "Suchvorschau verstaendlicher formulieren",
    description:
      "Formuliere Seitenname und Kurzbeschreibung so, dass Angebot, Nutzen und Klickgrund sofort erkennbar sind.",
    effort: "niedrig",
    impact: "mittel",
  },
  Bildverstaendnis: {
    category: "Klarheit",
    title: "Bilder beschreibbar machen",
    description:
      "Beschreibe relevante Bilder kurz und konkret, damit Menschen, Google und KI den Bildkontext verstehen.",
    effort: "mittel",
    impact: "mittel",
  },
  "Mobile Darstellung": {
    category: "Mobile UX",
    title: "Mobile Darstellung angenehm machen",
    description:
      "Pruefe die mobile Ansicht und verbessere Abstaende, Schriftgroessen und klickbare Elemente fuer kleine Bildschirme.",
    effort: "mittel",
    impact: "hoch",
  },
  Ladegefuehl: {
    category: "Ladegefuehl",
    title: "Mobile Ladezeit verbessern",
    description:
      "Komprimiere grosse Medien, reduziere unnoetige Skripte und priorisiere Inhalte, die oberhalb des ersten Scrolls gebraucht werden.",
    effort: "mittel",
    impact: "hoch",
  },
  Blickfuehrung: {
    category: "Design",
    title: "Layout auf Blickfuehrung ausrichten",
    description:
      "Ordne Headline, CTA, Trust-Elemente und Bilder so, dass der naechste Schritt visuell eindeutig ist.",
    effort: "mittel",
    impact: "mittel",
  },
  "Lesbarkeit und Inhaltstiefe": {
    category: "Design",
    title: "Textbereiche besser strukturieren",
    description:
      "Kuerze unklare Textbloecke, ergaenze Zwischenueberschriften und hebe Nutzenargumente visuell hervor.",
    effort: "mittel",
    impact: "mittel",
  },
  "Verstaendliche Daten fuer Google und KI": {
    category: "AI-Sichtbarkeit",
    title: "Informationen fuer Google und KI klar auszeichnen",
    description:
      "Zeichne Unternehmen, Standort, Produkte, Leistungen oder Kundenfragen so aus, dass Systeme sie leichter verstehen.",
    effort: "mittel",
    impact: "mittel",
  },
  "Kundenfragen als Antworten": {
    category: "AI-Sichtbarkeit",
    title: "Kundenfragen sichtbar beantworten",
    description:
      "Sammle echte Kundenfragen, beantworte sie kompakt und zeichne den Bereich bei Eignung fuer Google und KI klar aus.",
    effort: "mittel",
    impact: "mittel",
  },
  "Produkt-/Serviceverstaendlichkeit": {
    category: "AI-Sichtbarkeit",
    title: "Produkte und Leistungen klarer beschreiben",
    description:
      "Benenne Leistungen, Produkte, Zielgruppen, Nutzen und typische Anwendungsfaelle so, dass Menschen und KI-Systeme sie eindeutig einordnen koennen.",
    effort: "mittel",
    impact: "hoch",
  },
  "Klare Unternehmensbeschreibung": {
    category: "AI-Sichtbarkeit",
    title: "Unternehmensbeschreibung praezisieren",
    description:
      "Ergaenze eine klare Beschreibung zu Unternehmen, Angebot, Standort, Zielgruppe und Vertrauenssignalen.",
    effort: "niedrig",
    impact: "mittel",
  },
  "About-Seite": {
    category: "AI-Sichtbarkeit",
    title: "About-Seite sichtbar verlinken",
    description:
      "Erstelle oder verlinke eine Unternehmensseite mit Team, Erfahrung, Standort und Leistungsprofil.",
    effort: "mittel",
    impact: "mittel",
  },
  "Lokale Signale": {
    category: "AI-Sichtbarkeit",
    title: "Lokale Signale ergaenzen",
    description:
      "Ergaenze Adresse, Einzugsgebiet, Standortseiten, Oeffnungszeiten und lokale Begriffe, falls dein Angebot regional relevant ist.",
    effort: "mittel",
    impact: "mittel",
  },
  "Kontakt-/Standortdaten": {
    category: "AI-Sichtbarkeit",
    title: "Kontakt- und Standortdaten vereinheitlichen",
    description:
      "Platziere Kontakt, Adresse, Telefon oder E-Mail klar sichtbar und konsistent auf der Website.",
    effort: "niedrig",
    impact: "mittel",
  },
  "Regeln fuer KI-Systeme": {
    category: "AI-Sichtbarkeit",
    title: "Zugriff fuer Such- und KI-Systeme bewusst festlegen",
    description:
      "Pruefe, welche Such- oder KI-Systeme deine Inhalte abrufen duerfen, und lege diese Entscheidung bewusst fest.",
    effort: "niedrig",
    impact: "mittel",
  },
  "Klare Themenstruktur": {
    category: "AI-Sichtbarkeit",
    title: "Themenstruktur klarer machen",
    description:
      "Ordne Inhalte in klare Themenabschnitte und benenne Marke, Leistung, Ort und Zielgruppe deutlicher.",
    effort: "mittel",
    impact: "mittel",
  },
};

function priorityScore(measure: MeasureTemplate, status: ScoreBlock["checks"][number]["status"]) {
  const statusScore = status === "critical" ? 100 : status === "warning" ? 70 : 35;
  const impactScore = measure.impact === "hoch" ? 30 : measure.impact === "mittel" ? 18 : 8;
  const effortScore = measure.effort === "niedrig" ? 14 : measure.effort === "mittel" ? 7 : 0;

  return statusScore + impactScore + effortScore;
}

function priorityFromRank(index: number): ActionMeasure["priority"] {
  return Math.min(5, index + 1) as ActionMeasure["priority"];
}

export function buildActionMeasures(categories: AnalysisResultCategories): ActionMeasure[] {
  const candidates = (Object.entries(categories) as Array<[keyof AnalysisResultCategories, ScoreBlock]>)
    .flatMap(([blockKey, block]) =>
      block.checks
        .filter((check) => check.status === "critical" || check.status === "warning")
        .map((check) => {
          const category = categoryByBlock[blockKey];
          const fallback = defaultByCategory[category];
          const template =
            templatesByProblem[check.title] ??
            ({
              category,
              ...fallback,
            } satisfies MeasureTemplate);

          return {
            measure: {
              ...template,
              priority: 5,
              sourceProblem: check.title,
            } satisfies ActionMeasure,
            sortScore: priorityScore(template, check.status),
          };
        }),
    )
    .sort((left, right) => right.sortScore - left.sortScore);

  const seen = new Set<string>();
  const deduped = candidates.filter(({ measure }) => {
    const key = `${measure.category}:${measure.title}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });

  return deduped.map(({ measure }, index) => ({
    ...measure,
    priority: priorityFromRank(index),
  }));
}
