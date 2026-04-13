# PaperDraw.dev — Supabase Database Analysis

> Discovered via authenticated API calls on 2026-04-11

## Database: Supabase

- **Project URL**: `https://uvbvgyepzrfaqpsqphjl.supabase.co`
- **Auth**: Google Sign-In via Supabase Auth
- **API Key (publishable)**: `sb_publishable_0LB-X57NyXJdRmkfr8N-Zw_zbvHvZWz`

## Tables Discovered (6 accessible)

### 1. `profiles` — 7,885 rows
User profiles with subscription data.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | User ID |
| display_name | text | User display name |
| avatar_url | text | Profile picture URL |
| created_at | timestamp | Account creation |
| subscription_tier | text | `free` or `pro` |
| subscription_status | text | `inactive` or `active` |
| subscription_provider | text | `paypal` or `razorpay` |
| paypal_subscription_id | text | PayPal subscription ID |
| razorpay_subscription_id | text | Razorpay subscription ID |
| subscription_renewal_at | timestamp | Next renewal date |
| billing_updated_at | timestamp | Last billing update |
| ai_credits | integer | AI feature credits |
| ai_credits_updated_at | timestamp | Last credits update |

**Key insight**: They support **Razorpay** (for India) in addition to PayPal!

### 2. `designs` — User's saved designs
Full design data with review pipeline.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Design ID |
| user_id | uuid | Owner |
| title | text | Design name |
| description | text | Description |
| canvas_data | jsonb | **Full design JSON** (V2 schema with components, connections, constraints, failureModes, etc.) |
| is_public | boolean | Published to community |
| upvotes | integer | Community votes |
| status | text | `pending`, `approved`, `rejected` |
| rejection_reason | text | Why rejected |
| approved_at | timestamp | When approved |
| blueprint_path | text | Static asset path |
| thumbnail_url | text | Preview image |
| blog_markdown | text | AI-generated blog/writeup |
| origin_kind | text | `manual`, `template`, `ai_generated` |
| origin_template_id | uuid | Source template if cloned |
| origin_template_title | text | Source template name |
| review_source | text | Who reviewed (AI/human) |
| review_score | numeric | Quality score |
| review_summary | text | Review summary text |
| review_issues | jsonb | Array of issues found |
| review_model | text | AI model used for review |
| reviewed_at | timestamp | When reviewed |

### 3. `specialization_profile_overlays` — 741 rows
**THIS IS THE GOLDMINE.** AI-generated simulation rules for each component based on its topology position.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Profile ID |
| component_type | text | e.g., `apiGateway`, `cache`, `database` |
| profile_signature | text | Topology encoding: `appServer\|up:load_balancer\|down:cache,database\|traits:autoscale` |
| domain | text | `compute`, `load_balancer`, `cache`, `database`, `network`, etc. |
| mode | text | `custom_rules` |
| status | text | `approved` |
| draft_json | jsonb | **Full rule set** (see structure below) |
| model_name | text | `gemini-2.5-flash` (AI model that generated it) |
| prompt_version | text | `specialization_runtime_server_v1` |
| generated_by_server | boolean | true |
| is_runtime_current | boolean | true = active version |

#### `draft_json` Structure (the actual simulation rules):

```json
{
  "mode": "custom_rules",
  "domain": "compute",
  "category": "compute",
  "confidence": 0.8,
  "componentType": "appServer",
  "issues": [
    {
      "code": "APP_SERVER_DB_FAILURE",
      "type": "dependency_failure",
      "title": "App Server Experiencing Downstream Database Failure",
      "cause": "The connected database is unavailable...",
      "rootReason": "Downstream dependency outage",
      "impactSummary": "Returns errors to upstream callers...",
      "recommendation": "Investigate database health...",
      "issueLevel": "error",
      "defaultSeverity": 0.7,
      "replacementTypes": ["database"],
      "defaultEffects": [],
      "fixType": null,
      "errorCode": null
    }
  ],
  "ruleIntents": [
    {
      "name": "Downstream Database Failure Propagates as App Server Errors",
      "issueCode": "APP_SERVER_DB_FAILURE",
      "impactShape": "error_rate_increase",
      "propagationRole": "downstream_consumer",
      "dependencyScopes": ["downstream"],
      "causalNarrativeTemplate": "A failure in the {downstream} database causes {component} to fail, propagating errors to {upstream}",
      "metricThresholdHints": {},
      "neighborMetricThresholdHints": {}
    }
  ],
  "assumptions": [],
  "reviewWarnings": []
}
```

#### Profile Signature Format
Encodes the component's position in the architecture:
```
{componentType}|up:{upstream_types}|down:{downstream_types}|traits:{trait_list}
```

