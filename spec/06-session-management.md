# Session Management Specification

## 1. Token Model

### 1.1 Session Token
- Generated at login, refresh, or magic-link verification
- Random 64-character string (`crypto.randomBytes(48)` → base64url, 64 chars)
- Stored in DB as SHA256 hash (raw token never persisted)
- Sent to client in response body and stored client-side (localStorage or httpOnly cookie)

### 1.2 Refresh Token (MVP+)
- Generated alongside session token
- Random 64-character string, stored as SHA256 hash
- Single-use: rotated on each refresh, old hash invalidated
- Not included in MVP (session tokens last 7 days, extended on use)

### 1.3 Subscription Token (Webcal)
- Separate from auth tokens (see `03-calendar-export-spec.md`)
- 64-character hex string, stored in `people.subscription_token`
- Read-only scope (can only access calendar feed)

## 2. Token Lifetimes

| Token | Lifespan | MVP Value | Extension |
|-------|----------|-----------|-----------|
| Session token | Fixed duration | 7 days | Extended by 7 days on each API call within 24h of expiry |
| Refresh token | Longer fixed duration | N/A (MVP+) | N/A |
| Password reset | Short | 15 minutes | None |

## 3. Session Creation

On successful authentication (login, register, magic-link verify):

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "session_token": "abc...64chars...xyz",
  "user": { "id": "uuid", "email": "a@b.com", "name": "Alice", "role": "manager" },
  "company": { "id": "uuid", "slug": "acme-corp", "name": "Acme Corp" }
}
```

Server also creates a row in `sessions`:

```sql
INSERT INTO sessions (person_id, token_hash, ip_address, user_agent, expires_at, last_used_at)
VALUES ($1, SHA256($2), $3, $4, NOW() + INTERVAL '7 days', NOW());
```

## 4. Authentication Flow

```
Request → Authorization: Bearer <token>
  → Lookup SHA256(token) in sessions
  → If found AND expires_at > NOW() AND revoked_at IS NULL:
      → Set req.user, req.companyId from associated person
      → Extend expires_at +7d if within 24h of expiry
      → Update last_used_at
      → Proceed to route handler
  → Else: 401 UNAUTHORIZED
```

## 5. Token Rotation & Refresh (MVP+)

```
POST /api/v1/auth/refresh
{ "refresh_token": "..." }

→ Server validates SHA256(refresh_token) in sessions
→ Verifies not used before (single-use)
→ If valid: generate new session + refresh pair, invalidate old hashes
→ If already used: invalidate ALL sessions for this person (token theft detected)
```

## 6. Session Invalidation

| Scenario | Mechanism |
|----------|-----------|
| User logs out | `sessions.revoked_at = NOW()` for current session |
| Admin revokes user | `UPDATE sessions SET revoked_at = NOW() WHERE person_id = X` |
| Password change | Revoke all sessions except current one |
| Token theft detected | Revoke all sessions for the person |
| Session expiry | Natural expiry (query ignores expired rows) |
| Account deletion | Cascade delete sessions (FK) |
| MFA required but not completed | Session created with limited scope flag; full access granted after MFA verify |

## 7. Concurrent Session Policy

- **Default**: Unlimited concurrent sessions per person
- **HIPAA mode**: Max 3 concurrent sessions per person (enforced on login — oldest session revoked)
- **Future**: Configurable per-company limit via `company_settings`

## 8. Session Data in Responses

- `session_token` is returned in the response body (not in a cookie) for MVP
- httpOnly cookie option may be added post-MVP for XSS protection
- No `Set-Cookie` header in MVP

## 9. Security Considerations

| Concern | Mitigation |
|---------|------------|
| Token leakage | Tokens stored as SHA256 hash in DB; raw token only in transit and client memory |
| XSS | Consider httpOnly cookies post-MVP; sanitize all user input |
| CSRF | API uses `Authorization` header (not cookies), immune to CSRF |
| Replay | Tokens are static during their lifetime; TLS prevents interception |
| Token theft | Refresh token rotation detects stolen tokens (double-use → invalidate all) |
| Brute force login | Rate limit: 5 attempts/min per IP, 20 attempts/hour per email |
| Session fixation | New session on every login; no session ID in URL |
| Logout failure | Sessions have automatic expiry; configurable max lifetime enforced by DB query |

## 10. Session Cleanup

Background job runs daily:

```sql
DELETE FROM sessions WHERE expires_at < NOW() - INTERVAL '30 days';
DELETE FROM password_reset_tokens WHERE expires_at < NOW() - INTERVAL '7 days';
```

Expired-but-not-deleted sessions are filtered by the auth middleware (they don't need to be deleted immediately).
