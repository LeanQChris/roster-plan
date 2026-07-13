# Data Model

## 1. Entity Relationship Overview

```
Company 1──N Location
Company 1──N Team
Company 1──N Person
Company 1──N Position
Company 1──N Skill
Company 1──N Holiday
Company 1──N FeatureFlag
Company 1──N Integration
Company 1──N AuditEntry
Company 1──1 CompanySettings
Company 1──1 RegionRouting

Location 1──N Team
Location 1──N Person (work site)

Team 1──N Person (members)
Team N──N Person (cross-assignments via TeamMembership)
Team 1──N ShiftTemplate
Team 1──N Shift

Position 1──N Person (held by)
Position 1──N ShiftTemplate (required for)
Position N──N Skill (required skills)

Skill N──N Person (via PersonSkill)
Skill N──N Position (via PositionSkill)

Person 1──N ShiftAssignment
Person 1──N ClockEntry
Person 1──N TimeOffRequest
Person 1──N Notification
Person 1──N Session
Person 1──N PasswordResetToken
Person 1──N ConsentRecord
Person 1──N ComplianceViolation
Person 1──1 SubscriptionToken (optional)
Person N──M Skill (via PersonSkill)

ShiftTemplate 1──N Shift (generated instances)
ShiftTemplate 1──0..1 RecurrenceRule
ShiftTemplate N──N Skill (required skills via TemplateSkill)

Shift 1──N ShiftAssignment
Shift 1──N ShiftSwapRequest
Shift N──N Skill (copied from template at publish)

ShiftAssignment 1──0..1 ClockEntry (active)
ShiftAssignment 1──0..1 TimeOffRequest (if covered by time-off break)
ShiftAssignment 1──0..N ComplianceViolation

ShiftSwapRequest 1──1 Shift
ShiftSwapRequest 1──1 Person (requester)
ShiftSwapRequest 1──1 Person (target, nullable for open swap)

TimeOffRequest 1──1 Person
TimeOffRequest 1──0..1 Approver (manager)

AuditEntry ──> polymorphic: resource_type + resource_id
```

---

## 2. Entity Definitions

### 2.1 companies
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK, default gen_random_uuid() | |
| name | VARCHAR(255) | NOT NULL | |
| slug | VARCHAR(100) | UNIQUE, NOT NULL | URL-safe tenant ID |
| timezone | VARCHAR(64) | NOT NULL DEFAULT 'UTC' | Company default timezone |
| locale | VARCHAR(10) | NOT NULL DEFAULT 'en-US' | |
| status | ENUM('active','suspended','deleted') | NOT NULL DEFAULT 'active' | |
| branding_logo_url | TEXT | nullable | |
| branding_primary_color | VARCHAR(7) | nullable | Hex, e.g. #3344aa |
| hipaa_enabled | BOOLEAN | NOT NULL DEFAULT false | Toggle HIPAA compliance mode |
| data_retention_days | INTEGER | NOT NULL DEFAULT 365 | |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| deleted_at | TIMESTAMPTZ | nullable | Soft-delete timestamp |

### 2.2 company_settings
| Column | Type | Constraints | Notes |
|---|---|---|---|
| company_id | UUID | PK, FK → companies.id | |
| overtime_threshold_hours | INTEGER | NOT NULL DEFAULT 40 | Per week |
| overtime_daily_threshold_hours | INTEGER | NOT NULL DEFAULT 8 | Per day |
| min_rest_hours | INTEGER | NOT NULL DEFAULT 8 | Between shifts |
| meal_break_threshold_minutes | INTEGER | NOT NULL DEFAULT 300 | Shifts >= this trigger meal break req |
| meal_break_duration_minutes | INTEGER | NOT NULL DEFAULT 30 | Required break length |
| rest_break_threshold_minutes | INTEGER | NOT NULL DEFAULT 240 | Shifts >= this trigger rest break req |
| reminder_lead_minutes | INTEGER | NOT NULL DEFAULT 60 | |
| daily_digest_enabled | BOOLEAN | NOT NULL DEFAULT true | |
| self_scheduling_enabled | BOOLEAN | NOT NULL DEFAULT false | Feature flag |
| gps_required | BOOLEAN | NOT NULL DEFAULT false | Require GPS on clock-in |
| break_tracking_enabled | BOOLEAN | NOT NULL DEFAULT true | Track meal/rest breaks |
| predictive_scheduling_days | INTEGER | nullable | Schedule must be posted N days ahead |
| allowed_ip_ranges | INET[] | nullable | IP whitelist |
| mlts_enabled | BOOLEAN | NOT NULL DEFAULT false | Multi-tenant location (HIPAA) |
| data_residency_region | VARCHAR(20) | nullable | e.g. eu-west-1 |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

