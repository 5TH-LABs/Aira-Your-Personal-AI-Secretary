
begin;
create index record_search on office_records using gin(to_tsvector('simple',title||' '||data::text));
create function search_records(company uuid,query text) returns setof office_records language sql stable security invoker set search_path=public as $$select * from office_records where company_id=company and deleted_at is null and (to_tsvector('simple',title||' '||data::text)@@websearch_to_tsquery('simple',query) or title ilike '%'||query||'%') order by updated_at desc limit 100$$;
revoke all on function search_records(uuid,text) from public;grant execute on function search_records(uuid,text) to authenticated;
commit;
