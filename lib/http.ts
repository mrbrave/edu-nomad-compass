import { timingSafeEqual } from "node:crypto";
import { ZodError } from "zod";
const requests=new Map<string,{count:number;reset:number}>();
export function protect(request:Request){
  const token=process.env.COMPASS_ACCESS_TOKEN;
  if(token){
    const supplied=(request.headers.get("authorization")??"").replace(/^Bearer /,"");
    const a=Buffer.from(token),b=Buffer.from(supplied);
    if(a.length!==b.length||!timingSafeEqual(a,b))return Response.json({error:"Enter the access key for this prototype."},{status:401});
  }
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
  const message=error instanceof ZodError||error instanceof SyntaxError?"Check the course code, objectives, cohort and unit selection.":error instanceof Error?error.message:"This review could not be completed. Please retry.";
  const safe=/register|product code|official content|qualification|shortlist|unit|review|AI access|research planner/i.test(message)?message:"The service could not complete this request. Please retry.";
  return Response.json({error:safe},{status:error instanceof ZodError||error instanceof SyntaxError?400:502});
}
