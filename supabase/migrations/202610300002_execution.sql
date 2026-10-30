
begin;
alter table companies add column settings jsonb not null default '{}';
alter table agent_runs add column operation_id uuid;
alter table agent_runs add column output jsonb;
create unique index run_operation on agent_runs(company_id,user_id,operation_id);
alter table approvals add column action text not null default 'post';
create unique index one_review_revision on approvals(record_id,revision,action);
alter table jobs add column lease_id uuid;
alter table jobs add column result jsonb;
alter table jobs add column dedupe_key text;
create unique index job_dedupe on jobs(company_id,dedupe_key);
create table notifications(id uuid primary key default gen_random_uuid(),company_id uuid not null references companies,user_id uuid not null references auth.users,title text not null,body text not null,record_id uuid,read_at timestamptz,created_at timestamptz not null default now());
create table push_devices(user_id uuid not null references auth.users,token text primary key,updated_at timestamptz not null default now());
create table mailbox_messages(company_id uuid not null references companies,id text not null,thread_id text not null,subject text not null,sender text not null,body text not null,received_at timestamptz not null,attachments jsonb not null default '[]',primary key(company_id,id));
create table integration_status(company_id uuid primary key references companies,status text not null default 'disconnected',last_sync timestamptz,history_id text,drive_folder text,error text);
create table oauth_states(state text primary key,company_id uuid not null references companies,user_id uuid not null,verifier text not null,expires_at timestamptz not null default now()+interval '10 minutes');
create table invitations(id uuid primary key default gen_random_uuid(),company_id uuid not null references companies,email text not null,role text not null check(role in ('office_manager','accountant','supervisor','staff')),site_ids uuid[] not null default '{}',accepted_at timestamptz,created_at timestamptz not null default now(),unique(company_id,email));
create table topups(company_id uuid not null references companies,metric text not null check(metric in ('letters','documents','bills','staff')),quantity integer not null check(quantity>0),operation_id uuid primary key,created_at timestamptz not null default now());
create table file_records(id uuid primary key,company_id uuid not null references companies,site_id uuid,filename text not null,mime_type text not null,size integer not null check(size>0 and size<=12000000),storage_path text not null unique,status text not null default 'pending',created_by uuid not null references auth.users,created_at timestamptz not null default now());
do $$declare t text;begin foreach t in array array['notifications','push_devices','mailbox_messages','integration_status','oauth_states','invitations','topups','file_records'] loop execute format('alter table %I enable row level security',t);end loop;end$$;
create policy notification_self on notifications for select to authenticated using(user_id=auth.uid() and member_role(company_id) is not null);
create policy device_self on push_devices for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy mailbox_owner on mailbox_messages for select to authenticated using(member_role(company_id)='owner');
create policy integration_owner on integration_status for select to authenticated using(member_role(company_id)='owner');
create policy invitation_owner on invitations for select to authenticated using(member_role(company_id)='owner');
create policy topup_owner on topups for select to authenticated using(member_role(company_id)='owner');
create policy file_read on file_records for select to authenticated using(member_role(company_id) is not null and (member_role(company_id) in ('owner','office_manager','accountant') or created_by=auth.uid()));
-- New fields cannot bypass owner review through the generic mutation function.
create function protect_record_execution() returns trigger language plpgsql as $$begin
 if coalesce(new.data->>'posted','false')='true' and coalesce(current_setting('siteoffice.executing',true),'')<>'yes' then raise exception 'Posting requires an approved job';end if;
 if tg_op='UPDATE' and coalesce(old.data->>'posted','false')='true' and coalesce(current_setting('siteoffice.executing',true),'')<>'yes' then raise exception 'Posted records are immutable; create a correction';end if;
 return new;end$$;
create trigger protect_posted before insert or update on office_records for each row execute function protect_record_execution();
create function prepare_review(record_uuid uuid,expected integer,requested_action text) returns uuid language plpgsql security definer set search_path=public as $$declare r office_records; aid uuid;begin
 select * into r from office_records where id=record_uuid for update;
 if not found or not can_read_record(r) then raise exception 'Forbidden' using errcode='42501';end if;
 if r.version<>expected or r.deleted_at is not null then raise exception 'Record changed; refresh before review';end if;
 if requested_action not in ('post','email','delete','reminder') or (requested_action='email' and r.kind<>'letter') or (requested_action='reminder' and r.kind<>'reminder') then raise exception 'Invalid action';end if;
 if coalesce(r.data->>'posted','false')='true' and requested_action<>'delete' then raise exception 'Already posted';end if;
 insert into approvals(company_id,record_id,revision,snapshot,action) values(r.company_id,r.id,r.version,to_jsonb(r),requested_action) on conflict(record_id,revision,action) do update set snapshot=approvals.snapshot returning id into aid;
 insert into notifications(company_id,user_id,title,body,record_id) select r.company_id,user_id,'Review requested',r.title,r.id from memberships where company_id=r.company_id and role='owner' and active;
 return aid;end$$;
