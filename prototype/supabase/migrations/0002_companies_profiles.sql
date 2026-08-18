-- Phase 1: companies, people, profiles + RLS helpers + base policies.
-- people.location_id has no FK yet (locations table lands in Phase 2 /
-- 0004_core_entities.sql); the FK constraint is added there.

create type app_role as enum ('super_admin', 'company_admin', 'manager', 'employee');

create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  timezone text not null default 'America/New_York',
  locale text not null default 'en-US',
  branding_color text default '#5e6ad2',
  logo_url text,
  break_policy jsonb not null default '{"enabled":true,"mealBreakThresholdMinutes":300,"mealBreakMinMinutes":30,"restBreakThresholdMinutes":240,"restBreakMinMinutes":10,"maxMealBreaksPerShift":1,"maxRestBreaksPerShift":3}',
  status text not null default 'active',
  plan text not null default 'free', -- super_admin-only fields (status, plan)
  completed_setup_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table people (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  role text not null check (role in ('employee', 'manager')),
  team_ids uuid[] not null default '{}',
  location_id uuid, -- FK added in 0004_core_entities.sql once locations exists
  timezone text not null default 'America/New_York',
  status text not null default 'invited' check (status in ('active', 'invited', 'inactive')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, email)
);
create index idx_people_company on people(company_id);
create index idx_people_team_ids on people using gin (team_ids);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references companies(id) on delete cascade, -- null for super_admin
  person_id uuid references people(id) on delete set null,
  role app_role not null,
  email text not null,
  name text not null,
  created_at timestamptz not null default now()
);
create index idx_profiles_company on profiles(company_id);

-- ---------------------------------------------------------------------------
-- RLS helper functions (SECURITY DEFINER — avoid recursion into profiles RLS)
-- ---------------------------------------------------------------------------

create function public.current_company_id() returns uuid
language sql stable security definer set search_path = public as $$
  select company_id from public.profiles where id = auth.uid()
$$;

create function public.current_app_role() returns app_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create function public.current_person_id() returns uuid
language sql stable security definer set search_path = public as $$
  select person_id from public.profiles where id = auth.uid()
$$;

create function public.is_super_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'super_admin')
$$;

-- ---------------------------------------------------------------------------
-- Generic helper triggers reused by this and later migrations
-- ---------------------------------------------------------------------------

create function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create function public.set_company_id() returns trigger
language plpgsql as $$
begin
  new.company_id := coalesce(new.company_id, public.current_company_id());
  return new;
end;
$$;

create trigger set_updated_at before update on companies
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on people
  for each row execute function public.set_updated_at();

create trigger set_company_id before insert on people
  for each row execute function public.set_company_id();

-- companies.status/plan are super_admin-only; silently revert if a
-- non-super_admin tries to change them via UPDATE.
create function public.enforce_company_admin_fields() returns trigger
language plpgsql as $$
begin
  if not public.is_super_admin() then
    new.status := old.status;
    new.plan := old.plan;
  end if;
  return new;
end;
$$;

create trigger enforce_company_admin_fields before update on companies
  for each row execute function public.enforce_company_admin_fields();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table companies enable row level security;
alter table people enable row level security;
alter table profiles enable row level security;

-- companies: members see their own company; super_admin sees all.
-- No client insert policy — companies are created only by handle_new_user
-- (SECURITY DEFINER trigger, bypasses RLS) in 0003_auth_trigger.sql.
create policy "companies_select" on companies for select
  using (id = current_company_id() or is_super_admin());

create policy "companies_update" on companies for update
  using (id = current_company_id() or is_super_admin())
  with check (id = current_company_id() or is_super_admin());
  -- status/plan columns protected by enforce_company_admin_fields() trigger

create policy "companies_delete" on companies for delete
  using (is_super_admin());

-- people: whole company can read (matches current single-workspace-per-company
-- behavior); only manager/company_admin can write.
create policy "people_select" on people for select
  using (company_id = current_company_id() or is_super_admin());

create policy "people_insert" on people for insert
  with check (
    company_id = current_company_id()
    and current_app_role() in ('manager', 'company_admin')
  );

create policy "people_update" on people for update
  using (
    company_id = current_company_id()
    and current_app_role() in ('manager', 'company_admin')
  )
  with check (
    company_id = current_company_id()
    and current_app_role() in ('manager', 'company_admin')
  );

create policy "people_delete" on people for delete
  using (
    company_id = current_company_id()
    and current_app_role() in ('manager', 'company_admin')
  );

-- profiles: self, same-company, or super_admin can read. No client
-- insert/update/delete policy — profiles are managed only by
-- handle_new_user (SECURITY DEFINER) in 0003_auth_trigger.sql.
create policy "profiles_select" on profiles for select
  using (id = auth.uid() or company_id = current_company_id() or is_super_admin());
