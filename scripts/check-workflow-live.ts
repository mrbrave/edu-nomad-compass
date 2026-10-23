import { reviewCourse } from "../lib/review.ts";
import { gatewayAuthentication } from "../lib/gateway.ts";

// One synthetic, selected-unit review. No real user context or secrets are emitted.
const started=performance.now();
try {
  const result=await reviewCourse({
    message:"Explain whether this unit supports the objectives. Identify one source section and one assessment check. If JEV is unavailable, explicitly withhold suitability scores.",
    context:{qualificationCode:"BSB50420",objectives:"Develop frontline managers who can prepare and lead difficult workplace conversations.",cohort:"Experienced team leaders in Australian businesses with access to workplace teams."},
    unitCodes:["BSBCMM412"],history:[],
  });
  const grounding=result.assessment.assessments.every(a=>!!a.evidenceId&&result.assessment.units.find(u=>u.code===a.code)?.sections.some(s=>s.id===a.evidenceId));
  const cited=/https:\/\/training\.gov\.au\//.test(result.reply);
  const sequence=(result.stages?.findIndex(s=>s.name==="jev")??-1)<(result.stages?.findIndex(s=>s.name==="explanation")??-1);
  let authentication="unavailable";try{authentication=gatewayAuthentication().method;}catch{}
  const report={version:1,runAt:new Date().toISOString(),kind:"live",caseId:"LIVE-01",authentication,commit:process.env.VERCEL_GIT_COMMIT_SHA??null,
    durationMs:Math.round(performance.now()-started),evaluator:result.assessment.evaluator.status,replyType:result.replyType,
    stages:result.stages,units:result.assessment.assessments.map(u=>({code:u.code,fit:u.fit,confidence:u.confidence,evidenceId:u.evidenceId})),
    sourceCount:result.assessment.sources.length,grounding,hasOfficialCitation:cited,jevBeforeExplanation:sequence,
    outcome:result.assessment.evaluator.status==="complete"&&result.replyType==="gemini"&&grounding&&cited&&sequence?"PASS":"DEGRADED",
    reviewNeeded:"Automated connectivity and sequence check. Explanation quality still requires human review."};
  console.log("COMPASS_LIVE_CHECK "+JSON.stringify(report));
} catch {
  console.log("COMPASS_LIVE_CHECK "+JSON.stringify({version:1,runAt:new Date().toISOString(),kind:"live",caseId:"LIVE-01",outcome:"BLOCKED",durationMs:Math.round(performance.now()-started),reason:"The live workflow could not complete. Inspect this deployment's service configuration; no private error payload is recorded."}));
}