create function decide_review(approval_uuid uuid,decision text) returns text language plpgsql security definer set search_path=public as $$declare a approvals;r office_records;begin
 select * into a from approvals where id=approval_uuid for update;if not found or coalesce(member_role(a.company_id),'')<>'owner' then raise exception 'Owner approval required' using errcode='42501';end if;
 if coalesce(auth.jwt()->>'aal','aal1')<>'aal2' then raise exception 'Verify your authenticator code first' using errcode='42501';end if;
 if decision not in ('approve','reject') then raise exception 'Invalid decision';end if;
 if a.status<>'awaiting_approval' then raise exception 'Decision already recorded';end if;
 select * into r from office_records where id=a.record_id for update;
 if r.version<>a.revision or to_jsonb(r)<>a.snapshot then raise exception 'Record changed; prepare a new review';end if;
 update approvals set status=case when decision='approve' then 'queued' else 'rejected' end,decided_by=auth.uid() where id=a.id;
 if decision='approve' then insert into jobs(company_id,approval_id,kind,payload) values(a.company_id,a.id,a.action,a.snapshot);end if;
 insert into audit_events(company_id,user_id,event,record_id,detail) values(a.company_id,auth.uid(),decision,r.id,jsonb_build_object('approvalId',a.id,'revision',a.revision));return decision;
end$$;
create function claim_job() returns setof jobs language plpgsql security definer set search_path=public as $$declare j jobs;begin
 -- A send interrupted after dispatch is uncertain, never blindly retried.
 update jobs set status=case when kind='email' then 'uncertain' else 'queued' end,error='Worker lease expired',lease_id=null where status='running' and locked_at<now()-interval '10 minutes';
 update approvals a set status='uncertain' from jobs q where q.approval_id=a.id and q.status='uncertain' and a.status='queued';
 select * into j from jobs where status='queued' and run_after<=now() order by run_after,id for update skip locked limit 1;
 if found then update jobs set status='running',lease_id=gen_random_uuid(),locked_at=now(),attempts=attempts+1 where id=j.id returning * into j;return next j;end if;
end$$;
create function finish_job(job_uuid uuid,lease uuid,outcome text,details jsonb) returns void language plpgsql security definer set search_path=public as $$declare j jobs;r office_records;begin
 select * into j from jobs where id=job_uuid and lease_id=lease and status='running' for update;if not found then raise exception 'Stale job lease';end if;
 if outcome not in ('completed','failed','uncertain') then raise exception 'Invalid outcome';end if;
 if outcome='completed' and j.kind in ('post','delete','reminder') then
 select * into r from office_records where id=(j.payload->>'id')::uuid for update;
 if not found or r.version<>(j.payload->>'version')::integer then raise exception 'Approved revision changed';end if;
 if r.kind='attendance' and r.data ? 'correctsId' then
 perform 1 from office_records where id=(r.data->>'correctsId')::uuid and company_id=r.company_id and kind='attendance' for update;
 if not found or not exists(select 1 from office_records where id=(r.data->>'correctsId')::uuid and version=(r.data->>'correctsVersion')::integer) then raise exception 'Original attendance changed';end if;
 if exists(select 1 from office_records p where p.kind='payroll' and p.company_id=r.company_id and p.data->>'posted'='true' and p.data->'attendanceIds' ? (r.data->>'correctsId')) then raise exception 'Attendance is already paid; prepare a separate wage adjustment';end if;
 perform set_config('siteoffice.executing','yes',true);
 update office_records set data=(r.data-'correctsId'-'correctsVersion')||jsonb_build_object('correctedBy',(select decided_by from approvals where id=j.approval_id)),version=version+1,updated_at=now() where id=(r.data->>'correctsId')::uuid;
 end if;
 if r.kind='permit' and r.data ? 'renewedFrom' then perform set_config('siteoffice.executing','yes',true);update office_records set data=data||jsonb_build_object('renewedBy',r.id),version=version+1,updated_at=now() where id=(r.data->>'renewedFrom')::uuid and company_id=r.company_id and kind='permit' and data->>'expiry'<r.data->>'expiry';if not found then raise exception 'Original permit is unavailable or renewal date is invalid';end if;end if;
 if r.kind='payment' then
 perform 1 from office_records where id=(r.data->>'invoiceId')::uuid and company_id=r.company_id for update;
 if (select coalesce(sum((data->>'amount')::numeric),0) from office_records where kind='payment' and data->>'invoiceId'=r.data->>'invoiceId' and data->>'posted'='true' and deleted_at is null)+(r.data->>'amount')::numeric>(select (data->>'amount')::numeric from office_records where id=(r.data->>'invoiceId')::uuid and data->>'posted'='true') then raise exception 'Payment exceeds current invoice balance';end if;
 end if;
 if r.kind='payroll' then
 perform 1 from office_records where id in (select value::text::uuid from jsonb_array_elements_text(r.data->'attendanceIds')) order by id for update;
 if exists(select 1 from jsonb_each_text(r.data->'attendanceVersions') v left join office_records att on att.id=v.key::uuid where att.id is null or att.version<>v.value::integer) then raise exception 'Attendance changed after payroll review';end if;
 if exists(select 1 from office_records p where p.kind='payroll' and p.company_id=r.company_id and p.data->>'posted'='true' and p.data->'attendanceIds' ?| array(select jsonb_array_elements_text(r.data->'attendanceIds'))) then raise exception 'Attendance is already included in posted payroll';end if;
 end if;
 perform set_config('siteoffice.executing','yes',true);
 update office_records set data=data||coalesce(details->'derived','{}'::jsonb)||jsonb_build_object('posted',true,'executionStatus','completed','approvedBy',(select decided_by from approvals where id=j.approval_id))||case when kind='task' then jsonb_build_object('status','To do') else '{}'::jsonb end,deleted_at=case when j.kind='delete' then now() else deleted_at end,version=version+1,updated_at=now() where id=r.id;
 end if;
 update jobs set status=outcome,result=details,error=details->>'error' where id=j.id;
 update approvals set status=outcome where id=j.approval_id;
 insert into audit_events(company_id,event,record_id,detail) values(j.company_id,'job_'||outcome,(j.payload->>'id')::uuid,jsonb_build_object('jobId',j.id));if j.kind<>'joblog' and exists(select 1 from integration_status where company_id=j.company_id and status='connected') then insert into jobs(company_id,kind,payload,dedupe_key) values(j.company_id,'joblog',jsonb_build_object('jobId',j.id,'kind',j.kind,'status',outcome,'finishedAt',now(),'result',details),'joblog:'||j.id::text) on conflict(company_id,dedupe_key) do nothing;end if;
