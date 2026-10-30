
begin;
create table request_limits(company_id uuid not null,user_id uuid not null,route text not null,window_start timestamptz not null,requests integer not null,primary key(company_id,user_id,route,window_start));alter table request_limits enable row level security;
create function allow_request(company uuid,route_name text) returns void language plpgsql security definer set search_path=public as $$declare n integer;begin
 if member_role(company) is null or route_name not in ('transcribe','upload') then raise exception 'Forbidden';end if;
 insert into request_limits values(company,auth.uid(),route_name,date_trunc('minute',now()),1) on conflict(company_id,user_id,route,window_start) do update set requests=request_limits.requests+1 returning requests into n;
 if n>20 then raise exception 'Too many requests; wait a minute before retrying';end if;
end$$;
revoke all on function allow_request(uuid,text) from public;grant execute on function allow_request(uuid,text) to authenticated;
drop policy file_read on file_records;
create policy file_read on file_records for select to authenticated using(member_role(company_id) is not null and (member_role(company_id) in ('owner','office_manager','accountant') or created_by=auth.uid() or exists(select 1 from memberships m where m.company_id=file_records.company_id and m.user_id=auth.uid() and m.role='supervisor' and file_records.site_id=any(m.site_ids))));
commit;
