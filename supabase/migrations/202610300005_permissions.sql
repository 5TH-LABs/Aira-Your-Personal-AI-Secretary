
begin;
create function member_directory(company uuid) returns table(user_id uuid,name text,role text) language sql stable security definer set search_path=public as $$select m.user_id,coalesce(u.raw_user_meta_data->>'full_name',split_part(u.email,'@',1),'Team member'),m.role from memberships m join auth.users u on u.id=m.user_id where m.company_id=company and m.active and member_role(company) is not null$$;
revoke all on function member_directory(uuid) from public;
grant execute on function member_directory(uuid) to authenticated;
grant select on companies,memberships,office_records,audit_events,approvals,jobs,agent_runs,usage_events,notifications,mailbox_messages,integration_status,invitations,topups,file_records to authenticated;
grant select,insert,update,delete on push_devices to authenticated;
revoke all on integration_secrets,oauth_states,request_operations,operations from anon,authenticated;
commit;
