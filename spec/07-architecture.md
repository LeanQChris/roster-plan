# Architecture & Deployment Specification

## 1. High-Level Architecture

```
                         ┌─────────────┐
                         │   DNS / CDN  │
                         │ (CloudFront) │
                         └──────┬──────┘
                                │
                         ┌──────▼──────┐
                         │   ALB / NLB  │
                         │  (TLS 1.3)   │
                         └──────┬──────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
             ┌───────▼───────┐       ┌───────▼───────┐
             │  API Server   │       │  API Server   │
             │  (Node/Python)│       │  (Node/Python)│
             └───────┬───────┘       └───────┬───────┘
                    │                       │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │     PostgreSQL        │
                    │   (Primary + RLS)     │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │     Read Replica      │
                    │  (reporting, export)  │
                    └───────────────────────┘
```

### Components

| Component | Tech | Purpose |
|-----------|------|---------|
| CDN | CloudFront / Cloudflare | Static assets, caching |
| Load Balancer | ALB / NLB | TLS termination, routing, health checks |
| API Server | Node.js/TypeScript or Python | REST API, business logic, RBAC middleware |
| PostgreSQL | AWS RDS / Aurora / GCP CloudSQL | Primary data store with RLS |
| Read Replica | Same as primary | Reporting, calendar export, audit log queries |
| Redis (MVP+) | ElastiCache / Memorystore | Session cache, rate limiter, webcal ETag cache |
| Email Service | SendGrid / SES / Resend | Transactional email delivery |
| Queue (MVP+) | SQS / RabbitMQ | Async email delivery, webhook dispatch |

## 2. Request Flow (Multi-Tenancy Context Propagation)

```
1. Client sends:  Authorization: Bearer <session_token>
                  Host: acme-corp.rosterapp.com

2. ALB terminates TLS, forwards to API server

3. Auth Middleware:
   a. Extract token from Authorization header
   b. SELECT person_id FROM sessions WHERE token_hash = SHA256(token)
      AND expires_at > NOW() AND revoked_at IS NULL
   c. If not found → 401
   d. If found → load person + company from DB
   e. Set: req.user = person, req.companyId = person.company_id

4. Tenant Middleware:
   a. Verify req.companyId matches any company-slug in the URL
   b. For company-scoped endpoints, set PostgreSQL session variable:
      SET app.current_company_id = req.companyId;
   c. This feeds into RLS policies

5. RBAC Middleware:
   a. Read req.user.role
   b. Compare against endpoint's required permission/role
   c. If insufficient → 403 FORBIDDEN

6. Route Handler:
   a. Execute business logic
   b. All DB queries filtered by RLS (company_id scope)
   c. Audit trigger logs the change
   d. Return response
```

### RLS Policy Pattern

```sql
CREATE POLICY tenant_isolation ON shifts FOR ALL
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY manager_read_team ON shifts FOR SELECT
    USING (
        company_id = current_setting('app.current_company_id')::UUID
        AND (
            current_setting('app.current_user_role') = 'company_admin'
            OR team_id IN (
                SELECT id FROM teams WHERE manager_id = current_setting('app.current_user_id')::UUID
            )
        )
    );
```

The `app.current_*` variables are set in middleware per request. Using `SET LOCAL` (transaction-scoped) to avoid connection pool leakage.

## 3. Environment Strategy

| Environment | Purpose | DB | Deploy Trigger |
|-------------|---------|----|----------------|
| `dev` | Local development | Local PostgreSQL | Manual |
| `staging` | Integration testing | Shared RDS instance | Merge to `main` |
| `prod` | Production | Production RDS + replica | Tagged release |

- Database migrations run as part of the deploy pipeline, before the new app version starts
- Migrations are backward-compatible (no destructive changes without a multi-step plan)
- Rollback: deploy previous app version + run revert migration (if applicable)

## 4. CI/CD Pipeline (MVP)

```
Push to branch → GitHub Actions
  ├─ Lint (ESLint / Ruff)
  ├─ Type check (tsc / mypy)
  ├─ Unit tests (vitest / pytest)
  ├─ Build (tsc / build)
  ├─ Integration tests (against ephemeral DB)
  └─ Deploy to staging (if main branch)

Tagged release →
  ├─ Run migrations against prod DB
  ├─ Deploy new app version to prod ASG
  └─ Health check (3 consecutive successful pings)
```

## 5. Database Architecture

- **Connection pooling**: PgBouncer or built-in pool (max 25 connections per instance)
- **Migrations**: `node-pg-migrate` or `alembic` — timestamped, sequential, idempotent
- **Read replica**: Used for reporting, export, and audit log queries (offload from primary)
- **Backup**: Daily automated snapshots (7-day retention), WAL archiving for PITR (30-day)
- **Extensions required**: `pgcrypto`, `citext`

## 6. Caching Strategy

| Cache | What | TTL | Invalidation |
|-------|------|-----|-------------|
| Webcal ETag | .ics file SHA256 hash | 1 hour | On shift assignment change for person |
| Schedule query | Team schedule for a week | 5 minutes | On publish/assignment change |
| People list | Active people for a team | 1 minute | On person create/update/delete |
| Company settings | Company config | 5 minutes | On company settings update |

- Cache-aside pattern: app checks cache, if miss → query DB → populate cache
- Redis used for distributed cache (MVP+; in-memory for single-instance MVP)

## 7. Monitoring & Alerting (MVP+)

| Metric | Threshold | Action |
|--------|-----------|--------|
| API p50 latency | > 500ms | Alert on-call |
| API p99 latency | > 3s | Alert on-call |
| Error rate | > 1% of requests | Alert on-call |
| 5xx responses | > 0.1% | Alert on-call |
| Audit log writes | < 50ms p95 | Log warning |
| DB connections | > 80% of pool | Scale up |

## 8. Deployment Topology (MVP)

- Single region (us-east-1 or eu-west-1)
- 2 API instances in different AZs (minimal HA)
- Single PostgreSQL instance (no replica for MVP)
- All services in a single VPC with private subnets for DB
- Weekly deploy window (Wednesday 10am UTC)

Multi-region deployment is Phase D (see `compliance/06-data-residency.md`).
