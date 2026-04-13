# Authentication, User Management, Security & Compliance Research

Research conducted April 2026 for the Architex engineering learning platform.

---

## 1. AUTHENTICATION

### 1.1 Recommendation: Primary Auth Provider

**Top Pick for Architex: Clerk** (with Better Auth as strong self-hosted alternative)

| Provider | Free Tier | Cost at 100K MAU | Next.js Integration | Pre-built UI | Passkeys | Organizations |
|---|---|---|---|---|---|---|
| **Clerk** | 10K MAU | ~$1,800/mo | Native App Router + RSC | Yes (Core 3 `<Show>`) | Yes | Yes |
| **Better Auth** | Unlimited (self-hosted) | $0 (infra only) | First-class | No (build your own) | Yes (plugin) | Yes (plugin) |
| **Supabase Auth** | 50K MAU | ~$25/mo | Good (`@supabase/ssr`) | No | Limited | No |
| **Auth.js (NextAuth)** | Unlimited (self-hosted) | $0 (infra only) | Good | No | Via adapter | No |
| **Auth0** | 25K MAU | ~$500+/mo | Good | Yes (Lock widget) | Yes | Yes (enterprise) |

**Why Clerk for an MVP/early-stage product:**
- Production-ready auth in ~30 minutes
- Core 3 release (March 2026) introduced unified `<Show>` component replacing `<SignedIn>`, `<SignedOut>`, `<Protect>`
- Hybrid session approach: long-lived cookie on Clerk's Frontend API + short-lived JWTs (60-second lifetime) mitigating XSS risk
- Built-in Organizations feature for future team/multi-tenant support
- 10K MAU free tier is sufficient for launch phase

**Why Better Auth as a future migration path:**
- ~100K weekly npm downloads by March 2026, fastest-growing auth library
- Plugin architecture: passkeys, magic links, organizations, admin controls, rate limiting as first-party plugins
- End-to-end typed: adding a plugin changes inferred types throughout the app
- No vendor lock-in, no per-MAU costs
- More complete than NextAuth, with built-in passkeys/2FA/organizations

### 1.2 Critical Security Note: Middleware is NOT a Security Boundary

**CVE-2025-29927 (CVSS 9.1):** Attackers could bypass all middleware logic by sending an `x-middleware-subrequest` header. Affected Next.js 11.1.4 through 15.2.2.

**Architectural lesson:** Auth checks MUST live in:
- Route Handlers
- Server Actions
- Data Access Layer (DAL)

Never rely solely on middleware for authentication.

### 1.3 Authentication Methods for Architex

**Recommended primary flow:**

```
Passkeys (WebAuthn) -- primary for returning users on enrolled devices
         |
Magic Links -- primary for new users and unenrolled devices
         |
Social Login (GitHub, Google) -- optional accelerated path
         |
Email/Password -- fallback
```

**Social Login Providers (priority order for an engineering platform):**
1. GitHub (primary audience signal)
2. Google (universal)
3. Discord (community)
4. LinkedIn (professional)

**Magic Link Best Practices:**
- Token expiry: 15 minutes
- Token length: 32+ characters (cryptographically random)
- Max attempts: 3 per token
- Rate limit: 1 request per 5-minute interval per email
- Hash tokens in storage (never plaintext)
- Single-use enforcement
- Merge registration + email verification into one step

**Passkey (WebAuthn) Implementation:**
- Phishing-resistant: credential cryptographically bound to domain
- All major platforms support passkeys natively in 2026
- For new apps, passkeys should be the default sign-in method
- Libraries: `@simplewebauthn/server` + `@simplewebauthn/browser`, or use Clerk/Better Auth built-in support

### 1.4 Clerk Next.js Integration Pattern

```
# Install
npm install @clerk/nextjs

# Required env vars
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# File structure
app/
  layout.tsx          -- wrap with <ClerkProvider>
  (auth)/
    sign-in/
      [[...sign-in]]/page.tsx   -- <SignIn />
    sign-up/
      [[...sign-up]]/page.tsx   -- <SignUp />
  (dashboard)/
    layout.tsx          -- protected layout
middleware.ts           -- clerkMiddleware() for route matching only
```

