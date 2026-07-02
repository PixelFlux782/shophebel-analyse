import { z } from "zod";

const impactSchema = z.enum(["low", "medium", "high"]);
const effortSchema = z.enum(["low", "medium", "high"]);
const actionPrioritySchema = z.enum(["now", "next", "later"]);

export const premiumAiTopIssueSchema = z.object({
  title: z.string().min(1),
  whyItMatters: z.string().min(1),
  evidence: z.array(z.string().min(1)),
  recommendedAction: z.string().min(1),
  impact: impactSchema,
  effort: effortSchema,
});

export const premiumAiActionStepSchema = z.object({
  step: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().min(1),
  priority: actionPrioritySchema,
});

export const premiumAiExampleImprovementsSchema = z.object({
  heroTextIdeas: z.array(z.string().min(1)),
  ctaIdeas: z.array(z.string().min(1)),
  trustElementIdeas: z.array(z.string().min(1)),
});

export const premiumAiReportSchema = z.object({
  executiveSummary: z.string().min(1),
  mainDiagnosis: z.string().min(1),
  scoreExplanation: z.string().min(1),
  topIssues: z.array(premiumAiTopIssueSchema).min(1),
  actionPlan: z.array(premiumAiActionStepSchema).min(1),
  exampleImprovements: premiumAiExampleImprovementsSchema,
  disclaimer: z.string().min(1),
});

export type PremiumAiTopIssue = z.infer<typeof premiumAiTopIssueSchema>;
export type PremiumAiActionStep = z.infer<typeof premiumAiActionStepSchema>;
export type PremiumAiExampleImprovements = z.infer<typeof premiumAiExampleImprovementsSchema>;
export type PremiumAiReport = z.infer<typeof premiumAiReportSchema>;
