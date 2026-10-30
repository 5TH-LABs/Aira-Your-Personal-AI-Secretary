
begin;
create function attendance_review_only() returns trigger language plpgsql as $$begin if new.kind='attendance' and coalesce(current_setting('siteoffice.executing',true),'')<>'yes' then raise exception 'Prepare an attendance correction for owner approval';end if;return new;end$$;
create trigger attendance_correction before update on office_records for each row execute function attendance_review_only();
commit;
