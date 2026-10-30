
begin;
create function invalidate_record_reviews() returns trigger language plpgsql security definer set search_path=public as $$declare affected uuid[];begin
 if coalesce(current_setting('siteoffice.executing',true),'')='yes' or new.version=old.version then return new;end if;
 select array_agg(distinct coalesce(parent_id,id)) into affected from approvals where (record_id=old.id or attachment_snapshot @> jsonb_build_array(jsonb_build_object('documentId',old.id))) and status in ('awaiting_approval','queued','uncertain');
 if affected is null then return new;end if;
 perform 1 from jobs where approval_id in(select id from approvals where id=any(affected) or parent_id=any(affected)) order by id for update;
 if exists(select 1 from jobs where approval_id in(select id from approvals where id=any(affected) or parent_id=any(affected)) and status in ('running','uncertain')) then raise exception 'Execution has started or needs reconciliation; editing is locked';end if;
 update approvals set status='cancelled' where (id=any(affected) or parent_id=any(affected)) and status in ('awaiting_approval','queued');
 update jobs set status='cancelled',error='Superseded by an edited revision' where approval_id in(select id from approvals where id=any(affected) or parent_id=any(affected)) and status='queued';
 return new;
end$$;
create trigger invalidate_reviews before update on office_records for each row execute function invalidate_record_reviews();
grant all on all tables in schema public to service_role;grant usage,select on all sequences in schema public to service_role;
commit;
