import { AnalysisResult, Finding, PriorityLevel } from "@/types/analysis";

import { buildFindingKey } from "@/lib/ai/suggestion-helpers";

export interface SuggestionInputItem {
  findingKey: string;
  category: Finding["category"];
  title: string;
  description: string;
  priority: PriorityLevel;
  scores: {
    overall: number;
    seo: number;
    trust: number;
    conversion: number;
    ux: number;
  };
  visualHint?: string;
}

function buildVisualHint(result: AnalysisResult, finding: Finding) {
  const visualMap = result.visualMap;

  if (!visualMap) {
    return undefined;
  }

  if (finding.category === "conversion") {
    return `${visualMap.buttons.length} sichtbare CTA-Elemente, ${visualMap.forms.length} Formbereiche und ${visualMap.headings.length} relevante Headings erkannt.`;
  }

  if (finding.category === "trust") {
    return `${visualMap.links.length} sichtbare Links und ${visualMap.forms.length} Formbereiche liefern Ansatzpunkte fuer Vertrauenssignale.`;
  }

  if (finding.category === "seo" || finding.category === "ux") {
    return `${visualMap.headings.length} Headings, ${visualMap.images.length} Bilder und ${visualMap.links.length} Links wurden im sichtbaren DOM erfasst.`;
  }

  return undefined;
}

export function buildSuggestionInput(result: AnalysisResult): SuggestionInputItem[] {
  return result.findings.map((finding) => ({
    findingKey: buildFindingKey(finding),
    category: finding.category,
    title: finding.title,
    description: finding.description,
    priority: finding.priority,
    scores: {
      overall: result.overallScore,
      seo: result.categoryScores.seo?.score ?? result.categories.seo.score,
      trust: result.categoryScores.trust?.score ?? result.categories.trust.score,
      conversion: result.categoryScores.conversion?.score ?? result.categories.conversion.score,
      ux: result.categoryScores.ux?.score ?? result.categories.design.score,
    },
    visualHint: buildVisualHint(result, finding),
  }));
}
