import test from 'node:test';
import assert from 'node:assert/strict';
import { generateGemini, normaliseGeminiUsage } from '../packages/provider-adapters/gemini.ts';
import { evaluateTypeSafe } from '../packages/provider-adapters/typesafe.ts';
import { ProviderError, serverKey } from '../packages/provider-adapters/contracts.ts';
import { costOf, registry, ceiling } from '../packages/usage-ledger/pricing.ts';
import { environmentWorkspace } from '../packages/shared-persistence/repository.ts';
import { requestHash, turnSchema } from '../lib/studio.ts';

const envFixture=async(names:string[],fn:()=>Promise<void>)=>{const old=names.map(n=>process.env[n]);names.forEach(n=>process.env[n]='synthetic-private-test-key');try{await fn();}finally{names.forEach((n,i)=>old[i]===undefined?delete process.env[n]:process.env[n]=old[i]);}};
test('TypeSafe uses its own fixed host and credential without an intermediary',async()=>envFixture(['TYPESAFE_API_KEY'],async()=>{
  const result=await evaluateTypeSafe({model:'jev-1.14.0',state:'Synthetic state',questions:{q:{type:'noul',instructions:'Synthetic question'}}},async(url,init)=>{assert.equal(url,'https://api.typesafe.ai/v1/systemone');assert.equal(new Headers(init?.headers).get('authorization'),'Bearer synthetic-private-test-key');assert.equal(new Headers(init?.headers).has('ai-gateway-auth-method'),false);return Response.json({model:'jev-1.14.0',answers:{q:{type:'noul',noul:.8}},usage:{input_tokens:12,output_tokens:3}});});
  assert.equal(result.receipt.inputTokens,12);
}));
test('Gemini preflights once and generates once with header-only credentials',async()=>envFixture(['GEMINI_API_KEY'],async()=>{
  const requests:string[]=[];
  const fetcher:typeof fetch=async(url,init)=>{const u=String(url);requests.push(u);assert.ok(u.startsWith('https://generativelanguage.googleapis.com/'));assert.ok(!u.includes('?key='));assert.equal(new Headers(init?.headers).get('x-goog-api-key'),'synthetic-private-test-key');return u.endsWith(':countTokens')?Response.json({totalTokens:20}):Response.json({modelVersion:'gemini-3.8-flash',responseId:'fixture-id',candidates:[{finishReason:'STOP',content:{parts:[{thought:true,text:'Hidden thinking'},{text:'Visible reply'}]}}],usageMetadata:{promptTokenCount:20,cachedContentTokenCount:5,candidatesTokenCount:8,thoughtsTokenCount:3,totalTokenCount:31}});};
  const r=await generateGemini({model:'gemini-3.8-flash',instructions:'Synthetic instructions',prompt:'Synthetic question'},fetcher);assert.equal(requests.length,2);assert.equal(r.output.text,'Visible reply');assert.equal(r.receipt.cachedInputTokens,5);assert.equal(r.receipt.reasoningTokens,3);assert.equal(r.receipt.responseId,'fixture-id');
}));
test('provider rejection is not retried and its error excludes response text',async()=>envFixture(['TYPESAFE_API_KEY'],async()=>{
  let calls=0;await assert.rejects(evaluateTypeSafe({model:'jev-1.14.0',state:'x',questions:{}},async()=>{calls++;return new Response('Sensitive provider detail',{status:401});}),e=>e instanceof ProviderError&&e.definitiveRejection&&!e.message.includes('Sensitive'));assert.equal(calls,1);
}));
test('usage normalisation rejects unsupported or inconsistent receipts',()=>{
  assert.throws(()=>normaliseGeminiUsage({promptTokenCount:4,cachedContentTokenCount:5,totalTokenCount:4}));
  assert.throws(()=>normaliseGeminiUsage({promptTokenCount:4,totalTokenCount:8}));
  assert.throws(()=>normaliseGeminiUsage({promptTokenCount:4,toolUsePromptTokenCount:2,totalTokenCount:6}));
});
test('pricing charges cached input once and includes thinking with precise integers',()=>{
  const rate=registry({},new Date('2026-10-23')).generator;
  assert.equal(costOf({provider:'gemini',model:rate.model,inputTokens:100,cachedInputTokens:20,outputTokens:10,reasoningTokens:5,nativeUsage:{}},rate),'117750');
  assert.ok(BigInt(ceiling(rate))>0);assert.throws(()=>costOf({provider:'gemini',model:'unknown',inputTokens:1,cachedInputTokens:0,outputTokens:0,reasoningTokens:0,nativeUsage:{}},rate));
});
test('new prices affect newly admitted registrations, leaving pinned cards unchanged',()=>{
  const old=registry({},new Date('2026-10-23')).generator;const next=registry({},new Date('2027-01-01')).generator;assert.equal(old.input,750);assert.equal(next.input,1500);assert.notEqual(old.version,next.version);assert.equal(old.input,750);
});
test('unsupported models, providers, billing tiers and placeholder keys fail closed',()=>{
  for(const env of [{GENERATOR_MODEL:'unknown'},{EVALUATOR_PROVIDER:'unknown'},{GENERATOR_BILLING_TIER:'free'}])assert.throws(()=>registry(env));
  assert.throws(()=>serverKey('GEMINI_API_KEY',{}));assert.throws(()=>serverKey('GEMINI_API_KEY',{GEMINI_API_KEY:'replace-me'}));
});
test('environment workspaces cannot be selected by client input',()=>{
  assert.equal(environmentWorkspace({VERCEL_ENV:'production'}),'production');assert.equal(environmentWorkspace({VERCEL_ENV:'preview'}),'preview');assert.equal(environmentWorkspace({}),'development');
});
test('request hashing is stable across object order and rejects missing identity',()=>{
  assert.equal(requestHash({b:2,a:1}),requestHash({a:1,b:2}));assert.notEqual(requestHash({a:1}),requestHash({a:2}));assert.throws(()=>turnSchema.parse({message:'Missing operation identity'}));
});
test('malformed native answers retain their valid usage receipt for settlement',async()=>envFixture(['TYPESAFE_API_KEY','GEMINI_API_KEY'],async()=>{
  const a=await evaluateTypeSafe({model:'jev-1.14.0',state:'Fixture',questions:{}},async()=>Response.json({model:'jev-1.14.0',answers:'Malformed output',usage:{input_tokens:9,output_tokens:2}}));
  assert.equal(a.receipt.inputTokens,9);assert.equal(a.output.answers,'Malformed output');
  const b=await generateGemini({model:'gemini-3.8-flash',instructions:'Fixture',prompt:'Fixture'},async(url)=>String(url).endsWith(':countTokens')?Response.json({totalTokens:9}):Response.json({candidates:'Malformed output',usageMetadata:{promptTokenCount:9,totalTokenCount:9}}));
  assert.equal(b.receipt.inputTokens,9);assert.equal(b.output.finishReason,'INVALID');assert.equal(b.output.text,'');
}));

