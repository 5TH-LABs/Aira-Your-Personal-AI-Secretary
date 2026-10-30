
begin;
alter table office_records drop constraint office_records_kind_check;
alter table office_records add constraint office_records_kind_check check(kind in ('site','contact','task','note','meeting','reminder','document','letter','contract','permit','report','attendance','payroll','staff','leave','subcontract','estimate','invoice','expense','payment','finding','announcement','rate','wage_policy','payment_plan'));
create function payment_plan_access() returns trigger language plpgsql security definer set search_path=public as $$begin if new.kind='payment_plan' and coalesce(member_role(new.company_id),'') not in ('owner','accountant') and coalesce(auth.role(),'')<>'service_role' then raise exception 'Payment preparation requires accountant access';end if;return new;end$$;
create trigger payment_plan_permission before insert or update on office_records for each row execute function payment_plan_access();
commit;
