import { load } from "cheerio";

import { CheckContext, CheckResult, Finding } from "@/types/analysis";

function pushFinding(findings: Finding[], finding: Finding) {
  findings.push(finding);
}

export function runUxChecks(html: string, context: CheckContext): CheckResult {
  const $ = load(html);
  const findings: Finding[] = [];
  let score = 100;

  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const bodyWordCount = bodyText.length > 0 ? bodyText.split(" ").length : 0;
  const renderedWordCount = Math.round((context.pageSignals?.visibleTextLength ?? 0) / 6);
  const wordCount = Math.max(bodyWordCount, renderedWordCount);
  const headingCount = $("h1, h2, h3").length;
  const structuredHeadings = $("h2, h3").length;
  const imageCount = Math.max($("img").length, context.pageSignals?.imageCount ?? 0);
  const baseHostname = new URL(context.pageUrl).hostname;
  const internalLinkCount = $("a[href]")
    .toArray()
    .filter((element) => {
      const href = $(element).attr("href");

      if (!href) {
        return false;
      }

      try {
        const resolved = new URL(href, context.pageUrl);
        return /^https?:$/i.test(resolved.protocol) && resolved.hostname === baseHostname;
      } catch {
        return false;
      }
    }).length;

  if (wordCount >= 250) {
    pushFinding(findings, {
      category: "ux",
      status: "success",
      title: "Ausreichend Textinhalt vorhanden",
      description: `Die Startseite enthaelt rund ${wordCount} Woerter und wirkt nicht zu duenn.`,
      priority: "low",
    });
  } else if (wordCount >= 120) {
    score -= 8;
    pushFinding(findings, {
      category: "ux",
      status: "warning",
      title: "Textmenge ist eher knapp",
      description: `Mit rund ${wordCount} Woertern ist der sichtbare Inhalt eher kurz.`,
      priority: "medium",
    });
  } else {
    score -= 20;
    pushFinding(findings, {
      category: "ux",
      status: "error",
      title: "Sehr wenig Content auf der Startseite",
      description: `Es wurden nur rund ${wordCount} Woerter erkannt. Die Seite wirkt dadurch schnell zu leer.`,
      priority: "high",
    });
  }

  if (headingCount >= 3 && structuredHeadings > 0) {
    pushFinding(findings, {
      category: "ux",
      status: "success",
      title: "Headings sind strukturiert",
      description: "Die Seite nutzt mehrere Ueberschriftenebenen fuer Orientierung.",
      priority: "low",
    });
  } else {
    score -= 14;
    pushFinding(findings, {
      category: "ux",
      status: "warning",
      title: "Wenig visuelle Struktur durch Headings",
      description: "Die Seite hat nur wenige oder kaum gegliederte Ueberschriften.",
      priority: "medium",
    });
  }

  if (imageCount > 0) {
    pushFinding(findings, {
      category: "ux",
      status: "success",
      title: "Visuelle Elemente vorhanden",
      description: `Es wurden ${imageCount} Bilder erkannt.`,
      priority: "low",
    });
  } else {
    score -= 10;
    pushFinding(findings, {
      category: "ux",
      status: "warning",
      title: "Keine visuellen Elemente gefunden",
      description: "Ohne Bilder wirkt die Startseite schnell textlastig oder unvollstaendig.",
      priority: "medium",
    });
  }

  if (internalLinkCount >= 4) {
    pushFinding(findings, {
      category: "ux",
      status: "success",
      title: "Interne Navigation ist vorhanden",
      description: `Es wurden ${internalLinkCount} interne Links erkannt.`,
      priority: "low",
    });
  } else if (internalLinkCount >= 1) {
    score -= 8;
    pushFinding(findings, {
      category: "ux",
      status: "warning",
      title: "Wenige interne Links",
      description: `Es wurden nur ${internalLinkCount} interne Links erkannt.`,
      priority: "medium",
    });
  } else {
    score -= 16;
    pushFinding(findings, {
      category: "ux",
      status: "error",
      title: "Keine internen Links gefunden",
      description: "Die Startseite bietet kaum erkennbare Navigationspfade zu weiteren Bereichen.",
      priority: "high",
    });
  }

  if (wordCount < 120 && imageCount === 0 && structuredHeadings === 0) {
    score -= 12;
    pushFinding(findings, {
      category: "ux",
      status: "error",
      title: "Seite wirkt sehr leer",
      description: "Sehr wenig Text, keine Bilder und kaum Struktur lassen die Startseite duenn wirken.",
      priority: "high",
    });
  } else if (structuredHeadings === 0 || imageCount === 0) {
    score -= 6;
    pushFinding(findings, {
      category: "ux",
      status: "warning",
      title: "Visuelle Struktur ist ausbaufaehig",
      description: "Die Startseite koennte Inhalte klarer gliedern oder visueller unterstuetzen.",
      priority: "medium",
    });
  } else {
    pushFinding(findings, {
      category: "ux",
      status: "success",
      title: "Seite wirkt ausreichend gefuellt",
      description: "Text, Struktur und visuelle Elemente ergeben zusammen eine solide Basis.",
      priority: "low",
    });
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    findings,
  };
}
