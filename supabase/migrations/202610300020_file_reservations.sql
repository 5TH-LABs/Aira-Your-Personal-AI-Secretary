
begin;
create function reserve_file(company uuid,file_uuid uuid,site uuid,file_name text,mime text,bytes integer,content_hash text) returns jsonb language plpgsql security definer set search_path=public as $$declare f file_records;cap integer;used integer;begin
 if member_role(company) is null then raise exception 'Company access unavailable';end if;
 if bytes<=0 or bytes>8500000 or content_hash!~'^[a-f0-9]{64}$' or length(file_name) not between 1 and 180 or mime not in ('application/pdf','image/jpeg','image/png','image/webp','text/plain') then raise exception 'Invalid source file';end if;
 if site is not null and not exists(select 1 from office_records r where r.id=site and r.company_id=company and r.kind='site' and can_read_record(r)) then raise exception 'Site access unavailable';end if;
 perform pg_advisory_xact_lock(hashtextextended(company::text,19));
 select * into f from file_records where id=file_uuid for update;
 if found then if f.company_id<>company or f.created_by<>auth.uid() or (f.sha256 is not null and f.sha256<>content_hash) then raise exception 'File identity is already reserved for different content';end if;if f.sha256 is null then update file_records set sha256=content_hash where id=file_uuid returning * into f;end if;return to_jsonb(f);end if;
 perform allow_request(company,'upload');
 select 1000+coalesce(sum(quantity),0) into cap from topups where company_id=company and metric='documents' and created_at>=date_trunc('month',now() at time zone 'Asia/Colombo') at time zone 'Asia/Colombo';
 select count(*) into used from file_records where company_id=company and created_at>=date_trunc('month',now() at time zone 'Asia/Colombo') at time zone 'Asia/Colombo';if used>=cap then raise exception 'Monthly source-file allowance reached';end if;
 insert into file_records(id,company_id,site_id,filename,mime_type,size,storage_path,created_by,sha256) values(file_uuid,company,site,file_name,mime,bytes,company::text||'/'||file_uuid::text,auth.uid(),content_hash) returning * into f;return to_jsonb(f);
end$$;
revoke all on function reserve_file(uuid,uuid,uuid,text,text,integer,text) from public;grant execute on function reserve_file(uuid,uuid,uuid,text,text,integer,text) to authenticated;
commit;
