# Database & Infrastructure Audit

> Schema: `/src/db/schema/` (12 files)
> Config: `/drizzle.config.ts`
> Spec: `/research/22-backend-infrastructure.md`, `/MEGA_PROMPT.md` PART 22
> Date: 2026-04-11

---

## 1. Complete Schema Inventory

### 1.1 Tables (20 tables across 10 schema files)

| Table | File | Columns | Indexes | FKs | Status |
|-------|------|---------|---------|-----|--------|
| `users` | users.ts | 17 | 4 (2 unique, 2 standard) | 0 | Complete |
| `diagrams` | diagrams.ts | 18 | 7 (incl. GIN for tags + JSONB) | 3 (users, templates, challenges) | Complete |
| `diagram_versions` | diagrams.ts | 5 | 1 (unique composite) | 1 (diagrams) | Complete |
| `templates` | templates.ts | 14 | 4 (1 unique, 3 standard) | 0 | Complete |
| `challenges` | challenges.ts | 17 | 4 (1 unique, 3 standard incl. GIN) | 0 | Complete |
| `challenge_rubrics` | challenges.ts | 8 | 1 | 1 (challenges) | Complete |
| `challenge_concepts` | challenges.ts | 2 | composite PK | 2 (challenges, concepts) | Complete |
| `challenge_attempts` | challenges.ts | 12 | 4 | 2 (users, challenges) | Complete |
| `concepts` | progress.ts | 8 | 2 (1 unique) | 0 | Complete |
| `progress` | progress.ts | 17 | 3 (1 unique composite) | 2 (users, concepts) | Complete |
| `review_events` | progress.ts | 11 | 2 | 2 (users, concepts) | Complete |
| `achievements` | achievements.ts | 10 | 0 (slug unique inline) | 0 | Complete |
| `achievements_users` | achievements.ts | 4 | composite PK + 2 | 2 (users, achievements) | Complete |
| `comments` | community.ts | 8 | 3 | 2 (diagrams, users) + self-ref via raw SQL | Complete |
| `upvotes` | community.ts | 3 | composite PK + 1 | 2 (users, diagrams) | Complete |
| `reports` | community.ts | 10 | 1 | 3 (users x2, diagrams) + 1 (comments) | Complete |
| `collab_sessions` | collaboration.ts | 7 | 2 | 2 (diagrams, users) | Complete |
| `collab_participants` | collaboration.ts | 4 | composite PK | 2 (sessions, users) | Complete |
| `notifications` | notifications.ts | 10 | 3 (incl. partial index for unread) | 2 (users x2) | Complete |
| `activity_events` | activity.ts | 9 | 4 (incl. partial index for public) | 5 (users, diagrams, challenges, concepts, achievements) | Complete |

**Total: 20 tables, ~200 columns, ~50 indexes, ~30 foreign keys**

### 1.2 Enums (15 enums)

| Enum | Values | File |
|------|--------|------|
| `subscription_tier` | free, pro, team, enterprise | users.ts |
| `diagram_visibility` | private, unlisted, public | diagrams.ts |
| `diagram_type` | 9 values (system-design through custom) | diagrams.ts |
| `template_difficulty` | beginner, intermediate, advanced | templates.ts |
| `template_category` | 12 categories | templates.ts |
| `challenge_difficulty` | easy, medium, hard, expert | challenges.ts |
| `challenge_status` | draft, published, archived | challenges.ts |
| `attempt_status` | in_progress, submitted, grading, graded, error | challenges.ts |
| `mastery_level` | novice, beginner, intermediate, proficient, expert | progress.ts |
| `fsrs_state` | new, learning, review, relearning | progress.ts |
| `fsrs_rating` | again, hard, good, easy | progress.ts |
| `achievement_type` | streak, mastery, challenge, community, exploration, special | achievements.ts |
| `report_status` | pending, reviewed, actioned, dismissed | community.ts |
| `report_reason` | spam, inappropriate, plagiarism, harassment, other | community.ts |
| `collab_session_status` | active, ended | collaboration.ts |
| `notification_type` | 14 types (challenge_graded through welcome) | notifications.ts |
| `activity_type` | 16 types (challenge_started through template_used) | activity.ts |

### 1.3 Relations (relations.ts)