end$$;
create function consume_usage(company uuid,operation uuid,metric_name text) returns jsonb language plpgsql security definer set search_path=public as $$declare cap integer;used integer;bonus integer;begin
 if member_role(company) is null then raise exception 'Forbidden';end if;
 perform pg_advisory_xact_lock(hashtextextended(company::text||metric_name,7));
 cap:=case metric_name when 'letters' then 250 when 'documents' then 1000 when 'bills' then 300 else null end;if cap is null then raise exception 'Invalid metric';end if;
 select coalesce(sum(quantity),0) into used from usage_events where company_id=company and metric=metric_name and created_at>=date_trunc('month',now() at time zone 'Asia/Colombo') at time zone 'Asia/Colombo';
 select coalesce(sum(quantity),0) into bonus from topups where company_id=company and metric=metric_name and created_at>=date_trunc('month',now() at time zone 'Asia/Colombo') at time zone 'Asia/Colombo';cap:=cap+bonus;
 if not exists(select 1 from usage_events where company_id=company and operation_id=operation and metric=metric_name) then if used>=cap then raise exception 'Monthly allowance reached';end if;insert into usage_events values(company,operation,metric_name,1,now());used:=used+1;end if;
 return jsonb_build_object('used',used,'limit',cap,'warning',used>=cap*.8);
end$$;
create function accept_invitations() returns void language plpgsql security definer set search_path=public as $$declare i invitations;begin
 for i in select * from invitations where lower(email)=lower(auth.jwt()->>'email') and accepted_at is null for update loop
 perform pg_advisory_xact_lock(hashtextextended(i.company_id::text,12));
 if exists(select 1 from memberships where user_id=auth.uid() and company_id<>i.company_id) then raise exception 'Already belongs to another company';end if;
 if (select count(*) from memberships where company_id=i.company_id and active)>=150+(select coalesce(sum(quantity),0) from topups where company_id=i.company_id and metric='staff') then raise exception 'Staff allowance reached';end if;
 insert into memberships(company_id,user_id,role,site_ids) values(i.company_id,auth.uid(),i.role,i.site_ids) on conflict(company_id,user_id) do update set active=true,role=excluded.role,site_ids=excluded.site_ids;
 update invitations set accepted_at=now() where id=i.id;end loop;
end$$;
revoke all on function prepare_review(uuid,integer,text),decide_review(uuid,text),claim_job(),finish_job(uuid,uuid,text,jsonb),consume_usage(uuid,uuid,text),accept_invitations() from public;
grant execute on function prepare_review(uuid,integer,text),decide_review(uuid,text),consume_usage(uuid,uuid,text),accept_invitations() to authenticated;
grant execute on function claim_job(),finish_job(uuid,uuid,text,jsonb) to service_role;
commit;
