import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewPolicy, shortlistUnits, type ReviewServices } from '../lib/review.ts';
import { executeTurn, StudioError } from '../packages/dual-ai-core/orchestrator.ts';
import { ProviderError, ProviderStageError, type UsageReceipt } from '../packages/provider-adapters/contracts.ts';
import { registry } from '../packages/usage-ledger/pricing.ts';
import type { OperationStore } from '../packages/dual-ai-core/contracts.ts';
import type { ChatInput, Product } from '../lib/contracts.ts';

const input:ChatInput={message:'Compare this unit with the course brief',context:{qualificationCode:'BSB50420',objectives:'Develop managers who can lead difficult conversations',cohort:'New managers with access to workplace teams'},unitCodes:['BSBCMM412'],history:[]};
const qualification:Product={code:'BSB50420',title:'Fixture qualification',type:'qualification',status:'current',release:'fixture',sources:[],grid:[{code:'BSBCMM412',title:'Lead difficult conversations',isEssential:false,usageRecommendation:'current'}],sections:[],prerequisites:[],prerequisiteStatus:'verified'};
const unit:Product={...qualification,code:'BSBCMM412',title:'Fixture unit',type:'unit',grid:[],sections:[{id:'fixture-evidence',title:'Fixture evidence',type:'fixture',text:'Synthetic test evidence, not register text.'}]};
const score={type:'score',score:3.2,confidence:.8,probabilities:{'0':0,'1':0,'2':0,'3':.8,'4':.2}};
const answers={BSBCMM412_fit:score,BSBCMM412_cohort:score,BSBCMM412_sufficient:{type:'noul',noul:.92},BSBCMM412_evidence:{type:'choice',choice:'fixture-evidence',confidence:.9,probabilities:{none:0,'fixture-evidence':1}}};
const config=registry({},new Date('2026-10-23'));
const receipt=(provider:'typesafe'|'gemini'):UsageReceipt=>({provider,model:provider==='typesafe'?config.evaluator.model:config.generator.model,inputTokens:20,cachedInputTokens:0,outputTokens:5,reasoningTokens:0,nativeUsage:{fixture:true}});
function fixture(mode='success',existing:unknown=null){
  const events:string[]=[], calls:{action:string;payload:Record<string,unknown>}[]=[];
  let prompt='';
  const store:OperationStore={async call<T>(action:string,payload:Record<string,unknown>){events.push(action);calls.push({action,payload});if(action==='admit')return {status:existing?'complete':'new',result:existing,version:0,history:[{role:'user',content:'Stored prior question'}]} as T;if(action==='commit_reply')return payload.result as T;return {ok:true} as T;}};
  const services:ReviewServices={getProduct:async(code)=>code===qualification.code?qualification:unit,
    evaluate:async(request)=>{events.push('typesafe');assert.match(JSON.stringify(request.state),/Stored prior question/);if(mode==='reject')throw new ProviderError('TypeSafe',401);if(mode==='timeout')throw new Error('Network response lost');return {output:{model:config.evaluator.model,answers:mode==='malformed'?{}:answers},receipt:receipt('typesafe')};},
    generate:async(value)=>{events.push('gemini');prompt=value.prompt;if(mode==='generator_failure')throw new ProviderError('Gemini',429);if(mode==='preflight_timeout'||mode==='generation_timeout')throw new ProviderStageError(mode==='preflight_timeout'?'preflight':'generation',new DOMException('Synthetic timeout','TimeoutError'));return {output:{text:'Fixture explanation.',finishReason:'STOP'},receipt:receipt('gemini')};}};
  return {events,calls,prompt:()=>prompt,run:()=>executeTurn({requestId:crypto.randomUUID(),conversationId:crypto.randomUUID(),expectedVersion:0,message:input.message,requestHash:'fixture',immutableInput:input},config,store,reviewPolicy(input,config,services))};
}
test('fresh validated evaluation is durable before generation and final reply',async()=>{
  const f=fixture(),result=await f.run();
  assert.ok(f.events.indexOf('save_evaluation')<f.events.indexOf('gemini'));
  assert.ok(f.events.indexOf('typesafe')<f.events.indexOf('gemini'));
  assert.equal(result.assessment.assessments[0].fit,80);
  assert.equal(result.replyType,'gemini');
  assert.match(f.prompt(),/"fit":80/);
  assert.ok(!/"(?:nativeUsage|rate|cost_nano|API_KEY)"\s*:/.test(f.prompt()));
  assert.equal(f.calls.filter(c=>c.action==='settle_attempt').length,2);
});
test('malformed evaluator output is charged from its known receipt and never reaches Gemini',async()=>{
  const f=fixture('malformed'),r=await f.run();assert.ok(!f.events.includes('gemini'));assert.equal(r.assessment.assessments[0].fit,null);assert.equal(r.replyType,'evidence_only');assert.equal(f.calls.filter(c=>c.action==='settle_attempt').length,1);assert.match(r.reply,/Gemini was not called/);
});
test('definitive rejection releases that attempt and stops the model sequence',async()=>{
  const f=fixture('reject');const result=await f.run();assert.equal(result.stages?.find(s=>s.name==='jev')?.errorCode,'authentication');assert.equal(f.calls.find(c=>c.action==='reject_attempt')?.payload.definitive,true);assert.ok(!f.events.includes('gemini'));
});
test('ambiguous transport failure retains a hold and does not retry',async()=>{
  const f=fixture('timeout');await f.run();assert.equal(f.calls.find(c=>c.action==='reject_attempt')?.payload.definitive,false);assert.equal(f.events.filter(e=>e==='typesafe').length,1);assert.ok(!f.events.includes('gemini'));
});
test('generator failure preserves validated fit and returns a labelled summary',async()=>{
  const f=fixture('generator_failure'),r=await f.run();assert.equal(r.assessment.assessments[0].fit,80);assert.equal(r.replyType,'evidence_only');assert.match(r.reply,/Gemini explanation is unavailable/);
});
test('completed duplicate returns saved output without preparing or calling models',async()=>{
  const saved={reply:'Already saved'};const f=fixture('success',saved);assert.deepEqual(await f.run(),saved);assert.deepEqual(f.events,['admit']);
});
test('unsettled provider usage prevents generation after settlement failure',async()=>{
  const f=fixture(); // Independently exercise metering against a failing durable store.
  const {meteredCall}=await import('../packages/dual-ai-core/orchestrator.ts');let n=0;
  const store:OperationStore={async call<T>(action:string){if(action==='settle_attempt')throw new Error('DB unavailable');return {} as T;}};
  await assert.rejects(meteredCall(store,'fixture','evaluator',config.evaluator,async()=>{n++;return {output:{},receipt:receipt('typesafe')};}),StudioError);assert.equal(n,1);assert.equal(f.events.length,0);
});
test('automatic research shortlisting uses verified grid codes without a generator',()=>{
  assert.deepEqual(shortlistUnits({...input,unitCodes:[]},qualification),[unit.code]);
});

for(const mode of ['preflight_timeout','generation_timeout'])test(`${mode}: preserve JEV and distinguish unsent from uncertain generation`,async()=>{
  const f=fixture(mode),r=await f.run();
  assert.equal(r.assessment.assessments[0].fit,80);assert.equal(r.replyType,'evidence_only');
  assert.equal(r.stages?.find(s=>s.name==='explanation')?.errorCode,'timeout');
  assert.equal(f.calls.find(c=>c.action==='reject_attempt')?.payload.definitive,mode==='preflight_timeout');
  assert.equal(f.calls.filter(c=>c.action==='settle_attempt').length,1);
  assert.equal(f.events.filter(e=>e==='gemini').length,1);
});
