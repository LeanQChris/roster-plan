# Incident Response Plan

## 1. Purpose
This document defines the process for detecting, responding to, and recovering from security incidents affecting the roster application. It ensures timely, consistent, and compliant handling of incidents in accordance with GDPR (72h notification), HIPAA (60d notification), and SOC 2 requirements.

## 2. Scope
Covers all systems, data, and personnel within the roster application's environment, including:
- Application servers, databases, caches, and storage
- Cloud infrastructure and network
- Employee and company data (including PHI in HIPAA mode)
- Third-party services (email delivery, monitoring, cloud provider)

## 3. Incident Classification

### 3.1 Severity Levels

| Severity | Definition | Examples | Response Time |
|---|---|---|---|
| **SEV1 (Critical)** | Active data breach, confirmed unauthorized access to PII/PHI, extended service outage | Database exfiltration, compromised admin account, ransomware, complete service outage >30 min | Immediate (≤15 min) |
| **SEV2 (High)** | Suspected breach, targeted attack, partial service outage, data integrity issue | Brute-force attack in progress, isolated tenant compromise, degraded performance | ≤1 hour |
| **SEV3 (Medium)** | Policy violation, suspicious activity, non-critical data exposure | Employee accessing unauthorized data, misconfigured S3 bucket (no customer data), single-user account compromise | ≤4 hours |
| **SEV4 (Low)** | Minor security finding, failed scan, configuration drift | Dependency vulnerability (no exploit known), outdated TLS cipher, missing security header | ≤1 week |

### 3.2 Incident Types
- **Data breach**: Unauthorized access, acquisition, or disclosure of PII, PHI, or confidential data.
- **Service disruption**: Extended downtime, data loss, or degradation.
- **Account compromise**: Unauthorized access to user accounts, especially admin/privileged accounts.
- **Malware / ransomware**: Malicious software detected in the environment.
- **Insider threat**: Employee or contractor exceeding authorized access or mishandling data.
- **Third-party incident**: Breach or disruption at a sub-processor (cloud provider, email service).

## 4. Incident Response Team (IRT)

| Role | Responsibility | Primary | Backup |
|---|---|---|---|
| Incident Commander | Coordinates response, makes decisions, communicates status | CTO / Engineering Lead | Senior Engineer |
| Security Lead | Technical investigation, containment, evidence collection | Security Engineer | CTO |
| Communications Lead | Internal and external notifications, regulatory filings | Legal / Compliance | CTO |
| Engineering Support | System remediation, patch deployment, restoration | On-call Engineer | DevOps |
| Company Liaison | Communication with affected tenant company | Customer Success | CTO |

## 5. Response Phases

### 5.1 Detection
Sources of incident detection:
- Automated alerts (WAF, IDS, audit log anomalies, uptime monitoring — see `05-security.md` §6.2)
- User reports (employee or manager reporting suspicious activity)
- Vendor notifications (sub-processor breach notification)
- Security scan findings (pen test, vulnerability scan)

**Action**: Anyone detecting a potential incident must report it immediately to the IRT via:
- **PagerDuty / OpsGenie** for automated alerts
- **#security-incidents** Slack channel (private, dedicated)
- **Email**: security@[company].com
- **Report time**: Recorded in audit log as `resource_type = 'security_incident'`

### 5.2 Triage (≤15 min for SEV1, ≤1 hour for SEV2)
1. Assess severity using classification matrix (§3).
2. Assign Incident Commander.
3. Open incident ticket in tracking system.
4. Determine if incident is ongoing (active threat) or past (post-mortem only).
5. If SEV1/SEV2: alert full IRT and begin containment.

### 5.3 Containment
Goal: Stop the incident from causing further damage.

| Tactic | Application |
|---|---|
| Network isolation | Block IP range at WAF, isolate affected service in VPC |
| Account suspension | Revoke session tokens, disable compromised accounts |
| Key rotation | Rotate API keys, database credentials, encryption keys |
| Service shutdown | Take affected service offline (with communication) |
| Snapshot forensics | Capture memory, disk, and log snapshots before remediation |
| Backup preservation | Ensure pre-incident backups are preserved (do not overwrite) |

### 5.4 Eradication
1. Identify and remove root cause (deploy patch, remove malicious code, close vulnerability).
2. Verify no persistence mechanisms remain.
3. Apply security improvements to prevent recurrence.
4. Run full security scan after remediation.

### 5.5 Recovery
1. Restore systems from clean backup if compromised.
2. Verify data integrity (check audit log hash chain, reconcile data).
3. Gradually restore service with enhanced monitoring.
4. Confirm with affected stakeholders that service is operational.
5. Monitor for signs of re-occurrence for 72 hours post-recovery.

### 5.6 Post-Mortem
Conducted within **5 business days** for SEV1/SEV2, **10 business days** for SEV3/SEV4.

