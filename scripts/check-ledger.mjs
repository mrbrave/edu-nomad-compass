import assert from 'node:assert/strict';
// Operator-only non-AI check. No provider key or model endpoint is used.
const endpoint=process.env.STUDIO_LEDGER_URL,token=process.env.STUDIO_LEDGER_TOKEN;
const workspace=process.env.STUDIO_CHECK_WORKSPACE;
if(!endpoint||!token||!['production','preview','development'].includes(workspace))throw new Error('Set an explicit ledger endpoint, credential and STUDIO_CHECK_WORKSPACE.');
async function call(action,payload={}){
  const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({action,payload,workspace}),signal:AbortSignal.timeout(20000)});
  assert.equal(response.status,200);return response.json();
}
const before=await call('snapshot');
const conversationId=crypto.randomUUID(), ids=[crypto.randomUUID(),crypto.randomUUID()];
const results=[];
try{
  results.push(...await Promise.all(ids.map((requestId,index)=>call('admit',{requestId,conversationId,expectedVersion:0,requestHash:`ledger-concurrency-${index}`,kind:'turn',ceiling:'1000000',config:{test:'no-model-requests'},immutableInput:{message:'Synthetic ledger concurrency check. No provider call.',context:{test:'no-model-requests'}}}))));
  assert.equal(results.filter(r=>r.status==='new').length,1);
  assert.equal(results.filter(r=>r.error==='workspace_busy').length,1);
}finally{
  await Promise.all(results.map((result,index)=>result.status==='new'?call('fail_operation',{operationId:ids[index]}):Promise.resolve()));
}
const after=await call('snapshot');
assert.equal(after.status,before.status);assert.equal(after.remainingPercent,before.remainingPercent);
process.stdout.write(JSON.stringify({kind:'non-ai-ledger',concurrentAdmissions:2,accepted:1,blocked:1,providerCalls:0,holdsReleased:true,allowanceUnchanged:true})+'\n');
