# ADR 004: HMAC-SHA256 Chained Audit Log

**Status:** Accepted  
**Date:** 2026-07-13

## Context

The audit log must be tamper-evident to satisfy SOC 2, HIPAA, and GDPR requirements. An auditor must be able to detect any retrospective modification or deletion of audit entries.

## Decision

Implement an HMAC-SHA256 hash chain on the `audit_entries` table.

- Each entry stores a `prev_hash` (SHA256 of the previous entry for that company) and a `hash` (SHA256 of the current entry's content + prev_hash)
- Hash includes: `prev_hash || resource_type || resource_id || action || old_values || new_values || created_at`
- HMAC key stored in PostgreSQL config (`roster.hmac_key`), set at the database level
- Triggers prevent UPDATE and DELETE on `audit_entries`
- The first entry for each company uses `prev_hash = 0x00...00` (64 zeroes)
- Clock entries are also append-only but do not use HMAC chaining (immutability via triggers only)

## Consequences

- **Positive**: Any tampering breaks the hash chain, detectable by re-computing hashes
- **Positive**: Append-only triggers ensure no entries can be deleted or modified
- **Negative**: HMAC key must be securely managed and rotated
- **Negative**: Slightly more complex DB schema with the hash chain logic
- **Negative**: Insert performance impact (sequential dependency on previous hash)

## Verification Process

1. Read entries ordered by `created_at ASC` for a company
2. Recompute each hash
3. Compare with stored `hash`
4. Verify each entry's `prev_hash` matches previous entry's `hash`