All 20 tables have Drizzle relational query definitions configured. Relations cover:
- User -> diagrams, progress, achievements, attempts, comments, upvotes, notifications, activity events, review events, hosted sessions
- Diagram -> user, template, challenge, forkedFrom, forks, versions, comments, upvotes, collab sessions
- Challenge -> rubrics, concepts, attempts, diagrams
- Concept -> progress, challenge_concepts, review_events
- Comment -> parent/replies (self-referential thread)
- All join tables properly configured

### 1.4 TypeScript Types Exported

- `UserPreferences` -- JSONB preferences schema
- `DiagramContent` -- React Flow serialized state (nodes, edges, viewport)
- `ChallengeConstraints` -- Scale/latency/availability requirements
- `AttemptFeedback` -- AI grading structured output
- `AchievementCondition` -- Union type for achievement unlock conditions

---

## 2. Missing Tables

The following tables are referenced in the spec but NOT in the schema:

### 2.1 `organizations` -- P2
The MEGA_PROMPT mentions Team tier ($25/user/mo) which implies multi-tenant organizations. No `organizations` table or `organization_members` join table exists.

**Needed columns:** id, name, slug, owner_user_id, tier, max_members, stripe_subscription_id, created_at, updated_at
**Needed join table:** `organization_members` (org_id, user_id, role: owner/admin/member, joined_at)

### 2.2 `push_subscriptions` -- P3
The user preferences schema includes push notification settings, and the notifications system mentions web-push. No table stores push subscription endpoints.

**Needed columns:** id, user_id, endpoint, p256dh_key, auth_key, created_at, expires_at

### 2.3 `email_sequences` -- P2
MEGA_PROMPT specifies 5-email welcome drip over 7 days and re-engagement sequences. No table tracks which emails have been sent.

**Needed columns:** id, user_id, sequence_name, step_number, sent_at, opened_at, clicked_at
**Alternative:** Could be handled entirely by Inngest state without a table.

### 2.4 `audit_logs` -- P2
Security spec (29 vulnerabilities) mentions audit logging. No audit log table exists.

**Needed columns:** id, user_id, action, resource_type, resource_id, ip_address, user_agent, metadata (JSONB), created_at
**Note:** Could piggyback on `activity_events` for user actions, but admin/security auditing needs a separate table.

### 2.5 `feature_flags` -- P3
Not explicitly specified but needed for progressive rollout of 12 modules and A/B testing.

### 2.6 `learning_paths` and `learning_path_nodes` -- P1
Screen 14 (Learning Path View) shows 5 preset paths + custom paths. No tables store path definitions or user path progress.

**Needed tables:**
- `learning_paths` (id, slug, title, description, is_preset, created_by_user_id)
- `learning_path_nodes` (id, path_id, concept_id, position_x, position_y, sort_order)
- `user_learning_paths` (user_id, path_id, started_at, completed_at)

---

## 3. Drizzle Configuration

File: `/drizzle.config.ts`

**Current config:**
- Schema source: `./src/db/schema/*` (correctly discovers all 12 files)
- Migration output: `./drizzle/migrations`
- Dialect: PostgreSQL
- DB credentials: `process.env.DATABASE_URL_UNPOOLED!` (correct -- DDL needs direct connection)
- Verbose: true
- Strict: true

**Issues:**
1. **No `src/db/index.ts` file exists** -- The Drizzle client initialization file (with HTTP/WebSocket/TCP connection modes per the backend spec) has not been created.
2. **No migrations generated** -- The `drizzle/migrations` directory needs to be checked/created.
3. **Missing `.env` variables** -- `DATABASE_URL`, `DATABASE_URL_UNPOOLED` are required but `.env` setup is not documented in the codebase.

---

## 4. Missing API Routes

The Next.js App Router API routes directory does not exist. All of the following routes need to be created under `architex/src/app/api/`:

### 4.1 Auth Routes (Clerk Webhook)
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/webhooks/clerk` | POST | Clerk webhook for user sync (create/update/delete) |

### 4.2 Diagram Routes
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/diagrams` | GET | List user's diagrams (paginated) |
| `/api/diagrams` | POST | Create new diagram |
| `/api/diagrams/[id]` | GET | Get diagram by ID |
| `/api/diagrams/[id]` | PATCH | Update diagram (content, metadata) |
| `/api/diagrams/[id]` | DELETE | Delete diagram |
| `/api/diagrams/[id]/fork` | POST | Fork a diagram |
| `/api/diagrams/[id]/versions` | GET | List diagram versions |
| `/api/diagrams/[id]/thumbnail` | POST | Generate/upload thumbnail |