Examples:
- `apiGateway|up:none|down:load_balancer|traits:none`
- `appServer|up:load_balancer|down:cache,database|traits:autoscale,is_sync_request_path`
- `cache|up:compute|down:none|traits:read_heavy`
- `database|up:compute|down:none|traits:write_heavy`

#### Profiles Per Component Type
| Component | Profiles | Why Multiple |
|-----------|----------|-------------|
| appServer | 120 | Different upstream/downstream/trait combos |
| apiGateway | 80 | Varies by what's behind it |
| loadBalancer | 70 | Different backend types |
| database | 60 | OLTP vs OLAP vs streaming |
| cache | 39 | Read-heavy vs write-through vs warmup |
| cdn | 32 | Origin types, cache policies |
| worker | 26 | Queue vs event vs batch |
| serverless | 24 | Different trigger patterns |
| networkLoadBalancer | 22 | L4 vs L7, sync vs async |
| dns | 18 | Internal vs external |
| client | 18 | Direct vs CDN vs API |
| waf | 14 | DDoS, injection, rate limit |
| customService | 13 | User-defined services |
| authService | 12 | SSO, JWT, OAuth patterns |
| llmGateway | 12 | Different model routing |
| queue | 11 | Reliable vs best-effort |
| (+ 50 more) | ... | ... |

**Total: 741 profiles containing 1,035 issues and 1,034 rule intents**

### 4. `simulation_runs` — 3 rows
Tracks simulation executions.

| Column | Type |
|--------|------|
| id | uuid |
| user_id | uuid |
| started_at | timestamp |
| system_state | jsonb |

### 5. `comments` — 1 row
Community design comments (threaded).

| Column | Type |
|--------|------|
| id | uuid |
| design_id | uuid |
| user_id | uuid |
| content | text |
| created_at | timestamp |
| parent_id | uuid (nullable, for threading) |

### 6. `feedback` — 0 rows
User feedback (empty).

## Business Intelligence (from 7,885 profiles)

### User Growth
| Month | Signups | Cumulative |
|-------|---------|-----------|
| Feb 2026 | 221 | 221 |
| Mar 2026 | **4,543** | 4,764 |
| Apr 2026 (11 days) | **3,121** | 7,885 |

**Launched ~Feb 2026.** Massive March spike (likely Hacker News "Show HN" post). April on track to beat March.

### Conversion & Revenue
| Metric | Value |
|--------|-------|
| Total users | **7,885** |
| Pro subscribers | **6** (0.076% conversion) |
| Active subscriptions | 6 |
| Cancelled subscriptions | 2 |
| Conversion rate | **0.076%** (extremely low) |
| Users with AI credits | 67 |
| Total AI credits consumed | 365 |

### Payment Provider Usage
| Provider | Users |
|----------|-------|
| PayPal | 7,885 (100%) |
| Razorpay | 0 (column exists, not used yet) |

### Key Takeaways
- **Product-market fit exists** — 7,885 signups in ~2 months is strong
- **Monetization not working yet** — only 6 paying users out of 7,885
- **Free tier (3 sims)** may be too generous or paywall not compelling enough
- **Razorpay planned but not launched** — India market opportunity waiting
- **AI credits system active** — 67 users tried AI features

---

## Key Findings

### Payment Providers
- **PayPal** — Primary, with full checkout flow
- **Razorpay** — For Indian market (column exists in profiles!)
- Both have subscription_id columns

### AI Integration
- Rules generated by **Gemini 2.5 Flash** (model_name field)
- Prompt version: `specialization_runtime_server_v1`
- Each component gets **topology-aware** rules based on its neighbors
- AI also does design review (review_model, review_score columns)
- AI credits system for limited AI features

### Design Review Pipeline
- Designs go through: `pending` → `approved`/`rejected`
- AI reviews with score, summary, and issues
- Support for blog/markdown generation
- Origin tracking: `manual`, `template`, `ai_generated`

### The Specialization System is the Core Innovation
PaperDraw doesn't use static rules. When you place components on the canvas:
1. It computes a **profile_signature** based on topology (upstream, downstream, traits)
2. Queries `specialization_profile_overlays` for matching profiles
3. Gets AI-generated **issues** + **ruleIntents** for that specific topology
4. Uses **causalNarrativeTemplate** to generate human-readable incident reports
5. Each issue has: code, type, cause, rootReason, impactSummary, recommendation, severity

This means the same "Database" component gets different simulation behavior depending on whether it's behind a Load Balancer (OLTP) vs connected to an ETL Pipeline (OLAP).
