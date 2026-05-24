const HYPOTHESIS_TOKEN = "__SHOPHEBEL_CONVERSION_HYPOTHESE__";

const COPY_REPLACEMENTS: Array<[RegExp, string]> = [
  [/ÃƒÆ’Ã‚Â¼|ÃƒÂ¼|Ã¼/g, "ü"],
  [/ÃƒÆ’Ã…â€œ|ÃƒÅ“|Ãœ/g, "Ü"],
  [/ÃƒÆ’Ã‚Â¶|ÃƒÂ¶|Ã¶/g, "ö"],
  [/ÃƒÆ’Ã¢â‚¬â€œ|Ãƒâ€“|Ã–/g, "Ö"],
  [/ÃƒÆ’Ã‚Â¤|ÃƒÂ¤|Ã¤/g, "ä"],
  [/ÃƒÆ’Ã¢â‚¬Å¾|Ãƒâ€ž|Ã„/g, "Ä"],
  [/ÃƒÆ’Ã…Â¸|ÃƒÆ’Ã‚Å¸|ÃƒÅ¸|ÃŸ/g, "ß"],
  [/Ã‚Â·|Â·/g, "·"],
  [/Executive Summary/gi, "Management-Zusammenfassung"],
  [/Premium Conversion- und Trust-Audit/gi, "Premium Anfrage- und Vertrauens-Audit"],
  [/Conversion-Hebel/gi, "Anfrage- und Kaufhebel"],
  [/Conversion Hypothese/gi, "Conversion-Hypothese"],
  [/Visual Audit Notes/gi, "Visuelle Prüfung"],
  [/Above the fold/gi, "sichtbarer Startbereich"],
  [/oberhalb der Falz/gi, "im sichtbaren Startbereich"],
  [/Revenue Blockers/gi, "Umsatzbremsen"],
  [/Top Umsatzblocker/gi, "Top-Umsatzbremsen"],
  [/Conversion Quick Wins/gi, "Sofortmaßnahmen für mehr Anfragen"],
  [/Quick Wins/gi, "schnelle Verbesserungen"],
  [/Opportunity Roadmap/gi, "Priorisierter Maßnahmenplan"],
  [/Opportunities/gi, "Potenziale"],
  [/Opportunity/gi, "Potenzial"],
  [/Shophebel-Modul/gi, "Empfohlener Umsetzungspfad"],
  [/\bSuggested Service\b/gi, "Empfohlene Begleitung"],
  [/\bExpected Effect\b/gi, "Erwarteter Effekt"],
  [/\bBusiness Impact\b/gi, "Geschäftliche Wirkung"],
  [/\bCall-to-Action\b/gi, "Handlungsaufforderung"],
  [/\bCTA\b/g, "Button"],
  [/\bTrust\b/g, "Vertrauen"],
  [/\bConversion\b/gi, "Anfrage-/Kaufwahrscheinlichkeit"],
];

const UMLAUT_WORD_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bAbschluesse\b/gi, "Abschlüsse"],
  [/\bAbschluessen\b/gi, "Abschlüssen"],
  [/\bAbbrueche\b/gi, "Abbrüche"],
  [/\bAbstaende\b/gi, "Abstände"],
  [/\bEinfuehrung\b/gi, "Einführung"],
  [/\bEinschaetzung\b/gi, "Einschätzung"],
  [/\bergaenzt\b/gi, "ergänzt"],
  [/\bergaenzte\b/gi, "ergänzte"],
  [/\berklaert\b/gi, "erklärt"],
  [/\berklaeren\b/gi, "erklären"],
  [/\bfuer\b/gi, "für"],
  [/\bFuehrung\b/g, "Führung"],
  [/\bfuehren\b/gi, "führen"],
  [/\bfuehrt\b/gi, "führt"],
  [/\bfuehrend\b/gi, "führend"],
  [/\bFuehre\b/g, "Führe"],
  [/\bfrueher\b/gi, "früher"],
  [/\bFormularnaehe\b/gi, "Formularnähe"],
  [/\bGeraeten\b/gi, "Geräten"],
  [/\bgeprueft\b/gi, "geprüft"],
  [/\bgepruefte\b/gi, "geprüfte"],
  [/\bgepruefter\b/gi, "geprüfter"],
  [/\bgroesste\b/gi, "größte"],
  [/\bGroesse\b/g, "Größe"],
  [/\bkoennen\b/gi, "können"],
  [/\bkoennte\b/gi, "könnte"],
  [/\bkuerzer\b/gi, "kürzer"],
  [/\blaenger\b/gi, "länger"],
  [/\bMassnahmen\b/g, "Maßnahmen"],
  [/\bMassnahme\b/g, "Maßnahme"],
  [/\bnaechsten\b/gi, "nächsten"],
  [/\bnaechste\b/gi, "nächste"],
  [/\bnaechster\b/gi, "nächster"],
  [/\bnaechstem\b/gi, "nächstem"],
  [/\bNutzerfuehrung\b/g, "Nutzerführung"],
  [/\bPrio(?:ri)?taet\b/gi, "Priorität"],
  [/\bPrio(?:ri)?taeten\b/gi, "Prioritäten"],
  [/\bprimaeren\b/gi, "primären"],
  [/\bPruefung\b/gi, "Prüfung"],
  [/\bPruefe\b/gi, "Prüfe"],
  [/\bpruefen\b/gi, "prüfen"],
  [/\bRueckgabe\b/gi, "Rückgabe"],
  [/\bschaerfen\b/gi, "schärfen"],
  [/\bSpaeter\b/g, "Später"],
  [/\bUebersicht\b/gi, "Übersicht"],
  [/\bUeberschriften\b/gi, "Überschriften"],
  [/\buebersetzen\b/gi, "übersetzen"],
  [/\bVerstaendnis\b/gi, "Verständnis"],
  [/\bvollstaendige\b/gi, "vollständige"],
  [/\bzoegern\b/gi, "zögern"],
];

function protectAllowedLabels(text: string) {
  return text.replace(/Conversion-Hypothese/gi, HYPOTHESIS_TOKEN);
}

function restoreAllowedLabels(text: string) {
  return text.replace(new RegExp(HYPOTHESIS_TOKEN, "g"), "Conversion-Hypothese");
}

export function normalizeGermanText(value: unknown, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const protectedText = protectAllowedLabels(value.trim());
  const normalized = [...COPY_REPLACEMENTS, ...UMLAUT_WORD_REPLACEMENTS].reduce(
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

export function polishPremiumText(value: unknown, fallback = "") {
  return normalizeGermanText(value, fallback);
}

export function sentenceCasePremiumText(value: unknown, fallback = "") {
  const text = normalizeGermanText(value, fallback).replace(/^[\s:;,.!-]+/, "");

  if (!text) {
    return fallback;
  }

  return text.charAt(0).toLocaleUpperCase("de-DE") + text.slice(1);
}

export function ensureGermanSentence(value: unknown, fallback = "") {
  const text = sentenceCasePremiumText(value, fallback).replace(/[.?!]+$/, "");

  return text ? `${text}.` : fallback;
}

export function sentenceFragment(value: unknown, fallback = "") {
  return normalizeGermanText(value, fallback)
    .replace(/[.?!]+$/, "")
    .trim();
}
