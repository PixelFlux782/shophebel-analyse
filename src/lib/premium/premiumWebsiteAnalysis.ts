import { analysePage } from "@/lib/analyse/analyse-page";
import { discoverPremiumPages } from "@/lib/premium/premiumPageDiscovery";
import type { PremiumDiscoveredPage, PremiumPageRole } from "@/lib/premium/premiumPageDiscovery";
import type { AnalysisResult } from "@/types/analysis";

export type PremiumWebsitePageAnalysis = {
  url: string;
  title?: string;
  label: string;
  role: PremiumPageRole;
  reason: string;
  analysisStatus: "analyzed" | "failed";
  screenshot?: string;
  screenshotUrl?: string;
  screenshotUnavailableReason?: string;
  score?: number;
  subscores?: Array<{ label: string; score: number }>;
  strengths: string[];
  problems: string[];
  recommendation: string;
  shortDiagnosis: string;
};

export type PremiumWebsiteAnalysis = {
  pages: PremiumWebsitePageAnalysis[];
  overallWebsiteScore: number;
  crossPageDiagnosis: string;
  repeatedProblems: string[];
  strongestPage?: {
    label: string;
    url: string;
    score: number;
  };
  weakestPage?: {
    label: string;
    url: string;
    score: number;
  };
  conversionPathAssessment: string;
  trustConsistencyAssessment: string;
  navigationAssessment: string;
  topPrioritiesWebsiteWide: string[];
  sevenDayPlan: Array<{
    days: string;
    focus: string;
    actions: string[];
  }>;
  missingPageTypes: PremiumPageRole[];
  fallbackNote?: string;
};

type BuildPremiumWebsiteAnalysisInput = {
  startAnalysis: AnalysisResult;
  discoveredPages?: PremiumDiscoveredPage[];
  pageAnalyses?: Array<{
    page: PremiumDiscoveredPage;
    analysis?: AnalysisResult;
    error?: string;
  }>;
};

const REQUIRED_SYSTEM_ROLES: PremiumPageRole[] = ["offer", "product", "trust", "contact"];
const ROLE_LABELS: Record<PremiumPageRole, string> = {
  home: "Startseite",
  offer: "Angebot / Leistungen",
  product: "Produkt / Shop",
  trust: "Vertrauen / Über uns",
  contact: "Kontakt / Anfrage",
  faq: "FAQ",
  pricing: "Preise",
  unknown: "Weitere Unterseite",
};

function firstNonEmptyString(values: unknown[]) {
  return values.find((value): value is string => typeof value === "string" && value.trim().length > 0);
}

function screenshotForAnalysis(analysis: AnalysisResult) {
  const legacy = analysis as AnalysisResult & {
    screenshot?: string;
    screenshotUrl?: string;
    screenshotPath?: string;
    visualSnapshot?: string;
    visualScreenshot?: string;
    renderedScreenshot?: string;
    artifactUrl?: string;
  };

  return firstNonEmptyString([
    analysis.screenshots?.viewport,
    analysis.screenshots?.fullPage,
    analysis.screenshots?.mobile,
    analysis.screenshots?.hero,
    legacy.screenshot,
    legacy.screenshotUrl,
    legacy.screenshotPath,
    legacy.visualSnapshot,
    legacy.visualScreenshot,
    legacy.renderedScreenshot,
    legacy.artifactUrl,
  ]);
}

function screenshotUnavailableReason(analysis: AnalysisResult) {
  if (screenshotForAnalysis(analysis)) return undefined;
  if (analysis.metadata?.screenshotError) {
    return "Screenshot konnte fuer diese Seite technisch nicht erstellt werden.";
  }
  if (analysis.analysisMode === "static") {
    return "Diese Seite wurde ohne gerenderte Vorschau ausgewertet.";
  }
  return undefined;
}

function debugPremiumScreenshots(event: string, details: Record<string, unknown>) {
  if (process.env.DEBUG_PREMIUM_SCREENSHOTS === "1") {
    console.info(`[premium-screenshots] ${event}`, details);
  }
}

function topStrengths(analysis: AnalysisResult) {
  const strongChecks = Object.values(analysis.categories)
    .flatMap((category) => category.checks
      .filter((check) => check.status === "good")
      .map((check) => check.message || check.title));
  const strongScores = Object.values(analysis.categories)
    .filter((category) => category.score >= 75)
    .map((category) => `${category.label}: ${category.summary}`);

  return [...strongChecks, ...strongScores].filter(Boolean).slice(0, 3);
}