**Post-mortem document includes**:
- Timeline of events (detection → containment → eradication → recovery)
- Root cause analysis (5 Whys or similar methodology)
- Data affected: types, volume, persons, jurisdictions
- Effectiveness of response (what went well, what didn't)
- Remediation items with owners and deadlines
- Lessons learned and process improvements

**Distribution**: Post-mortem shared with IRT, executive team, and (if applicable) affected tenant companies.

## 6. Notification Requirements

### 6.1 Internal Notifications

| Severity | Notify | Method | Timing |
|---|---|---|---|
| SEV1 | IRT + Executive team | Phone / PagerDuty | Immediate |
| SEV2 | IRT | Slack / PagerDuty | ≤30 min |
| SEV3 | Security lead + Engineering lead | Slack / Email | ≤4 hours |
| SEV4 | Security lead | Email / Ticket | ≤1 week |

### 6.2 External Notifications

| Regulation | Trigger | Notify | Deadline |
|---|---|---|---|
| **GDPR** (Art. 33) | Personal data breach affecting EEA data subjects | Supervisory authority (lead SA) | 72 hours from discovery |
| **GDPR** (Art. 34) | High risk to data subjects | Affected data subjects | Without undue delay |
| **CCPA/CPRA** | Breach of personal information (non-encrypted, non-redacted) | Affected California residents | Most expedient time possible, no later than notification to AG |
| **HIPAA** | Breach of unsecured PHI | Affected individuals + HHS | 60 days (500+ individuals: notify media + HHS within 60 days) |
| **SOC 2** | Breach affecting tenant data | Affected tenant companies | Per contractual SLA (typically 24-72 hours) |
| **State breach laws** | Varies by state (all 50 US states have breach notification laws) | Affected state residents + AG | Varies (30-90 days depending on state) |

### 6.3 Notification Template (Regulatory)
```
Date: [date]
To: [Supervisory Authority / Affected Individuals]
From: [Company Name]

1. Nature of the breach: [description]
2. Data affected: [categories and approximate number of records]
3. Contact information: [DPO / security contact]
4. Likely consequences: [assessment]
5. Measures taken/proposed: [containment, remediation, prevention]
6. Data protection officer: [name, email, phone]
```

### 6.4 Notification Template (Tenant Company)
```
Subject: Security Incident Notification — RosterApp

Dear [Company Admin],

RosterApp has identified a security incident that may affect data belonging to [Company Name].

- Incident ID: [ID]
- Date of discovery: [date]
- Nature of incident: [high-level summary]
- Data potentially affected: [categories]
- Current status: [contained / investigating / resolved]
- Actions taken: [summary]
- Recommended actions for your company: [if any]
- Contact: [security contact details]

We will provide updates as the investigation progresses.
```

## 7. Communication Plan

| Audience | Message | Channel | Timing |
|---|---|---|---|
| Internal team | Incident confirmed, severity, IRT activated | Slack / PagerDuty | Immediate |
| Affected tenant(s) | Notification per §6.4 | Email | Per SLA |
| All tenants | If systemic breach affects multiple tenants | Email + Status page | Per regulatory deadlines |
| General public | Only if legally required or significant public interest | Press release / Status page | After regulatory notification |
| Regulators | Formal notification per §6.2 | Email / Registered mail | Per regulatory deadlines |

## 8. Evidence Collection & Chain of Custody
- All evidence (logs, screenshots, memory dumps, network captures) preserved with timestamp.
- Evidence stored in secure, access-controlled location.
- Chain of custody log maintained: who collected, when, where, how, who handled.
- Evidence collection must not alter original data (forensic copies, not originals).
- Legal hold: if litigation is reasonably anticipated, preserve all relevant data.

## 9. Testing & Drills

| Drill Type | Frequency | Scope |
|---|---|---|
| Tabletop exercise | Semi-annually | Walk through SEV1 scenario with IRT |
| Live drill (SEV3 scenario) | Annually | Simulate compromised employee account |
| Full-scale drill (SEV1 scenario) | Annually | Simulate data breach end-to-end |
| Post-drill review | After each drill | Document findings and improvements |

## 10. Plan Maintenance
- This plan is reviewed and updated at least **annually**.
- Updates triggered by: significant infrastructure changes, new regulations, post-mortem lessons.
- Plan is stored in the compliance repository and accessible to all IRT members.
- IRT contact list reviewed quarterly.

## 11. Appendices

### A. Quick Reference Card
1. **Detect** → Report to #security-incidents
2. **Triage** → Assess severity, assign Incident Commander
3. **Contain** → Stop the bleeding (block IP, suspend account, rotate keys)
4. **Eradicate** → Remove root cause
5. **Recover** → Restore from clean backup, verify integrity
6. **Notify** → Internal first, then regulatory, then affected parties
7. **Post-mortem** → Within 5 business days

### B. Regulatory Notification Deadlines Quick Reference
| Regulation | Authority Notification | Individual Notification | Filing Method |
|---|---|---|---|
| GDPR | 72 hours | Without undue delay | Email / portal |
| HIPAA | 60 days (500+ immediate) | 60 days | HHS portal |
| CCPA/CPRA | Most expedient time | Most expedient time | Email + AG notification |
| SOC 2 (contractual) | Per tenant SLA | Per tenant SLA | Email |
