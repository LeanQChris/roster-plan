-- Phase 5: platform_audit_log for the super-admin console (lib/store.tsx),
-- replacing the mock seedAudit data in lib/data.ts. Append-only — no
-- update/delete policy, matches the audit_log table pattern from 0005.

create table platform_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor text not null,
  actor_role app_role not null,
  action text not null,
  tone text not null check (tone in ('neutral','success','warning','danger')),
  resource text not null,
  resource_id text not null,
  company_id uuid references companies(id) on delete set null,
  company_name text not null,
  ip text,
  created_at timestamptz not null default now()
);

alter table platform_audit_log enable row level security;

create policy "platform_audit_log_select" on platform_audit_log for select
  using (is_super_admin());
create policy "platform_audit_log_insert" on platform_audit_log for insert
  with check (is_super_admin());
-- no update/delete policy — append-only

-- ---------------------------------------------------------------------------
-- Extend handle_new_user(): log a company.registration event for every
-- company_admin signup. IP unavailable here — trigger has no request
-- context, the only event type without one.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := new.raw_user_meta_data;
  intended_role text := meta->>'intended_role';
  company_name text := meta->>'company_name';
  meta_company_id uuid := nullif(meta->>'company_id', '')::uuid;
  meta_person_id uuid := nullif(meta->>'person_id', '')::uuid;
  display_name text := coalesce(meta->>'name', split_part(new.email, '@', 1));
  new_company_id uuid;
  base_slug text;
  final_slug text;
  suffix int := 0;
  person_name text;
  resolved_company_name text;
begin
  if intended_role = 'super_admin' then
    insert into public.profiles (id, company_id, person_id, role, email, name)
    values (new.id, null, null, 'super_admin', new.email, display_name);

  elsif intended_role = 'company_admin' then
    base_slug := lower(regexp_replace(trim(coalesce(company_name, display_name)), '[^a-z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);
    if base_slug = '' then
      base_slug := 'company';
    end if;
    final_slug := base_slug;
    while exists(select 1 from public.companies where slug = final_slug) loop
      suffix := suffix + 1;
      final_slug := base_slug || '-' || suffix;
    end loop;

    resolved_company_name := coalesce(company_name, display_name);

    insert into public.companies (name, slug)
    values (resolved_company_name, final_slug)
    returning id into new_company_id;

    insert into public.profiles (id, company_id, person_id, role, email, name)
    values (new.id, new_company_id, null, 'company_admin', new.email, display_name);

    insert into public.platform_audit_log
      (actor, actor_role, action, tone, resource, resource_id, company_id, company_name, ip)
    values (
      new.email,
      'company_admin',
      'company.registration',
      'success',
      resolved_company_name,
      'company:' || new_company_id,
      new_company_id,
      resolved_company_name,
      null
    );

  elsif intended_role in ('employee', 'manager')
    and meta_company_id is not null
    and meta_person_id is not null then

    select name into person_name from public.people where id = meta_person_id;

    insert into public.profiles (id, company_id, person_id, role, email, name)
    values (
      new.id,
      meta_company_id,
      meta_person_id,
      intended_role::app_role,
      new.email,
      coalesce(person_name, display_name)
    );

    update public.people
      set status = 'active', updated_at = now()
      where id = meta_person_id and status = 'invited';

  end if;

  return new;
end;
$$;
