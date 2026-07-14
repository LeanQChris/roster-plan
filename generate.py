#!/usr/bin/env python3
"""Generate the Roster documentation site by concatenating template parts + data."""
import json, os, re

ROOT = "/Users/leanqdigital/Desktop/projects/roster"

def readfile(path):
    with open(path) as f:
        return f.read()

def parse_dbml(filepath):
    """Parse a DBML file into tables and refs for Mermaid ERD generation."""
    content = readfile(filepath)
    tables = {}
    # Match Table blocks: Table Name { ... }
    table_pattern = re.compile(r'Table (\w+) \{(.*?)\n\}', re.DOTALL)
    for m in table_pattern.finditer(content):
        tname = m.group(1)
        body = m.group(2)
        cols = []
        for line in body.split('\n'):
            line = line.strip()
            if not line or line.startswith('indexes') or line.startswith('Note:') or line.startswith('('):
                continue
            parts = line.split()
            if len(parts) < 2:
                continue
            col_name = parts[0]
            col_type = parts[1]
            attr_match = re.search(r'\[(.+?)\]', line)
            attrs = []
            if attr_match:
                attrs = [a.strip() for a in attr_match.group(1).split(',')]
            is_pk = 'pk' in attrs
            is_unique = 'unique' in attrs
            is_fk = any(a.startswith('ref:') for a in attrs)
            cols.append({'name': col_name, 'type': col_type, 'pk': is_pk, 'unique': is_unique, 'fk': is_fk})
        tables[tname] = cols
    # Parse Ref: lines at bottom
    refs = []
    for line in content.split('\n'):
        if line.startswith('Ref:'):
            rm = re.match(r'Ref:\s*(\w+)\.(\w+)\s*-\s*(\w+)\.(\w+)', line)
            if rm:
                from_t, from_c, to_t, to_c = rm.group(1), rm.group(2), rm.group(3), rm.group(4)
                from_is_pk = any(c['pk'] for c in tables.get(from_t, []) if c['name'] == from_c)
                refs.append({'from_table': from_t, 'from_col': from_c, 'to_table': to_t, 'to_col': to_c, 'from_is_pk': from_is_pk})
    return tables, refs

def mermaid_erd(tables, refs):
    """Generate Mermaid.js ERD diagram syntax from parsed DBML."""
    lines = ['erDiagram']
    for tname in sorted(tables.keys()):
        cols = tables[tname]
        lines.append(f'    {tname} {{')
        for c in cols:
            ann = []
            if c['pk']: ann.append('PK')
            if c['fk']: ann.append('FK')
            if c['unique'] and not c['pk']: ann.append('UK')
            ann_str = f' {" ".join(ann)}' if ann else ''
            lines.append(f'        {c["type"].lower()} {c["name"]}{ann_str}')
        lines.append('    }')
        lines.append('')
    for ref in refs:
        if ref['from_table'] in tables and ref['to_table'] in tables:
            card = '||' if ref['from_is_pk'] else 'o{'
            lines.append(f'    {ref["to_table"]} ||--{card} {ref["from_table"]} : ""')
    return '\n'.join(lines)

# Read all source files
src = {}
src['features'] = readfile(f"{ROOT}/docs/02-feature-breakdown.md")
src['stories'] = readfile(f"{ROOT}/docs/03-ux-user-stories.md")
src['mvp_plan'] = readfile(f"{ROOT}/docs/04-mvp-plan.md")
src['data_model'] = readfile(f"{ROOT}/db/01-data-model.md")
src['schema_sql'] = readfile(f"{ROOT}/db/02-schema.sql")

# Clean SQL for erd-editor (DDL only: CREATE TYPE + CREATE TABLE, no policies/indices/extensions)
clean_sql_lines = []
in_table = False
for _line in src['schema_sql'].split('\n'):
    s = _line.strip()
    if not s or s.startswith('--') or s.startswith('CREATE EXTENSION') or s.startswith('CREATE POLICY') or s.startswith('CREATE INDEX') or s.startswith('ALTER'):
        continue
    if s.startswith('CREATE TYPE') or s.startswith('CREATE TABLE'):
        in_table = s.startswith('CREATE TABLE')
        clean_sql_lines.append(s)
    elif in_table:
        clean_sql_lines.append(s)
        if s == ');':
            in_table = False
src['schema_sql_clean'] = '\n'.join(clean_sql_lines)
src['rrule'] = readfile(f"{ROOT}/db/03-rrule-storage.md")
src['api_spec'] = readfile(f"{ROOT}/spec/01-api-spec.md")
src['pagination'] = readfile(f"{ROOT}/spec/04-pagination.md")
src['webhooks'] = readfile(f"{ROOT}/spec/05-webhooks.md")
src['sessions'] = readfile(f"{ROOT}/spec/06-session-management.md")
src['calendar'] = readfile(f"{ROOT}/spec/03-calendar-export-spec.md")
src['architecture'] = readfile(f"{ROOT}/spec/07-architecture.md")
src['email'] = readfile(f"{ROOT}/spec/08-email-templates.md")
src['audit'] = readfile(f"{ROOT}/spec/09-audit-events.md")
src['testing'] = readfile(f"{ROOT}/spec/10-testing-strategy.md")
src['rbac'] = readfile(f"{ROOT}/spec/02-rbac-matrix.md")
src['glossary'] = readfile(f"{ROOT}/docs/05-glossary.md")

# Read ADR files
adr_files = {
    'adr-001': '001-use-postgresql-rls.md',
    'adr-002': '002-expand-on-publish.md',
    'adr-003': '003-session-tokens-not-jwt.md',
    'adr-004': '004-hmac-audit-chain.md',
    'adr-005': '005-rrule-storage-strategy.md'
}
for key, filename in adr_files.items():
    src[key] = readfile(f"{ROOT}/docs/adr/{filename}")

compliance_docs = {
    'gdpr': '01-GDPR.md', 'ccpa': '02-CCPA.md', 'soc2': '03-SOC2.md', 'hipaa': '04-HIPAA.md',
    'security': '05-security.md', 'residency': '06-data-residency.md',
    'incident': '07-incident-response-plan.md', 'australia': '08-Australia.md'
}
for key, filename in compliance_docs.items():
    src[key] = readfile(f"{ROOT}/compliance/{filename}")

# Parse enums from SQL
enums = []
for line in src['schema_sql'].split('\n'):
    m = re.match(r"CREATE TYPE (\w+) AS ENUM \((.+)\);", line.strip())
    if m:
        vals = [v.strip().strip("'") for v in m.group(2).split(',')]
        enums.append((m.group(1), vals))

# Parse table definitions from SQL
schema_tables = []
current_table = None
current_cols = []
for line in src['schema_sql'].split('\n'):
    s = line.strip()
    m = re.match(r"CREATE TABLE (\w+) \(", s)
    if m:
        if current_table:
            schema_tables.append({'name': current_table, 'columns': current_cols})
        current_table = m.group(1)
        current_cols = []
        continue
    if current_table:
        if s == ');':
            schema_tables.append({'name': current_table, 'columns': current_cols})
            current_table = None
            current_cols = []
            continue
        if s and not s.startswith('--') and not s.startswith('CREATE') and not s.startswith('ALTER') and not s.startswith('--'):
            if any(s.startswith(k) for k in ['CONSTRAINT', 'PRIMARY', 'UNIQUE', ')', ');']):
                continue
            col_name = s.split()[0] if s else ''
            if col_name and not col_name.startswith('--'):
                current_cols.append(s.rstrip(','))

if current_table and current_cols:
    schema_tables.append({'name': current_table, 'columns': current_cols})

# RLS data
rls_enabled = {t['name']: True for t in schema_tables}
rls_enabled['companies'] = False  # No RLS on companies table
no_company_id = ['position_skills', 'team_memberships', 'person_skills', 'template_skills',
                 'recurrence_rules', 'shift_skills', 'shift_assignments', 'shift_swap_requests',
                 'notification_preferences']
