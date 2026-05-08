import { load } from "cheerio";

import {
  AnalysisResultCategories,
  AuditCheckStatus,
  CheckContext,
  Recommendation,
  RevenueBlocker,
  ScoreBlock,
  VisualMap,
} from "@/types/analysis";
import { clampScore } from "@/lib/analyse/scoring";

type AuditCheck = ScoreBlock["checks"][number];

interface BuildAuditCategoriesInput {
  html: string;
  finalUrl: string;
  context: CheckContext;
  loadTimeMs?: number;
  visualMap?: VisualMap;
  screenshotsAvailable: boolean;
  robotsTxt?: string;
}

const STATUS_POINTS: Record<AuditCheckStatus, number | null> = {
  good: 100,
  warning: 62,
  critical: 18,
  unknown: null,
  not_checked: null,
};

function businessMessage(title: string, status: AuditCheckStatus, message: string) {
  const messages: Partial<Record<string, Partial<Record<AuditCheckStatus, string>>>> = {
    "Suchergebnis-Klarheit": {
      good: "Seitenname und Kurzbeschreibung wirken fuer Besucher, Google und KI-Systeme grundsaetzlich klar.",
      warning:
        "Seitenname oder Kurzbeschreibung koennten klarer zeigen, was du anbietest und warum jemand klicken sollte.",
      critical:
        "Google und KI-Systeme bekommen keine klare Kurzbeschreibung oder keinen eindeutigen Namen deiner Seite.",
    },
    "Klarheit der Seitenbotschaft": {
      good: "Hauptbotschaft und Abschnittsthemen sind erkennbar.",
      warning: "Die Seite fuehrt Besucher noch nicht klar genug durch die wichtigsten Botschaften.",
      critical: "Die Seite hat keine eindeutige Hauptbotschaft. Besucher verstehen den Kernnutzen dadurch spaeter.",
    },
    Bildverstaendnis: {
      good: "Die erkannten Bilder sind fuer Google, KI und Screenreader ausreichend beschrieben.",
      warning: "Einige Bilder erklaeren sich fuer Google, KI und Screenreader nicht gut genug.",
      critical: "Viele Bilder bleiben fuer Google, KI und Screenreader unklar. Dadurch geht Kontext verloren.",
      unknown: "Es wurden keine Bilder gefunden; Bildbeschreibungen konnten deshalb nicht bewertet werden.",
    },
    "Auffindbarkeit der Hauptseite": {
      good: "Suchsysteme bekommen ein klares Signal zur Hauptversion der Seite.",
      warning: "Google bekommt kein klares Signal, welche Seitenversion die Hauptversion ist.",
      critical: "Die Seite sendet ein Signal, dass sie nicht in Suchergebnissen erscheinen soll.",
    },
    "Mobile Darstellung": {
      good: "Die Seite ist grundsaetzlich fuer mobile Darstellung vorbereitet.",
      critical:
        "Auf kleinen Bildschirmen kann die Seite falsch oder unbequem wirken, weil die mobile Darstellung nicht sauber markiert ist.",
    },
    "Sicheres Laden": {
      good: "Die Seite wird sicher verschluesselt geladen.",
      critical: "Die Seite wird nicht sicher verschluesselt geladen. Das kann Vertrauen kosten.",
    },
    Ladegefuehl: {
      good: "Die Seite reagiert beim ersten Abruf schnell genug.",
      warning: "Die Seite braucht spuerbar Zeit, bis sie geladen ist. Das kann ungeduldige Besucher kosten.",
      critical:
        "Die Seite laedt sehr langsam. Besucher koennen abspringen, bevor sie Angebot oder Vertrauen sehen.",
      not_checked: "Fuer diesen Lauf liegt keine verlaessliche Messung zum Ladegefuehl vor.",
    },
    "Stabilitaet beim Laden": {
      not_checked: "Ob sich Elemente beim Laden verschieben, wurde in diesem Lauf nicht als Felddaten gemessen.",
    },
    Vertrauensbelege: {
      good: "Bewertungen, Siegel oder Zahlungsarten geben Besuchern sichtbare Sicherheit.",
      warning: "Einige Vertrauensbelege sind sichtbar, aber noch nicht stark genug fuer schnelle Sicherheit.",
      critical: "Bewertungen, sichere Zahlung, Siegel oder Serviceversprechen sind kaum sichtbar.",
    },
    "Naechster Schritt": {
      good: "Besucher erkennen gut, was sie als Naechstes tun sollen.",
      warning: "Der naechste Schritt ist sichtbar, koennte aber klarer und oefter gefuehrt werden.",
      critical: "Besucher erkennen nicht schnell genug, was sie als Naechstes tun sollen.",
    },
    "Einfacher Anfrageweg": {
      good: "Ein Anfrage- oder Kontaktweg ist auf der Seite erkennbar.",
      warning: "Der Anfrageweg ist noch nicht einfach genug sichtbar.",
    },
    "Visuelle Seitenpruefung": {
      good: "Eine echte Seitenansicht wurde erfasst und kann fuer visuelle Hinweise genutzt werden.",
      not_checked: "Es gibt in diesem Lauf keine verlaessliche Seitenansicht fuer visuelle Hinweise.",
    },
    Blickfuehrung: {
      good: "Ueberschriften, Buttons und Bilder geben Besuchern grundsaetzlich Orientierung.",
      warning: "Die Seite fuehrt den Blick noch nicht klar genug zu Angebot, Vertrauen und naechstem Schritt.",
      not_checked: "Die visuelle Blickfuehrung konnte in diesem Lauf nicht verlaesslich geprueft werden.",
    },
    "Lesbarkeit und Inhaltstiefe": {
      good: "Die Seite liefert genug Inhalt, um wichtige Fragen zu beantworten.",
      warning: "Die Seite beantwortet noch nicht genug Fragen, damit Besucher sicher entscheiden koennen.",
      critical: "Die Seite wirkt inhaltlich zu duenn. Wichtige Kauf- und Vertrauensfragen bleiben offen.",
    },
    "Verstaendliche Daten fuer Google und KI": {
      good: "Die Website liefert zusaetzliche maschinenlesbare Hinweise. Das hilft bei der Einordnung.",
      warning:
        "Google und KI-Systeme bekommen noch zu wenig klar ausgezeichnete Informationen zu Angebot, Unternehmen oder Fragen.",
    },
    "Kundenfragen als Antworten": {
      good: "Kundenfragen werden als klare Antworten genutzt. Das hilft Menschen und KI-Systemen.",
      warning: "Wichtige Kundenfragen bleiben noch zu wenig sichtbar beantwortet.",
    },
    "Regeln fuer KI-Systeme": {
      good: "Die Regeln fuer KI- oder Content-Systeme sind bewusst erkennbar.",
      warning: "Einige KI- oder Content-Systeme koennten am Abruf deiner Inhalte gehindert werden.",
      unknown:
        "Es wurden keine klaren Regeln fuer KI-Systeme erkannt. Das ist nicht automatisch schlecht, sollte aber bewusst entschieden werden.",
      not_checked:
        "Die Regeln fuer Such- und KI-Systeme konnten in diesem Lauf nicht verlaesslich geprueft werden.",
    },
    "Klare Themenstruktur": {
      good: "Hauptthema und Unterthemen sind fuer Menschen, Google und KI-Systeme gut erkennbar.",
      warning: "Die Themenstruktur ist noch nicht klar genug. KI-Systeme koennen dein Angebot schwerer einordnen.",
      critical: "Die Seite hat keine eindeutige Hauptbotschaft. KI-Systeme koennen dein Hauptthema schwerer einordnen.",
    },
  };

  return messages[title]?.[status] ?? message;
}

