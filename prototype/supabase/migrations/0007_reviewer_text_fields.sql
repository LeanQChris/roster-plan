-- reviewed_by / approved_by were modeled as uuid people FKs, but every
-- consumer call site passes a free-text reviewer display name (e.g.
-- "Company Admin", a manager's name) — never a person id. company_admin
-- accounts have no people row at all, so a people FK can never hold their
-- name. Switch both columns to plain text to match actual app semantics.

alter table leave_requests
  drop constraint leave_requests_reviewed_by_fkey;
alter table leave_requests
  alter column reviewed_by type text using reviewed_by::text;

alter table shift_assignments
  drop constraint shift_assignments_approved_by_fkey;
alter table shift_assignments
  alter column approved_by type text using approved_by::text;