test('Gemini uses bounded native messages and counts the exact generation body',async(t)=>envFixture(['GEMINI_API_KEY'],async()=>{
  const budgets:number[]=[];
  t.mock.method(AbortSignal,'timeout',(ms:number)=>{budgets.push(ms);return new AbortController().signal;});
  let counted:Record<string,unknown>|undefined,generated:Record<string,unknown>|undefined;
  const result=await generateGemini({model:'gemini-3.8-flash',instructions:'Host-only instructions',history:[{role:'user',content:'Earlier question'},{role:'assistant',content:'Earlier saved reply'}],prompt:'Latest question and fresh validated guidance'},async(url,init)=>{
    const body=JSON.parse(String(init?.body));
    if(String(url).endsWith(':countTokens')){counted=body.generateContentRequest;return Response.json({totalTokens:32768});}
    generated=body;
    return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:'Complete bounded response'}]}}],usageMetadata:{promptTokenCount:32768,candidatesTokenCount:4,totalTokenCount:32772}});
  });
  assert.deepEqual(budgets,[10000,30000]);
  const {model,...countedBody}=counted!;assert.equal(model,'models/gemini-3.8-flash');assert.deepEqual(countedBody,generated);
  assert.deepEqual(generated!.generationConfig,{maxOutputTokens:2048,thinkingConfig:{thinkingLevel:'low'}});
  assert.deepEqual(generated!.contents,[{role:'user',parts:[{text:'Earlier question'}]},{role:'model',parts:[{text:'Earlier saved reply'}]},{role:'user',parts:[{text:'Latest question and fresh validated guidance'}]}]);
  assert.equal(result.output.text,'Complete bounded response');assert.equal(result.receipt.outputTokens,4);
}));

