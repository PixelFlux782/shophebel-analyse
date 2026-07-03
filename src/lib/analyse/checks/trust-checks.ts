import { load } from "cheerio";

import { CheckContext, CheckResult, Finding } from "@/types/analysis";

const TRUST_KEYWORDS = [
  "versand",
  "rueckgabe",
  "ruecksendung",
  "sichere zahlung",
  "kundenservice",
  "bewertungen",
  "trusted shops",
];

function textIncludes(text: string, candidates: string[]) {
  return candidates.some((candidate) => text.includes(candidate));
}

function pushFinding(findings: Finding[], finding: Finding) {
  findings.push(finding);
}

export function runTrustChecks(html: string, context: CheckContext): CheckResult {
  const $ = load(html);
  const findings: Finding[] = [];
  let score = 100;

  const pageText = $("body").text().replace(/\s+/g, " ").toLowerCase();
  const linkText = $("a")
    .toArray()
    .map((element) => `${$(element).text()} ${$(element).attr("href") ?? ""}`.toLowerCase())
    .join(" ");

  const hasHttps = context.pageUrl.startsWith("https://");
  const hasImpressum = textIncludes(`${pageText} ${linkText}`, ["impressum", "legal"]);
  const hasPrivacy = textIncludes(`${pageText} ${linkText}`, ["datenschutz", "privacy"]);
  const hasContact = textIncludes(`${pageText} ${linkText}`, ["kontakt", "contact", "support"]);
  const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(pageText);
  const hasPhone = /(\+\d{1,3}[\s/-]?)?(\(?\d{2,5}\)?[\s/-]?)\d{3,}/.test(pageText);
  const matchingTrustKeywords = TRUST_KEYWORDS.filter((keyword) => pageText.includes(keyword));

  if (hasHttps) {
    pushFinding(findings, {
      category: "trust",
      status: "success",
      title: "Die Seite wird sicher geladen",
      description: "Besucher sehen eine verschlüsselte Verbindung. Das wirkt vertrauter und professioneller.",
      priority: "low",
    });
  } else {
    score -= 20;
    pushFinding(findings, {
      category: "trust",
      status: "error",
      title: "Die Seite wird nicht sicher geladen",
      description: "Die Verbindung wirkt für Besucher weniger vertrauenswürdig und kann vor Anfragen oder Käufen verunsichern.",
      priority: "high",
    });
  }

  if (hasImpressum) {
    pushFinding(findings, {
      category: "trust",
      status: "success",
      title: "Impressum erkennbar",
      description: "Besucher finden einen rechtlichen Ansprechpartner. Das staerkt Seriositaet.",
      priority: "low",
    });
  } else {
    score -= 16;
    pushFinding(findings, {
      category: "trust",
      status: "error",
      title: "Ein Impressum ist nicht klar auffindbar",
      description: "Besucher finden keinen klaren rechtlichen Ansprechpartner. Das kann Vertrauen kosten.",
      priority: "high",
    });
  }

  if (hasPrivacy) {
    pushFinding(findings, {
      category: "trust",
      status: "success",
      title: "Datenschutzseite erkennbar",
      description: "Besucher finden Informationen zum Umgang mit ihren Daten.",
      priority: "low",
    });
  } else {
    score -= 14;
    pushFinding(findings, {
      category: "trust",
      status: "error",
      title: "Datenschutz ist nicht klar auffindbar",
      description: "Besucher bekommen kein klares Signal, wie mit ihren Daten umgegangen wird.",
      priority: "high",
    });
  }

  if (hasContact) {
    pushFinding(findings, {
      category: "trust",
      status: "success",
      title: "Kontakt ist erkennbar",
      description: "Besucher finden einen Weg, Rückfragen zu stellen oder Kontakt aufzunehmen.",
      priority: "low",
    });
  } else {
    score -= 12;
    pushFinding(findings, {
      category: "trust",
      status: "warning",
      title: "Kontakt ist nicht schnell genug sichtbar",
      description: "Interessierte Besucher finden nicht sofort, wie sie dich erreichen können.",
      priority: "high",
    });
  }

  if (hasEmail || hasPhone) {
    pushFinding(findings, {
      category: "trust",
      status: "success",
      title: "Direkte Kontaktangabe vorhanden",
      description: "E-Mail oder Telefon sind direkt erkennbar. Das senkt die Hemmschwelle für Rückfragen.",
      priority: "low",
    });
  } else {
    score -= 10;
    pushFinding(findings, {
      category: "trust",
      status: "warning",
      title: "Direkte Kontaktangaben fehlen",
      description: "Besucher sehen keine E-Mail-Adresse oder Telefonnummer. Das kann bei Rückfragen bremsen.",
      priority: "medium",
    });
  }

  if (matchingTrustKeywords.length >= 3) {
    pushFinding(findings, {
      category: "trust",
      status: "success",
      title: "Mehrere Vertrauenssignale sind sichtbar",
      description: `Erkannte Vertrauenssignale: ${matchingTrustKeywords.join(", ")}.`,
      priority: "low",
    });
  } else if (matchingTrustKeywords.length > 0) {
    score -= 6;
    pushFinding(findings, {
      category: "trust",
      status: "warning",
      title: "Es gibt nur wenige Vertrauenssignale",
      description: `Einige Hinweise sind sichtbar (${matchingTrustKeywords.join(", ")}), aber Besucher bekommen noch zu wenig Sicherheit.`,
      priority: "medium",
    });
  } else {
    score -= 14;
    pushFinding(findings, {
      category: "trust",
      status: "warning",
      title: "Zu wenig Vertrauen vor dem Kauf oder der Anfrage",
      description: "Bewertungen, sichere Zahlung, Service, Rueckgabe oder andere Vertrauensbelege sind kaum sichtbar.",
      priority: "high",
    });
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    findings,
  };
}
