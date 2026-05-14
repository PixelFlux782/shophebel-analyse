import { load } from "cheerio";

import { CheckContext, CheckResult, Finding } from "@/types/analysis";

const CTA_KEYWORDS = ["kaufen", "bestellen", "anfragen", "starten", "testen", "angebot", "jetzt"];
const USP_KEYWORDS = ["vorteile", "qualitaet", "schnell", "einfach", "professionell", "effizient"];
const SOCIAL_PROOF_KEYWORDS = ["kunden", "bewertungen", "rezensionen", "erfahrungen"];
const PRICE_KEYWORDS = ["preis", "angebot", "euro", "eur", "rabatt", "kostenlos"];

function countKeywordMatches(text: string, keywords: string[]) {
  return keywords.filter((keyword) => text.includes(keyword)).length;
}

function pushFinding(findings: Finding[], finding: Finding) {
  findings.push(finding);
}

export function runConversionChecks(html: string, context?: CheckContext): CheckResult {
  const $ = load(html);
  const findings: Finding[] = [];
  let score = 100;

  const bodyText = $("body").text().replace(/\s+/g, " ").toLowerCase();
  const actionElements = $("a, button, input[type='submit'], input[type='button']")
    .toArray()
    .map((element) => {
      const node = $(element);
      return `${node.text()} ${node.attr("value") ?? ""}`.trim().toLowerCase();
    })
    .filter(Boolean);

  const ctaElementCount = actionElements.filter((text) =>
    CTA_KEYWORDS.some((keyword) => text.includes(keyword)),
  ).length;
  const ctaKeywordMatches = Math.max(
    countKeywordMatches(bodyText, CTA_KEYWORDS),
    context?.pageSignals?.visibleCtaTextMatches ?? 0,
  );
  const effectiveCtaElementCount = Math.max(
    ctaElementCount,
    context?.pageSignals?.visibleButtons ?? 0,
  );
  const uspKeywordMatches = countKeywordMatches(bodyText, USP_KEYWORDS);
  const socialProofMatches = countKeywordMatches(bodyText, SOCIAL_PROOF_KEYWORDS);
  const priceMatches = countKeywordMatches(bodyText, PRICE_KEYWORDS);

  if (ctaKeywordMatches > 0) {
    pushFinding(findings, {
      category: "conversion",
      status: "success",
      title: "CTA-Woerter im Text vorhanden",
      description: `Es wurden ${ctaKeywordMatches} CTA-Signale im Text erkannt.`,
      priority: "low",
    });
  } else {
    score -= 22;
    pushFinding(findings, {
      category: "conversion",
      status: "error",
      title: "Keine klaren CTA-Woerter gefunden",
      description: "Die Startseite kommuniziert keine deutliche Handlungsaufforderung wie kaufen, testen oder starten.",
      priority: "high",
    });
  }

  if (effectiveCtaElementCount >= 2) {
    pushFinding(findings, {
      category: "conversion",
      status: "success",
      title: "Mehrere CTA-Elemente vorhanden",
      description: `Es wurden ${effectiveCtaElementCount} klickbare Elemente mit CTA-Charakter gefunden.`,
      priority: "low",
    });
  } else if (effectiveCtaElementCount === 1) {
    score -= 8;
    pushFinding(findings, {
      category: "conversion",
      status: "warning",
      title: "Nur ein CTA-Element vorhanden",
      description: "Es wurde nur ein klarer CTA-Link oder Button gefunden.",
      priority: "medium",
    });
  } else {
    score -= 18;
    pushFinding(findings, {
      category: "conversion",
      status: "error",
      title: "Keine CTA-Buttons oder CTA-Links gefunden",
      description: "Es wurden keine klickbaren Elemente mit klarer Handlungsaufforderung erkannt.",
      priority: "high",
    });
  }

  if (uspKeywordMatches >= 2) {
    pushFinding(findings, {
      category: "conversion",
      status: "success",
      title: "Nutzenargumente vorhanden",
      description: "Im Text sind mehrere Nutzen- oder USP-Begriffe erkennbar.",
      priority: "low",
    });
  } else {
    score -= 12;
    pushFinding(findings, {
      category: "conversion",
      status: "warning",
      title: "Wenig Nutzenkommunikation",
      description: "Die Startseite zeigt kaum klare Nutzen- oder USP-Woerter wie schnell, einfach oder professionell.",
      priority: "medium",
    });
  }

  if (socialProofMatches > 0) {
    pushFinding(findings, {
      category: "conversion",
      status: "success",
      title: "Social Proof ist sichtbar",
      description: "Es wurden Hinweise auf Kunden, Bewertungen oder Erfahrungen erkannt.",
      priority: "low",
    });
  } else {
    score -= 12;
    pushFinding(findings, {
      category: "conversion",
      status: "warning",
      title: "Social Proof fehlt",
      description: "Es wurden keine klaren Hinweise auf Kundenstimmen, Bewertungen oder Erfahrungen gefunden.",
      priority: "medium",
    });
  }

  if (priceMatches > 0) {
    pushFinding(findings, {
      category: "conversion",
      status: "success",
      title: "Preis- oder Angebotsbezug vorhanden",
      description: "Die Seite enthält Hinweise auf Preise, Angebote oder kostenlose Leistungen.",
      priority: "low",
    });
  } else {
    score -= 10;
    pushFinding(findings, {
      category: "conversion",
      status: "warning",
      title: "Keine Preis- oder Angebotsbezug erkannt",
      description: "Es fehlen klare Hinweise auf Preise, Angebote oder kostenlose Einstiege.",
      priority: "medium",
    });
  }

  if ((context?.pageSignals?.formFieldCount ?? 0) > 0) {
    pushFinding(findings, {
      category: "conversion",
      status: "success",
      title: "Formularsignale erkannt",
      description: "Die Seite enthält sichtbare Formularfelder, die auf Interaktion oder Lead-Erfassung hindeuten.",
      priority: "low",
    });
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    findings,
  };
}
