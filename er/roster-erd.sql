CREATE TABLE companies (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  timezone VARCHAR(64) NOT NULL,
  locale VARCHAR(10) NOT NULL,
  status VARCHAR(20) NOT NULL,
  branding_logo_url TEXT,
  branding_primary_color VARCHAR(7),
  hipaa_enabled BOOLEAN NOT NULL,
  data_retention_days INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP
)

CREATE TABLE company_settings (
  company_id UUID PRIMARY KEY,
  overtime_threshold_hours INTEGER NOT NULL,
  overtime_daily_threshold_hours INTEGER NOT NULL,
  min_rest_hours INTEGER NOT NULL,
  meal_break_threshold_minutes INTEGER NOT NULL,
  meal_break_duration_minutes INTEGER NOT NULL,
  rest_break_threshold_minutes INTEGER NOT NULL,
  reminder_lead_minutes INTEGER NOT NULL,
  daily_digest_enabled BOOLEAN NOT NULL,
  self_scheduling_enabled BOOLEAN NOT NULL,
  gps_required BOOLEAN NOT NULL,
  break_tracking_enabled BOOLEAN NOT NULL,
  predictive_scheduling_days INTEGER,
  allowed_ip_ranges TEXT,
  mlts_enabled BOOLEAN NOT NULL,
  data_residency_region VARCHAR(20),
  updated_at TIMESTAMP NOT NULL
)

CREATE TABLE locations (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  state_province VARCHAR(100),
  country VARCHAR(100),
  timezone VARCHAR(64) NOT NULL,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  geofence_radius_meters INTEGER,
  is_active BOOLEAN NOT NULL,
  created_at TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP
)

CREATE TABLE positions (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  pay_rate DECIMAL(10,2),
  is_active BOOLEAN NOT NULL,
  created_at TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP
)

CREATE TABLE skills (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL,
  created_at TIMESTAMP NOT NULL
)

CREATE TABLE position_skills (
  id UUID PRIMARY KEY,
  position_id UUID NOT NULL,
  skill_id UUID NOT NULL,
  is_required BOOLEAN NOT NULL
)

CREATE TABLE teams (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  location_id UUID,
  name VARCHAR(255) NOT NULL,
  manager_id UUID,
  created_at TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP
)

CREATE TABLE people (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  team_id UUID NOT NULL,
  location_id UUID,
  position_id UUID,
  employee_id VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  password_hash VARCHAR(255) NOT NULL,
  timezone VARCHAR(64) NOT NULL,
  role VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  mfa_enabled BOOLEAN NOT NULL,
  mfa_secret VARCHAR(64),
  invited_at TIMESTAMP,
  invite_accepted_at TIMESTAMP,
  subscription_token VARCHAR(128),
  data_exported_at TIMESTAMP,
  invite_token VARCHAR(255),
  invited_by UUID,
  hourly_rate DECIMAL(10,2),
  created_at TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP
)

CREATE TABLE team_memberships (
  id UUID PRIMARY KEY,
  team_id UUID NOT NULL,
  person_id UUID NOT NULL,
  role VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL
)

CREATE TABLE person_skills (
  id UUID PRIMARY KEY,
  person_id UUID NOT NULL,
  skill_id UUID NOT NULL,
  acquired_at DATE,
  expires_at DATE,
  created_at TIMESTAMP NOT NULL
)

CREATE TABLE shift_templates (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  team_id UUID NOT NULL,
  position_id UUID,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  start_time TIME NOT NULL,
  required_count INTEGER NOT NULL,
  max_count INTEGER,
  is_active BOOLEAN NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
)

CREATE TABLE template_skills (
  id UUID PRIMARY KEY,
  shift_template_id UUID NOT NULL,
  skill_id UUID NOT NULL,
  min_count INTEGER NOT NULL
)

