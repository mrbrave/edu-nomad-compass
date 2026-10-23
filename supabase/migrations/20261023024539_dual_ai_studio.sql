-- Private, single-tenant pilot foundation. Every operation is scoped to an environment workspace.
create schema if not exists studio_private;
revoke all on schema studio_private from public, anon, authenticated;
grant usage on schema studio_private to service_role;

create table studio_private.tenants (id text primary key);
insert into studio_private.tenants values ('compass');
create table studio_private.workspaces (
  id text primary key check (id in ('production','preview','development')),
  tenant_id text not null references studio_private.tenants(id),
  updated_at timestamptz not null default now(), unique (tenant_id,id)
);
insert into studio_private.workspaces(id,tenant_id) values ('production','compass'),('preview','compass'),('development','compass');
create table studio_private.allocations (
  id uuid primary key default gen_random_uuid(), tenant_id text not null, workspace_id text not null,
  amount_nano bigint not null check (amount_nano > 0), reason text not null, actor text not null,
  created_at timestamptz not null default now(), foreign key (tenant_id,workspace_id) references studio_private.workspaces(tenant_id,id)
);
create table studio_private.conversations (
  id uuid not null, tenant_id text not null, workspace_id text not null, version integer not null default 0,
  brief jsonb, created_at timestamptz not null default now(), primary key (tenant_id,workspace_id,id),
  foreign key (tenant_id,workspace_id) references studio_private.workspaces(tenant_id,id)
);
create table studio_private.operations (
  id uuid not null, tenant_id text not null, workspace_id text not null, conversation_id uuid not null,
  expected_version integer not null, kind text not null check (kind in ('turn','assessment')),
  request_hash text not null, config jsonb not null, input jsonb not null,
  status text not null default 'admitted' check (status in ('admitted','complete','failed','review_required')),
  reserved_nano bigint not null check (reserved_nano >= 0), evaluation jsonb, result jsonb,
  created_at timestamptz not null default now(), finished_at timestamptz,
  primary key (tenant_id,workspace_id,id),
  foreign key (tenant_id,workspace_id,conversation_id) references studio_private.conversations(tenant_id,workspace_id,id)
);
create table studio_private.messages (
  id uuid primary key default gen_random_uuid(), tenant_id text not null, workspace_id text not null,
  conversation_id uuid not null, operation_id uuid not null, role text not null check (role in ('user','assistant')),
  content text not null, version integer not null, created_at timestamptz not null default now(),
  unique (tenant_id,workspace_id,operation_id,role),
  foreign key (tenant_id,workspace_id,operation_id) references studio_private.operations(tenant_id,workspace_id,id),
  foreign key (tenant_id,workspace_id,conversation_id) references studio_private.conversations(tenant_id,workspace_id,id)
);
create table studio_private.model_attempts (
  id uuid primary key, tenant_id text not null, workspace_id text not null, operation_id uuid not null,
  role text not null check (role in ('evaluator','generator','post_assessment')), rate jsonb not null,
  ceiling_nano bigint not null check (ceiling_nano > 0),
  status text not null default 'started' check (status in ('started','completed','rejected','uncertain')),
  receipt jsonb, cost_nano bigint check (cost_nano >= 0), created_at timestamptz not null default now(), settled_at timestamptz,
  unique (tenant_id,workspace_id,operation_id,role),
  foreign key (tenant_id,workspace_id,operation_id) references studio_private.operations(tenant_id,workspace_id,id)
);
create table studio_private.charges (
  id uuid primary key default gen_random_uuid(), tenant_id text not null, workspace_id text not null,
  attempt_id uuid not null unique references studio_private.model_attempts(id), amount_nano bigint not null check (amount_nano >= 0),
  created_at timestamptz not null default now(), foreign key (tenant_id,workspace_id) references studio_private.workspaces(tenant_id,id)
);
create table studio_private.reconciliations (
  id uuid primary key default gen_random_uuid(), tenant_id text not null, workspace_id text not null,
  operation_id uuid not null, amount_nano bigint not null, reason text not null, actor text not null,
  created_at timestamptz not null default now(), foreign key (tenant_id,workspace_id,operation_id) references studio_private.operations(tenant_id,workspace_id,id)
);
create table studio_private.assessments (
  id uuid not null, tenant_id text not null, workspace_id text not null, conversation_id uuid not null,
  source_operation_id uuid not null, version integer not null, result jsonb not null, status text not null,
  created_at timestamptz not null default now(), primary key (tenant_id,workspace_id,id),
  foreign key (tenant_id,workspace_id,source_operation_id) references studio_private.operations(tenant_id,workspace_id,id),
  foreign key (tenant_id,workspace_id,conversation_id) references studio_private.conversations(tenant_id,workspace_id,id)
);
create index on studio_private.operations(tenant_id,workspace_id,status);
create index on studio_private.operations(tenant_id,workspace_id,conversation_id);
create index on studio_private.messages(tenant_id,workspace_id,conversation_id,version desc);
create index on studio_private.allocations(tenant_id,workspace_id);
create index on studio_private.charges(tenant_id,workspace_id);
create index on studio_private.reconciliations(tenant_id,workspace_id,operation_id);
create index on studio_private.assessments(tenant_id,workspace_id,conversation_id);
create index on studio_private.assessments(tenant_id,workspace_id,source_operation_id);