function createCheck(title: string, status: AuditCheckStatus, message: string): AuditCheck {
  return { title, status, message: businessMessage(title, status, message) };
}

function scoreChecks(checks: AuditCheck[]) {
  const scored = checks.flatMap((check) => {
    const points = STATUS_POINTS[check.status];
    return points === null ? [] : [points];
  });

  if (scored.length === 0) {
    return 0;
  }

  return clampScore(scored.reduce((sum, score) => sum + score, 0) / scored.length);
}

function summarize(label: string, checks: AuditCheck[]) {
  const critical = checks.filter((check) => check.status === "critical").length;
  const warnings = checks.filter((check) => check.status === "warning").length;
  const notChecked = checks.filter(
    (check) => check.status === "not_checked" || check.status === "unknown",
  ).length;

  if (critical > 0) {
    return `${label}: ${critical} kritische Punkte sollten zuerst geprüft werden.`;
  }

  if (warnings > 0) {
    return `${label}: solide Basis mit ${warnings} Warnhinweis${warnings === 1 ? "" : "en"}.`;
  }

  if (notChecked === checks.length) {
    return `${label}: konnte mit den verfügbaren Daten noch nicht belastbar geprüft werden.`;
  }

  return `${label}: die geprüften Signale wirken stabil.`;
}

function createScoreBlock(label: string, checks: AuditCheck[]): ScoreBlock {
  return {
    score: scoreChecks(checks),
    label,
    summary: summarize(label, checks),
    checks,
  };
}

function hasStructuredData($: ReturnType<typeof load>) {
  return $('script[type="application/ld+json"]').length > 0 || $("[itemscope]").length > 0;
}

function hasFaqSchema($: ReturnType<typeof load>) {
  const jsonLdText = $('script[type="application/ld+json"]')
    .toArray()
    .map((element) => $(element).text().toLowerCase())
    .join(" ");
  return jsonLdText.includes("faqpage") || jsonLdText.includes('"@type":"faq');
}

function hasAboutLink($: ReturnType<typeof load>, pageUrl: string) {
  return $("a[href]")
    .toArray()
    .some((element) => {
      const href = $(element).attr("href")?.toLowerCase() ?? "";
      const text = $(element).text().toLowerCase();

      if (/about|ueber-uns|uber-uns|unternehmen|team|firma|wir-ueber-uns/.test(`${href} ${text}`)) {
        return true;
      }

      try {
        const resolved = new URL(href, pageUrl);
        return /about|ueber-uns|uber-uns|unternehmen|team|firma|wir-ueber-uns/.test(
          resolved.pathname.toLowerCase(),
        );
      } catch {
        return false;
      }
    });
}

function hasFaqContent($: ReturnType<typeof load>, text: string) {
  const headingText = $("h1, h2, h3")
    .toArray()
    .map((element) => $(element).text().toLowerCase())
    .join(" ");
  const faqLikeQuestions = (text.match(/\?/g) ?? []).length;

  return /faq|haeufige fragen|haufige fragen|fragen und antworten|q&a/.test(headingText) || faqLikeQuestions >= 3;
}

