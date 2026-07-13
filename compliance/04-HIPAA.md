# HIPAA Compliance Plan

## 1. Overview
The Health Insurance Portability and Accountability Act (HIPAA) applies when the roster application is used by a **covered entity** (healthcare provider, health plan, healthcare clearinghouse) or a **business associate** of a covered entity.

The roster app **optionally supports HIPAA compliance mode** per company (via `companies.hipaa_enabled` flag). When enabled, additional controls are enforced.

## 2. PHI Identification
Under HIPAA, Protected Health Information (PHI) includes any individually identifiable health information. In the roster context:

| Field | PHI? | Notes |
|---|---|---|
| Employee name | Yes | Direct identifier |
| Email address | Yes | Direct identifier |
| Work schedule / shifts | **Yes** | Reveals when/where employee works; for healthcare settings, this indicates service availability |
| Clock in/out times | **Yes** | Presence information is PHI |
| Team/department | Potentially | If department contains health information (e.g., "Oncology") |
| IP address | Yes | Could link to location |
| Role / job title | No | Not PHI alone |

**Key principle**: In a healthcare setting, an employee's schedule is considered PHI because it reveals when a specific individual is present, which relates to their health service provision.

## 3. HIPAA Rules & Implementation

### 3.1 Privacy Rule

| Requirement | Implementation |
|---|---|
| Minimum necessary standard | RBAC ensures least-privilege access to schedule data |
| Notice of privacy practices | Published in app and at onboarding |
| Patient access rights | Employee can access own schedule and clock data |
| Restriction requests | Person status `inactive` stops processing |
| Authorizations | Separate authorization for non-essential data use |
| De-identification | Anonymization on GDPR erasure |
| Marketing restrictions | No marketing communication in HIPAA mode |

### 3.2 Security Rule

#### Administrative Safeguards
- **Security management process**: Risk analysis, risk management, sanction policy.
- **Assigned security responsibility**: Named security officer per implementing company.
- **Workforce security**: RBAC, person termination procedures.
- **Information access management**: Company admin manages access; role-scoped.
- **Security awareness training**: Required for all company staff using the app.
- **Security incident procedures**: Incident response plan (see SOC2 doc).
- **Contingency plan**: Backup, disaster recovery, emergency mode operation.
- **Evaluation**: Annual technical/non-technical evaluation.
- **Business associate agreements**: Required with any subcontractor (hosting, email).

#### Physical Safeguards
- **Facility access**: Managed by cloud provider (AWS/GCP/Azure), SOC 2 reports available.
- **Workstation security**: Not applicable (web app, no local installation).
- **Device and media controls**: Cloud provider handles media sanitization.

#### Technical Safeguards

| Safeguard | Implementation |
|---|---|
| **Access control** (unique user ID) | Each person has a unique UUID |
| **Emergency access procedure** | Super admin can grant temporary company_admin access |
| **Automatic logoff** | Session timeout after 30 minutes of inactivity |
| **Encryption & decryption** | AES-256 at rest, TLS 1.3 in transit |
| **Audit controls** | Immutable audit log of all PHI access |
| **Integrity controls** | HMAC chain verifies log integrity, clock entries append-only |
| **Person/entity authentication** | Email + bcrypt password, rate-limited |
| **Transmission security** | TLS 1.3 enforced, HSTS |

### 3.3 Breach Notification Rule
- **Detection**: Real-time monitoring for anomalous data access patterns.
- **Risk assessment**: Within 30 days of discovery, assess probability of PHI compromise.
- **Notification**: Affected individuals within 60 days, HHS within 60 days (500+ within 60).
- **Logging**: Breach details recorded in audit_entries with `resource_type = 'security_incident'`.

## 4. Risk Assessment Methodology

### 4.1 Framework
Based on **NIST SP 800-66 Rev. 2** (Implementing the HIPAA Security Rule) and **NIST SP 800-30** for risk management.

### 4.2 Process
1. **Scope definition**: Identify systems and data that create, receive, maintain, or transmit ePHI.
2. **Asset identification**: Inventory all hardware, software, networks, and data that handle ePHI.
3. **Threat identification**: Identify likely threats (malware, unauthorized access, natural disasters, insider threats).
4. **Vulnerability assessment**: Scan for known vulnerabilities, review configurations, assess access controls.
5. **Likelihood determination**: Rate probability of threat occurrence (Low / Medium / High).
6. **Impact determination**: Assess impact on confidentiality, integrity, and availability of ePHI (Low / Medium / High).
7. **Risk level calculation**: Likelihood × Impact → Risk level.
8. **Risk mitigation**: Identify and implement security measures to reduce risk to an acceptable level.
9. **Residual risk acceptance**: Document and obtain sign-off for any remaining risk.
10. **Review**: Annual full risk assessment; ad-hoc assessment on significant system changes.

### 4.3 Documentation
- Risk assessment report (annual) stored in compliance repository.
- Risk register tracking all identified risks, mitigation status, and owners.
- Remediation plan for risks above acceptable threshold.

## 5. Sanction Policy

Sanction policies (written warnings, retraining, termination, legal referral) are the responsibility of each tenant company as the covered entity. The roster app provides tooling to support enforcement:

