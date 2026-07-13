# CCPA & CPRA Compliance Plan

## 1. Applicability
The California Consumer Privacy Act (CCPA), as amended by the **California Privacy Rights Act (CPRA)** effective January 1, 2023, applies to for-profit businesses that:
- Collect California residents' personal information, AND
- Have annual gross revenue > $25M, OR
- Buy/sell/share PI of 100,000+ consumers/households, OR
- Derive 50%+ of revenue from selling or sharing PI.

The roster app itself may not meet these thresholds initially, but we design for compliance proactively so companies using the app for their California employees are covered.

## 2. Consumer Rights (CCPA + CPRA)

| Right | Implementation |
|---|---|
| **Right to Know** (1798.110) | `/api/v1/people/:id/export` returns all PI categories collected |
| **Right to Delete** (1798.105) | `DELETE /api/v1/people/:id` — same as GDPR erasure |
| **Right to Correct** (1798.106 — CPRA) | `PATCH /api/v1/people/:id` — same as GDPR rectification |
| **Right to Opt-Out of Sale/Share** (1798.120) | **We do not sell or share PI.** Opt-out form published. |
| **Right to Limit Use of Sensitive PI** (1798.121 — CPRA) | Sensitive PI is not collected (see §3). If added, "Limit Use" toggle in preferences. |
| **Right to Non-Discrimination** (1798.125) | No difference in service for exercising rights |

## 3. Categories of Personal Information Collected

| Category | Collected? | Examples |
|---|---|---|
| Identifiers | Yes | Name, email, IP address |
| Employment information | Yes | Role, team, schedule, clock times |
| Internet/electronic activity | Yes | User agent, session logs |
| Geolocation | No | (Not collected in v1 — no GPS) |
| Biometric | No | |
| Sensitive PI (CPRA-defined) | **No** | (Explicitly avoided) |

**Note on Sensitive PI**: CPRA defines a separate "sensitive personal information" category including precise geolocation, race/ethnicity, health data, and union membership. None of these are collected by the roster app for normal operation. If a company adds custom fields that could capture this data, they must flag it in company settings and the app must provide a "Limit Use of Sensitive PI" mechanism.

## 4. Sale and Sharing of Information
**We do not sell or share personal information.** CCPA's "sale" includes sharing for cross-context behavioral advertising. CPRA expands "sharing" to include any disclosure for cross-context behavioral advertising. The roster app has no advertising, no data brokers, and no third-party data sharing. A "Do Not Sell or Share My Personal Information" page is published as a standard compliance measure.

### 4.1 Opt-Out Preference Signal (GPC)
- The app honors the **Global Privacy Control (GPC)** browser signal as a valid opt-out request.
- Implementation: GPC header detection in middleware, logged in audit entries. Deferred to post-MVP.

## 5. Data Retention & Deletion
Same retention schedule as GDPR (see GDPR document §4). CCPA/CPRA requires:
- Deletion within **45 days** of verified request (with possible 45-day extension).
- Right to correct within **45 days** of verified request.
- Service provider must flow down deletion to its own records.

## 6. CCPA/CPRA-Specific Requirements

### 6.1 Notice at Collection
A privacy notice displayed before or at the point of data collection:
- Categories of PI collected
- Purposes of collection
- Contact for questions
- Whether PI is sold or shared (we do not)
- Retention period (or criteria)

### 6.2 Consumer Request Verification
- For account holders: authenticate via existing session.
- For non-account holders: verify identity via email confirmation + knowledge-based verification.
- Requests logged in audit entries with `resource_type = 'ccpa_request'`.
- **Metrics**: Annual disclosure of number of requests received, complied with (in whole/part), and denied, with average response time (CPRA §1798.130(a)(3)(F)).

### 6.3 Service Provider vs. Contractor (CPRA)
- **Service provider**: Processes PI on behalf of the business per written contract. Cannot retain/use PI except as specified.
- **Contractor**: Similar but provides services directly to the business (not subject to same CCPA restrictions on use).
- RosterApp operates as a **service provider** to its tenant companies — contractually prohibited from retaining, using, or disclosing PI for any purpose other than providing the scheduling service.
- Contract terms must include: (a) processing instructions, (b) no sale/sharing of PI, (c) flow-down of deletion/correction requests, (d) right for the business to take reasonable steps to verify compliance.

### 6.4 Authorized Agent
Support for authorized agents submitting requests on behalf of a consumer:
- Accept agent's written authorization and identity verification via email.
- Require verification that the agent is authorized to act (e.g., signed permission from the consumer).
- CPRA allows business to deny agent request if agent cannot provide proof of authorization.

## 7. Annual Metrics Reporting
CPRA requires businesses to disclose metrics on consumer requests for the preceding calendar year:

| Metric | Tracking Implementation |
|---|---|
| Number of Right to Know requests received | Count from audit_entries with `resource_type = 'ccpa_request'` and `action = 'access'` |
| Number complied with (in whole or part) | Audit trail of successful responses |
| Number denied | Audit trail of denied requests + reason |
| Median days to respond | Compute from audit log timestamps |
| Number of Right to Delete requests received | Count from audit_entries with `resource_type = 'ccpa_request'` and `action = 'delete'` |
| Number of Right to Correct requests | Count from audit_entries with `resource_type = 'ccpa_request'` and `action = 'correct'` |

Metrics published annually in the privacy policy or via separate disclosure.

## 8. Service Provider Agreements
- Written contract with each tenant company defining scope of processing.
- Contractually prohibited from: selling PI, sharing PI for cross-context behavioral advertising, retaining/using PI beyond service delivery.
- Must flow down deletion and correction requests from the business (tenant company) to all sub-processors.
- Right for tenant company to take reasonable and appropriate steps to ensure RosterApp uses PI consistent with business' obligations.

## 9. CCPA + GDPR Overlap
A single "Delete My Data" workflow satisfies both GDPR and CCPA/CPRA. The export endpoint serves both GDPR data portability and CCPA right-to-know. The correction endpoint serves both GDPR rectification and CPRA right-to-correct. We treat the stricter requirement where overlaps exist.