Key patterns:
- `clerkMiddleware()` for route-level gating (NOT as sole auth check)
- `auth()` in Server Components for session data
- `currentUser()` in Server Components for full user object
- `<Show when="signed-in">` (Core 3) for conditional UI

### 1.5 Supabase Auth Pattern (if using Supabase as DB)

```
# Install
npm install @supabase/supabase-js @supabase/ssr

# Two client types required:
1. Browser client (Client Components)
2. Server client (Server Components, Server Actions, Route Handlers)

# Key: Uses cookie-based sessions (HTTP-only, server-side)
# Avoids localStorage (vulnerable to XSS)
```

---

## 2. USER MANAGEMENT

### 2.1 Roles & Permissions System Design

**Recommended model: RBAC with fine-grained permissions**

```
Phase 1 (MVP):
  - free_user: access free content, limited simulations
  - pro_user: all content, all simulations, export
  - admin: content management, user management, analytics

Phase 2 (Teams):
  - org_owner: billing, team management, all permissions
  - org_admin: team management, content management
  - org_member: access based on plan
  - org_viewer: read-only access

Phase 3 (Enterprise):
  - Fine-grained permissions per resource
  - Custom roles
  - SAML SSO integration
```

**Implementation approach:**
- Store roles in your database (not just in auth provider)
- Permission checks at the Data Access Layer, not just UI
- Use a permission evaluation library: `@casl/ability` or `cerbos` for complex rules
- Clerk Organizations handles basic RBAC out of the box

**Database schema pattern:**

```
users
  id, email, name, avatar_url, created_at

organizations
  id, name, slug, plan, created_at

memberships
  id, user_id, organization_id, role, invited_at, joined_at

roles
  id, name, description, organization_id (null = global)

permissions
  id, role_id, resource, action (create/read/update/delete)
```

### 2.2 Multi-Tenant Architecture

**Recommended approach for Architex: Shared database with Row-Level Security**

Strategies compared:
- **Shared DB, shared schema (recommended):** Simplest, use `organization_id` column + RLS. Best for early-stage.
- **Shared DB, separate schemas:** More isolation, more complexity. For regulated industries.
- **Separate databases:** Maximum isolation. Enterprise-only, high operational cost.

**Tenant identification:**
- Path-based: `/org/[slug]/dashboard` -- simplest, no DNS config needed
- Subdomain-based: `acme.architex.dev` -- cleaner URLs, requires wildcard DNS
- Vercel for Platforms (Dec 2025): automatic wildcard domain routing + SSL

**Clerk Organizations integration:**
- Built-in team management with roles
- Invitation flow with email
- Organization switching UI component
- Granular permissions per organization

### 2.3 User Onboarding Flow

**Research-backed best practices:**

| Metric | Target |
|---|---|
| Time to first value | Under 2 minutes |
| Onboarding steps | 3-7 core steps |
| 7-day retention lift from personalization | +35% |
| Completion rate lift from progress bars | +20-30% |

**Recommended Architex onboarding flow:**

```
Step 1: Welcome + Role Selection (2 choices)
  "I'm learning system design" / "I'm preparing for interviews"

Step 2: Experience Level
  "Beginner" / "Intermediate" / "Advanced"

Step 3: First Interactive Experience (immediate value)
  Auto-launch a guided simulation based on selections
  Example: "Design a URL Shortener" walkthrough

Step 4: Profile Completion (deferred, non-blocking)
  GitHub connect, display name, notification preferences
```

**Key principles:**
- Personalization via initial microsurvey lifts retention by 35%
- Contextual onboarding (tooltips, hotspots) outperforms linear tutorials
- Gamification elements (progress bars, achievement badges) shift mindset from obligation to engagement
- Without effective onboarding, 75% of new users churn within first week

