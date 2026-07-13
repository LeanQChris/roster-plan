# Data Residency Strategy

## 1. Overview
Data residency (also called data sovereignty) requires that certain data remains within specific geographic boundaries. For a global roster application, this means companies in the EU may require data to stay in the EU, while US healthcare companies may require data in the US.

This document defines a **multi-region data residency architecture** that supports per-company region pinning while keeping a single logical schema.

## 2. Requirements

| Region | Regulation | Data Residency Requirement |
|---|---|---|
| EU/EEA | GDPR | Personal data must stay in EU/EEA or adequacy-safeguarded |
| US | HIPAA, CCPA | PHI must stay in US; CCPA has no hard residency requirement but best practice |
| UK | UK GDPR | Same as EU GDPR |
| Canada | PIPEDA | Data may leave Canada with safeguards |
| Australia | Privacy Act (APPs), NDB | No hard residency requirement, but APP 8 imposes accountability for cross-border transfers |

## 3. Architecture Decision: Multi-Region Database with Regional Shards

> **Phase:** D (post-MVP). MVP runs in a single region. The following design is captured for future implementation.

### Chosen Model: **Regional sharding by company_id hash**
Each company is assigned to a geographic region at creation time based on their headquarters or declared data residency setting.

```
Global Load Balancer
        │
        ├── EU Region (eu-west-1, eu-central-1)
        │   └── Roster DB (eu companies)
        │
        ├── US Region (us-east-1, us-west-2)
        │   └── Roster DB (us companies, hipaa companies)
        │
        └── APAC Region (ap-southeast-1)
            └── Roster DB (apac companies)
```

### 3.1 How routing works
- Company creation accepts a `data_residency_region` parameter (or auto-detects from company timezone).
- The company record is stored with its region in the **global routing table** (a lightweight, region-agnostic DB or configuration store).
- When the application serves a request for company X:
  1. Read from routing table: `company_x → region: eu-west-1`
  2. Connect to the appropriate regional database pool
  3. Execute all queries for that request on that pool
- Application servers are deployed in all regions; each application instance can connect to any regional DB pool.

### 3.2 What gets routed
- **Company-scoped data**: All tables with `company_id` are routed to the company's assigned region.
- **Global data**: Minimal. A `region_routing` table, deployment config, and any cross-region admin tooling.

### 3.3 Database per region
Each region has a full, independent PostgreSQL instance (or cluster):
- Same schema (run migrations in every region)
- Separate connection pool
- Separate backup chain
- Separate encryption keys (regional KMS)

## 4. Region Assignment

### 4.1 Rules
| Company HQ / Declaration | Assigned Region |
|---|---|---|
| EU/EEA/UK | `eu-west-1` |
| US + any HIPAA company | `us-east-1` |
| Australia | `ap-southeast-2` (AWS Sydney) |
| APAC (other) | `ap-southeast-1` |
| Undeclared | Closest region based on company default timezone |

### 4.2 Changing Regions
If a company moves HQ or needs to change regions:
1. Company admin requests region migration.
2. Application exports company data from source region.
3. Imports into destination region (with downtime window or dual-write sync).
4. Updates routing table → new requests go to destination.
5. Old region data retained for 30-day rollback window, then deleted.

## 5. Cross-Region Considerations

| Concern | Solution |
|---|---|
| **Global reporting** (super admin) | Super admin tooling connects to all regions and aggregates results |
| **Webcal/iCal for employees moving** | Subscription is per-person; person's region = their company's region |
| **Backup / DR** | Each region has independent backup chain. Cross-region DR backups (encrypted) for catastrophic failure |
| **Email notifications** | Cloud email service (SES, SendGrid) processes email from any region; no data residency conflict (email headers may contain names, no PHI) |
| **API latency for remote employees** | Application servers deployed in each region → employee connects to nearest app server → app server routes to correct DB region |

## 6. HIPAA Data Residency
- HIPAA data must physically remain in the United States.
- All companies with `hipaa_enabled = true` are force-pinned to `us-east-1` or `us-west-2`.
- US-based database infrastructure is FedRAMP-authorized (AWS GovCloud option for highest compliance).
- Database encryption: AES-256 with customer-managed AWS KMS keys stored in US region.

## 7. GDPR Data Residency
- All EU-assigned companies:
  - Data stored in `eu-west-1` or `eu-central-1`.
  - No personal data leaves the EU for processing.
  - Sub-processors (email service) must be GDPR-compliant with DPA.
  - Support staff access to EU data only from EU-based workstations or with explicit contractual safeguards (Standard Contractual Clauses).

## 8. Implementation Notes