### 2.3 locations
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| company_id | UUID | FK → companies.id, NOT NULL | |
| name | VARCHAR(255) | NOT NULL | e.g. "Downtown Clinic" |
| address | TEXT | nullable | Street address |
| city | VARCHAR(100) | nullable | |
| state_province | VARCHAR(100) | nullable | For labor law jurisdiction |
| country | VARCHAR(100) | nullable | |
| timezone | VARCHAR(64) | NOT NULL | IANA tz |
| latitude | DECIMAL(10,7) | nullable | For GPS geofencing |
| longitude | DECIMAL(10,7) | nullable | |
| geofence_radius_meters | INTEGER | nullable | GPS clock-in radius |
| is_active | BOOLEAN | NOT NULL DEFAULT true | |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| deleted_at | TIMESTAMPTZ | nullable | |

### 2.4 positions
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| company_id | UUID | FK → companies.id, NOT NULL | |
| name | VARCHAR(255) | NOT NULL | e.g. "Registered Nurse", "Cashier" |
| description | TEXT | nullable | |
| pay_rate | DECIMAL(10,2) | nullable | Hourly rate (for cost reporting) |
| is_active | BOOLEAN | NOT NULL DEFAULT true | |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| deleted_at | TIMESTAMPTZ | nullable | |
| UNIQUE (company_id, name) | | | |

### 2.5 skills
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| company_id | UUID | FK → companies.id, NOT NULL | |
| name | VARCHAR(255) | NOT NULL | e.g. "CPR Certified", "Forklift" |
| description | TEXT | nullable | |
| is_active | BOOLEAN | NOT NULL DEFAULT true | |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| UNIQUE (company_id, name) | | | |

### 2.6 position_skills (junction — required skills for a position)
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| company_id | UUID | FK → companies.id, NOT NULL | For RLS tenant isolation |
| position_id | UUID | FK → positions.id, NOT NULL | |
| skill_id | UUID | FK → skills.id, NOT NULL | |
| is_required | BOOLEAN | NOT NULL DEFAULT true | |
| UNIQUE (position_id, skill_id) | | | |

### 2.7 teams
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| company_id | UUID | FK → companies.id, NOT NULL | |
| location_id | UUID | FK → locations.id, nullable | Physical site |
| name | VARCHAR(255) | NOT NULL | |
| manager_id | UUID | FK → people.id, nullable | |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| deleted_at | TIMESTAMPTZ | nullable | |

### 2.8 people
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| company_id | UUID | FK → companies.id, NOT NULL | |
| team_id | UUID | FK → teams.id, NOT NULL | Primary team |
| location_id | UUID | FK → locations.id, nullable | Primary work site |
| position_id | UUID | FK → positions.id, nullable | Job title/role |
| employee_id | VARCHAR(100) | nullable | External HRIS ID |
| name | VARCHAR(255) | NOT NULL | |
| email | CITEXT | NOT NULL, UNIQUE (company_id, email) | |
| phone | VARCHAR(30) | nullable | For SMS notifications |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt hash |
| timezone | VARCHAR(64) | NOT NULL DEFAULT 'UTC' | IANA tz |
| role | ENUM('company_admin','manager','employee','super_admin','viewer') | NOT NULL DEFAULT 'employee' | |
| status | ENUM('active','inactive','invited','deleted') | NOT NULL DEFAULT 'invited' | |
| mfa_enabled | BOOLEAN | NOT NULL DEFAULT false | |
| mfa_secret | VARCHAR(64) | nullable | TOTP secret |
| invited_at | TIMESTAMPTZ | nullable | |
| invite_accepted_at | TIMESTAMPTZ | nullable | |
| subscription_token | VARCHAR(128) | nullable, UNIQUE | Webcal secret (MVP: not used) |
| data_exported_at | TIMESTAMPTZ | nullable | Last GDPR export (MVP: not used) |
| invite_token | VARCHAR(255) | nullable, UNIQUE | Invite link token |
| invited_by | UUID | FK → people.id, nullable | Who invited this person |
| hourly_rate | DECIMAL(10,2) | nullable | Per-person pay rate |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| deleted_at | TIMESTAMPTZ | nullable | GDPR erasure |

