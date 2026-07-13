# Calendar & Export Specification

## 1. iCal (.ics) Export

### 1.1 Standard Compliance
- All .ics output must comply with **RFC 5545**.
- Each file contains one `VCALENDAR` component with `PRODID:-//RosterApp//EN`.
- Each shift is one `VEVENT` component.
- Recurring shifts use `RRULE` within `VEVENT` — do NOT expand into individual events.
- Exception instances (cancelled or rescheduled) use `EXDATE` or `RECURRENCE-ID`.
- **Time-off events** are included as separate `VEVENT` components with `TRANSP:TRANSPARENT` (free time, not blocking the calendar).

### 1.2 VEVENT Structure
```
BEGIN:VEVENT
UID:shift-uuid@rosterapp.com
DTSTAMP:20260709T120000Z
DTSTART;TZID=America/New_York:20260715T080000
DTEND;TZID=America/New_York:20260715T160000
RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;INTERVAL=1
SUMMARY:Morning Support - Alice Smith
DESCRIPTION:Front-line support shift. Team: Engineering. Position: RN.
LOCATION:Portland Downtown Clinic - 123 Main St
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
```

### 1.3 Time-Off VEVENT Structure
```
BEGIN:VEVENT
UID:timeoff-uuid@rosterapp.com
DTSTAMP:20260709T120000Z
DTSTART;VALUE=DATE:20260801
DTEND;VALUE=DATE:20260808
SUMMARY:Vacation - Alice Smith
DESCRIPTION:Type: vacation. Approved by: John Manager.
STATUS:CONFIRMED
TRANSP:TRANSPARENT
END:VEVENT
```
Time-off events use `VALUE=DATE` (all-day) and `TRANSP:TRANSPARENT` so they don't block calendar time slots.

### 1.4 Position & Skill Metadata
The `DESCRIPTION` field includes structured metadata:
- Position held for this shift (e.g. "Registered Nurse")
- Location name and address
- Required skills for this shift instance
- Manager name and contact (optional, configurable)

### 1.5 Timezone Handling
- Each `VEVENT` uses `TZID` parameter referencing a `VTIMEZONE` component.
- A full `VTIMEZONE` block for each distinct timezone in the export is included in the `VCALENDAR`.
- If the viewer's timezone differs, their calendar application handles conversion.