### 2.4 Account Deletion & Data Erasure

**GDPR Article 17 - Right to Erasure requirements:**

- Must process within 1 month (extendable to 3 months for complex requests)
- Must delete from ALL systems including backups (per EDPB 2026 guidelines)
- Must notify all third-party processors

**Implementation checklist:**
1. Self-service account deletion in user settings
2. Grace period (7-14 days) with ability to cancel
3. Automated data mapping: know exactly where user data lives
4. Cascade deletion across all tables
5. Delete from auth provider (Clerk API: `DELETE /v1/users/{user_id}`)
6. Delete from third-party services (analytics, email, etc.)
7. Retain only legally required records (billing for tax compliance)
8. Generate deletion confirmation receipt
9. Handle backup data: extract + isolate + permanently delete after retention period

**Exemptions allowing data retention:**
- Legal obligation compliance
- Asserting/defending legal claims
- Public interest archiving
- Scientific/historical research

---

## 3. SECURITY

### 3.1 Security Architecture Overview

```
Layer 1: Edge/CDN
  Vercel Firewall (automatic L3/L4/L7 DDoS protection)
  Attack Challenge Mode
  WAF custom rules

Layer 2: Application Gateway
  Arcjet (bot protection, rate limiting, Shield WAF)
  CSP headers with nonce-based script allowlisting

Layer 3: Authentication
  Clerk/Better Auth (session management, MFA)
  Auth checks in Route Handlers + Server Actions + DAL
  NOT in middleware alone

Layer 4: Authorization
  RBAC permission checks at Data Access Layer
  Row-Level Security in database

Layer 5: Data Protection
  Input validation + sanitization
  Parameterized queries (Prisma/Drizzle handle this)
  Encryption at rest + in transit
```

### 3.2 Content Security Policy (CSP) for Canvas App

**Implementation approach: Nonce-based CSP via middleware**

```
Key directives for Architex (canvas-heavy app):

default-src 'self';
script-src 'nonce-{random}' 'strict-dynamic';
style-src 'self' 'nonce-{random}';
img-src 'self' blob: data: https://img.clerk.com;
font-src 'self';
connect-src 'self' https://api.clerk.com https://*.clerk.accounts.dev;
frame-src 'none';
object-src 'none';
base-uri 'self';
form-action 'self';
```

**Canvas-specific considerations:**
- Canvas element uses `blob:` and `data:` URIs for image export -- add to `img-src`
- If using WebGL: no additional CSP directives needed (same-origin by default)
- If loading external textures/images: add domains to `img-src`
- Development mode requires `'unsafe-eval'` for React (NOT in production)

**Implementation:**
- Generate fresh nonce per request via middleware
- Pass nonce to components via React context or headers
- Use `next/script` with `nonce` prop
- Report violations to endpoint: `report-uri /api/csp-report`

### 3.3 Rate Limiting

**Recommended: Arcjet (primary) + Upstash Redis (custom rules)**

| Solution | Type | Free Tier | Best For |
|---|---|---|---|
| **Arcjet** | SDK + Edge | 10K requests/mo | Bot protection + rate limiting + WAF in one |
| **Upstash** | Serverless Redis | 10K commands/day | Custom rate limit logic, session storage |
| **Vercel KV** | Managed Redis | Hobby tier | Simple key-value rate limiting |

**Rate limit tiers for Architex:**

```
API Routes:
  Anonymous:     20 requests/minute
  Authenticated: 60 requests/minute
  Pro users:     120 requests/minute

Auth Endpoints:
  Sign-in:       5 attempts/15 minutes per IP
  Sign-up:       3 attempts/hour per IP
  Magic links:   1 per 5 minutes per email
  Password reset: 3 per hour per email

Canvas/Simulation:
  State saves:   30 per minute per user
  Exports:       10 per hour per user
  AI features:   20 per hour per user (pro), 5 per hour (free)
```

