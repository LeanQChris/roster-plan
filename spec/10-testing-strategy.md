# Testing Strategy

## 1. Test Pyramid

```
         ╱╲
        ╱ E2E ╲
       ╱───────╲
      ╱Integration╲
     ╱─────────────╲
    ╱   Unit Tests   ╲
   ╱──────────────────╲
```

| Layer | % of Tests | Speed | Dependencies | Purpose |
|-------|-----------|-------|-------------|---------|
| Unit | 70% | ms/ea | None/mocked | Business logic, validation, RBAC, RRULE expansion |
| Integration | 20% | s/ea | DB, email mock | API endpoints, DB queries, RLS, triggers |
| E2E | 10% | m/ea | Full stack | Critical user flows |

## 2. Unit Tests

### 2.1 Scope
- RRULE expansion logic (edge cases: DST, leap year, monthly 31st)
- Permission/authorization checks
- Validation schemas (input validation)
- Error code mapping
- Date/timezone utility functions
- Email template rendering
- RBAC hierarchy logic
- Conflict detection (overlap, overtime, rest period)

### 2.2 Requirements
- Zero DB connections
- All external dependencies mocked
- Run on every commit (< 30s total)
- Framework: vitest (TypeScript) or pytest (Python)

### 2.3 Coverage Targets
| Area | Target |
|------|--------|
| Business logic (RRULE, conflict detection) | 100% |
| Validation schemas | 100% |
| Auth / RBAC middleware | 90% |
| Utility functions | 90% |
| Overall project | 80% |

## 3. Integration Tests

### 3.1 Scope
- Every API endpoint (happy path + error cases)
- Database RLS policies (cross-tenant isolation)
- Audit trigger (HMAC chain, append-only enforcement)
- Clock entry immutability triggers
- Session auth flow (login, token validation, expiry, logout)
- Invite flow (create person, accept invite)
- Shift publish flow (expand + insert)
- Pagination correctness

### 3.2 Infrastructure
- Ephemeral PostgreSQL instance (Docker via testcontainers) per test suite
- Run migrations before tests
- Reset DB between test suites (truncate all tables)
- Run on PR to main, CI only (not on every commit)

### 3.3 Key Scenarios to Cover

| Scenario | What It Tests |
|----------|--------------|
| Cross-tenant data isolation | Company A cannot see Company B's data via any endpoint |
| RBAC enforcement | Employee role cannot access manager endpoints |
| RRULE expansion | Template with `FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR` generates correct instances |
| Overlapping shift detection | Assigning same person to overlapping shifts returns `SHIFT_CONFLICT` |
| Audit chain integrity | Hash chain verification script passes |
| Append-only clock | UPDATE/DELETE on clock_entries throws trigger exception |
| Session expiry | Request with expired token returns 401 |
| Pagination meta | `?page=2&limit=10` returns correct `has_next` and `total` |
| RLS bypass attempt | Query with wrong `company_id` returns empty set, not error |

## 4. E2E Tests

### 4.1 Scope
- Critical user flows (as defined in `docs/04-mvp-plan.md`)
- Login → publish schedule → employee views it

### 4.2 Flows to Cover

| # | Flow | Steps |
|---|------|-------|
| 1 | Company signup → setup → invite → employee accepts | Full onboarding cycle |
| 2 | Manager creates template → publishes → assigns → employee sees | Core scheduling loop |
| 3 | Company admin edits settings → people → teams | Admin CRUD |
| 4 | Auth failure paths (bad password, expired token, unauthorized endpoint) | Security |

### 4.3 Requirements
- Full stack: API server + DB + frontend (or API contract tests if no frontend)
- CI only (not on every commit)
- Run against staging environment post-deploy
- Framework: Playwright (frontend + API) or supertest (API-only)

## 5. CI Pipeline Stages

```
Push / PR
  │
  ├─ Lint (2m)       ← ESLint / Ruff / Prettier
  ├─ Type check (2m)  ← tsc / mypy
  ├─ Unit tests (1m)  ← vitest / pytest (no DB)
  │
  └── All green? ──► PR can merge

Merge to main
  │
  ├─ Integration tests (8m)  ← ephemeral DB
  │
  └── All green? ──► Deploy to staging

Tagged release
  │
  ├─ E2E tests (10m)  ← against staging
  │
  └── All green? ──► Deploy to production
```

## 6. Performance Testing (MVP+)

| Test | Tool | Threshold |
|------|------|-----------|
| RRULE expansion for 1 year | Benchmark | < 500ms for 100 templates |
| Shift query with filters | k6 | p95 < 200ms at 100 req/s |
| Audit log insert | k6 | p95 < 50ms at 50 writes/s |
| Clock-in concurrent (100 users) | k6 | p95 < 1s, no errors |
| Calendar export | k6 | p95 < 500ms at 10 req/s |
| Load: 1000 concurrent users | k6 | Error rate < 0.1% |

## 7. Test Data Strategy

- Factories / builders for all entities (company, team, person, shift, etc.)
- Seeded test data: 3 companies, 5 teams each, 20 people each, 50 shifts
- Fixtures for specific scenarios (DST transition, leap year, overtime threshold)
- No production data in test environments

## 8. Quality Gates

| Gate | Blocking? | When |
|------|-----------|------|
| Lint passes | ✅ | Every commit |
| Type check passes | ✅ | Every commit |
| Unit tests pass | ✅ | Every commit |
| Integration tests pass | ✅ | PR merge to main |
| E2E tests pass | ✅ | Tagged release |
| Coverage >= 80% | ❌ (warning) | PR merge |
| No security hotspots | ✅ (critical only) | PR merge |
| Performance regression | ❌ (warning) | Tagged release |
