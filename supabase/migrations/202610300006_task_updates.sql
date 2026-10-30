
begin;
create function task_status(record_uuid uuid,expected integer,new_status text) returns void language plpgsql security definer set search_path=public as $$declare r office_records;begin
 select * into r from office_records where id=record_uuid for update;
 if not found or r.kind<>'task' or not can_read_record(r) then raise exception 'Task unavailable';end if;
 if r.version<>expected then raise exception 'Task changed; refresh before updating';end if;
 if r.data->>'posted'<>'true' then raise exception 'Task assignment awaits approval';end if;
 if new_status not in ('To do','In progress','Done') then raise exception 'Invalid task status';end if;
 perform set_config('siteoffice.executing','yes',true);update office_records set data=data||jsonb_build_object('status',new_status),version=version+1,updated_at=now() where id=r.id;
 insert into audit_events(company_id,user_id,event,record_id,detail) values(r.company_id,auth.uid(),'task_status',r.id,jsonb_build_object('status',new_status));
end$$;
revoke all on function task_status(uuid,integer,text) from public;grant execute on function task_status(uuid,integer,text) to authenticated;
commit;