**Response:** 429 Too Many Requests with `Retry-After` header.

### 3.4 OWASP Top 10 (2025 Edition) Prevention

| # | Risk | Next.js/Architex Mitigation |
|---|---|---|
| A01 | Broken Access Control | RBAC at DAL, not middleware. RLS in DB. Server-side auth checks in every Route Handler and Server Action. |
| A02 | Cryptographic Failures | TLS everywhere. Clerk handles password hashing. Environment variables for secrets. Never expose `CLERK_SECRET_KEY` client-side. |
| A03 | Injection | Prisma/Drizzle parameterized queries. DOMPurify for any rendered HTML. Zod validation on all inputs. |
| A04 | Insecure Design | Threat modeling before building features. Rate limiting on sensitive endpoints. |
| A05 | Security Misconfiguration | CSP headers. Remove default error pages exposing stack traces. Disable `x-powered-by`. Review `next.config.js` security headers. |
| A06 | Vulnerable Components | `npm audit` in CI. Dependabot/Renovate for dependency updates. SBOM generation (new 2025 requirement). |
| A07 | Auth Failures | Clerk/Better Auth handles securely. MFA enforcement for admin accounts. Session timeout policies. |
| A08 | Software/Data Integrity | Subresource Integrity (SRI) for external scripts. Signed commits. Lock file integrity (`npm ci`). |
| A09 | Logging/Monitoring | Structured logging (Pino/Winston). Error tracking (Sentry). Auth event audit log. |
| A10 | SSRF | Validate/allowlist all server-side URLs. Use Next.js image optimization with configured `remotePatterns`. Block internal network access from server actions. |

### 3.5 DDoS Protection

**Vercel provides automatic DDoS protection for all plans:**
- L3, L4, and L7 mitigation at platform level
- P99 time to mitigation: 3.5 seconds
- P50: 2.5 seconds, fastest: 0.5 seconds
- Attack Challenge Mode: serves challenge page during active attacks (free for all plans)
- Blocked traffic is NOT billed

**Additional layers:**
- Arcjet bot protection at application level
- Upstash rate limiting for API abuse
- Vercel WAF custom rules for L7 fine-tuning (Pro/Enterprise)

### 3.6 Secure File Upload

**Recommended: UploadThing or direct-to-S3 with signed URLs**

**Security checklist:**
- Validate file type server-side (never trust `Content-Type` header alone; check magic bytes)
- Maximum file size: set per upload type (images: 5MB, documents: 25MB)
- Generate unique server-side filenames (UUID); never use user-provided filenames
- Store outside public directory
- Scan for malware (ClamAV or cloud-based scanner)
- Authenticate + authorize before accepting upload
- Use signed URLs with expiration for downloads
- HTTPS only

**UploadThing integration:**
- Server-provided permission checks
- Type-safe file upload routes
- Built-in file type validation
- S3-compatible storage backend

### 3.7 XSS Prevention

**Multi-layered defense:**

1. **React's built-in escaping:** Automatic for JSX expressions. Not sufficient alone.
2. **Avoid raw HTML injection with untrusted input.** If unavoidable, sanitize with DOMPurify first.
3. **DOMPurify for HTML sanitization:**
   - Use `isomorphic-dompurify` for SSR compatibility (works in Node.js + browser)
   - OWASP-recommended library
4. **CSP headers:** Block inline scripts even if injected
5. **HttpOnly cookies:** Prevent client-side script access to session cookies
6. **Input validation with Zod:** Validate and sanitize at every server boundary
7. **Output encoding:** Ensure proper encoding for HTML, URL, JavaScript, and CSS contexts

### 3.8 Recommended Security Libraries

```
# Core security
npm install arcjet          # Bot protection, rate limiting, WAF
npm install @upstash/ratelimit @upstash/redis  # Custom rate limiting

# Input validation
npm install zod             # Schema validation for all inputs

# HTML sanitization
npm install isomorphic-dompurify  # XSS prevention for rendered HTML

# Security headers
# (Configure in next.config.js or middleware)

# File uploads
npm install uploadthing     # Secure file upload handling

# Monitoring
npm install @sentry/nextjs  # Error tracking + performance monitoring
npm install pino            # Structured logging
```

