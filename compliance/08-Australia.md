# Australian Privacy Compliance Plan

## 1. Applicability

### 1.1 Governing Law
The **Privacy Act 1988 (Cth)** sets out the **Australian Privacy Principles (APPs)** — 13 principles governing the collection, use, disclosure, storage, and disposal of personal information. Enforcement is by the **Office of the Australian Information Commissioner (OAIC)**.

The **Notifiable Data Breaches (NDB) scheme** (Part IIIC of the Privacy Act) mandates notification when a data breach is likely to result in serious harm.

### 1.2 Who Must Comply
The Privacy Act applies to:
- Organizations with annual turnover > **$3 million AUD** (most business customers will exceed this)
- All private sector health service providers (regardless of turnover)
- All operators of residential tenancy databases
- Businesses trading in personal information (regardless of turnover)

Since the roster app is a multi-tenant SaaS platform:
- **Tenant companies (employers)** using the app are likely APP entities subject to obligations.
- **The platform provider** is a service provider handling personal information on behalf of APP entities and must comply when acting as a contracted service provider.

### 1.3 Employee Records Exemption
The Privacy Act contains an exemption for **employee records** — records directly related to current or former employment relationship and held by the employer. This means:
- **For the employer**: Employee schedule, clock, and payroll data handled within the employment context is generally exempt from APPs 1-13.
- **However**: The NDB scheme (breach notification) **still applies** to employee records.
- **For the platform provider**: As a third-party processor, the exemption may not apply to the platform's own handling practices. The platform should still comply as a best practice.

## 2. Australian Privacy Principles (APPs) — Mapping

| APP | Requirement | Implementation |
|---|---|---|
| **APP 1** — Open & transparent management | Privacy policy must describe how personal info is managed | Privacy policy published at `/privacy-policy` covering: types of info collected, purposes, how collected, disclosure practices, access/correction rights, complaint process |
| **APP 2** — Anonymity & pseudonymity | Individuals must have option to deal anonymously (where practicable) | Not practicable for a scheduling app (requires identity); exception noted in privacy policy |
| **APP 3** — Collection of solicited info | Only collect info reasonably necessary for function/activity | Data minimization: only collect fields required for scheduling (name, email, role, timezone, schedule data) |
| **APP 4** — Unsolicited info | Must destroy or de-identify unsolicited personal info if could not have been collected under APP 3 | Log unsolicited data, determine if lawful to collect, otherwise destroy within 30 days, log action in audit |
| **APP 5** — Notification of collection | Must notify individual of collection details at or before time of collection | In-app notification at signup + privacy policy link; covers: purpose, consequences of non-collection, access rights, complaints process |
| **APP 6** — Use or disclosure | Only use/disclose for primary purpose of collection (with exceptions for consent, health/safety, etc.) | Schedule data used only for scheduling, time tracking, reporting. No secondary uses without consent. |
| **APP 7** — Direct marketing | Only use personal info for direct marketing if: consented, or reasonable expectation, and opt-out provided | No marketing in v1. If added, opt-out required in every communication. |
| **APP 8** — Cross-border disclosure | Before disclosing overseas, must ensure recipient has substantially similar protections OR individual consents | See §5 below for full cross-border strategy |
| **APP 9** — Government identifiers | Cannot adopt government identifiers (TFN, Medicare) as own identifiers | Not applicable — app uses UUIDs, not government IDs |
| **APP 10** — Quality | Must take reasonable steps to ensure personal info is accurate, up-to-date, and complete | Person profile CRUD with validation; audit log of changes; periodic data quality review |
| **APP 11** — Security | Must take reasonable steps to protect personal info from misuse, interference, loss, unauthorized access, modification, or disclosure | See `05-security.md` — encryption, RBAC, RLS, audit logging, access controls, incident response |
| **APP 12** — Access | Must give individual access to their personal info on request | `GET /api/v1/people/:id` — same as GDPR access right |
| **APP 13** — Correction | Must correct personal info on request (or provide reasons for refusal) | `PATCH /api/v1/people/:id` — same as GDPR rectification |

## 3. Key Differences from GDPR

| Area | GDPR | Australian Privacy Act |
|---|---|---|
| **Right to erasure** | Art. 17 — Right to be forgotten | No equivalent right to deletion. APP 13 covers correction only. Deletion is handled as reasonable security step (APP 11) but not a mandated right. |
| **Consent** | High bar, explicit consent required for most processing | Less strict — collection must be "reasonably necessary" for function. Consent is one basis but not always required. |
| **Breach notification** | 72 hours to supervisory authority | "As soon as practicable" — no fixed hour deadline. Must notify when likely to cause serious harm. |
| **DPO** | Mandatory for certain organizations | No requirement for a DPO |
| **Employee records** | No broad exemption | Broad exemption for employee records held by employer |
| **Cross-border** | SCCs, adequacy decisions, DPF | APP 8 — must ensure equivalent protections OR consent |
| **Enforcement** | Fines up to €20M or 4% of global revenue | Fines up to $2.5M AUD per breach (increasing under Privacy Act reforms) |
| **Data portability** | Art. 20 — right to data portability | No explicit portability right (though `GET /api/v1/people/:id/export` can be provided as a service) |

## 4. Notifiable Data Breaches (NDB) Scheme

### 4.1 Trigger
A breach is notifiable when:
1. There is unauthorized access to or disclosure of personal information (or loss that is likely to result in unauthorized access or disclosure), **AND**
2. It is likely to result in **serious harm** to any affected individual.

