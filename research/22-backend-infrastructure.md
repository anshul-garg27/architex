# Backend Infrastructure, Database Design & Scalability Architecture

> Complete backend architecture for Architex with specific services, libraries, database schema, and deployment recommendations.

---

## ARCHITECTURE OVERVIEW

```mermaid
graph TB
    subgraph "Client Layer"
        Browser["Browser (Next.js Client)"]
        PWA["PWA / Mobile"]
    end

    subgraph "Edge Layer (Vercel)"
        EdgeMW["Edge Middleware<br/>Auth, Rate Limit, Geo"]
        EdgeFn["Edge Functions<br/>OG Image Gen, Redirects"]
    end

    subgraph "Application Layer (Vercel Serverless)"
        RSC["React Server Components"]
        SA["Server Actions"]
        API["API Route Handlers"]
    end

    subgraph "Real-Time Layer"
        PartyKit["PartyKit (Cloudflare)<br/>Collaboration Rooms"]
        YjsSync["Yjs CRDT Sync"]
    end

    subgraph "Background Jobs"
        Inngest["Inngest<br/>Event-Driven Workflows"]
    end

    subgraph "Data Layer"
        Neon["Neon Postgres<br/>(Primary DB)"]
        NeonRead["Neon Read Replicas"]
        Upstash["Upstash Redis<br/>(Cache + Rate Limit)"]
    end

    subgraph "Storage Layer"
        R2["Cloudflare R2<br/>(Exports, Public Assets)"]
        SupaStorage["Supabase Storage<br/>(User Uploads, Avatars)"]
    end

    subgraph "External Services"
        Clerk["Clerk Auth"]
        Claude["Claude API<br/>(AI Review)"]
        PostHog["PostHog Analytics"]
        Sentry["Sentry Errors"]
    end

    Browser --> EdgeMW --> RSC
    Browser --> SA
    Browser --> API
    Browser <--> PartyKit
    PartyKit <--> YjsSync
    RSC --> Neon
    RSC --> NeonRead
    SA --> Neon
    API --> Neon
    API --> Upstash
    API --> Inngest
    Inngest --> Neon
    Inngest --> Claude
    Inngest --> R2
    EdgeMW --> Upstash
    EdgeMW --> Clerk
```

---

## 1. DATABASE: NEON SERVERLESS POSTGRES

### Why Neon Over Alternatives

| Criteria | Neon | Supabase | PlanetScale |
|---|---|---|---|
| **Architecture** | Serverless Postgres, storage/compute separated | BaaS built on Postgres | Vitess (MySQL-compatible) |
| **Scale-to-Zero** | Yes (true serverless) | No (always-on compute) | No (min $39/mo Metal) |
| **Cold Start** | ~500ms (configurable min compute) | ~100-500ms Edge Functions | Near-zero (always-on) |
| **Branching** | Instant (copy-on-write) | GA in 2025 | Git-like branching |
| **Connection Model** | HTTP driver for edge + pooled TCP | PostgREST HTTP API | Standard MySQL protocol |
| **Free Tier** | 0.5 GB storage, 190 compute hours | 500 MB, 2 projects | Eliminated in 2024 |
| **Cost at Scale** | Consumption-based | Predictable tiers | $39/mo minimum |
| **Owner** | Databricks (acquired 2025, ~$1B) | Independent | Independent |

**Decision: Neon** -- True serverless Postgres with the best characteristics for a Next.js + Vercel deployment: HTTP driver for edge, instant branching for preview deployments, scale-to-zero for cost efficiency, and standard PostgreSQL (no MySQL limitations). Configure min compute size of 0.25 CU for production to eliminate cold starts.

### Connection Strategy

```mermaid
graph LR
    subgraph "Edge Runtime"
        Edge["Edge Functions"] -->|"@neondatabase/serverless<br/>(HTTP)"| NeonHTTP["Neon HTTP Endpoint"]
    end

    subgraph "Serverless Functions"
        SF["Server Actions<br/>API Routes"] -->|"Drizzle + neon-serverless<br/>(WebSocket pooled)"| NeonWS["Neon Connection Pooler"]
    end

    subgraph "Background Jobs"
        BG["Inngest Workers"] -->|"Drizzle + node-postgres<br/>(TCP pooled)"| NeonTCP["Neon Direct Connection"]
    end

    subgraph "Neon"
        NeonHTTP --> Primary["Primary Compute"]
        NeonWS --> Primary
        NeonTCP --> Primary
        Primary --> ReadReplica["Read Replica(s)"]
    end
```

**Three connection modes based on runtime:**
1. **Edge Functions**: `@neondatabase/serverless` HTTP driver (no TCP, works in edge runtime)
2. **Serverless Functions**: Neon's built-in connection pooler (WebSocket-based, handles connection reuse)
3. **Background Jobs**: Direct TCP via `node-postgres` (long-lived connections OK for Inngest workers)

---

## 2. ORM: DRIZZLE ORM

### Why Drizzle Over Prisma

| Criteria | Drizzle | Prisma |
|---|---|---|
| **Bundle Size** | ~50KB | ~2-4MB (engine binary) |
| **Cold Start Impact** | Minimal | +200-800ms (engine init) |
| **Query Overhead** | 10-20% over raw SQL | 2-4x over raw SQL |
| **Schema Definition** | TypeScript (code-first) | Prisma Schema Language |
| **Edge Runtime** | Full support | Requires Prisma Accelerate |
| **SQL Control** | Direct SQL-like syntax | Abstracted API |
| **Migrations** | `drizzle-kit` (push, generate, migrate) | `prisma migrate` |
| **Learning Curve** | Steeper (SQL knowledge needed) | Gentler (abstracted) |

**Decision: Drizzle** -- Dramatically smaller bundle size means faster serverless cold starts. Direct SQL-like syntax gives fine-grained control. Native edge runtime support without a paid proxy service. The team building Architex understands SQL, so the steeper learning curve is not an issue.

### Drizzle Configuration

```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema/*",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!, // Neon connection pooler URL
  },
});
```

```typescript
// src/db/index.ts
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleHTTP } from "drizzle-orm/neon-http";
import { drizzle as drizzleWS } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

// For Edge Runtime (HTTP-based, no persistent connection)
export const dbEdge = drizzleHTTP(neon(process.env.DATABASE_URL!), { schema });

// For Serverless Functions (WebSocket pooled)
import { Pool } from "@neondatabase/serverless";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzleWS(pool, { schema });
```

---

## 3. DATABASE SCHEMA

