import { normalizeGermanReportText } from "@/lib/report/reportCopy";

export function normalizeGermanText(value: unknown, fallback = "") {
  return normalizeGermanReportText(value, fallback);
}

export function polishPremiumText(value: unknown, fallback = "") {
  return normalizeGermanReportText(value, fallback);
}

export function sentenceCasePremiumText(value: unknown, fallback = "") {
  const text = normalizeGermanReportText(value, fallback).replace(/^[\s:;,.!-]+/, "");

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
  return normalizeGermanReportText(value, fallback)
    .replace(/[.?!]+$/, "")
    .trim();
}