-- No browser roles have table or RPC access. The authenticated backend bridge uses service_role.
alter table studio_private.tenants enable row level security;
alter table studio_private.workspaces enable row level security;
alter table studio_private.allocations enable row level security;
alter table studio_private.conversations enable row level security;
alter table studio_private.operations enable row level security;
alter table studio_private.messages enable row level security;
alter table studio_private.model_attempts enable row level security;
alter table studio_private.charges enable row level security;
alter table studio_private.reconciliations enable row level security;
alter table studio_private.assessments enable row level security;
revoke all on all tables in schema studio_private from public, anon, authenticated;
grant select,insert on all tables in schema studio_private to service_role;
grant update on studio_private.workspaces,studio_private.conversations,studio_private.operations,studio_private.model_attempts to service_role;

create function public.compass_ledger(action text, payload jsonb, workspace text) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  op studio_private.operations; attempt studio_private.model_attempts; convo studio_private.conversations;
  allocated numeric; spent numeric; reserved numeric; available numeric; pct numeric; state text; history jsonb;
  op_id uuid; next_version integer; final_result jsonb; is_uncertain boolean;
begin
  if workspace not in ('production','preview','development') then return jsonb_build_object('error','invalid_workspace'); end if;
  -- Serialises admissions, settlement and allocations within this one environment only.
  perform 1 from studio_private.workspaces where tenant_id='compass' and id=workspace for update;
  if not found then return jsonb_build_object('error','invalid_workspace'); end if;
  if action='snapshot' then
    select coalesce(sum(amount_nano),0) into allocated from studio_private.allocations where tenant_id='compass' and workspace_id=workspace;
    select coalesce(sum(amount_nano),0) into spent from studio_private.charges where tenant_id='compass' and workspace_id=workspace;
    select spent+coalesce(sum(amount_nano),0) into spent from studio_private.reconciliations where tenant_id='compass' and workspace_id=workspace;
    select coalesce(sum(reserved_nano),0) into reserved from studio_private.operations where tenant_id='compass' and workspace_id=workspace;
    available:=greatest(0,allocated-spent-reserved); pct:=case when allocated>0 then available*100/allocated else 0 end;
    state:=case
      when exists(select 1 from studio_private.operations where tenant_id='compass' and workspace_id=workspace and (status='review_required' or (status='admitted' and created_at<now()-interval '3 minutes'))) then 'review_required'
      when exists(select 1 from studio_private.operations where tenant_id='compass' and workspace_id=workspace and status='admitted') then 'pending'
      when allocated=0 then 'not_configured'
      when available=0 then 'exhausted' else 'available' end;
    return jsonb_build_object('status',state,'remainingPercent',case when allocated>0 then floor(pct) else null end,'belowOnePercent',pct>0 and pct<1,'updatedAt',now(),'label',case state when 'not_configured' then 'Allowance not assigned' when 'pending' then 'Usage pending' when 'review_required' then 'Usage review required' when 'exhausted' then 'Allowance exhausted' else 'Studio allowance' end);
  end if;
  op_id:=coalesce(payload->>'operationId',payload->>'requestId')::uuid;
  select * into op from studio_private.operations where tenant_id='compass' and workspace_id=workspace and id=op_id for update;
  if action='recover' then
    if op.id is null then return jsonb_build_object('status','not_found'); end if;
    return jsonb_build_object('status',case when op.status='admitted' and op.created_at<now()-interval '3 minutes' then 'review_required' else op.status end,'result',op.result,'version',op.expected_version);
  elsif action='admit' then
    if op.id is not null then
      if op.request_hash <> payload->>'requestHash' then return jsonb_build_object('error','request_conflict'); end if;
      return jsonb_build_object('status',op.status,'result',op.result,'version',op.expected_version);
    end if;
    if exists(select 1 from studio_private.operations where tenant_id='compass' and workspace_id=workspace and status in ('admitted','review_required')) then return jsonb_build_object('error','workspace_busy'); end if;
    select * into convo from studio_private.conversations where tenant_id='compass' and workspace_id=workspace and id=(payload->>'conversationId')::uuid for update;
    if convo.id is null then
      if (payload->>'expectedVersion')::integer<>0 or payload->>'kind'<>'turn' then return jsonb_build_object('error','version_conflict'); end if;
      insert into studio_private.conversations(id,tenant_id,workspace_id,brief) values ((payload->>'conversationId')::uuid,'compass',workspace,payload->'immutableInput'->'context') returning * into convo;
    end if;
    if convo.version<>(payload->>'expectedVersion')::integer then return jsonb_build_object('error','version_conflict'); end if;
    if payload->>'kind'='turn' and convo.brief is distinct from payload->'immutableInput'->'context' then return jsonb_build_object('error','brief_conflict'); end if;
    select coalesce(sum(amount_nano),0) into allocated from studio_private.allocations where tenant_id='compass' and workspace_id=workspace;
    select coalesce(sum(amount_nano),0) into spent from studio_private.charges where tenant_id='compass' and workspace_id=workspace;
    select spent+coalesce(sum(amount_nano),0) into spent from studio_private.reconciliations where tenant_id='compass' and workspace_id=workspace;
    select coalesce(sum(reserved_nano),0) into reserved from studio_private.operations where tenant_id='compass' and workspace_id=workspace;
    if (payload->>'ceiling')::bigint<=0 or allocated-spent-reserved<(payload->>'ceiling')::bigint then return jsonb_build_object('error','credits_exhausted'); end if;
    insert into studio_private.operations(id,tenant_id,workspace_id,conversation_id,expected_version,kind,request_hash,config,input,reserved_nano)
      values (op_id,'compass',workspace,convo.id,convo.version,payload->>'kind',payload->>'requestHash',payload->'config',payload->'immutableInput',(payload->>'ceiling')::bigint);
    select coalesce(jsonb_agg(jsonb_build_object('role',role,'content',left(content,7000)) order by version,case role when 'user' then 0 else 1 end),'[]') into history from
      (select role,content,version from studio_private.messages where tenant_id='compass' and workspace_id=workspace and conversation_id=convo.id order by version desc,case role when 'assistant' then 0 else 1 end limit 10) recent;
    return jsonb_build_object('status','new','result',null,'version',convo.version,'history',history);
  end if;
  if op.id is null then return jsonb_build_object('error','operation_not_found'); end if;
  if action='start_attempt' then
    if op.status<>'admitted' or op.result is not null or (payload->>'ceiling')::bigint>op.reserved_nano then return jsonb_build_object('error','review_required'); end if;
    if (payload->>'role'='generator') and op.evaluation is null then return jsonb_build_object('error','evaluation_required'); end if;
    if exists(select 1 from studio_private.model_attempts where tenant_id='compass' and workspace_id=workspace and operation_id=op.id and status in ('started','uncertain')) then return jsonb_build_object('error','review_required'); end if;
    insert into studio_private.model_attempts(id,tenant_id,workspace_id,operation_id,role,rate,ceiling_nano) values ((payload->>'attemptId')::uuid,'compass',workspace,op.id,payload->>'role',payload->'rate',(payload->>'ceiling')::bigint);
  elsif action in ('settle_attempt','reject_attempt') then
    select * into attempt from studio_private.model_attempts where id=(payload->>'attemptId')::uuid and tenant_id='compass' and workspace_id=workspace and operation_id=op.id for update;
    if attempt.id is null then return jsonb_build_object('error','attempt_not_found'); end if;
    if attempt.status<>'started' then return jsonb_build_object('error','attempt_already_settled'); end if;
    if action='settle_attempt' then
      insert into studio_private.charges(tenant_id,workspace_id,attempt_id,amount_nano) values ('compass',workspace,attempt.id,(payload->>'cost')::bigint);
      update studio_private.model_attempts set status='completed',receipt=payload->'receipt',cost_nano=(payload->>'cost')::bigint,settled_at=now() where id=attempt.id;
      update studio_private.operations set reserved_nano=greatest(0,reserved_nano-attempt.ceiling_nano),status=case when (payload->>'cost')::bigint>attempt.ceiling_nano then 'review_required' else status end where tenant_id='compass' and workspace_id=workspace and id=op.id;
      if (payload->>'cost')::bigint>attempt.ceiling_nano then return jsonb_build_object('error','review_required'); end if;
    elsif (payload->>'definitive')::boolean then
      update studio_private.model_attempts set status='rejected',settled_at=now() where id=attempt.id;
      update studio_private.operations set reserved_nano=greatest(0,reserved_nano-attempt.ceiling_nano) where tenant_id='compass' and workspace_id=workspace and id=op.id;
    else
      update studio_private.model_attempts set status='uncertain' where id=attempt.id;
      update studio_private.operations set status='review_required' where tenant_id='compass' and workspace_id=workspace and id=op.id;
    end if;
  elsif action='save_evaluation' then
    if op.status<>'admitted' then return jsonb_build_object('error','review_required'); end if;
    update studio_private.operations set evaluation=payload->'evaluation' where tenant_id='compass' and workspace_id=workspace and id=op.id;
  elsif action='fail_operation' then
    update studio_private.operations set status=case when exists(select 1 from studio_private.model_attempts where tenant_id='compass' and workspace_id=workspace and operation_id=op.id) then 'review_required' else 'failed' end,reserved_nano=case when exists(select 1 from studio_private.model_attempts where tenant_id='compass' and workspace_id=workspace and operation_id=op.id) then reserved_nano else 0 end,finished_at=now() where tenant_id='compass' and workspace_id=workspace and id=op.id;
  elsif action in ('commit_reply','commit_assessment') then
    if op.result is not null then return op.result; end if;
    select * into convo from studio_private.conversations where tenant_id='compass' and workspace_id=workspace and id=op.conversation_id for update;
    if action='commit_reply' and convo.version<>op.expected_version then return jsonb_build_object('error','version_conflict'); end if;
    next_version:=case when action='commit_reply' then convo.version+1 else convo.version end;
    final_result:=payload->'result'||jsonb_build_object('operationId',op.id,'conversationVersion',next_version);
    select exists(select 1 from studio_private.model_attempts where tenant_id='compass' and workspace_id=workspace and operation_id=op.id and status in ('started','uncertain')) or op.status='review_required' into is_uncertain;
    if action='commit_reply' then
      insert into studio_private.messages(tenant_id,workspace_id,conversation_id,operation_id,role,content,version) values
        ('compass',workspace,convo.id,op.id,'user',op.input->>'message',next_version),('compass',workspace,convo.id,op.id,'assistant',final_result->>'reply',next_version);
      update studio_private.conversations set version=next_version where tenant_id='compass' and workspace_id=workspace and id=convo.id;
    else
      final_result:=final_result||jsonb_build_object('status',case when convo.version<>op.expected_version then 'stale' else final_result->>'status' end);
      insert into studio_private.assessments(id,tenant_id,workspace_id,conversation_id,source_operation_id,version,result,status) values (op.id,'compass',workspace,convo.id,(op.input->>'sourceOperationId')::uuid,op.expected_version,final_result,final_result->>'status');
    end if;
    update studio_private.operations set result=final_result,status=case when is_uncertain then 'review_required' else 'complete' end,reserved_nano=(select coalesce(sum(ceiling_nano),0) from studio_private.model_attempts where tenant_id='compass' and workspace_id=workspace and operation_id=op.id and status in ('started','uncertain')),finished_at=now() where tenant_id='compass' and workspace_id=workspace and id=op.id;
    return final_result;
  else return jsonb_build_object('error','invalid_action'); end if;
  update studio_private.workspaces set updated_at=now() where tenant_id='compass' and id=workspace;
  return jsonb_build_object('ok',true);
end;
$$;
revoke all on function public.compass_ledger(text,jsonb,text) from public,anon,authenticated;
grant execute on function public.compass_ledger(text,jsonb,text) to service_role;
