# Security Architecture

## 1. Security Principles
- **Defense in depth**: Multiple layers of security controls at network, application, and data levels.
- **Least privilege**: Users and services get only the permissions they need.
- **Zero trust**: No implicit trust based on network location; every request authenticated and authorized.
- **Fail secure**: Default-deny on all access controls. Errors result in closed/secure state.
- **Privacy by design**: Data minimization, purpose limitation, transparency.

## 2. Network Security

### 2.1 Perimeter
- All traffic routed through Cloud Load Balancer (TLS termination at LB).
- WAF (Web Application Firewall) blocks SQL injection, XSS, CSRF, and OWASP Top 10.
- DDoS protection via cloud provider (AWS Shield / Cloud Armor).
- API accessible **only** over HTTPS (HTTP redirects to HTTPS, HSTS header enforced).
- No direct database access from the internet (database in private subnet).

### 2.2 Internal Network
- Microservices communicate over internal VPC with security groups.
- Database accessible only from application servers on specific ports.
- Redis cache in private subnet with AUTH token.
- All inter-service communication uses TLS (internal CA).

### 2.3 IP Restrictions
- Company admins can optionally configure IP whitelists (`company_settings.allowed_ip_ranges`).
- Rate limiting per IP: 60 requests/min for GET, 10 requests/min for POST/PATCH/DELETE.
- Suspicious IPs (10+ failed auth attempts in 5 min) get temporary blocked (15 min).

## 3. Application Security

### 3.1 Authentication
- Password hashing: bcrypt with cost factor 12.
- Session tokens: 32-byte cryptographically random, stored hashed in database.
- Refresh token rotation: new refresh token issued on every use; old one invalidated.
- Password reset tokens: single-use, expire after 15 minutes.
- Account lockout: after 5 failed attempts, account locked for 30 minutes.
- MFA (required for HIPAA mode, optional otherwise): TOTP-based.

### 3.2 Authorization
- RBAC middleware on every protected route.
- Row-Level Security (RLS) at database layer as a second line of defense.
- Tenant isolation: every query scoped by `company_id` (via RLS and application-level checks).
- Action auditing: every state change logged with actor, resource, old/new values.

### 3.3 Input Validation
- All inputs validated server-side (never trust client-side validation alone).
- Strict JSON schema validation on all POST/PATCH endpoints.
- SQL injection prevented via parameterized queries / ORM.
- HTML/JS sanitization on any user-submitted content (notes, descriptions).
- Size limits on all text fields (enforced in database schema).

### 3.4 Session Management
- Session sliding expiry: 7 days (extended by 7 days on each API call within 24h of expiry). See `spec/06-session-management.md` for full details.
- HIPAA mode: inactivity timeout reduced to 15 minutes, max 3 concurrent sessions.
- Sessions invalidated on password change, account deactivation, or explicit logout.
- Unlimited concurrent sessions per person by default (configurable post-MVP).

## 4. Data Security

### 4.1 Encryption at Rest
- **Database**: AES-256 encryption enabled (RDS/Aurora encryption or Cloud SQL CMEK).
- **Backups**: Encrypted with same key.
- **File storage**: AES-256 for any uploaded files (branding logos).
- **Key management**: Cloud KMS / AWS KMS with automatic key rotation (annual).
- Customer-managed key (CMK) support for enterprise tenants.

### 4.2 Encryption in Transit
- TLS 1.3 minimum for all external-facing endpoints.
- mTLS for inter-service communication.
- Certificate management via Let's Encrypt (auto-renewal) or cloud provider CA.
- HSTS header: `Strict-Transport-Security: max-age=31536000; includeSubDomains`

### 4.3 Data Masking
- Audit logs never contain raw password hashes (separate table).
- Password reset tokens not logged.
- Personal data masked in application logs (PII redaction).
- Payment data: not relevant (no billing in v1), but if added, PCI-DSS scope applies.

## 5. Secret Management
- All secrets (database passwords, API keys, encryption keys) stored in vault service (HashiCorp Vault / AWS Secrets Manager).
- Secrets never committed to version control.
- Environment-specific secrets managed per deployment environment.
- Secrets rotated automatically (90-day rotation for service keys, annual for master keys).

## 6. Audit & Monitoring

