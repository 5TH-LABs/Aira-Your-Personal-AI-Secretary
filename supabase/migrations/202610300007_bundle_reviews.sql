
begin;
alter table approvals add column parent_id uuid references approvals;
create function prepare_run_review(run_uuid uuid) returns uuid language plpgsql security definer set search_path=public as $$declare run agent_runs;p jsonb;rid uuid;aid uuid;review_id uuid;item office_records;bundle jsonb:='[]';ids jsonb:='[]';n integer:=0;begin
 select * into run from agent_runs where id=run_uuid for update;
 if not found or run.user_id<>auth.uid() or member_role(run.company_id) is null then raise exception 'Agent run unavailable';end if;
 if run.output ? 'reviewId' then return (run.output->>'reviewId')::uuid;end if;
 if run.status<>'awaiting_approval' then raise exception 'No proposals are awaiting review';end if;
 for p in select value from jsonb_array_elements(run.output->'proposals') loop
 rid:=gen_random_uuid();perform save_record(gen_random_uuid(),jsonb_build_object('id',rid,'companyId',run.company_id,'kind',p->>'kind','siteId',p->'siteId','title',p->>'title','data',p->'data','version',1,'updatedAt',now(),'deletedAt',null),0);
 select * into item from office_records where id=rid;
 aid:=prepare_review(rid,item.version,case when item.kind='letter' then 'email' when item.kind='reminder' then 'reminder' else 'post' end);
 ids:=ids||to_jsonb(aid);bundle:=bundle||to_jsonb(item);n:=n+1;
 end loop;
 if n=0 then raise exception 'No proposals to review';end if;
 rid:=gen_random_uuid();perform save_record(gen_random_uuid(),jsonb_build_object('id',rid,'companyId',run.company_id,'kind','note','siteId',null,'title','Review coordinated office work','data',jsonb_build_object('body',run.output->>'text','bundle',bundle),'version',1,'updatedAt',now(),'deletedAt',null),0);
 review_id:=prepare_review(rid,1,'post');update approvals set parent_id=review_id where id in(select value::uuid from jsonb_array_elements_text(ids));
 update agent_runs set output=output||jsonb_build_object('reviewId',review_id) where id=run.id;return review_id;
end$$;
-- Parent and child decisions are committed together; the parent itself never dispatches mail.
create or replace function decide_review(approval_uuid uuid,decision text) returns text language plpgsql security definer set search_path=public as $$declare a approvals;r office_records;child approvals;begin
 select * into a from approvals where id=approval_uuid for update;if not found or coalesce(member_role(a.company_id),'')<>'owner' then raise exception 'Owner approval required' using errcode='42501';end if;
 if coalesce(auth.jwt()->>'aal','aal1')<>'aal2' then raise exception 'Verify your authenticator code first' using errcode='42501';end if;
 if decision not in ('approve','reject') then raise exception 'Invalid decision';end if;
 if a.status<>'awaiting_approval' then raise exception 'Decision already recorded';end if;
 if a.parent_id is not null then raise exception 'Decide the combined review card';end if;
 select * into r from office_records where id=a.record_id for update;
 if r.version<>a.revision or to_jsonb(r)<>a.snapshot then raise exception 'Record changed; prepare a new review';end if;
 for child in select * from approvals where parent_id=a.id order by id for update loop
 if not exists(select 1 from office_records o where o.id=child.record_id and o.version=child.revision and to_jsonb(o)=child.snapshot) then raise exception 'A proposed record changed; prepare a new combined review';end if;
 update approvals set status=case when decision='approve' then 'queued' else 'rejected' end,decided_by=auth.uid() where id=child.id;
 if decision='approve' then insert into jobs(company_id,approval_id,kind,payload) values(child.company_id,child.id,child.action,child.snapshot);end if;end loop;
 update approvals set status=case when decision='approve' then 'queued' else 'rejected' end,decided_by=auth.uid() where id=a.id;
 if decision='approve' and not exists(select 1 from approvals where parent_id=a.id) then insert into jobs(company_id,approval_id,kind,payload) values(a.company_id,a.id,a.action,a.snapshot);end if;
 insert into audit_events(company_id,user_id,event,record_id,detail) values(a.company_id,auth.uid(),decision,r.id,jsonb_build_object('approvalId',a.id,'revision',a.revision));return decision;
end$$;
create function propagate_review_status() returns trigger language plpgsql security definer set search_path=public as $$declare parent uuid;begin parent:=new.parent_id;if parent is not null then update approvals set status=case when exists(select 1 from approvals where parent_id=parent and status='uncertain') then 'uncertain' when exists(select 1 from approvals where parent_id=parent and status='failed') then 'failed' when not exists(select 1 from approvals where parent_id=parent and status<>'completed') then 'completed' when not exists(select 1 from approvals where parent_id=parent and status<>'cancelled') then 'cancelled' when not exists(select 1 from approvals where parent_id=parent and status<>'rejected') then 'rejected' else 'queued' end where id=parent;end if;return new;end$$;
create trigger review_job_outcome after update of status on approvals for each row execute function propagate_review_status();
revoke all on function prepare_run_review(uuid) from public;grant execute on function prepare_run_review(uuid) to authenticated;

create or replace function cancel_review(approval_uuid uuid) returns void language plpgsql security definer set search_path=public as $$declare a approvals;begin
 select * into a from approvals where id=approval_uuid for update;if not found or coalesce(member_role(a.company_id),'')<>'owner' then raise exception 'Owner access required';end if;
 perform 1 from jobs where approval_id in(select id from approvals where id=a.id or parent_id=a.id) order by id for update;
 if exists(select 1 from jobs where approval_id in(select id from approvals where id=a.id or parent_id=a.id) and status in ('running','completed','uncertain')) then raise exception 'Execution already started';end if;
 update approvals set status='cancelled' where id=a.id or parent_id=a.id;
 update jobs set status='cancelled',error='Cancelled by owner' where approval_id in(select id from approvals where id=a.id or parent_id=a.id) and status='queued';
end$$;
create or replace function cancel_agent_run(run_uuid uuid) returns void language plpgsql security definer set search_path=public as $$declare r agent_runs;review uuid;begin
 select * into r from agent_runs where id=run_uuid for update;if not found or r.user_id<>auth.uid() or member_role(r.company_id) is null then raise exception 'Run unavailable';end if;
 review:=(r.output->>'reviewId')::uuid;
 if review is not null then
 if coalesce(member_role(r.company_id),'')<>'owner' then raise exception 'Ask the owner to cancel the prepared review';end if;
 perform cancel_review(review);end if;
 update agent_runs set status='cancelled' where id=r.id and status in ('prepared','awaiting_approval');
end$$;
commit;
