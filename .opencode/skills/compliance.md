# Compliance Skill (GDPR / CCPA / SOC2 / HIPAA)

## When to use
Load this skill when implementing data privacy features, compliance requirements, data residency, erasure workflows, or audit log policies.

## Key references
- `compliance/01-GDPR.md` — EU data protection requirements
- `compliance/02-CCPA.md` — California Consumer Privacy Act
- `compliance/03-SOC2.md` — Security, availability, processing integrity
- `compliance/04-HIPAA.md` — Healthcare data protection (US)
- `compliance/05-security.md` — Security controls and encryption
- `compliance/06-data-residency.md` — Regional data sharding
- `compliance/07-incident-response-plan.md` — Breach response procedures
- `compliance/08-Australia.md` — Australian privacy law (OAIC)

## Domain requirements

### GDPR (all EU users)
- **Right to access**: Export person data as JSON
- **Right to erasure**: Delete person, anonymize audit references (`ON DELETE SET NULL`)
- **Data portability**: Full data export in machine-readable format
- **Consent records**: `consent_records` table tracks explicit consent with timestamps
- **Retention**: Configurable data retention (default 365 days via `company_settings.data_retention_days`)
- **DPA**: Data Processing Agreement must be signed for EU customers

### CCPA (California users)
- **Right to know**: What data is collected, shared, sold (none sold)
- **Right to delete**: Same erasure flow as GDPR
- **Opt-out**: No sale of data (CCPA §1798.120) — statement required in privacy policy
- **Non-discrimination**: Service quality cannot change for users who exercise rights

### SOC 2 (enterprise trust)
- **Security**: TLS 1.3, AES-256 at rest, access controls, audit logging
- **Availability**: 99.9% uptime target, multi-AZ deployment
- **Processing integrity**: Audit log ensures data accuracy and completeness
- **Confidentiality**: RLS tenant isolation, encryption, access review
- **Privacy**: GDPR/CCPA compliance feeds into SOC 2 privacy criteria

### HIPAA (US healthcare covered entities)
- **BAA**: Business Associate Agreement required for each customer
- **PHI identification**: `people.name`, `email`, `phone`, `employee_id` are PHI
- **Access controls**: MFA required (enforced via `mfa_enabled` flag)
- **Audit controls**: Comprehensive audit log with all PHI access tracked
- **Encryption**: TLS 1.3 in transit, AES-256 at rest
- **Emergency access procedure**: Break-glass protocol for super admin
- **hipaa_enabled**: Per-company flag in `companies` table

## Data residency
- `region_routing` table maps company to geographic DB cluster
- Companies choose region at signup
- Required for: GDPR (EU data stays in EU), HIPAA (US data stays in US)
- MVP: single-region; multi-region is Phase D

## Clock entries & data deletion
- `ON DELETE SET NULL` on `person_id` and `shift_assignment_id` in `clock_entries`
- This preserves clock records for payroll/compliance even after person is erased (GDPR §3.3 allows)
- `audit_entries` uses `ON DELETE SET NULL` for `actor_id` to preserve chain integrity

## Violation tracking
- `compliance_violations` table with types: missed_meal_break, missed_rest_break, late_clock_in, overtime_exceeded, etc.
- Auto-detected by system on clock-out or schedule publish
- Status workflow: open → acknowledged → resolved / dismissed
