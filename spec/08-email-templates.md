# Email Template Catalog

## 1. Infrastructure

- Provider: SendGrid / SES / Resend (MVP: single provider, synchronous send)
- Queue: MVP sends inline in request; MVP+ uses SQS/RabbitMQ
- Templates: Server-rendered HTML + plain-text fallback
- Bounce handling: Webhook from provider updates `notifications.status`

## 2. Email Catalog

### 2.1 Welcome / Invite

| Field | Value |
|-------|-------|
| **Trigger** | `POST /api/v1/people` — person created with `status = 'invited'` |
| **To** | Invited person's email |
| **Subject** | `You're invited to {company_name} on Roster` |
| **Variables** | `company_name`, `inviter_name`, `accept_link`, `team_name` |
| **Template** | |
```
Hi {name},

{inviter_name} has invited you to join {company_name} on Roster.

Team: {team_name}

Click the link below to set up your account and view your schedule:
{accept_link}

This link expires in 7 days.

— The Roster Team
```
| **Notes** | `accept_link` includes a one-time token: `https://{slug}.rosterapp.com/accept-invite?token={token}` |

### 2.2 Shift Assigned

| Field | Value |
|-------|-------|
| **Trigger** | `POST /api/v1/shifts/:shiftId/assign` — assignment created |
| **To** | Assigned person's email |
| **Subject** | `Shift assigned: {shift_title} — {date}` |
| **Variables** | `name`, `shift_title`, `date`, `start_time`, `end_time`, `team_name`, `location_name` |
| **Template** | |
```
Hi {name},

You've been assigned to the following shift:

  {shift_title}
  {date} | {start_time} - {end_time}
  {team_name}{location_name}

View your full schedule:
{schedule_link}

— The Roster Team
```

### 2.3 Shift Changed (MVP+)

| Field | Value |
|-------|-------|
| **Trigger** | `PATCH /api/v1/shifts/:shiftId` — shift time/title changes while person is assigned |
| **To** | All assigned people |
| **Subject** | `Shift updated: {shift_title} — {date}` |
| **Variables** | `name`, `shift_title`, `date`, `old_start`, `new_start`, `old_end`, `new_end`, `changes` |
| **Template** | |
```
Hi {name},

Your assigned shift has been updated:

  {shift_title} — {date}
  Time changed from {old_start}-{old_end} to {new_start}-{new_end}

View updated schedule: {schedule_link}

— The Roster Team
```

### 2.4 Shift Cancelled (MVP+)

| Field | Value |
|-------|-------|
| **Trigger** | `DELETE /api/v1/shifts/:shiftId` — shift deleted with active assignments |
| **To** | All assigned people |
| **Subject** | `Shift cancelled: {shift_title} — {date}` |
| **Variables** | `name`, `shift_title`, `date`, `start_time`, `end_time` |
| **Template** | |
```
Hi {name},

The following shift has been cancelled:

  {shift_title}
  {date} | {start_time} - {end_time}

Please check your schedule for any updates: {schedule_link}

— The Roster Team
```

### 2.5 Schedule Published (MVP+)

| Field | Value |
|-------|-------|
| **Trigger** | `POST /api/v1/teams/:teamId/schedules/publish` — schedule published for a range |
| **To** | All team members with assignments in the published range |
| **Subject** | `Schedule published: {team_name} — {week_range}` |
| **Variables** | `name`, `team_name`, `week_range`, `shift_count`, `schedule_link` |
| **Template** | |
```
Hi {name},

The schedule for {team_name} has been published for {week_range}.

You have {shift_count} shift(s) that week.

View your schedule: {schedule_link}

— The Roster Team
```

### 2.6 Shift Reminder (MVP+)

| Field | Value |
|-------|-------|
| **Trigger** | Scheduled job runs 60 minutes (configurable) before each shift start |
| **To** | Assigned person |
| **Subject** | `Reminder: {shift_title} starts in {lead_minutes} minutes` |
| **Variables** | `name`, `shift_title`, `date`, `start_time`, `end_time`, `team_name`, `location_name` |
| **Notes** | Respects `notification_preferences` per person |

### 2.7 Daily Digest (MVP+)

| Field | Value |
|-------|-------|
| **Trigger** | Scheduled job runs daily at configured time (default 6pm in company TZ) |
| **To** | All active people with shifts the next day |
| **Subject** | `Your schedule for tomorrow ({date})` |
| **Variables** | `name`, `shifts` (array of title, time, team) |

### 2.8 Time-Off Status (MVP+)

| Field | Value |
|-------|-------|
| **Trigger** | `PATCH /api/v1/time-off/:requestId/approve` or `/deny` |
| **To** | Requestor |
| **Subject** | `Time-off {status}: {type} — {date_range}` |

### 2.9 Swap Status (MVP+)

| Field | Value |
|-------|-------|
| **Trigger** | Swap request accepted/denied or manager decision |
| **To** | Both involved employees |
| **Subject** | `Shift swap {status}: {shift_title} — {date}` |

## 3. Notification Preferences

Each person can opt in/out per type + channel via `notification_preferences` table:

```json
[
  { "type": "shift_assigned", "channel": "email", "enabled": true },
  { "type": "shift_reminder", "channel": "email", "enabled": true },
  { "type": "daily_digest",   "channel": "email", "enabled": false },
  { "type": "schedule_published", "channel": "email", "enabled": true }
]
```

Default: all email notifications enabled on person creation.

## 4. Delivery Rules

- All transactional emails include an unsubscribe link (required by CAN-SPAM)
- Bounce handling: after 3 bounces from same address, mark `notifications.status = 'bounced'` and suppress future sends
- Rate limit: max 20 emails per person per hour (enforced by queue)
- MVP sends synchronously; on failure, log error and return success to user (shift is saved regardless)
- MVP+: async queue with exponential backoff (3 retries: 5s, 60s, 30m)