### 2.9 team_memberships (cross-assignment)
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| company_id | UUID | FK → companies.id, NOT NULL | For RLS tenant isolation |
| team_id | UUID | FK → teams.id, NOT NULL | |
| person_id | UUID | FK → people.id, NOT NULL | |
| role | ENUM('manager','employee') | NOT NULL DEFAULT 'employee' | Role within this team |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| UNIQUE (team_id, person_id) | | | |

### 2.10 person_skills (junction)
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK, default gen_random_uuid() | |
| company_id | UUID | FK → companies.id, NOT NULL | For RLS tenant isolation |
| person_id | UUID | FK → people.id, NOT NULL | |
| skill_id | UUID | FK → skills.id, NOT NULL | |
| acquired_at | DATE | nullable | When certification obtained |
| expires_at | DATE | nullable | Certification expiry |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| UNIQUE (person_id, skill_id) | | | |

### 2.11 shift_templates
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| company_id | UUID | FK → companies.id, NOT NULL | |
| team_id | UUID | FK → teams.id, NOT NULL | |
| position_id | UUID | FK → positions.id, nullable | Required position |
| title | VARCHAR(255) | NOT NULL | |
| description | TEXT | nullable | |
| duration_minutes | INTEGER | NOT NULL | Shift duration |
| start_time | TIME WITHOUT TIME ZONE | NOT NULL | Wall-clock start |
| required_count | INTEGER | NOT NULL DEFAULT 1 | Min staff needed |
| max_count | INTEGER | nullable | Max staff allowed |
| is_active | BOOLEAN | NOT NULL DEFAULT true | |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

### 2.12 template_skills (required skills for a shift template)
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| company_id | UUID | FK → companies.id, NOT NULL | For RLS tenant isolation |
| shift_template_id | UUID | FK → shift_templates.id, NOT NULL | |
| skill_id | UUID | FK → skills.id, NOT NULL | |
| min_count | INTEGER | NOT NULL DEFAULT 1 | How many assigned people need this |
| UNIQUE (shift_template_id, skill_id) | | | |

### 2.13 recurrence_rules
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| company_id | UUID | FK → companies.id, NOT NULL | For RLS tenant isolation |
| shift_template_id | UUID | FK → shift_templates.id, NOT NULL, UNIQUE | |
| rrule_string | TEXT | NOT NULL | RFC 5545 RRULE |
| dtstart | TIMESTAMPTZ | NOT NULL | Series start |
| dtend | TIMESTAMPTZ | nullable | Series end (null = indefinite) |
| exdates | TIMESTAMPTZ[] | nullable | Exception dates (cancelled) |
| skip_holidays | BOOLEAN | NOT NULL DEFAULT false | Auto-skip company holidays |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

### 2.14 shifts (Concrete instances — expanded on publish)
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| company_id | UUID | FK → companies.id, NOT NULL | |
| team_id | UUID | FK → teams.id, NOT NULL | |
| location_id | UUID | FK → locations.id, nullable | Copied from team at creation |
| template_id | UUID | FK → shift_templates.id, nullable | Null for ad-hoc shifts |
| position_id | UUID | FK → positions.id, nullable | Copied from template |
| title | VARCHAR(255) | NOT NULL | |
| start_at | TIMESTAMPTZ | NOT NULL | UTC |
| end_at | TIMESTAMPTZ | NOT NULL | UTC |
| timezone | VARCHAR(64) | NOT NULL | IANA tz of the shift |
| required_count | INTEGER | NOT NULL DEFAULT 1 | |
| max_count | INTEGER | nullable | |
| status | ENUM('draft','published','cancelled') | NOT NULL DEFAULT 'draft' | MVP: 'published' only; no draft workflow |
| recurrence_id | UUID | nullable | Links to original occurrence |
| is_exception | BOOLEAN | NOT NULL DEFAULT false | True if modified occurrence |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| CONSTRAINT chk_shift_range CHECK (end_at > start_at) | | | |

### 2.15 shift_skills (skills required for this specific shift — copied from template on publish)
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| company_id | UUID | FK → companies.id, NOT NULL | For RLS tenant isolation |
| shift_id | UUID | FK → shifts.id, NOT NULL | |
| skill_id | UUID | FK → skills.id, NOT NULL | |
| min_count | INTEGER | NOT NULL DEFAULT 1 | |
| UNIQUE (shift_id, skill_id) | | | |