---

## 4. LEGAL & COMPLIANCE

### 4.1 GDPR Compliance Checklist

**Enforcement context:** Over EUR 1.6 billion in GDPR fines in 2024. Regulators increasingly use automated scanning to verify backend behavior against stated policies.

**Technical implementation checklist:**

- [ ] **Data mapping:** Document all personal data, where it's stored, why it's collected, and who processes it
- [ ] **Lawful basis:** Identify legal basis for each data processing activity (consent, legitimate interest, contractual necessity)
- [ ] **Privacy by design:** Data minimization -- only collect what you need
- [ ] **Consent management:** Cookie consent banner with granular controls (analytics, marketing, functional)
- [ ] **Privacy policy:** Comprehensive, accessible, written in plain language
- [ ] **Right to access:** API/UI for users to export their data (JSON/CSV)
- [ ] **Right to erasure:** Self-service account deletion with cascade across all systems
- [ ] **Right to rectification:** Users can edit/correct their personal data
- [ ] **Data portability:** Machine-readable export format
- [ ] **Breach notification:** Process to notify authorities within 72 hours
- [ ] **DPA with processors:** Data Processing Agreements with all third-party services (Clerk, Vercel, analytics, email)
- [ ] **Data retention policy:** Define and enforce retention periods per data category
- [ ] **Encryption:** At rest (AES-256) and in transit (TLS 1.3)
- [ ] **Access controls:** RBAC for internal team access to user data
- [ ] **Audit logging:** Log all access to personal data
- [ ] **SBOM (new 2025):** Software Bill of Materials for dependency transparency

### 4.2 Cookie Consent Banner

**Implementation approach: Custom banner + Google Consent Mode v2**

**Legal requirement:** GDPR and CCPA require explicit consent before loading non-essential scripts (analytics, marketing).

**Cookie categories for Architex:**
1. **Strictly Necessary** (no consent needed): Auth session cookies, CSRF tokens, load balancer cookies
2. **Functional** (consent needed): User preferences, theme, editor state
3. **Analytics** (consent needed): PostHog, Vercel Analytics
4. **Marketing** (consent needed): None initially

**Implementation pattern (no heavy library needed):**

```
1. Server-side: Read consent cookie in middleware
2. Client-side: Show banner if no consent cookie exists
3. Consent choices stored in cookie (not localStorage)
4. Conditionally load analytics scripts based on consent
5. Google Consent Mode v2: default to denied, update to granted on consent
6. Only show to EU users (geo-detection via Vercel headers or CloudFront)
```

**Key libraries/services:**
- Custom implementation (recommended for Architex -- lightweight, full control)
- Termly (hosted solution with auto-scanning, if you want turnkey)
- `cookie-consent-banner` npm package (lightweight option)

### 4.3 Privacy Policy

**Generator recommendation: Termly** (rated best in 2026)
- Free tier: GDPR compliance + quarterly site scans
- Paid: regular policy updates, regulation monitoring, multi-language support, consent logs
- Alternative: GetTerms.io (most affordable, policies reviewed by international lawyers)

**Required sections for Architex:**
1. What data we collect (account info, usage data, simulation data)
2. How we use it (service delivery, analytics, improvement)
3. Legal basis for processing
4. Third-party processors (Clerk, Vercel, PostHog, etc.)
5. Data retention periods
6. User rights (access, correction, deletion, portability)
7. Cookie policy
8. Children's privacy (if applicable)
9. International data transfers
10. Contact information for data inquiries

### 4.4 Terms of Service

**Generator recommendation: TermsFeed or Termly**
- Export as HTML, DOCX, Plain Text, or Markdown
- Customize then have an attorney review

