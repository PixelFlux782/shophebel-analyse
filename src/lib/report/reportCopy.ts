const HYPOTHESIS_TOKEN = "__SHOPHEBEL_CONVERSION_HYPOTHESE__";

export const REPORT_LABELS = {
  premiumReportTitle: "Dein Premium-Report",
  executiveSnapshot: "Kurzüberblick",
  websiteIntelligenceScore: "Shophebel-Analysewert",
  visualAudit: "Visuelle Analyse",
  screenshotIntelligenceConsole: "Visueller Seitenüberblick",
  fullPageScreenshot: "Gesamte Seitenansicht",
  desktopScreenshot: "Desktop-Ansicht",
  mobileScreenshot: "Mobile Ansicht",
  heroScreenshot: "Startbereich",
  capture: "Erfasste Ansicht",
  score: "Bewertung",
  status: "Einschätzung",
  plan: "Fahrplan",
  priorityScore: "Prioritätswert",
  managementSummary: "Management-Zusammenfassung",
  premiumStrategy: "Premium-Strategie",
  visualCheck: "Visuelle Prüfung",
  sevenDayPlan: "7-Tage-Fahrplan",
  measuresPlan: "Priorisierter Maßnahmenplan",
};

export const CUSTOMER_FORBIDDEN_REPLACEMENTS = {
  "Executive Snapshot": REPORT_LABELS.executiveSnapshot,
  "Executive Summary": REPORT_LABELS.managementSummary,
  "Website Intelligence Score": REPORT_LABELS.websiteIntelligenceScore,
  "Visual Audit": REPORT_LABELS.visualAudit,
  "Screenshot Intelligence Console": REPORT_LABELS.screenshotIntelligenceConsole,
  "Full Page Screenshot": REPORT_LABELS.fullPageScreenshot,
  "Desktop Screenshot": REPORT_LABELS.desktopScreenshot,
  "Mobile Screenshot": REPORT_LABELS.mobileScreenshot,
  "Hero Screenshot": REPORT_LABELS.heroScreenshot,
  "Visual Capture": "Visuelle Ansicht",
  "Intelligence Score": REPORT_LABELS.websiteIntelligenceScore,
  "Screenshot Intelligence": REPORT_LABELS.screenshotIntelligenceConsole,
  "Visual Intelligence": REPORT_LABELS.visualAudit,
  "Full Visual Audit": "Vollständige visuelle Analyse",
  "Premium Strategy Layer": "Strategische Premium-Ebene",
  "Executive Recommendations": "priorisierte Empfehlungen",
  "Business Priorities": "geschäftliche Prioritäten",
  "7-Day Action Plan": REPORT_LABELS.sevenDayPlan,
  "Report Snapshot": "Report-Auszug",
  "Premium-Report": "Premium-Bericht",
  "KI-Premiumreport": "KI-Premiumbericht",
  Report: "Bericht",
  "Top Issues": "Wichtigste Probleme",
  "Revenue Blockers": "Umsatzbremsen",
  "Quick Wins": "schnelle Verbesserungen",
  "Quick Fix Sprint": "Sofort-Umsetzung",
  "Quick Fix": "Sofortmaßnahme",
  Sprint: "Umsetzung",
  "Conversion Quick Wins": "Sofortmaßnahmen für mehr Anfragen",
  "Opportunity Roadmap": REPORT_LABELS.measuresPlan,
  Opportunities: "Potenziale",
  Opportunity: "Potenzial",
  "Shophebel-Modul": "Empfohlener Umsetzungspfad",
  "Suggested Service": "Empfohlene Begleitung",
  "Expected Effect": "Erwarteter Effekt",
  "Business Impact": "Geschäftliche Wirkung",
  "Call-to-Action": "Handlungsaufforderung",
  "Above the fold": "sichtbarer Startbereich",
  Dashboard: "Übersicht",
  Insights: "Erkenntnisse",
  Summary: "Zusammenfassung",
  Recommendation: "Empfehlung",
  Recommendations: "Empfehlungen",
  "AI Visibility": "KI-Sichtbarkeit",
  "AI-Sichtbarkeit": "KI-Sichtbarkeit",
  "Form drag": "Formular-Reibung",
  "Trust gap": "Vertrauenslücke",
  "Intent match": "Passung zur Suchabsicht",
  Hero: "Startbereich",
  Free: "Kostenlos",
  Full: "Vollanalyse",
  Trust: "Vertrauen",
  Conversion: "Anfrage-/Kaufwahrscheinlichkeit",
  Capture: REPORT_LABELS.capture,
  CTA: "Button",
} as const;

