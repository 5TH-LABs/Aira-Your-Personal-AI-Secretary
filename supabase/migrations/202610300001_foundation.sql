
begin;
create extension if not exists pgcrypto;
create table public.companies(id uuid primary key default gen_random_uuid(), name text not null, created_at timestamptz not null default now());
create table public.memberships(company_id uuid not null references public.companies, user_id uuid not null references auth.users, role text not null check(role in ('owner','office_manager','accountant','supervisor','staff')), site_ids uuid[] not null default '{}', active boolean not null default true, primary key(company_id,user_id));
create function public.member_role(company uuid) returns text language sql stable security definer set search_path=public as $$select role from memberships where company_id=company and user_id=auth.uid() and active$$;
create table public.office_records(id uuid primary key,company_id uuid not null references public.companies,kind text not null check(kind in ('site','contact','task','note','meeting','reminder','document','letter','contract','permit','report','attendance','payroll','staff','leave','subcontract','estimate','invoice','expense','payment','finding','announcement')),site_id uuid,title text not null check(length(title) between 1 and 250),data jsonb not null default '{}',version integer not null default 1 check(version>0),updated_at timestamptz not null default now(),deleted_at timestamptz,created_by uuid not null default auth.uid());
create index records_company_updated on public.office_records(company_id,updated_at,id);
create function public.can_read_record(r public.office_records) returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from memberships m where m.company_id=r.company_id and m.user_id=auth.uid() and m.active and (m.role='owner' or case when r.kind='payroll' then m.role='accountant' when r.kind in ('staff','leave') then m.role='office_manager' when m.role in ('office_manager','accountant') then true when r.site_id is not null and not r.site_id=any(m.site_ids) then false when m.role='staff' then r.kind in ('task','note','attendance','report','document') and r.data->>'assigneeId'=auth.uid()::text else true end))$$;
create table public.operations(company_id uuid not null references public.companies,user_id uuid not null,operation_id uuid not null,result jsonb not null,request_hash text not null,primary key(company_id,user_id,operation_id));
create table public.audit_events(id bigint generated always as identity primary key,company_id uuid not null references public.companies,user_id uuid,event text not null,record_id uuid,detail jsonb not null default '{}',created_at timestamptz not null default now());
create table public.approvals(id uuid primary key default gen_random_uuid(),company_id uuid not null references public.companies,record_id uuid not null references public.office_records,revision integer not null,snapshot jsonb not null,status text not null default 'awaiting_approval' check(status in ('awaiting_approval','queued','completed','failed','uncertain','rejected','cancelled')),decided_by uuid,created_at timestamptz not null default now());
create table public.jobs(id uuid primary key default gen_random_uuid(),company_id uuid not null references public.companies,approval_id uuid references public.approvals,kind text not null,payload jsonb not null,status text not null default 'queued' check(status in ('queued','running','completed','failed','uncertain')),attempts integer not null default 0,run_after timestamptz not null default now(),locked_at timestamptz,error text,unique(approval_id));
create table public.agent_runs(id uuid primary key default gen_random_uuid(),company_id uuid not null references public.companies,user_id uuid not null default auth.uid(),status text not null default 'prepared',steps jsonb not null default '[]',sources uuid[] not null default '{}',created_at timestamptz not null default now());
create table public.integration_secrets(company_id uuid primary key references public.companies,encrypted_tokens text not null,updated_at timestamptz not null default now());
create table public.usage_events(company_id uuid not null references public.companies,operation_id uuid not null,metric text not null,quantity integer not null check(quantity>0),created_at timestamptz not null default now(),primary key(company_id,operation_id,metric));
alter table public.companies enable row level security;
alter table public.memberships enable row level security;
alter table public.office_records enable row level security;
alter table public.operations enable row level security;
alter table public.audit_events enable row level security;
alter table public.approvals enable row level security;
alter table public.jobs enable row level security;
alter table public.agent_runs enable row level security;
alter table public.integration_secrets enable row level security;
alter table public.usage_events enable row level security;
create policy company_read on public.companies for select to authenticated using(public.member_role(id) is not null);
create policy member_read on public.memberships for select to authenticated using(user_id=auth.uid() or public.member_role(company_id) in ('owner','office_manager'));
create policy record_read on public.office_records for select to authenticated using(public.can_read_record(office_records));
create policy audit_read on public.audit_events for select to authenticated using(public.member_role(company_id)='owner');
create policy approval_read on public.approvals for select to authenticated using(public.member_role(company_id)='owner');
create policy job_read on public.jobs for select to authenticated using(public.member_role(company_id)='owner');
create policy run_read on public.agent_runs for select to authenticated using(user_id=auth.uid() and public.member_role(company_id) is not null);
create policy usage_read on public.usage_events for select to authenticated using(public.member_role(company_id)='owner');
-- All writes use narrow functions; clients cannot directly alter revisions, decisions or audit history.
create function public.apply_record_mutation(operation uuid,input jsonb,expected integer) returns jsonb language plpgsql security definer set search_path=public as $$
declare c uuid:=(input->>'companyId')::uuid; rid uuid:=(input->>'id')::uuid; existing office_records; role_name text; saved jsonb; h text:=encode(digest(input::text||expected::text,'sha256'),'hex'); prior operations; new_record office_records;
begin
 role_name:=member_role(c);if role_name is null then raise exception 'Forbidden' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended(c::text||auth.uid()::text||operation::text,0));
 select * into prior from operations where company_id=c and user_id=auth.uid() and operation_id=operation;
 if found then if prior.request_hash<>h then raise exception 'Operation ID reused';end if;return prior.result;end if;
 perform pg_advisory_xact_lock(hashtextextended(rid::text,1));
 select * into existing from office_records where id=rid for update;
 if found then
 if existing.company_id<>c or not can_read_record(existing) then raise exception 'Forbidden' using errcode='42501';end if;
 if existing.version<>expected then return jsonb_build_object('state','conflict');end if;
 if existing.kind<>input->>'kind' then raise exception 'Record kind cannot change';end if;
 elsif expected<>0 then return jsonb_build_object('state','conflict');end if;
 new_record:=jsonb_populate_record(null::office_records,jsonb_build_object('id',rid,'company_id',c,'site_id',input->'siteId','kind',input->>'kind','title',input->>'title','data',input->'data','version',expected+1,'updated_at',now(),'created_by',auth.uid()));
 if new_record.site_id is not null and not exists(select 1 from office_records site where site.id=new_record.site_id and site.company_id=c and site.kind='site' and site.deleted_at is null and can_read_record(site)) then raise exception 'Site unavailable';end if;
 if not can_read_record(new_record) then raise exception 'Forbidden' using errcode='42501';end if;
 if (role_name='staff' and new_record.kind not in ('task','note','attendance','report','document')) or (role_name='supervisor' and new_record.kind not in ('task','note','attendance','report','document','announcement')) then raise exception 'Forbidden' using errcode='42501';end if;
 if new_record.kind in ('payment','payroll','expense','invoice','estimate') and role_name not in ('owner','accountant') then raise exception 'Forbidden' using errcode='42501';end if;
 if input->>'deletedAt' is not null then raise exception 'Deletion requires owner review';end if;
 insert into office_records select new_record.* on conflict(id) do update set title=excluded.title,data=excluded.data,site_id=excluded.site_id,version=excluded.version,updated_at=excluded.updated_at;
 saved:=jsonb_build_object('state','completed');insert into operations values(c,auth.uid(),operation,saved,h);
 insert into audit_events(company_id,user_id,event,record_id) values(c,auth.uid(),'record_saved',rid);return saved;
end$$;
create function public.bootstrap_company(company_name text) returns uuid language plpgsql security definer set search_path=public as $$declare cid uuid;begin if auth.uid() is null then raise exception 'Sign in first';end if;perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,15));if exists(select 1 from memberships where user_id=auth.uid()) then raise exception 'Already a company member';end if;if length(trim(company_name)) not between 1 and 150 then raise exception 'Company name required';end if;insert into companies(name) values(trim(company_name)) returning id into cid;insert into memberships(company_id,user_id,role) values(cid,auth.uid(),'owner');return cid;end$$;
revoke all on function public.apply_record_mutation(uuid,jsonb,integer),public.bootstrap_company(text) from public;
grant execute on function public.apply_record_mutation(uuid,jsonb,integer),public.bootstrap_company(text) to authenticated;
insert into storage.buckets(id,name,public) values('office-originals','office-originals',false) on conflict do nothing;
-- File access is deliberately closed until the signed-upload API and metadata checks are installed.
commit;
