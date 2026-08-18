-- Phase 2: shift templates, shifts, shift assignments, audit log.
-- start_time stored as text (not Postgres time) to match the app's
-- timeToMinutes() string parsing in lib/company-data/business.ts.

create table shift_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  title text not null,
  description text,
  duration_minutes integer not null,
  start_time text not null,
  required_count integer not null default 1,
  max_count integer,
  is_active boolean not null default true,
  recurrence_rule text,
  break_policy_override jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_shift_templates_company on shift_templates(company_id);
create index idx_shift_templates_team on shift_templates(team_id);

create table shifts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  template_id uuid references shift_templates(id) on delete set null,
  title text not null,
  description text,
  date date not null,
  start_time text not null,
  duration_minutes integer not null,
  required_count integer not null default 1,
  created_at timestamptz not null default now()
);
create index idx_shifts_company on shifts(company_id);
create index idx_shifts_team on shifts(team_id);
create index idx_shifts_template on shifts(template_id);

create table shift_assignments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  shift_id uuid not null references shifts(id) on delete cascade,
  person_id uuid not null references people(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references people(id),
  cancelled_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_shift_assignments_company on shift_assignments(company_id);
create index idx_shift_assignments_shift on shift_assignments(shift_id);
create index idx_shift_assignments_person on shift_assignments(person_id);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  action text not null,
  tone text not null check (tone in ('neutral', 'success', 'warning', 'danger')),
  resource text not null,
  resource_id text not null,
  team_id uuid references teams(id) on delete set null,
  message text not null,
  created_at timestamptz not null default now()
);
create index idx_audit_log_company on audit_log(company_id);

create trigger set_updated_at before update on shift_templates
  for each row execute function public.set_updated_at();

create trigger set_company_id before insert on shift_templates
  for each row execute function public.set_company_id();
create trigger set_company_id before insert on shifts
  for each row execute function public.set_company_id();
create trigger set_company_id before insert on shift_assignments
  for each row execute function public.set_company_id();
create trigger set_company_id before insert on audit_log
  for each row execute function public.set_company_id();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table shift_templates enable row level security;
alter table shifts enable row level security;
alter table shift_assignments enable row level security;
alter table audit_log enable row level security;

-- shift_templates / shifts: whole company reads; manager/company_admin write.
create policy "shift_templates_select" on shift_templates for select
  using (company_id = current_company_id() or is_super_admin());

create policy "shift_templates_insert" on shift_templates for insert
  with check (
    company_id = current_company_id()
    and current_app_role() in ('manager', 'company_admin')
  );

create policy "shift_templates_update" on shift_templates for update
  using (
    company_id = current_company_id()
    and current_app_role() in ('manager', 'company_admin')
  )
  with check (
    company_id = current_company_id()
    and current_app_role() in ('manager', 'company_admin')
  );

create policy "shift_templates_delete" on shift_templates for delete
  using (
    company_id = current_company_id()
    and current_app_role() in ('manager', 'company_admin')
  );

create policy "shifts_select" on shifts for select
  using (company_id = current_company_id() or is_super_admin());

create policy "shifts_insert" on shifts for insert
  with check (
    company_id = current_company_id()
    and current_app_role() in ('manager', 'company_admin')
  );

create policy "shifts_update" on shifts for update
  using (
    company_id = current_company_id()
    and current_app_role() in ('manager', 'company_admin')
  )
  with check (
    company_id = current_company_id()
    and current_app_role() in ('manager', 'company_admin')
  );

create policy "shifts_delete" on shifts for delete
  using (
    company_id = current_company_id()
    and current_app_role() in ('manager', 'company_admin')
  );

-- shift_assignments: whole company reads. Self may insert own request
-- (status defaults pending) or manager/company_admin may insert any (bulk
-- assign, defaults to approved via app code). Update: manager/company_admin
-- (approve/reject) or self on own row (cancel).
create policy "shift_assignments_select" on shift_assignments for select
  using (company_id = current_company_id() or is_super_admin());

create policy "shift_assignments_insert" on shift_assignments for insert
  with check (
    company_id = current_company_id()
    and (
      person_id = current_person_id()
      or current_app_role() in ('manager', 'company_admin')
    )
  );

create policy "shift_assignments_update" on shift_assignments for update
  using (
    company_id = current_company_id()
    and (
      current_app_role() in ('manager', 'company_admin')
      or person_id = current_person_id()
    )
  )
  with check (
    company_id = current_company_id()
    and (
      current_app_role() in ('manager', 'company_admin')
      or person_id = current_person_id()
    )
  );

create policy "shift_assignments_delete" on shift_assignments for delete
  using (
    company_id = current_company_id()
    and current_app_role() in ('manager', 'company_admin')
  );

-- audit_log: append-only. Any company member can insert; whole company reads.
create policy "audit_log_select" on audit_log for select
  using (company_id = current_company_id() or is_super_admin());

create policy "audit_log_insert" on audit_log for insert
  with check (company_id = current_company_id());
