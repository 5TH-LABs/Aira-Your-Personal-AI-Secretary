
begin;
create function company_settings(company uuid,company_name text,letterhead text) returns void language plpgsql security definer set search_path=public as $$begin
 if coalesce(member_role(company),'')<>'owner' or coalesce(auth.jwt()->>'aal','')<>'aal2' then raise exception 'Verified owner access required';end if;
 if length(trim(company_name)) not between 1 and 150 or length(letterhead)>3000 then raise exception 'Invalid company details';end if;
 update companies set name=trim(company_name),settings=settings||jsonb_build_object('letterheadText',letterhead) where id=company;
end$$;
revoke all on function company_settings(uuid,text,text) from public;grant execute on function company_settings(uuid,text,text) to authenticated;
commit;