### 2.16 shift_assignments
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| company_id | UUID | FK → companies.id, NOT NULL | For RLS tenant isolation |
| shift_id | UUID | FK → shifts.id, NOT NULL | |
| person_id | UUID | FK → people.id, NOT NULL | |
| status | ENUM('pending','approved','rejected','cancelled') | NOT NULL DEFAULT 'pending' | MVP: always 'approved'; no pending/approval flow |
| requested_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| approved_at | TIMESTAMPTZ | nullable | |
| approved_by | UUID | FK → people.id, nullable | Manager who approved |
| cancelled_at | TIMESTAMPTZ | nullable | |
| confirmed_at | TIMESTAMPTZ | nullable | When employee acknowledged shift |
| UNIQUE (shift_id, person_id) | | | Prevents double-assignment |

### 2.17 shift_swap_requests
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| company_id | UUID | FK → companies.id, NOT NULL | For RLS tenant isolation |
| shift_assignment_id | UUID | FK → shift_assignments.id, NOT NULL | |
| requester_id | UUID | FK → people.id, NOT NULL | Person who wants to swap out |
| target_id | UUID | FK → people.id, nullable | Specific person to swap with (null = open swap) |
| status | ENUM('pending','accepted','rejected','cancelled') | NOT NULL DEFAULT 'pending' | |
| manager_approved | BOOLEAN | nullable | Null = pending, true = approved, false = denied |
| manager_id | UUID | FK → people.id, nullable | Manager who acted |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| resolved_at | TIMESTAMPTZ | nullable | |

### 2.18 clock_entries (Immutable, append-only)
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| shift_assignment_id | UUID | FK → shift_assignments.id, ON DELETE SET NULL | Null if assignment deleted (records preserved) |
| person_id | UUID | FK → people.id, ON DELETE SET NULL | Null on GDPR erasure (records preserved) |
| company_id | UUID | FK → companies.id, NOT NULL | Denormalized for RLS |
| location_id | UUID | FK → locations.id, nullable | Where they clocked in |
| clock_in_at | TIMESTAMPTZ | NOT NULL | |
| clock_out_at | TIMESTAMPTZ | nullable | Null if still clocked in |
| break_in_at | TIMESTAMPTZ | nullable | Meal break start |
| break_out_at | TIMESTAMPTZ | nullable | Meal break end |
| break_duration_minutes | INTEGER | GENERATED | `break_out_at - break_in_at` |
| duration_minutes | INTEGER | GENERATED | `clock_out_at - clock_in_at - breaks` |
| latitude | DECIMAL(10,7) | nullable | GPS clock-in lat |
| longitude | DECIMAL(10,7) | nullable | GPS clock-in lon |
| notes | TEXT | nullable | |
| source_ip | INET | nullable | Security audit |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

No UPDATE/DELETE allowed — enforced by database trigger.

### 2.19 time_off_requests
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| company_id | UUID | FK → companies.id, NOT NULL | |
| person_id | UUID | FK → people.id, NOT NULL | |
| type | ENUM('vacation','sick','personal','bereavement','other') | NOT NULL | |
| start_at | TIMESTAMPTZ | NOT NULL | |
| end_at | TIMESTAMPTZ | NOT NULL | |
| is_partial_day | BOOLEAN | NOT NULL DEFAULT false | Partial vs full day |
| reason | TEXT | nullable | |
| document_url | TEXT | nullable | Sick note / doctor certificate attachment |
| status | ENUM('pending','approved','denied','cancelled') | NOT NULL DEFAULT 'pending' | |
| reviewed_by | UUID | FK → people.id, nullable | Manager who reviewed |
| reviewed_at | TIMESTAMPTZ | nullable | |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| CONSTRAINT chk_timeoff_range CHECK (end_at > start_at) | | | |

### 2.20 holidays
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| company_id | UUID | FK → companies.id, NOT NULL | |
| name | VARCHAR(255) | NOT NULL | e.g. "Christmas Day" |
| date | DATE | NOT NULL | |
| is_recurring | BOOLEAN | NOT NULL DEFAULT true | Annual recurrence |
| paid | BOOLEAN | NOT NULL DEFAULT true | Paid holiday |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| UNIQUE (company_id, date) | | | |