**Required sections for Architex SaaS ToS:**
1. Service description and scope
2. Account registration and responsibilities
3. Subscription plans and billing
4. Acceptable use policy (no scraping, no abuse, no reverse engineering)
5. Intellectual property (user-generated content ownership, platform IP)
6. Content licensing (user retains ownership of their diagrams/notes)
7. Limitation of liability
8. Service availability and SLA (if applicable)
9. Termination and account deletion
10. Dispute resolution / arbitration
11. Governing law
12. DMCA compliance (if user-generated content is public)
13. Changes to terms (notification policy)

### 4.5 Open Source Licensing

**Recommendation for Architex: Dual license -- AGPL-3.0 + Commercial**

| License | Implication | Best For |
|---|---|---|
| **MIT** | Anyone can use, modify, sell. No obligation to open-source. | Maximum adoption, community contributions. Risk: competitors can fork and monetize. |
| **AGPL-3.0** | Network copyleft: anyone running it as a service must release source. | Prevents cloud providers/competitors from offering your product as SaaS without contributing back. |
| **Dual (AGPL + Commercial)** | Open source under AGPL; commercial license for companies that don't want copyleft obligations. | Best of both worlds. Used by MongoDB, Grafana, GitLab. |

**Why AGPL + Commercial for Architex:**
- AGPL protects against competitors running your platform without contributing
- Commercial license generates revenue from enterprises that want to self-host without copyleft
- Preserves open-source community benefits
- Precedent: many successful developer tools use this model (GitLab, Grafana, Minio)

