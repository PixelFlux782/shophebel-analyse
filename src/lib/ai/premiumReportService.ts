import { buildPremiumReportPrompt } from "@/lib/ai/promptBuilder";
import type { PremiumReportInput } from "@/lib/ai/premiumReportInput";
import { mockPremiumReportProvider } from "@/lib/ai/mockPremiumReportProvider";
import type { PremiumReportProvider } from "@/lib/ai/premiumReportProvider";
import { premiumAiReportSchema, type PremiumAiReport } from "@/lib/ai/premiumAiReport.schema";

export class PremiumAiReportValidationError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "PremiumAiReportValidationError";
  }
}

function stripJsonFence(raw: string): string {
  const trimmed = raw.trim();
  const fencedJson = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);

  return fencedJson?.[1]?.trim() ?? trimmed;
}

function extractJsonObject(raw: string): string {
  const unfenced = stripJsonFence(raw);
  const firstBrace = unfenced.indexOf("{");
  const lastBrace = unfenced.lastIndexOf("}");

  if (firstBrace < 0 || lastBrace < firstBrace) {
    return unfenced;
  }

  return unfenced.slice(firstBrace, lastBrace + 1);
}

export function parsePremiumAiReportResponse(raw: string): PremiumAiReport {
  let parsed: unknown;

  try {
    parsed = JSON.parse(extractJsonObject(raw));
  } catch (error) {
    throw new PremiumAiReportValidationError("Premium AI report response is not valid JSON.", { cause: error });
  }

  const result = premiumAiReportSchema.safeParse(parsed);

  if (!result.success) {
    const details = result.error.issues.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`).join("; ");
    throw new PremiumAiReportValidationError(`Premium AI report response failed validation: ${details}`, {
      cause: result.error,
    });
  }

  return result.data;
}

export async function generatePremiumAiReport(
  input: PremiumReportInput,
  provider: PremiumReportProvider = mockPremiumReportProvider,
): Promise<PremiumAiReport> {
  const prompt = buildPremiumReportPrompt(input);
  const rawReport = await provider.generate(prompt.messages);

  return parsePremiumAiReportResponse(rawReport);
}
