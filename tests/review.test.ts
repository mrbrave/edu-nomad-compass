import test from "node:test";
import assert from "node:assert/strict";
import { chatSchema } from "../lib/contracts.ts";
import type { Product } from "../lib/contracts.ts";
import { contentText } from "../lib/text.ts";
import { checkRules, recommendation } from "../lib/rules.ts";
import { parseUnitAnswers, validDistribution } from "../lib/jev.ts";
import { protect } from "../lib/http.ts";

const base:Product={code:"BSB50420",title:"Diploma of Leadership and Management",type:"qualification",status:"current",release:"3",sections:[],prerequisites:[],prerequisiteStatus:"verified",sources:[],grid:[{code:"BSBCMM511",title:"Communicate with influence",isEssential:true,usageRecommendation:"current"},{code:"BSBCMM412",title:"Lead difficult conversations",isEssential:false,usageRecommendation:"current"}]};
const unit:Product={...base,code:"BSBCMM412",type:"unit",title:"Lead difficult conversations",grid:[],sections:[{id:"evidence-1",title:"Performance evidence",type:"PerformanceEvidence",text:"Evidence of leading difficult conversations."}]};
const score={type:"score",score:3.2,confidence:.8,probabilities:{"0":0,"1":0,"2":0,"3":.8,"4":.2}};
const answers={BSBCMM412_fit:score,BSBCMM412_cohort:score,BSBCMM412_sufficient:{type:"noul",noul:.92},BSBCMM412_evidence:{type:"choice",choice:"evidence-1",confidence:.9,probabilities:{none:0,"evidence-1":1}}};

test("core requirements remain core regardless of fit",()=>{
  const rules=checkRules(base,{...unit,code:"BSBCMM511"});assert.equal(rules.status,"core");assert.equal(recommendation(0,.9,.95,[]),"weak");assert.equal(rules.label,"Core unit");
});
test("an unlisted unit requires an importing review, not automatic rejection",()=>{
  const r=checkRules(base,{...unit,code:"BSBLDR411"});assert.equal(r.status,"not_listed");assert.equal(r.blockers.length,0);assert.match(r.checksRequired[0],/importing rules/);
});
test("currency and missing prerequisite data remain visible",()=>{
  const r=checkRules(base,{...unit,status:"superseded",prerequisiteStatus:"unavailable"});assert.equal(r.blockers.length,1);assert.match(r.checksRequired[0],/could not be verified/);
});
test("JEV rubric scores are normalised and tied to a real source section",()=>{
  const r=parseUnitAnswers(answers,unit,base);assert.equal(r.fit,80);assert.equal(r.evidenceId,"evidence-1");assert.equal(r.recommendation,"strong");assert.equal(r.rules.status,"listed_elective");
});
test("insufficient evidence withholds a fit index",()=>{
  const r=parseUnitAnswers({...answers,BSBCMM412_sufficient:{type:"noul",noul:.4}},unit,base);assert.equal(r.fit,null);assert.equal(r.recommendation,"insufficient");
});
test("missing or unrecognised evidence cannot support an assessment",()=>{
  const r=parseUnitAnswers({...answers,BSBCMM412_evidence:{type:"choice",choice:"none",confidence:.9,probabilities:{none:1,"evidence-1":0}}},unit,base);assert.equal(r.fit,null);
  assert.throws(()=>parseUnitAnswers({...answers,BSBCMM412_evidence:{type:"choice",choice:"invented",confidence:1,probabilities:{invented:1}}},unit,base));
});
test("invalid distributions, confidence and missing answers are rejected",()=>{
  assert.equal(validDistribution({"0":.6,"1":.6},["0","1"]),false);
  assert.throws(()=>parseUnitAnswers({...answers,BSBCMM412_fit:{...score,confidence:2}},unit,base));
  assert.throws(()=>parseUnitAnswers({...answers,BSBCMM412_cohort:undefined},unit,base));
});
test("request validation bounds scope and prevents URL injection",()=>{
  const input={message:"Compare these units",context:{qualificationCode:"BSB50420",objectives:"Develop practical leadership skills",cohort:"New managers"},unitCodes:["BSBCMM412"]};
  assert.equal(chatSchema.parse(input).context.qualificationCode,"BSB50420");
  assert.throws(()=>chatSchema.parse({...input,unitCodes:["https://example.com"]}));
  assert.throws(()=>chatSchema.parse({...input,unitCodes:Array(5).fill("BSBCMM412")}));
});
test("official HTML is converted to inert text, including escaped line breaks",()=>{
  assert.equal(contentText('<div><p>A &amp; B</p>\\r\\n<script>alert(1)</script><p>Evidence</p></div>'),"A & B\n Evidence");
});
test("an optional app access key is enforced without disclosing it",()=>{
  process.env.COMPASS_ACCESS_TOKEN="test-only-key";
  assert.equal(protect(new Request("http://localhost/api/register"))?.status,401);
  assert.equal(protect(new Request("http://localhost/api/register",{headers:{authorization:"Bearer test-only-key"}})),undefined);
  delete process.env.COMPASS_ACCESS_TOKEN;
});