function getRobotsAiCrawlerStatus(robotsTxt?: string): {
  status: AuditCheckStatus;
  message: string;
} {
  if (!robotsTxt) {
    return {
      status: "not_checked",
      message:
        "Die Regeln fuer Such- und KI-Systeme konnten in diesem Lauf nicht verlaesslich geprueft werden.",
    };
  }

  const normalized = robotsTxt.toLowerCase();
  const aiCrawlerNames = [
    "gptbot",
    "chatgpt-user",
    "anthropic-ai",
    "claudebot",
    "perplexitybot",
    "ccbot",
    "google-extended",
  ];
  const mentioned = aiCrawlerNames.filter((name) => normalized.includes(name));
  const blocked = mentioned.filter((name) => {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const block = new RegExp(`user-agent:\\s*${escaped}[\\s\\S]{0,240}disallow:\\s*/`, "i");
    return block.test(robotsTxt);
  });

  if (blocked.length > 0) {
    return {
      status: "warning",
      message: `Einige KI- oder Content-Systeme koennten am Abruf deiner Inhalte gehindert werden: ${blocked.join(", ")}.`,
    };
  }

  if (mentioned.length > 0) {
    return {
      status: "good",
      message: `Die Seite enthaelt erkennbare Regeln fuer KI- oder Content-Systeme ohne pauschale Blockade: ${mentioned.join(", ")}.`,
    };
  }

  return {
    status: "unknown",
    message:
      "Es wurden keine klaren Regeln fuer KI-Systeme erkannt. Das ist nicht automatisch schlecht, sollte aber bewusst entschieden werden.",
  };
}

