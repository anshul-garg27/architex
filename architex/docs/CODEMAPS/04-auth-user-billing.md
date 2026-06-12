# 04 — Auth, User Identity, Dashboard, Billing, Settings, Team

Module owner of the user-side surface: sign-in/sign-up shell, dashboard landing,
public profile, account settings, team workspace, and the billing primitives
(plan tiers, feature gates, usage meters) that wrap the rest of the product.
Also includes the Postgres user-shape (`users`, `progress`, `activity_events`,
`achievements`, `user_achievements`, `user_preferences`, `ai_usage`) and the
Clerk → DB sync webhook.

---

## 1. Purpose

| Concern | Where it lives | Notes |
|---|---|---|
| Auth boundary | `src/middleware.ts:54` (Clerk middleware) | gates everything not in `isPublicRoute` |
| User identity | `src/db/schema/users.ts:16` + `src/lib/auth.ts:52` (`resolveUserId`) | Clerk ID → internal UUID |
| User lifecycle | `src/app/api/webhooks/clerk/route.ts:12` | `user.created`, `user.updated`, `user.deleted` |
| Dashboard surface | `src/app/dashboard/page.tsx:367` | landing for signed-in users |
| Settings surface | `src/app/settings/page.tsx:758` | preference categories |
| Team / workspace | `src/app/team/page.tsx:622` | mock workspace, multi-member view |
| Billing primitives | `src/lib/billing/*`, `src/components/billing/*`, `src/stores/billing-store.ts` | plan tiers, feature gates, usage meters |
| Profile (public) | `src/app/profile/[username]/page.tsx:251` | mocked, by-username view |
| Activity / progress sync | `src/app/api/progress/**`, `src/app/api/activity/route.ts` | server-side counterparts to localStorage |
| Preferences sync | `src/app/api/user-preferences/**` | JSONB blob with per-feature subtrees |
| AI usage tracking | `src/db/schema/ai-usage.ts:20` | per-call cost / token log |
| Achievements | `src/db/schema/achievements.ts:23`, `:59`; `src/db/seeds/achievements.ts:12` | 30 definitions seeded; awarding logic still client-side |

The boundary between *server-of-record* (Postgres via Drizzle) and
*client-of-record* (Zustand stores + `localStorage`) is the central wrinkle in
this module. Many user-state surfaces are persisted *both* places, with
`use-progress-sync.ts` and `local-to-db-migration.ts` as the bridge.

---

## 2. Auth provider

Clerk is the chosen identity provider, but the integration is **conditional and
opt-in via env vars**, so the app must run end-to-end without it.

### 2.1 Conditional Clerk wiring