### 8.1 Routing Table
```sql
CREATE TABLE region_routing (
    company_id  UUID PRIMARY KEY,
    region      VARCHAR(20) NOT NULL,  -- e.g. 'eu-west-1', 'us-east-1', 'ap-southeast-1'
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 8.2 Application Connection Pool
Each region's database pool is initialized at app startup. The router selects the pool based on the current request's company:
```ts
function getPool(companyId: string): Pool {
    const region = regionRoutingTable[companyId];  // cached in Redis
    return regionPools[region];
}
```

### 8.3 Caching
- Redis instance per region (co-located with compute).
- Cache keys include region prefix to avoid collisions.
- No cross-region cache sharing.

### 8.4 Deployment
- Application deployed to each region via CI/CD.
- Database migrations run against all regions sequentially (migration runner iterates region list).
- Feature flags and config pushed to all regions via central config service.

## 9. Data Classification Scheme

### 9.1 Classification Levels
| Level | Definition | Examples | Handling |
|---|---|---|---|
| **Public** | No harm if disclosed | Company name, job title, location name | No restrictions |
| **Internal** | Not intended for public, limited harm | Team names, shift template names, feature flags | Access controlled, no encryption required |
| **Confidential** | Significant harm if disclosed | Person names, email addresses, shift assignments, clock times, role assignments | Encrypted at rest, RBAC-scoped, audit-logged, least-privilege access |
| **Restricted** | Regulatory penalties for breach | Password hashes, MFA secrets, encryption keys, session tokens, PHI (HIPAA mode) | All Confidential controls + MFA to access, enhanced logging, access on explicit need-to-know, key rotation |

### 9.2 Classification by Data Type

| Data Type | Classification | Notes |
|---|---|---|
| Person name, email | Confidential | Direct identifier, GDPR/CCPA personal data |
| Shift assignment | Confidential | Reveals work pattern |
| Clock-in/out times | Confidential | Reveals presence |
| Password hash | Restricted | Never logged, stored with bcrypt |
| Session token | Restricted | Stored hashed in DB |
| Encryption key | Restricted | In vault/KMS, never in code |
| Audit log entry | Confidential | Contains actor, action, resource |
| Company config | Internal | Team names, location names |
| Feature flags | Internal | Not sensitive |
| Deployment config | Internal | No secrets if IaC is separate from secret store |

## 10. Cross-Border Transfer Mechanisms

| Scenario | Mechanism | Documentation Required |
|---|---|---|
| EEA → EEA | No transfer needed — data stays in EU region | N/A |
| EEA → Adequacy jurisdiction | Adequacy decision reference | List of adequacy decisions, review status |
| EEA → Non-adequate third country | Standard Contractual Clauses (2021 EU SCCs) + Transfer Impact Assessment (TIA) | Signed SCCs, completed TIA, supplementary measures documentation |
| EEA → US (general) | Data Privacy Framework (DPF) if recipient is certified; otherwise SCCs + TIA | DPF certification verification or SCCs + TIA |
| UK → EEA | UK adequacy decision (separate from EU) | UK adequacy reference |
| UK → Non-adequate third country | UK International Data Transfer Agreement (IDTA) or EU SCCs + UK Addendum | Signed IDTA or EU SCCs + UK Addendum |
| US → US (HIPAA data) | No cross-border transfer — data stays in US region | N/A |

### 10.1 Transfer Logging
All cross-border transfers are logged with:
- Source region and destination region
- Legal mechanism relied upon
- Date of transfer
- Volume of records transferred
- Controller company and processor contact

## 11. Employee Mobility (Cross-Region Movement)

> **Phase:** D (post-MVP). MVP assigns data residency at company level only.

When an employee relocates to a different region:

1. **Profile update**: Employee's timezone and location fields updated by company admin.
2. **Data residency impact**: The employee's personal data is tied to the **company's** assigned region, not the employee's location. The company's region assignment determines data storage location.
3. **Exception**: If the company has a policy of pinning data to the employee's region:
   - New region assignment requires a data migration.
   - Existing data remains in source region (historical retention).
   - New data (shifts, clock entries post-relocation) stored in the employee's new region.
   - Migration follows same process as company region change (§4.2).
4. **GDPR implications**: If an EEA employee relocates outside the EEA but the company is EU-based, data remains in EU region. If the employee moves into the EEA from outside, the company region determines storage.

## 12. Sub-Processor Residency Cascade

Sub-processors used by RosterApp may themselves use sub-processors in different regions:

| Service | Primary Region | Sub-Processor Regions | Safeguards |
|---|---|---|---|
| Cloud infrastructure (AWS/GCP/Azure) | Customer-configurable | Global; configurable via data residency settings | Contractual restrictions to region, provider SOC 2, DPA |
| Email delivery (SendGrid/SES) | US | Global; cannot restrict region | SCCs for EU-originating data, data minimization (no PHI in email), DPA |
| Database (PostgreSQL) | Per-company region | None (directly managed) | N/A |
| CDN | Global edge | Edge nodes in all regions | No PII/PHI served through CDN; static assets only |
| Monitoring / APM | US | US, EU | Configured to not receive PII; data masking in log shipping |

### 12.1 Due Diligence
- For each sub-processor, confirm they maintain DPAs/SCCs with their own sub-processors.
- Review and update sub-processor list annually.
- Notify tenant companies of any sub-processor changes 30 days in advance.