export const CUSTOMER_FORBIDDEN_REPORT_LABELS = Object.keys(CUSTOMER_FORBIDDEN_REPLACEMENTS);

export const CUSTOMER_FORBIDDEN_ASCII_UMLAUTS = [
  "Abschluesse",
  "Abschluessen",
  "Abbrueche",
  "Abstaende",
  "Aenderung",
  "Aenderungen",
  "Bildverstaendnis",
  "Einfuehrung",
  "Einschaetzung",
  "Erklaerung",
  "fuer",
  "Fuehrung",
  "fuehren",
  "fuehrt",
  "frueher",
  "Formularnaehe",
  "Geraeten",
  "geoeffnet",
  "gedrueckt",
  "geprueft",
  "groesser",
  "groessere",
  "groesste",
  "Groesse",
  "hoeherer",
  "koennen",
  "koennte",
  "kuerzer",
  "laenger",
  "Massnahmen",
  "Massnahme",
  "moeglich",
  "Kontaktmoeglichkeiten",
  "naechste",
  "naechsten",
  "naechster",
  "naechstem",
  "Nutzerfuehrung",
  "Pruefung",
  "Pruefe",
  "pruefen",
  "Rueckgabe",
  "schaerfen",
  "Schriftgroessen",
  "Spaeter",
  "stoert",
  "staerker",
  "staerken",
  "Staerken",
  "Uebersicht",
  "Ueberschriften",
  "uebersetzen",
  "verschluesselte",
  "Verstaendlichkeit",
  "Verstaendnis",
  "verfuegbar",
  "vollstaendig",
  "vollstaendige",
  "ausfuehren",
  "zusaetzliche",
  "zuruecknehmen",
  "zoegern",
];

export const CUSTOMER_FORBIDDEN_FALLBACK_TEXTS = [
  "n/a",
  "N/A",
  "unknown",
  "Unknown",
  "undefined",
  "null",
  "error",
  "Error",
  "fallback",
  "Fallback",
  "Nicht im gespeicherten Report enthalten.",
  "Keine separaten Aktionen im gespeicherten Report vorhanden.",
  "Keine Notiz im gespeicherten Report enthalten.",
];

const COPY_REPLACEMENTS: Array<[RegExp, string]> = Object.entries(CUSTOMER_FORBIDDEN_REPLACEMENTS)
  .sort(([left], [right]) => right.length - left.length)
  .map(([term, replacement]) => [new RegExp(`\\b${escapeRegExp(term)}\\b`, "gi"), replacement]);

const MOJIBAKE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/ÃƒÂ¼|ÃƒÆ’Ã‚Â¼/g, "ü"],
  [/ÃƒÅ“|ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ|ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸/g, "Ü"],
  [/ÃƒÂ¶|ÃƒÆ’Ã‚Â¶/g, "ö"],
  [/Ãƒâ€“|ÃƒÆ’Ã¢â‚¬â€œ/g, "Ö"],
  [/ÃƒÂ¤|ÃƒÆ’Ã‚Â¤/g, "ä"],
  [/Ãƒâ€ž|ÃƒÆ’Ã¢â‚¬Å¾/g, "Ä"],
  [/ÃƒÅ¸|ÃƒÆ’Ã…Â¸/g, "ß"],
  [/Ã¼/g, "ü"],
  [/Ãœ/g, "Ü"],
  [/Ã¶/g, "ö"],
  [/Ã–/g, "Ö"],
  [/Ã¤/g, "ä"],
  [/Ã„/g, "Ä"],
  [/ÃŸ/g, "ß"],
  [/Â·/g, "·"],
  [/â€“|â€”/g, "-"],
  [/â€ž|â€œ|â€/g, "\""],
  [/â€™/g, "'"],
];

