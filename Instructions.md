# GROW Fitness — Backend Implementation Plan (NestJS + MongoDB)

> **Source:** Functional requirements for Team, Coach, Client, and Admin portals, plus PRD details on scheduling, CRM, reports, e-store, quizzes, and automations. :contentReference[oaicite:1]{index=1}

> **Note on tech:** The PRD’s “Technical Documentation” names Node/Express and MySQL; we are implementing the same functionality with **NestJS + MongoDB** while preserving behavior. :contentReference[oaicite:2]{index=2}

---

## 0) Project Scaffold & Global Conventions

### 0.1 Scaffold (no code — actions for Cursor)

- Initialize a NestJS monorepo with modules per domain: `auth`, `users`, `coaches`, `clients`, `sessions`, `passes`, `milestones`, `crm`, `invoices`, `payments`, `reports`, `content`, `quiz`, `estore`, `feedback`, `calendar`, `notifications`, `admin`, `audits`, `files`. These match Team/Coach/Client/Admin features in the spec. :contentReference[oaicite:3]{index=3}
- Add MongoDB via official driver/Mongoose; configure connection from env vars.
- Enable **ValidationPipe** (whitelist, forbidNonWhitelisted, transform), **class-validator** DTOs, **class-transformer**.
- Add **JWT auth** (access + optional refresh), **RBAC** (roles guard: Admin, Team, Coach, Client).
- Add **Global Exception Filter** producing uniform error envelopes and sensible HTTP codes.
- Add **Logging Interceptor** (traceId per request), request/response logging with size limits.
- Add **ConfigModule**: `PORT`, `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CALENDAR_*`, `PAYMENT_*`, `EMAIL_*`, `SMS_*`, `FILE_BUCKET_*`.
- Add **Helmet**, **CORS**, **rate limiting**.
- Define **Common Response Shape**:
  ```json
  { "ok": true, "data": { ... }, "meta": { "traceId": "..." } }
  ```
  Errors:
  ```json
  { "ok": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": {...} }, "meta": { "traceId": "..." } }
  ```
- Create `shared` utilities: error codes, pagination, sorting, filters; `common` module for DTOs (PageQuery), pipes, guards, interceptors.
- Add **Swagger** (OpenAPI) and Postman collection export.

**Test checklist (0):**

- Health endpoint returns 200.
- DTO validation rejects malformed payloads (400).
- Auth guard blocks protected routes (401/403).

**Postman samples (0):**

- `GET /health`
- `POST /auth/login` with email/password (expect token pair).

---

## 1) Auth & Users (Roles & Permissions)

**Why:** Role-based access across Team, Coach, Client, Admin portals. :contentReference[oaicite:4]{index=4}

### 1.1 Collections & Indexes

- `users` (email [unique], passwordHash, role ∈ {admin, team, coach, client}, name, phone, status, createdAt, updatedAt)
  - Index: `{ email: 1 } unique`, `{ role: 1 }`, `{ status: 1 }`
- `refreshTokens` (userId, tokenHash, exp, createdAt)
  - Index: `{ userId: 1, exp: 1 }`

### 1.2 Endpoints

