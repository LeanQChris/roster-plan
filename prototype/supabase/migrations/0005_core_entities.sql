-- Phase 2: locations, teams (+ deferred people FK), activity/clock/break
-- entries, compliance violations, leave requests. RLS reuses helper
-- functions defined in 0002_companies_profiles.sql.

create table locations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  description text,
  address text,
  city text,
  state text,
  country text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index idx_locations_company on locations(company_id);

create table teams (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  description text,
  location_id uuid references locations(id) on delete set null,
  manager_id uuid references people(id) on delete set null,
  created_at timestamptz not null default now()
);
create index idx_teams_company on teams(company_id);

-- Deferred FK from 0002: people.location_id had no FK until locations existed.
alter table people
  add constraint people_location_id_fkey
  foreign key (location_id) references locations(id) on delete set null;

-- Keep people.team_ids in sync when a team is deleted.
create function public.strip_team_id_from_people() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.people
    set team_ids = array_remove(team_ids, old.id)
    where old.id = any(team_ids);
  return old;
end;
$$;

create trigger strip_team_id_from_people after delete on teams
  for each row execute function public.strip_team_id_from_people();

create table activity_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  person_id uuid not null references people(id) on delete cascade,
  action text not null check (action in ('invited', 'updated', 'resent', 'notified')),
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_activity_entries_company on activity_entries(company_id);
create index idx_activity_entries_person on activity_entries(person_id);

create table clock_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  person_id uuid not null references people(id) on delete cascade,
  action text not null check (action in ('in', 'out')),
  at timestamptz not null default now(),
  note text,
  created_at timestamptz not null default now()
);
create index idx_clock_entries_company on clock_entries(company_id);
create index idx_clock_entries_person on clock_entries(person_id);

create table break_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  clock_entry_id uuid not null references clock_entries(id) on delete cascade,
  person_id uuid not null references people(id) on delete cascade,
  type text not null check (type in ('meal', 'rest')),
  break_in_at timestamptz not null,
  break_out_at timestamptz,
  duration_minutes integer,
  created_at timestamptz not null default now()
);
create index idx_break_entries_company on break_entries(company_id);
create index idx_break_entries_clock_entry on break_entries(clock_entry_id);
create index idx_break_entries_person on break_entries(person_id);

create table compliance_violations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  person_id uuid not null references people(id) on delete cascade,
  clock_entry_id uuid not null references clock_entries(id) on delete cascade,
  type text not null,
  severity text not null check (severity in ('warning', 'critical')),
  description text not null,
  detected_at timestamptz not null default now(),
  status text not null default 'open' check (status in ('open', 'acknowledged', 'resolved', 'dismissed'))
);
create index idx_compliance_violations_company on compliance_violations(company_id);
create index idx_compliance_violations_person on compliance_violations(person_id);
create index idx_compliance_violations_clock_entry on compliance_violations(clock_entry_id);