export function buildAuditCategories(input: BuildAuditCategoriesInput): AnalysisResultCategories {
  const $ = load(input.html);
  const bodyText = $("body").text().replace(/\s+/g, " ").toLowerCase();
  const linkText = $("a")
    .toArray()
    .map((element) => `${$(element).text()} ${$(element).attr("href") ?? ""}`.toLowerCase())
    .join(" ");
  const combinedText = `${bodyText} ${linkText}`;
  const title = $("title").first().text().trim();
  const description = $('meta[name="description"]').attr("content")?.trim() ?? "";
  const h1Count = $("h1").length;
  const h2Count = $("h2").length;
  const viewport = $('meta[name="viewport"]').attr("content")?.trim();
  const imageCount = $("img").length;
  const imagesWithoutAlt = $("img")
    .toArray()
    .filter((image) => {
      const alt = $(image).attr("alt");
      return !alt || alt.trim().length === 0;
    }).length;
  const structuredData = hasStructuredData($);
  const faqSchema = hasFaqSchema($);
  const faqContent = hasFaqContent($, bodyText);
  const aboutLink = hasAboutLink($, input.finalUrl);
  const ctaMatches = ["kaufen", "bestellen", "anfragen", "starten", "testen", "angebot", "jetzt"].filter(
    (keyword) => combinedText.includes(keyword),
  );
  const trustMatches = ["bewertungen", "trusted shops", "siegel", "paypal", "klarna", "visa", "mastercard"].filter(
    (keyword) => combinedText.includes(keyword),
  );
  const hasContact = /kontakt|contact|support/.test(combinedText);
  const hasImpressum = /impressum|legal/.test(combinedText);
  const hasPrivacy = /datenschutz|privacy/.test(combinedText);
  const hasHttps = input.finalUrl.startsWith("https://");
  const companyDescriptionSignals = [
    title,
    description,
    $('meta[property="og:site_name"], meta[name="application-name"]').attr("content") ?? "",
    $("h1").first().text() ?? "",
  ]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  const hasClearCompanyDescription =
    companyDescriptionSignals.length >= 80 ||
    /wir sind|seit|unternehmen|agentur|shop|manufaktur|praxis|betrieb|dienstleister|anbieter/.test(bodyText);
  const productServiceSignals = [
    "produkt",
    "produkte",
    "shop",
    "leistung",
    "leistungen",
    "service",
    "angebot",
    "preise",
    "beratung",
    "termin",
    "kaufen",
    "bestellen",
  ].filter((keyword) => combinedText.includes(keyword));
  const localSignals = [
    /\b\d{5}\b/.test(bodyText) ? "PLZ" : "",
    /standort|adresse|anfahrt|oeffnungszeiten|öffnungszeiten|google maps|in der naehe|in der nähe/.test(combinedText)
      ? "Standortbezug"
      : "",
    $("address").length > 0 ? "address-Element" : "",
  ].filter(Boolean);
  const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(bodyText);
  const hasPhone = /(\+\d{1,3}[\s/-]?)?(\(?\d{2,5}\)?[\s/-]?)\d{3,}/.test(bodyText);
  const robotsAiStatus = getRobotsAiCrawlerStatus(input.robotsTxt);

  const seoChecks = [
    createCheck(
      "Suchergebnis-Klarheit",
      !title || !description
        ? "critical"
        : title.length < 20 || title.length > 65 || description.length < 120 || description.length > 170
          ? "warning"
          : "good",
      !title
        ? "Deine Seite hat keinen klaren Namen fuer Suchergebnisse."
        : !description
          ? "Google und KI-Systeme bekommen keine klare Kurzbeschreibung deiner Seite."
          : `Title (${title.length} Zeichen) und Description (${description.length} Zeichen) wurden geprüft.`,
    ),
    createCheck(
      "Klarheit der Seitenbotschaft",
      h1Count === 1 && h2Count > 0 ? "good" : h1Count === 0 ? "critical" : "warning",
      `Gefunden: ${h1Count} H1 und ${h2Count} H2.`,
    ),
    createCheck(
      "Bildverstaendnis",
      imageCount === 0 ? "unknown" : imagesWithoutAlt === 0 ? "good" : imagesWithoutAlt >= 3 ? "critical" : "warning",
      imageCount === 0
        ? "Es wurden keine Bilder gefunden; Alt-Texte konnten deshalb nicht bewertet werden."
        : `${imagesWithoutAlt} von ${imageCount} Bildern haben keinen Alt-Text.`,
    ),
    createCheck(
      "Auffindbarkeit der Hauptseite",
      $("meta[name='robots']").attr("content")?.toLowerCase().includes("noindex")
        ? "critical"
        : $("link[rel='canonical']").length > 0
          ? "good"
          : "warning",
      $("meta[name='robots']").attr("content")?.toLowerCase().includes("noindex")
        ? "Robots-Meta enthält noindex."
        : $("link[rel='canonical']").length > 0
          ? "Canonical ist vorhanden."
          : "Canonical wurde nicht gefunden.",
    ),
  ];

  const performanceChecks = [
    createCheck(
      "Mobile Darstellung",
      viewport ? "good" : "critical",
      viewport ? `Viewport-Meta vorhanden: ${viewport}.` : "Viewport-Meta fehlt.",
    ),
    createCheck(
      "Sicheres Laden",
      hasHttps ? "good" : "critical",
      hasHttps ? "Die finale URL nutzt HTTPS." : "Die finale URL nutzt kein HTTPS.",
    ),
    createCheck(
      "Ladegefuehl",
      input.loadTimeMs === undefined
        ? "not_checked"
        : input.loadTimeMs <= 1800
          ? "good"
          : input.loadTimeMs <= 3500
            ? "warning"
            : "critical",
      input.loadTimeMs === undefined
        ? "Für diesen Lauf liegt keine belastbare Ladezeitmessung vor."
        : `Gemessene Abrufzeit: ${input.loadTimeMs} ms.`,
    ),
    createCheck(
      "Stabilitaet beim Laden",
      "not_checked",
      "Core-Web-Vitals wurden nicht als Felddaten gemessen und werden deshalb nicht bewertet.",
    ),
  ];

  const trustChecks = [
    createCheck("Impressum", hasImpressum ? "good" : "critical", hasImpressum ? "Impressum ist erkennbar." : "Kein Impressum-Hinweis gefunden."),
    createCheck("Datenschutz", hasPrivacy ? "good" : "critical", hasPrivacy ? "Datenschutz ist erkennbar." : "Kein Datenschutz-Hinweis gefunden."),
    createCheck("Kontaktvertrauen", hasContact ? "good" : "warning", hasContact ? "Kontakt ist sichtbar." : "Kontakt wurde nicht klar erkannt."),
    createCheck(
      "Vertrauensbelege",
      trustMatches.length >= 2 ? "good" : trustMatches.length === 1 ? "warning" : "critical",
      trustMatches.length > 0
        ? `Erkannte Trust-Signale: ${trustMatches.join(", ")}.`
        : "Keine klaren Bewertungs-, Siegel- oder Zahlungsarten-Signale erkannt.",
    ),
  ];

  const conversionChecks = [
    createCheck(
      "Naechster Schritt",
      ctaMatches.length >= 2 || (input.context.pageSignals?.visibleCtaTextMatches ?? 0) >= 2
        ? "good"
        : ctaMatches.length === 1 || (input.context.pageSignals?.visibleButtons ?? 0) > 0
          ? "warning"
          : "critical",
      `Erkannte CTA-Signale: ${Math.max(ctaMatches.length, input.context.pageSignals?.visibleCtaTextMatches ?? 0)}.`,
    ),
    createCheck(
      "Einfacher Anfrageweg",
      (input.context.pageSignals?.formFieldCount ?? $("input, textarea, select").length) > 0 ? "good" : "warning",
      (input.context.pageSignals?.formFieldCount ?? $("input, textarea, select").length) > 0
        ? "Formularfelder wurden erkannt."
        : "Keine Formularfelder erkannt.",
    ),
    createCheck(
      "Angebotsklarheit",
      /preis|angebot|kostenlos|leistung|paket|produkt/.test(combinedText) ? "good" : "warning",
      /preis|angebot|kostenlos|leistung|paket|produkt/.test(combinedText)
        ? "Angebots- oder Leistungsbegriffe sind vorhanden."
        : "Angebots- oder Leistungsbezug wirkt schwach.",
    ),
  ];

  const designChecks = [
    createCheck(
      "Visuelle Seitenpruefung",
      input.screenshotsAvailable ? "good" : "not_checked",
      input.screenshotsAvailable
        ? "Ein Screenshot wurde erzeugt und kann visuell genutzt werden."
        : "Kein Screenshot verfügbar; visuelle Bewertung wird nicht simuliert.",
    ),
    createCheck(
      "Blickfuehrung",
      input.visualMap
        ? input.visualMap.headings.length > 0 && input.visualMap.buttons.length > 0
          ? "good"
          : "warning"
        : "not_checked",
      input.visualMap
        ? `Visuelle Map: ${input.visualMap.headings.length} Überschriften, ${input.visualMap.buttons.length} Buttons, ${input.visualMap.images.length} Bilder.`
        : "Keine visuelle Map verfügbar.",
    ),
    createCheck(
      "Lesbarkeit und Inhaltstiefe",
      bodyText.length > 1600 ? "good" : bodyText.length > 700 ? "warning" : "critical",
      `Erkannte Textmenge: ca. ${Math.round(bodyText.length / 6)} Wörter.`,
    ),
  ];

  const aiVisibilityChecks = [
    createCheck(
      "Verstaendliche Daten fuer Google und KI",
      structuredData ? "good" : "warning",
      structuredData
        ? "Deine Website liefert strukturierte Daten. Das hilft Such- und KI-Systemen bei der Einordnung."
        : "Keine strukturierten Daten erkannt. KI-Systeme koennen dein Angebot dadurch schwerer eindeutig einordnen.",
    ),
    createCheck(
      "Klare Unternehmensbeschreibung",
      hasClearCompanyDescription ? "good" : "warning",
      hasClearCompanyDescription
        ? "Deine Marke oder dein Unternehmen wird ausreichend klar beschrieben."
        : "KI-Systeme koennen aktuell schwerer verstehen, wer hinter der Website steht und wofuer sie steht.",
    ),
    createCheck(
      "Produkt-/Serviceverstaendlichkeit",
      productServiceSignals.length >= 3 ? "good" : productServiceSignals.length > 0 ? "warning" : "critical",
      productServiceSignals.length >= 3
        ? `Angebotssignale sind erkennbar: ${productServiceSignals.slice(0, 5).join(", ")}.`
        : productServiceSignals.length > 0
          ? "Dein Angebot ist teilweise erkennbar, koennte aber fuer Menschen und KI-Systeme klarer beschrieben werden."
          : "KI-Systeme koennen dein Angebot aktuell schwer einordnen, weil klare Produkt- oder Service-Signale fehlen.",
    ),
    createCheck(
      "Kundenfragen als Antworten",
      faqSchema || faqContent ? "good" : "warning",
      faqSchema
        ? "FAQ-Inhalte sind mit Schema.org ausgezeichnet. Das ist eine gute Vorbereitung fuer AI-Suchen."
        : faqContent
          ? "FAQ-artige Inhalte wurden erkannt, aber ein FAQ-Schema koennte die maschinelle Einordnung verbessern."
          : "Es wurden keine klaren FAQ-Bereiche erkannt. Wichtige Kundenfragen bleiben als AI-Sichtbarkeitschance ungenutzt.",
    ),
    createCheck(
      "About-Seite",
      aboutLink ? "good" : "warning",
      aboutLink
        ? "Eine About-/Unternehmensseite ist verlinkt und kann Marken- und Expertise-Signale staerken."
        : "Keine klare About-/Unternehmensseite erkannt. Das kann Marken- und Expertise-Signale abschwaechen.",
    ),
    createCheck(
      "Lokale Signale",
      localSignals.length >= 2 ? "good" : localSignals.length === 1 ? "warning" : "unknown",
      localSignals.length >= 2
        ? `Lokale Signale sind erkennbar: ${localSignals.join(", ")}.`
        : localSignals.length === 1
          ? `Ein lokales Signal wurde erkannt (${localSignals[0]}), Standortbezug koennte aber klarer sein.`
          : "Keine klaren lokalen Signale erkannt. Falls du lokal arbeitest, fehlen KI-Systemen wichtige Standortinformationen.",
    ),
    createCheck(
      "Regeln fuer KI-Systeme",
      robotsAiStatus.status,
      robotsAiStatus.message,
    ),
    createCheck(
      "Kontakt-/Standortdaten",
      hasContact && (hasEmail || hasPhone || localSignals.length > 0) ? "good" : hasContact ? "warning" : "critical",
      hasContact && (hasEmail || hasPhone || localSignals.length > 0)
        ? "Kontakt- oder Standortdaten sind erkennbar. Das hilft Nutzern und Systemen bei Vertrauen und Einordnung."
        : hasContact
          ? "Kontakt ist erkennbar, aber konkrete Kontakt- oder Standortdaten koennten deutlicher sein."
          : "Keine klaren Kontakt-/Standortdaten erkannt. Das erschwert Vertrauen und die Einordnung deines Angebots.",
    ),
    createCheck(
      "Klare Themenstruktur",
      h1Count === 1 && h2Count >= 2 ? "good" : h1Count === 0 ? "critical" : "warning",
      h1Count === 1 && h2Count >= 2
        ? "Deine Website ist gut vorbereitet fuer AI-Suchen: Hauptthema und Unterthemen sind ueber Ueberschriften erkennbar."
        : h1Count === 0
          ? "KI-Systeme koennen dein Hauptthema schwerer einordnen, weil keine klare H1 gefunden wurde."
          : `Die Ueberschriftenstruktur ist ausbaufaehig: ${h1Count} H1, ${h2Count} H2.`,
    ),
  ];

  return {
    seo: createScoreBlock("Auffindbarkeit", seoChecks),
    performance: createScoreBlock("Ladegefuehl", performanceChecks),
    trust: createScoreBlock("Vertrauen", trustChecks),
    conversion: createScoreBlock("Anfragen", conversionChecks),
    design: createScoreBlock("Design", designChecks),
    aiVisibility: createScoreBlock("KI-Sichtbarkeit", aiVisibilityChecks),
  };
}