### Entity Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ DIAGRAMS : creates
    USERS ||--o{ PROGRESS : tracks
    USERS ||--o{ ACHIEVEMENTS_USERS : earns
    USERS ||--o{ ACTIVITY_EVENTS : generates
    USERS ||--o{ COMMENTS : writes
    USERS ||--o{ UPVOTES : gives
    USERS ||--o{ COLLAB_PARTICIPANTS : joins

    DIAGRAMS ||--o{ COMMENTS : receives
    DIAGRAMS ||--o{ UPVOTES : receives
    DIAGRAMS ||--o{ DIAGRAM_VERSIONS : has

    TEMPLATES ||--o{ DIAGRAMS : "based on"
    CHALLENGES ||--o{ DIAGRAMS : "submissions for"
    CHALLENGES ||--o{ CHALLENGE_RUBRICS : "scored by"

    CONCEPTS ||--o{ PROGRESS : "mastery of"
    CONCEPTS ||--o{ CHALLENGE_CONCEPTS : "tested by"
    CHALLENGES ||--o{ CHALLENGE_CONCEPTS : tests

    ACHIEVEMENTS ||--o{ ACHIEVEMENTS_USERS : "awarded to"

    COLLAB_SESSIONS ||--o{ COLLAB_PARTICIPANTS : includes
    DIAGRAMS ||--o{ COLLAB_SESSIONS : "edited in"
```

### Complete Schema (Drizzle ORM)

```typescript
// ============================================================
// src/db/schema/users.ts
// ============================================================
import {
  pgTable, uuid, text, varchar, timestamp, boolean,
  jsonb, integer, pgEnum
} from "drizzle-orm/pg-core";

export const subscriptionTierEnum = pgEnum("subscription_tier", [
  "free", "pro", "team"
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Clerk manages auth; this is the Clerk user ID
  clerkId: varchar("clerk_id", { length: 255 }).notNull().unique(),

  // Profile
  username: varchar("username", { length: 50 }).notNull().unique(),
  displayName: varchar("display_name", { length: 100 }),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),

  // Preferences (theme, editor settings, notification prefs)
  preferences: jsonb("preferences").$type<UserPreferences>().default({}),

  // Gamification
  xp: integer("xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  streakCurrent: integer("streak_current").notNull().default(0),
  streakLongest: integer("streak_longest").notNull().default(0),
  streakLastActivityDate: timestamp("streak_last_activity_date", {
    withTimezone: true,
  }),

  // Subscription
  tier: subscriptionTierEnum("tier").notNull().default("free"),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// TypeScript types inferred from schema
type UserPreferences = {
  theme?: "light" | "dark" | "system";
  editorLayout?: "horizontal" | "vertical";
  showMinimap?: boolean;
  animationSpeed?: "slow" | "normal" | "fast";
  notifyEmail?: boolean;
  notifyBrowser?: boolean;
};
```

```typescript
// ============================================================
// src/db/schema/diagrams.ts
// ============================================================
export const diagramVisibilityEnum = pgEnum("diagram_visibility", [
  "private", "unlisted", "public"
]);

export const diagrams = pgTable("diagrams", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, {
    onDelete: "cascade",
  }),

  // Metadata
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  visibility: diagramVisibilityEnum("visibility").notNull().default("private"),

  // Diagram content: React Flow serialized state
  // { nodes: [...], edges: [...], viewport: {...} }
  content: jsonb("content").$type<DiagramContent>().notNull(),

  // Lightweight thumbnail for gallery/list views (base64 or R2 URL)
  thumbnailUrl: text("thumbnail_url"),

  // Classification
  diagramType: varchar("diagram_type", { length: 50 }),  // "system-design", "class", "sequence", etc.
  tags: text("tags").array(),

  // If created from a template or challenge submission
  templateId: uuid("template_id").references(() => templates.id),
  challengeId: uuid("challenge_id").references(() => challenges.id),

  // Fork tracking
  forkedFromId: uuid("forked_from_id").references(() => diagrams.id),

  // Counters (denormalized for query performance)
  viewCount: integer("view_count").notNull().default(0),
  upvoteCount: integer("upvote_count").notNull().default(0),
  commentCount: integer("comment_count").notNull().default(0),
  forkCount: integer("fork_count").notNull().default(0),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdx: index("diagrams_user_id_idx").on(table.userId),
  visibilityIdx: index("diagrams_visibility_idx").on(table.visibility),
  challengeIdx: index("diagrams_challenge_id_idx").on(table.challengeId),
  createdAtIdx: index("diagrams_created_at_idx").on(table.createdAt),
  // GIN index for tags array search
  tagsIdx: index("diagrams_tags_idx").using("gin", table.tags),
}));

// Versioning for undo history and fork points
export const diagramVersions = pgTable("diagram_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  diagramId: uuid("diagram_id").notNull().references(() => diagrams.id, {
    onDelete: "cascade",
  }),
  versionNumber: integer("version_number").notNull(),
  content: jsonb("content").$type<DiagramContent>().notNull(),
  message: varchar("message", { length: 200 }), // "Added load balancer"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  diagramVersionIdx: uniqueIndex("diagram_version_unique").on(
    table.diagramId, table.versionNumber
  ),
}));
```

```typescript
// ============================================================
// src/db/schema/templates.ts
// ============================================================
export const templateDifficultyEnum = pgEnum("template_difficulty", [
  "beginner", "intermediate", "advanced"
]);

export const templates = pgTable("templates", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Metadata
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  // e.g., "load-balancer", "microservices", "database-sharding"
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  difficulty: templateDifficultyEnum("difficulty").notNull(),

  // The actual template diagram content
  content: jsonb("content").$type<DiagramContent>().notNull(),

  // Learning metadata
  concepts: text("concepts").array(),  // ["caching", "cdn", "load-balancing"]
  estimatedMinutes: integer("estimated_minutes"),

  // Ordering and visibility
  sortOrder: integer("sort_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(false),
  isFeatured: boolean("is_featured").notNull().default(false),

  // Denormalized usage counter
  useCount: integer("use_count").notNull().default(0),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  categoryIdx: index("templates_category_idx").on(table.category),
  slugIdx: uniqueIndex("templates_slug_idx").on(table.slug),
}));
```

```typescript
// ============================================================
// src/db/schema/challenges.ts
// ============================================================
export const challengeDifficultyEnum = pgEnum("challenge_difficulty", [
  "easy", "medium", "hard", "expert"
]);

export const challengeStatusEnum = pgEnum("challenge_status", [
  "draft", "published", "archived"
]);

export const challenges = pgTable("challenges", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Metadata
  title: varchar("title", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description").notNull(), // Markdown: problem statement
  difficulty: challengeDifficultyEnum("difficulty").notNull(),
  status: challengeStatusEnum("status").notNull().default("draft"),

  // Problem configuration
  // Constraints, requirements, scale parameters
  constraints: jsonb("constraints").$type<ChallengeConstraints>(),
  // Starter diagram (partially filled)
  starterContent: jsonb("starter_content").$type<DiagramContent>(),
  // Reference solution (hidden from users, used by AI grader)
  referenceSolution: jsonb("reference_solution").$type<DiagramContent>(),

  // Time limit in minutes (null = unlimited)
  timeLimitMinutes: integer("time_limit_minutes"),

  // Tags and categorization
  tags: text("tags").array(),
  category: varchar("category", { length: 100 }),
  // e.g., "url-shortener", "chat-system", "news-feed"

  // Engagement counters
  submissionCount: integer("submission_count").notNull().default(0),
  avgScore: integer("avg_score"),  // 0-100

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Rubric dimensions for AI grading
export const challengeRubrics = pgTable("challenge_rubrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  challengeId: uuid("challenge_id").notNull().references(() => challenges.id, {
    onDelete: "cascade",
  }),
  dimension: varchar("dimension", { length: 100 }).notNull(),
  // e.g., "completeness", "scalability", "reliability"
  description: text("description").notNull(),
  weight: integer("weight").notNull().default(1), // relative weight
  maxPoints: integer("max_points").notNull().default(10),
  // Criteria for AI: what constitutes full marks
  criteria: text("criteria").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

// Many-to-many: which concepts a challenge tests
export const challengeConcepts = pgTable("challenge_concepts", {
  challengeId: uuid("challenge_id").notNull().references(() => challenges.id, {
    onDelete: "cascade",
  }),
  conceptId: uuid("concept_id").notNull().references(() => concepts.id, {
    onDelete: "cascade",
  }),
}, (table) => ({
  pk: primaryKey({ columns: [table.challengeId, table.conceptId] }),
}));
```

```typescript
// ============================================================
// src/db/schema/progress.ts  (Spaced Repetition + Mastery)
// ============================================================
export const masteryLevelEnum = pgEnum("mastery_level", [
  "novice",       // 0-20%   first exposure
  "beginner",     // 20-40%  can recognize
  "intermediate", // 40-60%  can apply with help
  "proficient",   // 60-80%  can apply independently
  "expert"        // 80-100% can teach others
]);

// Concept catalog (system design building blocks)
export const concepts = pgTable("concepts", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  // e.g., "caching", "databases", "networking", "distributed-systems"
  description: text("description"),
  // Prerequisites: concept slugs that should be learned first
  prerequisites: text("prerequisites").array(),
  sortOrder: integer("sort_order").notNull().default(0),
});

// User x Concept mastery + SRS scheduling
export const progress = pgTable("progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, {
    onDelete: "cascade",
  }),
  conceptId: uuid("concept_id").notNull().references(() => concepts.id, {
    onDelete: "cascade",
  }),

  // Mastery tracking
  masteryLevel: masteryLevelEnum("mastery_level").notNull().default("novice"),
  masteryScore: integer("mastery_score").notNull().default(0), // 0-100 fine-grained

  // SM-2 Spaced Repetition fields
  // https://en.wikipedia.org/wiki/SuperMemo#Description_of_SM-2_algorithm
  easeFactor: integer("ease_factor").notNull().default(250), // stored as x100 (2.50 = 250)
  interval: integer("interval").notNull().default(1),         // days until next review
  repetitions: integer("repetitions").notNull().default(0),   // successful review count

  // Scheduling
  nextReviewAt: timestamp("next_review_at", { withTimezone: true }),
  lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),

  // Performance history
  totalAttempts: integer("total_attempts").notNull().default(0),
  successfulAttempts: integer("successful_attempts").notNull().default(0),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userConceptUnique: uniqueIndex("progress_user_concept_unique").on(
    table.userId, table.conceptId
  ),
  nextReviewIdx: index("progress_next_review_idx").on(
    table.userId, table.nextReviewAt
  ),
}));

// Individual review events (for analytics and SRS recalculation)
export const reviewEvents = pgTable("review_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, {
    onDelete: "cascade",
  }),
  conceptId: uuid("concept_id").notNull().references(() => concepts.id),
  challengeId: uuid("challenge_id").references(() => challenges.id),

  // SM-2 quality grade: 0 (complete blackout) to 5 (perfect response)
  quality: integer("quality").notNull(), // 0-5
  // Time spent in seconds
  timeSpentSeconds: integer("time_spent_seconds"),

  // Snapshot of SRS state AFTER this review
  newEaseFactor: integer("new_ease_factor").notNull(),
  newInterval: integer("new_interval").notNull(),
  newMasteryScore: integer("new_mastery_score").notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userDateIdx: index("review_events_user_date_idx").on(
    table.userId, table.createdAt
  ),
}));
```

```typescript
// ============================================================
// src/db/schema/achievements.ts
// ============================================================
export const achievementTypeEnum = pgEnum("achievement_type", [
  "streak",        // "7-day streak", "30-day streak"
  "mastery",       // "Caching Expert", "Database Master"
  "challenge",     // "First Challenge", "100 Challenges"
  "community",     // "First Comment", "100 Upvotes Received"
  "special"        // "Beta Tester", "Founding Member"
]);

export const achievements = pgTable("achievements", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description").notNull(),
  type: achievementTypeEnum("type").notNull(),
  iconUrl: text("icon_url"),
  xpReward: integer("xp_reward").notNull().default(0),
  // Condition as structured JSON for programmatic checking
  // e.g., { "type": "streak", "threshold": 7 }
  condition: jsonb("condition").$type<AchievementCondition>().notNull(),
  isHidden: boolean("is_hidden").notNull().default(false), // secret achievements
  sortOrder: integer("sort_order").notNull().default(0),
});

export const achievementsUsers = pgTable("achievements_users", {
  userId: uuid("user_id").notNull().references(() => users.id, {
    onDelete: "cascade",
  }),
  achievementId: uuid("achievement_id").notNull().references(() => achievements.id),
  unlockedAt: timestamp("unlocked_at", { withTimezone: true }).notNull().defaultNow(),
  // Context of unlock: which challenge, which concept, etc.
  context: jsonb("context"),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.achievementId] }),
  userIdx: index("achievements_users_user_idx").on(table.userId),
}));
```

```typescript
// ============================================================
// src/db/schema/activity.ts
// ============================================================
export const activityTypeEnum = pgEnum("activity_type", [
  // Learning events
  "challenge_started", "challenge_submitted", "challenge_scored",
  "concept_reviewed", "mastery_level_up",
  // Social events
  "diagram_published", "diagram_forked", "comment_added",
  "upvote_given", "upvote_received",
  // Achievement events
  "achievement_unlocked", "streak_milestone",
  // Collaboration events
  "collab_session_started", "collab_session_ended",
]);