### 4.3 Template Routes
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/templates` | GET | List templates (filtered by category, difficulty) |
| `/api/templates/[slug]` | GET | Get template by slug |
| `/api/templates/[slug]/use` | POST | Create diagram from template (increment use_count) |

### 4.4 Challenge Routes
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/challenges` | GET | List challenges (filtered, paginated) |
| `/api/challenges/[slug]` | GET | Get challenge by slug |
| `/api/challenges/[slug]/attempt` | POST | Start new attempt (create attempt row, return timer) |
| `/api/challenges/[slug]/attempt/[id]` | PATCH | Update attempt (submit) |
| `/api/challenges/[slug]/attempt/[id]/grade` | POST | Trigger AI grading (Inngest event) |
| `/api/challenges/[slug]/attempts` | GET | User's attempts for this challenge |

### 4.5 Progress Routes
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/progress` | GET | User's progress across all concepts |
| `/api/progress/review-queue` | GET | Concepts due for SRS review |
| `/api/progress/review` | POST | Submit SRS review rating |
| `/api/progress/stats` | GET | Dashboard stats (level, streak, modules, interview score) |

### 4.6 Community Routes
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/gallery` | GET | Public diagrams (trending, newest, etc.) |
| `/api/diagrams/[id]/comments` | GET | Comments on a diagram |
| `/api/diagrams/[id]/comments` | POST | Add comment |
| `/api/comments/[id]` | PATCH | Edit comment |
| `/api/comments/[id]` | DELETE | Soft-delete comment |
| `/api/diagrams/[id]/upvote` | POST | Toggle upvote |
| `/api/reports` | POST | Submit content report |

### 4.7 Notification Routes
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/notifications` | GET | User's notifications (paginated, unread first) |
| `/api/notifications/[id]/read` | PATCH | Mark as read |
| `/api/notifications/read-all` | POST | Mark all as read |
| `/api/notifications/unread-count` | GET | Badge count |

### 4.8 User/Settings Routes
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/users/me` | GET | Current user profile |
| `/api/users/me` | PATCH | Update profile |
| `/api/users/me/preferences` | PATCH | Update preferences |
| `/api/users/[username]` | GET | Public profile |
| `/api/users/me/data-export` | POST | GDPR data export (Inngest job) |
| `/api/users/me/delete` | DELETE | Account deletion (Inngest cascade) |

### 4.9 Collaboration Routes
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/collab/sessions` | POST | Create collaboration session |
| `/api/collab/sessions/[id]` | GET | Get session info |
| `/api/collab/sessions/[id]/end` | POST | End session |
| `/api/collab/invite` | POST | Send collaboration invite |

### 4.10 Export Routes
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/export/png` | POST | Server-side PNG generation |
| `/api/export/pdf` | POST | Server-side PDF generation |
| `/api/export/svg` | POST | Server-side SVG generation |

### 4.11 AI Routes
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/ai/assist` | POST | AI assistant chat (Claude API proxy) |
| `/api/ai/review` | POST | AI design review |
| `/api/ai/grade` | POST | AI challenge grading (internal, called by Inngest) |

### 4.12 Search Route
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/search` | GET | Unified search (diagrams, templates, modules) |

**Total: ~45 API routes needed. Currently: 0.**

---

## 5. Background Jobs (Inngest Functions)

The MEGA_PROMPT specifies 17 Inngest functions. None are implemented.