has_company_id = {t['name']: t['name'] not in no_company_id for t in schema_tables}

# MVP endpoints
mvp_endpoints = [
    'POST /api/v1/auth/register', 'POST /api/v1/auth/login', 'POST /api/v1/auth/logout',
    'GET /api/v1/companies/:id', 'PATCH /api/v1/companies/:id',
    'GET /api/v1/teams', 'POST /api/v1/teams', 'PATCH /api/v1/teams/:id', 'DELETE /api/v1/teams/:id',
    'GET /api/v1/people', 'POST /api/v1/people', 'GET /api/v1/people/:id', 'PATCH /api/v1/people/:id', 'DELETE /api/v1/people/:id', 'POST /api/v1/people/:id/invite',
    'GET /api/v1/teams/:teamId/shift-templates', 'POST /api/v1/teams/:teamId/shift-templates',
    'PATCH /api/v1/shift-templates/:id', 'DELETE /api/v1/shift-templates/:id',
    'GET /api/v1/shifts', 'GET /api/v1/shifts/:id', 'POST /api/v1/shifts', 'PATCH /api/v1/shifts/:id', 'DELETE /api/v1/shifts/:id',
    'POST /api/v1/shift-templates/:templateId/expand', 'POST /api/v1/teams/:teamId/schedules/publish',
    'POST /api/v1/shifts/:shiftId/assign', 'DELETE /api/v1/shift-assignments/:id', 'GET /api/v1/shifts/:shiftId/assignments',
    'GET /api/v1/me/schedule', 'GET /api/v1/teams/:teamId/schedule'
]

# Normalize MVP endpoints for matching
mvp_normalized = set()
for ep in mvp_endpoints:
    parts = ep.split(' ', 1)
    if len(parts) == 2:
        mvp_normalized.add((parts[0], re.sub(r':\w+', ':id', parts[1])))

# Build all page content - store as JSON (safe, no escaping issues)
pages = {}

# ADR pages (markdown, rendered by marked.js)
for key in adr_files:
    pages[key] = src[key]

# Overview page
inconsistencies = r"""<div class="status-warning">
<strong>Document Inconsistencies Noted</strong>
<ul style="margin-top:0.5rem">
<li><strong>Role count mismatch:</strong> AGENTS.md and docs/04-mvp-plan.md say 3 MVP roles (company_admin, manager, employee). spec/02-rbac-matrix.md defines 5 roles including super_admin and viewer. The SQL schema's person_role enum has company_admin, manager, employee and adds super_admin via ALTER TYPE. viewer is not in the DB enum at all — it exists only in the RBAC spec as a read-only role intended for UI-level enforcement.</li>
<li><strong>Session token length:</strong> spec/06-session-management.md says "64-char random base64url" from crypto.randomBytes(48) (48 bytes = 64 base64url chars). Consistent.</li>
<li><strong>MVP endpoint list:</strong> docs/04-mvp-plan.md lists 26 MVP endpoints. spec/01-api-spec.md has ~60+ total (full spec). The MVP doc does NOT include POST /api/v1/auth/refresh, POST /api/v1/auth/forgot-password, or POST /api/v1/auth/reset-password — these exist only in the full spec. The handoff explicitly says "No password reset for MVP."</li>
<li><strong>shift_assignments.status MVP simplification:</strong> docs/04-mvp-plan.md says "status is always approved for MVP" and to drop the status column. But db/02-schema.sql has the full assignment_status enum with pending/approved/rejected/cancelled. The data model doc also shows the full design. These simplifications are noted in the MVP doc but the SQL schema is "implementation-ready" per AGENTS.md — the implementer is expected to apply simplifications.</li>
<li><strong>people.subscription_token and data_exported_at:</strong> docs/04-mvp-plan.md says to remove these for MVP. Both columns exist in db/02-schema.sql. Implementer should drop them for MVP.</li>
<li><strong>notifications.channel enum:</strong> docs/04-mvp-plan.md says MVP uses email only and to remove in_app. The full schema uses notification_channel enum with email/slack/teams/webhook/push. Implementer should restrict to email for MVP.</li>
</ul>
</div>"""

pages['overview'] = r"""<h1>Roster — Project Overview</h1>
<h2>What Is This?</h2>
<p>A multi-tenant, web-based roster application for globally distributed teams to manage employee scheduling across time zones. Each company operates as an isolated tenant with their own teams, people, schedules, and shift rules.</p>
<p>This is a <strong>greenfield design and specification project</strong> — nothing is implemented yet. All files are requirements documents, specifications, compliance research, one SQL schema, and an HTML prototype.</p>
<h2>Architecture Ground Truths</h2>
<table>
<thead><tr><th>Decision</th><th>Detail</th></tr></thead>
<tbody>
<tr><td><strong>Database</strong></td><td>PostgreSQL with RLS on every table, scoped by company_id</td></tr>
<tr><td><strong>Primary keys</strong></td><td>UUID with gen_random_uuid() throughout</td></tr>
<tr><td><strong>Timestamps</strong></td><td>TIMESTAMPTZ in UTC; display conversion in app layer</td></tr>
<tr><td><strong>Audit log</strong></td><td>HMAC-SHA256 chained, append-only triggers prevent UPDATE/DELETE — audit_entries and clock_entries</td></tr>
<tr><td><strong>Auth</strong></td><td>Session tokens stored hashed (SHA256) in DB, not JWT. bcrypt cost 12. No refresh tokens for MVP.</td></tr>
<tr><td><strong>RRULE</strong></td><td>RFC 5545 recurrence — store as string, expand on publish (not on read). One recurrence_rules row per shift_template.</td></tr>
<tr><td><strong>RBAC (MVP)</strong></td><td>3 roles hardcoded in middleware — company_admin, manager, employee. No role_permissions join table yet. super_admin is DB-only, no UI.</td></tr>
<tr><td><strong>Clock entries</strong></td><td>Append-only enforced by triggers. ON DELETE SET NULL on person/assignment FKs to preserve records after GDPR erasure.</td></tr>
<tr><td><strong>Data residency</strong></td><td>Regional sharding by company — region_routing table maps company to geographic DB cluster.</td></tr>
<tr><td><strong>Text fields</strong></td><td>VARCHAR limits enforced at DB level, never trust client-side validation.</td></tr>
</tbody>
</table>
<h2>MVP vs Post-MVP</h2>
<p>The <strong>Minimum Viable Product</strong> delivers the core scheduling loop: manager creates shifts with recurrence, assigns people, employees view schedule. Estimated at <strong>~31 days / 6 weeks</strong> (16 backend + 15.5 frontend).</p>
<h3>MVP Features</h3>
<ul>
<li>Multi-tenant auth (register, login, logout)</li>
<li>Company settings (timezone, locale)</li>
<li>Teams CRUD</li>
<li>People CRUD + email invite</li>
<li>Shift templates + RRULE (FREQ, BYDAY, etc.)</li>
<li>Shift publish (expand templates into instances)</li>
<li>Manager assigns people to shifts</li>
<li>Basic week calendar view (read-only for employees)</li>
<li>1 notification email (shift assigned)</li>
<li>Role gating (3 roles, hardcoded middleware)</li>
</ul>
<h3>Post-MVP Phases</h3>
<table>
<thead><tr><th>Phase</th><th>What Ships</th></tr></thead>
<tbody>
<tr><td><strong>Phase A</strong> Before the shift</td><td>Self-scheduling, calendar export (iCal/webcal), notification upgrades (reminders, digest, change alerts)</td></tr>
<tr><td><strong>Phase B</strong> During the shift</td><td>Clock in/out + break tracking, mobile/PWA, real-time coverage view</td></tr>
<tr><td><strong>Phase C</strong> After the shift</td><td>Reports (attendance, overtime, coverage), payroll export, audit + compliance UI</td></tr>
<tr><td><strong>Phase D</strong> Scale and enterprise</td><td>Multi-region data residency, SSO/SAML/OIDC, billing/plans, public API</td></tr>
</tbody>
</table>
""" + inconsistencies + r"""
<h2>Project Structure</h2>
<table>
<thead><tr><th>Directory</th><th>Contents</th></tr></thead>
<tbody>
<tr><td>/ (root)</td><td>AGENTS.md (architecture ground truths), prototype.html</td></tr>
<tr><td>docs/</td><td>PRD, feature breakdown, UX stories, MVP plan</td></tr>
<tr><td>db/</td><td>Data model doc, full SQL schema (30 tables), RRULE storage strategy</td></tr>
<tr><td>spec/</td><td>API spec, RBAC matrix, calendar export, pagination, webhooks, session management, architecture, email templates, audit events, testing strategy</td></tr>
<tr><td>compliance/</td><td>GDPR, CCPA, SOC2, HIPAA, security, data residency, incident response, Australia</td></tr>
</tbody>
</table>
<h2>Prototype</h2>
<p>The interactive UI prototype is available at <code>prototype.html</code> in the project root — a single-file HTML/CSS mockup using Tailwind CSS via CDN. Open it directly in a browser to explore the screen designs.</p>
"""

