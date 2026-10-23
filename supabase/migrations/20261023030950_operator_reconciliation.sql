-- Operator-only recovery. Never callable by the application bridge or browser roles.
alter table studio_private.model_attempts drop constraint model_attempts_status_check;
alter table studio_private.model_attempts add constraint model_attempts_status_check check(status in ('started','completed','rejected','uncertain','reconciled'));
create function studio_private.reconcile_operation(target_workspace text, operation_uuid uuid, additional_cost_nano bigint, evidence_reason text, operator_ref text) returns void
language plpgsql security invoker set search_path='' as $$
declare op studio_private.operations;
begin
  if additional_cost_nano<0 or length(trim(evidence_reason))<20 or length(trim(operator_ref))<3 then raise exception 'Document the additional verified cost, evidence and operator reference'; end if;
  perform 1 from studio_private.workspaces where id=target_workspace and tenant_id='compass' for update;
  select * into op from studio_private.operations where id=operation_uuid and workspace_id=target_workspace and tenant_id='compass' for update;
  if op.id is null or not (op.status='review_required' or (op.status='admitted' and op.created_at<now()-interval '3 minutes')) then raise exception 'Only an uncertain or stale operation may be reconciled'; end if;
  -- additional_cost_nano excludes already recorded charges. Original charges remain immutable.
  insert into studio_private.reconciliations(tenant_id,workspace_id,operation_id,amount_nano,reason,actor) values('compass',target_workspace,op.id,additional_cost_nano,evidence_reason,operator_ref);
  update studio_private.model_attempts set status='reconciled',settled_at=now() where tenant_id='compass' and workspace_id=target_workspace and operation_id=op.id and status in ('started','uncertain');
  update studio_private.operations set reserved_nano=0,status=case when result is null then 'failed' else 'complete' end,finished_at=now() where tenant_id='compass' and workspace_id=target_workspace and id=op.id;
  update studio_private.workspaces set updated_at=now() where tenant_id='compass' and id=target_workspace;
end;
$$;
revoke all on function studio_private.reconcile_operation(text,uuid,bigint,text,text) from public,anon,authenticated,service_role;
