# Testing Strategy & CI/CD Skill

## When to use
Load this skill when writing tests, designing CI/CD pipelines, setting up quality gates, or planning test coverage for features.

## Key references
- `spec/10-testing-strategy.md` — full test pyramid, CI pipeline stages, quality gates
- `spec/07-architecture.md` — deployment topology, environment strategy, monitoring
- `docs/04-mvp-plan.md` — critical user flows for E2E tests

## Test pyramid

```
         ╱╲
        ╱ E2E ╲       10% — minutes/ea — Full stack
       ╱───────╲
      ╱Integration╲    20% — seconds/ea — API + DB
     ╱─────────────╲
    ╱   Unit Tests   ╲  70% — ms/ea — Mocked
   ╱──────────────────╲
```

### Unit tests (70%)
- Zero DB connections, all deps mocked
- Run on every commit (< 30s total)
- Framework: vitest (TypeScript) or pytest (Python)
- Targets: RRULE expansion, permission checks, validation schemas, date/timezone utils, conflict detection, RBAC logic

### Integration tests (20%)
- Ephemeral PostgreSQL (testcontainers) per suite
- Run migrations before tests, truncate between suites
- Run on PR to main (CI only, not every commit)
- Targets: every API endpoint (happy + error), RLS isolation, audit triggers, clock immutability, session auth, invite flow, publish flow, pagination

### E2E tests (10%)
- Full stack: API + DB + Frontend
- CI only (post-deploy to staging)
- Framework: Playwright or supertest
- Critical flows:
  1. Company signup → setup → invite → employee accepts
  2. Manager creates template → publishes → assigns → employee sees
  3. Company admin CRUD (settings, people, teams)
  4. Auth failure paths (bad password, expired token, unauthorized)

## CI/CD pipeline
```
Push/PR → Lint → Type check → Unit tests → (PR can merge)
Merge to main → Integration tests → Deploy to staging
Tagged release → E2E tests → Deploy to production
```

## Quality gates
| Gate | Blocking | When |
|---|---|---|
| Lint passes | ✅ | Every commit |
| Type check passes | ✅ | Every commit |
| Unit tests pass | ✅ | Every commit |
| Integration tests pass | ✅ | PR merge |
| E2E tests pass | ✅ | Tagged release |
| Coverage >= 80% | ❌ (warning) | PR merge |

## Coverage targets
- Business logic (RRULE, conflict detection): 100%
- Validation schemas: 100%
- Auth / RBAC middleware: 90%
- Utility functions: 90%
- Overall project: 80%

## Performance testing (MVP+)
- k6 for load testing
- Key thresholds: RRULE expansion < 500ms, shift query p95 < 200ms, audit insert p95 < 50ms, clock-in concurrent p95 < 1s

## Test data strategy
- Factories/builders for all entities
- Seeded data: 3 companies, 5 teams each, 20 people each, 50 shifts
- Fixtures for edge cases: DST transition, leap year, overtime threshold
- No production data in test environments
