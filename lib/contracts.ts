import { z } from "zod";
import type { FailureCode } from "../packages/dual-ai-core/contracts.ts";

export const codeSchema = z.string().trim().toUpperCase().regex(/^[A-Z][A-Z0-9]{2,19}$/);
export const contextSchema = z.object({
  qualificationCode: codeSchema,
  objectives: z.string().trim().min(12).max(2400),
  cohort: z.string().trim().min(5).max(1200),
});
export const chatSchema = z.object({
  message: z.string().trim().min(1).max(3000),
  context: contextSchema,
  unitCodes: z.array(codeSchema).max(4).default([]),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(7000) })).max(10).default([]),
});
export type CourseContext = z.infer<typeof contextSchema>;
export type ChatInput = z.infer<typeof chatSchema>;
export interface Source { id: string; title: string; url: string; retrievedAt: string; release?: string }
export interface Section { id: string; title: string; type: string; text: string }
export interface GridUnit { code: string; title: string; isEssential: boolean; usageRecommendation: string }
export interface Product {
  code: string; title: string; type: string; status: string; release: string;
  sections: Section[]; prerequisites: { code: string; title: string }[];
  prerequisiteStatus: "verified" | "unavailable";
  sources: Source[]; grid: GridUnit[]; packaging?: { core: number; elective: number };
}
export interface RuleCheck {
  code: string; status: "core" | "listed_elective" | "not_listed";
  label: string; blockers: string[]; checksRequired: string[];
}
export interface UnitAssessment {
  code: string; title: string; fit: number | null; confidence: number | null;
  cohortFit: number | null; evidenceSufficiency: number | null;
  evidenceId: string | null; evidenceTitle: string | null;
  recommendation: "strong" | "possible" | "weak" | "insufficient";
  rules: RuleCheck;
}
export interface Assessment {
  id: string; createdAt: string; context: CourseContext;
  qualification: Product; units: Product[]; assessments: UnitAssessment[];
  evaluator: { status: "complete" | "unavailable" | "sample"; model: string; reason?: string; usage?: { inputTokens?: number; outputTokens?: number } };
  limitations: string[]; sources: Source[];
}
export interface WorkflowStage {
  name: "register" | "units" | "jev" | "explanation";
  status: "complete" | "unavailable";
  durationMs: number;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  errorCode?: FailureCode;
}
export interface ChatResult {
  reply: string; replyType: "gemini" | "evidence_only" | "demo"; assessment: Assessment; trace: string[]; stages?: WorkflowStage[];
  operationId?: string; conversationId?: string; conversationVersion?: number; question?: string;
  assessmentStatus?: "not_requested" | "disabled";
}