function recommendationFromCheck(
  title: string,
  text: string,
  impact: Recommendation["impact"],
  effort: Recommendation["effort"],
): Recommendation {
  return {
    title,
    text,
    description: text,
    impact,
    effort,
    weight: impact === "high" ? 90 : impact === "medium" ? 60 : 30,
  };
}

export function buildAuditRecommendations(categories: AnalysisResultCategories) {
  const allChecks = Object.values(categories).flatMap((category) => category.checks);
  const problematic = allChecks.filter(
    (check) => check.status === "critical" || check.status === "warning",
  );

  const quickWins = problematic
    .filter((check) => check.status === "warning")
    .slice(0, 4)
    .map((check) =>
      recommendationFromCheck(
        check.title,
        check.message,
        "medium",
        check.title.toLowerCase().includes("schema") ? "medium" : "low",
      ),
    );

  const criticalIssues = problematic
    .filter((check) => check.status === "critical")
    .slice(0, 4)
    .map((check) => recommendationFromCheck(check.title, check.message, "high", "medium"));

  const premiumInsightsPreview = [
    recommendationFromCheck(
      "Priorisierte Maßnahmen-Roadmap",
      "Premium bewertet die kritischen Punkte nach Umsatzwirkung, Aufwand und Reihenfolge.",
      "high",
      "medium",
    ),
    recommendationFromCheck(
      "Wettbewerbs-Kontext",
      "Premium ergänzt, welche stärkeren Wettbewerber die sichtbaren Hebel bereits besser lösen.",
      "medium",
      "medium",
    ),
    recommendationFromCheck(
      "Visuelle Problemzonen",
      "Premium nutzt verfügbare Screenshots und visuelle Signale für konkrete Layout- und CTA-Hinweise.",
      "medium",
      "low",
    ),
  ];

  return {
    quickWins,
    criticalIssues,
    premiumInsightsPreview,
  };
}