| File | Line | What it does |
|---|---|---|
| `src/app/layout.tsx` | 17–24 | Lazy-loads `ClerkProvider` only when `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set — avoids Clerk's intrusive "Configure your application" popup in keyless mode |
| `src/app/layout.tsx` | 69 | If Clerk is not configured, swaps in a passthrough fragment wrapper |
| `src/middleware.ts` | 4 | Imports `clerkMiddleware`, `createRouteMatcher` from `@clerk/nextjs/server` (with `@ts-expect-error` for v7 conditional-exports quirk) |
| `src/middleware.ts` | 104–106 | Auth enforcement is gated on `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` being present — without it the middleware never calls `auth.protect()` |

### 2.2 Public vs protected routes

Defined via `createRouteMatcher` in `src/middleware.ts:10–35`.

| Route pattern | Public? |
|---|---|
| `/` | yes |
| `/landing(.*)`, `/blog(.*)`, `/pricing(.*)` | yes |
| Module catalogue routes: `/modules`, `/algorithms(.*)`, `/database(.*)`, `/ds(.*)`, `/os(.*)`, `/lld-problems(.*)`, `/patterns(.*)`, `/concepts(.*)`, `/interviews(.*)`, `/gallery(.*)` | yes |
| `/problems(.*)` | yes |
| `/offline` | yes |
| `/api/webhooks(.*)` | yes (so Clerk webhook can call in unauthenticated) |
| `/api/health`, `/api/templates`, `/api/challenges`, `/api/content(.*)`, `/api/csp-report`, `/api/oembed(.*)`, `/api/og(.*)` | yes |
| Everything else (incl. `/dashboard`, `/settings`, `/team`, `/profile/*`, all other `/api/*`) | protected — `auth.protect()` called when Clerk is configured |

### 2.3 Middleware extras

Beyond auth, the same Clerk-wrapped middleware does CORS preflight, rate
limiting, and security-header injection:

| Concern | Lines | Notes |
|---|---|---|
| CORS preflight (OPTIONS) | `src/middleware.ts:59–67` | Reflects allowed origins from `applyCorsHeaders` |
| Rate limit (per-IP) | `src/middleware.ts:76–100` | `getApiRateLimiter().checkLimit(ip)` — 100 req/window, returns `429` with `Retry-After` |
| CSP (with per-request nonce) | `src/middleware.ts:111–114` | `buildCSP({ nonce })` |
| Security headers | `src/middleware.ts:116–128` | `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy: camera=() microphone=() geolocation=()`, HSTS, XSS |
| Rate-limit headers on responses | `src/middleware.ts:131–141` | `X-RateLimit-Limit/Remaining/Reset` |
| Cache headers for static APIs | `src/middleware.ts:144–161` | `/api/templates`, `/api/challenges`, `/api/health`, `/api/content` — public, max-age 1h, stale-while-revalidate 12h |
| CSP report-only in prod | `src/middleware.ts:163–169` | reports to `/api/csp-report` |

The matcher (`src/middleware.ts:179–181`) excludes `_next` and any path with a
`.` (static files), so this runs on every page and API request.

### 2.4 Server-side auth helpers (`src/lib/auth.ts`)

| Function | Line | Behavior |
|---|---|---|
| `requireAuth()` | 29 | Returns Clerk `userId` from `auth()`. If missing and `NODE_ENV === "development"`, returns the synthetic `DEV_CLERK_ID = "dev-user-local"`. Otherwise throws `"Unauthorized"`. |
| `getAuthUser()` | 39 | Wraps `currentUser()`. |
| `resolveUserId(clerkId)` | 52 | Looks up the internal UUID. If absent: in dev seeds a `dev@localhost` row with tier `free`; in prod, fetches Clerk's `currentUser()` and inserts a minimal record (this is the **race-tolerant** path used by API routes that fire before the webhook). |
| `getUserTier(clerkId)` | 118 | `users.tier` lookup, defaults to `"free"`. |

The dev-mode fallback at `src/lib/auth.ts:71–82` is the reason API routes work
locally without ever signing in to Clerk.

### 2.5 Sign-in / sign-up pages

Clerk catch-all routes are scaffolded but not wired to Clerk components yet:

| File | Lines | Body |
|---|---|---|
| `src/app/(auth)/sign-in/[[...sign-in]]/page.tsx` | 1–20 | Static "Authentication will be available once Clerk is configured" placeholder with a `Continue to App` link to `/` |
| `src/app/(auth)/sign-up/[[...sign-up]]/page.tsx` | 1–20 | Identical placeholder for sign-up |

The `[[...sign-in]]` / `[[...sign-up]]` slug shape is the canonical Clerk
catch-all path; only the rendered content is a stub. There's no `<SignIn />` or
`<SignUp />` component imported.

---

## 3. User sync — Clerk webhook → Postgres

### 3.1 Endpoint

`POST /api/webhooks/clerk` — declared at `src/app/api/webhooks/clerk/route.ts:12`.

The route is in the public-route matcher (`src/middleware.ts:27`) so Clerk can
deliver without an active Clerk session.

### 3.2 Verification (svix)

| Step | Lines |
|---|---|
| Read `CLERK_WEBHOOK_SECRET` from env; if absent return `503` | 13–19 |
| Pull `svix-id`, `svix-timestamp`, `svix-signature` headers; if missing → `400` | 22–31 |
| `new Webhook(secret).verify(body, headers)` to validate HMAC; on failure → `401` `"Invalid webhook signature"` | 36–49 |

### 3.3 Event handling

`switch` on `payload.type` at `src/app/api/webhooks/clerk/route.ts:58`.

| Event | Lines | Action |
|---|---|---|
| `user.created` / `user.updated` | 60–77 | Extracts `clerkId`, `email_addresses[0].email_address` (falls back to `${clerkId}@unknown`), and concatenates `first_name`/`last_name` for `name`. `INSERT … ON CONFLICT (clerk_id) DO UPDATE` sets `email`, `name`, `updatedAt`. New rows default to tier `free`. |
| `user.deleted` | 80–86 | `DELETE FROM users WHERE clerk_id = ?` — cascades to all user-owned rows (every related table has `onDelete: "cascade"`). |
| any other type | 88–89 | `console.log` only ("Unhandled event type") |

Returns `{ received: true, type }` on success and `500` on processing errors.

### 3.4 The race window

Because the webhook is asynchronous, the very first authenticated API request
from a brand-new user can land before `user.created` does. `resolveUserId`
handles this at `src/lib/auth.ts:84–112` by calling `currentUser()` and
inserting a minimal record on demand. The webhook's later upsert is idempotent.

---

## 4. User profile

| File | Purpose |
|---|---|
| `src/app/profile/[username]/page.tsx` | Public profile page — mocked end to end |

### 4.1 What's rendered

Strictly client-side (`'use client'` at line 1) and **fully mocked** via
`getMockProfile(username)` at `src/app/profile/[username]/page.tsx:64`. There is
no DB read for profile data on this page.

| Section | Lines | Backed by |
|---|---|---|
| Header (back-to-gallery link) | 271–283 | Static |
| Avatar + display name + bio + joined-at | 287–315 | mock |
| Stat cards (designs, upvotes, challenges, streak) | 319–344 | mock |
| 365-day activity heatmap | 178–245, 348–358 | `Math.random()` weighted by recency, generated on every render |
| Achievement badge grid (6 mock badges) | 361–391 | mock |
| Published designs grid (6 mock designs) | 394–448 | mock |

### 4.2 Username validation

`USERNAME_RE = /^[a-zA-Z0-9_-]{1,39}$/` at line 249. If the param fails the
regex, the page calls `notFound()` (line 257). There's **no DB lookup** to
confirm a user with that username actually exists.

### 4.3 What's editable

Nothing on this page. There is no `/profile` (own) edit page in the codebase —
profile fields like `bio`, `avatarColor`, and `username` are not in the
`users` schema (`src/db/schema/users.ts:16–36`). The `users` row holds only
`{id, clerkId, email, name, tier, createdAt, updatedAt}`.

---

## 5. Dashboard

| File | Purpose |
|---|---|
| `src/app/dashboard/layout.tsx` | metadata only (`title: "Dashboard - Architex"`) |
| `src/app/dashboard/loading.tsx` | suspense skeleton |
| `src/app/dashboard/page.tsx` | the dashboard surface (657 lines) |

### 5.1 Data sources

The page is `'use client'` (line 1) and reads exclusively from `localStorage`
helpers in `src/lib/progress/module-progress.ts`:

| Selector | Source | Lines (in `dashboard/page.tsx`) |
|---|---|---|
| `getOverallProgress()` | aggregates `architex-module-progress` + `architex-progress` + `architex-activity-log` | 374 |
| `getRecentActivity(5)` | `architex-activity-log` (most recent 5) | 375 |
| `getUnvisitedModules()` | modules with no `lastVisited` | 376 |
| `getLastActiveModule()` | module with newest `lastVisited` | 377 |
| `getMasteryForRadar()` | `useCrossModuleStore` Zustand store | 340 |
| `getModuleProgress(id)` | per-module exploration count from `architex-module-progress` | 247 |

There is **no `/api/progress` fetch** on this page; the dashboard is a
localStorage view.

### 5.2 Sections rendered

| Section | Lines | Empty-state behavior |
|---|---|---|
| Onboarding card (first-time users, `modulesExplored === 0`) | 408–444 | Shown instead of stats |
| Welcome header + stats grid (Modules Explored / Challenges Done / Day Streak / Features Explored) | 448–493 | Returning users only |
| `<SkillRadarSection />` | 339–363 (defn), 497 (use) | Always rendered |
| `<ModuleCompletionGrid />` (PLT-006) | 240–335 (defn), 500 (use) | One row per module with progress bar |
| Quick Actions trio (Continue / Practice Interview / Daily Challenge) | 503–528 | Static |
| Recent Activity column | 532–561 | "No activity yet" empty state if `activities.length === 0` |
| Daily Challenge card | 566–605 | rotates by day-of-year, see `getDailyChallenge()` at 75–81 |
| Recommended Next | 608–651 | renders up to 3 unvisited modules; "explored all" copy when none |

### 5.3 Module metadata

The dashboard hardcodes a `MODULE_META` map at `src/app/dashboard/page.tsx:47–61`
mapping each `ModuleType` to `{label, icon, color}`. Adding a new module
requires editing this map plus `MODULE_FEATURES` in
`src/lib/progress/module-progress.ts:39`.

---

## 6. Settings

| File | Purpose |
|---|---|
| `src/app/settings/page.tsx` | 7-section settings surface (882 lines) |
| `src/components/settings/AISettingsSection.tsx` | AI-key + per-feature + budget panel |

### 6.1 Sections (`src/app/settings/page.tsx:63–71`)

| Section ID | Component | Persistence |
|---|---|---|
| `appearance` | `AppearanceSection` (160) | Theme via `useUIStore.setTheme` (Zustand, persisted); font size via `localStorage["architex-font-size"]` |
| `animation` | `AnimationSpeedSection` (248) | `useUIStore.setAnimationSpeed` |
| `sound` | `SoundSection` (293) | `localStorage["architex-sound-enabled"]`, `["architex-sound-volume"]` |
| `accessibility` | `AccessibilitySection` (376) | Reduced-motion via `useReducedMotionContext` (toolbar override + OS pref); high-contrast and font-size override via `localStorage` |
| `ai` | `AISettingsSection` (wrapped at 728) | Zustand `ai-store` (api key, per-feature toggles, cost, budget) |
| `keyboard-shortcuts` | `KeyboardShortcutsSection` (516) | Static reference table — read-only |
| `data-management` | `DataManagementSection` (559) | Export/import/clear of *all* `localStorage` keys |

### 6.2 Persistence pattern

Two patterns coexist:

1. **Zustand (with `persist` middleware)** for theme, animation speed, AI store
   — written automatically to `localStorage` keys like `architex:billing-store`.
2. **Direct `localStorage` reads/writes** via `readLocalStorage` / `writeLocalStorage`
   helpers at `src/app/settings/page.tsx:140–156`, used for one-off scalars like
   font size and sound volume.

There is **no DB persistence** for any setting on this page. The `users`
schema has no settings JSON; only `user_preferences` exists, and currently it
only holds the LLD module's mode/banner state, not these UI toggles.

### 6.3 Data Management

`DataManagementSection` at `src/app/settings/page.tsx:559–724`:

| Action | Lines | Behavior |
|---|---|---|
| Export | 578–605 | Iterates `localStorage`, builds a JSON blob, triggers a download named `architex-data-YYYY-MM-DD.json` |
| Import | 607–637 | `<input type="file">` reads JSON, calls `localStorage.setItem` for each key, then `window.location.reload()` |
| Clear (two-step confirm) | 564–576 | First click sets `clearConfirm`; second click runs `localStorage.clear()` and reloads |

Notably, this export/import touches **all** `architex-*` keys — including
the persisted Zustand stores — so it's effectively a full local-state snapshot.

### 6.4 AI settings panel

`src/components/settings/AISettingsSection.tsx`:

| Field | Lines | Storage |
|---|---|---|
| API key (Anthropic, `sk-ant-…`) input + show/hide toggle + Save | 78–112 | `useAIStore.setApiKey` — kept *client-side only* in Zustand `ai-store` |
| Test connection button | 114–135 | `testConnection()` action |
| Per-feature toggles (`hints`, `review`, `generation`, `scoring`, `topology`) | 138–164 | `useAIStore.toggleFeature` |
| Cost / budget meter + slider (1–100 USD) | 167–205 | `useAIStore.setBudgetLimit`; bar turns yellow at 75 %, red at 90 % |
| Clear AI cache + Reset cost tracking | 207–215 | `clearCache()`, `resetCosts()` |

This is **separate from** the server-side `ai_usage` table — the in-memory cost
shown here is a Zustand counter, not a query against the DB.

---

## 7. Team plan

| File | Purpose |
|---|---|
| `src/app/team/layout.tsx` | metadata only |
| `src/app/team/page.tsx` | Team dashboard (869 lines) |
| `src/lib/enterprise/types.ts` | `Workspace`, `WorkspaceMember`, `WorkspaceRole`, `LearningPath`, `SkillAssessment` types |
| `src/lib/enterprise/learning-paths.ts` | path catalogue + `getPathProgress`, `getPathTotalMinutes` |
| `src/lib/enterprise/skill-assessment.ts` | skill labels, strongest/weakest selectors |

### 7.1 State

Entirely **mocked at module-load**. There is no DB schema for workspaces, no
API for them, and no Clerk Organizations integration.

| Mock | Lines (in `team/page.tsx`) | Shape |
|---|---|---|
| `MOCK_WORKSPACE` | 58–71 | 5-member, plan: `"team"`, owner = `user-1` |
| `MEMBER_NAMES` | 73–79 | hard-coded display names |
| `MEMBER_PROGRESS` | 81–87 | per-member `completedModules[]` + `lastActive` ISO |
| `MEMBER_ASSESSMENTS` | 89–165 | 8-skill `SkillAssessment` per member |
| `ASSIGNED_PATHS` | 167–172 | `userId → pathId` |
| `MEMBER_WEEKLY_ACTIVITY` | 175–181 | last-4-weeks counts |
| `MEMBER_TIME_SPENT` | 184–190 | minutes in last 30 days |

### 7.2 Roles

`WorkspaceRole = 'owner' | 'admin' | 'editor' | 'viewer'`
(`src/lib/enterprise/types.ts:6`). `ROLE_CONFIG` at
`src/app/team/page.tsx:194–199` maps each role to icon + label + color, but
there's no permission-check hook that gates UI on role.

### 7.3 Sections rendered

| Section | Lines | Notes |
|---|---|---|
| 8-stat header (Members / Interview Ready / Avg Score / Modules Done / Hours Studied / This Week / Almost Ready / Active Members) | 685–728 | computed from mocks via `useMemo` at 625–664 |
| Team Skill Assessment SVG bar chart | 731–762 | `<SkillChart />` defn at 226–314 — averages skills across all members, color-coded green/amber/red at 75/50 thresholds |
| Path assignment form | 540–618 | 2 selects + button — **no submit handler** (button is presentational) |
| Member list (collapsible rows) | 770–811 | each `<MemberRow />` toggles a 3-column expanded panel: strengths/weaknesses, skill bars, weekly activity |
| Available learning paths list | 814–864 | iterates `LEARNING_PATHS` |

### 7.4 Plan tier vs. workspace plan

`Workspace.plan` (`'free' | 'team' | 'enterprise'`,
`src/lib/enterprise/types.ts:9`) is **not the same** as the user-tier
`PlanId` (`'free' | 'student' | 'pro' | 'team'`,
`src/lib/billing/types.ts:11`). The team page does not consult
`useBillingStore` and the billing store has no concept of workspace
membership. The `team` user-tier is what unlocks the team-only feature
gates (see §8.3) but enrollment in an actual workspace is mock-only.

---

## 8. Billing

The billing layer is a **fully built abstraction with no payments wired**. No
Stripe SDK is installed; `src/lib/billing/types.ts:6` calls this out
explicitly: *"Stripe SDK is NOT installed. These types form an abstraction
layer that can later be wired to a Stripe integration without changing
consuming code."*

### 8.1 Plan definitions

`src/lib/billing/plans.ts:10–92` defines four plans:

| Plan | id | $/mo | $/yr | Sims | Templates | AI hints | Exports | Collab | Notes |
|---|---|---:|---:|:---:|:---:|:---:|:---:|:---:|---|
| Free | `free` | 0 | 0 | 5 | 10 | 0 | 3 | 0 | community support |
| Student | `student` | 0 | 0 | ∞ | ∞ | 50 | ∞ | 0 | requires `.edu` email verification |
| Pro | `pro` | 19 | 190 | ∞ | ∞ | 50 | ∞ | 0 | priority support |
| Team | `team` | 49 | 490 | ∞ | ∞ | ∞ | ∞ | 10 | team dashboards, admin controls |

`PLANS` indexed map at `src/lib/billing/plans.ts:95–100`; ordered list
`PLAN_LIST` at `:103`.

### 8.2 Tier rank for comparisons

`src/lib/billing/feature-gates.ts:43–48`:
`free=0`, `student=1`, `pro=1`, `team=2`. Note that `student` and `pro` are
treated as equivalent rank.

### 8.3 Feature gates

22 gates defined as `FeatureGate` union at
`src/lib/billing/feature-gates.ts:17–39`. Mapped to the tiers that can access
them in `FEATURE_MATRIX` at `:52–78`:

| Group | Gates | Allowed tiers |
|---|---|---|
| Pro/Student tier | `unlimited-designs`, `ai-hints`, `ai-review`, `ai-generation`, `ai-scoring`, `simulation-advanced`, `chaos-engineering`, `export-terraform`, `export-kubernetes`, `export-c4`, `import-terraform`, `gallery-publish`, `custom-templates`, `simulation-recording`, `priority-support` | `student`, `pro`, `team` |
| Team-only | `collaboration-realtime`, `team-dashboard`, `sso`, `api-access`, `advanced-analytics`, `white-label`, `enterprise-sla` | `team` |

API:

| Function | Line | Purpose |
|---|---|---|
| `hasAccess(tier, gate)` | 114 | boolean check |
| `getAvailableFeatures(tier)` | 119 | all gates a tier can use |
| `getRequiredTier(gate)` | 127 | minimum tier (lowest-ranked allowed) |
| `getFeatureLabel(gate)` | 144 | human label from `FEATURE_LABELS` map (82–105) |

### 8.4 Usage tracker (client-side only)

`src/lib/billing/usage-tracker.ts` persists counters in `localStorage` under
`architex:billing:usage` (line 13). API:

| Function | Line | Behavior |
|---|---|---|
| `trackUsage(feature, amount=1)` | 58 | increments and writes |
| `getUsage(feature)` | 66 | one feature's count |
| `getAllUsage()` | 71 | full `UsageMap` |
| `checkLimit(feature, planId)` | 79 | `{ allowed, used, limit }` against `PLANS[planId].limits[feature]` |
| `resetUsage()` | 93 | clears + stamps `architex:billing:period-start` |
| `getPeriodStart()` | 101 | last reset ISO |

There is no server-side counterpart — billing usage **does not survive a
browser-storage clear**. The `ai_usage` DB table is a separate, append-only
log used for analytics rather than gating.

### 8.5 Billing store

`src/stores/billing-store.ts:66–121` — Zustand `persist` store. Persisted
fields: `currentPlan`, `subscription` (line 115). `usage` is rehydrated from
the localStorage tracker via `snapshotUsage()` (line 60).

`Subscription` shape (`src/lib/billing/types.ts:53–57`):
`{ planId, status: 'active'|'cancelled'|'past_due'|'trialing', currentPeriodEnd, cancelAtPeriodEnd }`.

`setPlan()` mutates **immediately and unconditionally** (line 79), no payment
flow gates it — it's a free toggle in the demo state. Upgrade CTAs in
`UpgradePrompt` and `GatedUpgradePrompt` link to `/pricing` (the actual
pricing page) but offer no Stripe checkout.

### 8.6 Components

| Component | File | Purpose |
|---|---|---|
| `UsageMeter` | `src/components/billing/UsageMeter.tsx:57` | Progress bar with green/yellow/red thresholds at 75 %/90 % |
| `UpgradePrompt` | `src/components/billing/UpgradePrompt.tsx:56` | Shown when a *quantitative* limit is reached — side-by-side comparison of current plan vs. target |
| `GatedFeature` | `src/components/billing/GatedFeature.tsx:35` | HOC: renders children if `hasAccess(tier, gate)`, else `GatedUpgradePrompt` |
| `GatedUpgradePrompt` | `src/components/billing/GatedUpgradePrompt.tsx:65` | Shown when a *qualitative* gate (feature unavailable to tier) blocks access — links to `/pricing` |

### 8.7 Student verification (stub)

`src/lib/billing/student-verification.ts` provides a `StudentVerification`
class (line 120) that:

1. Validates the email against `EDU_TLDS` (line 11) and `EDU_PATTERNS` (line 45)
   via `isEduEmail()` (line 64).
2. Generates a 32-char client-side token (`generateToken` at line 263 —
   "would use crypto.randomUUID() in production").
3. Records `pending` → `verified` after token confirmation, with a 1-year
   `expiresAt` (`VERIFICATION_DURATION_MS` at line 108).
4. Auto-expires verified state via `getStatus()` (line 139) when past expiry.

There is **no email-sending integration**, **no DB persistence** of
verification state, and no Clerk metadata writeback. The class is purely
in-memory and any consumer would need to wire `restore()` (line 239) to a
storage layer.

---

## 9. Achievements

### 9.1 Schema

| Table | File | Key columns |
|---|---|---|
| `achievements` | `src/db/schema/achievements.ts:23` | `id`, `slug` (unique), `name`, `description`, `category`, `icon`, `color`, `xpReward`, `sortOrder`, `isActive` |
| `user_achievements` | `src/db/schema/achievements.ts:59` | `id`, `userId`, `achievementId`, `unlockedAt` — unique on `(userId, achievementId)` |

`category` is a free-form string but the seed file uses 5 categories:
`learning`, `streak`, `challenge`, `mastery`, `social`.

### 9.2 Seeded definitions

`src/db/seeds/achievements.ts:12–52` defines **30 achievements** by category:

| Category | Count | Examples (slug → name) |
|---|---|---|
| learning | 7 | `first-visualization`→First Steps, `all-modules`→Renaissance Engineer |
| streak | 5 | `streak-3`→Hat Trick, `streak-100`→Century Club |
| challenge | 6 | `first-challenge`→Challenge Accepted, `speed-demon`→Speed Demon |
| mastery | 5 | `mastery-beginner`→Apprentice, `mastery-all-50`→Well-Rounded |
| social | 7 | `first-design`→Architect, `xp-10000`→XP Legend |

Seed performs `INSERT … ON CONFLICT (slug) DO UPDATE` (line 60) so re-running
upserts the latest text.

> NB: This seed is **not** registered in `src/db/seeds/index.ts:11–34`
> (the master `SEED_MODULES` map). It exists but is not run by the default
> `pnpm db:seed`. To seed achievements, the file would need to be added to
> that map or invoked directly.

### 9.3 Awarding logic

There is **no server-side awarding**. The DB tables exist but no API route
inserts into `user_achievements`. The active gamification logic lives in
client code:

| File | Line | Role |
|---|---|---|
| `src/lib/interview/achievements.ts` | 43 | `ACHIEVEMENTS` array of typed `Achievement` definitions (independent of the DB table — different IDs, e.g. `first-design`, `speed-demon`) |
| `src/lib/interview/achievements.ts` | 511 | `checkAchievements(stats: UserStats)` evaluates conditions and returns newly-earned achievements |
| `src/lib/interview/achievements.ts` | 525 | `isAchievementMet(achievement, stats)` — large `switch` over slug |
| `src/lib/interview/achievements.ts` | 717 | `calculateLevel(totalXp)` |

So the schema and seed are positioned for a future server-authoritative
awarding flow, but currently the interview module stores earned IDs in
`UserStats.earnedAchievementIds` (line 36) — a client-side store (Zustand
progress store, persisted to `localStorage["architex-progress"]`).

### 9.4 UI surfacing

| Component | File | Renders from |
|---|---|---|
| `AchievementGrid` | `src/components/interview/AchievementGrid.tsx` | client `ACHIEVEMENTS` array |
| `AchievementGallery` | `src/components/interview/AchievementGallery.tsx` | same |
| `AchievementToast` | `src/components/interview/AchievementToast.tsx` | newly-earned popup |
| `XPDisplay` | `src/components/interview/XPDisplay.tsx` | `calculateLevel` |
| `StreakBadge` | `src/components/interview/StreakBadge.tsx` | streakDays counter |
| Profile badges | `src/app/profile/[username]/page.tsx:148–155` | mocked emoji + name list — independent of both `achievements` table and `lib/interview/achievements.ts` |

---

## 10. Progress & activity tracking

### 10.1 What gets recorded

| Event source | Storage | API |
|---|---|---|
| Module visits, feature exploration | `localStorage["architex-module-progress"]` | none |
| Activity log (last 200 entries) | `localStorage["architex-activity-log"]` | mirrored to `/api/activity` for LLD-events only |
| Per-concept progress + score | `architex-progress` (client) + `progress` table (server) | `/api/progress` |
| LLD-specific events (`lld_mode_switched`, `lld_drill_started`, etc.) | `activity_events` row + (planned) PostHog | `/api/activity` POST |

### 10.2 Progress API

`src/app/api/progress/route.ts`:

| Method | Behavior | Line |
|---|---|---|
| `GET ?moduleId=X[&conceptId=Y]` | Returns `progress` rows for `(userId, moduleId[, conceptId])`. `moduleId` is required (returns `400` if missing). | 18–62 |
| `POST` | Upserts `(userId, moduleId, conceptId)`. Body: `{moduleId, conceptId?, score?, completedAt?}`. Score must be in `[0,1]` else `400`. Conflict target is the unique index `progress_user_module_concept_idx`. | 65–135 |

Both call `requireAuth()` then `resolveUserId(clerkId)` (lines 21–23, 67–69)
and return `404 "User not found"` if resolution fails.

### 10.3 Bulk migration: `/api/progress/sync`

`src/app/api/progress/sync/route.ts:25` — one-time bulk upsert for migrating
localStorage to the DB on first authenticated session.

| Behavior | Line |
|---|---|
| Caps the request at 500 records | 53–58 |
| Batches in groups of 50 | 63–91 |
| Score clamped to `[0,1]` per record (line 73) | 73 |
| `onConflictDoUpdate` keeps the existing higher score (`set: { score: progress.score }`) | 84–87 |

> Note: line 84 is a self-reference (`progress.score` is the column itself,
> not the new value), so the upsert effectively only touches `updatedAt` on
> conflict. Incoming records that beat existing scores aren't actually
> propagated through this path.

### 10.4 Activity API

`src/app/api/activity/route.ts`:

| Method | Behavior | Line |
|---|---|---|
| `POST` | Insert one `activity_events` row. Body must include `event`. `moduleId`, `conceptId`, `metadata`, `occurredAt` are optional (occurredAt defaults to `now`). | 15–70 |
| `GET ?moduleId=X&limit=N` | Recent events for the user, optionally filtered by module, ordered by `occurredAt DESC`, limit capped at 200 (default 50). | 73–109 |

### 10.5 Sync hook

`src/hooks/use-progress-sync.ts:80` — TanStack Query wrapper that:
1. Reads localStorage immediately for instant UI.
2. Background-fetches `/api/progress?moduleId=…` (line 50).
3. Mutates via debounced `POST /api/progress` (2-second coalesce, line 116).
4. Gated entirely on `process.env.NEXT_PUBLIC_PROGRESS_USE_API === "true"`
   (line 18) — so the API path is **off by default** even with Clerk
   configured.

### 10.6 LocalStorage → DB migration

`src/lib/sync/local-to-db-migration.ts`:

| Step | Lines |
|---|---|
| Skip if `architex:migrated-to-db` is already `"true"` | 13, 44 |
| Pull XP + streak + per-challenge scores from `architex-progress` | 53–94 |
| Pull `moduleMastery` and `conceptProgress` from `architex-cross-module` | 97–138 |
| `POST /api/progress/sync` with the assembled records | 151 |
| On 200, set `architex:migrated-to-db = "true"` | not yet returned to caller; uses `.then()` chain |

### 10.7 Offline queue

There is **no offline queue** for activity / progress writes today. The
header in `src/lib/analytics/lld-events.ts:69` notes
*"Phase 1 just POSTs to /api/activity. Later phases add PostHog mirroring
and offline queueing."* The `track()` helper (line 71) is fire-and-forget
with a `.catch` warn — failed sends are silently dropped.

---

## 11. AI usage tracking

### 11.1 Schema (`src/db/schema/ai-usage.ts:20–46`)

| Column | Type | Purpose |
|---|---|---|
| `id` | uuid PK | |
| `userId` | uuid FK→`users.id` cascade | |
| `model` | varchar(100) | e.g. `claude-sonnet-4-20250514` |
| `tokens` | int | total prompt+completion |
| `cost` | real | USD cents (line 32 says "estimated cost in USD cents") |
| `purpose` | varchar(100) | `topology-rules`, `hint`, `evaluate`, etc. |
| `metadata` | text | optional debug payload |
| `createdAt` | timestamp tz | default `now()` |

Indexes (line 41–45): `(userId)`, `(createdAt)`, `(userId, purpose)`.

### 11.2 What writes here

There is **no `INSERT` against `ai_usage`** in the codebase under
`src/app/api/`. Verified by absence of `aiUsage` in the API route files.
The schema is in place but the AI route handlers (e.g. `/api/ai/explain`,
`/api/lld/explain-inline`) do not log to it.

The client-side AI cost tracking lives in `useAIStore`
(`src/stores/ai-store.ts:43` `recordUsage`) and is **not** persisted to
the DB.

### 11.3 Quota enforcement

The schema enables future quota work but **no quota is enforced via this
table** today. Instead:

- Plan limits (`aiHints` per month) live in `src/lib/billing/plans.ts:38–48`.
- The check happens client-side via `checkLimit('aiHints', planId)` against
  the localStorage tracker (`src/lib/billing/usage-tracker.ts:79`).

So the pieces are: definition (DB), display (Zustand), enforcement
(localStorage). They are not connected yet.

---

## 12. API surface

| Method | Route | File:line | Auth | Purpose |
|---|---|---|---|---|
| POST | `/api/webhooks/clerk` | `src/app/api/webhooks/clerk/route.ts:12` | Public (svix-verified) | User lifecycle sync |
| GET | `/api/progress` | `src/app/api/progress/route.ts:18` | Required | Progress records by module |
| POST | `/api/progress` | `src/app/api/progress/route.ts:65` | Required | Upsert one progress record |
| POST | `/api/progress/sync` | `src/app/api/progress/sync/route.ts:25` | Required | Bulk upsert (≤500, batched ×50) |
| POST | `/api/activity` | `src/app/api/activity/route.ts:15` | Required | Log an activity event |
| GET | `/api/activity` | `src/app/api/activity/route.ts:73` | Required | Recent events (limit ≤200) |
| GET | `/api/user-preferences` | `src/app/api/user-preferences/route.ts:10` | Required | Full preferences blob (`{}` if no row) |
| PATCH | `/api/user-preferences/lld` | `src/app/api/user-preferences/lld/route.ts:34` | Required | Partial update of `preferences.lld` subtree via JSONB `||` merge |

All routes return `401` on `requireAuth()` failure and `404 "User not found"`
on `resolveUserId()` returning `null` (which only happens in production when
Clerk's `currentUser()` is also missing).

---

## 13. Database schema (user-related tables)

### 13.1 `users` (`src/db/schema/users.ts:16`)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK default random | internal handle |
| `clerkId` | varchar(255) unique not null | Clerk's user ID |
| `email` | varchar(320) not null | from Clerk's `email_addresses[0]` |
| `name` | varchar(255) nullable | concatenated `first_name` + `last_name` |
| `tier` | varchar(20) not null default `'free'` | mirrors `PlanId` (`free|student|pro|team`) but **not validated** at DB level |
| `createdAt` | timestamp tz default now | |
| `updatedAt` | timestamp tz default now, `$onUpdate(() => new Date())` | |

Indexes: `users_clerk_id_idx`, `users_email_idx`. Migration:
`drizzle/migrations/0000_skinny_callisto.sql` (table created).

### 13.2 `progress` (`src/db/schema/progress.ts:20`)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `userId` | uuid FK→`users.id` cascade | |
| `moduleId` | varchar(100) not null | e.g. `system-design`, `algorithms` |
| `conceptId` | varchar(100) nullable | sub-key within module |
| `score` | real default 0 | mastery 0.0–1.0 |
| `completedAt` | timestamp tz nullable | |
| `stability`, `difficulty`, `elapsedDays`, `scheduledDays`, `reps`, `lapses`, `fsrsState`, `nextReviewAt` | various | FSRS spaced-repetition fields (lines 36–50) |
| `createdAt`, `updatedAt` | timestamp tz | |

Indexes: `(userId, moduleId)` plus unique `(userId, moduleId, conceptId)` —
the latter is the conflict target for upserts.

### 13.3 `activity_events` (`src/db/schema/activity.ts:19`)

Append-only event log. Indexed on `(userId)`, `(event)`, `(userId, moduleId)`,
`(occurredAt)` for analytics queries.

### 13.4 `achievements` and `user_achievements` (`src/db/schema/achievements.ts`)

Defined in §9.1. Foreign keys:
`user_achievements.userId` → `users.id` cascade,
`user_achievements.achievementId` → `achievements.id` cascade.

### 13.5 `user_preferences` (`src/db/schema/user-preferences.ts:29`)

| Column | Type | Notes |
|---|---|---|
| `userId` | uuid PK → `users.id` cascade | one row per user |
| `preferences` | jsonb default `{}` | feature-keyed subtrees |
| `createdAt`, `updatedAt` | timestamp tz | |

JSONB shape (header doc, lines 7–17):
```jsonc
{
  "lld": {
    "mode": "learn" | "build" | "drill" | "review",
    "welcomeBannerDismissed": boolean,
    "scratchCanvas": { ... }   // Phase 3+
  }
}
```

The `PATCH /api/user-preferences/lld` route (§12) performs a JSONB
`jsonb_set` + `||` merge so partial patches don't overwrite sibling keys
(`src/app/api/user-preferences/lld/route.ts:66–74`). Mode is validated
against `VALID_MODES` (`["learn","build","drill","review"]`, line 11).

Migration: `drizzle/migrations/0001_nostalgic_rattler.sql`.

### 13.6 `ai_usage` (`src/db/schema/ai-usage.ts:20`)

Defined in §11.1.

### 13.7 Relations

`src/db/schema/relations.ts:28–44` declares `usersRelations` with `many` for
`diagrams`, `simulationRuns`, `progress`, `templates`, `gallerySubmissions`,
`aiUsage`, `lldBookmarks`, `lldConceptReads`, `lldDesigns`,
`lldDrillAttempts`, `lldLearnProgress`, and `one` for `preferences`. Every
user-owned table has `onDelete: "cascade"`, so deleting a user via the
Clerk webhook (§3.3) wipes the entire user-owned graph.

---

## 14. Quirks

| # | Quirk | Where | Impact |
|---|---|---|---|
| 1 | Clerk middleware swallows auth when `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is unset | `src/middleware.ts:104` | Without the key, every route is effectively public; CSP and rate limit still apply |
| 2 | Synthetic `dev-user-local` injected in dev | `src/lib/auth.ts:17, 30–33, 71–82` | API routes work locally without Clerk. Beware: this row gets created in your DB on first call. |
| 3 | Webhook race window | `src/lib/auth.ts:84–112` | First API call from a new user can fire before `user.created` webhook lands; `resolveUserId` falls back to `currentUser()` and inserts a minimal row. Email is set to `${clerkId}@unknown` if Clerk doesn't surface one (line 65 in webhook, line 93 in auth helper). |
| 4 | `currentUser()` field shape varies across Clerk versions | `src/lib/auth.ts:90–98` | Code does `as Record<string, unknown>` casts and a defensive optional-chain on `emailAddresses[0]?.emailAddress`. |
| 5 | Two parallel achievement systems | `src/db/schema/achievements.ts` (DB-backed, 30 seeded) vs. `src/lib/interview/achievements.ts:43` (client-only, different IDs) | The two never sync. Profile page uses a third hard-coded badge list. |
| 6 | Achievement seed not registered in master seed runner | `src/db/seeds/index.ts:11–34` excludes `achievements.ts` | `pnpm db:seed` will not populate the achievements table. |
| 7 | `progress/sync` self-reference in `set` clause | `src/app/api/progress/sync/route.ts:84` (`score: progress.score`) | Bulk-sync only updates `updatedAt`; incoming higher scores aren't promoted on conflict. Comment at line 84 says "Only update if incoming score is higher" but the implementation contradicts. |
| 8 | Activity-event sends are fire-and-forget | `src/lib/analytics/lld-events.ts:71–85` | A network failure or 500 silently drops the event with only a `console.warn`. |
| 9 | API tier value is unconstrained | `src/db/schema/users.ts:23` | `tier` is `varchar(20)` with no `CHECK` constraint or enum; an arbitrary string would persist. Application code expects `free|student|pro|team`. |
| 10 | Settings and AI-key persisted in `localStorage` only | `src/app/settings/page.tsx`, `src/stores/ai-store.ts` | A user signing in on a new device starts with empty settings. There is no DB-backed settings row. |
| 11 | Plan toggling has no payment flow | `src/stores/billing-store.ts:79` (`setPlan`) | `useBillingStore.setPlan('pro')` flips immediately; nothing checks Stripe state. |
| 12 | Workspace data is fully mocked | `src/app/team/page.tsx:58–190` | The `team` user-tier gates *features* but doesn't materialize a real workspace. There is no `workspaces` or `workspace_members` table. |
| 13 | Profile page mocks everything, including the username regex existence check | `src/app/profile/[username]/page.tsx:251–260` | `/profile/anything` returns mock content as long as the slug matches `^[a-zA-Z0-9_-]{1,39}$`. |
| 14 | AI usage table never written | `src/db/schema/ai-usage.ts` vs. AI routes | The schema is reserved but quota and cost queries cannot draw from it yet. |
| 15 | Static pages have *both* `next.config.ts` headers and `vercel.json` headers | `next.config.ts:6–29`, `vercel.json:13–44` | Both layers set `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`. Vercel adds `Cache-Control: public, max-age=31536000, immutable` for `/fonts/*`. The middleware (§2.3) re-asserts most of the same headers a third time. |
| 16 | `student` and `pro` tiers are equivalent in `TIER_RANK` | `src/lib/billing/feature-gates.ts:46–47` | `getRequiredTier` may return either depending on insertion order in `FEATURE_MATRIX[gate]`. |
| 17 | LLD preferences route has no GET; reads use `/api/user-preferences` (full blob) | `src/app/api/user-preferences/lld/route.ts` only exports PATCH | Clients must consume the whole preferences object and cherry-pick `lld`. |
| 18 | Cookie consent banner re-initializes analytics on every consent change | `src/components/analytics/ConsentBanner.tsx:52–58` | Calls `analytics.init(new PostHogProvider())` or `new NoOpProvider()` each time. |

---

## 15. Open questions

1. **Stripe / payments** — billing types and components imply Pro/Team
   subscriptions, but no Stripe SDK is installed. Is the intent to wire
   Stripe via the existing abstraction (`src/lib/billing/types.ts:6`) or
   ship a paywall via Clerk Billing, LemonSqueezy, etc.?
2. **Achievements server vs. client** — which of the two systems is
   canonical? Should `src/db/seeds/achievements.ts` get registered in
   `src/db/seeds/index.ts`, or should it be removed?
3. **`ai_usage` write path** — is there a planned middleware to log every
   AI call (in `/api/ai/*`, `/api/lld/explain-inline`, etc.)? Today the
   table is dead.
4. **Workspaces** — is the `team/` page a fixture for a future Clerk
   Organizations integration, or is workspace state planned to live in a
   bespoke schema (with `workspaces`, `workspace_members`, `learning_paths`,
   `path_assignments` tables)?
5. **User editable profile** — `users.name` is set from Clerk webhooks but
   never edited locally; is a self-edit page (`/profile/me/edit`) planned,
   and what columns would it need (bio, avatarColor, username slug)?
6. **Username uniqueness** — `users` has no `username` column, but
   `/profile/[username]` exists. Where will usernames be reserved?
7. **Preferences subtree expansion** — `userPreferences.preferences.lld` is
   the only documented subtree. Will theme/animation/sound move from
   `localStorage` to here? If so, settings page needs a sync hook.
8. **Progress sync feature flag** — `NEXT_PUBLIC_PROGRESS_USE_API` is off
   by default. What's the rollout plan, and does `local-to-db-migration.ts`
   need to be invoked from a top-level effect (it isn't currently called
   anywhere from my grep)?
9. **Tier value validation** — should `users.tier` get a `CHECK` constraint
   or a Drizzle enum to prevent the `varchar(20)` open-set?
10. **Webhook 4xx semantics** — current webhook returns `503` if secret
    missing, `400` for missing svix headers, `401` for bad signature, `500`
    for processing failure. Are these stable enough that Clerk's retry
    policy (which retries on 5xx) won't loop on misconfigurations?
11. **Header layering** — three layers set near-identical security headers
    (Vercel platform → Next.js config → Clerk middleware). Is there a
    canonical layer, and what's the policy when they disagree (e.g.
    `Permissions-Policy` is in Next.js config + middleware but not Vercel)?
12. **`getDailyChallenge`** uses `Math.floor((Date.now() - new Date(year,0,0)) / day)` — the client TZ determines which challenge appears. Is that intentional or do we want a server-stamped daily-challenge endpoint?