### 6.1 Immutable Audit Log
As specified in the data model: HMAC-chained, append-only audit_entries table.
- Every resource CRUD operation logged.
- Read access logged in HIPAA mode.
- Authentication events logged (login, logout, failed attempts, password reset).
- Audit log integrity verified daily (recompute hash chain, alert on mismatch).

### 6.2 Monitoring & Alerting

| Alert | Threshold | Response |
|---|---|---|
| Failed login burst | >10/IP in 5 min | Block IP, alert security team |
| API error rate spike | >5% errors in 5 min | Page on-call engineer |
| Audit log hash mismatch | Any mismatch | Incident response (potential tampering) |
| Database connection pool exhaustion | >80% utilization | Scale up, investigate leak |
| Unusual data export | Single person exported >3x in 24h | Alert company admin |
| Out-of-hours admin access | Person with admin role logs in 2am-5am local | Log, optional alert |

### 6.3 Incident Response
1. **Detection**: Automated alert or manual report.
2. **Triage**: Determine severity (SEV1: data breach, SEV2: availability, SEV3: minor).
3. **Containment**: Isolate affected component, revoke compromised credentials.
4. **Eradication**: Remove root cause (deploy fix, rotate keys).
5. **Recovery**: Restore from backup if necessary, verify integrity.
6. **Post-mortem**: Root cause analysis, remediation plan, stakeholder notification.

## 7. Dependency Security
- All dependencies scanned with Snyk/Dependabot on every PR.
- Weekly full dependency audit.
- Critical vulnerabilities (CVSS 9+) patched within 24 hours.
- High vulnerabilities (CVSS 7+) patched within 7 days.
- Lock files (package-lock.json, etc.) committed to prevent supply chain attacks.
- Regular review of dependency tree for unnecessary or deprecated packages.

## 8. Software Development Lifecycle (SDLC) Security

### 8.1 Secure Coding Standards
- All code follows OWASP Secure Coding Practices (input validation, output encoding, authentication, session management, access control, cryptographic practices, error handling, data protection, communication security).
- Language-specific style guides enforced via linters (ESLint for TypeScript/JavaScript, etc.).
- Static Application Security Testing (SAST) runs on every PR (e.g., CodeQL, Semgrep).
- Secrets detection (e.g., truffleHog, GitLeaks) prevents credentials in code.

### 8.2 Threat Modeling
- Required for any feature that introduces new data flows, stores, or processing logic.
- Methodology: STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege).
- Threat models documented, reviewed by security lead, stored in compliance repository.
- Findings tracked and remediated before production release.

### 8.3 Code Review Process
- Every code change requires a pull request with at least one reviewer.
- Reviewers check for: security vulnerabilities, correct use of RBAC/RLS, proper input validation, logging of sensitive operations, adherence to secure coding standards.
- Review checklist enforced via PR template.
- Security-sensitive changes (auth, encryption, access control, data handling) require a second reviewer.

### 8.4 Pre-Production Scanning

| Scan Type | Tool | Timing | Action on Findings |
|---|---|---|---|
| SAST (Static Analysis) | CodeQL, Semgrep | Every PR | Block merge on High+ findings |
| Dependency scanning | Dependabot, Snyk | Every PR + weekly | Block merge on Critical |
| Container scanning | Trivy, Clair | Every build | Block deploy on High+ |
| Infrastructure as Code scanning | Checkov, tfsec | Every IaC PR | Block merge on High+ |
| Secret scanning | GitLeaks, truffleHog | Every commit (pre-push hook) | Block push on any finding |

### 8.5 Staging Environment
- All code deployed to staging before production.
- Staging mirrors production configuration (but uses anonymized/synthetic data — no real PHI/PII).
- Integration and E2E tests run against staging before production release.
- Staging environment is isolated from production data and networks.

## 9. Asset Management

### 9.1 Asset Inventory
An asset register is maintained covering:

| Asset Category | Examples | Owner | Classification |
|---|---|---|---|
| Hardware | Cloud compute instances, load balancers | Cloud provider (managed) | N/A (cloud-managed) |
| Software | Application code, libraries, monitoring tools | Engineering | Internal |
| Data | Person profiles, schedules, clock records, audit logs | Engineering / Security | Confidential / Restricted |
| Services | Cloud infrastructure, email delivery, monitoring | DevOps | Internal |
| Credentials | API keys, database passwords, encryption keys | Security | Restricted |

