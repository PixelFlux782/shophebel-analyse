const HYPOTHESIS_TOKEN = "__SHOPHEBEL_CONVERSION_HYPOTHESE__";

const COPY_REPLACEMENTS: Array<[RegExp, string]> = [
  [/Ã¼/g, "ü"],
  [/Ãœ/g, "Ü"],
  [/Ã¶/g, "ö"],
  [/Ã–/g, "Ö"],
  [/Ã¤/g, "ä"],
  [/Ã„/g, "Ä"],
  [/ÃŸ/g, "ß"],
  [/Â·/g, "·"],
  [/Executive Summary/gi, "Management-Zusammenfassung"],
  [/Premium Conversion- und Trust-Audit/gi, "Premium Anfrage- und Vertrauens-Audit"],
  [/Conversion-Hebel/gi, "Anfrage- und Kaufhebel"],
  [/Conversion Hypothese/gi, "Conversion-Hypothese"],
  [/Visual Audit Notes/gi, "Visuelle Prüfung"],
  [/Above the fold/gi, "sichtbarer Startbereich"],
  [/oberhalb der Falz/gi, "im sichtbaren Startbereich"],
  [/Revenue Blockers/gi, "Umsatzbremsen"],
  [/Top Umsatzblocker/gi, "Top-Umsatzbremsen"],
  [/Quick Wins/gi, "Schnelle Hebel"],
  [/\bCall-to-Action\b/gi, "Handlungsaufforderung"],
  [/\bCTA\b/g, "Button"],
  [/\bTrust\b/g, "Vertrauen"],
  [/\bConversion\b/gi, "Anfrage-/Kaufwahrscheinlichkeit"],
];

const UMLAUT_WORD_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bAbschluesse\b/g, "Abschlüsse"],
  [/\bAbschluessen\b/g, "Abschlüssen"],
  [/\bAbbrueche\b/g, "Abbrüche"],
  [/\bAbstaende\b/g, "Abstände"],
  [/\bEinschaetzung\b/g, "Einschätzung"],
  [/\bergaenzt\b/g, "ergänzt"],
  [/\bErgaenzte\b/g, "Ergänzte"],
  [/\berklaert\b/g, "erklärt"],
  [/\bErklaert\b/g, "Erklärt"],
  [/\berklaeren\b/g, "erklären"],
  [/\bErklaeren\b/g, "Erklären"],
  [/\bfuer\b/g, "für"],
  [/\bFuer\b/g, "Für"],
  [/\bFuehrung\b/g, "Führung"],
  [/\bfuehren\b/g, "führen"],
  [/\bfuehrt\b/g, "führt"],
  [/\bfuehrend\b/g, "führend"],
  [/\bFuehre\b/g, "Führe"],
  [/\bfrueher\b/g, "früher"],
  [/\bFrueher\b/g, "Früher"],
  [/\bFormularnaehe\b/g, "Formularnähe"],
  [/\bGeraeten\b/g, "Geräten"],
  [/\bgeprueft\b/g, "geprüft"],
  [/\bgepruefte\b/g, "geprüfte"],
  [/\bgepruefter\b/g, "geprüfter"],
  [/\bgroesste\b/g, "größte"],
  [/\bGroesse\b/g, "Größe"],
  [/\bkoennen\b/g, "können"],
  [/\bkoennte\b/g, "könnte"],
  [/\bkuerzer\b/g, "kürzer"],
  [/\bKuerzer\b/g, "Kürzer"],
  [/\blaenger\b/g, "länger"],
  [/\bLaenger\b/g, "Länger"],
  [/\bMassnahmen\b/g, "Maßnahmen"],
  [/\bMassnahme\b/g, "Maßnahme"],
  [/\bnaechsten\b/g, "nächsten"],
  [/\bnaechste\b/g, "nächste"],
  [/\bnaechster\b/g, "nächster"],
  [/\bnaechstem\b/g, "nächstem"],
  [/\bPrimaeren\b/g, "Primären"],
  [/\bprimaeren\b/g, "primären"],
  [/\bPrioritaeten\b/g, "Prioritäten"],
  [/\bPrioritaet\b/g, "Priorität"],
  [/\bPruefung\b/g, "Prüfung"],
  [/\bPruefe\b/g, "Prüfe"],
  [/\bpruefen\b/g, "prüfen"],
  [/\bRueckgabe\b/g, "Rückgabe"],
  [/\bschaerfen\b/g, "schärfen"],
  [/\bSchaerfen\b/g, "Schärfen"],
  [/\bSpaeter\b/g, "Später"],
  [/\bUeberschriften\b/g, "Überschriften"],
  [/\bVerstaendnis\b/g, "Verständnis"],
  [/\bzoegern\b/g, "zögern"],
  [/\bZoegern\b/g, "Zögern"],
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
