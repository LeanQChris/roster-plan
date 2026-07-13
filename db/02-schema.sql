-- ==========================================================
-- Roster Application — PostgreSQL Schema v2 (Full)
-- ==========================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "citext";     -- case-insensitive email

-- ==========================================================
-- ENUMS
-- ==========================================================

CREATE TYPE company_status AS ENUM ('active', 'suspended', 'deleted');
CREATE TYPE person_role AS ENUM ('company_admin', 'manager', 'employee', 'super_admin', 'viewer');
CREATE TYPE person_status AS ENUM ('active', 'inactive', 'invited', 'deleted');
CREATE TYPE team_membership_role AS ENUM ('manager', 'employee');
CREATE TYPE shift_status AS ENUM ('draft', 'published', 'cancelled');
-- MVP simplification: 'draft' is not used. Default is 'published'.
-- See docs/04-mvp-plan.md §Schema Simplifications.
CREATE TYPE assignment_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
-- MVP simplification: status is always 'approved'. Columns requested_at, approved_by are not used.
-- See docs/04-mvp-plan.md §Schema Simplifications.
CREATE TYPE time_off_type AS ENUM ('vacation', 'sick', 'personal', 'bereavement', 'other');
CREATE TYPE time_off_status AS ENUM ('pending', 'approved', 'denied', 'cancelled');
CREATE TYPE swap_status AS ENUM ('pending', 'accepted', 'rejected', 'cancelled');
CREATE TYPE notification_channel AS ENUM ('email', 'slack', 'teams', 'webhook', 'push');
-- MVP simplification: only 'email' channel is used. Other channels added post-MVP.
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'delivered', 'bounced', 'failed');

-- ==========================================================
-- COMPANIES
-- ==========================================================

CREATE TABLE companies (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(255) NOT NULL,
    slug                VARCHAR(100) NOT NULL UNIQUE,
    timezone            VARCHAR(64) NOT NULL DEFAULT 'UTC',
    locale              VARCHAR(10) NOT NULL DEFAULT 'en-US',
    status              company_status NOT NULL DEFAULT 'active',
    branding_logo_url   TEXT,
    branding_primary_color VARCHAR(7),
    hipaa_enabled       BOOLEAN NOT NULL DEFAULT false,
    data_retention_days INTEGER NOT NULL DEFAULT 365,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);

-- ==========================================================
-- COMPANY SETTINGS
-- ==========================================================

CREATE TABLE company_settings (
    company_id                      UUID PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
    overtime_threshold_hours        INTEGER NOT NULL DEFAULT 40,
    overtime_daily_threshold_hours  INTEGER NOT NULL DEFAULT 8,
    min_rest_hours                  INTEGER NOT NULL DEFAULT 8,
    meal_break_threshold_minutes    INTEGER NOT NULL DEFAULT 300,
    meal_break_duration_minutes     INTEGER NOT NULL DEFAULT 30,
    rest_break_threshold_minutes    INTEGER NOT NULL DEFAULT 240,
    reminder_lead_minutes           INTEGER NOT NULL DEFAULT 60,
    daily_digest_enabled            BOOLEAN NOT NULL DEFAULT true,
    self_scheduling_enabled         BOOLEAN NOT NULL DEFAULT false,
    gps_required                    BOOLEAN NOT NULL DEFAULT false,
    break_tracking_enabled          BOOLEAN NOT NULL DEFAULT true,
    predictive_scheduling_days      INTEGER,
    allowed_ip_ranges               INET[],
    mlts_enabled                    BOOLEAN NOT NULL DEFAULT false,
    data_residency_region           VARCHAR(20),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================================
-- LOCATIONS
-- ==========================================================

CREATE TABLE locations (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id            UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name                  VARCHAR(255) NOT NULL,
    address               TEXT,
    city                  VARCHAR(100),
    state_province        VARCHAR(100),
    country               VARCHAR(100),
    timezone              VARCHAR(64) NOT NULL,
    latitude              DECIMAL(10,7),
    longitude             DECIMAL(10,7),
    geofence_radius_meters INTEGER,
    is_active             BOOLEAN NOT NULL DEFAULT true,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at            TIMESTAMPTZ
);

-- ==========================================================
-- POSITIONS
-- ==========================================================

CREATE TABLE positions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    pay_rate    DECIMAL(10,2),
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ,
    UNIQUE (company_id, name)
);

