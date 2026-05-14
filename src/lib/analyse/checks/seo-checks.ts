import { load } from "cheerio";

import { CheckResult, Finding } from "@/types/analysis";

function pushFinding(findings: Finding[], finding: Finding) {
  findings.push(finding);
}

export function runSeoChecks(html: string): CheckResult {
  const $ = load(html);
  const findings: Finding[] = [];
  let score = 100;

  const title = $("title").first().text().trim();
  const metaDescription = $('meta[name="description"]').attr("content")?.trim() ?? "";
  const h1Count = $("h1").length;
  const h2Count = $("h2").length;
  const lang = $("html").attr("lang")?.trim();
  const canonical = $('link[rel="canonical"]').attr("href")?.trim();
  const ogTitle = $('meta[property="og:title"], meta[name="og:title"]').attr("content")?.trim();
  const ogDescription = $('meta[property="og:description"], meta[name="og:description"]')
    .attr("content")
    ?.trim();
  const images = $("img").toArray();
  const imagesWithoutAlt = images.filter((image) => {
    const alt = $(image).attr("alt");
    return !alt || alt.trim().length === 0;
  }).length;

  if (!title) {
    score -= 18;
    pushFinding(findings, {
      category: "seo",
      status: "error",
      title: "Deine Seite hat keinen klaren Namen für Suchergebnisse",
      description:
        "Google, KI-Systeme und Besucher sehen keinen eindeutigen Seitennamen. Dadurch bleibt unklar, wofür die Seite steht.",
      priority: "high",
    });
  } else if (title.length < 20 || title.length > 65) {
    score -= 8;
    pushFinding(findings, {
      category: "seo",
      status: "warning",
      title: "Der Seitenname wirkt in Suchergebnissen nicht ideal",
      description: `Der Seitenname hat ${title.length} Zeichen. Er sollte kurz genug für Suchergebnisse sein und trotzdem Angebot und Nutzen klar machen.`,
      priority: "medium",
    });
  } else {
    pushFinding(findings, {
      category: "seo",
      status: "success",
      title: "Der Seitenname ist klar genug",
      description: "Der Seitenname ist vorhanden und wirkt für Suchergebnisse gut nutzbar.",
      priority: "low",
    });
  }

  if (!metaDescription) {
    score -= 16;
    pushFinding(findings, {
      category: "seo",
      status: "error",
      title: "Google und KI bekommen keine klare Kurzbeschreibung",
      description:
        "Google und KI-Systeme bekommen keine klare Kurzbeschreibung deiner Seite. Dadurch ist schwerer erkennbar, warum jemand klicken oder weiterlesen sollte.",
      priority: "high",
    });
  } else if (metaDescription.length < 120 || metaDescription.length > 170) {
    score -= 8;
    pushFinding(findings, {
      category: "seo",
      status: "warning",
      title: "Die Kurzbeschreibung wirkt nicht ideal",
      description: `Die Kurzbeschreibung hat ${metaDescription.length} Zeichen. Sie sollte Nutzen, Angebot und Klickgrund klar und kompakt vermitteln.`,
      priority: "medium",
    });
  } else {
    pushFinding(findings, {
      category: "seo",
      status: "success",
      title: "Die Kurzbeschreibung ist gut vorbereitet",
      description: "Die Seite hat eine klare Kurzbeschreibung für Suchergebnisse und KI-Systeme.",
      priority: "low",
    });
  }

  if (h1Count === 1) {
    pushFinding(findings, {
      category: "seo",
      status: "success",
      title: "Die Hauptbotschaft ist klar gesetzt",
      description: "Die Startseite hat eine eindeutige Hauptüberschrift.",
      priority: "low",
    });
  } else if (h1Count === 0) {
    score -= 14;
    pushFinding(findings, {
      category: "seo",
      status: "error",
      title: "Die Hauptbotschaft ist nicht eindeutig",
      description: "Besucher, Google und KI-Systeme erkennen keine klare Hauptaussage der Seite.",
      priority: "high",
    });
  } else {
    score -= 10;
    pushFinding(findings, {
      category: "seo",
      status: "warning",
      title: "Die Seite sendet mehrere Hauptbotschaften",
      description: `Es wurden ${h1Count} Hauptüberschriften gefunden. Das kann Angebot und Priorität unklar wirken lassen.`,
      priority: "medium",
    });
  }

  if (h2Count > 0) {
    pushFinding(findings, {
      category: "seo",
      status: "success",
      title: "Die Inhalte sind in Abschnitte gegliedert",
      description: `Die Seite nutzt ${h2Count} erkennbare Abschnittsüberschriften.`,
      priority: "low",
    });
  } else {
    score -= 8;
    pushFinding(findings, {
      category: "seo",
      status: "warning",
      title: "Der Seite fehlen klare Abschnitte",
      description: "Wichtige Inhalte sind nicht gut genug in erkennbare Bereiche gegliedert.",
      priority: "medium",
    });
  }

  if (lang) {
    pushFinding(findings, {
      category: "seo",
      status: "success",
      title: "Die Seitensprache ist klar markiert",
      description: `Die Sprache der Seite ist für Browser und Systeme markiert (${lang}).`,
      priority: "low",
    });
  } else {
    score -= 6;
    pushFinding(findings, {
      category: "seo",
      status: "warning",
      title: "Die Seitensprache ist nicht klar markiert",
      description: "Browser, Google und Hilfssysteme bekommen kein klares Signal zur Sprache der Seite.",
      priority: "medium",
    });
  }

  if (canonical) {
    pushFinding(findings, {
      category: "seo",
      status: "success",
      title: "Google erkennt die Hauptversion der Seite",
      description: "Die Seite gibt Suchsystemen ein klares Signal, welche Version als Hauptseite gelten soll.",
      priority: "low",
    });
  } else {
    score -= 7;
    pushFinding(findings, {
      category: "seo",
      status: "warning",
      title: "Google bekommt kein klares Signal zur Hauptversion",
      description: "Wenn mehrere Varianten derselben Seite existieren, kann das die Einordnung erschweren.",
      priority: "medium",
    });
  }

  if (ogTitle) {
    pushFinding(findings, {
      category: "seo",
      status: "success",
      title: "Geteilte Links haben einen klaren Titel",
      description: "Wenn die Seite geteilt wird, kann ein passender Linktitel angezeigt werden.",
      priority: "low",
    });
  } else {
    score -= 5;
    pushFinding(findings, {
      category: "seo",
      status: "warning",
      title: "Geteilte Links wirken weniger kontrolliert",
      description: "Wenn die Seite geteilt wird, fehlt ein gezielt formulierter Linktitel.",
      priority: "low",
    });
  }

  if (ogDescription) {
    pushFinding(findings, {
      category: "seo",
      status: "success",
      title: "Geteilte Links haben eine Kurzbeschreibung",
      description: "Wenn die Seite geteilt wird, kann eine passende Kurzbeschreibung erscheinen.",
      priority: "low",
    });
  } else {
    score -= 5;
    pushFinding(findings, {
      category: "seo",
      status: "warning",
      title: "Geteilte Links bekommen keine klare Kurzbeschreibung",
      description: "In Linkvorschauen fehlt ein kontrollierter kurzer Text zum Nutzen der Seite.",
      priority: "low",
    });
  }

  if (images.length === 0) {
    score -= 5;
    pushFinding(findings, {
      category: "seo",
      status: "warning",
      title: "Keine Bilder gefunden",
      description: "Die Startseite enthält keine Bilder und verschenkt visuelle Signale.",
      priority: "medium",
    });
  } else {
    pushFinding(findings, {
      category: "seo",
      status: "success",
      title: "Bilder vorhanden",
      description: `Es wurden ${images.length} Bilder auf der Startseite erkannt.`,
      priority: "low",
    });
  }

  if (imagesWithoutAlt > 0) {
    score -= Math.min(15, imagesWithoutAlt * 3);
    pushFinding(findings, {
      category: "seo",
      status: imagesWithoutAlt >= 3 ? "error" : "warning",
      title: "Bilder erklären sich nicht gut genug",
      description: `${imagesWithoutAlt} Bild${imagesWithoutAlt === 1 ? "" : "er"} werden für Google, KI und Screenreader nicht ausreichend beschrieben.`,
      priority: imagesWithoutAlt >= 3 ? "high" : "medium",
    });
  } else if (images.length > 0) {
    pushFinding(findings, {
      category: "seo",
      status: "success",
      title: "Bilder sind ausreichend beschrieben",
      description: "Die erkannten Bilder liefern beschreibende Hinweise für Google, KI und Screenreader.",
      priority: "low",
    });
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    findings,
  };
}