const UMLAUT_WORD_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bAbschluesse\b/gi, "Abschlüsse"],
  [/\bAbschluessen\b/gi, "Abschlüssen"],
  [/\bAbbrueche\b/gi, "Abbrüche"],
  [/\bAbstaende\b/gi, "Abstände"],
  [/\bAenderung\b/gi, "Änderung"],
  [/\bAenderungen\b/gi, "Änderungen"],
  [/\bBildverstaendnis\b/gi, "Bildverständnis"],
  [/\bEinfuehrung\b/gi, "Einführung"],
  [/\bEinschaetzung\b/gi, "Einschätzung"],
  [/\bergaenzt\b/gi, "ergänzt"],
  [/\bergaenzte\b/gi, "ergänzte"],
  [/\berklaert\b/gi, "erklärt"],
  [/\bErklaerung\b/gi, "Erklärung"],
  [/\berklaeren\b/gi, "erklären"],
  [/\bklaeren\b/gi, "klären"],
  [/\bfuer\b/gi, "für"],
  [/\bFuehrung\b/g, "Führung"],
  [/\bfuehren\b/gi, "führen"],
  [/\bfuehrt\b/gi, "führt"],
  [/\bfuehrend\b/gi, "führend"],
  [/\bFuehre\b/g, "Führe"],
  [/\bfrueher\b/gi, "früher"],
  [/\bFormularnaehe\b/gi, "Formularnähe"],
  [/\bGeraeten\b/gi, "Geräten"],
  [/\bgeoeffnet\b/gi, "geöffnet"],
  [/\bgedrueckt\b/gi, "gedrückt"],
  [/\bgeprueft\b/gi, "geprüft"],
  [/\bgepruefte\b/gi, "geprüfte"],
  [/\bgepruefter\b/gi, "geprüfter"],
  [/\bgroesser\b/gi, "größer"],
  [/\bgroessere\b/gi, "größere"],
  [/\bgroesste\b/gi, "größte"],
  [/\bGroesse\b/g, "Größe"],
  [/\bhoeherer\b/gi, "höherer"],
  [/\bkoennen\b/gi, "können"],
  [/\bkoennte\b/gi, "könnte"],
  [/\bkuerzer\b/gi, "kürzer"],
  [/\blaenger\b/gi, "länger"],
  [/\bMassnahmen\b/g, "Maßnahmen"],
  [/\bMassnahme\b/g, "Maßnahme"],
  [/\bmoeglich\b/gi, "möglich"],
  [/\bKontaktmoeglichkeiten\b/gi, "Kontaktmöglichkeiten"],
  [/\bnaechsten\b/gi, "nächsten"],
  [/\bnaechste\b/gi, "nächste"],
  [/\bnaechster\b/gi, "nächster"],
  [/\bnaechstem\b/gi, "nächstem"],
  [/\bNutzerfuehrung\b/g, "Nutzerführung"],
  [/\boeffnet\b/gi, "öffnet"],
  [/\bPrio(?:ri)?taet\b/gi, "Priorität"],
  [/\bPrio(?:ri)?taeten\b/gi, "Prioritäten"],
  [/\bprimaeren\b/gi, "primären"],
  [/\bPruefung\b/gi, "Prüfung"],
  [/\bPruefe\b/gi, "Prüfe"],
  [/\bpruefen\b/gi, "prüfen"],
  [/\bRueckgabe\b/gi, "Rückgabe"],
  [/\bschaerfen\b/gi, "schärfen"],
  [/\bSchriftgroessen\b/gi, "Schriftgrößen"],
  [/\bSpaeter\b/g, "Später"],
  [/\bstoert\b/gi, "stört"],
  [/\bstaerker\b/gi, "stärker"],
  [/\bstaerken\b/gi, "stärken"],
  [/\bStaerken\b/g, "Stärken"],
  [/\bUebersicht\b/gi, "Übersicht"],
  [/\bUeberschriften\b/gi, "Überschriften"],
  [/\buebersetzen\b/gi, "übersetzen"],
  [/\bverschluesselte\b/gi, "verschlüsselte"],
  [/\bVerstaendlichkeit\b/gi, "Verständlichkeit"],
  [/\bVerstaendnis\b/gi, "Verständnis"],
  [/\bverfuegbar\b/gi, "verfügbar"],
  [/\bvollstaendig\b/gi, "vollständig"],
  [/\bvollstaendige\b/gi, "vollständige"],
  [/\bausfuehren\b/gi, "ausführen"],
  [/\bzusaetzliche\b/gi, "zusätzliche"],
  [/\bzuruecknehmen\b/gi, "zurücknehmen"],
  [/\bzoegern\b/gi, "zögern"],
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function protectAllowedLabels(text: string) {
  return text.replace(/Conversion-Hypothese/gi, HYPOTHESIS_TOKEN);
}