-- ==========================================================
-- SKILLS
-- ==========================================================

CREATE TABLE skills (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (company_id, name)
);

-- ==========================================================
-- POSITION SKILLS (junction — required skills for a position)
-- ==========================================================

CREATE TABLE position_skills (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
    skill_id    UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    is_required BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (position_id, skill_id)
);

-- ==========================================================
-- TEAMS
-- ==========================================================

CREATE TABLE teams (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    name        VARCHAR(255) NOT NULL,
    manager_id  UUID,  -- FK added after people table
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

-- ==========================================================
-- PEOPLE (Users / Employees)
-- ==========================================================

CREATE TABLE people (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    team_id             UUID NOT NULL REFERENCES teams(id),
    location_id         UUID REFERENCES locations(id) ON DELETE SET NULL,
    position_id         UUID REFERENCES positions(id) ON DELETE SET NULL,
    employee_id         VARCHAR(100),
    name                VARCHAR(255) NOT NULL,
    email               CITEXT NOT NULL,
    phone               VARCHAR(30),
    password_hash       VARCHAR(255) NOT NULL,
    timezone            VARCHAR(64) NOT NULL DEFAULT 'UTC',
    role                person_role NOT NULL DEFAULT 'employee',
    status              person_status NOT NULL DEFAULT 'invited',
    mfa_enabled         BOOLEAN NOT NULL DEFAULT false,
    mfa_secret          VARCHAR(64),
    invited_at          TIMESTAMPTZ,
    invite_accepted_at  TIMESTAMPTZ,
    subscription_token  VARCHAR(128) UNIQUE,
    data_exported_at    TIMESTAMPTZ,
    invite_token        VARCHAR(255) UNIQUE,
    invited_by          UUID REFERENCES people(id) ON DELETE SET NULL,
    hourly_rate         DECIMAL(10,2),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,
    UNIQUE (company_id, email)
);

-- FK: teams.manager_id
ALTER TABLE teams ADD CONSTRAINT fk_teams_manager
    FOREIGN KEY (manager_id) REFERENCES people(id) ON DELETE SET NULL;

-- ==========================================================
-- TEAM MEMBERSHIPS (cross-assignment)
-- ==========================================================

CREATE TABLE team_memberships (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    team_id     UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    person_id   UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    role        team_membership_role NOT NULL DEFAULT 'employee',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (team_id, person_id)
);

-- ==========================================================
-- PERSON SKILLS (junction — moved after people table)
-- ==========================================================

CREATE TABLE person_skills (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    person_id   UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    skill_id    UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    acquired_at DATE,
    expires_at  DATE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (person_id, skill_id)
);

-- ==========================================================
-- SHIFT TEMPLATES
-- ==========================================================

CREATE TABLE shift_templates (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    team_id           UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    position_id       UUID REFERENCES positions(id) ON DELETE SET NULL,
    title             VARCHAR(255) NOT NULL,
    description       TEXT,
    duration_minutes  INTEGER NOT NULL,
    start_time        TIME NOT NULL,
    required_count    INTEGER NOT NULL DEFAULT 1,
    max_count         INTEGER,
    is_active         BOOLEAN NOT NULL DEFAULT true,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================================
-- TEMPLATE SKILLS (required skills for a shift template)
-- ==========================================================

CREATE TABLE template_skills (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    shift_template_id   UUID NOT NULL REFERENCES shift_templates(id) ON DELETE CASCADE,
    skill_id            UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    min_count           INTEGER NOT NULL DEFAULT 1,
    UNIQUE (shift_template_id, skill_id)
);

-- ==========================================================
-- RECURRENCE RULES (RRULE)
-- ==========================================================

CREATE TABLE recurrence_rules (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id            UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    shift_template_id    UUID NOT NULL UNIQUE REFERENCES shift_templates(id) ON DELETE CASCADE,
    rrule_string          TEXT NOT NULL,
    dtstart               TIMESTAMPTZ NOT NULL,
    dtend                 TIMESTAMPTZ,
    exdates               TIMESTAMPTZ[],
    skip_holidays         BOOLEAN NOT NULL DEFAULT false,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================================
-- SHIFTS (concrete instances)
-- ==========================================================

CREATE TABLE shifts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    team_id         UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    location_id     UUID REFERENCES locations(id) ON DELETE SET NULL,
    template_id     UUID REFERENCES shift_templates(id) ON DELETE SET NULL,
    position_id     UUID REFERENCES positions(id) ON DELETE SET NULL,
    title           VARCHAR(255) NOT NULL,
    start_at        TIMESTAMPTZ NOT NULL,
    end_at          TIMESTAMPTZ NOT NULL,
    timezone        VARCHAR(64) NOT NULL,
    required_count  INTEGER NOT NULL DEFAULT 1,
    max_count       INTEGER,
    status          shift_status NOT NULL DEFAULT 'draft',
    recurrence_id   UUID,
    is_exception    BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_shift_range CHECK (end_at > start_at)
);

-- ==========================================================
-- SHIFT SKILLS (copied from template on publish)
-- ==========================================================

CREATE TABLE shift_skills (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    shift_id  UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    skill_id  UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    min_count INTEGER NOT NULL DEFAULT 1,
    UNIQUE (shift_id, skill_id)
);

-- ==========================================================
-- SHIFT ASSIGNMENTS
-- ==========================================================

CREATE TABLE shift_assignments (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    shift_id      UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    person_id     UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    status        assignment_status NOT NULL DEFAULT 'pending',
    requested_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at   TIMESTAMPTZ,
    approved_by   UUID REFERENCES people(id) ON DELETE SET NULL,
    cancelled_at  TIMESTAMPTZ,
    confirmed_at  TIMESTAMPTZ,
    UNIQUE (shift_id, person_id)
);

-- ==========================================================
-- SHIFT SWAP REQUESTS
-- ==========================================================

CREATE TABLE shift_swap_requests (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id            UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    shift_assignment_id   UUID NOT NULL REFERENCES shift_assignments(id) ON DELETE CASCADE,
    requester_id          UUID NOT NULL REFERENCES people(id),
    target_id             UUID REFERENCES people(id),
    status                swap_status NOT NULL DEFAULT 'pending',
    manager_approved      BOOLEAN,
    manager_id            UUID REFERENCES people(id),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at           TIMESTAMPTZ
);

-- ==========================================================
-- CLOCK ENTRIES (immutable)
-- ==========================================================

CREATE TABLE clock_entries (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_assignment_id   UUID REFERENCES shift_assignments(id) ON DELETE SET NULL,
    person_id             UUID REFERENCES people(id) ON DELETE SET NULL,
    company_id            UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    location_id           UUID REFERENCES locations(id) ON DELETE SET NULL,
    clock_in_at           TIMESTAMPTZ NOT NULL,
    clock_out_at          TIMESTAMPTZ,
    break_in_at           TIMESTAMPTZ,
    break_out_at          TIMESTAMPTZ,
    break_duration_minutes INTEGER GENERATED ALWAYS AS (
                              CASE WHEN break_out_at IS NOT NULL AND break_in_at IS NOT NULL
                                   THEN EXTRACT(EPOCH FROM (break_out_at - break_in_at)) / 60
                                   ELSE NULL
                              END
                          ) STORED,
    duration_minutes      INTEGER GENERATED ALWAYS AS (
                              CASE WHEN clock_out_at IS NOT NULL
                                   THEN EXTRACT(EPOCH FROM (clock_out_at - clock_in_at)) / 60
                                   - CASE WHEN break_out_at IS NOT NULL AND break_in_at IS NOT NULL
                                          THEN EXTRACT(EPOCH FROM (break_out_at - break_in_at)) / 60
                                          ELSE 0
                                     END
                                   ELSE NULL
                              END
                          ) STORED,
    latitude              DECIMAL(10,7),
    longitude             DECIMAL(10,7),
    notes                 TEXT,
    source_ip             INET,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_clock_order CHECK (clock_out_at IS NULL OR clock_out_at > clock_in_at),
    CONSTRAINT chk_break_order CHECK (break_in_at IS NULL OR break_out_at IS NULL OR break_out_at > break_in_at)
);

-- Trigger: prevent UPDATE/DELETE on clock_entries
CREATE OR REPLACE FUNCTION reject_clock_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'clock_entries is append-only: UPDATE and DELETE are not permitted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clock_entries_no_update
    BEFORE UPDATE ON clock_entries
    FOR EACH ROW EXECUTE FUNCTION reject_clock_mutation();

CREATE TRIGGER trg_clock_entries_no_delete
    BEFORE DELETE ON clock_entries
    FOR EACH ROW EXECUTE FUNCTION reject_clock_mutation();

-- ==========================================================
-- TIME OFF REQUESTS
-- ==========================================================

CREATE TABLE time_off_requests (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    person_id     UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    type          time_off_type NOT NULL,
    start_at      TIMESTAMPTZ NOT NULL,
    end_at        TIMESTAMPTZ NOT NULL,
    is_partial_day BOOLEAN NOT NULL DEFAULT false,
    reason        TEXT,
    document_url  TEXT,
    status        time_off_status NOT NULL DEFAULT 'pending',
    reviewed_by   UUID REFERENCES people(id) ON DELETE SET NULL,
    reviewed_at   TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_timeoff_range CHECK (end_at > start_at)
);

-- ==========================================================
-- HOLIDAYS
-- ==========================================================

CREATE TABLE holidays (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name         VARCHAR(255) NOT NULL,
    date         DATE NOT NULL,
    is_recurring BOOLEAN NOT NULL DEFAULT true,
    paid         BOOLEAN NOT NULL DEFAULT true,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (company_id, date)
);

-- ==========================================================
-- NOTIFICATIONS
-- ==========================================================

CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    person_id   UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    type        VARCHAR(50) NOT NULL,
    channel     notification_channel NOT NULL DEFAULT 'email',
    subject     VARCHAR(255) NOT NULL,
    body        TEXT NOT NULL,
    status      notification_status NOT NULL DEFAULT 'pending',
    sent_at     TIMESTAMPTZ,
    read_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================================
-- NOTIFICATION PREFERENCES
-- ==========================================================

CREATE TABLE notification_preferences (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    type      VARCHAR(50) NOT NULL,
    channel   notification_channel NOT NULL,
    enabled   BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (person_id, type, channel)
);

-- ==========================================================
-- INTEGRATIONS (Slack, Teams, Google Calendar, etc.)
-- ==========================================================

CREATE TABLE integrations (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    type         VARCHAR(50) NOT NULL,
    name         VARCHAR(255) NOT NULL,
    config       JSONB NOT NULL,
    is_active    BOOLEAN NOT NULL DEFAULT true,
    last_sent_at TIMESTAMPTZ,
    last_error   TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================================
-- FEATURE FLAGS (per-company feature toggles)
-- ==========================================================

CREATE TABLE feature_flags (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    flag        VARCHAR(100) NOT NULL,
    enabled     BOOLEAN NOT NULL DEFAULT false,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (company_id, flag)
);

-- ==========================================================
-- AUDIT ENTRIES (immutable, HMAC-chained)
-- ==========================================================

CREATE TABLE audit_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    actor_id        UUID REFERENCES people(id) ON DELETE SET NULL,
    resource_type   VARCHAR(50) NOT NULL,
    resource_id     UUID NOT NULL,
    action          VARCHAR(50) NOT NULL,
    old_values      JSONB,
    new_values      JSONB,
    ip_address      INET,
    user_agent      TEXT,
    prev_hash       VARCHAR(64) NOT NULL,
    hash            VARCHAR(64) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: auto-generate HMAC-SHA256 chain on INSERT
-- Requires custom Postgres config parameter: roster.hmac_key (set via postgresql.conf / ALTER SYSTEM)
CREATE OR REPLACE FUNCTION audit_chain_hash()
RETURNS TRIGGER AS $$
DECLARE
    prev_audit audit_entries%ROWTYPE;
    raw_string TEXT;
BEGIN
    SELECT * INTO prev_audit
    FROM audit_entries
    WHERE company_id = NEW.company_id
    ORDER BY created_at DESC
    LIMIT 1;

    NEW.prev_hash := COALESCE(prev_audit.hash, '0000000000000000000000000000000000000000000000000000000000000000');
    raw_string := NEW.prev_hash
                  || NEW.resource_type || NEW.resource_id::TEXT
                  || NEW.action
                  || COALESCE(NEW.old_values::TEXT, '')
                  || COALESCE(NEW.new_values::TEXT, '')
                  || NEW.created_at::TEXT;
    NEW.hash := encode(hmac(raw_string::bytea, current_setting('roster.hmac_key')::bytea, 'sha256'), 'hex');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_entries_chain
    BEFORE INSERT ON audit_entries
    FOR EACH ROW EXECUTE FUNCTION audit_chain_hash();

CREATE OR REPLACE FUNCTION reject_audit_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'audit_entries is append-only: UPDATE and DELETE are not permitted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_entries_no_update
    BEFORE UPDATE ON audit_entries
    FOR EACH ROW EXECUTE FUNCTION reject_audit_mutation();

CREATE TRIGGER trg_audit_entries_no_delete
    BEFORE DELETE ON audit_entries
    FOR EACH ROW EXECUTE FUNCTION reject_audit_mutation();

-- ==========================================================
-- SESSIONS
-- ==========================================================

CREATE TABLE sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES companies(id),
    person_id       UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    token_hash      VARCHAR(64) NOT NULL,
    refresh_token_hash VARCHAR(64),
    ip_address      INET,
    user_agent      TEXT,
    expires_at      TIMESTAMPTZ NOT NULL,
    last_used_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at      TIMESTAMPTZ
);

CREATE INDEX idx_sessions_company ON sessions(company_id);
CREATE INDEX idx_sessions_person ON sessions(person_id);
CREATE INDEX idx_sessions_token ON sessions(token_hash);
CREATE INDEX idx_sessions_expires ON sessions(expires_at) WHERE revoked_at IS NULL;

-- ==========================================================
-- PASSWORD RESET TOKENS
-- ==========================================================

CREATE TABLE password_reset_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id  UUID NOT NULL REFERENCES companies(id),
    person_id   UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    token_hash  VARCHAR(64) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prt_company ON password_reset_tokens(company_id);
CREATE INDEX idx_prt_person ON password_reset_tokens(person_id);
CREATE INDEX idx_prt_token ON password_reset_tokens(token_hash);

-- ==========================================================
-- CONSENT RECORDS (GDPR §5)
-- ==========================================================

CREATE TABLE consent_records (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id  UUID NOT NULL REFERENCES companies(id),
    person_id   UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    type        VARCHAR(50) NOT NULL,
    granted     BOOLEAN NOT NULL DEFAULT true,
    ip_address  INET,
    granted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at  TIMESTAMPTZ
);

CREATE INDEX idx_cr_company ON consent_records(company_id);
CREATE INDEX idx_cr_person ON consent_records(person_id);

-- ==========================================================
-- REGION ROUTING (Data Residency)
-- ==========================================================

CREATE TABLE region_routing (
    company_id  UUID PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
    region      VARCHAR(20) NOT NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================================
-- COMPLIANCE VIOLATIONS
-- ==========================================================

CREATE TYPE violation_type AS ENUM (
    'missed_meal_break',
    'missed_rest_break',
    'late_clock_in',
    'early_clock_out',
    'no_clock_in',
    'overtime_exceeded',
    'min_rest_violation',
    'predictive_scheduling_violation'
);

CREATE TYPE violation_status AS ENUM ('open', 'acknowledged', 'resolved', 'dismissed');

CREATE TABLE compliance_violations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    person_id           UUID REFERENCES people(id) ON DELETE SET NULL,
    shift_assignment_id UUID REFERENCES shift_assignments(id) ON DELETE SET NULL,
    violation_type      violation_type NOT NULL,
    severity            VARCHAR(10) NOT NULL DEFAULT 'warning',
    description         TEXT NOT NULL,
    detected_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    detected_by         VARCHAR(50) NOT NULL DEFAULT 'system',
    status              violation_status NOT NULL DEFAULT 'open',
    acknowledged_at     TIMESTAMPTZ,
    acknowledged_by     UUID REFERENCES people(id) ON DELETE SET NULL,
    resolved_at         TIMESTAMPTZ,
    resolved_by         UUID REFERENCES people(id) ON DELETE SET NULL,
    notes               TEXT
);

CREATE INDEX idx_cv_company ON compliance_violations(company_id);
CREATE INDEX idx_cv_person ON compliance_violations(person_id);
CREATE INDEX idx_cv_type ON compliance_violations(violation_type);
CREATE INDEX idx_cv_status ON compliance_violations(status);
CREATE INDEX idx_cv_detected ON compliance_violations(detected_at);

-- ==========================================================
-- INDEXES
-- ==========================================================

CREATE INDEX idx_shifts_company ON shifts(company_id);
CREATE INDEX idx_shifts_team ON shifts(team_id);
CREATE INDEX idx_shifts_range ON shifts(start_at, end_at);
CREATE INDEX idx_shifts_template ON shifts(template_id);
CREATE INDEX idx_shifts_status ON shifts(status);
CREATE INDEX idx_shifts_location ON shifts(location_id);
CREATE INDEX idx_shifts_position ON shifts(position_id);

CREATE INDEX idx_sa_shift ON shift_assignments(shift_id);
CREATE INDEX idx_sa_person ON shift_assignments(person_id);
CREATE INDEX idx_sa_status ON shift_assignments(status);

CREATE INDEX idx_ce_person ON clock_entries(person_id);
CREATE INDEX idx_ce_range ON clock_entries(clock_in_at, clock_out_at);
CREATE INDEX idx_ce_active ON clock_entries((1)) WHERE clock_out_at IS NULL;

CREATE INDEX idx_tor_company ON time_off_requests(company_id);
CREATE INDEX idx_tor_person ON time_off_requests(person_id);
CREATE INDEX idx_tor_range ON time_off_requests(start_at, end_at);
CREATE INDEX idx_tor_status ON time_off_requests(status);

CREATE INDEX idx_ssr_assignment ON shift_swap_requests(shift_assignment_id);
CREATE INDEX idx_ssr_requester ON shift_swap_requests(requester_id);
CREATE INDEX idx_ssr_status ON shift_swap_requests(status);

CREATE UNIQUE INDEX idx_holidays_company_date ON holidays(company_id, date);

CREATE INDEX idx_people_company_email ON people(company_id, email);
CREATE INDEX idx_people_sub_token ON people(subscription_token) WHERE subscription_token IS NOT NULL;
CREATE INDEX idx_people_employee_id ON people(company_id, employee_id) WHERE employee_id IS NOT NULL;

CREATE INDEX idx_tm_team_person ON team_memberships(team_id, person_id);

CREATE INDEX idx_notif_person_status ON notifications(person_id, status);
CREATE INDEX idx_np_person ON notification_preferences(person_id);

CREATE INDEX idx_ae_company ON audit_entries(company_id);
CREATE INDEX idx_ae_resource ON audit_entries(resource_type, resource_id);
CREATE INDEX idx_ae_actor ON audit_entries(actor_id);
CREATE INDEX idx_ae_created ON audit_entries(created_at);

CREATE INDEX idx_int_company_type ON integrations(company_id, type);
CREATE UNIQUE INDEX idx_ff_company_flag ON feature_flags(company_id, flag);

CREATE INDEX idx_loc_company ON locations(company_id);
CREATE UNIQUE INDEX idx_pos_company_name ON positions(company_id, name);
CREATE UNIQUE INDEX idx_skill_company_name ON skills(company_id, name);
CREATE INDEX idx_ps_person ON person_skills(person_id);
CREATE INDEX idx_ps_skill ON person_skills(skill_id);
CREATE INDEX idx_pss_position ON position_skills(position_id);
CREATE INDEX idx_ts_template ON template_skills(shift_template_id);

-- ==========================================================
-- ROW-LEVEL SECURITY (RLS)
-- ==========================================================

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurrence_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE clock_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE region_routing ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_violations ENABLE ROW LEVEL SECURITY;

-- Generic tenant isolation policy template for all tables with company_id:
-- CREATE POLICY tenant_isolation ON <table> FOR ALL
--     USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY tenant_isolation ON locations FOR ALL
    USING (company_id = current_setting('app.current_company_id')::UUID);
CREATE POLICY tenant_isolation ON positions FOR ALL
    USING (company_id = current_setting('app.current_company_id')::UUID);
CREATE POLICY tenant_isolation ON skills FOR ALL
    USING (company_id = current_setting('app.current_company_id')::UUID);
CREATE POLICY tenant_isolation ON position_skills FOR ALL
    USING (company_id = current_setting('app.current_company_id')::UUID);
CREATE POLICY tenant_isolation ON teams FOR ALL
    USING (company_id = current_setting('app.current_company_id')::UUID);
CREATE POLICY tenant_isolation ON people FOR ALL
    USING (company_id = current_setting('app.current_company_id')::UUID);
CREATE POLICY tenant_isolation ON team_memberships FOR ALL
    USING (company_id = current_setting('app.current_company_id')::UUID);
CREATE POLICY tenant_isolation ON person_skills FOR ALL
    USING (company_id = current_setting('app.current_company_id')::UUID);
CREATE POLICY tenant_isolation ON shift_templates FOR ALL
    USING (company_id = current_setting('app.current_company_id')::UUID);
CREATE POLICY tenant_isolation ON template_skills FOR ALL
    USING (company_id = current_setting('app.current_company_id')::UUID);
CREATE POLICY tenant_isolation ON recurrence_rules FOR ALL
    USING (company_id = current_setting('app.current_company_id')::UUID);
CREATE POLICY tenant_isolation ON shifts FOR ALL
    USING (company_id = current_setting('app.current_company_id')::UUID);
CREATE POLICY tenant_isolation ON shift_skills FOR ALL
    USING (company_id = current_setting('app.current_company_id')::UUID);
CREATE POLICY tenant_isolation ON shift_assignments FOR ALL
    USING (company_id = current_setting('app.current_company_id')::UUID);
CREATE POLICY tenant_isolation ON shift_swap_requests FOR ALL
    USING (company_id = current_setting('app.current_company_id')::UUID);
CREATE POLICY tenant_isolation ON clock_entries FOR ALL
    USING (company_id = current_setting('app.current_company_id')::UUID);
CREATE POLICY tenant_isolation ON time_off_requests FOR ALL
    USING (company_id = current_setting('app.current_company_id')::UUID);
CREATE POLICY tenant_isolation ON holidays FOR ALL
    USING (company_id = current_setting('app.current_company_id')::UUID);
CREATE POLICY tenant_isolation ON notifications FOR ALL
    USING (company_id = current_setting('app.current_company_id')::UUID);
CREATE POLICY tenant_isolation ON notification_preferences FOR ALL
    USING (company_id = current_setting('app.current_company_id')::UUID);
CREATE POLICY tenant_isolation ON integrations FOR ALL
    USING (company_id = current_setting('app.current_company_id')::UUID);
CREATE POLICY tenant_isolation ON feature_flags FOR ALL
    USING (company_id = current_setting('app.current_company_id')::UUID);
CREATE POLICY tenant_isolation ON company_settings FOR ALL
    USING (company_id = current_setting('app.current_company_id')::UUID);
CREATE POLICY tenant_isolation ON consent_records FOR ALL
    USING (company_id = current_setting('app.current_company_id')::UUID);
CREATE POLICY tenant_isolation ON password_reset_tokens FOR ALL
    USING (company_id = current_setting('app.current_company_id')::UUID);
CREATE POLICY tenant_isolation ON region_routing FOR ALL
    USING (company_id = current_setting('app.current_company_id')::UUID);
CREATE POLICY tenant_isolation ON sessions FOR ALL
    USING (company_id = current_setting('app.current_company_id')::UUID);
CREATE POLICY tenant_isolation ON audit_entries FOR ALL
    USING (company_id = current_setting('app.current_company_id')::UUID);
CREATE POLICY tenant_isolation ON compliance_violations FOR ALL
    USING (company_id = current_setting('app.current_company_id')::UUID);