### 4.2 Serious Harm Assessment
Factors considered:
- Type and sensitivity of information (schedule data, clock times — moderate sensitivity)
- Whether information is protected by security measures
- Who has obtained or could obtain the information
- Nature of the harm (identity theft, financial, reputational, emotional)

### 4.3 Notification Requirements

| Recipient | Deadline | Method |
|---|---|---|
| **OAIC** | As soon as practicable after reasonable grounds to believe breach occurred | OAIC NDB form online |
| **Affected individuals** | As soon as practicable | Email (preferred) or other reasonable method |
| **Australian media** | If not practicable to notify individuals individually | Media outlet likely to reach affected individuals |

### 4.4 NDB Statement Content
1. Identity and contact details of the organization.
2. Description of the data breach.
3. Type of information concerned.
4. Recommendations about steps individuals should take in response.
5. OAIC details and recommended actions.

### 4.5 Assessment Period
- Organizations have **30 days** to assess whether a suspected breach is likely to result in serious harm.
- During assessment, the breach is not yet notifiable.
- Once assessed and found likely to cause serious harm, notification must occur "as soon as practicable."

## 5. Cross-Border Disclosure (APP 8)

### 5.1 Principle
Before disclosing personal information to an overseas recipient, the APP entity must take reasonable steps to ensure the recipient does not breach the APPs. If the recipient mishandles the data, the disclosing entity is accountable.

### 5.2 Application to RosterApp

| Scenario | APP 8 Compliance |
|---|---|
| Australian company using RosterApp, data stored in Australia | No cross-border disclosure — compliant |
| Australian company using RosterApp, data stored in US region | Cross-border disclosure applies — must ensure equivalent protections |
| Australian employee travels/relocates overseas | Employee's data follows company's region assignment — see §6 |

### 5.3 Compliance Mechanisms
- **Standard Contractual Clauses**: Include APP 8-equivalent protections in agreements with platform provider.
- **Consent**: Explicit consent from the individual after advising that APP 8 will not apply (higher risk, less preferable).
- **Data residency**: Assign Australian companies to an Australian region (`ap-southeast-2` or similar). No data leaves Australia = no APP 8 trigger.
- **SCCs for EU**: If an Australian company also has EU employees, GDPR transfer rules apply in addition (see `01-GDPR.md` §7).

## 6. Data Residency for Australia

### 6.1 Regional Recommendation
Australian companies should be assigned to `ap-southeast-2` (AWS Sydney) or equivalent Azure/GCP region.

### 6.2 Rationale
- Privacy Act does **not** mandate data stay in Australia, but APP 8 imposes accountability for cross-border transfers.
- Storing data in Australia eliminates APP 8 concerns.
- Lower latency for Australian users.
- Some Australian government and enterprise customers may require Australian data residency.

### 6.3 If Data Must Leave Australia
- Obtain consent from each individual (with full disclosure of the overseas location and that APP 8 will not apply).
- Or ensure the overseas recipient has equivalent protections (contractual + security assessment).
- Document the APP 8 assessment for each cross-border transfer.

## 7. Enforcement & Penalties

| Violation | Maximum Penalty |
|---|---|
| Serious or repeated interference with privacy | $2.5M AUD per breach |
| Higher penalties under consideration in Privacy Act reform | Currently proposed: the greater of $50M, 3x value of benefit, or 30% of turnover |
| NDB scheme failure to notify | $2.5M AUD |

## 8. Privacy Act Reform (Upcoming)
The Australian government has proposed significant reforms including:
- Removal or narrowing of the employee records exemption.
- Increased penalties (see §7).
- A statutory tort for serious invasions of privacy.
- Direct right of action for individuals (currently complaints go through OAIC).
- Stronger automated decision-making protections.

**Recommendation**: Monitor reform progress. The employee records exemption removal would mean all employee scheduling data is fully covered by APPs.

## 9. Implementation Checklist

- [ ] Privacy policy drafted to meet APP 1 (covers all required content, published at `/privacy-policy`)
- [ ] Data collection mapped to APP 3 requirements (only fields reasonably necessary for scheduling)
- [ ] Unsolicited information handling procedure documented (APP 4)
- [ ] Collection notices implemented at signup and data collection points (APP 5)
- [ ] Use and disclosure mapped to primary purposes only (APP 6)
- [ ] Direct marketing compliant (opt-out provided, if applicable) (APP 7)
- [ ] Cross-border disclosure assessment completed (APP 8) — see §5
- [ ] Government identifier policy documented (APP 9 — not applicable)
- [ ] Data quality procedures in place (APP 10 — validation, correction)
- [ ] Security controls implemented per `05-security.md` (APP 11)
- [ ] Access request process documented and tested (APP 12)
- [ ] Correction request process documented and tested (APP 13)
- [ ] NDB response plan integrated with `07-incident-response-plan.md` (NDB notification template, assessment procedure)
- [ ] Australian data residency region configured (if required)
- [ ] OAIC complaint handling process documented
- [ ] Monitoring Privacy Act reforms for impact on employee records exemption

## 10. Related Documents
| Document | Relevance |
|---|---|
| `01-GDPR.md` | GDPR applies if Australian company also has EU employees |
| `05-security.md` | APP 11 security implementation |
| `06-data-residency.md` | Data residency strategy — add `ap-southeast-2` region |
| `07-incident-response-plan.md` | NDB scheme integrated into incident response |