export const activityEvents = pgTable("activity_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, {
    onDelete: "cascade",
  }),
  type: activityTypeEnum("type").notNull(),

  // Polymorphic reference to the subject of the event
  // Only one of these will be populated per event
  diagramId: uuid("diagram_id").references(() => diagrams.id, {
    onDelete: "set null",
  }),
  challengeId: uuid("challenge_id").references(() => challenges.id, {
    onDelete: "set null",
  }),
  conceptId: uuid("concept_id").references(() => concepts.id, {
    onDelete: "set null",
  }),
  achievementId: uuid("achievement_id").references(() => achievements.id, {
    onDelete: "set null",
  }),

  // Additional structured data (score, old/new mastery level, etc.)
  metadata: jsonb("metadata"),

  // Visibility: only show public events in feeds
  isPublic: boolean("is_public").notNull().default(false),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userTimeIdx: index("activity_events_user_time_idx").on(
    table.userId, table.createdAt
  ),
  typeTimeIdx: index("activity_events_type_time_idx").on(
    table.type, table.createdAt
  ),
  // For public activity feed
  publicTimeIdx: index("activity_events_public_time_idx")
    .on(table.isPublic, table.createdAt)
    .where(sql`is_public = true`),
}));
```

```typescript
// ============================================================
// src/db/schema/community.ts (Comments, Upvotes)
// ============================================================
export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  diagramId: uuid("diagram_id").notNull().references(() => diagrams.id, {
    onDelete: "cascade",
  }),
  userId: uuid("user_id").notNull().references(() => users.id, {
    onDelete: "cascade",
  }),
  // Threaded comments
  parentId: uuid("parent_id").references(() => comments.id, {
    onDelete: "cascade",
  }),

  content: text("content").notNull(), // Markdown
  isEdited: boolean("is_edited").notNull().default(false),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  diagramIdx: index("comments_diagram_idx").on(table.diagramId),
  userIdx: index("comments_user_idx").on(table.userId),
  parentIdx: index("comments_parent_idx").on(table.parentId),
}));

