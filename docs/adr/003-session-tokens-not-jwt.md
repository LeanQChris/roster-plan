# ADR 003: Session Tokens Stored in Database (Not JWT)

**Status:** Accepted  
**Date:** 2026-07-13

## Context

The app needs authenticated sessions. Common approaches are JWT (stateless) or database-stored tokens (stateful).

## Decision

Use database-stored session tokens for MVP.

- Login generates a random 64-char base64url token, stores SHA256 hash in `sessions` table
- Token sent to client, passed via `Authorization: Bearer` header
- Middleware looks up hash in DB on every request
- Sessions expire after 7 days; extended by 7 days on use within 24h of expiry
- No refresh tokens for MVP (session sliding extension is sufficient)
- Sessions can be revoked individually or by user

## Consequences

- **Positive**: Immediate session invalidation (logout, admin revoke, password change)
- **Positive**: No JWT signing key to manage or rotate
- **Positive**: Unlimited concurrent sessions with easy management
- **Negative**: Database lookup on every authenticated request (mitigated by index on `token_hash`)
- **Negative**: Slightly more complex than JWT for distributed systems (every request must reach the DB)

## Alternatives Considered

- **JWT**: Stateless, no DB lookup, but cannot revoke individual sessions without a blocklist (which adds DB dependency anyway)
- **OAuth 2.0 / OpenID Connect**: Too heavy for MVP, consider for Phase D (SSO)