**If you want maximum community adoption (and don't care about competitors forking):** MIT

**Warning:** Many large companies have blanket bans on AGPL. If B2B enterprise adoption is critical, consider Apache-2.0 or BSL (Business Source License, used by HashiCorp, MariaDB, Sentry).

---

## 5. IMPLEMENTATION PRIORITY

### Phase 1: MVP Launch
1. **Clerk** for authentication (social login: GitHub + Google, magic links, email/password)
2. **Zod** for input validation on all server boundaries
3. **CSP headers** in `next.config.js` (strict, nonce-based)
4. **Rate limiting** with Arcjet (basic bot protection + rate limits)
5. **Privacy policy** via Termly (free tier)
6. **Cookie consent banner** (custom, lightweight)
7. **Terms of Service** via TermsFeed
8. Basic RBAC: free_user / pro_user / admin

### Phase 2: Growth
1. **Passkey support** via Clerk
2. **Organizations** via Clerk Organizations (team management, multi-tenancy)
3. **Account deletion** with full data cascade
4. **GDPR data export** (user data download)
5. **Upstash Redis** for custom rate limiting rules
6. **Sentry** for error tracking and monitoring
7. Fine-grained RBAC with permission evaluation

### Phase 3: Scale / Enterprise
1. Evaluate **Better Auth** migration (eliminate per-MAU costs)
2. **SAML SSO** for enterprise customers
3. **Audit logging** for all admin and data access actions
4. **SOC 2 Type II** preparation
5. **DPA templates** for enterprise customers
6. Custom roles and permission management UI
7. **SBOM generation** in CI pipeline

---

## Sources

### Authentication
- [Next.js Authentication Guide](https://nextjs.org/docs/app/guides/authentication)
- [Clerk: Top Tools for Next.js Authentication 2025](https://clerk.com/articles/user-authentication-for-nextjs-top-tools-and-recommendations-for-2025)
- [Top 5 Auth Solutions for Next.js 2026 - WorkOS](https://workos.com/blog/top-authentication-solutions-nextjs-2026)
- [Better Auth vs Clerk vs NextAuth: 2026 SaaS Showdown](https://starterpick.com/blog/better-auth-clerk-nextauth-saas-showdown-2026)
- [Clerk vs Auth0 vs Supabase Auth 2026 Comparison](https://appstackbuilder.com/blog/clerk-vs-auth0-vs-supabase-auth)
- [Clerk Next.js Quickstart](https://clerk.com/docs/nextjs/getting-started/quickstart)
- [Supabase Auth with Next.js](https://supabase.com/docs/guides/auth/quickstarts/nextjs)
- [Better Auth - Official Site](https://better-auth.com/)
- [Magic Links: UX, Security, and Growth Impacts](https://www.baytechconsulting.com/blog/magic-links-ux-security-and-growth-impacts-for-saas-platforms-2025)
- [Passwordless Authentication Guide 2025](https://mojoauth.com/blog/passwordless-authentication-complete-implementation-guide-2025)

### User Management
- [3 Most Common Authorization Designs for SaaS - Cerbos](https://www.cerbos.dev/blog/3-most-common-authorization-designs-for-saas-products)
- [Enterprise Ready RBAC Guide](https://www.enterpriseready.io/features/role-based-access-control/)
- [Multi-Tenant SaaS Architecture in Next.js](https://dev.to/whoffagents/multi-tenant-saas-architecture-in-nextjs-organizations-roles-and-resource-isolation-1n91)
- [SaaS Onboarding Best Practices 2026](https://designrevision.com/blog/saas-onboarding-best-practices)
- [SaaS Onboarding Checklist - ProductLed](https://productled.com/blog/5-best-practices-for-better-saas-user-onboarding)
- [Clerk Organizations: Team-Based Task Manager](https://clerk.com/blog/build-a-team-based-task-manager-with-organizations)

### Security
- [Next.js Security Best Practices 2026 - Authgear](https://www.authgear.com/post/nextjs-security-best-practices)
- [Next.js Security Checklist - Arcjet](https://blog.arcjet.com/next-js-security-checklist/)
- [Next.js CSP Guide](https://nextjs.org/docs/app/guides/content-security-policy)
- [Arcjet Bot Protection Docs](https://docs.arcjet.com/bot-protection/quick-start/)
- [Vercel DDoS Mitigation](https://vercel.com/docs/vercel-firewall/ddos-mitigation)
- [Vercel Protectd: Always-on DoS Mitigations](https://vercel.com/blog/protectd-evolving-vercels-always-on-denial-of-service-mitigations)
- [XSS Prevention in React and Next.js](https://dev.to/roymorken/xss-prevention-in-react-and-nextjs-stop-cross-site-scripting-attacks-4i8h)
- [OWASP Top 10 2025 Edition](https://seccomply.net/resources/blog/owasp-top-10-2025)
- [OWASP Secure Coding Practices 2026](https://www.appsecmaster.net/blog/owasp-secure-coding-practices-building-bulletproof-software-in-2026/)

### Legal and Compliance
- [GDPR Compliance Checklist for SaaS Developers 2026](https://dev.to/felixkruger/the-complete-gdpr-compliance-checklist-for-saas-developers-2026-40o4)
- [GDPR for US SaaS Companies 2026 Guide](https://www.nwlextech.com/compliance/gdpr-for-us-saas-companies-the-complete-2026-guide)
- [Right to Erasure: GDPR Guide](https://complydog.com/blog/right-to-be-forgotten-gdpr-erasure-rights-guide)
- [GDPR Deletion and Backups](https://www.probackup.io/blog/gdpr-and-backups-how-to-handle-deletion-requests)
- [Next.js Cookie Consent Banner Guide](https://www.buildwithmatija.com/blog/build-cookie-consent-banner-nextjs-15-server-client)
- [Termly Privacy Policy Generator](https://termly.io/products/privacy-policy-generator/)
- [SaaS Terms of Service Template](https://promise.legal/templates/terms-of-service)
- [AGPL vs MIT for SaaS Founders](https://www.getmonetizely.com/articles/should-you-license-your-open-source-saas-under-agpl-or-mit-a-decision-guide-for-founders)
- [Open Source Licenses 2026 Guide](https://dev.to/juanisidoro/open-source-licenses-which-one-should-you-pick-mit-gpl-apache-agpl-and-more-2026-guide-p90)