export const upvotes = pgTable("upvotes", {
  userId: uuid("user_id").notNull().references(() => users.id, {
    onDelete: "cascade",
  }),
  diagramId: uuid("diagram_id").notNull().references(() => diagrams.id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.diagramId] }),
  diagramIdx: index("upvotes_diagram_idx").on(table.diagramId),
}));
```

```typescript
// ============================================================
// src/db/schema/collaboration.ts
// ============================================================
export const collabSessionStatusEnum = pgEnum("collab_session_status", [
  "active", "ended"
]);

export const collabSessions = pgTable("collab_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  diagramId: uuid("diagram_id").notNull().references(() => diagrams.id, {
    onDelete: "cascade",
  }),
  hostUserId: uuid("host_user_id").notNull().references(() => users.id),

  // PartyKit room identifier
  roomId: varchar("room_id", { length: 255 }).notNull().unique(),

  status: collabSessionStatusEnum("status").notNull().default("active"),
  maxParticipants: integer("max_participants").notNull().default(10),

  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
});

export const collabParticipants = pgTable("collab_participants", {
  sessionId: uuid("session_id").notNull().references(() => collabSessions.id, {
    onDelete: "cascade",
  }),
  userId: uuid("user_id").notNull().references(() => users.id, {
    onDelete: "cascade",
  }),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  leftAt: timestamp("left_at", { withTimezone: true }),
  // Cursor color for awareness protocol
  cursorColor: varchar("cursor_color", { length: 7 }),
}, (table) => ({
  pk: primaryKey({ columns: [table.sessionId, table.userId] }),
}));
```

### Diagram Content Storage Strategy

**Store diagram JSON in PostgreSQL JSONB, NOT in file storage.**

Rationale:
- Average diagram JSON size: 5-50 KB (well within Postgres's 1 GB JSONB limit)
- JSONB enables indexed queries on content (e.g., find diagrams containing a specific component type)
- Atomic reads/writes with diagram metadata -- no consistency issues between DB and file storage
- Transactional versioning: save a version and update the latest in one transaction
- Neon's JSONB performance is excellent; no need for a document database

Export artifacts (PNG, PDF, SVG) are ephemeral and stored in Cloudflare R2.

---

## 4. AUTHENTICATION: CLERK

### Why Clerk

| Criteria | Clerk | Better Auth | Auth.js |
|---|---|---|---|
| **Setup Time** | Minutes (managed) | Hours (self-hosted) | Moderate |
| **Pre-built UI** | Full component library | None | None |
| **Next.js Integration** | First-class middleware | Manual | Good |
| **Social Login** | 20+ providers OOTB | Manual per provider | Good |
| **Organizations** | GA (multi-tenancy) | Manual | No |
| **Cost** | Free to 10K MAU | Free (self-hosted compute) | Free |
| **Vendor Lock-in** | Yes | No | No |
| **2FA/Passkeys** | Built-in | Plugin system | No |

**Decision: Clerk** -- Fastest time-to-production auth with best Next.js DX. Free tier covers the entire MVP phase (10K MAU). Pre-built components (`<SignIn/>`, `<UserProfile/>`, `<OrganizationSwitcher/>`) save weeks of UI work. If vendor lock-in becomes a concern at scale, migrate to Better Auth later; the user data model is in Neon, not Clerk.

**Integration pattern:** Clerk manages authentication only. User profile data, preferences, gamification state, and all application data live in the Neon `users` table, linked via `clerk_id`. Clerk webhooks (via Inngest) sync user creation/updates to the database.

---

## 5. BACKEND ARCHITECTURE

### Request Handling Strategy

```mermaid
flowchart TD
    Request["Incoming Request"] --> EdgeMW["Edge Middleware\n(Clerk auth check, rate limit)"]

    EdgeMW --> RSC{"React Server\nComponent?"}
    EdgeMW --> SA{"Server\nAction?"}
    EdgeMW --> API{"API Route\nHandler?"}

    RSC -->|"Read-heavy pages\n(dashboard, gallery, templates)"| ReadDB["Read from\nNeon Read Replica"]
    SA -->|"Mutations\n(save diagram, submit challenge)"| WriteDB["Write to\nNeon Primary"]
    API -->|"Webhooks, external\nconsumers, AI endpoints"| WriteDB

    SA -->|"Async follow-up"| Inngest["Inngest Event"]
    API -->|"Async follow-up"| Inngest

    Inngest -->|"AI grading"| Claude["Claude API"]
    Inngest -->|"Achievement check"| AchCheck["Achievement Engine"]
    Inngest -->|"Thumbnail gen"| ThumbGen["Generate Thumbnail"]
    Inngest -->|"Analytics"| Analytics["PostHog"]
