
begin;
create sequence sync_revision_seq;
alter table office_records add column sync_revision bigint not null default nextval('sync_revision_seq');
alter table memberships add column access_revision bigint not null default nextval('sync_revision_seq');
create index record_sync_changes on office_records(company_id,sync_revision);
create function record_revision() returns trigger language plpgsql as $$begin new.sync_revision:=nextval('sync_revision_seq');return new;end$$;
create trigger z_record_revision before insert or update on office_records for each row execute function record_revision();
create function membership_revision() returns trigger language plpgsql as $$begin new.access_revision:=nextval('sync_revision_seq');return new;end$$;
create trigger access_revision before update on memberships for each row execute function membership_revision();
create function sync_window(company uuid,after_seq bigint,until_seq bigint) returns setof office_records language sql stable security invoker set search_path=public as $$select * from office_records where company_id=company and sync_revision>after_seq and sync_revision<=until_seq order by sync_revision limit 1000$$;
create function sync_highwater(company uuid) returns bigint language sql stable security invoker set search_path=public as $$select coalesce(max(sync_revision),0) from office_records where company_id=company$$;
revoke all on function sync_window(uuid,bigint,bigint),sync_highwater(uuid) from public;grant execute on function sync_window(uuid,bigint,bigint),sync_highwater(uuid) to authenticated;
grant usage,select on sequence sync_revision_seq to service_role;
commit;
