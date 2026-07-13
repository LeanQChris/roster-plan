# RBAC & Authentication Skill

## When to use
Load this skill when implementing auth flows, session management, RBAC middleware, permission checks, or multi-tenant security.

## Key references
- `spec/02-rbac-matrix.md` — full role/permission matrix, enforcement layers, MVP simplification
- `spec/06-session-management.md` — token model, session creation, invalidation, security
- `spec/07-architecture.md` — request flow, tenant middleware, RLS context propagation
- `db/02-schema.sql` — `sessions`, `people`, `password_reset_tokens` tables

## Auth model

### Session tokens (not JWT)
- Random 64-char string (`crypto.randomBytes(48)` → base64url)
- Stored in DB as SHA256 hash — raw token never persisted
- No refresh tokens for MVP (session lasts 7 days, extended on use within 24h of expiry)
- Returned in response body (not httpOnly cookie) for MVP
- Unlike JWT, this allows server-side invalidation

### Authentication flow
```
Request → Authorization: Bearer <token>
  → SELECT FROM sessions WHERE token_hash = SHA256(token)
    AND expires_at > NOW() AND revoked_at IS NULL
  → If found: set req.user, req.companyId; extend expiry if within 24h
  → If not: 401 UNAUTHORIZED
```

### Session invalidation
| Scenario | Mechanism |
|---|---|
| Logout | `sessions.revoked_at = NOW()` |
| Admin revokes user | Revoke all sessions for person_id |
| Password change | Revoke all except current |
| Token theft detected | Revoke all sessions |
| Account deletion | Cascade delete via FK |

## RBAC model

### MVP roles (simplified)
3 roles hardcoded in middleware — no `role_permissions` join table:
```typescript
const roleHierarchy = {
    employee: 0,
    manager: 1,
    company_admin: 2,
};
// A user with role X can access any endpoint requiring role <= X.
```

### Full roles (post-MVP)
| Role | Scope | Level |
|---|---|---|
| `super_admin` | Global (all tenants) | 3 |
| `company_admin` | Single company | 2 |
| `manager` | Team(s) | 1 |
| `employee` | Self | 0 |
| `viewer` | Team(s), read-only | 0 |

### Three-layer enforcement
1. **Database RLS** — default-deny, scoped by `company_id` on every table
2. **Application middleware** — auth → tenant → RBAC middleware chain
3. **Frontend** — route guards and component-level visibility

### MVP simplifications
- No viewer or super_admin UI
- super_admin exists in DB only, no UI screens
- Permissions hardcoded in middleware, not in a join table
- employee = most restricted; manager inherits employee + team mgmt; company_admin inherits all

## Password handling
- bcrypt with cost 12
- Password reset tokens: 15-min expiry, stored as SHA256 hash
- Rate limiting: 5 attempts/min per IP, 20 attempts/hour per email

## Concurrent sessions
- Default: unlimited
- HIPAA mode: max 3 concurrent per person (oldest revoked on new login)