type BlockerTemplate = {
  category: RevenueBlocker["category"];
  problem: string;
  whyItCostsCustomers: string;
  action: string;
  estimatedEffort: RevenueBlocker["estimatedEffort"];
  estimatedImpact: RevenueBlocker["estimatedImpact"];
};

const blockerTemplates: Record<string, BlockerTemplate> = {
  Vertrauensbelege: {
    category: "Vertrauen",
    problem: "Wichtige Vertrauenssignale sind nicht klar genug sichtbar.",
    whyItCostsCustomers:
      "Unsichere Besucher zoegern schneller, vergleichen laenger oder brechen vor Anfrage und Kauf ab.",
    action:
      "Bewertungen, Zahlungsarten, Sicherheitsbelege und Service-Versprechen frueher auf der Seite sichtbar machen.",
    estimatedEffort: "mittel",
    estimatedImpact: "hoch",
  },
  Impressum: {
    category: "Vertrauen",
    problem: "Rechtliche Vertrauenssignale sind schwer auffindbar.",
    whyItCostsCustomers:
      "Wenn Seriositaet nicht sofort belegbar ist, sinkt die Bereitschaft zur Kontaktaufnahme oder Bestellung.",
    action: "Impressum und rechtliche Pflichtlinks klar im Footer oder in der Navigation erreichbar machen.",
    estimatedEffort: "niedrig",
    estimatedImpact: "mittel",
  },
  Datenschutz: {
    category: "Vertrauen",
    problem: "Datenschutz wirkt nicht klar genug abgesichert.",
    whyItCostsCustomers:
      "Gerade bei Formularen und Shops kann fehlende Transparenz Zweifel erzeugen und Abschluesse kosten.",
    action: "Datenschutz-Link sichtbar platzieren und in Formularnaehe Vertrauen durch kurze Hinweise schaffen.",
    estimatedEffort: "niedrig",
    estimatedImpact: "mittel",
  },
  Kontaktvertrauen: {
    category: "Vertrauen",
    problem: "Kontaktmoeglichkeiten sind nicht eindeutig genug.",
    whyItCostsCustomers:
      "Besucher, die Rueckfragen haben, finden keinen einfachen Weg und verlassen die Seite eher.",
    action: "Kontakt, E-Mail, Telefon oder Anfrageweg prominenter und wiederholt sichtbar machen.",
    estimatedEffort: "niedrig",
    estimatedImpact: "hoch",
  },
  "Naechster Schritt": {
    category: "CTA",
    problem: "Der naechste Schritt ist nicht stark genug erkennbar.",
    whyItCostsCustomers:
      "Wenn Besucher nicht sofort wissen, was sie tun sollen, verpufft Aufmerksamkeit ohne Anfrage oder Kauf.",
    action: "Einen primaeren CTA priorisieren, klar benennen und oberhalb des ersten Scrolls sichtbar machen.",
    estimatedEffort: "niedrig",
    estimatedImpact: "hoch",
  },
  "Einfacher Anfrageweg": {
    category: "CTA",
    problem: "Der Anfrageweg erzeugt zu wenig sichtbare Handlungssicherheit.",
    whyItCostsCustomers:
      "Unklare oder fehlende Formulare erschweren den Moment, in dem Interesse in Kontakt umschlagen koennte.",
    action: "Ein schlankes Formular oder einen klaren Kontakt-CTA mit Nutzenhinweis einbauen.",
    estimatedEffort: "mittel",
    estimatedImpact: "hoch",
  },
  Angebotsklarheit: {
    category: "Klarheit",
    problem: "Das Angebot wird nicht schnell genug verstanden.",
    whyItCostsCustomers:
      "Unklare Leistungen oder Produktvorteile fuehren dazu, dass Besucher weiter suchen statt zu handeln.",
    action: "Hero, Leistungsbeschreibung und Nutzenversprechen konkretisieren und auf einen Hauptnutzen zuspitzen.",
    estimatedEffort: "mittel",
    estimatedImpact: "hoch",
  },
  "Klarheit der Seitenbotschaft": {
    category: "Klarheit",
    problem: "Die Seitenstruktur fuehrt Besucher nicht klar genug.",
    whyItCostsCustomers:
      "Ohne klare Ueberschriften erkennen Nutzer Angebot, Nutzen und Reihenfolge der Inhalte langsamer.",
    action: "Eine eindeutige Hauptbotschaft setzen und Inhalte mit klaren Abschnittsueberschriften ordnen.",
    estimatedEffort: "niedrig",
    estimatedImpact: "mittel",
  },
  "Mobile Darstellung": {
    category: "Mobile UX",
    problem: "Die mobile Darstellung kann unbequem oder falsch wirken.",
    whyItCostsCustomers:
      "Viele Besucher kommen mobil. Wenn die Ansicht unbequem wirkt, sinkt die Chance auf Anfrage oder Kauf.",
    action: "Mobile Ansicht, Abstaende, Schriftgroessen und klickbare Elemente fuer kleine Screens verbessern.",
    estimatedEffort: "mittel",
    estimatedImpact: "hoch",
  },
  Ladegefuehl: {
    category: "Ladegefuehl",
    problem: "Die Seite fuehlt sich zu langsam an.",
    whyItCostsCustomers:
      "Wartezeit kostet Aufmerksamkeit, Vertrauen und besonders auf mobilen Geraeten direkte Abschluesse.",
    action: "Bilder, Skripte und kritische Ladepfade priorisiert verschlanken.",
    estimatedEffort: "mittel",
    estimatedImpact: "hoch",
  },
  Blickfuehrung: {
    category: "Design",
    problem: "Das Layout gibt zu wenig visuelle Fuehrung.",
    whyItCostsCustomers:
      "Wenn Blickfuehrung, Buttons und Inhalte nicht zusammenarbeiten, verlieren Besucher Orientierung.",
    action: "Hero, CTA-Zonen, Trust-Elemente und Inhaltsbloecke visuell klarer priorisieren.",
    estimatedEffort: "mittel",
    estimatedImpact: "mittel",
  },
  "Lesbarkeit und Inhaltstiefe": {
    category: "Design",
    problem: "Inhalt und Lesbarkeit wirken unausgewogen.",
    whyItCostsCustomers:
      "Zu wenig oder schlecht strukturierter Inhalt beantwortet Kauf- und Vertrauensfragen nicht ausreichend.",
    action: "Inhalte verdichten, besser gliedern und wichtige Nutzenargumente sichtbarer machen.",
    estimatedEffort: "mittel",
    estimatedImpact: "mittel",
  },
  "Verstaendliche Daten fuer Google und KI": {
    category: "AI-Sichtbarkeit",
    problem: "Google und KI-Systeme bekommen dein Angebot nicht eindeutig genug erklaert.",
    whyItCostsCustomers:
      "Wenn Maschinen Angebot, Marke und Inhalte schlechter verstehen, gehen Sichtbarkeitschancen verloren.",
    action: "Angebot, Unternehmen, Produkte, Leistungen oder Fragen klar maschinenlesbar auszeichnen.",
    estimatedEffort: "mittel",
    estimatedImpact: "mittel",
  },
  "Klare Unternehmensbeschreibung": {
    category: "AI-Sichtbarkeit",
    problem: "Deine Marke oder dein Unternehmen ist fuer KI-Systeme nicht klar genug beschrieben.",
    whyItCostsCustomers:
      "Wenn Systeme nicht verstehen, wer du bist und wofuer du stehst, gehen Empfehlungs- und Antwortchancen verloren.",
    action: "Eine klare Unternehmensbeschreibung mit Angebot, Zielgruppe, Standort und Vertrauenssignalen einbauen.",
    estimatedEffort: "niedrig",
    estimatedImpact: "mittel",
  },
  "Produkt-/Serviceverstaendlichkeit": {
    category: "AI-Sichtbarkeit",
    problem: "Dein Angebot ist fuer KI-Systeme nicht eindeutig genug.",
    whyItCostsCustomers:
      "Unklare Produkt- oder Serviceinformationen erschweren passende Antworten, Empfehlungen und Vergleiche.",
    action: "Produkte, Services, Nutzen, Zielgruppen und typische Anwendungsfaelle klarer beschreiben.",
    estimatedEffort: "mittel",
    estimatedImpact: "hoch",
  },
  "Kundenfragen als Antworten": {
    category: "AI-Sichtbarkeit",
    problem: "Wichtige Kundenfragen werden nicht als Antwortpotenzial genutzt.",
    whyItCostsCustomers:
      "Unbeantwortete Fragen bremsen Vertrauen und schwachen die Chance, in Antwortsystemen aufzutauchen.",
    action: "Echte Kundenfragen sichtbar beantworten und bei Eignung fuer Google und KI klar auszeichnen.",
    estimatedEffort: "mittel",
    estimatedImpact: "mittel",
  },
  "About-Seite": {
    category: "AI-Sichtbarkeit",
    problem: "Unternehmens- und Expertise-Signale sind zu schwach.",
    whyItCostsCustomers:
      "Ohne klare About-Seite fehlt Kontext zu Marke, Menschen, Erfahrung und Vertrauenswuerdigkeit.",
    action: "Eine About-/Unternehmensseite mit Team, Erfahrung, Standort und Leistungsprofil sichtbar verlinken.",
    estimatedEffort: "mittel",
    estimatedImpact: "mittel",
  },
  "Lokale Signale": {
    category: "AI-Sichtbarkeit",
    problem: "Lokale Einordnung ist nicht klar genug.",
    whyItCostsCustomers:
      "Lokale Anbieter verlieren Chancen, wenn Standort, Einzugsgebiet oder regionale Relevanz nicht eindeutig sind.",
    action: "Adresse, Standortseiten, Einzugsgebiet, Oeffnungszeiten und lokale Begriffe klarer einbauen.",
    estimatedEffort: "mittel",
    estimatedImpact: "mittel",
  },
  "Regeln fuer KI-Systeme": {
    category: "AI-Sichtbarkeit",
    problem: "Regeln fuer KI-Systeme sind nicht bewusst genug festgelegt.",
    whyItCostsCustomers:
      "Unklare oder blockierende Regeln koennen beeinflussen, wie Inhalte von bestimmten Systemen verarbeitet werden.",
    action: "Bewusst entscheiden, welche Such- und KI-Systeme deine Inhalte abrufen duerfen.",
    estimatedEffort: "niedrig",
    estimatedImpact: "mittel",
  },
  "Kontakt-/Standortdaten": {
    category: "AI-Sichtbarkeit",
    problem: "Kontakt- und Standortdaten sind nicht eindeutig genug.",
    whyItCostsCustomers:
      "Fehlende Kontakt- oder Standortdaten schwachen Vertrauen, lokale Relevanz und maschinelle Einordnung.",
    action: "Kontakt, Adresse, Telefon, E-Mail und Standortinformationen klar sichtbar machen.",
    estimatedEffort: "niedrig",
    estimatedImpact: "mittel",
  },
  "Klare Themenstruktur": {
    category: "AI-Sichtbarkeit",
    problem: "Die Inhalte sind thematisch noch nicht klar genug aufgebaut.",
    whyItCostsCustomers:
      "Unklare Themenstruktur erschwert sowohl Nutzern als auch KI-Systemen die Einordnung deines Angebots.",
    action: "Marke, Leistungen, Zielgruppen und Nutzen in klaren Abschnitten benennen.",
    estimatedEffort: "mittel",
    estimatedImpact: "mittel",
  },
};

