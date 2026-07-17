# Glossary of Technical Terms

A reference guide for understanding the technical language used throughout the Roster documentation.

---

## 1. Database & SQL

| Term | Definition |
|---|---|
| **PostgreSQL** | Open-source relational database used as the primary data store. Supports advanced features like RLS, JSONB, and custom types. |
| **RLS (Row-Level Security)** | PostgreSQL feature that restricts which rows a user can access based on policies. Used for multi-tenant isolation — each company only sees their own data. |
| **UUID (Universally Unique Identifier)** | 128-bit identifier used as primary keys across all tables. Generated via `gen_random_uuid()`. |
| **TIMESTAMPTZ** | PostgreSQL timestamp type that stores timezone information. All timestamps are stored in UTC for consistency. |
| **VARCHAR(n)** | Variable-length text with a maximum length. Enforced at database level (e.g., `VARCHAR(255)`). |
| **CITEXT** | PostgreSQL extension for case-insensitive text comparison. Used for email fields so `User@Example.com` matches `user@example.com`. |
| **JSONB** | Binary JSON format in PostgreSQL. Allows efficient storage and querying of structured data. Used for audit old/new values and integration configs. |
| **ENUM** | A data type that restricts values to a predefined list (e.g., `ENUM('active','inactive','deleted')`). |
| **FK (Foreign Key)** | Constraint linking one table's column to another table's primary key. Enforces referential integrity. |
| **PK (Primary Key)** | Unique identifier for each row in a table. All tables use UUIDs. |
| **B-tree Index** | Default index type for efficient equality and range queries. Used on frequently queried columns. |
| **Partial Index** | Index that only includes rows matching a condition (e.g., active sessions only). Saves space and improves performance. |
| **Append-Only** | Data that can only be inserted, never updated or deleted. `audit_entries` and `clock_entries` are append-only for integrity. |
| **Soft-Delete** | Marking records as deleted via `deleted_at` timestamp instead of removing rows. Preserves data for recovery and compliance. |
| **Trigger** | Database function that executes automatically on INSERT/UPDATE/DELETE. Used for RLS enforcement and audit logging. |
| **Migration** | Versioned script that modifies database schema. Run sequentially during deployment. |
| **Connection Pooling** | Reusing database connections across requests to avoid overhead. PgBouncer or built-in pool (max 25 connections). |
| **Read Replica** | Copy of the primary database used for read-heavy operations (reporting, exports) to reduce load on primary. |
| **WAL (Write-Ahead Logging)** | PostgreSQL's mechanism for durability and recovery. WAL archiving enables Point-in-Time Recovery. |
| **PITR (Point-in-Time Recovery)** | Ability to restore database to any specific moment using WAL archives. 30-day retention. |

---

## 2. Architecture & Infrastructure

| Term | Definition |
|---|---|
| **Multi-Tenant** | Architecture where one application instance serves multiple organizations (companies). Each tenant's data is isolated. |
| **Tenant Isolation** | Ensuring one company cannot access another company's data. Achieved via RLS + application middleware. |
| **CDN (Content Delivery Network)** | Distributed servers that cache and serve static assets (CloudFront/Cloudflare). Reduces latency. |
| **ALB/NLB** | Application Load Balancer / Network Load Balancer. Routes traffic to API servers, handles TLS termination. |
| **TLS (Transport Layer Security)** | Encryption protocol for data in transit. Version 1.3 is required. |
| **VPC (Virtual Private Cloud)** | Isolated network environment in the cloud. Database sits in private subnets. |
| **AZ (Availability Zone)** | Physically separate data center within a region. MVP uses 2 AZs for high availability. |
| **ASG (Auto Scaling Group)** | Automatically adjusts number of API instances based on load. |
| **CI/CD (Continuous Integration/Continuous Deployment)** | Automated pipeline for testing, building, and deploying code on push/tag. |
| **PWA (Progressive Web App)** | Web application with native app-like features (offline, push notifications, home screen install). |
| **REST API** | Architectural style for HTTP APIs using standard methods (GET, POST, PATCH, DELETE). |
| **Health Check** | Periodic ping to verify server is running and responsive. Load balancer routes away from unhealthy instances. |

---

## 3. Security & Authentication

| Term | Definition |
|---|---|
| **Session-Based Auth** | Authentication using stored tokens in the database (not JWT). Server validates token on each request. |
| **bcrypt** | Password hashing algorithm with configurable cost. Cost factor 12 means 2^12 iterations. |
| **SHA256** | Cryptographic hash function producing 64-char hex strings. Used for token hashing (sessions, password resets). |
| **HMAC (Hash-based Message Authentication Code)** | Hash combined with a secret key for tamper detection. Audit entries use HMAC-SHA256 chain. |
| **JWT (JSON Web Token)** | Stateless token format. **Not used** in Roster — we use database-stored sessions for revocation control. |
| **TOTP (Time-based One-Time Password)** | Time-based 2FA codes (Google Authenticator). Required in HIPAA mode. |
| **MFA (Multi-Factor Authentication)** | Authentication requiring multiple verification methods (password + TOTP code). |
| **CORS (Cross-Origin Resource Sharing)** | HTTP header mechanism controlling which domains can access the API. |
| **CSRF (Cross-Site Request Forgery)** | Attack where forged requests submit from authenticated sessions. Mitigated via tokens/SameSite cookies. |
| **Rate Limiting** | Restricting number of requests per time window to prevent abuse. Applied at API gateway or application level. |
| **Authorization Header** | HTTP header containing the session token: `Authorization: Bearer <token>`. |

