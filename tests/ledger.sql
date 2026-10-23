-- Run against the isolated Compass database. Entire fixture is rolled back; no model calls.
begin;
do $$
declare
  cid uuid:=gen_random_uuid(); first_id uuid:=gen_random_uuid(); post_id uuid:=gen_random_uuid(); uncertain_id uuid:=gen_random_uuid();
  attempt_id uuid; r jsonb; payload jsonb; count_rows integer; duplicate_rejected boolean:=false;
begin
  assert not has_function_privilege('anon','public.compass_ledger(text,jsonb,text)','EXECUTE'), 'Anonymous RPC permission';
  assert not has_function_privilege('authenticated','public.compass_ledger(text,jsonb,text)','EXECUTE'), 'Member RPC permission';
  assert not has_table_privilege('anon','studio_private.charges','SELECT'), 'Anonymous ledger permission';
  assert not (select prosecdef from pg_proc where oid='public.compass_ledger(text,jsonb,text)'::regprocedure), 'RPC must be security invoker';
  insert into studio_private.allocations(tenant_id,workspace_id,amount_nano,reason,actor) values ('compass','preview',1000,'Rollback-only fixture','automated-test');
  payload:=jsonb_build_object('requestId',first_id,'conversationId',cid,'expectedVersion',0,'requestHash','fixture-one','kind','turn','ceiling','100','config',jsonb_build_object('rateVersion','fixture-v1'),'immutableInput',jsonb_build_object('message','Synthetic question','context',jsonb_build_object('fixture',true)));
  r:=public.compass_ledger('admit',payload,'preview'); assert r->>'status'='new', 'First admission';
  r:=public.compass_ledger('admit',payload,'preview'); assert r->>'status'='admitted', 'Duplicate pending operation';
  r:=public.compass_ledger('admit',payload||jsonb_build_object('requestHash','changed'),'preview'); assert r->>'error'='request_conflict', 'Hash conflict';
  attempt_id:=gen_random_uuid();
  perform public.compass_ledger('start_attempt',jsonb_build_object('operationId',first_id,'attemptId',attempt_id,'role','evaluator','rate','{}'::jsonb,'ceiling','40'),'preview');
  perform public.compass_ledger('settle_attempt',jsonb_build_object('operationId',first_id,'attemptId',attempt_id,'receipt',jsonb_build_object('fixture',true),'cost','14'),'preview');
  perform public.compass_ledger('save_evaluation',jsonb_build_object('operationId',first_id,'evaluation',jsonb_build_object('validated',true)),'preview');
  attempt_id:=gen_random_uuid();
  perform public.compass_ledger('start_attempt',jsonb_build_object('operationId',first_id,'attemptId',attempt_id,'role','generator','rate','{}'::jsonb,'ceiling','60'),'preview');
  perform public.compass_ledger('settle_attempt',jsonb_build_object('operationId',first_id,'attemptId',attempt_id,'receipt',jsonb_build_object('fixture',true),'cost','22'),'preview');
  r:=public.compass_ledger('commit_reply',jsonb_build_object('operationId',first_id,'result',jsonb_build_object('reply','Original saved reply')),'preview');
  assert (r->>'conversationVersion')::integer=1, 'Reply increments version once';
  assert (r->>'conversationId')::uuid=cid, 'Reply identity projection';
  r:=public.compass_ledger('admit',payload,'preview'); assert r->'result'->>'reply'='Original saved reply', 'Completed duplicate';
  select count(*) into count_rows from studio_private.messages where workspace_id='preview' and conversation_id=cid; assert count_rows=2, 'No duplicate messages';
  select count(*) into count_rows from studio_private.charges where workspace_id='preview'; assert count_rows=2, 'Separate provider charges';
  r:=public.compass_ledger('admit',payload||jsonb_build_object('requestId',gen_random_uuid()),'preview'); assert r->>'error'='version_conflict', 'Stale version';
  -- Independent assessment creates a third receipt but cannot change the saved answer.
  r:=public.compass_ledger('admit',jsonb_build_object('requestId',post_id,'conversationId',cid,'expectedVersion',1,'requestHash','fixture-post','kind','assessment','ceiling','40','config','{}'::jsonb,'immutableInput',jsonb_build_object('sourceOperationId',first_id)),'preview'); assert r->>'status'='new', 'Post assessment admission';
  attempt_id:=gen_random_uuid();
  perform public.compass_ledger('start_attempt',jsonb_build_object('operationId',post_id,'attemptId',attempt_id,'role','post_assessment','rate','{}'::jsonb,'ceiling','40'),'preview');
  perform public.compass_ledger('settle_attempt',jsonb_build_object('operationId',post_id,'attemptId',attempt_id,'receipt',jsonb_build_object('fixture',true),'cost','4'),'preview');
  r:=public.compass_ledger('commit_assessment',jsonb_build_object('operationId',post_id,'result',jsonb_build_object('status','complete','insights',jsonb_build_object('fixture',true))),'preview');
  assert (r->>'conversationVersion')::integer=1, 'Assessment does not increment reply version';
  assert (select result->>'reply' from studio_private.operations where id=first_id and workspace_id='preview')='Original saved reply', 'Assessment cannot rewrite reply';
  select count(*) into count_rows from studio_private.charges where workspace_id='preview'; assert count_rows=3, 'Third independent receipt';
  -- Network ambiguity retains only its possible cost, releasing unstarted generation.
  r:=public.compass_ledger('admit',payload||jsonb_build_object('requestId',uncertain_id,'expectedVersion',1,'requestHash','fixture-uncertain'),'preview'); assert r->>'status'='new', 'Uncertain operation admission';
  attempt_id:=gen_random_uuid();
  perform public.compass_ledger('start_attempt',jsonb_build_object('operationId',uncertain_id,'attemptId',attempt_id,'role','evaluator','rate','{}'::jsonb,'ceiling','40'),'preview');
  perform public.compass_ledger('reject_attempt',jsonb_build_object('operationId',uncertain_id,'attemptId',attempt_id,'definitive',false),'preview');
  perform public.compass_ledger('commit_reply',jsonb_build_object('operationId',uncertain_id,'result',jsonb_build_object('reply','Evidence-only fallback')),'preview');
  assert (select reserved_nano from studio_private.operations where id=uncertain_id and workspace_id='preview')=40, 'Uncertain hold is retained';
  r:=public.compass_ledger('snapshot','{}','preview'); assert r->>'status'='review_required', 'Review-required public state';
  assert not r ? 'allocated' and not r ? 'cost' and not r ? 'receipt', 'Private fields are omitted';
  r:=public.compass_ledger('admit',payload||jsonb_build_object('requestId',gen_random_uuid(),'expectedVersion',2,'requestHash','blocked'),'preview'); assert r->>'error'='workspace_busy', 'Uncertain workspace blocks new spending';
  -- Less than one percent must not be presented as exhausted.
  insert into studio_private.reconciliations(tenant_id,workspace_id,operation_id,amount_nano,reason,actor) values ('compass','preview',uncertain_id,915,'Rollback-only percentage fixture','automated-test');
  r:=public.compass_ledger('snapshot','{}','preview'); assert (r->>'remainingPercent')::integer=0 and (r->>'belowOnePercent')::boolean, 'Positive fraction below 1%';
  assert not has_function_privilege('service_role','studio_private.reconcile_operation(text,uuid,bigint,text,text)','EXECUTE'), 'Runtime cannot reconcile';
  perform studio_private.reconcile_operation('preview',uncertain_id,40,'UPPER_BOUND: rollback-only fixture retains the full uncertain attempt ceiling, not a reported invoice cost','automated-test');
  r:=public.compass_ledger('snapshot','{}','preview'); assert r->>'status'='available', 'Conservative reconciliation reopens the workspace';
  assert exists(select 1 from studio_private.reconciliations where operation_id=uncertain_id and amount_nano=40 and reason like 'UPPER_BOUND:%'), 'Full uncertain ceiling remains deducted';
  select count(*) into count_rows from studio_private.charges where workspace_id='preview'; assert count_rows=3, 'Known charges remain unchanged';
  begin perform studio_private.reconcile_operation('preview',uncertain_id,0,'Duplicate reconciliation must be rejected','automated-test'); exception when others then duplicate_rejected:=true; end;
  assert duplicate_rejected, 'No duplicate reconciliation';
