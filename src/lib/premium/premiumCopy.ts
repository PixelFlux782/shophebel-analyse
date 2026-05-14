const HYPOTHESIS_TOKEN = "__SHOPHEBEL_CONVERSION_HYPOTHESE__";

const COPY_REPLACEMENTS: Array<[RegExp, string]> = [
  [/ü/g, "ü"],
  [/Ü/g, "Ü"],
  [/ö/g, "ö"],
  [/Ö/g, "Ö"],
  [/ä/g, "ä"],
  [/Ä/g, "Ä"],
  [/ß/g, "ß"],
  [/·/g, "·"],
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
  [/\bAbschlüsse\b/g, "Abschlüsse"],
  [/\bAbschlüssen\b/g, "Abschlüssen"],
  [/\bAbbrüche\b/g, "Abbrüche"],
  [/\bAbstände\b/g, "Abstände"],
  [/\bEinschätzung\b/g, "Einschätzung"],
  [/\bergänzt\b/g, "ergänzt"],
  [/\bErgänzte\b/g, "Ergänzte"],
  [/\berklärt\b/g, "erklärt"],
  [/\bErklärt\b/g, "Erklärt"],
  [/\berklären\b/g, "erklären"],
  [/\bErklären\b/g, "Erklären"],
  [/\bfür\b/g, "für"],
  [/\bFür\b/g, "Für"],
  [/\bFührung\b/g, "Führung"],
  [/\bführen\b/g, "führen"],
  [/\bführt\b/g, "führt"],
  [/\bführend\b/g, "führend"],
  [/\bFuehre\b/g, "Führe"],
  [/\bfrüher\b/g, "früher"],
  [/\bFrüher\b/g, "Früher"],
  [/\bFormularnaehe\b/g, "Formularnähe"],
  [/\bGeräten\b/g, "Geräten"],
  [/\bgeprüft\b/g, "geprüft"],
  [/\bgeprüfte\b/g, "geprüfte"],
  [/\bgeprüfter\b/g, "geprüfter"],
  [/\bgrößte\b/g, "größte"],
  [/\bGröße\b/g, "Größe"],
  [/\bkönnen\b/g, "können"],
  [/\bkönnte\b/g, "könnte"],
  [/\bkürzer\b/g, "kürzer"],
  [/\bKürzer\b/g, "Kürzer"],
  [/\blaenger\b/g, "länger"],
  [/\bLaenger\b/g, "Länger"],
  [/\bMaßnahmen\b/g, "Maßnahmen"],
  [/\bMaßnahme\b/g, "Maßnahme"],
  [/\bnächsten\b/g, "nächsten"],
  [/\bnächste\b/g, "nächste"],
  [/\bnächster\b/g, "nächster"],
  [/\bnächstem\b/g, "nächstem"],
  [/\bPrimären\b/g, "Primären"],
  [/\bprimären\b/g, "primären"],
  [/\bPrioritäten\b/g, "Prioritäten"],
  [/\bPriorität\b/g, "Priorität"],
  [/\bPrüfung\b/g, "Prüfung"],
  [/\bPrüfe\b/g, "Prüfe"],
  [/\bprüfen\b/g, "prüfen"],
  [/\bRueckgabe\b/g, "Rückgabe"],
  [/\bschärfen\b/g, "schärfen"],
  [/\bSchärfen\b/g, "Schärfen"],
  [/\bSpaeter\b/g, "Später"],
  [/\bÜberschriften\b/g, "Überschriften"],
  [/\bVerständnis\b/g, "Verständnis"],
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