| # | Function Name | Trigger | Purpose |
|---|--------------|---------|---------|
| 1 | `user/sync-from-clerk` | Clerk webhook event | Sync user creation/updates from Clerk to Neon |
| 2 | `user/delete-cascade` | User deletion event | GDPR: delete all user data across tables |
| 3 | `user/data-export` | User export request | GDPR: generate JSON export of all user data |
| 4 | `challenge/grade-attempt` | Attempt submitted event | Send to Claude API, parse rubric scores, update attempt |
| 5 | `challenge/update-counters` | Attempt graded event | Update challenge.submission_count, avg_score |
| 6 | `achievement/check-all` | Any qualifying event | Evaluate all achievement conditions for user |
| 7 | `streak/update` | Any activity event | Update streak_current, streak_longest, streak_last_activity_date |
| 8 | `streak/at-risk-reminder` | Cron (daily 6pm user TZ) | Send push/email if streak will break tomorrow |
| 9 | `email/welcome-sequence` | User created event | 5-email drip over 7 days (adaptive: skip if action completed) |
| 10 | `email/weekly-digest` | Cron (weekly) | Learning summary, upcoming reviews, community highlights |
| 11 | `email/srs-reminder` | Cron (daily) | Concepts due for review notification |
| 12 | `email/re-engagement` | Cron (daily) | 7d/14d/30d inactive user emails |
| 13 | `counter/sync-diagram` | Upvote/comment/fork events | Update denormalized counters on diagrams |
| 14 | `counter/sync-template` | Template used event | Increment template.use_count |
| 15 | `notification/prune` | Cron (daily) | Delete notifications older than 90 days |
| 16 | `thumbnail/generate` | Diagram saved event | Generate thumbnail image for gallery views |
| 17 | `analytics/daily-rollup` | Cron (daily) | Aggregate activity_events into daily stats |

**Setup required:**
- Install `inngest` package
- Create `/api/inngest` route handler
- Create Inngest client instance
- Define all 17 functions in `/src/inngest/functions/`

---

## 6. Email Templates (Resend + react-email)

The spec calls for 13 email templates. None exist.

| # | Template | Trigger | Content |
|---|----------|---------|---------|
| 1 | Welcome (Day 0) | User signup | Platform intro, quick-start CTA |
| 2 | Getting Started (Day 1) | Welcome sequence | First module suggestion, tutorial link |
| 3 | First Challenge (Day 2) | Welcome sequence | Interview challenge CTA |
| 4 | Community (Day 4) | Welcome sequence | Community gallery, sharing |
| 5 | Pro Upgrade (Day 7) | Welcome sequence | Feature comparison, trial CTA |
| 6 | Weekly Digest | Cron | Progress summary, upcoming reviews, trending designs |
| 7 | SRS Review Reminder | Cron | X concepts due, review CTA |
| 8 | Streak at Risk | Cron | Streak will break, login CTA |
| 9 | Re-engagement (7d) | Cron | Miss you, what's new |
| 10 | Re-engagement (14d) | Cron | New features, community highlights |
| 11 | Re-engagement (30d) | Cron | Final attempt, account summary |
| 12 | Collaboration Invite | User action | Invited to collaborate, join link |
| 13 | Challenge Graded | Inngest job | Score summary, improvement suggestions |

**Setup required:**
- Install `resend` and `@react-email/components`
- Create email template components in `/src/emails/`
- Configure Resend API key

---

## 7. Security Vulnerabilities (29 from Threat Model)

The MEGA_PROMPT identifies 29 security issues from 7 architect agents. The 5 critical ones and their implementation status:

### Critical (Must Fix Before Launch)

| # | Vulnerability | Status | Action Required |
|---|--------------|--------|-----------------|
| 1 | Auth checks in every Route Handler/Server Action (CVE-2025-29927) | NOT DONE | Create `requireAuth()` utility, apply to all routes |
| 2 | PartyKit collab rooms need JWT auth on WebSocket connect | NOT DONE | Validate Clerk JWT on every WS connection |
| 3 | XSS: DOMPurify + Zod on all user content (diagram labels, comments) | NOT DONE | Install DOMPurify, create sanitization middleware |
| 4 | API keys (`ANTHROPIC_API_KEY`) must not be `NEXT_PUBLIC_` prefixed | NOT DONE | Audit all env vars |
| 5 | Sentry `beforeSend` must scrub env vars and auth headers | NOT DONE | Sentry not yet configured |