CREATE TABLE recurrence_rules (
  id UUID PRIMARY KEY,
  shift_template_id UUID NOT NULL,
  rrule_string TEXT NOT NULL,
  dtstart TIMESTAMP NOT NULL,
  dtend TIMESTAMP,
  exdates TEXT,
  skip_holidays BOOLEAN NOT NULL,
  created_at TIMESTAMP NOT NULL
)

CREATE TABLE shifts (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  team_id UUID NOT NULL,
  location_id UUID,
  template_id UUID,
  position_id UUID,
  title VARCHAR(255) NOT NULL,
  start_at TIMESTAMP NOT NULL,
  end_at TIMESTAMP NOT NULL,
  timezone VARCHAR(64) NOT NULL,
  required_count INTEGER NOT NULL,
  max_count INTEGER,
  status VARCHAR(20) NOT NULL,
  recurrence_id UUID,
  is_exception BOOLEAN NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
)

CREATE TABLE shift_skills (
  id UUID PRIMARY KEY,
  shift_id UUID NOT NULL,
  skill_id UUID NOT NULL,
  min_count INTEGER NOT NULL
)

CREATE TABLE shift_assignments (
  id UUID PRIMARY KEY,
  shift_id UUID NOT NULL,
  person_id UUID NOT NULL,
  status VARCHAR(20) NOT NULL,
  requested_at TIMESTAMP NOT NULL,
  approved_at TIMESTAMP,
  approved_by UUID,
  cancelled_at TIMESTAMP,
  confirmed_at TIMESTAMP
)

CREATE TABLE shift_swap_requests (
  id UUID PRIMARY KEY,
  shift_assignment_id UUID NOT NULL,
  requester_id UUID NOT NULL,
  target_id UUID,
  status VARCHAR(20) NOT NULL,
  manager_approved BOOLEAN,
  manager_id UUID,
  created_at TIMESTAMP NOT NULL,
  resolved_at TIMESTAMP
)

CREATE TABLE clock_entries (
  id UUID PRIMARY KEY,
  shift_assignment_id UUID,
  person_id UUID,
  company_id UUID NOT NULL,
  location_id UUID,
  clock_in_at TIMESTAMP NOT NULL,
  clock_out_at TIMESTAMP,
  break_in_at TIMESTAMP,
  break_out_at TIMESTAMP,
  break_duration_minutes INTEGER,
  duration_minutes INTEGER,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  notes TEXT,
  source_ip VARCHAR(45),
  created_at TIMESTAMP NOT NULL
)

CREATE TABLE time_off_requests (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  person_id UUID NOT NULL,
  type VARCHAR(20) NOT NULL,
  start_at TIMESTAMP NOT NULL,
  end_at TIMESTAMP NOT NULL,
  is_partial_day BOOLEAN NOT NULL,
  reason TEXT,
  document_url TEXT,
  status VARCHAR(20) NOT NULL,
  reviewed_by UUID,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
)

CREATE TABLE holidays (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  is_recurring BOOLEAN NOT NULL,
  paid BOOLEAN NOT NULL,
  created_at TIMESTAMP NOT NULL
)

CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  person_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  channel VARCHAR(20) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(20) NOT NULL,
  sent_at TIMESTAMP,
  read_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL
)

CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY,
  person_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  channel VARCHAR(20) NOT NULL,
  enabled BOOLEAN NOT NULL
)

CREATE TABLE integrations (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  config TEXT NOT NULL,
  is_active BOOLEAN NOT NULL,
  last_sent_at TIMESTAMP,
  last_error TEXT,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
)

CREATE TABLE feature_flags (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  flag VARCHAR(100) NOT NULL,
  enabled BOOLEAN NOT NULL,
  updated_at TIMESTAMP NOT NULL
)

CREATE TABLE audit_entries (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  actor_id UUID,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  old_values TEXT,
  new_values TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  prev_hash VARCHAR(64) NOT NULL,
  hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL
)

CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  person_id UUID NOT NULL,
  token_hash VARCHAR(64) NOT NULL,
  refresh_token_hash VARCHAR(64),
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP
)

CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  person_id UUID NOT NULL,
  token_hash VARCHAR(64) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL
)

CREATE TABLE consent_records (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  person_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  granted BOOLEAN NOT NULL,
  ip_address VARCHAR(45),
  granted_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP
)

CREATE TABLE region_routing (
  company_id UUID PRIMARY KEY,
  region VARCHAR(20) NOT NULL,
  assigned_at TIMESTAMP NOT NULL
)

CREATE TABLE compliance_violations (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  person_id UUID,
  shift_assignment_id UUID,
  violation_type VARCHAR(50) NOT NULL,
  severity VARCHAR(10) NOT NULL,
  description TEXT NOT NULL,
  detected_at TIMESTAMP NOT NULL,
  detected_by VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  acknowledged_at TIMESTAMP,
  acknowledged_by UUID,
  resolved_at TIMESTAMP,
  resolved_by UUID,
  notes TEXT
)
ALTER TABLE company_settings ADD FOREIGN KEY (company_id) REFERENCES companies (id)
ALTER TABLE locations ADD FOREIGN KEY (company_id) REFERENCES companies (id)
ALTER TABLE positions ADD FOREIGN KEY (company_id) REFERENCES companies (id)
ALTER TABLE skills ADD FOREIGN KEY (company_id) REFERENCES companies (id)
ALTER TABLE position_skills ADD FOREIGN KEY (position_id) REFERENCES positions (id)
ALTER TABLE position_skills ADD FOREIGN KEY (skill_id) REFERENCES skills (id)
ALTER TABLE teams ADD FOREIGN KEY (company_id) REFERENCES companies (id)
ALTER TABLE teams ADD FOREIGN KEY (location_id) REFERENCES locations (id)
ALTER TABLE teams ADD FOREIGN KEY (manager_id) REFERENCES people (id)
ALTER TABLE people ADD FOREIGN KEY (company_id) REFERENCES companies (id)
ALTER TABLE people ADD FOREIGN KEY (team_id) REFERENCES teams (id)
ALTER TABLE people ADD FOREIGN KEY (location_id) REFERENCES locations (id)
ALTER TABLE people ADD FOREIGN KEY (position_id) REFERENCES positions (id)
ALTER TABLE people ADD FOREIGN KEY (invited_by) REFERENCES people (id)
ALTER TABLE team_memberships ADD FOREIGN KEY (team_id) REFERENCES teams (id)
ALTER TABLE team_memberships ADD FOREIGN KEY (person_id) REFERENCES people (id)
ALTER TABLE person_skills ADD FOREIGN KEY (person_id) REFERENCES people (id)
ALTER TABLE person_skills ADD FOREIGN KEY (skill_id) REFERENCES skills (id)
ALTER TABLE shift_templates ADD FOREIGN KEY (company_id) REFERENCES companies (id)
ALTER TABLE shift_templates ADD FOREIGN KEY (team_id) REFERENCES teams (id)
ALTER TABLE shift_templates ADD FOREIGN KEY (position_id) REFERENCES positions (id)
ALTER TABLE template_skills ADD FOREIGN KEY (shift_template_id) REFERENCES shift_templates (id)
ALTER TABLE template_skills ADD FOREIGN KEY (skill_id) REFERENCES skills (id)
ALTER TABLE recurrence_rules ADD FOREIGN KEY (shift_template_id) REFERENCES shift_templates (id)
ALTER TABLE shifts ADD FOREIGN KEY (company_id) REFERENCES companies (id)
ALTER TABLE shifts ADD FOREIGN KEY (team_id) REFERENCES teams (id)
ALTER TABLE shifts ADD FOREIGN KEY (location_id) REFERENCES locations (id)
ALTER TABLE shifts ADD FOREIGN KEY (template_id) REFERENCES shift_templates (id)
ALTER TABLE shifts ADD FOREIGN KEY (position_id) REFERENCES positions (id)
ALTER TABLE shift_skills ADD FOREIGN KEY (shift_id) REFERENCES shifts (id)
ALTER TABLE shift_skills ADD FOREIGN KEY (skill_id) REFERENCES skills (id)
ALTER TABLE shift_assignments ADD FOREIGN KEY (shift_id) REFERENCES shifts (id)
ALTER TABLE shift_assignments ADD FOREIGN KEY (person_id) REFERENCES people (id)
ALTER TABLE shift_assignments ADD FOREIGN KEY (approved_by) REFERENCES people (id)
ALTER TABLE shift_swap_requests ADD FOREIGN KEY (shift_assignment_id) REFERENCES shift_assignments (id)
ALTER TABLE shift_swap_requests ADD FOREIGN KEY (requester_id) REFERENCES people (id)
ALTER TABLE shift_swap_requests ADD FOREIGN KEY (target_id) REFERENCES people (id)
ALTER TABLE shift_swap_requests ADD FOREIGN KEY (manager_id) REFERENCES people (id)
ALTER TABLE clock_entries ADD FOREIGN KEY (shift_assignment_id) REFERENCES shift_assignments (id)
ALTER TABLE clock_entries ADD FOREIGN KEY (person_id) REFERENCES people (id)
ALTER TABLE clock_entries ADD FOREIGN KEY (company_id) REFERENCES companies (id)
ALTER TABLE clock_entries ADD FOREIGN KEY (location_id) REFERENCES locations (id)
ALTER TABLE time_off_requests ADD FOREIGN KEY (company_id) REFERENCES companies (id)
ALTER TABLE time_off_requests ADD FOREIGN KEY (person_id) REFERENCES people (id)
ALTER TABLE time_off_requests ADD FOREIGN KEY (reviewed_by) REFERENCES people (id)
ALTER TABLE holidays ADD FOREIGN KEY (company_id) REFERENCES companies (id)
ALTER TABLE notifications ADD FOREIGN KEY (company_id) REFERENCES companies (id)
ALTER TABLE notifications ADD FOREIGN KEY (person_id) REFERENCES people (id)
ALTER TABLE notification_preferences ADD FOREIGN KEY (person_id) REFERENCES people (id)
ALTER TABLE integrations ADD FOREIGN KEY (company_id) REFERENCES companies (id)
ALTER TABLE feature_flags ADD FOREIGN KEY (company_id) REFERENCES companies (id)
ALTER TABLE audit_entries ADD FOREIGN KEY (company_id) REFERENCES companies (id)
ALTER TABLE audit_entries ADD FOREIGN KEY (actor_id) REFERENCES people (id)
ALTER TABLE sessions ADD FOREIGN KEY (company_id) REFERENCES companies (id)
ALTER TABLE sessions ADD FOREIGN KEY (person_id) REFERENCES people (id)
ALTER TABLE password_reset_tokens ADD FOREIGN KEY (company_id) REFERENCES companies (id)
ALTER TABLE password_reset_tokens ADD FOREIGN KEY (person_id) REFERENCES people (id)
ALTER TABLE consent_records ADD FOREIGN KEY (company_id) REFERENCES companies (id)
ALTER TABLE consent_records ADD FOREIGN KEY (person_id) REFERENCES people (id)
ALTER TABLE region_routing ADD FOREIGN KEY (company_id) REFERENCES companies (id)
ALTER TABLE compliance_violations ADD FOREIGN KEY (company_id) REFERENCES companies (id)
ALTER TABLE compliance_violations ADD FOREIGN KEY (person_id) REFERENCES people (id)
ALTER TABLE compliance_violations ADD FOREIGN KEY (shift_assignment_id) REFERENCES shift_assignments (id)
ALTER TABLE compliance_violations ADD FOREIGN KEY (acknowledged_by) REFERENCES people (id)
ALTER TABLE compliance_violations ADD FOREIGN KEY (resolved_by) REFERENCES people (id)