### 2.21 notifications
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| company_id | UUID | FK → companies.id, NOT NULL | |
| person_id | UUID | FK → people.id, NOT NULL | Recipient |
| type | VARCHAR(50) | NOT NULL | e.g. shift_assigned, shift_reminder, timeoff_approved |
| channel | ENUM('email','slack','teams','webhook','push') | NOT NULL DEFAULT 'email' | |
| subject | VARCHAR(255) | NOT NULL | |
| body | TEXT | NOT NULL | |
| status | ENUM('pending','sent','delivered','bounced','failed') | NOT NULL DEFAULT 'pending' | |
| sent_at | TIMESTAMPTZ | nullable | |
| read_at | TIMESTAMPTZ | nullable | In-app read status |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

### 2.22 integrations
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| company_id | UUID | FK → companies.id, NOT NULL | |
| type | VARCHAR(50) | NOT NULL | e.g. slack, teams, google_calendar |
| name | VARCHAR(255) | NOT NULL | User-facing label |
| config | JSONB | NOT NULL | Webhook URL, tokens, channel IDs |
| is_active | BOOLEAN | NOT NULL DEFAULT true | |
| last_sent_at | TIMESTAMPTZ | nullable | |
| last_error | TEXT | nullable | |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

### 2.23 feature_flags
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| company_id | UUID | FK → companies.id, NOT NULL | |
| flag | VARCHAR(100) | NOT NULL | e.g. self_scheduling, clock_gps, breaks |
| enabled | BOOLEAN | NOT NULL DEFAULT false | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| UNIQUE (company_id, flag) | | | |

### 2.24 notification_preferences
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| company_id | UUID | FK → companies.id, NOT NULL | For RLS tenant isolation |
| person_id | UUID | FK → people.id, NOT NULL | |
| type | VARCHAR(50) | NOT NULL | e.g. shift_assigned, shift_reminder, timeoff_status |
| channel | ENUM('email','slack','teams','webhook','push') | NOT NULL | |
| enabled | BOOLEAN | NOT NULL DEFAULT true | |
| UNIQUE (person_id, type, channel) | | | |

### 2.25 audit_entries (Immutable append-only log)
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| company_id | UUID | FK → companies.id, NOT NULL | |
| actor_id | UUID | FK → people.id, nullable | null for system actions |
| resource_type | VARCHAR(50) | NOT NULL | e.g. shift, person, team |
| resource_id | UUID | NOT NULL | |
| action | VARCHAR(50) | NOT NULL | e.g. create, update, delete |
| old_values | JSONB | nullable | Previous state |
| new_values | JSONB | nullable | New state |
| ip_address | INET | nullable | |
| user_agent | TEXT | nullable | |
| prev_hash | VARCHAR(64) | NOT NULL | SHA256 of previous entry |
| hash | VARCHAR(64) | NOT NULL | SHA256 of this entry |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

Hash chain: `hash = SHA256(concat(prev_hash, resource_type, resource_id, action, old_values, new_values, created_at))`

### 2.26 sessions
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| person_id | UUID | FK → people.id, NOT NULL | |
| token_hash | VARCHAR(64) | NOT NULL | SHA256 of session token |
| refresh_token_hash | VARCHAR(64) | nullable | For token rotation |
| ip_address | INET | nullable | |
| user_agent | TEXT | nullable | |
| expires_at | TIMESTAMPTZ | NOT NULL | Session expiry |
| last_used_at | TIMESTAMPTZ | nullable | |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| revoked_at | TIMESTAMPTZ | nullable | Explicit logout/invalidation |

### 2.27 password_reset_tokens
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| person_id | UUID | FK → people.id, NOT NULL | |
| token_hash | VARCHAR(64) | NOT NULL | SHA256 of reset token |
| expires_at | TIMESTAMPTZ | NOT NULL | 15-min expiry |
| used_at | TIMESTAMPTZ | nullable | Single-use tracking |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

### 2.28 consent_records
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| person_id | UUID | FK → people.id, NOT NULL | |
| type | VARCHAR(50) | NOT NULL | e.g. email_marketing, analytics |
| granted | BOOLEAN | NOT NULL DEFAULT true | |
| ip_address | INET | nullable | |
| granted_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| revoked_at | TIMESTAMPTZ | nullable | Consent withdrawn |

### 2.29 region_routing
| Column | Type | Constraints | Notes |
|---|---|---|---|
| company_id | UUID | PK, FK → companies.id | |
| region | VARCHAR(20) | NOT NULL | e.g. eu-west-1, us-east-1, ap-southeast-2 |
| assigned_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