### High Priority (24 additional)
- Rate limiting on all API routes (Upstash Redis)
- CSRF protection on state-changing actions
- Input validation (Zod schemas) on all API inputs
- SQL injection prevention (Drizzle parameterizes, but verify JSONB queries)
- File upload validation (size limits, MIME type checks)
- Content Security Policy headers
- CORS configuration
- Secure cookie settings
- Session management (Clerk handles, but verify)
- Password policy (Clerk handles)
- Account lockout (Clerk handles)
- Audit logging for sensitive actions
- Data encryption at rest (Neon handles)
- Data encryption in transit (HTTPS, verify all)
- Secure headers (X-Frame-Options, X-Content-Type-Options, etc.)
- API key rotation strategy
- Dependency vulnerability scanning (npm audit)
- Error message sanitization (no stack traces in production)
- Rate limiting on AI routes (prevent credit abuse)
- Collaboration room access control
- Diagram sharing permission enforcement
- Comment/content moderation pipeline
- GDPR compliance (data export, deletion, consent)
- SOC 2 readiness (logging, access controls)

---

## 8. Auth Setup (Clerk Integration)

### Tasks Required

| # | Task | Priority |
|---|------|----------|
| 1 | Install `@clerk/nextjs` | P0 |
| 2 | Configure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` env vars | P0 |
| 3 | Add `ClerkProvider` to root layout | P0 |
| 4 | Configure Clerk middleware (`middleware.ts`) for protected routes | P0 |
| 5 | Create `requireAuth()` server utility (independent of middleware per CVE-2025-29927) | P0 |
| 6 | Configure Clerk webhook endpoint (`/api/webhooks/clerk`) | P0 |
| 7 | Create user sync Inngest function (Clerk -> users table) | P0 |
| 8 | Add sign-in/sign-up pages (or use Clerk's hosted UI) | P1 |
| 9 | Configure auth methods: Passkeys > Magic Links > Social (GitHub + Google) > Email/Password | P1 |
| 10 | Add `SignedIn` / `SignedOut` components to layout for conditional rendering | P1 |
| 11 | Create `getCurrentUser()` helper (Clerk userId -> DB user lookup with caching) | P0 |
| 12 | Add auth to all API routes (apply `requireAuth()` in every handler) | P0 |
| 13 | Configure Clerk Organizations (for Team tier) | P2 |

---

## 9. Infrastructure Setup Tasks

### 9.1 Database (Neon)
- [ ] Create Neon project
- [ ] Configure connection pooler URL and direct URL
- [ ] Create `src/db/index.ts` with HTTP/WebSocket/TCP client modes
- [ ] Run `drizzle-kit generate` to create initial migration
- [ ] Run `drizzle-kit migrate` against Neon
- [ ] Configure Neon-Vercel integration for preview deploy branching
- [ ] Set min compute size to 0.25 CU for production

### 9.2 Cache (Upstash Redis)
- [ ] Create Upstash Redis database
- [ ] Install `@upstash/redis` and `@upstash/ratelimit`
- [ ] Configure rate limiting middleware
- [ ] Implement template gallery caching (1h TTL)
- [ ] Implement leaderboard caching

### 9.3 Storage (Cloudflare R2)
- [ ] Create R2 bucket for exports and thumbnails
- [ ] Configure CORS for R2
- [ ] Create upload/download utilities

### 9.4 Email (Resend)
- [ ] Create Resend account
- [ ] Configure domain verification
- [ ] Install `resend` package
- [ ] Create react-email template components

### 9.5 Background Jobs (Inngest)
- [ ] Install `inngest` package
- [ ] Create Inngest client (`src/inngest/client.ts`)
- [ ] Create API route (`/api/inngest`)
- [ ] Implement 17 functions listed in Section 5

### 9.6 AI (Claude API)
- [ ] Configure `ANTHROPIC_API_KEY` (server-side only)
- [ ] Create AI service layer with prompt templates
- [ ] Implement grading prompt with rubric integration
- [ ] Implement design review prompt
- [ ] Implement chat assistant with context injection

### 9.7 Analytics (PostHog)
- [ ] Create PostHog project
- [ ] Install `posthog-js` and `posthog-node`
- [ ] Add PostHog provider to client layout
- [ ] Configure server-side event tracking

### 9.8 Error Monitoring (Sentry)
- [ ] Create Sentry project
- [ ] Install `@sentry/nextjs`
- [ ] Configure with `beforeSend` scrubbing (env vars, auth headers)
- [ ] Add error boundaries to layout

### 9.9 Deployment (Vercel)
- [ ] Configure Vercel project
- [ ] Set all environment variables
- [ ] Configure Neon-Vercel integration
- [ ] Set up preview deploy branching
- [ ] Configure custom domain