end $$;
do $$
declare rid uuid:=gen_random_uuid(); cid uuid:=gen_random_uuid(); r jsonb;
begin
  r:=public.compass_ledger('admit',jsonb_build_object('requestId',rid,'conversationId',cid,'expectedVersion',0,'requestHash','window-fixture','kind','turn','ceiling','1','config','{}'::jsonb,'immutableInput','{}'::jsonb),'preview');
  assert r->>'status'='new', 'Window fixture admission';
  update studio_private.operations set created_at=now()-interval '4 minutes' where id=rid;
  r:=public.compass_ledger('snapshot','{}','preview'); assert r->>'status'='pending', 'Active five-minute request is not prematurely stale';
  r:=public.compass_ledger('recover',jsonb_build_object('operationId',rid),'preview'); assert r->>'status'='admitted', 'Recovery respects the active window';
  update studio_private.operations set created_at=now()-interval '7 minutes' where id=rid;
  r:=public.compass_ledger('snapshot','{}','preview'); assert r->>'status'='review_required', 'Interrupted worker is eventually stale';
  perform studio_private.reconcile_operation('preview',rid,0,'Rollback-only fixture: no model attempt was ever created or sent','automated-test');
end $$;
rollback;
select 'PASS: transactional ledger fixtures rolled back; no model calls' as result;