test('the native input limit stops generation before a request is sent',async()=>envFixture(['GEMINI_API_KEY'],async()=>{
  const {ProviderStageError}=await import('../packages/provider-adapters/contracts.ts');let calls=0;
  await assert.rejects(generateGemini({model:'gemini-3.8-flash',instructions:'Fixture',prompt:'Fixture'},async(url)=>{calls++;assert.ok(String(url).endsWith(':countTokens'));return Response.json({totalTokens:32769});}),e=>e instanceof ProviderStageError&&e.stage==='preflight'&&e.code==='input_limit'&&e.definitiveRejection);
  assert.equal(calls,1);
}));

test('a response-body timeout is distinguishable from a request timeout and keeps its hold',async()=>envFixture(['GEMINI_API_KEY'],async()=>{
  const {ProviderStageError}=await import('../packages/provider-adapters/contracts.ts');let generations=0;
  await assert.rejects(generateGemini({model:'gemini-3.8-flash',instructions:'Fixture',prompt:'Fixture'},async(url)=>{
    if(String(url).endsWith(':countTokens'))return Response.json({totalTokens:9});
    generations++;
    return new Response(new ReadableStream({start(controller){controller.error(new DOMException('Synthetic response body timeout','TimeoutError'));}}));
  }),e=>e instanceof ProviderStageError&&e.stage==='generation'&&e.transportPhase==='body'&&e.code==='timeout'&&!e.definitiveRejection);
  assert.equal(generations,1);
}));

test('preflight failures prove generation was not sent, including timeout and malformed counts',async()=>envFixture(['GEMINI_API_KEY'],async()=>{
  const {ProviderStageError}=await import('../packages/provider-adapters/contracts.ts');
  for(const mode of ['timeout','malformed','server']){
    let calls=0;
    await assert.rejects(generateGemini({model:'gemini-3.8-flash',instructions:'Fixture',prompt:'Fixture'},async(url)=>{
      calls++;assert.ok(String(url).endsWith(':countTokens'));
      if(mode==='timeout')throw new DOMException('Synthetic timeout','TimeoutError');
      return mode==='server'?new Response('Private upstream body',{status:503}):Response.json({totalTokens:'invalid'});
    }),e=>e instanceof ProviderStageError&&e.stage==='preflight'&&e.definitiveRejection&&!e.message.includes('Private'));
    assert.equal(calls,1);
  }
}));

test('a generation timeout remains uncertain and is never automatically repeated',async()=>envFixture(['GEMINI_API_KEY'],async()=>{
  const {ProviderStageError}=await import('../packages/provider-adapters/contracts.ts');let generations=0;
  await assert.rejects(generateGemini({model:'gemini-3.8-flash',instructions:'Fixture',prompt:'Fixture'},async(url)=>{
    if(String(url).endsWith(':countTokens'))return Response.json({totalTokens:9});
    generations++;throw new DOMException('Synthetic generation timeout','TimeoutError');
  }),e=>e instanceof ProviderStageError&&e.stage==='generation'&&e.transportPhase==='headers'&&e.code==='timeout'&&!e.definitiveRejection);
  assert.equal(generations,1);
}));

test('a successful response without a usable receipt retains an uncertain outcome',async()=>envFixture(['GEMINI_API_KEY'],async()=>{
  const {ProviderStageError}=await import('../packages/provider-adapters/contracts.ts');
  await assert.rejects(generateGemini({model:'gemini-3.8-flash',instructions:'Fixture',prompt:'Fixture'},async(url)=>String(url).endsWith(':countTokens')?Response.json({totalTokens:9}):Response.json({candidates:[],usageMetadata:{promptTokenCount:9,totalTokenCount:50}})),e=>e instanceof ProviderStageError&&e.stage==='receipt'&&!e.definitiveRejection);
}));