# Product pages
pages['product-features'] = r"""<h1>Feature Breakdown &amp; Implementation Roadmap</h1>
<p class="status-warning" style="margin-bottom:1rem"><strong>Note:</strong> This document breaks every feature into atomic units organized by implementation phase. The MVP scope is defined in docs/04-mvp-plan.md.</p>
""" + src['features']

pages['product-stories'] = r"""<h1>UX Flow &amp; User Stories</h1>
<p class="status-warning" style="margin-bottom:1rem"><strong>Note:</strong> These user stories cover the full product vision. The MVP implements a subset — see docs/04-mvp-plan.md for the exact scope.</p>
""" + src['stories']

pages['mvp-plan'] = src['mvp_plan']

# Database pages
pages['db-data-model'] = src['data_model']
pages['db-rrule'] = src['rrule']

# ERD diagram page
pages['db-erd'] = """<h1>Schema ERD</h1>
<p>Entity-Relationship diagram generated from <code>er/roster.dbml</code>.</p>
<div id="erd-wrap" style="position:relative;border:1px solid #ddd;border-radius:8px;min-height:700px;width:100%;overflow:hidden">
  <erd-editor readonly style="position:absolute;inset:0;width:100%;height:100%;min-height:700px"></erd-editor>
</div>
<p style="font-size:.8125rem;color:#888;margin-top:0.5rem">Powered by <a href="https://erd-editor.io" target="_blank" rel="noopener">erd-editor</a>. Interactive — drag, zoom, and explore.</p>"""

# API spec with MVP badges
api_lines = src['api_spec'].split('\n')
result = []
for line in api_lines:
    m = re.match(r'(### )(.+)', line)
    if m:
        content = m.group(2)
        ep_match = re.search(r'(GET|POST|PATCH|DELETE)\s+(/api/v1/[^\s`]+)', content)
        if ep_match:
            verb = ep_match.group(1)
            path = ep_match.group(2)
            norm_path = re.sub(r':\w+', ':id', path)
            is_mvp = (verb, norm_path) in mvp_normalized
            badge = '<span class="mvp-scope-badge in-mvp">MVP</span>' if is_mvp else '<span class="mvp-scope-badge post-mvp">MVP+</span>'
            result.append(f'{m.group(1)}{content} {badge}')
            continue
    result.append(line)
pages['api-spec'] = '\n'.join(result)

pages['glossary'] = src['glossary']

pages['api-pagination'] = src['pagination']
pages['api-webhooks'] = src['webhooks']
pages['spec-sessions'] = src['sessions']
pages['spec-calendar'] = src['calendar']
pages['spec-architecture'] = src['architecture']
pages['spec-email'] = src['email']
pages['spec-audit'] = src['audit']
pages['spec-testing'] = src['testing']

# Compliance pages
compliance_banner = r"""<div class="status-warning">
<strong><i class="fas fa-flask"></i> Research / Reference — Not MVP Implementation</strong>
<p style="margin-top:0.25rem">This document is part of the compliance research and reference material. The features and controls described here are <strong>not</strong> part of the MVP and will be implemented in post-MVP phases as needed.</p>
</div>"""

for key, fname in compliance_docs.items():
    pages[f'compliance-{key}'] = compliance_banner + f'<div style="margin-bottom:1rem">From: <code>compliance/{fname}</code></div>\n' + src[key]

# Schema summary page
pages['db-schema'] = r"""<h1>Schema Reference</h1>
<p>The database schema consists of <strong>30 tables</strong> with all UUID primary keys, TIMESTAMPTZ timestamps in UTC, and Row-Level Security (RLS) on every data table.</p>
<h2>Extensions Required</h2>
<ul>
<li><code>pgcrypto</code> — gen_random_uuid()</li>
<li><code>citext</code> — case-insensitive email</li>
</ul>
<h2>Enums</h2>
<table><thead><tr><th>Type</th><th>Values</th></tr></thead><tbody>
""" + '\n'.join(f'<tr><td><code>{e[0]}</code></td><td><code>{", ".join(e[1])}</code></td></tr>' for e in enums) + r"""
</tbody></table>
<h2>Tables</h2>
<p>Click a table name to view its full reference page.</p>
<table><thead><tr><th>Table</th><th>RLS</th><th>company_id</th><th>Columns</th></tr></thead><tbody>
""" + '\n'.join(
    f'<tr><td><a href="#db-table-{t["name"].replace("_","-")}"><code>{t["name"]}</code></a></td>'
    f'<td>{"<span class=\"rls-yes\">Yes</span>" if rls_enabled.get(t["name"], True) else "<span class=\"rls-no\">No</span>"}</td>'
    f'<td>{"<span class=\"rls-yes\">Yes</span>" if has_company_id.get(t["name"], True) else "<span class=\"rls-no\">No</span>"}</td>'
    f'<td>{len(t["columns"])}</td></tr>'
    for t in schema_tables
) + '</tbody></table>'

# Table detail pages
for t in schema_tables:
    safe_name = t['name'].replace('_', '-')
    rls_status = '<span class="rls-yes"><i class="fas fa-check-circle"></i> RLS enabled</span>' if rls_enabled.get(t['name'], True) else '<span class="rls-no"><i class="fas fa-times-circle"></i> RLS — top-level tenant table</span>'
    comp_status = '<span class="rls-yes"><i class="fas fa-check-circle"></i> company_id present</span>' if has_company_id.get(t['name'], True) else '<span class="rls-no"><i class="fas fa-exclamation-triangle"></i> No company_id — scoped via FK</span>'
    
    html = f'<h1><code>{t["name"]}</code></h1>\n'
    html += f'<div style="display:flex;gap:1rem;flex-wrap:wrap;margin:0 0 1.5rem">{rls_status} {comp_status}</div>\n'
    html += '<h2>Columns</h2>\n<table><thead><tr><th>Column</th><th>Definition</th></tr></thead><tbody>\n'
    for col in t['columns']:
        parts = col.split(None, 1)
        col_name = parts[0]
        rest = parts[1] if len(parts) > 1 else ''
        html += f'<tr><td><code>{col_name}</code></td><td><code style="font-size:.75rem">{rest}</code></td></tr>\n'
    html += '</tbody></table>\n'
    
    # Cross-references
    xlinks = []
    if t['name'] == 'clock_entries':
        xlinks.append('<a href="#compliance-hipaa">HIPAA Compliance</a> — clock times are PHI in healthcare settings')
        xlinks.append('<a href="#spec-audit">Audit Events Catalog</a> — clock_in/out/break events')
    if t['name'] == 'audit_entries':
        xlinks.append('<a href="#spec-audit">Audit Events Catalog</a> — full event catalog')
        xlinks.append('<a href="#compliance-soc2">SOC 2</a> — audit log integrity controls (PI-3, CC-4)')
        xlinks.append('<a href="#compliance-incident">Incident Response</a> — evidence collection and chain of custody')
    if t['name'] == 'sessions':
        xlinks.append('<a href="#spec-sessions">Session Management</a> — full session lifecycle specification')
    if t['name'] in ('shift_templates', 'recurrence_rules'):
        xlinks.append('<a href="#db-rrule">RRULE Storage Strategy</a> — expansion and exception handling')
    if t['name'] == 'people':
        xlinks.append('<a href="#compliance-gdpr">GDPR</a> — right to erasure, data portability')
    if t['name'] == 'region_routing':
        xlinks.append('<a href="#compliance-residency">Data Residency</a> — multi-region architecture')
    if t['name'] == 'consent_records':
        xlinks.append('<a href="#compliance-gdpr">GDPR Section 5</a> — consent management')
    if t['name'] == 'compliance_violations':
        xlinks.append('<a href="#compliance-hipaa">HIPAA</a> — violation tracking in healthcare')
        xlinks.append('<a href="#compliance-security">Security Architecture</a> — monitoring and alerting')
    
    if xlinks:
        html += '<h2>Cross-References</h2>\n<ul>\n'
        for x in xlinks:
            html += f'<li>{x}</li>\n'
        html += '</ul>\n'
    
    pages[f'db-table-{safe_name}'] = html

