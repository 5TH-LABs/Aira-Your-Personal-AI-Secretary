
begin;
alter table file_records add column sha256 text;
alter table approvals add column attachment_snapshot jsonb not null default '[]';
create or replace function prepare_review(record_uuid uuid,expected integer,requested_action text) returns uuid language plpgsql security definer set search_path=public as $$declare r office_records;doc office_records;f file_records;item text;aid uuid;bindings jsonb:='[]';begin
 select * into r from office_records where id=record_uuid for update;
 if not found or not can_read_record(r) then raise exception 'Forbidden' using errcode='42501';end if;
 if r.version<>expected or r.deleted_at is not null then raise exception 'Record changed; refresh before review';end if;
 if requested_action not in ('post','email','delete','reminder') or (requested_action='email' and r.kind<>'letter') or (requested_action='reminder' and r.kind<>'reminder') then raise exception 'Invalid action';end if;
 if coalesce(r.data->>'posted','false')='true' and requested_action<>'delete' then raise exception 'Already posted';end if;
 if requested_action='email' then for item in select jsonb_array_elements_text(coalesce(r.data->'attachments','[]')) loop
 select * into doc from office_records where id=item::uuid and company_id=r.company_id and kind='document' and deleted_at is null;
 if not found or not can_read_record(doc) then raise exception 'Attachment unavailable';end if;
 select * into f from file_records where id=(doc.data->>'fileId')::uuid and company_id=r.company_id and status='ready';if not found then raise exception 'Attachment upload incomplete';end if;
 bindings:=bindings||jsonb_build_object('documentId',doc.id,'version',doc.version,'fileId',f.id,'filename',f.filename,'mimeType',f.mime_type,'sha256',f.sha256);end loop;end if;
 insert into approvals(company_id,record_id,revision,snapshot,action,attachment_snapshot) values(r.company_id,r.id,r.version,to_jsonb(r),requested_action,bindings) on conflict(record_id,revision,action) do update set snapshot=approvals.snapshot returning id into aid;
 insert into notifications(company_id,user_id,title,body,record_id) select r.company_id,user_id,'Review requested',r.title,r.id from memberships where company_id=r.company_id and role='owner' and active;return aid;
end$$;
commit;
