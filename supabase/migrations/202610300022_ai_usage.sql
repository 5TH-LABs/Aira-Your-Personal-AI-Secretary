begin;
create table ai_usage(id uuid primary key default gen_random_uuid(),company_id uuid not null references companies(id),user_id uuid,run_id uuid,job_id uuid,model text not null,status text not null check(status in ('responded','failed')),http_status integer,input_tokens bigint check(input_tokens>=0),output_tokens bigint check(output_tokens>=0),total_tokens bigint check(total_tokens>=0),created_at timestamptz not null default now());
create index ai_usage_company_month on ai_usage(company_id,created_at);
alter table ai_usage enable row level security;
create policy ai_usage_owner on ai_usage for select to authenticated using(member_role(company_id)='owner');
grant select on ai_usage to authenticated;grant all on ai_usage to service_role;
create function ai_usage_summary(company uuid) returns jsonb language plpgsql stable security definer set search_path=public as $$begin
 if coalesce(member_role(company),'')<>'owner' then raise exception 'Owner access required';end if;
 return (select jsonb_build_object('calls',count(*),'failed',count(*) filter(where status='failed'),'inputTokens',coalesce(sum(input_tokens),0),'outputTokens',coalesce(sum(output_tokens),0),'totalTokens',coalesce(sum(total_tokens),0),'unmetered',count(*) filter(where total_tokens is null)) from ai_usage where company_id=company and (created_at at time zone 'Asia/Colombo')>=date_trunc('month',now() at time zone 'Asia/Colombo'));
end$$;
revoke all on function ai_usage_summary(uuid) from public;grant execute on function ai_usage_summary(uuid) to authenticated;
commit;