function topProblems(analysis: AnalysisResult) {
  const blockers = analysis.revenueBlockers.map((blocker) => blocker.problem);
  const findings = analysis.findings
    .filter((finding) => finding.status !== "success")
    .sort((left, right) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[left.priority] - order[right.priority];
    })
    .map((finding) => finding.title);

  return [...blockers, ...findings].filter(Boolean).slice(0, 3);
}

function recommendationForAnalysis(analysis: AnalysisResult) {
  return analysis.measures[0]?.description
    ?? analysis.recommendations[0]?.description
    ?? analysis.recommendations[0]?.text
    ?? "Diese Seite anhand der stärksten Analysebefunde priorisiert überarbeiten.";
}

function shortDiagnosisForPage(page: PremiumDiscoveredPage, analysis: AnalysisResult) {
  const weakest = Object.values(analysis.categories).sort((left, right) => left.score - right.score)[0];
  return `${ROLE_LABELS[page.role]} mit ${analysis.overallScore}/100. Größter Hebel: ${weakest?.label ?? "Klarheit"} (${weakest?.score ?? analysis.overallScore}/100).`;
}

function pageFromAnalysis(page: PremiumDiscoveredPage, analysis: AnalysisResult): PremiumWebsitePageAnalysis {
  const screenshot = screenshotForAnalysis(analysis);

  return {
    url: analysis.url,
    title: page.title,
    label: page.label || ROLE_LABELS[page.role],
    role: page.role,
    reason: page.reason,
    analysisStatus: "analyzed",
    screenshot,
    screenshotUrl: screenshot,
    screenshotUnavailableReason: screenshotUnavailableReason(analysis),
    score: analysis.overallScore,
    subscores: Object.values(analysis.categories).map((category) => ({
      label: category.label,
      score: category.score,
    })),
    strengths: topStrengths(analysis),
    problems: topProblems(analysis),
    recommendation: recommendationForAnalysis(analysis),
    shortDiagnosis: shortDiagnosisForPage(page, analysis),
  };
}

function failedPage(page: PremiumDiscoveredPage, error?: string): PremiumWebsitePageAnalysis {
  return {
    url: page.url,
    title: page.title,
    label: page.label || ROLE_LABELS[page.role],
    role: page.role,
    reason: page.reason,
    analysisStatus: "failed",
    strengths: [],
    problems: [error ? `Unterseite konnte nicht analysiert werden: ${error}` : "Unterseite konnte nicht analysiert werden."],
    recommendation: "Diese Unterseite später separat prüfen; der Premium-Report nutzt die erreichbaren Seiten.",
    shortDiagnosis: "Nicht analysierbar in diesem Lauf.",
  };
}

function normalizedProblemKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .split(/\s+/)
    .filter((part) => part.length > 3)
    .slice(0, 6)
    .join(" ");
}

function collectRepeatedProblems(pages: PremiumWebsitePageAnalysis[]) {
  const counts = new Map<string, { label: string; count: number }>();

  pages
    .filter((page) => page.analysisStatus === "analyzed")
    .forEach((page) => {
      page.problems.forEach((problem) => {
        const key = normalizedProblemKey(problem);
        if (!key) return;
        const existing = counts.get(key);
        counts.set(key, {
          label: existing?.label ?? problem,
          count: (existing?.count ?? 0) + 1,
        });
      });
    });

  return [...counts.values()]
    .filter((item) => item.count > 1)
    .sort((left, right) => right.count - left.count)
    .map((item) => item.label)
    .slice(0, 5);
}