### 2.30 compliance_violations
| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| company_id | UUID | FK → companies.id, NOT NULL | |
| person_id | UUID | FK → people.id, ON DELETE SET NULL | |
| shift_assignment_id | UUID | FK → shift_assignments.id, ON DELETE SET NULL | |
| violation_type | ENUM('missed_meal_break','missed_rest_break','late_clock_in','early_clock_out','no_clock_in','overtime_exceeded','min_rest_violation','predictive_scheduling_violation') | NOT NULL | |
| severity | VARCHAR(10) | NOT NULL DEFAULT 'warning' | warning / critical |
| description | TEXT | NOT NULL | |
| detected_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| detected_by | VARCHAR(50) | NOT NULL DEFAULT 'system' | system or manager UUID |
| status | ENUM('open','acknowledged','resolved','dismissed') | NOT NULL DEFAULT 'open' | |
| acknowledged_at | TIMESTAMPTZ | nullable | |
| acknowledged_by | UUID | FK → people.id, nullable | |
| resolved_at | TIMESTAMPTZ | nullable | |
| resolved_by | UUID | FK → people.id, nullable | |
| notes | TEXT | nullable | |

---

## 3. Indexes

| Table | Index | Type | Column(s) |
|---|---|---|---|
| shifts | idx_shifts_company | btree | company_id |
| shifts | idx_shifts_team | btree | team_id |
| shifts | idx_shifts_range | btree | start_at, end_at |
| shifts | idx_shifts_template | btree | template_id |
| shifts | idx_shifts_status | btree | status |
| shifts | idx_shifts_location | btree | location_id |
| shifts | idx_shifts_position | btree | position_id |
| shift_assignments | idx_sa_shift | btree | shift_id |
| shift_assignments | idx_sa_person | btree | person_id |
| shift_assignments | idx_sa_status | btree | status |
| clock_entries | idx_ce_person | btree | person_id |
| clock_entries | idx_ce_range | btree | clock_in_at, clock_out_at |
| clock_entries | idx_ce_active | partial btree | (clock_out_at IS NULL) |
| time_off_requests | idx_tor_person | btree | person_id |
| time_off_requests | idx_tor_range | btree | start_at, end_at |
| time_off_requests | idx_tor_status | btree | status |
| time_off_requests | idx_tor_company | btree | company_id |
| shift_swap_requests | idx_ssr_assignment | btree | shift_assignment_id |
| shift_swap_requests | idx_ssr_requester | btree | requester_id |
| shift_swap_requests | idx_ssr_status | btree | status |
| holidays | idx_holidays_company_date | UNIQUE btree | company_id, date |
| people | idx_people_company_email | UNIQUE btree | company_id, email |
| people | idx_people_sub_token | UNIQUE btree | subscription_token |
| people | idx_people_employee_id | btree | company_id, employee_id |
| team_memberships | idx_tm_team_person | UNIQUE btree | team_id, person_id |
| notifications | idx_notif_person_status | btree | person_id, status |
| notification_preferences | idx_np_person | btree | person_id |
| audit_entries | idx_ae_company | btree | company_id |
| audit_entries | idx_ae_resource | btree | resource_type, resource_id |
| audit_entries | idx_ae_actor | btree | actor_id |
| audit_entries | idx_ae_created | btree | created_at |
| integrations | idx_int_company_type | btree | company_id, type |
| feature_flags | idx_ff_company_flag | UNIQUE btree | company_id, flag |
| locations | idx_loc_company | btree | company_id |
| positions | idx_pos_company_name | UNIQUE btree | company_id, name |
| skills | idx_skill_company_name | UNIQUE btree | company_id, name |
| person_skills | idx_ps_person | btree | person_id |
| person_skills | idx_ps_skill | btree | skill_id |
| position_skills | idx_pss_position | btree | position_id |
| template_skills | idx_ts_template | btree | shift_template_id |
| sessions | idx_sessions_person | btree | person_id |
| sessions | idx_sessions_token | btree | token_hash |
| sessions | idx_sessions_expires | partial btree | expires_at WHERE revoked_at IS NULL |
| password_reset_tokens | idx_prt_person | btree | person_id |
| password_reset_tokens | idx_prt_token | btree | token_hash |
| consent_records | idx_cr_person | btree | person_id |
| compliance_violations | idx_cv_company | btree | company_id |
| compliance_violations | idx_cv_person | btree | person_id |
| compliance_violations | idx_cv_type | btree | violation_type |
| compliance_violations | idx_cv_status | btree | status |
| compliance_violations | idx_cv_detected | btree | detected_at |