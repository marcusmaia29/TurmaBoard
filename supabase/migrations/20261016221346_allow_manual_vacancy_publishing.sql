begin;

-- The local maintainer tool uses a secret key, which maps to service_role.
-- Public clients retain read-only access through the existing RLS policy.
grant select, insert, update on public.vacancies to service_role;
revoke insert, update, delete on public.vacancies from anon, authenticated;

commit;