create table leave_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  person_id uuid not null references people(id) on delete cascade,
  type text not null,
  start_date date not null,
  end_date date not null,
  reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied', 'cancelled')),
  reviewer_comment text,
  reviewed_by uuid references people(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_leave_requests_company on leave_requests(company_id);
create index idx_leave_requests_person on leave_requests(person_id);

create trigger set_updated_at before update on leave_requests
  for each row execute function public.set_updated_at();

-- before-insert company_id auto-fill, reused from 0002.
create trigger set_company_id before insert on locations
  for each row execute function public.set_company_id();
create trigger set_company_id before insert on teams
  for each row execute function public.set_company_id();
create trigger set_company_id before insert on activity_entries
  for each row execute function public.set_company_id();
create trigger set_company_id before insert on clock_entries
  for each row execute function public.set_company_id();
create trigger set_company_id before insert on break_entries
  for each row execute function public.set_company_id();
create trigger set_company_id before insert on compliance_violations
  for each row execute function public.set_company_id();
create trigger set_company_id before insert on leave_requests
  for each row execute function public.set_company_id();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table locations enable row level security;
alter table teams enable row level security;
alter table activity_entries enable row level security;
alter table clock_entries enable row level security;
alter table break_entries enable row level security;
alter table compliance_violations enable row level security;
alter table leave_requests enable row level security;

-- locations: whole company reads; manager/company_admin write. Matches people.
create policy "locations_select" on locations for select
  using (company_id = current_company_id() or is_super_admin());

create policy "locations_insert" on locations for insert
  with check (
    company_id = current_company_id()
    and current_app_role() in ('manager', 'company_admin')
  );

create policy "locations_update" on locations for update
  using (
    company_id = current_company_id()
    and current_app_role() in ('manager', 'company_admin')
  )
  with check (
    company_id = current_company_id()
    and current_app_role() in ('manager', 'company_admin')
  );

create policy "locations_delete" on locations for delete
  using (
    company_id = current_company_id()
    and current_app_role() in ('manager', 'company_admin')
  );

-- teams: same shape as locations.
create policy "teams_select" on teams for select
  using (company_id = current_company_id() or is_super_admin());

create policy "teams_insert" on teams for insert
  with check (
    company_id = current_company_id()
    and current_app_role() in ('manager', 'company_admin')
  );

create policy "teams_update" on teams for update
  using (
    company_id = current_company_id()
    and current_app_role() in ('manager', 'company_admin')
  )
  with check (
    company_id = current_company_id()
    and current_app_role() in ('manager', 'company_admin')
  );

create policy "teams_delete" on teams for delete
  using (
    company_id = current_company_id()
    and current_app_role() in ('manager', 'company_admin')
  );

-- activity_entries: self or manager/company_admin can read/create; only
-- manager/company_admin can update/delete.
create policy "activity_entries_select" on activity_entries for select
  using (
    person_id = current_person_id()
    or (company_id = current_company_id() and current_app_role() in ('manager', 'company_admin'))
    or is_super_admin()
  );

create policy "activity_entries_insert" on activity_entries for insert
  with check (
    company_id = current_company_id()
    and (
      person_id = current_person_id()
      or current_app_role() in ('manager', 'company_admin')
    )
  );

create policy "activity_entries_update" on activity_entries for update
  using (
    company_id = current_company_id()
    and current_app_role() in ('manager', 'company_admin')
  )
  with check (
    company_id = current_company_id()
    and current_app_role() in ('manager', 'company_admin')
  );

create policy "activity_entries_delete" on activity_entries for delete
  using (
    company_id = current_company_id()
    and current_app_role() in ('manager', 'company_admin')
  );

-- clock_entries: same shape as activity_entries.
create policy "clock_entries_select" on clock_entries for select
  using (
    person_id = current_person_id()
    or (company_id = current_company_id() and current_app_role() in ('manager', 'company_admin'))
    or is_super_admin()
  );

create policy "clock_entries_insert" on clock_entries for insert
  with check (
    company_id = current_company_id()
    and (
      person_id = current_person_id()
      or current_app_role() in ('manager', 'company_admin')
    )
  );

create policy "clock_entries_update" on clock_entries for update
  using (
    company_id = current_company_id()
    and current_app_role() in ('manager', 'company_admin')
  )
  with check (
    company_id = current_company_id()
    and current_app_role() in ('manager', 'company_admin')
  );

create policy "clock_entries_delete" on clock_entries for delete
  using (
    company_id = current_company_id()
    and current_app_role() in ('manager', 'company_admin')
  );

-- break_entries: same shape as activity_entries / clock_entries.
create policy "break_entries_select" on break_entries for select
  using (
    person_id = current_person_id()
    or (company_id = current_company_id() and current_app_role() in ('manager', 'company_admin'))
    or is_super_admin()
  );

create policy "break_entries_insert" on break_entries for insert
  with check (
    company_id = current_company_id()
    and (
      person_id = current_person_id()
      or current_app_role() in ('manager', 'company_admin')
    )
  );

create policy "break_entries_update" on break_entries for update
  using (
    company_id = current_company_id()
    and current_app_role() in ('manager', 'company_admin')
  )
  with check (
    company_id = current_company_id()
    and current_app_role() in ('manager', 'company_admin')
  );

create policy "break_entries_delete" on break_entries for delete
  using (
    company_id = current_company_id()
    and current_app_role() in ('manager', 'company_admin')
  );

-- compliance_violations: self or manager/company_admin read; any company
-- member can insert (system-generated on clock-out via app code); only
-- manager/company_admin can update (acknowledge/resolve/dismiss); no delete.
create policy "compliance_violations_select" on compliance_violations for select
  using (
    person_id = current_person_id()
    or (company_id = current_company_id() and current_app_role() in ('manager', 'company_admin'))
    or is_super_admin()
  );

create policy "compliance_violations_insert" on compliance_violations for insert
  with check (company_id = current_company_id());

create policy "compliance_violations_update" on compliance_violations for update
  using (
    company_id = current_company_id()
    and current_app_role() in ('manager', 'company_admin')
  )
  with check (
    company_id = current_company_id()
    and current_app_role() in ('manager', 'company_admin')
  );

-- leave_requests: self or manager/company_admin read; self-only insert;
-- self may update own pending row (cancel), manager/company_admin may
-- update any row in their company (approve/deny, any status).
create policy "leave_requests_select" on leave_requests for select
  using (
    person_id = current_person_id()
    or (company_id = current_company_id() and current_app_role() in ('manager', 'company_admin'))
    or is_super_admin()
  );

create policy "leave_requests_insert" on leave_requests for insert
  with check (
    company_id = current_company_id()
    and person_id = current_person_id()
  );

create policy "leave_requests_update" on leave_requests for update
  using (
    company_id = current_company_id()
    and (
      (person_id = current_person_id() and status = 'pending')
      or current_app_role() in ('manager', 'company_admin')
    )
  )
  with check (
    company_id = current_company_id()
    and (
      person_id = current_person_id()
      or current_app_role() in ('manager', 'company_admin')
    )
  );
