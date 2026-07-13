# Development Guide

## Prerequisites

- Node.js 20+ (TypeScript backend) or Python 3.11+
- PostgreSQL 16+ with `pgcrypto` and `citext` extensions
- Docker (optional, for local PostgreSQL)

## Local Setup

### 1. Clone and navigate

```bash
git clone <repo-url> && cd roster
```

### 2. Start PostgreSQL

Using Docker:
```bash
docker run -d \
  --name roster-db \
  -e POSTGRES_PASSWORD=roster_dev \
  -e POSTGRES_DB=roster_dev \
  -p 5432:5432 \
  postgres:16-alpine
```

Or use your local PostgreSQL instance and create the database:
```bash
createdb roster_dev
```

### 3. Enable extensions

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;
```

### 4. Run migrations

```bash
# When implemented — apply db/02-schema.sql
psql -d roster_dev -f db/02-schema.sql
```

### 5. Configure environment

Copy `.env.example` to `.env` and fill in values.

### 6. Start dev server

```bash
# Backend (TypeScript)
npm install && npm run dev

# Backend (Python)
pip install -r requirements.txt && uvicorn app.main:app --reload

# Frontend
cd client && npm install && npm run dev
```

## Project Conventions

- All timestamps in UTC (PostgreSQL `TIMESTAMPTZ`); timezone conversion in the frontend
- UUID primary keys via `gen_random_uuid()`
- Row-Level Security on every data table, scoped by `company_id`
- VARCHAR limits enforced at DB level (never trust client-side)
- Audit logging: immutable, HMAC-chained, append-only triggers

## Codebase Layout (when implemented)

```
├── server/            API server
│   ├── src/
│   │   ├── routes/    Endpoint handlers
│   │   ├── middleware/ Auth, RBAC, tenant, validation
│   │   ├── services/  Business logic
│   │   └── db/        Migrations, queries
│   └── tests/
├── client/            React frontend
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   └── lib/
│   └── tests/
└── shared/            Shared types, constants
```

## Testing

See [Testing Strategy](spec/10-testing-strategy.md).

| Layer | Tool | Run on |
|-------|------|--------|
| Unit | vitest / pytest | Every commit |
| Integration | vitest + testcontainers | PR merge |
| E2E | Playwright | Tagged release |

## CI/CD Pipeline

```yaml
# Every commit: lint → typecheck → unit tests
# PR merge: integration tests → deploy staging
# Tagged release: E2E tests → deploy production
```

See [Architecture](spec/07-architecture.md) §4 for pipeline details.

## Branch Strategy

- `main` — stable, deploys to staging
- `feat/*` — feature branches, merged via PR
- `fix/*` — bug fixes
- Tags (e.g., `v0.1.0`) trigger production deploys
