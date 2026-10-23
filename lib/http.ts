import { accessStatus } from "../packages/shared-auth/access-control.ts";
import { ZodError } from "zod";
import { StudioError } from "../packages/dual-ai-core/orchestrator.ts";
const requests=new Map<string,{count:number;reset:number}>();
export function protect(request:Request){
  const token=process.env.STUDIO_ACCESS_TOKEN?.trim() || process.env.COMPASS_ACCESS_TOKEN?.trim();
  const access=accessStatus(request,token);
  if(access!=="ready")return Response.json({error:access==="locked"?"Enter the Studio access code.":"Studio access is not configured."},{status:access==="locked"?401:503,headers:{"Cache-Control":"no-store"}});
  if(request.method==="POST"){
    const origin=request.headers.get("origin");
    if(origin&&new URL(origin).host!==new URL(request.url).host) return Response.json({error:"This request must originate from the prototype."},{status:403});
    const ip=request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"local";
    const now=Date.now();
    if(requests.size>2000)requests.clear();
    let bucket=requests.get(ip);if(!bucket||bucket.reset<now){bucket={count:0,reset:now+300000};requests.set(ip,bucket);}
    if(++bucket.count>10)return Response.json({error:"Review limit reached. Please retry in five minutes."},{status:429,headers:{"Retry-After":"300"}});
  }
}
export function errorResponse(error:unknown){
  if(error instanceof StudioError){
    const messages:Record<string,string>={live_disabled:"Live Studio requests are disabled in this environment.",credits_exhausted:"The internal allowance is insufficient for this review. Contact the workspace operator.",workspace_busy:"Another operation is pending or requires review. Recover its status before starting another request.",request_conflict:"This request ID belongs to different content. Start a new review.",version_conflict:"This conversation has changed. Start a new review to use the latest brief.",brief_conflict:"The course brief has changed. Start a new review.",review_required:"This operation needs usage reconciliation. Recover its status; do not resubmit it.",admitted:"This request is still pending. Recover its status.",misconfigured:"Studio configuration is incomplete.",ledger_unavailable:"Usage records could not be reached. Recover this operation before resubmitting."};
    return Response.json({error:messages[error.code]??"This operation could not be completed. Recover its status before resubmitting.",code:error.code},{status:error.status,headers:{"Cache-Control":"no-store"}});
  }
  return Response.json({error:error instanceof ZodError||error instanceof SyntaxError?"Check the course brief, unit selection and request details.":"The review could not complete. Recover its status before starting another request."},{status:error instanceof ZodError||error instanceof SyntaxError?400:502,headers:{"Cache-Control":"no-store"}});
}