# RBAC pages
# Build permission data
rbac_roles_list = ['super_admin', 'company_admin', 'manager', 'employee', 'viewer']
full_roles = {'super_admin': 'Platform operations, all tenants',
              'company_admin': 'Company settings, all teams, audit log, compliance, integrations',
              'manager': 'Team schedule, shift templates, approvals, team roster, reports',
              'employee': 'Own schedule, self-scheduling requests, clock in/out, time-off requests',
              'viewer': 'Read-only — HR, payroll, auditing — can view but not edit'}

# Parse RBAC permission definitions
rbac_perms = []
for line in src['rbac'].split('\n'):
    m = re.match(r"\| `(\w[\w.]+)` \| (.+) \|", line)
    if m and 'Applies to' not in line and 'Permission' not in line and 'resource:action' not in line:
        rbac_perms.append({'perm': m.group(1), 'label': m.group(2)})

# Role-permission mapping from section 3
role_map = {}
current_role = None
for line in src['rbac'].split('\n'):
    s = line.strip()
    for r in rbac_roles_list:
        if s.startswith(f'### {r.replace("_", " ").title()}') or s.startswith(f'### {r}'):
            current_role = r
            if r not in role_map:
                role_map[r] = []
    m = re.match(r"\| `([\w.]+)` \| (.+) \|", s)
    if m and current_role and 'Permission' not in s and 'Granted' not in s:
        role_map[current_role].append(m.group(1))

# RBAC matrix page
rbac_thead = '<tr><th>Permission</th><th>Description</th>' + ''.join(f'<th>{r}</th>' for r in rbac_roles_list) + '</tr>'
rbac_rows = ''
for p in rbac_perms:
    rbac_rows += f'<tr><td><code>{p["perm"]}</code></td><td>{p["label"]}</td>'
    for r in rbac_roles_list:
        granted = p['perm'] in role_map.get(r, [])
        rbac_rows += f'<td style="text-align:center">{"<span class=\"perm-yes\"><i class=\"fas fa-check\"></i></span>" if granted else "<span class=\"perm-no\"><i class=\"fas fa-times\"></i></span>"}</td>'
    rbac_rows += '</tr>'

pages['rbac-matrix'] = f"""<h1>RBAC Permissions Matrix</h1>
<p>Five roles with granular permissions. MVP uses only <strong>company_admin</strong>, <strong>manager</strong>, and <strong>employee</strong> with hardcoded middleware (no role_permissions join table).</p>
<h2>Enforcement Layers</h2>
<ol>
<li><strong>Database RLS:</strong> PostgreSQL Row-Level Security, default-deny, scoped by company_id</li>
<li><strong>Application Middleware:</strong> Session validation, tenant check, RBAC guard on every route</li>
<li><strong>UI:</strong> Route guards and component-level visibility based on user role</li>
</ol>
<div style="overflow-x:auto"><table>{rbac_thead}<tbody>{rbac_rows}</tbody></table></div>
<p style="font-size:.75rem;color:#6b7280;margin-top:0.5rem"><span class="perm-yes"><i class="fas fa-check"></i></span> = Granted &nbsp; <span class="perm-no"><i class="fas fa-times"></i></span> = Not granted</p>
<h2>Cross-References</h2>
<ul>
<li><a href="#api-spec">API Reference</a> — each endpoint is gated by one or more permissions</li>
<li><a href="#compliance-soc2">SOC 2</a> — access control policy (CC-1)</li>
<li><a href="#compliance-security">Security Architecture</a> — authorization and RBAC middleware</li>
<li><a href="#compliance-hipaa">HIPAA</a> — minimum necessary standard, access controls</li>
</ul>"""

# Per-role pages
for r in rbac_roles_list:
    perms = [p for p in rbac_perms if p['perm'] in role_map.get(r, [])]
    desc = full_roles.get(r, '')
    is_mvp = r in ('company_admin', 'manager', 'employee')
    version_badge = '<span class="mvp-scope-badge in-mvp">MVP</span>' if is_mvp else '<span class="mvp-scope-badge post-mvp">Full Spec</span>'
    mvp_note = '' if is_mvp else r"""<div class="status-warning">
<strong><i class="fas fa-info-circle"></i> Not in MVP</strong>
<p style="margin-top:0.25rem">This role is part of the full specification but is <strong>not</strong> included in the MVP implementation.</p>
</div>"""
    
    html = f"""<h1>Role: {r} {version_badge}</h1>
<p>{desc}</p>
{mvp_note}
<h2>Permissions ({len(perms)})</h2>
<table><thead><tr><th>Permission</th><th>Description</th></tr></thead><tbody>
""" + '\n'.join(f'<tr><td><code>{p["perm"]}</code></td><td>{p["label"]}</td></tr>' for p in perms) + """
</tbody></table>
<h2>Cross-References</h2>
<ul>
<li><a href="#rbac-matrix">Permissions Matrix</a> — full role comparison</li>
<li><a href="#api-spec">API Reference</a> — endpoints gated by these permissions</li>
"""
    if r == 'company_admin':
        html += '<li><a href="#compliance-gdpr">GDPR</a> — admin triggers erasure and export</li>'
    elif r == 'super_admin':
        html += '<li><a href="#compliance-soc2">SOC 2</a> — access review (CC-5)</li>'
    elif r == 'manager':
        html += '<li><a href="#product-features">Feature Breakdown</a> — manager scheduling features</li>'
    elif r == 'employee':
        html += '<li><a href="#product-stories">UX Stories</a> — employee self-service flows</li>'
    if r in ('company_admin', 'manager'):
        html += '<li><a href="#spec-audit">Audit Events</a> — audit_log.read permission</li>'
    html += '</ul>'
    pages[f'rbac-{r.replace("_", "-")}'] = html

# Encode all content as JSON
pages_json = json.dumps(pages, ensure_ascii=False)
schema_json = json.dumps(schema_tables, ensure_ascii=False)

# Read the HTML template parts
output_parts = []