```

### When to Use Each Pattern

| Pattern | Use Case | Example |
|---|---|---|
| **React Server Components** | Read-heavy data fetching | Dashboard, gallery browse, template list, leaderboard |
| **Server Actions** | Form submissions, mutations | Save diagram, submit challenge, update profile, upvote |
| **API Route Handlers** | Webhooks, external APIs, streaming | Clerk webhooks, AI streaming response, diagram export |
| **Edge Middleware** | Auth guard, rate limiting, geo-routing | Protect `/dashboard/*`, rate limit AI endpoints |
| **Edge Functions** | Latency-critical, lightweight compute | OG image generation, redirects, A/B flags |

### Server Action Examples

```typescript
// src/app/actions/diagrams.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { diagrams, activityEvents } from "@/db/schema";
import { inngest } from "@/inngest/client";
import { revalidatePath } from "next/cache";

export async function saveDiagram(diagramId: string, content: DiagramContent) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const dbUser = await getDbUser(userId); // Clerk ID -> DB user

  await db.update(diagrams)
    .set({ content, updatedAt: new Date() })
    .where(
      and(eq(diagrams.id, diagramId), eq(diagrams.userId, dbUser.id))
    );

  // Fire-and-forget: generate thumbnail in background
  await inngest.send({
    name: "diagram/saved",
    data: { diagramId, userId: dbUser.id },
  });

  revalidatePath(`/diagrams/${diagramId}`);
}

export async function submitChallenge(
  challengeId: string,
  diagramId: string
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const dbUser = await getDbUser(userId);

  // Record submission event
  await db.insert(activityEvents).values({
    userId: dbUser.id,
    type: "challenge_submitted",
    diagramId,
    challengeId,
    isPublic: true,
  });

  // Trigger async AI grading pipeline
  await inngest.send({
    name: "challenge/submitted",
    data: { challengeId, diagramId, userId: dbUser.id },
  });
}
```

---

## 6. BACKGROUND JOBS: INNGEST

### Why Inngest Over Trigger.dev

| Criteria | Inngest | Trigger.dev v3 |
|---|---|---|
| **Execution Model** | Calls YOUR serverless endpoints | Runs on Trigger.dev infrastructure |
| **Vercel Integration** | Native (runs inside your functions) | External (separate deployment) |
| **Step Functions** | Built-in durable steps with retries | Built-in |
| **Cost Model** | Per-step ($0 for first 50K runs/mo) | Per-run ($0 for first 5K runs/mo) |
| **Long-Running Jobs** | Durable steps chain (no timeout issue) | Native long-running support |
| **Self-Hosting** | Proprietary engine | Apache 2.0, fully self-hostable |
| **Complexity** | Lower (stays in your codebase) | Higher (separate infra to think about) |

**Decision: Inngest** -- Runs inside your existing Vercel deployment (no separate infrastructure), event-driven architecture maps naturally to Architex's workflow (diagram saved -> generate thumbnail, challenge submitted -> AI grade -> check achievements -> update progress), and the generous free tier (50K runs/month) covers MVP and beyond. Its durable step functions sidestep serverless timeout limits by chaining steps.

### Key Background Workflows

```typescript
// src/inngest/functions/grade-challenge.ts
import { inngest } from "../client";

export const gradeChallenge = inngest.createFunction(
  {
    id: "grade-challenge",
    retries: 3,
    concurrency: { limit: 10 }, // max 10 concurrent AI calls
  },
  { event: "challenge/submitted" },
  async ({ event, step }) => {
    const { challengeId, diagramId, userId } = event.data;

    // Step 1: Load challenge rubric and user diagram
    const { challenge, diagram, rubrics } = await step.run(
      "load-data",
      async () => {
        // ... fetch from database
      }
    );

    // Step 2: Call Claude AI for grading (most expensive/slow step)
    const gradeResult = await step.run("ai-grade", async () => {
      return await callClaudeForGrading({
        problemStatement: challenge.description,
        constraints: challenge.constraints,
        rubrics,
        userDiagram: diagram.content,
        referenceSolution: challenge.referenceSolution,
      });
    });

    // Step 3: Update progress and mastery scores
    await step.run("update-progress", async () => {
      await updateConceptMastery(userId, challengeId, gradeResult);
    });

    // Step 4: Check for achievement unlocks
    await step.run("check-achievements", async () => {
      await checkAndAwardAchievements(userId, {
        type: "challenge_scored",
        score: gradeResult.totalScore,
        challengeId,
      });
    });

    // Step 5: Record activity event
    await step.run("record-activity", async () => {
      await db.insert(activityEvents).values({
        userId,
        type: "challenge_scored",
        challengeId,
        diagramId,
        metadata: {
          score: gradeResult.totalScore,
          breakdown: gradeResult.dimensionScores,
        },
        isPublic: true,
      });
    });

    return { score: gradeResult.totalScore };
  }
);
```

```typescript
// src/inngest/functions/diagram-saved.ts
export const onDiagramSaved = inngest.createFunction(
  { id: "diagram-saved" },
  { event: "diagram/saved" },
  async ({ event, step }) => {
    const { diagramId, userId } = event.data;

    // Generate thumbnail image
    await step.run("generate-thumbnail", async () => {
      const thumbnailBuffer = await generateDiagramThumbnail(diagramId);
      const url = await uploadToR2(`thumbnails/${diagramId}.png`, thumbnailBuffer);
      await db.update(diagrams)
        .set({ thumbnailUrl: url })
        .where(eq(diagrams.id, diagramId));
    });
  }
);
```

```typescript
// src/inngest/functions/clerk-webhook.ts
export const onClerkUserCreated = inngest.createFunction(
  { id: "clerk-user-created" },
  { event: "clerk/user.created" },
  async ({ event, step }) => {
    await step.run("create-db-user", async () => {
      await db.insert(users).values({
        clerkId: event.data.id,
        username: event.data.username || generateUsername(),
        displayName: `${event.data.first_name} ${event.data.last_name}`.trim(),
        avatarUrl: event.data.image_url,
      });
    });

    // Initialize progress for core concepts
    await step.run("init-progress", async () => {
      const coreConcepts = await db.select().from(concepts);
      const dbUser = await db.select().from(users)
        .where(eq(users.clerkId, event.data.id))
        .limit(1);

      await db.insert(progress).values(
        coreConcepts.map((c) => ({
          userId: dbUser[0].id,
          conceptId: c.id,
        }))
      );
    });
  }
);
```

### Scheduled Jobs (Cron via Inngest)

```typescript
// Daily streak check
export const dailyStreakCheck = inngest.createFunction(
  { id: "daily-streak-check" },
  { cron: "0 0 * * *" }, // midnight UTC
  async ({ step }) => {
    await step.run("reset-broken-streaks", async () => {
      // Users who had a streak but no activity yesterday
      await db.update(users)
        .set({ streakCurrent: 0 })
        .where(
          and(
            gt(users.streakCurrent, 0),
            lt(users.streakLastActivityDate,
              new Date(Date.now() - 48 * 60 * 60 * 1000) // 48h grace
            )
          )
        );
    });
  }
);

// Weekly leaderboard snapshot
export const weeklyLeaderboard = inngest.createFunction(
  { id: "weekly-leaderboard" },
  { cron: "0 0 * * 1" }, // Monday midnight
  async ({ step }) => {
    // Snapshot top users for "This Week's Leaders" display
  }
);
```

---

## 7. REAL-TIME COLLABORATION: PARTYKIT + YJS

### Architecture

```mermaid
sequenceDiagram
    participant U1 as User A (Browser)
    participant U2 as User B (Browser)
    participant PK as PartyKit Server<br/>(Cloudflare Durable Object)
    participant DB as Neon Postgres

    Note over U1,U2: User A creates collaboration session

    U1->>PK: Connect WebSocket to room/{diagramId}
    PK->>DB: Load diagram content
    PK-->>U1: Initial Yjs document state

    U2->>PK: Connect WebSocket to room/{diagramId}
    PK-->>U2: Initial Yjs document state + awareness

    Note over U1,U2: Real-time editing

    U1->>PK: Yjs update (moved node)
    PK->>U2: Broadcast Yjs update
    U2->>PK: Yjs update (added edge)
    PK->>U1: Broadcast Yjs update

    Note over PK,DB: Periodic persistence

    PK->>DB: Debounced save (every 5s of inactivity)

    Note over U1,U2: Session ends

    U1->>PK: Disconnect
    U2->>PK: Disconnect
    PK->>DB: Final save of merged document
```

### Why PartyKit

- Built on Cloudflare Durable Objects: stateful, globally distributed, auto-scales
- Native Yjs integration (`y-partykit` adapter)
- Cloudflare acquired PartyKit -- long-term backing
- Each room is a Durable Object: all users editing the same diagram connect to the same instance
- Awareness protocol built-in: live cursors, presence indicators, selection highlights
- No WebSocket infrastructure to manage
- **Decoupled from Vercel**: Real-time runs on Cloudflare, application logic runs on Vercel. Best-of-breed for each.

### Implementation Pattern

```typescript
// partykit/server.ts (deployed to Cloudflare)
import type { Party, Connection } from "partykit/server";
import { onConnect } from "y-partykit";

export default class DiagramRoom implements Party.Server {
  constructor(readonly room: Party.Room) {}

  async onConnect(conn: Connection) {
    // y-partykit handles Yjs sync protocol
    return onConnect(conn, this.room, {
      persist: true, // auto-persist Yjs doc to Durable Object storage

      async load() {
        // Load initial diagram from Neon on first connection
        // (subsequent loads come from DO storage)
      },

      callback: {
        // Debounced callback when document changes
        handler: async (yDoc) => {
          // Persist merged state back to Neon
          await saveDiagramToNeon(this.room.id, yDoc);
        },
        debounceWait: 5000,  // 5s after last change
        debounceMaxWait: 30000, // max 30s between saves
      },
    });
  }
}
```

---

## 8. FILE STORAGE

### Dual Storage Strategy

```mermaid
graph LR
    subgraph "Cloudflare R2 (Public/Ephemeral)"
        Thumbnails["Diagram Thumbnails"]
        Exports["PNG/PDF/SVG Exports"]
        OGImages["OG Social Images"]
        Templates["Template Preview Images"]
    end

    subgraph "Supabase Storage (Auth-Gated)"
        Avatars["User Avatars"]
        Attachments["Challenge Attachments"]
    end

    R2Reasons["Why R2:\n- Zero egress fees\n- CDN-native (Cloudflare network)\n- S3-compatible API\n- Best for high-read public assets"]
    SupaReasons["Why Supabase Storage:\n- RLS policies = auth-gated uploads\n- Integrated with Clerk via JWT\n- Image transformations built-in\n- Best for user-generated uploads"]
```

| Storage | Use Case | Access | Estimated Volume |
|---|---|---|---|
| **Cloudflare R2** | Diagram thumbnails, exports, OG images, static assets | Public CDN | High read, low write |
| **Supabase Storage** | User avatars, challenge attachments | Auth-gated (RLS) | Low-medium |
| **PostgreSQL JSONB** | Diagram content (nodes, edges, viewport) | Via API | Every save (5-50KB) |
| **Client IndexedDB** | Local draft, undo history, offline cache | Client-only | Unbounded |

### OG Image Generation

Dynamic social sharing images for diagrams and challenge results using Vercel's `@vercel/og` (based on Satori):

```typescript
// src/app/api/og/diagram/[id]/route.tsx
import { ImageResponse } from "next/og";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const diagram = await db.select().from(diagrams)
    .where(eq(diagrams.id, params.id))
    .limit(1);

  return new ImageResponse(
    (
      <div style={{ display: "flex", /* ... styles */ }}>
        <h1>{diagram.title}</h1>
        <img src={diagram.thumbnailUrl} />
        <p>Built on Architex</p>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
