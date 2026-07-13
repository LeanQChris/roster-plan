# Webhook / Integration Event Specification

> **Phase:** MVP+ (post-MVP). MVP sends transactional email synchronously with 2 templates (invite, shift assigned) and no webhook infrastructure.

## 1. Model

Webhooks deliver real-time event notifications to external services (Slack, Teams, Google Calendar, custom endpoints). Each integration is configured per-company via the Integrations API.

## 2. Event Catalog

| Event | Trigger | Payload Includes | Status |
|-------|---------|-----------------|--------|
| `shift.assigned` | Manager assigns person to shift | shift, assignment, person, team | MVP |
| `shift.unassigned` | Assignment removed | shift, person, reason | MVP |
| `shift.created` | Single shift created | shift, team | MVP |
| `shift.updated` | Shift time/title changed | shift (old + new), delta | MVP |
| `shift.cancelled` | Shift deleted or cancelled | shift, team, affected_assignments | MVP |
| `shift.published` | Schedule published for period | team, date_range, shift_count | MVP |
| `clock.in` | Employee clocks in | clock_entry, person, shift, location | MVP+ |
| `clock.out` | Employee clocks out | clock_entry, duration_minutes | MVP+ |
| `time_off.created` | Employee submits time-off | time_off_request, person | MVP+ |
| `time_off.approved` | Manager approves time-off | time_off_request, approver | MVP+ |
| `time_off.denied` | Manager denies time-off | time_off_request, reason, approver | MVP+ |
| `swap.requested` | Employee requests shift swap | swap_request, from_person, to_person, shift | MVP+ |
| `swap.resolved` | Manager approves/denies swap | swap_request, status | MVP+ |
| `compliance.violation` | System detects a violation | violation, person, shift, details | MVP+ |

## 3. Payload Format

All webhook payloads follow a standard envelope:

```json
{
  "event": "shift.assigned",
  "id": "evt_abc123def456",
  "version": "1.0",
  "created_at": "2026-07-09T12:00:00Z",
  "company_id": "uuid",
  "data": {
    "shift_id": "uuid",
    "shift_title": "Morning Support",
    "start_at": "2026-07-15T08:00:00Z",
    "end_at": "2026-07-15T16:00:00Z",
    "person_id": "uuid",
    "person_name": "Alice Smith",
    "person_email": "alice@acme.com",
    "team_id": "uuid",
    "team_name": "Engineering"
  }
}
```

### Envelope Fields

| Field | Type | Description |
|-------|------|-------------|
| `event` | string | Dot-notation event name from catalog |
| `id` | string | Unique event ID (prefix `evt_` + random). Idempotency key for receivers |
| `version` | string | Schema version of the payload `data` |
| `created_at` | ISO 8601 | When the event was generated |
| `company_id` | UUID | Tenant identifier |
| `data` | object | Event-specific payload |

## 4. Delivery

### 4.1 Transport
- HTTP POST to the configured webhook URL
- `Content-Type: application/json`
- Timeout: 10 seconds
- Max payload size: 128KB (events exceeding this truncate non-essential fields)

### 4.2 Signature Verification
Each request includes an `X-Roster-Signature` header:

```
X-Roster-Signature: t=1720512000,v1=abc123def456,v1=xyz789...
```

Algorithm:
1. Build string: `timestamp.payload` (timestamp = Unix seconds, payload = JSON body)
2. Compute HMAC-SHA256 using the integration's signing secret (config.webhook_secret)
3. Encode as hex

Receiver verification example (Node.js):
```typescript
import { createHmac, timingSafeEqual } from 'crypto';

function verifySignature(payload: string, signature: string, secret: string): boolean {
  const parts = signature.split(',');
  const timestamp = parts[0].slice(2);
  const sig = parts[1].slice(3);
  const expected = createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`)
    .digest('hex');
  return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}
```

### 4.3 Retry Policy

| Attempt | Delay | Notes |
|---------|-------|-------|
| 1 | 0s | Initial attempt |
| 2 | 10s | |
| 3 | 60s | |
| 4 | 5m | |
| 5 | 30m | |
| 6 (final) | 2h | |

- Retry on: HTTP 5xx, network error, timeout
- Do not retry on: HTTP 4xx (except 429 which retries with backoff)
- After 6 failures: integration marked as `last_error = "Max retries exceeded"`, `is_active` set to `false`
- Admin notified via email when integration is deactivated

### 4.4 Delivery Guarantees

- **At-least-once** delivery. Consumers must use event `id` for idempotency
- Events are persisted in an `event_delivery_log` table before transmission
- Events are delivered in order per company (FIFO per integration)
- Monitoring: delivery latency p50 < 5s, p99 < 60s

## 5. Management API

Refer to the Integrations API section in `01-api-spec.md`:

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/integrations` | List configured webhooks |
| `POST /api/v1/integrations` | Create webhook (type, url, secret, events filter) |
| `PATCH /api/v1/integrations/:id` | Update URL, secret, events filter |
| `DELETE /api/v1/integrations/:id` | Remove webhook |
| `POST /api/v1/integrations/:id/test` | Send test event to verify connectivity |

### Events Filter

When creating an integration, the `config` object may include an `events` filter:

```json
{
  "type": "slack",
  "name": "#shift-alerts",
  "config": {
    "webhook_url": "https://hooks.slack.com/...",
    "channel": "shift-alerts",
    "events": ["shift.assigned", "shift.cancelled", "shift.updated"]
  }
}
```

If `events` is omitted, all events are delivered. Wildcard patterns are not supported in MVP.

## 6. Event Delivery Log

```sql
CREATE TABLE event_delivery_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id  UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
    event_id        VARCHAR(64) NOT NULL,
    event_type      VARCHAR(50) NOT NULL,
    payload         JSONB NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',
    attempt         INTEGER NOT NULL DEFAULT 0,
    max_attempts    INTEGER NOT NULL DEFAULT 6,
    next_retry_at   TIMESTAMPTZ,
    last_error      TEXT,
    delivered_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (integration_id, event_id)
);
```

## 7. Rate Limits

- Per integration: 30 events/second burst, 300/minute sustained
- If exceeded, events are queued and delivered when rate drops
- No charge for failed deliveries (they don't count toward the rate limit)
