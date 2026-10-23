-- Five-minute route budget plus one minute for interrupted-worker detection.
-- Do not classify a legitimate long-running request as stale at three minutes.
do $$
declare definition text;
begin
  select pg_get_functiondef('public.compass_ledger(text,jsonb,text)'::regprocedure) into definition;
  if position('interval ''3 minutes''' in definition)=0 then raise exception 'Unexpected ledger recovery window'; end if;
  execute replace(definition, 'interval ''3 minutes''', 'interval ''6 minutes''');
  select pg_get_functiondef('studio_private.reconcile_operation(text,uuid,bigint,text,text)'::regprocedure) into definition;
  if position('interval ''3 minutes''' in definition)=0 then raise exception 'Unexpected operator recovery window'; end if;
  execute replace(definition, 'interval ''3 minutes''', 'interval ''6 minutes''');
end $$;
-- CREATE OR REPLACE preserves ownership and ACLs; assert the operator boundary.
do $$ begin
  assert not has_function_privilege('service_role','studio_private.reconcile_operation(text,uuid,bigint,text,text)','EXECUTE'), 'Runtime cannot reconcile';
  assert not has_function_privilege('anon','public.compass_ledger(text,jsonb,text)','EXECUTE'), 'Anonymous RPC permission';
end $$;