- `POST /auth/register` (Admin/Team create users; public self-signup for clients when enabled)
- `POST /auth/login` → JWT access + refresh
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /me` (profile)
- `PATCH /users/:id` (Admin/Team)
- `GET /users` (Admin with filters by role/status)

### 1.3 Validation & Security

- Strong password constraints, email format, phone E.164.
- Lockout after N failed attempts, optional 2FA toggle.

### 1.4 Service Flow

- Login → verify → issue tokens → store hashed refresh token.
- Guards: `JwtAuthGuard`, `RolesGuard`.

### 1.5 Errors

- 400 invalid DTO, 401 bad creds, 403 role mismatch, 409 duplicate email.

**Test checklist (1):**

- Create Team/Coach/Client accounts.
- RBAC: client cannot access admin routes.

**Postman (1):**

- `POST /auth/login` `{ "email": "...", "password": "..." }`
- `GET /users?role=coach` (Admin)

---

## 2) Clients & Coaches

**Why:** Profiles and linkage power coach dashboards, client records, and scheduling. :contentReference[oaicite:5]{index=5}

### 2.1 Collections

- `clients` (userId, demographics, goals, T&C acceptedAt, preferences, assignedCoachId, tags, files[])
- `coaches` (userId, specialties[], bio, certifications[], availabilityRules, kpisCache)
- Indexes: `{ assignedCoachId: 1 }`, `{ tags: 1 }`

### 2.2 Endpoints

- `GET /clients/:id` (Team/Coach for own clients; Client self)
- `PATCH /clients/:id`
- `GET /coaches/:id`
- `PATCH /coaches/:id`
- `POST /team/assign-coach` (Team: clientId, coachId) — supports drag-drop calendar later. :contentReference[oaicite:6]{index=6}

### 2.3 Errors

- 403 if accessing others’ private data; 409 if reassignment conflicts.

**Test checklist (2):**

- Assign coach; fetch client record dashboard view fields. :contentReference[oaicite:7]{index=7}

**Postman (2):**

- `POST /team/assign-coach` `{ "clientId": "...", "coachId": "..." }`

---

## 3) Sessions & Scheduling (+ Google Calendar)

**Why:** Coach calendar scheduling, client booking, two-way sync. :contentReference[oaicite:8]{index=8}

### 3.1 Collections

- `sessions` (clientId, coachId, startsAt, endsAt, status ∈ {scheduled, completed, canceled, no_show}, location, notes)
  - Indexes: `{ coachId: 1, startsAt: 1 }`, `{ clientId: 1, startsAt: 1 }`
- `calendarAccounts` (userId, provider="google", oauth, syncState)
- `calendarEvents` (sessionId, providerEventId, lastSyncedAt)

### 3.2 Endpoints

- `POST /sessions` (Client or Team) — applies availability rules. :contentReference[oaicite:9]{index=9}
- `GET /sessions?coachId=&dateFrom=&dateTo=`
- `PATCH /sessions/:id` (reschedule/cancel)
- `POST /calendar/connect` (OAuth)
- `POST /calendar/sync` (Admin/Team) — manual sync trigger

### 3.3 Service Flow

- Create session → write DB → upsert Google event (if connected) → confirmations. :contentReference[oaicite:10]{index=10}

### 3.4 Errors

- 409 overlap, 422 outside availability, 502 provider error.

**Test checklist (3):**

- Book session; verify event appears in Google Calendar. :contentReference[oaicite:11]{index=11}

**Postman (3):**

- `POST /sessions` `{ "clientId":"...", "coachId":"...", "startsAt":"...", "endsAt":"..." }`

---

## 4) Free Passes

**Why:** Auto-generate free session passes with tracking. :contentReference[oaicite:12]{index=12}

### 4.1 Collections

- `freePasses` (code, clientId?, issuedByUserId, expiration, remainingUses, status ∈ {active, expired, redeemed})
  - Indexes: `{ code: 1 } unique`, `{ status: 1, expiration: 1 }`

### 4.2 Endpoints

- `POST /passes` (Team) — generate N unique codes.
- `GET /passes?status=`
- `POST /passes/redeem` (Client) — consumes a use, links to session booking.

### 4.3 Errors

- 410 expired, 409 already redeemed.

**Test checklist (4):**

- Generate → redeem → book session flow.

**Postman (4):**

- `POST /passes` `{ "count": 10, "expiresInDays": 30 }`

---

## 5) Milestones & Gifts Automation

**Why:** Trigger rewards after X sessions or goals achieved. :contentReference[oaicite:13]{index=13}

### 5.1 Collections

- `milestones` (clientId, type, threshold, progress, achievedAt)
- `gifts` (clientId, milestoneId, status ∈ {pending, sent}, deliveryMeta)

### 5.2 Endpoints

- `POST /milestones/definitions` (Admin) — define rules.
- `GET /milestones?clientId=`
- `POST /milestones/evaluate` (job-safe endpoint)
- `POST /gifts/dispatch` (Admin/Team) — email/SMS/webhook

### 5.3 Errors

- 409 duplicate gift for same milestone.

**Test checklist (5):**

- Complete X sessions → milestone triggers gift. :contentReference[oaicite:14]{index=14}

**Postman (5):**

- `POST /milestones/evaluate` `{ "clientId": "..." }`

---

## 6) Invoicing & Payments

**Why:** Track issued, paid, overdue invoices; exportable reports. :contentReference[oaicite:15]{index=15}

### 6.1 Collections

- `invoices` (number [unique], clientId, items[], currency, totals, status ∈ {pending, paid, overdue}, dueAt)
- `payments` (invoiceId, amount, method, gatewayMeta, status ∈ {captured, failed}, paidAt)
  - Indexes: `{ status: 1, dueAt: 1 }`, `{ clientId: 1 }`

### 6.2 Endpoints

- `POST /invoices` (Team/Admin)
- `GET /invoices?status=&clientId=`
- `POST /payments/webhook` (gateway)
- `POST /invoices/:id/remind` (sends reminder)

### 6.3 Errors

- 422 totals mismatch, 409 duplicate number, 400 invalid webhook signature.

**Test checklist (6):**

- Pending → paid via webhook → appears in dashboards. :contentReference[oaicite:16]{index=16}

**Postman (6):**

- `POST /invoices` with line items
- `POST /payments/webhook` (signed test payload)

---

## 7) CRM & Conversation Timelines

**Why:** Unified log of emails, session notes, chatbot interactions, internal logs. :contentReference[oaicite:17]{index=17}

### 7.1 Collections

- `crmEntries` (clientId, type ∈ {email, note, chatbot, meeting, internal}, authorUserId?, body, attachments[], createdAt)
- `internalLogs` (teamOnly: true, clientId, message, tags[]) — separate view. :contentReference[oaicite:18]{index=18}
  - Indexes: `{ clientId: 1, createdAt: -1 }`, `{ type: 1 }`

### 7.2 Endpoints

- `POST /crm` (Team/Coach)
- `GET /crm?clientId=&type=`
- `POST /internal-logs`
- `GET /internal-logs?clientId=`

### 7.3 Errors

- 403 if non-team accesses internal logs.

**Test checklist (7):**

- Timeline shows session notes and chatbot entries. :contentReference[oaicite:19]{index=19}

**Postman (7):**

- `GET /crm?clientId=...&type=session_note`

---

## 8) Coach Dashboard Metrics

**Why:** Progress logs, reminders, training funnel, earnings. :contentReference[oaicite:20]{index=20}

### 8.1 Collections

- `progressLogs` (clientId, coachId, sessionId?, text, createdAt)
- `coachTraining` (coachId, steps[], status)
- `coachEarnings` (coachId, period, sessionsCount, amount, exports[]) :contentReference[oaicite:21]{index=21}

### 8.2 Endpoints

- `POST /progress-logs`
- `GET /progress-logs?clientId=`
- `GET /coach/reports?period=weekly|monthly` (downloadable) :contentReference[oaicite:22]{index=22}
- **Reminders:** handled by Notifications module (see §12) with 1-day and 1-hour pre-session rules. :contentReference[oaicite:23]{index=23}

**Test checklist (8):**

- Log after session; verify earnings aggregation appears weekly/monthly. :contentReference[oaicite:24]{index=24}

**Postman (8):**

- `POST /progress-logs` `{ "clientId":"...", "text":"..." }`

---

## 9) Client Bookings & Interface Helpers

**Why:** Sticky “Book a Free Session”, onboarding prep, Google Calendar add, etc. :contentReference[oaicite:25]{index=25}

### 9.1 Collections

- Uses `sessions`, `freePasses`, plus:
- `prepGuides` (clientId, checklist[], progress%) :contentReference[oaicite:26]{index=26}

### 9.2 Endpoints

- `POST /bookings/free-session` — validates pass or trial eligibility. :contentReference[oaicite:27]{index=27}
- `GET /prep-guide?clientId=`
- `POST /prep-guide/checklist` — update completion.
- `POST /calendar/add` — returns ICS or deep-link for Google add. :contentReference[oaicite:28]{index=28}

**Test checklist (9):**

- Booking returns calendar link and prep guide is generated. :contentReference[oaicite:29]{index=29}

**Postman (9):**

- `POST /bookings/free-session` `{ "clientId": "...", "coachId":"..." }`

---

## 10) Quizzes (Activity & Parenting) + BMI

**Why:** Personalized suggestions; BMI tool; results feed upsell prompts. :contentReference[oaicite:30]{index=30}

### 10.1 Collections

- `quizzes` (slug, title, questions[])
- `quizResults` (clientId, quizSlug, score, recommendations[])
- `bmiResults` (clientId?, height, weight, bmi, category, recommendations) :contentReference[oaicite:31]{index=31}

### 10.2 Endpoints

- `GET /quizzes/:slug`
- `POST /quizzes/:slug/submit`
- `POST /bmi/calc` — returns BMI + guidance. :contentReference[oaicite:32]{index=32}

### 10.3 Errors

- 422 invalid answers, 429 if spam.

**Test checklist (10):**

- Quiz produces recommendations; BMI returns category. :contentReference[oaicite:33]{index=33}

**Postman (10):**

- `POST /quizzes/activity/submit` `{ "answers":[...] }`
- `POST /bmi/calc` `{ "heightCm": 170, "weightKg": 70 }`

---

## 11) Content & Testimonials (Resource Centre)

**Why:** Articles, videos, tools, testimonials with search/filter. :contentReference[oaicite:34]{index=34}

### 11.1 Collections

- `contents` (type ∈ {article, video, tool}, title, body, tags[], visibility, authorId)
- `testimonials` (authorName, text, rating, mediaUrl, category) :contentReference[oaicite:35]{index=35}
- Indexes: `{ tags: 1 }`, text index on `title/body`.

### 11.2 Endpoints

- `GET /contents?tag=&q=`
- `POST /contents` (Admin)
- `GET /testimonials?category=`
- `POST /testimonials` (Admin/Team) :contentReference[oaicite:36]{index=36}

**Test checklist (11):**

- Search by tag; testimonial carousel feed returns sorted list. :contentReference[oaicite:37]{index=37}

**Postman (11):**

- `GET /contents?tag=parenting`

---

## 12) Notifications (Email/SMS) & Automated Reminders

**Why:** Session reminders 1-day and 1-hour pre-session; milestone/gift notices; invoice reminders. :contentReference[oaicite:38]{index=38}

### 12.1 Collections

- `notifications` (to, channel ∈ {email, sms}, template, params, scheduledAt, status)
- `notificationRules` (type, scheduleSpec, enabled)

### 12.2 Endpoints

- `POST /notifications/test`
- `POST /notifications/schedule` (Admin/Team)
- Background worker to materialize rules (cron).

**Test checklist (12):**

- Upcoming session → email/SMS fired at both offsets. :contentReference[oaicite:39]{index=39}

**Postman (12):**

- `POST /notifications/test` `{ "to":"...", "template":"session_reminder", "params":{...} }`

---

## 13) E-Store (Optional)

**Why:** Premium content/merch; cart, checkout, payment; analytics. :contentReference[oaicite:40]{index=40}

### 13.1 Collections

- `products` (type ∈ {digital, merch}, title, price, sku, stock, media[], active, discount)
- `orders` (clientId, items[], totals, status ∈ {cart, placed, fulfilled, canceled})
- Index: `{ sku: 1 }`, `{ status: 1 }` :contentReference[oaicite:41]{index=41}

### 13.2 Endpoints

- `GET /products?active=true`
- `POST /cart/items`
- `POST /checkout` (creates order; calls gateway)
- `POST /payments/webhook` (shared with §6)

**Test checklist (13):**

- Digital product purchase completes; order marked fulfilled; delivery tracking optional. :contentReference[oaicite:42]{index=42}

**Postman (13):**

- `POST /checkout` `{ "clientId":"...", "items":[...] }`

---

## 14) Reports & Analytics

**Why:** Monthly performance, session counts, satisfaction, churn, earnings. :contentReference[oaicite:43]{index=43}

### 14.1 Collections

- `reports` (type, period, params, data, generatedAt)
- Aggregations across sessions, invoices, feedback, quiz results.

### 14.2 Endpoints

- `GET /reports/kpi?period=monthly&coachId=...` (exports)
- `POST /reports/generate` (Admin) :contentReference[oaicite:44]{index=44}

**Test checklist (14):**

- Coach-filtered KPI matches ground truth; CSV export downloads. :contentReference[oaicite:45]{index=45}

**Postman (14):**

- `GET /reports/kpi?period=monthly`

---

## 15) Feedback

**Why:** Anonymous/named session & program feedback; satisfaction inputs for KPIs. :contentReference[oaicite:46]{index=46}

### 15.1 Collections

- `feedback` (clientId?, sessionId?, rating, comments, category, anonymous, createdAt)
- Indexes: `{ sessionId: 1 }`, `{ createdAt: -1 }`

### 15.2 Endpoints

- `POST /feedback`
- `GET /feedback?coachId=&period=`

**Test checklist (15):**

- Feedback contributes to monthly reports. :contentReference[oaicite:47]{index=47}

**Postman (15):**

- `POST /feedback` `{ "rating": 5, "comments": "...", "anonymous": true }`

---

## 16) Partner/Co-Coach Invitations

**Why:** Invite collaborators with temporary, role-scoped access. :contentReference[oaicite:48]{index=48}

### 16.1 Collections

- `partnerInvites` (email, role, scope {clientIds[]}, token, expiresAt, status)
- Index: `{ token: 1 } unique`, `{ status: 1, expiresAt: 1 }`

### 16.2 Endpoints

- `POST /partners/invite`
- `POST /partners/accept` (uses token)
- `GET /partners` (Admin/Team) :contentReference[oaicite:49]{index=49}

**Test checklist (16):**

- Invite accepted → scoped access limited to specified clients.

**Postman (16):**

- `POST /partners/invite` `{ "email":"...", "scope":{ "clientIds":["..."] } }`

---

## 17) Admin Controls & Automations

**Why:** Toggle automations, manage roles, integrated tools, resource library, audit logs. :contentReference[oaicite:50]{index=50}

### 17.1 Collections

- `settings` (key, value, updatedBy)
- `auditLogs` (who, action, entity, before, after, ts)
- `integrations` (chatbot, calendar, payment, BMI lib configs) :contentReference[oaicite:51]{index=51}

### 17.2 Endpoints

- `GET /admin/dashboard/summary`
- `PATCH /admin/settings` (toggle features)
- `GET /audits?entity=&userId=&dateFrom=&dateTo=` :contentReference[oaicite:52]{index=52}

**Test checklist (17):**

- Toggling reminder automation affects notifications; audit lines written.

**Postman (17):**

- `PATCH /admin/settings` `{ "notifications.reminders.enabled": true }`

---

## 18) Files & Media

**Why:** Store uploads for reports, resources, testimonials, certifications. (Used across Team/Coach/Client). :contentReference[oaicite:53]{index=53}

### 18.1 Collections

- `files` (ownerId?, roleScope, url, kind, meta, createdAt)

### 18.2 Endpoints

- `POST /files/sign` (pre-signed upload)
- `POST /files/complete`
- `GET /files/:id`

**Test checklist (18):**

- Upload flow validates MIME/size; URLs expiring appropriately.

---

## 19) DRY, Error Handling, Logging — Implementation Requirements

- **DTOs everywhere**; reuse shared `PageQuery`, `IdParam`, `DateRange` DTOs.
- **Global exception filter** maps library errors to API codes; never leak stack traces.
- **Enum error codes** (`AUTH_INVALID_CREDENTIALS`, `SESS_OVERLAP`, `INV_DUP_NUMBER`, …).
- **Transactional behavior**: where needed, use Mongo sessions (e.g., invoice + payment write).
- **Idempotency** for webhooks and gift dispatch.
- **Consistent pagination**: `?page=1&limit=20&sort=createdAt:desc`.
- **Observability**: requestId, timing, key counters (sessions booked, reminders sent).
- **Security**: input size caps, file scanning hooks, strict CORS, sanitize HTML content entries.

---

## 20) Implementation Order (for Cursor)

1. §0, §1 Auth & Users
2. §2 Clients & Coaches
3. §3 Sessions & Calendar
4. §4 Free Passes
5. §12 Notifications (reminders)
6. §5 Milestones & Gifts
7. §6 Invoicing & Payments (+ webhook)
8. §7 CRM & Internal Logs
9. §10 Quizzes & BMI
10. §11 Content & Testimonials
11. §13 E-Store (optional)
12. §14 Reports
13. §16 Partner Invites
14. §17 Admin & Audits

At each step: expose Swagger, update Postman, and run the test checklist.

---

## 21) Sample Postman Folder Structure

- **Auth & Users**
- **Clients & Coaches**
- **Sessions & Calendar**
- **Free Passes**
- **Notifications**
- **Milestones & Gifts**
- **Invoices & Payments**
- **CRM & Logs**
- **Quizzes & BMI**
- **Content & Testimonials**
- **E-Store**
- **Reports**
- **Partner Invites**
- **Admin & Audits**

---

## 22) Acceptance Criteria (per module)

- Endpoints implemented with DTO validation, RBAC, and OpenAPI docs.
- Mongo collections with defined indexes; slow queries < 200ms p95 on test data.
- Error responses follow common envelope; no unhandled exceptions (crash-free).
- Background jobs (reminders, milestone evaluation) run on schedule and are idempotent.
- Postman flows green; e2e happy paths + key edge cases covered.

---

## 23) Mapping to PRD Features (traceability)

- **Team Portal:** free passes, coach assignment calendar, milestones, invoicing, CRM timeline, monthly reports, internal logs, client record dashboard, partner invites. :contentReference[oaicite:54]{index=54}
- **Coach Dashboard:** client progress logs, automated reminders (1-day/1-hour), onboarding/training funnel, personal tracker, education hub, earnings reports, calendar sync. :contentReference[oaicite:55]{index=55}
- **Client Interface:** persistent “Book a Free Session”, chatbot, quizzes, testimonials, T&Cs, resource centre, upsell prompts, e-store, BMI, prep guide, feedback, Google Calendar, chatbot integration. :contentReference[oaicite:56]{index=56}
- **Admin & Backend:** role dashboards, automation suite, integrated tools, CRM & reporting, optional e-commerce, audit logs, documentation deliverables. :contentReference[oaicite:57]{index=57}

---

## 24) Handover & Docs

- Export **Swagger** + **Postman**.
- Admin user guide; coach onboarding manual; client getting-started guide; deployment checklist. :contentReference[oaicite:58]{index=58}
