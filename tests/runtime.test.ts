import test from 'node:test';
import assert from 'node:assert/strict';
import { accessStatus } from '../packages/shared-auth/access-control.ts';
import { workspaceCredits } from '../lib/workspace.ts';
import { assessSavedReply, studioTurn } from '../lib/studio.ts';

async function withRuntime(fn:()=>Promise<void>){
  const names=['STUDIO_ENABLE_LIVE','TYPESAFE_API_KEY','GEMINI_API_KEY','STUDIO_LEDGER_URL','STUDIO_LEDGER_TOKEN','ENABLE_POST_REPLY_ASSESSMENT','VERCEL_ENV'];
  const before=names.map(k=>process.env[k]),original=globalThis.fetch;
  Object.assign(process.env,{STUDIO_ENABLE_LIVE:'true',TYPESAFE_API_KEY:'synthetic-typesafe',GEMINI_API_KEY:'synthetic-gemini',STUDIO_LEDGER_URL:'https://ledger.example.test',STUDIO_LEDGER_TOKEN:'synthetic-ledger',ENABLE_POST_REPLY_ASSESSMENT:'true',VERCEL_ENV:'preview'});
  try{await fn();}finally{names.forEach((k,i)=>before[i]===undefined?delete process.env[k]:process.env[k]=before[i]);globalThis.fetch=original;}
}
test('private access fails closed when missing and accepts only the application code',()=>{
  assert.equal(accessStatus(new Request('https://app.example.test'),undefined),'misconfigured');
  assert.equal(accessStatus(new Request('https://app.example.test'),'private-app-code'),'locked');
  assert.equal(accessStatus(new Request('https://app.example.test',{headers:{Authorization:'Bearer provider-key'}}),'private-app-code'),'locked');
  assert.equal(accessStatus(new Request('https://app.example.test',{headers:{Authorization:'Bearer private-app-code'}}),'private-app-code'),'ready');
});
test('usage projection strips private totals, receipts and identity from a trusted source',async()=>withRuntime(async()=>{
  globalThis.fetch=async(_url,init)=>{assert.equal(JSON.parse(String(init?.body)).workspace,'preview');return Response.json({status:'available',remainingPercent:42,belowOnePercent:false,updatedAt:'2026-10-23T00:00:00Z',label:'Studio allowance',allocation:999,receipt:{private:true},key:'hidden',tenant:'private'});};
  const result=await workspaceCredits();assert.equal(result.remainingPercent,42);for(const key of ['allocation','receipt','key','tenant'])assert.equal(key in result,false);
}));
test('missing usage configuration never becomes a fictional zero or balance',async()=>withRuntime(async()=>{
  delete process.env.STUDIO_LEDGER_TOKEN;const result=await workspaceCredits();assert.equal(result.remainingPercent,null);assert.equal(result.status,'misconfigured');assert.equal(result.liveEnabled,false);
}));
test('live-disabled environments make no provider or ledger request',async()=>withRuntime(async()=>{
  process.env.STUDIO_ENABLE_LIVE='false';let calls=0;globalThis.fetch=async()=>{calls++;throw new Error('Unexpected request');};
  await assert.rejects(studioTurn({requestId:crypto.randomUUID(),conversationId:crypto.randomUUID(),expectedVersion:0,message:'Review this unit',context:{qualificationCode:'BSB50420',objectives:'Develop leadership skills for workplace managers',cohort:'New managers'},unitCodes:['BSBCMM412']}));assert.equal(calls,0);
}));
test('independent saved-reply assessment calls only the evaluator and preserves the reply',async()=>withRuntime(async()=>{
  const conversationId=crypto.randomUUID(),sourceOperationId=crypto.randomUUID(),requestId=crypto.randomUUID();let models=0;const actions:string[]=[];
  const saved={reply:'Saved original reply',question:'Synthetic question',conversationId,conversationVersion:1,assessment:{context:{},units:[],assessments:[],limitations:[]}};
  globalThis.fetch=async(url,init)=>{
    if(String(url).startsWith('https://ledger.example.test')){const body=JSON.parse(String(init?.body));actions.push(body.action);if(body.action==='recover')return Response.json({status:'complete',result:saved});if(body.action==='admit')return Response.json({status:'new',result:null});if(body.action==='commit_assessment')return Response.json(body.payload.result);return Response.json({ok:true});}
    assert.equal(String(url),'https://api.typesafe.ai/v1/systemone');models++;assert.equal(JSON.parse(String(init?.body)).state.reply,'Saved original reply');return Response.json({model:'jev-1.14.0',answers:{grounded:{type:'noul',noul:.9},limitations:{type:'noul',noul:.8}},usage:{input_tokens:10,output_tokens:2}});
  };
  const result=await assessSavedReply({requestId,conversationId,expectedVersion:1,sourceOperationId}) as {status:string};assert.equal(result.status,'complete');assert.equal(models,1);assert.ok(actions.includes('settle_attempt'));assert.ok(actions.includes('commit_assessment'));assert.ok(!actions.includes('commit_reply'));assert.equal(saved.reply,'Saved original reply');
}));
test('stale saved-reply requests fail before admitting or calling a provider',async()=>withRuntime(async()=>{
  let calls=0;globalThis.fetch=async()=>{calls++;return Response.json({status:'complete',result:{conversationId:crypto.randomUUID(),conversationVersion:1}});};
  await assert.rejects(assessSavedReply({requestId:crypto.randomUUID(),conversationId:crypto.randomUUID(),expectedVersion:1,sourceOperationId:crypto.randomUUID()}));assert.equal(calls,1);
}));
