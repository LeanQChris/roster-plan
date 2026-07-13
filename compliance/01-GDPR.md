# GDPR Compliance Plan

## 1. Applicability
The General Data Protection Regulation (GDPR) applies to any company processing personal data of data subjects located in the European Economic Area (EEA). Since the roster app supports global teams, GDPR compliance is mandatory for EEA-based employees and companies.

## 2. Personal Data Inventory

The roster app processes these categories of personal data:

| Category | Fields | Legal Basis |
|---|---|---|
| Identity | Name, email | Contract performance (employment) |
| Work schedule | Shift assignments, clock-in/out times | Contract performance |
| Employment | Team membership, role, status | Contract performance |
| Technical | IP address, user agent, timezone | Legitimate interest (security, audit) |
| Communications | Notification preferences, read status | Consent |
| Authentication | Password hash | Contract performance |
| Audit logs | Actor ID, action, IP address | Legal obligation (SOC 2 / HIPAA) |

## 3. GDPR Requirements & Implementation

### 3.1 Lawful Basis for Processing
- **Contract performance** (Art. 6(1)(b)): Scheduling, time tracking, team management.
- **Legal obligation** (Art. 6(1)(c)): Audit logs for SOC 2 / HIPAA.
- **Consent** (Art. 6(1)(a)): Marketing communications (not in v1).
- **Legitimate interest** (Art. 6(1)(f)): Security monitoring, fraud prevention.

### 3.2 Data Subject Rights

| Right | Implementation | API Endpoint |
|---|---|---|
| **Right to Access** (Art. 15) | API returns all personal data for a person | `GET /api/v1/people/:id` |
| **Right to Rectification** (Art. 16) | PATCH endpoint for person fields | `PATCH /api/v1/people/:id` |
| **Right to Erasure** (Art. 17) | Soft-delete then hard-delete after grace period | `DELETE /api/v1/people/:id` |
| **Right to Restrict Processing** | Set person status to `inactive`, retain data without processing | `PATCH /api/v1/people/:id { status: "inactive" }` |
| **Right to Data Portability** (Art. 20) | JSON export of all person data | `GET /api/v1/people/:id/export` |
| **Right to Object** | Opt-out of non-essential processing (notifications, analytics) | PATCH person preferences |
| **Automated Decision-Making** (Art. 22) | No automated scheduling decisions with legal effect in v1; if added, right to human review must be provided | N/A (v1) |

### 3.3 Erasure (Right to be Forgotten)

Soft-delete implementation for GDPR erasure:
1. Person row gets `status = 'deleted'`, `deleted_at = NOW()`.
2. Name, email, password_hash are **anonymized** (replaced with `[redacted]`).
3. Audit log entries remain but `actor_id` is set to NULL (anonymized).
4. Shift assignments are cancelled.
5. Clock entries remain (they use `person_id` FK with `ON DELETE SET NULL`).
6. After 30-day grace period, hard-delete orphaned rows.

### 3.4 Data Portability

`GET /api/v1/people/:id/export` returns a JSON object containing:
```json
{
  "person": { "name", "email", "timezone", "role" },
  "shifts": [ ... ],
  "clock_entries": [ ... ],
  "teams": [ ... ],
  "notifications": [ ... ],
  "exported_at": "2026-07-09T12:00:00Z"
}
```

### 3.5 Automated Decision-Making (Art. 22)
- **v1**: No automated decisions that produce legal effects. All scheduling decisions involve a human manager.
- **Post-v1**: If ML-based auto-scheduling is introduced:
  - Data subjects must be informed that automated decision-making is used.
  - Right to obtain human intervention on the part of the controller.
  - Right to express their point of view and contest the decision.
  - Regular accuracy checks on the automated decision logic.

## 4. Data Retention

| Data Type | Retention | After Deletion |
|---|---|---|
| Person profile | Until erasure request or company deletion | Anonymized |
| Shift assignments | 3 years (legal requirement) | Orphaned (person_id = NULL) |
| Clock entries | 3 years | Orphaned |
| Audit logs | 3 years (SOC 2 minimum) | Anonymized actor |
| Notifications | 1 year | Deleted |
| Session tokens | Until logout / 30 days max | Deleted |
| Company data | 30 days after company deletion | Hard-deleted |

Configurable per company via `company_settings.data_retention_days`.

## 5. Consent Management
- Collect explicit consent for non-essential processing (marketing, analytics).
- Store consent records in `consent_records` table: `id, person_id, type, granted, ip_address, granted_at, revoked_at`.
- `granted_at` records when consent was given; `revoked_at` records withdrawal (nullable, NULL = consent still active).
- Consent can be withdrawn at any time via preferences; `revoked_at` set on withdrawal.
- Cookie consent banner for any tracking cookies (Google Analytics, etc.).
- Consent withdrawal is as easy as consent was to give (Art. 7(3)).