```

---

## 9. CACHING STRATEGY

### Multi-Layer Caching Architecture

```mermaid
graph TB
    subgraph "Layer 1: Edge (Vercel CDN)"
        L1["Static Pages (SSG)\nTemplates, docs, marketing\nCache: indefinite, revalidate on deploy"]
    end

    subgraph "Layer 2: ISR/PPR (Vercel)"
        L2["Semi-Static Pages\nGallery, leaderboard, challenge list\nCache: 60s ISR or PPR static shell"]
    end

    subgraph "Layer 3: Upstash Redis"
        L3["Application Cache\nRate limits, session data,\nleaderboard snapshots,\nfrequently-read config"]
    end

    subgraph "Layer 4: Neon Read Replica"
        L4["Database Reads\nDashboard data, user progress,\ndiagram content"]
    end

    subgraph "Layer 5: Client (IndexedDB/Memory)"
        L5["Client Cache\nActive diagram state,\nundo history, draft saves"]
    end

    L1 --> L2 --> L3 --> L4
    L5 -.->|"Offline-first\nfor diagram editing"| L4
```

### Per-Page Rendering Strategy

| Page | Strategy | Cache TTL | Rationale |
|---|---|---|---|
| `/` (landing) | SSG | Indefinite (rebuild on deploy) | Pure marketing content |
| `/templates` | ISR | 60s `revalidate` | Rarely changes, shared across users |
| `/templates/[slug]` | ISR | 3600s + on-demand revalidation | Template content is curated |
| `/challenges` | ISR | 60s | Challenge list rarely changes |
| `/challenges/[slug]` | PPR | Static shell + dynamic progress | Problem is static, user progress is dynamic |
| `/gallery` | ISR | 30s | Community content updates frequently |
| `/gallery/[id]` | SSR | None (dynamic) | View count, comments, user-specific state |
| `/dashboard` | SSR | None (fully personalized) | User-specific progress, streaks, activity |
| `/dashboard/review` | SSR | None | SRS-scheduled cards are time-sensitive |
| `/editor/[id]` | CSR | Client IndexedDB | Heavy client interaction, offline-capable |
| `/profile/[username]` | ISR | 60s | Public profile, shared across viewers |
| `/leaderboard` | ISR | 300s (5 min) | Snapshot-based, no real-time requirement |

### Upstash Redis Usage

```typescript
// src/lib/cache.ts
import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate limiting (Edge Middleware)
import { Ratelimit } from "@upstash/ratelimit";

export const aiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 AI calls per minute
  analytics: true,
  prefix: "ratelimit:ai",
});

export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 API calls per minute
  prefix: "ratelimit:api",
});

// Leaderboard cache
export async function getCachedLeaderboard(): Promise<LeaderboardEntry[]> {
  const cached = await redis.get<LeaderboardEntry[]>("leaderboard:weekly");
  if (cached) return cached;

  const fresh = await db.select(/* top 100 by XP this week */);
  await redis.set("leaderboard:weekly", fresh, { ex: 300 }); // 5 min TTL
  return fresh;
}

// Template metadata cache
export async function getCachedTemplate(slug: string) {
  const cacheKey = `template:${slug}`;
  const cached = await redis.get(cacheKey);
  if (cached) return cached;

  const template = await db.select().from(templates)
    .where(eq(templates.slug, slug))
    .limit(1);
  await redis.set(cacheKey, template[0], { ex: 3600 }); // 1 hour
  return template[0];
}
```

---

## 10. SCALABILITY ARCHITECTURE

### Scaling Milestones

```
Phase 1: 0 → 1K users (MVP)
├── Neon Free Tier (0.25 CU, scale-to-zero)
├── Vercel Hobby/Pro
├── Inngest Free (50K runs/mo)
├── Clerk Free (10K MAU)
├── Upstash Free (10K commands/day)
└── Total cost: ~$0-20/mo

