import { z } from "zod";

const boundedString = z.string().trim().min(1).max(900);

export const premiumAiTopLeverSchema = z.object({
  title: z.string().min(1),
  problem: boundedString,
  businessImpact: boundedString,
  recommendation: boundedString,
  firstStep: boundedString,
});

export const premiumAiSevenDayPlanItemSchema = z.object({
  day: z.string().min(1).max(40),
  focus: boundedString,
  tasks: z.array(z.string().trim().min(1).max(220)).min(1).max(4),
});

export const premiumAiReportSchema = z.object({
  executiveSummary: boundedString,
  mainDiagnosis: boundedString,
  topLevers: z.array(premiumAiTopLeverSchema).min(3).max(3),
  sevenDayPlan: z.array(premiumAiSevenDayPlanItemSchema).min(3).max(3),
  ownerConclusion: boundedString,
});

export type PremiumAiTopLever = z.infer<typeof premiumAiTopLeverSchema>;
export type PremiumAiSevenDayPlanItem = z.infer<typeof premiumAiSevenDayPlanItemSchema>;
export type PremiumAiReport = z.infer<typeof premiumAiReportSchema>;
