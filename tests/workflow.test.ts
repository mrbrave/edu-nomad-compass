import test from "node:test";
import assert from "node:assert/strict";
import { reviewWithServices, type ReviewServices } from "../lib/review.ts";
import { normaliseCredits, workspaceCredits } from "../lib/workspace.ts";
import type { Assessment, ChatInput, Product } from "../lib/contracts.ts";

const input:ChatInput={message:"Compare this unit with the course brief",context:{qualificationCode:"BSB50420",objectives:"Develop managers who can lead difficult conversations",cohort:"New managers with access to workplace teams"},unitCodes:["BSBCMM412"],history:[]};
const qualification:Product={code:"BSB50420",title:"Fixture qualification",type:"qualification",status:"current",release:"fixture",sources:[],grid:[{code:"BSBCMM412",title:"Fixture unit",isEssential:false,usageRecommendation:"current"}],sections:[],prerequisites:[],prerequisiteStatus:"verified"};
const unit:Product={...qualification,code:"BSBCMM412",title:"Fixture unit",type:"unit",grid:[],sections:[{id:"fixture-evidence",title:"Fixture evidence",type:"fixture",text:"Synthetic test evidence, not register text."}]};

function fixture(failJev=false,failGemini=false){
  const events:string[]=[];
  let received:Assessment|undefined;
  const services:ReviewServices={
    getProduct:async(code)=>{events.push(code);return code===qualification.code?qualification:unit;},
    discoverUnits:async()=>{events.push("planner");return [unit.code];},
    assessWithJev:async()=>{events.push("jev");if(failJev)throw new Error("Fixture service unavailable");return {model:"fixture-jev",usage:{inputTokens:20,outputTokens:5},assessments:[{code:unit.code,title:unit.title,fit:80,cohortFit:75,confidence:.8,evidenceSufficiency:.9,evidenceId:"fixture-evidence",evidenceTitle:"Fixture evidence",recommendation:"strong",rules:{code:unit.code,status:"listed_elective",label:"Listed elective",blockers:[],checksRequired:[]}}]};},
    explainAssessment:async(_,assessment)=>{events.push("gemini");received=assessment;if(failGemini)throw new Error("Fixture explanation unavailable");return {reply:assessment.evaluator.status==="complete"?"Fixture explanation of evaluated evidence.":"Fixture evidence only; fit has not been assessed.",usage:{inputTokens:30,outputTokens:12}};},
  };
  return {services,events,assessment:()=>received};
}

test("JEV completes before Gemini receives the fresh assessment",async()=>{
  const f=fixture();const r=await reviewWithServices(input,f.services);
  assert.deepEqual(f.events,["BSB50420","BSBCMM412","jev","gemini"]);
  assert.equal(f.assessment()?.assessments[0].fit,80);
  assert.equal(f.assessment()?.evaluator.status,"complete");
  assert.deepEqual(r.stages?.map(s=>s.name),["register","units","jev","explanation"]);
  assert.equal(r.stages?.at(-1)?.inputTokens,30);
});
test("JEV failure is passed to Gemini with fit withheld",async()=>{
  const f=fixture(true);const r=await reviewWithServices(input,f.services);
  assert.equal(f.assessment()?.assessments[0].fit,null);
  assert.equal(f.assessment()?.evaluator.status,"unavailable");
  assert.match(r.reply,/fit has not been assessed/);
  assert.equal(r.stages?.find(s=>s.name==="jev")?.status,"unavailable");
  assert.ok(!r.trace.some(t=>/completed JEV assessment/.test(t)));
});
test("Gemini failure preserves JEV results and labels the fallback",async()=>{
  const f=fixture(false,true);const r=await reviewWithServices(input,f.services);
  assert.equal(r.assessment.assessments[0].fit,80);assert.equal(r.replyType,"evidence_only");
  assert.match(r.reply,/Gemini explanation is unavailable/);
});
test("both model failures keep evidence without substitute scores",async()=>{
  const f=fixture(true,true);const r=await reviewWithServices(input,f.services);
  assert.equal(r.assessment.assessments[0].fit,null);assert.equal(r.replyType,"evidence_only");
  assert.match(r.reply,/no scores are shown/);
});
test("autonomous planning precedes unit retrieval and assessment",async()=>{
  const f=fixture();await reviewWithServices({...input,unitCodes:[]},f.services);
  assert.deepEqual(f.events,["BSB50420","planner","BSBCMM412","jev","gemini"]);
});
test("credits disclose only a validated remaining percentage",()=>{
  const result=normaliseCredits({total:100,remaining:78.8,updatedAt:"2026-10-23T00:00:00Z",privateBudget:500});
  assert.equal(result.remainingPercent,78);assert.equal("total" in result,false);assert.equal("privateBudget" in result,false);
  assert.equal(normaliseCredits({total:100,remaining:.1,updatedAt:"2026-10-23T00:00:00Z"}).belowOnePercent,true);
  assert.equal(normaliseCredits({total:100,remaining:0,updatedAt:"2026-10-23T00:00:00Z"}).belowOnePercent,false);
  assert.throws(()=>normaliseCredits({total:0,remaining:2,updatedAt:"2026-10-23T00:00:00Z"}));
  assert.throws(()=>normaliseCredits({total:100,remaining:101,updatedAt:"2026-10-23T00:00:00Z"}));
});
test("an unconnected credits source is unknown, never a fabricated balance",async()=>{
  const before=process.env.COMPASS_CREDITS_URL;delete process.env.COMPASS_CREDITS_URL;
  try{const result=await workspaceCredits();assert.equal(result.status,"not_configured");assert.equal(result.remainingPercent,null);}
  finally{if(before===undefined)delete process.env.COMPASS_CREDITS_URL;else process.env.COMPASS_CREDITS_URL=before;}
});

test("hosted model calls use this project's OIDC identity consistently",async()=>{
  const {gatewayAuthentication}=await import('../lib/gateway.ts');
  assert.equal(gatewayAuthentication({VERCEL_ENV:"preview",VERCEL_OIDC_TOKEN:"fixture-oidc",AI_GATEWAY_API_KEY:"fixture-key"}).method,"oidc");
  assert.equal(gatewayAuthentication({AI_GATEWAY_API_KEY:"fixture-key"}).method,"api-key");
});
test("blank and recognised placeholder Gateway credentials are not treated as access",async()=>{
  const {gatewayAuthentication}=await import('../lib/gateway.ts');
  assert.throws(()=>gatewayAuthentication({AI_GATEWAY_API_KEY:"   "}));
  assert.throws(()=>gatewayAuthentication({AI_GATEWAY_API_KEY:"replace-me"}));
});
