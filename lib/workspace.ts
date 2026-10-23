import { z } from "zod";
import { repository } from "../packages/shared-persistence/repository.ts";
import type { WorkspaceCredits } from "../packages/usage-ledger/public-projection.ts";
export type { WorkspaceCredits } from "../packages/usage-ledger/public-projection.ts";
const publicUsage = z.object({status:z.enum(["available","pending","exhausted","review_required","not_configured"]),remainingPercent:z.number().min(0).max(100).nullable(),belowOnePercent:z.boolean(),updatedAt:z.string(),label:z.string().max(80)});
export async function workspaceCredits(): Promise<WorkspaceCredits> {
  if (!process.env.STUDIO_LEDGER_URL || !process.env.STUDIO_LEDGER_TOKEN) return {status:"misconfigured",remainingPercent:null,updatedAt:null,label:"Usage not configured",liveEnabled:false};
  try { return {...publicUsage.parse(await repository().call("snapshot",{})),liveEnabled:process.env.STUDIO_ENABLE_LIVE==="true"}; }
  catch { return {status:"unavailable",remainingPercent:null,updatedAt:null,label:"Usage temporarily unavailable",liveEnabled:false}; }
}