const fallbackTemplates: Record<RevenueBlocker["category"], Omit<BlockerTemplate, "category">> = {
  Vertrauen: {
    problem: "Vertrauen wird nicht schnell genug aufgebaut.",
    whyItCostsCustomers: "Besucher brauchen Sicherheit, bevor sie Daten eingeben, anfragen oder kaufen.",
    action: "Trust-Elemente, Kontakt und Belege frueher sichtbar machen.",
    estimatedEffort: "mittel",
    estimatedImpact: "hoch",
  },
  Klarheit: {
    problem: "Die Seite erklaert Angebot und Nutzen nicht schnell genug.",
    whyItCostsCustomers: "Unklare Botschaften fuehren dazu, dass Besucher nicht weiterdenken oder vergleichen.",
    action: "Hauptbotschaft, Nutzen und Seitenstruktur schaerfen.",
    estimatedEffort: "mittel",
    estimatedImpact: "hoch",
  },
  "Mobile UX": {
    problem: "Die mobile Nutzung hat Reibung.",
    whyItCostsCustomers: "Mobile Reibung kostet besonders schnell Aufmerksamkeit und Abschluesse.",
    action: "Mobile Darstellung, Lesbarkeit und Klickwege priorisiert pruefen.",
    estimatedEffort: "mittel",
    estimatedImpact: "hoch",
  },
  CTA: {
    problem: "Der naechste Schritt ist nicht eindeutig genug.",
    whyItCostsCustomers: "Ohne klare Handlung verlieren interessierte Besucher den Anschluss.",
    action: "Primaeren CTA sichtbarer und konkreter formulieren.",
    estimatedEffort: "niedrig",
    estimatedImpact: "hoch",
  },
  Design: {
    problem: "Die visuelle Fuehrung ist ausbaufaehig.",
    whyItCostsCustomers: "Design beeinflusst, ob Angebot, Vertrauen und Handlung schnell verstanden werden.",
    action: "Layout, Hierarchie und wichtige Bereiche optisch klarer ordnen.",
    estimatedEffort: "mittel",
    estimatedImpact: "mittel",
  },
  Ladegefuehl: {
    problem: "Die Seite wirkt beim Laden nicht leicht genug.",
    whyItCostsCustomers: "Langsames oder instabiles Ladegefuehl senkt Vertrauen und Geduld.",
    action: "Ladebremsen priorisiert identifizieren und reduzieren.",
    estimatedEffort: "mittel",
    estimatedImpact: "hoch",
  },
  "AI-Sichtbarkeit": {
    problem: "Die Seite ist fuer Antwortsysteme noch nicht gut genug vorbereitet.",
    whyItCostsCustomers: "Unstrukturierte Inhalte verschenken kuenftige Sichtbarkeitschancen.",
    action: "Kundenfragen, klar ausgezeichnete Informationen und verstaendliche Themenabschnitte ausbauen.",
    estimatedEffort: "mittel",
    estimatedImpact: "mittel",
  },
};