function restoreAllowedLabels(text: string) {
  return text.replace(new RegExp(HYPOTHESIS_TOKEN, "g"), "Conversion-Hypothese");
}

export function normalizeGermanReportText(value: unknown, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const protectedText = protectAllowedLabels(value.trim());
  const normalized = [...MOJIBAKE_REPLACEMENTS, ...COPY_REPLACEMENTS, ...UMLAUT_WORD_REPLACEMENTS].reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    protectedText,
  )
    .replace(/\b(Der wahrscheinlich größte Bremsfaktor ist) ([A-ZÄÖÜ])/g, "$1: $2")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\.{2,}/g, ".")
    .trim();

  return restoreAllowedLabels(normalized);
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

export function findReportCopyQualityIssues(text: string) {
  const source = typeof text === "string" ? text : "";
  const sourceForScan = protectAllowedLabels(source);
  const normalized = normalizeGermanReportText(text);
  const forbiddenTerms = [
    ...CUSTOMER_FORBIDDEN_REPORT_LABELS.filter((term) =>
      new RegExp(`\\b${escapeRegExp(term)}\\b`, "i").test(sourceForScan),
    ),
    ...CUSTOMER_FORBIDDEN_ASCII_UMLAUTS.filter((term) =>
      new RegExp(`\\b${escapeRegExp(term)}\\b`).test(sourceForScan),
    ),
    ...CUSTOMER_FORBIDDEN_FALLBACK_TEXTS.filter((term) =>
      new RegExp(`\\b${escapeRegExp(term)}\\b`, term === term.toLowerCase() ? "" : "i").test(sourceForScan),
    ),
  ];
  const mojibakeMatches = sourceForScan.match(/[ÃÂ�]|â€|â€“|â€™/g) ?? [];

  return {
    normalizedText: normalized,
    forbiddenTerms: unique(forbiddenTerms),
    mojibakeMatches: unique(mojibakeMatches),
  };
}

export function validateReportCopyQuality(text: string) {
  const issues = findReportCopyQualityIssues(text);
  const isValid = issues.forbiddenTerms.length === 0 && issues.mojibakeMatches.length === 0;

  return {
    isValid,
    ...issues,
  };
}

export function assertReportCopyQuality(text: string, context = "Report-Ausgabe") {
  const result = validateReportCopyQuality(text);

  if (!result.isValid) {
    throw new Error(
      `${context} enthält unzulässige Report-Copy: ${[
        ...result.forbiddenTerms,
        ...result.mojibakeMatches,
      ].join(", ")}`,
    );
  }

  return result;
}

export function hasForbiddenCustomerReportText(text: string) {
  return !validateReportCopyQuality(text).isValid;
}