## 6. Data Processing Agreement (DPA)
- Required for sub-processors (hosting provider, email service, database provider).
- All sub-processors must be GDPR-compliant with a signed DPA.
- List of sub-processors maintained and disclosed to companies.
- DPA must cover: subject matter, duration, nature/purpose of processing, types of personal data, categories of data subjects, controller's obligations, and sub-processor's obligations.

## 7. International Transfers (Art. 44-49)
- **Principle**: Personal data of EEA data subjects must not leave the EEA unless an adequate transfer mechanism is in place.
- **Adequacy decisions**: Rely on European Commission adequacy decisions for transfers to adequate jurisdictions.
- **Standard Contractual Clauses (SCCs)**: Used for transfers to jurisdictions without adequacy decisions. Include the European Commission's 2021 Standard Contractual Clauses in all sub-processor agreements.
- **Transfer Impact Assessment (TIA)**: Required alongside SCCs to assess the legal environment of the destination country.
- **Supplementary measures**: Technical/contractual measures (encryption, pseudonymization) where SCCs alone are insufficient.
- **Data residency**: Companies with EEA employees are assigned to EU region (see `06-data-residency.md`). Where EU region is unavailable, SCCs + TIA apply before any data transfer.
- **Records**: All cross-border transfers logged with mechanism used, destination, and date.

## 8. Breach Notification
- Internal detection → notify DPO within 24 hours.
- Notify supervisory authority within 72 hours (Art. 33).
- Notify affected data subjects without undue delay (Art. 34).
- Breach logging: record in audit_entries with `resource_type = 'security_incident'`.
- Breach response documented in `07-incident-response-plan.md`.

## 9. Data Protection Impact Assessment (DPIA)
- **Required when**: Processing is likely to result in high risk to data subjects' rights and freedoms.
- **Triggers for DPIA in this app**:
  - Systematic monitoring of employees (clock-in/out tracking).
  - Processing of special category data (if health/certification data is stored, e.g., CPR certification).
  - Large-scale processing of employee schedules.
- **DPIA process**:
  1. Describe the processing operations and purposes.
  2. Assess necessity and proportionality.
  3. Identify and assess risks to data subjects.
  4. Identify measures to mitigate risks (encryption, access controls, data minimization, retention limits).
  5. Consult DPO before processing begins if residual risk is high.
- **Review**: DPIA reviewed annually or whenever processing changes significantly.

## 10. Privacy by Design & Default
- Data minimization: only collect fields necessary for scheduling.
- Pseudonymization: audit logs reference person UUIDs, not names.
- Encryption at rest (AES-256) and in transit (TLS 1.3).
- Access controls: RBAC with least-privilege principle.
- RLS ensures data isolation across tenants (no cross-tenant data access).
- Default privacy settings: minimal data collection, no analytics tracking by default.
- Privacy considerations embedded in feature design (privacy review in development lifecycle).

## 11. Records of Processing Activities (Art. 30)
Maintained as a living document with the following structure:

| Field | Content |
|---|---|
| Controller name | Each tenant company (as data controller) |
| Processor name | RosterApp operator (as data processor) |
| Processing purpose | Employee scheduling, time tracking, attendance management |
| Categories of data subjects | Employees, managers, company admins |
| Categories of personal data | Identity, schedule, employment, technical, communications |
| Recipients | Cloud provider, email service provider, database provider (with DPA) |
| International transfers | See §7 International Transfers above |
| Retention periods | See §4 Data Retention above |
| Security measures | Encryption, RBAC, RLS, audit logging, access controls |

- Records are maintained per tenant.
- Available to supervisory authority on request (Art. 30(4)).

## 12. Privacy Policy Contents
The privacy policy published at `/privacy-policy` must include:

1. Identity and contact details of the controller (tenant company) and DPO.
2. Purposes and legal basis for processing (Art. 13(1)(c)).
3. Legitimate interests pursued (if relying on legitimate interest).
4. Categories of personal data collected.
5. Recipients or categories of recipients.
6. Intention to transfer data outside the EEA and safeguards in place.
7. Retention period or criteria used to determine it.
8. Existence of each data subject right (access, rectification, erasure, restriction, portability, objection).
9. Right to withdraw consent at any time.
10. Right to lodge a complaint with a supervisory authority.
11. Whether providing data is a statutory/contractual requirement and consequences of not providing it.
12. Existence of automated decision-making (if applicable — see §3.5).

## 13. DPO Contact & Documentation
- DPO contact details published on website and in app footer.
- DPO responsibilities: monitor compliance, advise on DPIAs, cooperate with supervisory authority.
- DPO designated when: (a) processing by a public authority, (b) large-scale systematic monitoring, or (c) large-scale processing of special categories. For this app, the DPO should be at the tenant company level; the platform provides DPO contact field in company settings.
- Records of processing activities (Art. 30) maintained per tenant.