---

## 4. Scheduling & Calendar

| Term | Definition |
|---|---|
| **RRULE (RFC 5545)** | Standard format for recurrence rules. Example: `FREQ=WEEKLY;BYDAY=MO,WE,FR` = every Monday, Wednesday, Friday. |
| **Shift Template** | Reusable shift definition with title, duration, start time, required staff count, and optional recurrence. |
| **Shift Instance** | Concrete, published shift created from a template. Has specific dates/times in UTC. |
| **Expand-on-Publish** | Process of materializing RRULE templates into concrete shift rows at publish time (not on every read). |
| **Double-Booking** | Scheduling conflict where a person is assigned to overlapping shifts. Detected and prevented by the system. |
| **Coverage** | Ratio of filled shifts to required staff. Visualized as heatmap (green = good, yellow = light, red = understaffed). |
| **Overtime** | Hours worked beyond configured thresholds (e.g., daily > 8h, weekly > 40h). Detected automatically. |
| **Minimum Rest Period** | Required gap between consecutive shifts (default 8 hours). Prevents overwork. |
| **Predictive Scheduling** | Regulation requiring schedules posted N days in advance. Penalizes last-minute changes. |
| **iCal (.ics)** | Standard file format for calendar data. Can be downloaded or subscribed to via webcal. |
| **Webcal** | URL-based calendar subscription that auto-updates when shifts change. Uses ETag caching. |
| **ETag** | HTTP cache validator — hash of content used to determine if it has changed. Avoids re-downloading unchanged calendars. |

---

## 5. Compliance & Privacy

| Term | Definition |
|---|---|
| **GDPR (General Data Protection Regulation)** | EU regulation on data protection and privacy. Grants rights: access, rectification, erasure, portability. |
| **CCPA (California Consumer Privacy Act)** | California law granting consumers rights over personal data (opt-out, deletion, disclosure). |
| **SOC 2 (Service Organization Control 2)** | Framework for managing customer data based on 5 trust criteria: security, availability, processing integrity, confidentiality, privacy. |
| **HIPAA (Health Insurance Portability and Accountability Act)** | US law protecting health information. Requires BAA, PHI safeguards, access controls. |
| **BAA (Business Associate Agreement)** | Contract required before handling PHI on behalf of a covered entity (healthcare provider). |
| **PHI (Protected Health Information)** | Health data that can identify an individual. In Roster: clock times and location in healthcare settings. |
| **Data Residency** | Requirement to store data in specific geographic regions. Implemented via regional database sharding. |
| **Data Portability** | GDPR right to receive personal data in a machine-readable format. |
| **Right to Erasure** | GDPR right to delete personal data. Implemented via soft-delete + anonymization. |
| **Consent Record** | Logged record of user consent for data processing. Required for GDPR/CCPA compliance. |

---

## 6. API & Integration

| Term | Definition |
|---|---|
| **CRUD** | Create, Read, Update, Delete — the four basic database operations. |
| **Pagination** | Splitting large result sets into pages. Uses offset-based with cursor-ready design (default 50 per page). |
| **Webhook** | HTTP callback triggered by events (shift created, assignment changed). Includes HMAC signature for verification. |
| **Feature Flag** | Toggle to enable/disable features per company without code deployment (e.g., `self_scheduling_enabled`). |
| **Cache-Aside** | Caching pattern: check cache → if miss, query DB → populate cache. Used for schedules, people lists. |
| **TTL (Time to Live)** | How long cached data remains valid before refresh (e.g., 5 minutes for schedule queries). |

---

## 7. General Development

| Term | Definition |
|---|---|
| **MVP (Minimum Viable Product)** | Smallest shippable version with core features. Roster MVP: ~38.5 days / 8 weeks development. |
| **RBAC (Role-Based Access Control)** | Permission model where access is determined by user role (company_admin, manager, employee, super_admin). |
| **Audit Log** | Immutable record of all system changes. Includes who, what, when, and old/new values. |
| **Middleware** | Code that runs before route handlers. Used for auth, tenant isolation, and RBAC checks. |
| **Endpoint** | Specific API URL + HTTP method combination (e.g., `GET /api/v1/teams`). |
| **Idempotent** | Operation that produces same result whether run once or multiple times. Important for retry safety. |
| **Backward-Compatible** | Changes that don't break existing clients. Migrations and API changes must be backward-compatible. |