Phase 2: 1K → 10K users (Growth)
├── Neon Scale ($69/mo, autoscale 0.25-4 CU)
├── Vercel Pro ($20/mo + usage)
├── Inngest ($25/mo, 250K steps)
├── Clerk Pro ($25/mo)
├── Upstash Pay-as-you-go ($0.20/100K commands)
├── Cloudflare R2 (10 GB free, then $0.015/GB)
└── Total cost: ~$150-300/mo

Phase 3: 10K → 100K users (Scale)
├── Neon Business ($700/mo, autoscale 1-8 CU, read replicas)
├── Vercel Enterprise
├── Inngest custom plan
├── Clerk custom plan
├── Upstash Pro ($280/mo, 1M commands/day)
├── Add connection pooling (Neon built-in)
├── Add Neon read replicas for dashboard/gallery reads
└── Total cost: ~$1,500-3,000/mo
```

### Connection Pooling Strategy

```mermaid
graph TB
    subgraph "Vercel Serverless Functions (100+ concurrent)"
        F1["Function 1"] --> Pool["Neon Connection Pooler\n(PgBouncer built-in)\nconnection_limit=1 per function"]
        F2["Function 2"] --> Pool
        F3["Function N"] --> Pool
    end

    subgraph "Vercel Fluid Compute"
        FC["Shared Instance\n(reuses connections\nacross requests)"]
        FC --> Pool
    end

    Pool --> Primary["Neon Primary\nmax_connections=100"]
    Pool --> ReadReplica["Neon Read Replica\nmax_connections=100"]

    subgraph "Edge Functions"
        EF["Edge Function"] -->|"HTTP (no pool needed)"| NeonHTTP["Neon HTTP API"]
    end
```

Key settings:
- Serverless functions: `connection_limit=1` per function instance (Neon pooler multiplexes)
- Neon connection pooler: PgBouncer in transaction mode (built into Neon, no setup)
- Edge functions: HTTP driver (stateless, no connections to pool)
- Vercel Fluid Compute: Multiple requests share the same function instance and connection pool
- Read replicas: Route all dashboard/gallery/leaderboard reads to replicas

### Horizontal Scaling Considerations

| Bottleneck | At What Scale | Solution |
|---|---|---|
| **DB connections** | ~50 concurrent serverless functions | Neon connection pooler (built-in) |
| **DB read throughput** | ~5K concurrent users | Neon read replicas via Drizzle `withReplica()` |
| **AI grading throughput** | ~100 concurrent submissions | Inngest concurrency limits + queue |
| **Real-time rooms** | ~1K concurrent collab sessions | PartyKit auto-scales (Durable Objects) |
| **File storage reads** | ~10K concurrent thumbnail loads | R2 + Cloudflare CDN (auto-scales) |
| **Cache pressure** | ~10K concurrent users | Upstash auto-scales (serverless Redis) |
| **DB write throughput** | ~100K users | Neon autoscaling CU + write optimization |

### Database Query Optimization

```sql
-- Indexes already defined in schema above. Additional strategies:

-- 1. Use read replicas for heavy reads
-- Drizzle withReplica() pattern:
--   const dbWithReplicas = drizzle(primaryPool, {
--     schema,
--     replica: { read: drizzle(replicaPool, { schema }) },
--   });

-- 2. Denormalized counters (avoid COUNT(*) at scale)
-- upvote_count, comment_count, fork_count on diagrams table
-- Updated via Inngest events, not inline with mutations

-- 3. Partial indexes for hot queries
-- activity_events WHERE is_public = true (public feed)
-- diagrams WHERE visibility = 'public' (gallery)

-- 4. JSONB indexing for diagram content search
-- CREATE INDEX ON diagrams USING gin (content jsonb_path_ops);
-- Enables: WHERE content @> '{"nodes": [{"type": "load-balancer"}]}'
```

---

## 11. COMPLETE TECHNOLOGY STACK SUMMARY

### Backend Services

| Layer | Technology | Purpose |
|---|---|---|
| **Database** | Neon Serverless Postgres | Primary data store |
| **ORM** | Drizzle ORM | Type-safe queries, migrations |
| **Auth** | Clerk | Authentication, user management |
| **Cache** | Upstash Redis | Rate limiting, session cache, leaderboard |
| **Background Jobs** | Inngest | AI grading, achievements, thumbnails, webhooks |
| **Real-Time** | PartyKit + Yjs | Collaborative diagram editing |
| **File Storage (Public)** | Cloudflare R2 | Thumbnails, exports, OG images |
| **File Storage (Auth)** | Supabase Storage | User avatars, attachments |
| **AI** | Claude API (Sonnet 4.6) | Design review, grading, hints |
| **Analytics** | PostHog | Product analytics, feature flags |
| **Error Tracking** | Sentry | Error monitoring, session replay |
| **OG Images** | @vercel/og (Satori) | Dynamic social sharing cards |

### NPM Packages (Backend-Specific)

```json
{
  "dependencies": {
    "@clerk/nextjs": "^6",
    "@neondatabase/serverless": "^1",
    "@upstash/redis": "^2",
    "@upstash/ratelimit": "^2",
    "drizzle-orm": "^0.39",
    "inngest": "^3",
    "@vercel/og": "^0.7",
    "@anthropic-ai/sdk": "^0.37",
    "@aws-sdk/client-s3": "^3",
    "posthog-js": "^1",
    "@sentry/nextjs": "^8"
  },
  "devDependencies": {
    "drizzle-kit": "^0.30",
    "dotenv": "^16"
  }
}
```

### Deployment Architecture

```mermaid
graph TB
    subgraph "Vercel (Application)"
        direction TB
        App["Next.js 16 App"]
        EdgeMW["Edge Middleware"]
        ServerlessFn["Serverless Functions"]
        EdgeFn["Edge Functions"]
        InngestRoute["Inngest Route Handler\n(/api/inngest)"]
    end

    subgraph "Cloudflare (Real-Time + Storage)"
        PK["PartyKit\n(Durable Objects)"]
        R2Store["R2 Object Storage"]
        CDN["Cloudflare CDN"]
    end

    subgraph "Neon (Database)"
        NeonPrimary["Primary Compute\n(autoscale 0.25-4 CU)"]
        NeonReplica["Read Replica"]
        NeonBranch["Preview Branches\n(per Vercel preview)"]
    end

    subgraph "Managed Services"
        ClerkSvc["Clerk (Auth)"]
        InngestSvc["Inngest (Jobs)"]
        UpstashSvc["Upstash (Redis)"]
        SupaSvc["Supabase (Storage)"]
    end

    App --> NeonPrimary
    App --> NeonReplica
    App --> UpstashSvc
    InngestRoute --> InngestSvc
    InngestSvc --> ServerlessFn
    EdgeMW --> ClerkSvc
    EdgeMW --> UpstashSvc
    PK --> NeonPrimary
    R2Store --> CDN

    NeonBranch -.->|"Preview deploys"| App