output_parts.append("""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Roster — Documentation Portal</title>
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<script type="module">
  import 'https://cdn.jsdelivr.net/npm/@dineug/erd-editor@latest/+esm';

  window.__initErdEditor = function(containerId) {
    var wrap = document.getElementById(containerId);
    if (!wrap) return;
    var editor = wrap.querySelector('erd-editor');
    if (!editor || editor.hasAttribute('data-loaded')) return;
    editor.readonly = true;
    editor.style.width = '100%';
    editor.style.height = '100%';

    function applySchema(attempt) {
      try {
        editor.setSchemaSQL(window.__SCHEMA_SQL || '');
        editor.setAttribute('data-loaded', '');
      } catch(e) {
        console.error('erd-editor attempt ' + attempt + ':', e);
        if (attempt < 5) {
          requestAnimationFrame(function() { applySchema(attempt + 1); });
        }
      }
    }
    requestAnimationFrame(function() { applySchema(0); });
  };
</script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
<style>
*,:after,:before{margin:0;padding:0;box-sizing:border-box}
:root{--sidebar-w:280px}
html{scroll-behavior:smooth}
body{display:flex;min-height:100vh;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111;background:#fff;font-size:15px;line-height:1.6;-webkit-font-smoothing:antialiased}

/* ─── Sidebar ─── */
#sidebar{position:fixed;left:0;top:0;bottom:0;width:var(--sidebar-w);background:#000;color:#ccc;overflow-y:auto;z-index:50;display:flex;flex-direction:column;scrollbar-width:thin;scrollbar-color:#333 transparent}
#sidebar::-webkit-scrollbar{width:5px}
#sidebar::-webkit-scrollbar-thumb{background:#333;border-radius:3px}
#sidebar .logo{padding:1.5rem 1.25rem;border-bottom:1px solid #222;flex-shrink:0}
#sidebar .logo h1{color:#fff;font-size:1.125rem;font-weight:700;letter-spacing:-.01em;display:flex;align-items:center;gap:.5rem}
#sidebar .logo h1 i{color:#999;font-size:1.1rem}
#sidebar .logo p{color:#888;font-size:.6875rem;margin-top:3px;padding-left:1.65rem}
#search-wrap{padding:.75rem 1rem;border-bottom:1px solid #222;flex-shrink:0}
#search-wrap input{width:100%;padding:.5rem .75rem;border-radius:8px;border:1px solid #333;background:#111;color:#eee;font-size:.8125rem;outline:none;transition:all .2s}
#search-wrap input:focus{border-color:#aaa;box-shadow:0 0 0 3px rgba(255,255,255,.08)}
#search-wrap input::placeholder{color:#666}
#nav{flex:1;overflow-y:auto;padding:.375rem 0}
.nav-group-header{display:flex;align-items:center;justify-content:space-between;padding:.5rem 1rem .5rem 1.25rem;cursor:pointer;font-size:.6875rem;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.06em;transition:color .15s}
.nav-group-header:hover{color:#eee}
.nav-group-header .chevron{transition:transform .2s;font-size:.5rem;color:#666}
.nav-group-header.open .chevron{transform:rotate(90deg)}
.nav-links{overflow:hidden;max-height:0;transition:max-height .25s ease}
.nav-links.open{max-height:2000px}
.nav-link{display:block;padding:.35rem 1rem .35rem 2rem;font-size:.8125rem;color:#aaa;text-decoration:none;transition:all .12s;border-left:2px solid transparent;border-radius:0 4px 4px 0;margin:1px 0}
.nav-link:hover{color:#fff;background:rgba(255,255,255,.06);border-left-color:#777}
.nav-link.active{color:#fff;border-left-color:#fff;background:rgba(255,255,255,.1);font-weight:600}

/* ─── Layout ─── */
#content{margin-left:var(--sidebar-w);flex:1;min-height:100vh;padding:2rem 2.5rem;display:flex;gap:2rem;align-items:flex-start}
#page-content{background:#fff;border:1px solid #e5e5e5;border-radius:10px;padding:1.75rem 2rem;flex:1;min-width:0}
@media(max-width:1024px){
  #content{flex-direction:column}
}
@media(max-width:768px){
  :root{--sidebar-w:0px}
  #page-content{padding:1.25rem;border-radius:8px}
  #sidebar{transform:translateX(-100%);transition:transform .3s}
  #sidebar.open{transform:translateX(0);width:280px}
  #content{margin-left:0;padding:.75rem;flex-direction:column}
  #menu-btn{display:flex !important}
}
#menu-btn{display:none;position:fixed;top:.75rem;left:.75rem;z-index:60;align-items:center;justify-content:center;width:36px;height:36px;background:#000;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:.875rem;box-shadow:0 2px 8px rgba(0,0,0,.2);transition:background .15s}
#menu-btn:hover{background:#222}
#overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:45}
#overlay.show{display:block}

/* ─── Breadcrumb ─── */
.breadcrumb{font-size:.75rem;color:#888;margin-bottom:1rem;display:flex;align-items:center;gap:.35rem;flex-wrap:wrap}
.breadcrumb a{color:#555;text-decoration:none;transition:color .15s}
.breadcrumb a:hover{color:#000;text-decoration:underline}
.breadcrumb .sep{color:#ccc}

/* ─── On-page TOC (right rail) ─── */
#toc-wrap{width:220px;flex-shrink:0;position:sticky;top:2rem}
#toc-wrap.hidden{display:none}
#toc{font-size:.75rem;border-left:2px solid #ddd;padding-left:1rem;max-height:calc(100vh - 8rem);overflow-y:auto}
#toc-label{font-size:.625rem;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.06em;margin-bottom:.5rem}
#toc a{display:block;color:#666;text-decoration:none;padding:.2rem 0;transition:color .15s;line-height:1.4;border-left:2px solid transparent;margin-left:-1rem;padding-left:1rem}
#toc a:hover{color:#000}
#toc a.toc-h3{padding-left:1.5rem;margin-left:-1rem;font-size:.6875rem}
#toc a.toc-active{color:#000;font-weight:600;border-left-color:#000}
@media(max-width:1024px){
  #toc-wrap{display:none}
}

/* ─── Heading anchors ─── */
.heading-anchor{opacity:0;transition:opacity .15s;text-decoration:none;color:#bbb;font-weight:400;margin-left:.35rem;font-size:.8em}
h2:hover .heading-anchor,h3:hover .heading-anchor,h4:hover .heading-anchor{opacity:1}
.heading-anchor:hover{color:#000;opacity:1!important}

/* ─── Copy button on code blocks ─── */
.pre-wrap{position:relative}
.copy-btn{position:absolute;top:.5rem;right:.5rem;background:#222;color:#999;border:1px solid #333;border-radius:5px;padding:.2rem .5rem;font-size:.625rem;cursor:pointer;font-family:inherit;transition:all .15s;opacity:0;text-transform:uppercase;letter-spacing:.04em}
.pre-wrap:hover .copy-btn{opacity:1}
.copy-btn:hover{background:#333;color:#fff}
.copy-btn.copied{background:#000;color:#fff;border-color:#000;opacity:1}

/* ─── Content typography ─── */
.prose{max-width:100%;line-height:1.7;font-size:.9375rem;color:#222}
.prose h1{margin:0 0 1rem;font-size:1.625rem;font-weight:800;color:#000;letter-spacing:-.02em;border-bottom:2px solid #ddd;padding-bottom:.6rem}
.prose h2{margin:2rem 0 .75rem;font-size:1.3rem;font-weight:700;color:#000;letter-spacing:-.01em;border-bottom:1px solid #eee;padding-bottom:.4rem}
.prose h3{margin:1.75rem 0 .5rem;font-size:1.1rem;font-weight:600;color:#111}
.prose h4{margin:1.5rem 0 .5rem;font-size:1rem;font-weight:600;color:#222}
.prose p{margin:0 0 1rem}
.prose ul,.prose ol{margin:0 0 1rem;padding-left:1.5rem}
.prose li{margin-bottom:.25rem}
.prose li::marker{color:#888}
.prose code{background:#f0f0f0;padding:.125rem .45rem;border-radius:5px;font-size:.8125rem;color:#000;font-weight:500}
.prose pre{background:#111;color:#ccc;padding:1.25rem;border-radius:10px;overflow-x:auto;margin:0 0 1rem;font-size:.8125rem;line-height:1.55;border:1px solid #222}
.prose pre code{background:none;color:inherit;padding:0;font-weight:400}
.prose blockquote{border-left:3px solid #000;padding:.5rem 0 .5rem 1.25rem;margin:0 0 1rem;color:#555;background:#fafafa;border-radius:0 6px 6px 0}
.prose table{width:100%;border-collapse:separate;border-spacing:0;margin:0 0 1rem;font-size:.8125rem;border-radius:8px;overflow:hidden;border:1px solid #ddd}
.prose th,.prose td{border:1px solid #ddd;padding:.55rem .8rem;text-align:left;vertical-align:top}
.prose th{background:#f5f5f5;font-weight:700;color:#000;font-size:.75rem;text-transform:uppercase;letter-spacing:.04em}
.prose tr:nth-child(even){background:#fafafa}
.prose tr:hover td{background:#f0f0f0}
.prose hr{margin:2rem 0;border:0;border-top:1px solid #ddd}
.prose a{color:#000;text-decoration:underline;text-underline-offset:2px;font-weight:500;transition:color .15s}
.prose a:hover{color:#555}
.prose img{max-width:100%;border-radius:8px;margin:1rem 0;border:1px solid #eee}
.prose strong{color:#000}

/* ─── Badges ─── */
.badge{display:inline-block;font-size:.625rem;font-weight:700;padding:.15rem .55rem;border-radius:9999px;text-transform:uppercase;letter-spacing:.04em;vertical-align:middle;line-height:1.4;border:1px solid currentColor}
.badge-mvp{background:#f0f0f0;color:#000}
.badge-deferred{background:#f0f0f0;color:#555}
.badge-mvp-only{background:#f0f0f0;color:#000}
.badge-full{background:#f0f0f0;color:#333}
.badge-research{background:#f0f0f0;color:#555}

/* ─── Search ─── */
.search-result{padding:.85rem 1rem;border-bottom:1px solid #ddd;cursor:pointer;transition:all .15s;border-radius:6px;margin:2px 0}
.search-result:hover{background:#f5f5f5}
.search-result:last-child{border-bottom:none}
.search-result em{background:#000;font-style:normal;font-weight:600;color:#fff;padding:0 3px;border-radius:2px}
.search-result strong{color:#000}
.search-result .result-path{font-size:.6875rem;color:#999;margin-top:1px}

/* ─── Misc ─── */
.status-warning{background:#fafafa;border:1px solid #ccc;border-radius:10px;padding:1rem 1.25rem;margin:0 0 1.5rem;font-size:.875rem}
.status-warning strong{color:#000}
.rls-yes{color:#000;font-weight:700}
.rls-no{color:#999;font-weight:600}
.perm-yes{color:#000}
.perm-no{color:#ccc}
.mvp-scope-badge{display:inline-block;padding:.125rem .5rem;border-radius:5px;font-size:.625rem;font-weight:700;margin-left:.375rem;vertical-align:middle;border:1px solid #ccc}
.mvp-scope-badge.in-mvp{background:#f0f0f0;color:#000}
.mvp-scope-badge.post-mvp{background:#f0f0f0;color:#666}

/* ─── Print ─── */
@media print{
  #sidebar,#menu-btn,#overlay,#toc-wrap,#search-wrap{display:none!important}
  #content{margin-left:0;padding:0;display:block}
  #page-content{border:none;border-radius:0;padding:0;box-shadow:none}
  .prose a{text-decoration:underline}
  .prose pre{break-inside:avoid;border:1px solid #ddd;background:#fafafa;color:#000}
  .pre-wrap .copy-btn{display:none!important}
  .heading-anchor{display:none!important}
  .badge,.mvp-scope-badge{border:1px solid #000!important}
}
</style>
</head>
<body>
<button id="menu-btn" onclick="toggleSidebar()"><i class="fas fa-bars"></i></button>
<div id="overlay" onclick="toggleSidebar()"></div>
<div id="sidebar">
  <div class="logo">
    <h1><i class="fas fa-calendar-alt mr-2 text-indigo-400"></i>Roster</h1>
    <p>Documentation Portal</p>
  </div>
  <div id="search-wrap">
    <input type="text" id="search-input" placeholder="Search docs..." oninput="doSearch(this.value)">
  </div>
  <div id="nav"></div>
</div>
<div id="content">
  <div id="page-content" class="prose"></div>
  <div id="toc-wrap" class="hidden"><div id="toc"></div></div>
</div>
<script>
// Content data loaded from JSON
const PAGES_BASE = """)
output_parts.append(pages_json)
output_parts.append(""";

const SCHEMA_TABLES = """)
output_parts.append(schema_json)
output_parts.append(""";

window.__SCHEMA_SQL = """)
schema_sql_json = json.dumps(src['schema_sql_clean'], ensure_ascii=False)
output_parts.append(schema_sql_json)
output_parts.append(""";

const NAV = [
  {label:'Overview',icon:'fa-house',pages:[{id:'overview',label:'Welcome / Overview'},{id:'glossary',label:'Glossary'}]},
  {label:'Product',icon:'fa-cube',pages:[{id:'product-features',label:'Feature Breakdown'},{id:'product-stories',label:'UX User Stories'},{id:'mvp-plan',label:'MVP Plan'}]},
  {label:'Database',icon:'fa-database',pages:[{id:'db-data-model',label:'Data Model'},{id:'db-schema',label:'Schema Reference'},{id:'db-erd',label:'Schema ERD'},{id:'db-rrule',label:'RRULE Storage'}]},
  {label:'Architecture Decisions',icon:'fa-book',pages:[{id:'adr-001',label:'ADR 1: PostgreSQL RLS'},{id:'adr-002',label:'ADR 2: Expand on Publish'},{id:'adr-003',label:'ADR 3: Session Tokens (No JWT)'},{id:'adr-004',label:'ADR 4: HMAC Audit Chain'},{id:'adr-005',label:'ADR 5: RRULE Storage'}]},
{label:'RBAC',icon:'fa-lock',pages:[{id:'rbac-matrix',label:'Permissions Matrix'},{id:'rbac-super-admin',label:'Role: super_admin',mvp:false},{id:'rbac-company-admin',label:'Role: company_admin',mvp:true},{id:'rbac-manager',label:'Role: manager',mvp:true},{id:'rbac-employee',label:'Role: employee',mvp:true},{id:'rbac-viewer',label:'Role: viewer',mvp:false}]},
  {label:'API & Integration',icon:'fa-plug',pages:[{id:'api-spec',label:'API Reference'},{id:'api-pagination',label:'Pagination'},{id:'api-webhooks',label:'Webhooks'}]},
  {label:'Platform Specs',icon:'fa-gear',pages:[{id:'spec-sessions',label:'Session Management'},{id:'spec-calendar',label:'Calendar Export'},{id:'spec-architecture',label:'Architecture'},{id:'spec-email',label:'Email Templates'},{id:'spec-audit',label:'Audit Events'},{id:'spec-testing',label:'Testing Strategy'}]},
  {label:'Compliance',icon:'fa-shield',pages:[{id:'compliance-gdpr',label:'GDPR'},{id:'compliance-ccpa',label:'CCPA / CPRA'},{id:'compliance-soc2',label:'SOC 2'},{id:'compliance-hipaa',label:'HIPAA'},{id:'compliance-security',label:'Security'},{id:'compliance-residency',label:'Data Residency'},{id:'compliance-incident',label:'Incident Response'},{id:'compliance-australia',label:'Australia (APPs)'}]}
];

const MD_TO_PAGE = {
  // Compliance (bare)
  '01-GDPR.md':'compliance-gdpr','02-CCPA.md':'compliance-ccpa','03-SOC2.md':'compliance-soc2',
  '04-HIPAA.md':'compliance-hipaa','05-security.md':'compliance-security','06-data-residency.md':'compliance-residency',
  '07-incident-response-plan.md':'compliance-incident','08-Australia.md':'compliance-australia',
  // Compliance (full path)
  'compliance/01-GDPR.md':'compliance-gdpr','compliance/02-CCPA.md':'compliance-ccpa',
  'compliance/03-SOC2.md':'compliance-soc2','compliance/04-HIPAA.md':'compliance-hipaa',
  'compliance/05-security.md':'compliance-security','compliance/06-data-residency.md':'compliance-residency',
  'compliance/07-incident-response-plan.md':'compliance-incident','compliance/08-Australia.md':'compliance-australia',
  // Spec (bare)
  '01-api-spec.md':'api-spec','02-rbac-matrix.md':'rbac-matrix','03-calendar-export-spec.md':'spec-calendar',
  '04-pagination.md':'api-pagination','05-webhooks.md':'api-webhooks','06-session-management.md':'spec-sessions',
  '07-architecture.md':'spec-architecture','08-email-templates.md':'spec-email',
  '09-audit-events.md':'spec-audit','10-testing-strategy.md':'spec-testing',
  // Spec (full path)
  'spec/01-api-spec.md':'api-spec','spec/02-rbac-matrix.md':'rbac-matrix',
  'spec/03-calendar-export-spec.md':'spec-calendar','spec/04-pagination.md':'api-pagination',
  'spec/05-webhooks.md':'api-webhooks','spec/06-session-management.md':'spec-sessions',
  'spec/07-architecture.md':'spec-architecture','spec/08-email-templates.md':'spec-email',
  'spec/09-audit-events.md':'spec-audit','spec/10-testing-strategy.md':'spec-testing',
  // Docs (bare)
  '01-PRD.md':'overview','02-feature-breakdown.md':'product-features',
  '03-ux-user-stories.md':'product-stories','04-mvp-plan.md':'mvp-plan','05-glossary.md':'glossary',
  // Docs (full path)
  'docs/01-PRD.md':'overview','docs/02-feature-breakdown.md':'product-features',
  'docs/03-ux-user-stories.md':'product-stories','docs/04-mvp-plan.md':'mvp-plan',
  'docs/05-glossary.md':'glossary',
  // DB (bare)
  '01-data-model.md':'db-data-model','02-schema.sql':'db-schema','03-rrule-storage.md':'db-rrule',
  // DB (full path)
  'db/01-data-model.md':'db-data-model','db/02-schema.sql':'db-schema','db/03-rrule-storage.md':'db-rrule',
  // ADR
  'docs/adr/001-use-postgresql-rls.md':'adr-001','docs/adr/002-expand-on-publish.md':'adr-002',
  'docs/adr/003-session-tokens-not-jwt.md':'adr-003','docs/adr/004-hmac-audit-chain.md':'adr-004',
  'docs/adr/005-rrule-storage-strategy.md':'adr-005'
};

let searchIndex = [];
let currentPage = 'overview';
let currentToc = [];
let skipHashChange = false;

/* ─── Utilities ─── */
function escHtml(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}

/* ─── Marked config + cross-reference link conversion ─── */
function md(s){
  var html = marked.parse(s, {breaks: true});
  var anchorMap = {};
  var aidx = 0;
  html = html.replace(/<a\b[^>]*>[\s\S]*?<\/a>/g, function(m) {
    var k = '\x00A' + (aidx++) + '\x00';
    anchorMap[k] = m;
    return k;
  });
  html = html.replace(/<code[^>]*>([a-zA-Z0-9_\/.-]+\.(?:md|sql))<\/code>/g, function(m, fp) {
    var pid = MD_TO_PAGE[fp];
    if (!pid) return m;
    return '<a href="#' + pid + '">' + fp + '</a>';
  });
  html = html.replace(/\b([a-zA-Z0-9_\/.-]+\.(?:md|sql))\b/g, function(m, fp) {
    var pid = MD_TO_PAGE[fp];
    if (!pid) return m;
    return '<a href="#' + pid + '">' + fp + '</a>';
  });
  for (var k in anchorMap) {
    html = html.split(k).join(anchorMap[k]);
  }
  return html;
}

/* ─── Heading anchors (post-process) ─── */
function addHeadingAnchors(root){
  root.querySelectorAll('h2,h3').forEach(function(h){
    if(h.id)return
    var id=h.textContent.toLowerCase().replace(/[^\\w\\s-]/g,'').replace(/\\s+/g,'-').replace(/-+/g,'-').trim()
    h.id=id
    var a=document.createElement('a')
    a.className='heading-anchor'
    a.href='#'+id
    a.setAttribute('aria-hidden','true')
    a.textContent='#'
    h.appendChild(a)
  })
}

/* ─── Breadcrumb ─── */
function getBreadcrumb(id){
  for(const g of NAV){
    for(const p of g.pages){
      if(p.id===id)return{group:g.label,page:p.label}
    }
  }
  return null
}

/* ─── On-page TOC ─── */
function buildToc(root){
  var items=[]
  root.querySelectorAll('h2,h3').forEach(function(h){
    if(!h.id)return
    items.push({id:h.id,text:h.textContent.replace('#',''),level:h.tagName.toLowerCase()})
  })
  return items
}
function renderToc(items){
  var el=document.getElementById('toc')
  if(!items.length){document.getElementById('toc-wrap').classList.add('hidden');return}
  document.getElementById('toc-wrap').classList.remove('hidden')
  el.innerHTML='<div id="toc-label">On this page</div>'+items.map(function(i){
    return'<a href="#'+i.id+'" class="toc-'+i.level+'" data-toc-id="'+i.id+'">'+escHtml(i.text)+'</a>'
  }).join('')
  currentToc=items
}
function scrollSpy(){
  if(!currentToc.length)return
  var links=document.querySelectorAll('#toc a[data-toc-id]')
  var found=false
  for(var i=currentToc.length-1;i>=0;i--){
    var el=document.getElementById(currentToc[i].id)
    if(el&&el.getBoundingClientRect().top<120){
      links.forEach(function(a){a.classList.toggle('toc-active',a.dataset.tocId===currentToc[i].id)})
      found=true;break
    }
  }
  if(!found&&links.length)links[0].classList.remove('toc-active')
}

/* ─── Copy buttons ─── */
function addCopyButtons(root){
  root.querySelectorAll('pre').forEach(function(pre){
    if(pre.parentNode.classList.contains('pre-wrap'))return
    var wrap=document.createElement('div')
    wrap.className='pre-wrap'
    pre.parentNode.insertBefore(wrap,pre)
    wrap.appendChild(pre)
    var btn=document.createElement('button')
    btn.className='copy-btn'
    btn.textContent='Copy'
    btn.onclick=function(){
      var code=pre.querySelector('code')
      var text=code?code.textContent:pre.textContent
      navigator.clipboard.writeText(text).then(function(){
        btn.textContent='Copied!';btn.classList.add('copied')
        setTimeout(function(){btn.textContent='Copy';btn.classList.remove('copied')},2000)
      }).catch(function(){btn.textContent='Failed'})
    }
    wrap.appendChild(btn)
  })
}

/* ─── Sidebar ─── */
function renderNav(){
  document.getElementById('nav').innerHTML=NAV.map(function(g){return'<div class="nav-group">'
    +'<div class="nav-group-header open" onclick="this.classList.toggle(&apos;open&apos;);this.nextElementSibling.classList.toggle(&apos;open&apos;)">'
    +'<span><i class="fas '+g.icon+'" style="width:1rem"></i> '+g.label+'</span>'
    +'<span class="chevron"><i class="fas fa-chevron-right"></i></span></div>'
    +'<div class="nav-links open">'
    +g.pages.map(function(p){var badge=p.mvp!==undefined?(p.mvp?'<span class="mvp-scope-badge in-mvp" style="float:right;margin-top:1px">MVP</span>':'<span class="mvp-scope-badge post-mvp" style="float:right;margin-top:1px">Full</span>'):'';return'<a class="nav-link" href="#'+p.id+'" onclick="navigate(&apos;'+p.id+'&apos;)" data-page="'+p.id+'">'+escHtml(p.label)+badge+'</a>'}).join('')
    +'</div></div>'}).join('')
}
function updateActiveNav(id){
  document.querySelectorAll('.nav-link').forEach(function(a){a.classList.toggle('active',a.dataset.page===id)})
}

/* ─── Navigation ─── */
function navigate(ref){
  var parts=ref.split('#')
  var id=parts[0]
  var anchor=parts[1]||null
  currentPage=id
  skipHashChange=true
  window.location.hash='#'+ref
  skipHashChange=false
  updateActiveNav(id)
  renderPage(id)
  if(anchor){
    setTimeout(function(){
      var el=document.getElementById(anchor)
      if(el)el.scrollIntoView({behavior:'smooth',block:'start'})
    },150)
  }
  document.getElementById('search-input').value=''
  if(window.innerWidth<=768){document.getElementById('sidebar').classList.remove('open');document.getElementById('overlay').classList.remove('show')}
}
window.addEventListener('hashchange',function(){
  if(skipHashChange)return
  var hash=window.location.hash.slice(1)||'overview'
  navigate(hash)
})
function toggleSidebar(){
  document.getElementById('sidebar').classList.toggle('open')
  document.getElementById('overlay').classList.toggle('show')
}

/* ─── Search ─── */
function doSearch(q){
  var el=document.getElementById('page-content')
  if(!q.trim()){renderPage(currentPage);return}
  var results=[]
  var lower=q.toLowerCase()
  for(var i=0;i<searchIndex.length;i++){
    var item=searchIndex[i]
    var idx=item.text.indexOf(lower)
    if(idx!==-1){
      var before=item.text.slice(Math.max(0,idx-60),idx)
      var match=item.text.slice(idx,idx+80)
      var path=item.path||''
      results.push({id:item.id,label:item.label,path:path,
        before:escHtml(before),match:escHtml(match.slice(0,80)),after:escHtml(item.text.slice(idx+80,idx+140))})
    }
  }
  if(results.length===0){
    el.innerHTML='<h1>Search</h1><p>No results for "<strong>'+escHtml(q)+'</strong>"</p>'
    document.getElementById('toc-wrap').classList.add('hidden')
    return
  }
  el.innerHTML='<h1>Search: "'+escHtml(q)+'"</h1><p style="color:#888;font-size:.875rem">'+results.length+' result'+(results.length===1?'':'s')+'</p>'
    +results.slice(0,100).map(function(r){return'<div class="search-result" onclick="navigate(&apos;'+r.id+'&apos;)">'
      +'<div><strong>'+r.label+'</strong></div>'
      +(r.path?'<div class="result-path">'+escHtml(r.path)+'</div>':'')
      +'<div style="font-size:.8125rem;margin-top:4px;line-height:1.4;word-break:break-all">...'+r.before+'<em>'+r.match+'</em>'+r.after+'...</div>'
      +'</div>'}).join('')
  document.getElementById('toc-wrap').classList.add('hidden')
}

/* ─── Page rendering ─── */
function renderPage(id){
  var el=document.getElementById('page-content')
  var html=''
  if(typeof PAGES[id]==='function'){PAGES[id](el);return}
  if(typeof PAGES[id]==='string'){html=PAGES[id]}else{html='<h1>Page not found</h1><p>Page "'+id+'" doesn\\'t exist.</p>'}
  
  // Breadcrumb
  var bc=getBreadcrumb(id)
  var breadcrumbHtml=''
  if(bc){
    breadcrumbHtml='<div class="breadcrumb"><a href="#overview" onclick="navigate(&apos;overview&apos;)">Home</a><span class="sep">/</span>'+escHtml(bc.group)+'<span class="sep">/</span><span>'+escHtml(bc.page)+'</span></div>'
  }
  if(id==='overview'){
    breadcrumbHtml='<div class="breadcrumb"><span>Home</span></div>'
  }
  
  el.innerHTML=breadcrumbHtml+html
  
  // Heading anchors
  addHeadingAnchors(el)
  
  // TOC
  var tocItems=buildToc(el)
  renderToc(tocItems)
  
  // Copy buttons
  addCopyButtons(el)
  
  // Initialize erd-editor on the ERD page
  if(id === 'db-erd' && typeof window.__initErdEditor === 'function'){
    window.__initErdEditor('erd-wrap')
  }
}

/* ─── Build PAGES from base data ─── */
var PAGES={}
for(var key in PAGES_BASE){
  var val=PAGES_BASE[key]
  if(typeof val==='string'){PAGES[key]=md(val)}
}

/* ─── Schema cross-references ─── */
for(var i=0;i<SCHEMA_TABLES.length;i++){
  var tbl=SCHEMA_TABLES[i]
  var key='db-table-'+tbl.name.replace(/_/g,'-')
  if(PAGES[key]){
    var links=[]
    if(tbl.name==='clock_entries')links.push('<a href="#compliance-hipaa">HIPAA</a>|<a href="#spec-audit">Audit Events</a>')
    if(tbl.name==='audit_entries')links.push('<a href="#spec-audit">Audit Events</a>|<a href="#compliance-soc2">SOC 2</a>|<a href="#compliance-incident">Incident Response</a>')
    if(tbl.name==='sessions')links.push('<a href="#spec-sessions">Session Management</a>')
    if(tbl.name==='shift_templates'||tbl.name==='recurrence_rules')links.push('<a href="#db-rrule">RRULE Storage</a>')
    if(tbl.name==='people')links.push('<a href="#compliance-gdpr">GDPR</a>')
    if(tbl.name==='region_routing')links.push('<a href="#compliance-residency">Data Residency</a>')
    if(tbl.name==='consent_records')links.push('<a href="#compliance-gdpr">GDPR</a>')
    if(links.length){
      PAGES[key]=PAGES[key].replace('</table>','</table><h2>Cross-References</h2><ul>'+links.join('').split('|').map(function(l){return'<li>'+l+'</li>'}).join('')+'</ul>')
    }
  }
}

/* ─── Search index ─── */
function buildSearchIndex(){
  for(var id in PAGES_BASE){
    var val=PAGES_BASE[id]
    var text=''
    if(typeof val==='string')text=val.replace(/[#*`\\[\\]\\|]/g,' ').replace(/<[^>]+>/g,' ')
    var navItem=null
    for(var j=0;j<NAV.length;j++){
      for(var k=0;k<NAV[j].pages.length;k++){
        if(NAV[j].pages[k].id===id){navItem=NAV[j].pages[k];break}
      }
      if(navItem)break
    }
    var path=navItem?'':''  // path computed below
    var groupLabel=''
    for(var j=0;j<NAV.length;j++){
      for(var k=0;k<NAV[j].pages.length;k++){
        if(NAV[j].pages[k].id===id){groupLabel=NAV[j].label;break}
      }
      if(groupLabel)break
    }
    searchIndex.push({id:id,label:navItem?navItem.label:id,path:groupLabel?groupLabel+' / '+(navItem?navItem.label:id):'',text:text.toLowerCase()})
  }
}

/* ─── Keyboard shortcuts ─── */
document.addEventListener('keydown',function(e){
  if(e.key==='/'&&!e.ctrlKey&&!e.metaKey&&document.activeElement!==document.getElementById('search-input')){
    e.preventDefault()
    document.getElementById('search-input').focus()
  }
  if(e.key==='Escape'){
    document.getElementById('search-input').blur()
  }
})

/* ─── Scroll spy ─── */
var scrollTimeout
window.addEventListener('scroll',function(){
  clearTimeout(scrollTimeout)
  scrollTimeout=setTimeout(scrollSpy,50)
})

/* ─── Init ─── */
window.addEventListener('DOMContentLoaded',function(){
  renderNav()
  buildSearchIndex()
  var hash=window.location.hash.slice(1)||'overview'
  navigate(hash)
})
</script>
</body>
</html>""")

output = ''.join(output_parts)
with open(f'{ROOT}/index.html', 'w') as f:
    f.write(output)

print(f"Generated {len(output)} bytes, {len(output.split(chr(10)))} lines")
print("Done!")
