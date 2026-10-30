
begin;
create table request_operations(company_id uuid not null,user_id uuid not null,operation_id uuid not null,request_hash text not null,result jsonb not null,primary key(company_id,user_id,operation_id));
alter table request_operations enable row level security;
create function save_record(operation uuid,input jsonb,expected integer) returns jsonb language plpgsql security definer set search_path=public as $$
declare c uuid:=(input->>'companyId')::uuid;k text:=input->>'kind';d jsonb:=input->'data';required text[];field text;l jsonb;total numeric:=0;variance numeric:=0;a office_records;gross numeric:=0;r jsonb;prior request_operations;h text:=encode(digest(input::text||expected::text,'sha256'),'hex');begin
 if member_role(c) is null then raise exception 'Forbidden';end if;
 perform pg_advisory_xact_lock(hashtextextended(c::text||auth.uid()::text||operation::text,9));
 select * into prior from request_operations where company_id=c and user_id=auth.uid() and operation_id=operation;if found then if prior.request_hash<>h then raise exception 'Operation ID reused';end if;return prior.result;end if;
 required:=case k when 'letter' then array['recipient','body'] when 'task' then array['assigneeId','body','due'] when 'attendance' then array['assigneeId','staffName','date','hours','rate','overtime','otRate'] when 'payroll' then array['attendanceIds','periodStart','periodEnd'] when 'contract' then array['source','obligations'] when 'permit' then array['reference','expiry'] when 'report' then array['date','progress'] when 'staff' then array['name','role'] when 'leave' then array['assigneeId','from','to','reason'] when 'subcontract' then array['contractor','milestone','amount'] when 'estimate' then array['lines'] when 'invoice' then array['counterparty','reference','lines','amount'] when 'expense' then array['counterparty','reference','amount','date','category'] when 'payment' then array['invoiceId','amount','date','bankReference'] when 'finding' then array['source','evidence'] when 'document' then array['filename','mimeType','storagePath','fileId'] else array[]::text[] end;
 foreach field in array required loop if coalesce(d->>field,'')='' then raise exception 'Missing %',field;end if;end loop;
 if d ? 'posted' or d ? 'approvedBy' or d ? 'executionStatus' then raise exception 'Execution fields cannot be supplied';end if;
 foreach field in array array['amount','paid','rate','otRate','hours','overtime','quantity','deductions','employerContribution'] loop if d ? field and ((d->>field)!~'^[0-9]+(\.[0-9]+)?$' or (d->>field)::numeric<0) then raise exception 'Invalid decimal field %',field;end if;end loop;
 if k='attendance' then if (d->>'hours')::numeric+(d->>'overtime')::numeric>24 then raise exception 'Work hours exceed 24';end if;d:=d||jsonb_build_object('calculatedTotal',round((d->>'hours')::numeric*(d->>'rate')::numeric+(d->>'overtime')::numeric*(d->>'otRate')::numeric,2)::text);end if;
 if k in ('estimate','invoice') then if jsonb_typeof(d->'lines')<>'array' or jsonb_array_length(d->'lines')<1 then raise exception 'Add at least one line';end if;for l in select value from jsonb_array_elements(d->'lines') loop if (l->>'quantity')!~'^[0-9]+(\.[0-9]+)?$' or (l->>'rate')!~'^[0-9]+(\.[0-9]+)?$' then raise exception 'Invalid line values';end if;total:=total+(l->>'quantity')::numeric*(l->>'rate')::numeric;if l ? 'delivered' then if (l->>'delivered')!~'^[0-9]+(\.[0-9]+)?$' then raise exception 'Invalid delivery';end if;variance:=variance+((l->>'quantity')::numeric-(l->>'delivered')::numeric)*(l->>'rate')::numeric;end if;end loop;d:=d||jsonb_build_object('calculatedTotal',round(total,2)::text,'deliveryVariance',round(variance,2)::text);end if;
 if k='document' and not exists(select 1 from file_records where id=(d->>'fileId')::uuid and company_id=c and storage_path=d->>'storagePath' and status='ready' and (created_by=auth.uid() or member_role(c) in ('owner','office_manager'))) then raise exception 'Original file unavailable';end if;
 if k='payroll' then
 if jsonb_typeof(d->'attendanceIds')<>'array' or jsonb_array_length(d->'attendanceIds')=0 or jsonb_array_length(d->'attendanceIds')<>(select count(distinct value) from jsonb_array_elements_text(d->'attendanceIds')) then raise exception 'Select unique attendance entries';end if;
 d:=d||jsonb_build_object('attendanceVersions','{}'::jsonb);
 for field in select jsonb_array_elements_text(d->'attendanceIds') loop
 select * into a from office_records where id=field::uuid and company_id=c and kind='attendance' and deleted_at is null;
 if not found or not can_read_record(a) or a.site_id is distinct from (input->>'siteId')::uuid or a.data->>'date'<d->>'periodStart' or a.data->>'date'>d->>'periodEnd' then raise exception 'Payroll attendance unavailable or outside period';end if;
 d:=jsonb_set(d,array['attendanceVersions',a.id::text],to_jsonb(a.version));gross:=gross+(a.data->>'hours')::numeric*(a.data->>'rate')::numeric+(a.data->>'overtime')::numeric*(a.data->>'otRate')::numeric;end loop;
 if coalesce((d->>'deductions')::numeric,0)>gross then raise exception 'Deductions exceed wages';end if;
 d:=d||jsonb_build_object('gross',round(gross,2)::text,'net',round(gross-coalesce((d->>'deductions')::numeric,0),2)::text,'totalCost',round(gross+coalesce((d->>'employerContribution')::numeric,0),2)::text);
 end if;
 if k='subcontract' then d:=d||jsonb_build_object('outstanding',round((d->>'amount')::numeric-coalesce((d->>'paid')::numeric,0),2)::text);end if;
 if k='payroll' and member_role(c) not in ('owner','accountant') then raise exception 'Payroll access required';end if;
 r:=apply_record_mutation(operation,jsonb_set(input,'{data}',d),expected);
 if r->>'state'='completed' then
 if k='letter' and expected=0 then perform consume_usage(c,operation,'letters');elsif k='document' and expected=0 then perform consume_usage(c,operation,'documents');elsif k='invoice' then perform consume_usage(c,operation,'bills');end if;
 insert into request_operations values(c,auth.uid(),operation,h,r);if k='document' and expected=0 then insert into jobs(company_id,kind,payload,dedupe_key) select c,'extract',to_jsonb(o),'extract:'||o.id::text||':'||o.version from office_records o where id=(input->>'id')::uuid on conflict(company_id,dedupe_key) do nothing;end if;
 if exists(select 1 from integration_status where company_id=c and status='connected') then insert into jobs(company_id,kind,payload,dedupe_key) select c,'archive',to_jsonb(o),'archive:'||o.id::text||':'||o.version from office_records o where id=(input->>'id')::uuid on conflict(company_id,dedupe_key) do nothing;end if;
 end if;return r;
end$$;
revoke execute on function apply_record_mutation(uuid,jsonb,integer) from authenticated;
revoke all on function save_record(uuid,jsonb,integer) from public;
grant execute on function save_record(uuid,jsonb,integer) to authenticated;
commit;