- Audit log records all access events — evidence for investigations.
- Account suspension API (`PATCH /api/v1/people/:personId { status: "inactive" }`) immediately revokes all sessions.
- Role changes logged immutably in audit_entries.
- Company admin can deactivate accounts pending investigation.

Tenant companies should document their own sanction policy aligned with 45 CFR §164.308(a)(1)(ii)(C).

## 6. Contingency Plan & Testing

### 6.1 Plan Components (per 45 CFR §164.308(a)(7))
- **Data backup plan**: Daily automated backups with point-in-time recovery (PITR ≤ 5 min).
- **Disaster recovery plan**: Documented procedures for restoring system and ePHI availability after an emergency.
- **Emergency mode operation plan**: Procedures for continuing critical operations during system unavailability (manual scheduling, offline clock tracking with reconciliation).
- **Testing and revision procedures**: Regular testing of contingency plan effectiveness.
- **Applications and data criticality analysis**: Prioritization of systems for recovery.

### 6.2 Testing Requirements

| Test Type | Frequency | Scope |
|---|---|---|
| Backup restoration test | Quarterly | Restore from backup to isolated environment, verify data integrity |
| DR failover drill | Annually | Simulate region failure, verify failover within RTO |
| Emergency mode walkthrough | Annually | Tabletop exercise of manual operations during extended outage |
| PITR accuracy test | Semi-annually | Verify point-in-time recovery can restore to any point within retention window |

### 6.3 Documentation
- Test results recorded with: date, scope, participants, findings, remediation items.
- Remediation items tracked to closure with defined owner and deadline.
- Plan reviewed and updated after each test or significant infrastructure change.

## 7. EPHI Disposal Procedures

The roster app is fully digital. Disposal is handled as follows:

- **Soft-delete**: Name/email replaced with `[redacted]`, FKs set to NULL on erasure request or retention expiry.
- **Hard-delete**: Row deletion after 30-day grace period.
- **Backups**: Naturally rotated per retention window; no manual deletion required.
- **Staging data**: Synthetic data only — no real ePHI in non-production environments.

All deletion events are logged in `audit_entries`. Full disposal procedures (verification, annual review) are documented in the tenant company's own policy.

## 8. Workforce Training

HIPAA-required workforce training (awareness, role-based, security, breach response) is the responsibility of each tenant company as the covered entity. The roster app does not administer or track training.

What the app provides:
- Role-based access controls restrict data access to authorized personnel only.
- Audit logging records all PHI access for monitoring by the tenant's security officer.
- Session enforcement (timeout, MFA) supports the security awareness obligations.

Tenant companies should document their own training programs per 45 CFR §164.308(a)(5) and retain training records for 6 years.

## 9. Audit Log Review Cadence

| Log Type | Review Frequency | Reviewer | Purpose |
|---|---|---|---|
| PHI access logs (read operations, HIPAA mode) | Weekly | Security officer / designee | Detect unauthorized PHI access |
| Authentication logs (logins, failures) | Daily (automated alert) | System (automated) | Detect brute-force or compromised accounts |
| Privileged action logs (admin/manager actions) | Weekly | Security officer | Detect unauthorized configuration changes |
| Audit log integrity check (hash chain) | Daily (automated) | System (automated) | Detect tampering |
| Anomalous access patterns | Real-time alert | System (automated) + weekly review | Detect data exfiltration |
| Termination/deactivation log | Monthly | Security officer | Verify former employees no longer have access |

All review findings documented with: date, reviewer, findings, actions taken.

## 10. HIPAA Mode Toggle

When `companies.hipaa_enabled = true`:

| Feature | Behavior Change |
|---|---|
| PHI access logging | Every `person.read`, `shift.read`, `clock.read` logged in audit (not just writes) |
| Minimum necessary | Manager reads limited to their team's schedule; company admin sees all |
| Session timeout | Reduced to 15 minutes |
| Password policy | Minimum 12 chars, must include uppercase, lowercase, number, special character |
| MFA required | Multi-factor authentication enforced for all users |
| Export encryption | Data exports are encrypted at download time |
| BAAs required | Company must sign BAA with RosterApp legal entity |
| Notification content | Emails do NOT include PHI in subject line |
| Sub-processor list | Disclosed to company (hosting, email provider, database) |
| Audit log review | Weekly review of PHI access logs enforced (see §9) |
| Risk assessment | Annual risk assessment required and tracked |

## 11. Business Associate Agreement (BAA)
A BAA is required between:
- **RosterApp (Business Associate)** and each covered entity company.
- **RosterApp** and its subcontractors (cloud provider, email service provider).

The BAA must include:
- Permitted uses and disclosures of PHI
- Obligations to safeguard PHI
- Breach notification terms (max 60 days for notification to covered entity)
- Return or destruction of PHI on termination
- Right to audit (by covered entity or regulator)
- Indemnification for BAA violations
- Flow-down of obligations to all subcontractors

## 12. Compliance Documentation
- Risk assessment (annual) — see §4
- Security policies and procedures (see `05-security.md`)
- Incident response plan (see `07-incident-response-plan.md`)
- Contingency plan (see §6)
- Sanction policy documentation (see §5)
- Training records (see §8)
- Audit log review records (see §9)
- BAA agreements on file
- EPHI disposal records (see §7)
- All records retained **6 years** per HIPAA requirement