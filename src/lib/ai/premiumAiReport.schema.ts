import { z } from "zod";

const boundedString = z.string().trim().min(1).max(900);
const requiredSevenDayPhases = ["Tag 1-2", "Tag 3-5", "Tag 6-7"] as const;

export const premiumAiTopLeverSchema = z.object({
  title: z.string().min(1),
  whyItMatters: boundedString,
  shopObservation: boundedString,
  improvement: boundedString,
  firstStep: boundedString,
  difficulty: z.enum(["leicht", "mittel", "anspruchsvoll"]),
  expectedEffect: boundedString,
});

export const premiumAiSevenDayPlanItemSchema = z.object({
  day: z.enum(["Tag 1-2", "Tag 3-5", "Tag 6-7"]),
  focus: boundedString,
  tasks: z.array(z.string().trim().min(1).max(220)).min(1).max(4),
});

export const premiumAiWebsiteSystemSchema = z.object({
  overallWebsiteScore: z.number().min(0).max(100),
  crossPageDiagnosis: boundedString,
  repeatedProblems: z.array(z.string().trim().min(1).max(220)).max(5),
  conversionPathAssessment: boundedString,
  trustConsistencyAssessment: boundedString,
  navigationAssessment: boundedString,
  topPrioritiesWebsiteWide: z.array(z.string().trim().min(1).max(220)).min(1).max(5),
  missingPageTypes: z.array(z.string().trim().min(1).max(80)).max(5),
});

export const premiumAiReportSchema = z.object({
  executiveSummary: boundedString,
  mainDiagnosis: boundedString,
  websiteSystem: premiumAiWebsiteSystemSchema,
  topLevers: z.array(premiumAiTopLeverSchema).min(3).max(3),
  sevenDayPlan: z.array(premiumAiSevenDayPlanItemSchema).min(3).max(3),
  ownerConclusion: boundedString,
}).superRefine((report, context) => {
  report.sevenDayPlan.forEach((step, index) => {
    if (step.day !== requiredSevenDayPhases[index]) {
      context.addIssue({
        code: "custom",
        path: ["sevenDayPlan", index, "day"],
        message: `Expected ${requiredSevenDayPhases[index]}.`,
      });
    }
  });
});

export type PremiumAiTopLever = z.infer<typeof premiumAiTopLeverSchema>;
export type PremiumAiSevenDayPlanItem = z.infer<typeof premiumAiSevenDayPlanItemSchema>;
export type PremiumAiWebsiteSystem = z.infer<typeof premiumAiWebsiteSystemSchema>;
export type PremiumAiReport = z.infer<typeof premiumAiReportSchema>;