### 9.2 Asset Lifecycle
- **Procurement**: All cloud resources provisioned via IaC with tagging (owner, environment, cost center).
- **Operation**: Assets monitored for security vulnerabilities, configuration drift, and proper licensing.
- **Decommissioning**: Upon decommission, data is securely deleted (see `04-HIPAA.md` §7 for disposal), access revoked, and asset removed from inventory.
- **Inventory review**: Full inventory reconciled quarterly; any orphaned or unapproved assets flagged and remediated.

### 9.3 Data Asset Classification

| Classification | Definition | Examples | Handling Requirements |
|---|---|---|---|
| Public | No harm if disclosed | Marketing content, job titles | No restrictions |
| Internal | Limited harm if disclosed but not intended for public | Team structures, feature flags, internal documentation | Access controlled by role |
| Confidential | Significant harm if disclosed | Person profiles, schedules, clock records, company configs | Encrypted at rest, RBAC-scoped, audit logged |
| Restricted | Severe harm if disclosed; regulatory penalties | Password hashes, encryption keys, session tokens, PHI | All Confidential controls + MFA required, access on need-to-know basis, enhanced logging |

## 10. Third-Party Risk Management

### 10.1 Vendor Onboarding
All third-party services handling data go through a risk assessment process:

1. **Identification**: Catalog all third-party services used by the application.
2. **Tier assignment**: Determine risk tier (see `03-SOC2.md` §5).
3. **Assessment**: Collect and review security documentation (SOC 2, ISO 27001, security questionnaire, DPA/BAA).
4. **Approval**: Security lead must approve Tier 1 and Tier 2 vendors.
5. **Contract**: Ensure contract includes: confidentiality, security measures, breach notification SLA, data deletion on termination, right to audit, compliance with applicable regulations.
6. **Onboarding**: Integration follows secure configuration best practices (least privilege API keys, network isolation).

### 10.2 Ongoing Monitoring
- Annual security review for all Tier 1 vendors.
- Monitor vendor security advisories and breach notifications.
- Review vendor SOC 2 reports annually (or at least every 12 months).
- Track vendor SLA compliance and uptime.

### 10.3 Vendor Offboarding
- Revoke all API keys and access tokens.
- Request confirmation of data deletion from vendor.
- Document offboarding in vendor register.
- Verify no residual data flow to offboarded vendor.

### 10.4 Sub-Processor Disclosure
- Current sub-processor list published and available to tenant companies.
- Tenant companies notified 30 days before adding or changing a sub-processor.
- Sub-processors must meet same security and compliance standards as RosterApp.

## 11. Business Continuity & Disaster Recovery
Refer to `07-incident-response-plan.md` and `04-HIPAA.md` §6 for contingency planning. The BCP/DR plan covers:

- **RTO (Recovery Time Objective)**: 4 hours for critical systems.
- **RPO (Recovery Point Objective)**: 5 minutes (PITR-based).
- **Critical systems**: Database, application servers, authentication service, API gateway.
- **DR testing**: Annual failover drill with documented results.
- **Emergency operations**: Offline manual procedures documented for critical workflows (clock-in, schedule viewing).

## 12. Penetration Testing
- Annual third-party penetration test.
- Quarterly internal vulnerability scan.
- Bug bounty program (post-v1).
- Remediation SLA: Critical 48h, High 7 days, Medium 30 days.

## 13. Compliance Mapping

| Control | GDPR | CCPA | SOC 2 | HIPAA |
|---|---|---|---|---|
| Encryption at rest | ✓ | ✓ | ✓ | ✓ |
| Encryption in transit | ✓ | ✓ | ✓ | ✓ |
| RBAC | ✓ | | ✓ | ✓ |
| RLS multi-tenant | ✓ | | ✓ | ✓ |
| Audit log | ✓ | | ✓ | ✓ |
| Incident response | ✓ | | ✓ | ✓ |
| Data retention | ✓ | ✓ | ✓ | ✓ |
| Access reviews | | | ✓ | ✓ |
| Security training | | | ✓ | ✓ |
| BAA | | | | ✓ |
| Breach notification | ✓ | ✓ | ✓ | ✓ |