function scoreAverage(pages: PremiumWebsitePageAnalysis[]) {
  const scores = pages
    .map((page) => page.score)
    .filter((score): score is number => typeof score === "number" && Number.isFinite(score));

  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

function pageScoreSummary(page: PremiumWebsitePageAnalysis | undefined) {
  if (!page || typeof page.score !== "number") return undefined;
  return {
    label: page.label,
    url: page.url,
    score: page.score,
  };
}

function missingRoles(pages: PremiumWebsitePageAnalysis[]) {
  const present = new Set(pages.map((page) => page.role));
  return REQUIRED_SYSTEM_ROLES.filter((role) => !present.has(role));
}

function hasRole(pages: PremiumWebsitePageAnalysis[], role: PremiumPageRole) {
  return pages.some((page) => page.role === role && page.analysisStatus === "analyzed");
}

function buildAssessments(pages: PremiumWebsitePageAnalysis[], repeatedProblems: string[], missingPageTypes: PremiumPageRole[]) {
  const hasOffer = hasRole(pages, "offer") || hasRole(pages, "product");
  const hasTrust = hasRole(pages, "trust");
  const hasContact = hasRole(pages, "contact");
  const analyzedCount = pages.filter((page) => page.analysisStatus === "analyzed").length;

  return {
    crossPageDiagnosis: analyzedCount > 1
      ? `Die Website wurde als System aus ${analyzedCount} erreichbaren Seiten bewertet. Entscheidend ist, ob Angebot, Vertrauen und nächster Schritt über mehrere Seiten konsistent zusammenarbeiten.`
      : "Es wurde keine sinnvolle Unterseitenstruktur gefunden. Premium bewertet deshalb die eingegebene Seite tiefer und benennt fehlende Systemseiten als Lücke.",
    conversionPathAssessment: hasOffer && hasContact
      ? "Angebot und Kontakt-/Anfrageweg sind als eigene Stationen vorhanden; jetzt zählt, ob CTA, Nutzenversprechen und Vertrauen dieselbe Richtung zeigen."
      : "Der Weg von Angebot zu Anfrage ist noch nicht vollständig als Seitensystem erkennbar. Das ist eine wichtige Lücke für Premium-Prioritäten.",
    trustConsistencyAssessment: hasTrust
      ? "Es gibt eine erkennbare Vertrauensseite. Wichtig ist, deren Belege auch auf Angebots- und Kontaktseiten sichtbar zu machen."
      : "Eine eigene Vertrauens-, Referenz-, Team- oder Über-uns-Seite wurde nicht gefunden. Vertrauen muss deshalb auf den vorhandenen Seiten besonders klar getragen werden.",
    navigationAssessment: pages.length > 1
      ? `Die Discovery fand ${pages.length} relevante interne Seiten. Wiederkehrende Muster sollten über Navigation und CTA-Reihenfolge vereinheitlicht werden.`
      : "Die Navigation liefert in diesem Lauf keine weiteren verwertbaren Analyseziele. Der Report bleibt nutzbar, sollte aber fehlende Unterseiten nicht künstlich ersetzen.",
    topPrioritiesWebsiteWide: [
      repeatedProblems[0] ?? "Startbereich, Angebot und nächsten Schritt sprachlich aufeinander abstimmen.",
      hasTrust ? "Vertrauensbelege näher an Angebots- und Anfrageentscheidungen platzieren." : "Fehlende Vertrauensseite oder Trust-Sektion als klare Lücke schließen.",
      hasContact ? "Kontakt-/Anfrageseite als logischen Abschluss der Nutzerführung schärfen." : "Einen klaren Kontakt- oder Anfrageweg sichtbar machen.",
    ],
    missingPageTypes,
  };
}

function buildSevenDayPlan(priorities: string[]) {
  return [
    {
      days: "Tag 1-2",
      focus: "Systembild und wichtigste Brüche klären",
      actions: [
        priorities[0] ?? "Die stärkste Website-weite Reibung festhalten.",
        "Startseite, Angebot und Kontaktweg nebeneinander prüfen: Versprechen, Beleg und CTA müssen zusammenpassen.",
      ],
    },
    {
      days: "Tag 3-5",
      focus: "Angebot, Vertrauen und CTA vereinheitlichen",
      actions: [
        priorities[1] ?? "Vertrauenssignale auf kauf- und anfragenahen Seiten ergänzen.",
        priorities[2] ?? "Den nächsten Schritt auf jeder wichtigen Seite eindeutiger machen.",
      ],
    },
    {
      days: "Tag 6-7",
      focus: "Nutzerführung testen und nachziehen",
      actions: [
        "Den Weg von Startseite zu Angebot und Anfrage auf Desktop und mobil durchgehen.",
        "Die Seite mit dem schwächsten Score zuerst erneut prüfen und danach die nächste Priorität festlegen.",
      ],
    },
  ];
}

export function buildPremiumWebsiteAnalysis(input: BuildPremiumWebsiteAnalysisInput): PremiumWebsiteAnalysis {
  const discoveredHome = input.discoveredPages?.[0] ?? {
    url: input.startAnalysis.url,
    label: "Startseite",
    role: "home" as const,
    reason: "Eingegebene Startseite als Ausgangspunkt der Premium-Systemanalyse.",
  };
  const pageAnalyses = input.pageAnalyses?.length
    ? input.pageAnalyses
    : [{ page: discoveredHome, analysis: input.startAnalysis }];
  const pages = pageAnalyses.map((item) =>
    item.analysis ? pageFromAnalysis(item.page, item.analysis) : failedPage(item.page, item.error),
  );
  const analyzedPages = pages.filter((page) => page.analysisStatus === "analyzed");
  const sortedByScore = [...analyzedPages].sort((left, right) => (left.score ?? 0) - (right.score ?? 0));
  const repeatedProblems = collectRepeatedProblems(pages);
  const missingPageTypes = missingRoles(pages);
  const assessments = buildAssessments(pages, repeatedProblems, missingPageTypes);
  const topPrioritiesWebsiteWide = assessments.topPrioritiesWebsiteWide;

  return {
    pages,
    overallWebsiteScore: scoreAverage(analyzedPages),
    crossPageDiagnosis: assessments.crossPageDiagnosis,
    repeatedProblems,
    strongestPage: pageScoreSummary(sortedByScore.at(-1)),
    weakestPage: pageScoreSummary(sortedByScore[0]),
    conversionPathAssessment: assessments.conversionPathAssessment,
    trustConsistencyAssessment: assessments.trustConsistencyAssessment,
    navigationAssessment: assessments.navigationAssessment,
    topPrioritiesWebsiteWide,
    sevenDayPlan: buildSevenDayPlan(topPrioritiesWebsiteWide),
    missingPageTypes,
    fallbackNote: analyzedPages.length <= 1
      ? "Es wurden keine weiteren sinnvoll analysierbaren Unterseiten gefunden; Premium nutzt die Startseite und weist fehlende Seitentypen als Lücke aus."
      : undefined,
  };
}

export async function createPremiumWebsiteAnalysis(startAnalysis: AnalysisResult): Promise<PremiumWebsiteAnalysis> {
  const discoveredPages = await discoverPremiumPages(startAnalysis.finalUrl ?? startAnalysis.url);
  discoveredPages.forEach((page) => {
    debugPremiumScreenshots("discovered URL", {
      url: page.url,
      role: page.role,
    });
  });
  const [home, ...subpages] = discoveredPages;
  const pageAnalyses: BuildPremiumWebsiteAnalysisInput["pageAnalyses"] = [
    {
      page: home ?? {
        url: startAnalysis.url,
        label: "Startseite",
        role: "home",
        reason: "Eingegebene Startseite als Ausgangspunkt der Premium-Systemanalyse.",
      },
      analysis: startAnalysis,
    },
  ];

  for (const page of subpages) {
    try {
      debugPremiumScreenshots("analysis started", {
        url: page.url,
        role: page.role,
        renderEnabled: true,
      });
      const analysis = await analysePage(page.url, { preferRendered: true });
      const screenshot = screenshotForAnalysis(analysis);
      debugPremiumScreenshots("analysis completed", {
        url: page.url,
        finalUrl: analysis.finalUrl ?? analysis.url,
        role: page.role,
        analysisMode: analysis.analysisMode,
        screenshotCaptured: Boolean(screenshot),
        screenshotUrl: screenshot,
        localScreenshotPath: screenshot?.startsWith("/generated-screenshots/") ? screenshot : undefined,
        uploadSuccessful: Boolean(screenshot && !screenshot.startsWith("/generated-screenshots/")),
        screenshotError: analysis.metadata?.screenshotError,
        screenshotErrorSource: analysis.metadata?.screenshotErrorSource,
      });
      pageAnalyses.push({ page, analysis });
    } catch (error) {
      console.warn("[premium-website-analysis] subpage analysis failed", {
        url: page.url,
        role: page.role,
        reason: error instanceof Error ? error.message : "unknown",
      });
      pageAnalyses.push({
        page,
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  }

  const websiteAnalysis = buildPremiumWebsiteAnalysis({
    startAnalysis,
    discoveredPages,
    pageAnalyses,
  });

  websiteAnalysis.pages.forEach((page) => {
    debugPremiumScreenshots("premium page built", {
      url: page.url,
      role: page.role,
      screenshotPresent: Boolean(page.screenshot),
      screenshotUrl: page.screenshotUrl,
      screenshotUnavailableReason: page.screenshotUnavailableReason,
    });
  });

  return websiteAnalysis;
}
