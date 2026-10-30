begin;
-- Imported specialist history is evidence, never an executable approval or ledger posting.
-- Owner-only access also keeps historical HR/payroll out of ordinary shared notes.
create table legacy_archives(
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null references companies(id),
 operation_id uuid not null,
 title text not null,
 original_kind text not null,
 payload jsonb not null,
 content_hash text not null,
 imported_by uuid not null,
 created_at timestamptz not null default now(),
 unique(company_id,operation_id)
);
alter table legacy_archives enable row level security;
create policy archive_owner_read on legacy_archives for select to authenticated using(member_role(company_id)='owner');
grant select on legacy_archives to authenticated;
grant all on legacy_archives to service_role;
commit;