### 1.6 File Generation
- Endpoint: `GET /api/v1/people/:personId/calendar.ics`
- Accepts `?from=YYYY-MM-DD&to=YYYY-MM-DD` query params (defaults: current month ± 3 months)
- Accepts `?include_time_off=true` to include time-off blocks (default: true)
- Generates on demand, not cached (small payload — single person's shifts).
- Response header: `Content-Type: text/calendar; charset=utf-8`
- Response header: `Content-Disposition: attachment; filename="roster-{personId}.ics"`

---

## 2. Webcal Subscription

### 2.1 Secret URL Model
- Each person gets a unique, opaque subscription token generated at first request.
- Token is a random 64-character hex string (cryptographically random via `crypto.randomBytes`).
- URL format: `webcal://{company-slug}.rosterapp.com/api/v1/people/{personId}/webcal.ics?token={token}`

### 2.2 Token Management
- Token stored in `people.subscription_token` (nullable).
- Generate on first webcal request if null.
- Person can rotate token via UI → sets new random value, invalidating old URL.

### 2.3 Caching & Polling
- Calendar apps typically poll every 2–4 hours.
- Use `ETag` header (SHA256 hash of generated .ics body).
- Return `304 Not Modified` if `If-None-Match` matches.
- Caching layer: in-memory / Redis with TTL of 1 hour.

### 2.4 Endpoint
- `GET /api/v1/people/:personId/webcal.ics?token={token}`
- Produces same .ics format as downloadable endpoint.
- No `Content-Disposition: attachment` (rendered inline by calendar app).

---

## 3. Google Calendar Direct Sync (MVP+)

### 3.1 Push Integration
- Company admin connects Google Calendar via OAuth 2.0.
- Integration stores refresh token in `integrations.config` (encrypted).
- On shift assignment, change, or cancellation, the system **pushes** an event to the employee's Google Calendar via the Google Calendar API.
- On time-off approval, creates a "busy" block in the employee's Google Calendar.

### 3.2 Pull Integration
- Optionally, the system can **pull** events from the employee's Google Calendar (work calendar) to detect conflicts.
- Pulled external events are not stored in the roster database — they are computed on the fly when viewing the schedule and shown as "busy" blocks (greyed out).

### 3.3 Event Sync Rules
| Trigger | Action |
|---|---|
| Shift assigned | Create/update event on Google Calendar |
| Shift cancelled | Delete event from Google Calendar |
| Shift time changed | Update event start/end |
| Time-off approved | Create all-day "Out of Office" event |
| Employee unassigned | Delete event |

### 3.4 Configuration
- Integration stored in `integrations` table with `type = 'google_calendar'`.
- Config fields: `client_id`, `refresh_token`, `calendar_id` (default: primary).
- Consent scope: `https://www.googleapis.com/auth/calendar.events`.
- Token refresh handled automatically (5xxx errors trigger re-auth notification).

---

## 4. PDF Printable Schedule (MVP+)

### 4.1 Weekly PDF
- Endpoint: `GET /api/v1/teams/:teamId/schedule.pdf`
- Query params: `?week_start=2026-07-13`
- Renders a weekly grid: 7 columns (Mon-Sun), time rows, shift blocks with assigned names.
- Header: Team name, week range, generated date.
- Footer: Legend (colors by position), total scheduled hours per person.
- Paginated if team has more than ~20 people.
- Response: `Content-Type: application/pdf`, inline display.

### 4.2 Layout
```
                    Engineering - Week of Jul 13, 2026
┌────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│        │ Mon 13   │ Tue 14   │ Wed 15   │ Thu 16   │ Fri 17   │ Sat 18   │
├────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ 08:00  │ Morning  │ Morning  │ Morning  │ Morning  │ Morning  │          │
│        │ Support  │ Support  │ Support  │ Support  │ Support  │          │
│        │ Alice    │ Alice    │ Alice    │ Bob      │ Bob      │          │
│        │ Bob      │ (open)   │ (open)   │ Carol    │ Carol    │          │
├────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ 16:00  │ Evening  │ Evening  │          │          │          │          │
│        │ Carol    │ Dave     │          │          │          │          │
└────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
Total hours: Alice 40h, Bob 32h, Carol 24h, Dave 8h
```

---

## 5. Calendar API (JSON)

Used by the web frontend — not for external consumption.

### GET /api/v1/shifts
Query parameters:
- `team_id` (optional, defaults to all teams the user can see)
- `person_id` (optional, filter by person)
- `location_id` (optional, filter by location)
- `position_id` (optional, filter by position)
- `start` (ISO 8601 datetime, required)
- `end` (ISO 8601 datetime, required)
- `timezone` (viewer's IANA timezone, e.g. "Europe/Berlin")
- `include_time_off` (boolean, default false)
- `include_external_conflicts` (boolean, default false — Google Calendar pull)

Response:
```json
{
  "shifts": [
    {
      "id": "uuid",
      "title": "Morning Support",
      "start_at": "2026-07-15T08:00:00-04:00",
      "end_at": "2026-07-15T16:00:00-04:00",
      "timezone": "America/New_York",
      "viewer_timezone": "Europe/Berlin",
      "start_at_viewer": "2026-07-15T14:00:00+02:00",
      "end_at_viewer": "2026-07-15T22:00:00+02:00",
      "assigned_people": [{ "id": "uuid", "name": "Alice Smith", "position": "Registered Nurse" }],
      "position": "Registered Nurse",
      "location": "Portland Downtown Clinic",
      "team_name": "Engineering",
      "status": "published",
      "is_clocked_in": true,
      "required_skills": ["CPR Certified"]
    }
  ],
  "time_off": [
    {
      "person_id": "uuid",
      "person_name": "Alice Smith",
      "type": "vacation",
      "start_at": "2026-08-01T00:00:00Z",
      "end_at": "2026-08-07T23:59:59Z",
      "status": "approved"
    }
  ],
  "external_conflicts": [
    {
      "start_at": "2026-07-15T10:00:00Z",
      "end_at": "2026-07-15T11:00:00Z",
      "summary": "Team Standup",
      "source": "google_calendar"
    }
  ],
  "meta": {
    "timezone": "Europe/Berlin",
    "offset": "+02:00",
    "total_count": 42
  }
}
```

The server returns both the event's native timezone and the viewer-local time so the frontend can show the toggle without recalculating.

---

## 6. Timezone Toggle UX (Web Frontend)

Calendar views have a timezone toggle dropdown with 3 options:
1. **Local** (browser-detected, default)
2. **Person's timezone** (per shift — shows shift's native TZ)
3. **Company timezone** (company default)

Implementation:
- All times stored in UTC in database.
- Server returns `start_at` in UTC + `timezone` (shift's IANA zone).
- Server returns `start_at_viewer` pre-computed in viewer's requested timezone.
- Frontend switches which field it renders without re-fetching.

Rule of thumb: When a shift spans a DST transition, the calendar app must handle it; the server always stores UTC and relies on the IANA timezone identifier for correct conversion.