function blockerPriorityScore(check: ScoreBlock["checks"][number], template: BlockerTemplate) {
  const statusScore = check.status === "critical" ? 100 : check.status === "warning" ? 70 : 35;
  const impactScore = template.estimatedImpact === "hoch" ? 30 : template.estimatedImpact === "mittel" ? 18 : 8;
  const effortBonus = template.estimatedEffort === "niedrig" ? 12 : template.estimatedEffort === "mittel" ? 6 : 0;

  return statusScore + impactScore + effortBonus;
}

function categoryForBlock(key: keyof AnalysisResultCategories): RevenueBlocker["category"] {
  const map: Record<keyof AnalysisResultCategories, RevenueBlocker["category"]> = {
    seo: "Klarheit",
    performance: "Ladegefuehl",
    trust: "Vertrauen",
    conversion: "CTA",
    design: "Design",
    aiVisibility: "AI-Sichtbarkeit",
  };

  return map[key];
}

export function buildRevenueBlockers(categories: AnalysisResultCategories): RevenueBlocker[] {
  const candidates = (Object.entries(categories) as Array<[keyof AnalysisResultCategories, ScoreBlock]>)
    .flatMap(([categoryKey, block]) =>
      block.checks
        .filter((check) => check.status === "critical" || check.status === "warning")
        .map((check) => {
          const template =
            blockerTemplates[check.title] ??
            ({
              category: categoryForBlock(categoryKey),
              ...fallbackTemplates[categoryForBlock(categoryKey)],
            } satisfies BlockerTemplate);

          return {
            blocker: {
              ...template,
              priority: 1,
              sourceCheck: check.title,
            } satisfies RevenueBlocker,
            sortScore: blockerPriorityScore(check, template),
          };
        }),
    )
    .sort((left, right) => right.sortScore - left.sortScore);

  const seenCategories = new Set<string>();
  const deduped = candidates.filter(({ blocker }) => {
    const key = `${blocker.category}:${blocker.problem}`;
    if (seenCategories.has(key)) {
      return false;
    }
    seenCategories.add(key);
    return true;
  });

  return deduped.slice(0, 5).map(({ blocker }, index) => ({
    ...blocker,
    priority: (index + 1) as RevenueBlocker["priority"],
  }));
}
