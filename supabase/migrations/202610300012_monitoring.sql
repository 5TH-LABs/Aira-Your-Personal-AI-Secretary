
begin;
revoke execute on function consume_usage(uuid,uuid,text) from authenticated;
create table worker_heartbeats(id text primary key,last_seen timestamptz not null default now());alter table worker_heartbeats enable row level security;grant all on worker_heartbeats to service_role;
create function worker_health(company uuid) returns jsonb language plpgsql stable security definer set search_path=public as $$declare seen timestamptz;begin if coalesce(member_role(company),'')<>'owner' then raise exception 'Owner access required';end if;select max(last_seen) into seen from worker_heartbeats;return jsonb_build_object('lastSeen',seen,'healthy',coalesce(seen>now()-interval '3 minutes',false),'failedJobs',(select count(*) from jobs where company_id=company and status in ('failed','uncertain')));end$$;
revoke all on function worker_health(uuid) from public;grant execute on function worker_health(uuid) to authenticated;
commit;
