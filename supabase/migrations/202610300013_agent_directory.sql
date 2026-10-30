
begin;
create function worker_directory(company uuid,actor uuid) returns table(user_id uuid,name text,role text) language sql stable security definer set search_path=public as $$select m.user_id,coalesce(u.raw_user_meta_data->>'full_name',split_part(u.email,'@',1),'Team member'),m.role from memberships m join auth.users u on u.id=m.user_id where m.company_id=company and m.active and exists(select 1 from memberships a where a.company_id=company and a.user_id=actor and a.active)$$;
revoke all on function worker_directory(uuid,uuid) from public;grant execute on function worker_directory(uuid,uuid) to service_role;
commit;