```

### Environment Variables

```
# Neon Postgres
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/architex?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/architex?sslmode=require

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxx...

# Inngest
INNGEST_EVENT_KEY=evt_...
INNGEST_SIGNING_KEY=signkey_...

# Cloudflare R2
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=architex-assets

# Supabase Storage
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Claude AI
ANTHROPIC_API_KEY=sk-ant-...

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

---

## 12. KEY ARCHITECTURAL DECISIONS SUMMARY

| Decision | Choice | Key Rationale |
|---|---|---|
| Database | Neon Postgres | True serverless, HTTP driver for edge, instant branching, scale-to-zero |
| ORM | Drizzle | 40x smaller bundle than Prisma, native edge support, SQL-level control |
| Auth | Clerk | Fastest to production, 10K free MAU, pre-built UI components |
| Background Jobs | Inngest | Runs inside Vercel, event-driven, durable steps, 50K free runs/mo |
| Real-Time | PartyKit + Yjs | Cloudflare-backed, native CRDT support, global edge, auto-scales |
| Cache | Upstash Redis | HTTP-based (serverless-native), rate limiting SDK, free tier |
| Public Storage | Cloudflare R2 | Zero egress fees, CDN-native, S3-compatible |
| Auth Storage | Supabase Storage | RLS policies, image transforms, simple auth integration |
| Diagram Data | PostgreSQL JSONB | Atomic with metadata, indexable, transactional versioning |
| Rendering | PPR + ISR + SSR mix | Per-page optimization based on data freshness requirements |
| AI Integration | Claude Sonnet 4.6 | Best price-performance for architecture reasoning |
| Monorepo | Single Next.js app | No premature service extraction; split only when proven necessary |

---

## SOURCES

### Database Comparisons
- [Serverless PostgreSQL 2025: Supabase, Neon, and PlanetScale](https://dev.to/dataformathub/serverless-postgresql-2025-the-truth-about-supabase-neon-and-planetscale-7lf)
- [Neon vs Supabase vs PlanetScale: Managed Postgres for Next.js in 2026](https://dev.to/whoffagents/neon-vs-supabase-vs-planetscale-managed-postgres-for-nextjs-in-2026-2el4)
- [Best Database Software for Startups and SaaS (2026)](https://makerkit.dev/blog/tutorials/best-database-software-startups)
- [Is Neon Worth It in 2026?](https://adtools.org/buyers-guide/is-neon-worth-it-in-2026-an-honest-deep-dive-into-serverless-postgress-most-hyped-platform)

### ORM Comparisons
- [Drizzle vs Prisma ORM in 2026](https://makerkit.dev/blog/tutorials/drizzle-vs-prisma)
- [Prisma vs Drizzle: Performance, DX & Migration Paths](https://designrevision.com/blog/prisma-vs-drizzle)
- [Drizzle vs Prisma 2026: Definitive ORM Comparison](https://tech-insider.org/drizzle-vs-prisma-2026/)
- [Prisma ORM vs Drizzle | Prisma Documentation](https://www.prisma.io/docs/orm/more/comparisons/prisma-and-drizzle)

### Backend Architecture
- [Best Practice: API in Next.js vs. Separate Backend](https://dev.to/joy5k/best-practice-api-in-nextjs-vs-separate-backend-3gjg)
- [Server Actions in Next.js: The Future of API Routes](https://medium.com/@sparklewebhelp/server-actions-in-next-js-the-future-of-api-routes-06e51b22a59f)
- [Next.js Background Jobs: Inngest vs Trigger.dev vs Vercel Cron](https://www.hashbuilds.com/articles/next-js-background-jobs-inngest-vs-trigger-dev-vs-vercel-cron)
- [Running Background Jobs on Vercel: Inngest vs Trigger.dev](https://nextbuild.co/blog/background-jobs-vercel-inngest-trigger)

### Real-Time and WebSockets
- [How We Built WebSocket Servers for Vercel Functions - Rivet](https://rivet.dev/blog/2025-10-20-how-we-built-websocket-servers-for-vercel-functions/)
- [PartyKit Documentation](https://docs.partykit.io/how-partykit-works/)
- [PartyKit: Building Real-Time Collaborative Apps in 2026](https://latestfromtechguy.com/article/partykit-realtime-collaboration-2026)

### Storage
- [Supabase vs R2 (2026): Integrated Storage vs Zero Egress](https://www.buildmvpfast.com/compare/supabase-vs-r2)
- [Cloud Storage Pricing (2026)](https://www.buildmvpfast.com/api-costs/cloud-storage)

### Caching
- [Redis Caching Strategies: Next.js Production Guide 2025](https://www.digitalapplied.com/blog/redis-caching-strategies-nextjs-production)
- [Upstash vs Redis Cloud (2026)](https://www.buildmvpfast.com/compare/upstash-vs-redis-cloud)

### Rendering Strategies
- [SSR vs SSG vs ISR vs PPR: Rendering 2026](https://www.pkgpulse.com/blog/ssr-vs-ssg-vs-isr-vs-ppr-rendering-2026)
- [When to Use SSR in Next.js 16: A Decision Framework](https://makerkit.dev/blog/tutorials/nextjs-when-to-use-ssr)

### Scaling
- [Connection Pooling with Vercel Functions](https://vercel.com/guides/connection-pooling-with-serverless-functions)
- [Neon: Millisecond Connections at Scale](https://medium.com/@kaushalsinh73/node-js-neon-serverless-postgres-millisecond-connections-at-scale-ecc2e5e9848a)
- [Neon Read Replicas with Drizzle](https://neon.com/guides/read-replica-drizzle)

### Auth
- [Better Auth vs NextAuth vs Clerk (2026)](https://supastarter.dev/blog/better-auth-vs-nextauth-vs-clerk)
- [Authentication in Next.js: Clerk vs Auth.js vs Custom Auth](https://dev.to/mrsupercraft/authentication-in-nextjs-clerk-vs-authjs-vs-custom-auth-a-comprehensive-guide-5fnk)

### OG Image Generation
- [Vercel OG Image Generation](https://vercel.com/docs/og-image-generation)
- [Dynamic OG Images in Next.js: Boost Social Sharing & SEO](https://www.f22labs.com/blogs/boost-site-engagement-with-dynamic-open-graph-images-in-next-js/)

### Neon + Drizzle Setup
- [Drizzle ORM - Todo App with Neon Postgres](https://orm.drizzle.team/docs/tutorials/drizzle-nextjs-neon)
- [Drizzle with Local and Serverless Postgres](https://neon.com/guides/drizzle-local-vercel)
- [Scale Next.js with Drizzle ORM and Neon Read Replicas](https://neon.com/guides/read-replica-drizzle)
- [Schema Migration with Neon and Drizzle](https://neon.com/docs/guides/drizzle-migrations)
