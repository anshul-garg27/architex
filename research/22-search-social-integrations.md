# Search, Social Features & Third-Party Integrations

> Complete design for Architex's search infrastructure, social/community features, and external platform integrations. Includes specific libraries, APIs, database schemas, and implementation approaches.

---

# PART 1: SEARCH SYSTEM

## 1.1 Search Architecture Decision

### The Problem

Architex has 6 distinct content types that must be searched globally:

| Content Type | Volume | Attributes | Update Frequency |
|---|---|---|---|
| System Design Templates | 55+ (growing) | title, description, components, difficulty, company, category | Weekly |
| Algorithms | 100+ | name, category, complexity, tags, language | Monthly |
| Data Structures | 45+ | name, category, operations, complexity | Monthly |
| Design Patterns | 23+ | name, type (creational/structural/behavioral), language | Monthly |
| Learning Content | 200+ pages | title, body text, module, section | Weekly |
| Community Designs | Unbounded (UGC) | title, author, description, components, tags, upvotes | Continuous |

### Decision: Hybrid Client-Side + Server-Side Search

**Phase 1 (MVP, offline-first):** Client-side search with FlexSearch
**Phase 2 (with cloud tier):** Meilisearch for cloud-hosted search
**Phase 3 (scale):** Add Typesense if Meilisearch limits are hit

#### Why FlexSearch for Phase 1 (Not Fuse.js)

| Criteria | FlexSearch | Fuse.js | Lunr.js |
|---|---|---|---|
| Performance on 500+ docs | Sub-1ms | 10-50ms | 5-20ms |
| Index size in memory | Smallest | Moderate | Moderate |
| Fuzzy matching | Yes (configurable) | Yes (best fuzzy) | Limited |
| Full-text indexing | Yes (inverted index) | No (pattern matching) | Yes |
| Offline/PWA compatible | Yes | Yes | Yes |
| Bundle size | ~6KB gzipped | ~5KB gzipped | ~8KB gzipped |
| Weekly npm downloads | ~420K | ~5M | ~3.6M |

FlexSearch wins because Architex content is structured (not free-form prose where Fuse.js fuzzy excels). FlexSearch uses a proper inverted index -- it is not doing brute-force pattern matching like Fuse.js. For 500+ documents with known fields, FlexSearch returns results in under 1ms vs Fuse.js at 10-50ms.

```typescript
// packages: flexsearch@0.7.43
import { Document } from 'flexsearch';

// Create a multi-field document index
const searchIndex = new Document({
  document: {
    id: 'id',
    index: [
      { field: 'title', tokenize: 'forward', resolution: 9 },
      { field: 'description', tokenize: 'forward', resolution: 5 },
      { field: 'category', tokenize: 'strict', resolution: 3 },
      { field: 'tags', tokenize: 'forward', resolution: 7 },
      { field: 'company', tokenize: 'strict', resolution: 3 },
    ],
    store: ['title', 'description', 'type', 'difficulty', 'category', 'icon'],
  },
  tokenize: 'forward',  // prefix matching: "cons" matches "consistent hashing"
  cache: 100,            // LRU cache for repeated queries
  optimize: true,
});

// Index all content types with a type discriminator
templates.forEach(t => searchIndex.add({
  id: `template:${t.slug}`,
  title: t.title,
  description: t.description,
  category: t.category,
  tags: t.tags.join(' '),
  company: t.company || '',
  type: 'template',
  difficulty: t.difficulty,
  icon: t.icon,
}));

algorithms.forEach(a => searchIndex.add({
  id: `algo:${a.slug}`,
  title: a.name,
  description: a.description,
  category: a.category,
  tags: a.tags.join(' '),
  company: '',
  type: 'algorithm',
  difficulty: a.difficulty,
  icon: 'code',
}));
```

#### Why Meilisearch for Phase 2 (Not Algolia, Not Typesense)

| Criteria | Meilisearch | Typesense | Algolia |
|---|---|---|---|
| License | MIT | GPL-3.0 | Proprietary |
| Self-hostable | Yes | Yes | No |
| Pricing (self-host) | Free | Free | N/A |
| Pricing (cloud) | Free up to 10K docs | From $0.04/hr (~$29/mo) | From $1/1K search requests |
| Setup complexity | Minimal (single binary) | Minimal | Managed |
| Typo tolerance | Built-in | Built-in | Built-in |
| Faceted filtering | Yes | Yes | Yes |
| React InstantSearch | Yes (adapter) | Yes (adapter) | Native |
| Sub-50ms response | Yes | Yes | Yes |
| Best for | Frontend-facing, dev-friendly | E-commerce, HA clustering | Enterprise, AI features |

Meilisearch wins for Architex because:
1. MIT license aligns with AGPL-3.0 core strategy (Typesense is GPL)
2. Self-hostable for free (critical for open-source version)
3. Meilisearch Cloud free tier covers early growth (10K documents, 10K searches/month)
4. Best developer experience -- zero config, just throw JSON at it
5. Built-in React InstantSearch adapter via `@meilisearch/instant-meilisearch`

```typescript
// packages: meilisearch@0.45, @meilisearch/instant-meilisearch@0.21
// Server-side: index content
import { MeiliSearch } from 'meilisearch';

const client = new MeiliSearch({ host: 'http://localhost:7700', apiKey: 'MASTER_KEY' });

// Create unified index with filterable/sortable attributes
await client.index('content').updateSettings({
  searchableAttributes: ['title', 'description', 'body', 'tags', 'company'],
  filterableAttributes: ['type', 'difficulty', 'category', 'company', 'components'],
  sortableAttributes: ['popularity', 'createdAt', 'title'],
  rankingRules: [
    'words', 'typo', 'proximity', 'attribute', 'sort', 'exactness',
    'popularity:desc',  // custom ranking rule: popular content first
  ],
  typoTolerance: {
    minWordSizeForTypos: { oneTypo: 3, twoTypos: 6 },
  },
  faceting: { maxValuesPerFacet: 100 },
  pagination: { maxTotalHits: 1000 },
});

// Index documents with type discriminator
await client.index('content').addDocuments([
  {
    id: 'template:twitter-fanout',
    type: 'template',
    title: 'Twitter Fanout Architecture',
    description: 'Fan-out on write vs read, timeline service, caching layer',
    difficulty: 'hard',
    category: 'social-media',
    company: 'Twitter',
    components: ['load-balancer', 'cache', 'message-queue', 'database'],
    tags: ['fanout', 'timeline', 'caching', 'real-time'],
    popularity: 847,
    createdAt: '2026-01-15',
  },
  // ... all other content
]);
```

### 1.2 Command Palette Search (Cmd+K)

Already specced in MEGA_PROMPT with `cmdk@^1`. Here is the detailed implementation for unified search integration:

```typescript
// packages: cmdk@1.1, flexsearch@0.7
// File: src/components/command-palette/CommandPalette.tsx

import { Command } from 'cmdk';
import { useSearchIndex } from '@/hooks/useSearchIndex';
import { useHotkeys } from '@/hooks/useHotkeys';

// Content type icons and routing
const TYPE_CONFIG = {
  template:  { icon: 'layout-template', route: '/templates', color: 'text-blue-400' },
  algorithm: { icon: 'code',            route: '/algorithms', color: 'text-green-400' },
  structure: { icon: 'binary-tree',     route: '/structures', color: 'text-purple-400' },
  pattern:   { icon: 'puzzle',          route: '/patterns',   color: 'text-orange-400' },
  learning:  { icon: 'book-open',       route: '/learn',      color: 'text-cyan-400' },
  community: { icon: 'users',           route: '/gallery',    color: 'text-pink-400' },
} as const;

// Search result ranking weights
const RANK_CONFIG = {
  recentlyViewed: 100,   // boost items user has viewed recently
  bookmarked: 80,        // boost bookmarked items
  titleMatch: 60,        // exact title match
  popularityBase: 0.1,   // multiply by popularity score
};
```

**Command Palette Sections (Priority Order):**

1. **Recent** -- last 10 items the user interacted with (from IndexedDB)
2. **Search Results** -- real-time FlexSearch results grouped by type
3. **Actions** -- context-aware commands (from current module)
4. **Navigation** -- switch module, open settings, toggle panels

**Keyboard Flow:**

| Key | Action |
|---|---|
| `Cmd+K` / `Ctrl+K` | Open palette |
| Type text | Live search across all content |
| `Arrow Up/Down` | Navigate results |
| `Enter` | Open selected item |
| `Cmd+Enter` | Open in new tab/split |
| `Tab` | Switch between result groups |
| `Esc` | Close palette |
| `Backspace` on empty | Go back to parent section |

### 1.3 Template Gallery Filters (Faceted Search)

The template gallery at `architex.dev/templates` needs faceted search with real-time filter counts.

**Facet Dimensions:**

| Facet | Type | Values |
|---|---|---|
| Difficulty | Single-select chips | Easy, Medium, Hard, Expert |
| Category | Multi-select checkboxes | Social Media, E-Commerce, Streaming, Messaging, Storage, Fintech, Infrastructure |
| Company | Multi-select with search | Twitter, Netflix, Uber, Stripe, Google, Meta, Amazon, Spotify, ... |
| Components Used | Multi-select tags | Load Balancer, Cache, Message Queue, CDN, Database, Search Engine, ... |
| Sort By | Single-select dropdown | Relevance, Most Popular, Newest, Difficulty (asc/desc) |

**Implementation with Meilisearch Facets:**

```typescript
// Client-side: faceted search with InstantSearch
// packages: react-instantsearch@7.13, @meilisearch/instant-meilisearch@0.21
import { InstantSearch, SearchBox, RefinementList, Hits, Stats, Pagination,
         SortBy, ClearRefinements, CurrentRefinements } from 'react-instantsearch';
import { instantMeiliSearch } from '@meilisearch/instant-meilisearch';

const { searchClient } = instantMeiliSearch(
  process.env.NEXT_PUBLIC_MEILISEARCH_HOST!,
  process.env.NEXT_PUBLIC_MEILISEARCH_KEY!,
  { primaryKey: 'id', keepZeroFacets: true, finitePagination: true }
);

export function TemplateGallery() {
  return (
    <InstantSearch searchClient={searchClient} indexName="content">
      {/* Filter sidebar */}
      <aside>
        <ClearRefinements />
        <CurrentRefinements />

        <RefinementList attribute="difficulty" sortBy={['name:asc']} />
        <RefinementList attribute="category" limit={10} showMore />
        <RefinementList attribute="company" limit={8} showMore searchable />
        <RefinementList attribute="components" limit={10} showMore searchable />
      </aside>

      {/* Results grid */}
      <main>
        <SearchBox placeholder="Search templates..." />
        <Stats />
        <SortBy
          items={[
            { label: 'Relevance', value: 'content' },
            { label: 'Most Popular', value: 'content:popularity:desc' },
            { label: 'Newest', value: 'content:createdAt:desc' },
          ]}
        />
        <Hits hitComponent={TemplateCard} />
        <Pagination />
      </main>
    </InstantSearch>
  );
}
```

**Mobile Faceted Search Pattern:**
Use the "tray" overlay pattern (recommended by NN/Group):
- Filters hidden behind a "Filters" button on mobile
- Full-screen overlay with all facets
- "Apply" button shows result count preview: "Show 23 results"
- Active filter count shown on the button badge

### 1.4 Search Result Ranking

**Ranking Pipeline (in order of priority):**

1. **Words** -- number of query words found in the document
2. **Typo** -- fewer typos rank higher
3. **Proximity** -- closer query words in document rank higher
4. **Attribute** -- matches in title rank above matches in description
5. **Sort** -- user-selected sort (popularity, date)
6. **Exactness** -- exact matches over prefix matches
7. **Custom: Popularity** -- higher-scored items rank higher (community upvotes, usage count)

**Personalization Layer (client-side boost):**

```typescript
// Merge server results with client-side personalization
function personalizeResults(results: SearchResult[], userContext: UserContext): SearchResult[] {
  return results.map(result => {
    let boost = 0;
    if (userContext.recentlyViewed.includes(result.id)) boost += 50;
    if (userContext.bookmarks.includes(result.id)) boost += 30;
    if (userContext.completedModules.includes(result.category)) boost -= 10; // deprioritize completed
    if (result.difficulty === userContext.currentLevel) boost += 20;
    return { ...result, personalizedScore: result.score + boost };
  }).sort((a, b) => b.personalizedScore - a.personalizedScore);
}
```

### 1.5 Search UI Design Patterns

**Global Search Bar:**
- Persistent in the top navbar: subtle `Search... (Cmd+K)` placeholder
- On click or `Cmd+K`, expands to full command palette
- Shows search icon + keyboard shortcut hint

**Search Results Layout:**
- Results grouped by content type with section headers
- Each result shows: icon (by type), title, description snippet with highlight, difficulty badge, category tag
- Highlight matching text with `<mark>` elements
- "No results" state: suggest related terms, show popular content

**Typeahead/Autocomplete:**
- Show results after 2+ characters (debounce 150ms)
- Display up to 8 results in the dropdown (2 per type max)
- "See all N results" link at bottom opens full search page

---

# PART 2: SOCIAL FEATURES

## 2.1 Public Profiles

**URL:** `architex.dev/@{username}`

**Profile Schema:**

```typescript
interface UserProfile {
  id: string;                    // cuid2
  username: string;              // unique, 3-20 chars, alphanumeric + hyphens
  displayName: string;
  avatarUrl: string | null;
  bio: string;                   // max 280 chars
  location: string | null;
  website: string | null;
  githubUsername: string | null;
  twitterHandle: string | null;
  linkedinUrl: string | null;

  // Stats (denormalized for fast reads)
  stats: {
    designsPublished: number;
    challengesCompleted: number;
    totalUpvotes: number;
    currentStreak: number;        // consecutive days active
    longestStreak: number;
    joinDate: string;
  };

  // Achievements (earned badges)
  achievements: Achievement[];

  // Privacy settings
  isPublic: boolean;
  showActivity: boolean;
  showStreak: boolean;
}

interface Achievement {
  id: string;
  name: string;                   // "First Design", "100 Day Streak", "Community Star"
  description: string;
  icon: string;                   // Lucide icon name
  earnedAt: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}
```

**Achievement System (Gamification):**

| Achievement | Trigger | Rarity |
|---|---|---|
| First Steps | Complete onboarding | Common |
| Architect | Publish first design | Common |
| Scholar | Complete first learning path | Common |
| Streak Week | 7-day streak | Uncommon |
| Template Master | Complete 25 templates | Uncommon |
| Community Star | Receive 50 upvotes on a single design | Rare |
| Algorithm Ace | Complete all 100+ algorithms | Rare |
| Streak Month | 30-day streak | Epic |
| Centurion | 100 designs published | Epic |
| Legend | 365-day streak | Legendary |

**Profile Page Sections:**
1. Header: avatar, name, bio, stats row, social links
2. Pinned Designs: 3-6 user-selected showcase designs
3. Achievement Showcase: earned badges grid
4. Activity Heatmap: GitHub-style contribution graph
5. Recent Activity: latest designs, completions, comments
6. Published Designs: paginated grid with sort/filter

## 2.2 Activity Feed

### Feed Architecture

**Approach: Hybrid Fan-Out**

For Architex's scale (target 100K users Year 1), use fan-out-on-write for most users and fan-out-on-read for power users (those with 10K+ followers, if that ever happens).

**Database Schema (PostgreSQL):**

```sql
-- Activities table (append-only event log)
CREATE TABLE activities (
  id           BIGSERIAL PRIMARY KEY,
  actor_id     UUID NOT NULL REFERENCES users(id),
  verb         TEXT NOT NULL,          -- 'published', 'completed', 'upvoted', 'commented', 'forked', 'achieved'
  object_type  TEXT NOT NULL,          -- 'design', 'challenge', 'comment', 'achievement'
  object_id    TEXT NOT NULL,          -- polymorphic reference
  target_type  TEXT,                   -- optional: 'design', 'user'
  target_id    TEXT,
  metadata     JSONB DEFAULT '{}',     -- extra data (design title, achievement name, etc.)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Feeds table (pre-computed per-user feeds via fan-out-on-write)
CREATE TABLE feed_items (
  id           BIGSERIAL PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES users(id),
  activity_id  BIGINT NOT NULL REFERENCES activities(id),
  is_read      BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_feed_user_created ON feed_items(user_id, created_at DESC);

-- Follows table
CREATE TABLE follows (
  follower_id  UUID NOT NULL REFERENCES users(id),
  following_id UUID NOT NULL REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);
CREATE INDEX idx_follows_following ON follows(following_id);
```

**Fan-Out Worker (on activity creation):**

```typescript
// When a user publishes a design, fan out to all followers' feeds
async function fanOutActivity(activity: Activity): Promise<void> {
  const followers = await db.query(
    'SELECT follower_id FROM follows WHERE following_id = $1',
    [activity.actorId]
  );

  // Batch insert into feed_items (use pg COPY for large fan-outs)
  const feedItems = followers.rows.map(f => ({
    userId: f.follower_id,
    activityId: activity.id,
    createdAt: activity.createdAt,
  }));

  // Batch insert in chunks of 1000
  for (const chunk of chunkArray(feedItems, 1000)) {
    await db.query(
      `INSERT INTO feed_items (user_id, activity_id, created_at)
       SELECT * FROM UNNEST($1::uuid[], $2::bigint[], $3::timestamptz[])`,
      [chunk.map(i => i.userId), chunk.map(i => i.activityId), chunk.map(i => i.createdAt)]
    );
  }
}
```

**Activity Verbs:**

| Verb | Example | Visibility |
|---|---|---|
| `published` | @alice published "Netflix CDN Architecture" | Public |
| `completed` | @alice completed the "Consistent Hashing" challenge | Public |
| `forked` | @alice forked @bob's "Uber Matching" design | Public |
| `upvoted` | @alice upvoted "Twitter Fanout Architecture" | Followers only |
| `commented` | @alice commented on "Rate Limiter Design" | Public |
| `achieved` | @alice earned the "Streak Month" achievement | Public |
| `streakMilestone` | @alice hit a 30-day learning streak | Public |

### Feed API

```typescript
// GET /api/feed?cursor={cursor}&limit=20
// Returns paginated feed with cursor-based pagination
interface FeedResponse {
  items: FeedItem[];
  nextCursor: string | null;
}

interface FeedItem {
  id: string;
  activity: {
    actor: { id: string; username: string; avatar: string };
    verb: string;
    object: { type: string; id: string; title: string; preview?: string };
    target?: { type: string; id: string; title: string };
    metadata: Record<string, unknown>;
    createdAt: string;
  };
  isRead: boolean;
}
```

**Self-built vs Third-Party:**

| Option | Cost | Control | Effort |
|---|---|---|---|
| Self-built (PostgreSQL + Redis) | $0 (self-hosted) | Full | 2-3 weeks |
| GetStream | $499/mo for 10K MAU | Limited | 2-3 days |
| Knock.app (notifications) | $0-250/mo | Moderate | 1 week |

**Recommendation:** Self-built for Phase 1 (Architex is open-source, cannot depend on $499/mo SaaS for core feature). Use PostgreSQL for the feed store + optional Redis cache for hot feeds.

## 2.3 Contribution Heatmap

**Library:** `@uiw/react-heat-map` (best React option)

| Library | Stars | Size | React Support | Customization |
|---|---|---|---|---|
| `@uiw/react-heat-map` | 300+ | ~12KB | Native React | Excellent (SVG, themes) |
| `react-calendar-heatmap` | 1.4K | ~8KB | Native React | Good |
| `cal-heatmap` | 2.5K | ~25KB | Vanilla (wrapper needed) | Excellent (d3-based) |

```typescript
// packages: @uiw/react-heat-map@2.3
import HeatMap from '@uiw/react-heat-map';

interface ActivityDay {
  date: string;    // 'YYYY/MM/DD' format
  count: number;   // activities that day (designs, completions, challenges)
}

function ContributionHeatmap({ data }: { data: ActivityDay[] }) {
  return (
    <HeatMap
      value={data}
      startDate={new Date(new Date().setFullYear(new Date().getFullYear() - 1))}
      width={750}
      rectSize={11}
      space={3}
      legendCellSize={0}
      style={{ color: '#e2e4e9' }}
      panelColors={{
        0: 'var(--color-surface)',            // no activity
        2: 'hsl(var(--primary) / 0.2)',       // low
        4: 'hsl(var(--primary) / 0.4)',       // medium
        8: 'hsl(var(--primary) / 0.7)',       // high
        12: 'hsl(var(--primary))',             // max
      }}
      rectRender={(props, data) => (
        <Tooltip content={`${data.count || 0} activities on ${data.date}`}>
          <rect {...props} rx={2} />
        </Tooltip>
      )}
    />
  );
}
```

**Activity Tracking (what counts as a "contribution"):**
- Opened the platform and engaged for 5+ minutes
- Completed a simulation step-through
- Published or updated a design
- Completed a challenge
- Made a comment or upvote
- Completed a learning module section

**Storage:** Aggregate daily counts in `user_daily_activity` table:

```sql
CREATE TABLE user_daily_activity (
  user_id     UUID NOT NULL REFERENCES users(id),
  activity_date DATE NOT NULL,
  count       INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, activity_date)
);
-- Upsert on each qualifying activity
-- INSERT ... ON CONFLICT (user_id, activity_date) DO UPDATE SET count = count + 1
```

## 2.4 Social Sharing with Auto-Generated Preview Images

**Approach: Next.js Dynamic OG Image Generation**

Use Next.js built-in `ImageResponse` API (powered by Satori + resvg-js) to generate OG images at the edge.

```typescript
// File: app/templates/[slug]/opengraph-image.tsx
// packages: next@16 (built-in og image generation)
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Architex System Design Template';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage({ params }: { params: { slug: string } }) {
  const template = await getTemplate(params.slug);
  const geistFont = await fetch(
    new URL('../../assets/fonts/Geist-SemiBold.ttf', import.meta.url)
  ).then(r => r.arrayBuffer());

  return new ImageResponse(
    (
      <div style={{
        display: 'flex', flexDirection: 'column', width: '100%', height: '100%',
        background: 'linear-gradient(135deg, #0D0E12 0%, #1a1b2e 100%)',
        padding: '60px',
      }}>
        {/* Architex logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <svg width="32" height="32">/* logo SVG */</svg>
          <span style={{ color: '#818CF8', fontSize: '24px' }}>Architex</span>
        </div>

        {/* Template title */}
        <h1 style={{ color: '#F9FAFB', fontSize: '48px', marginTop: '40px' }}>
          {template.title}
        </h1>

        {/* Difficulty + Category badges */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
          <span style={{ background: '#818CF8', borderRadius: '16px', padding: '6px 16px',
                         color: 'white', fontSize: '18px' }}>
            {template.difficulty}
          </span>
          <span style={{ background: '#1F2937', borderRadius: '16px', padding: '6px 16px',
                         color: '#9CA3AF', fontSize: '18px', border: '1px solid #374151' }}>
            {template.category}
          </span>
        </div>

        {/* Component count */}
        <p style={{ color: '#9CA3AF', fontSize: '20px', marginTop: 'auto' }}>
          {template.componentCount} components | Interactive System Design Simulation
        </p>
      </div>
    ),
    { ...size, fonts: [{ name: 'Geist', data: geistFont, style: 'normal', weight: 600 }] }
  );
}
```

**Share Links:**

```typescript
// Share to Twitter/X
const twitterShareUrl = (template: Template) =>
  `https://x.com/intent/tweet?` + new URLSearchParams({
    text: `Check out this ${template.title} system design on Architex! Interactive simulation with ${template.componentCount} components.`,
    url: `https://architex.dev/templates/${template.slug}`,
    hashtags: 'SystemDesign,Architex',
  }).toString();

// Share to LinkedIn
const linkedinShareUrl = (template: Template) =>
  `https://www.linkedin.com/sharing/share-offsite/?` + new URLSearchParams({
    url: `https://architex.dev/templates/${template.slug}`,
  }).toString();

// Copy link to clipboard
const copyShareLink = async (template: Template) => {
  await navigator.clipboard.writeText(`https://architex.dev/templates/${template.slug}`);
};
```

**Image Dimensions:**
- OG Image: 1200x630px (optimal for all platforms)
- Twitter card: uses same image, cropped to 1200x600 on some clients
- LinkedIn: uses same image at 1200x627

## 2.5 Community Gallery with Upvotes and Comments

### Upvote System

**Design: Single-vote (like GitHub Stars, not Reddit up/down)**

Rationale: Educational content benefits from positive signals only. Downvotes create toxicity that harms learning communities.

```sql
-- Upvotes table (single upvote per user per design)
CREATE TABLE upvotes (
  user_id    UUID NOT NULL REFERENCES users(id),
  design_id  UUID NOT NULL REFERENCES designs(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, design_id)
);

-- Denormalized count on designs table (updated via trigger or application code)
-- designs.upvote_count INT DEFAULT 0

-- Toggle upvote (idempotent)
-- INSERT INTO upvotes ... ON CONFLICT DO NOTHING / DELETE FROM upvotes WHERE ...
```

**Optimistic UI Update:**

```typescript
function useUpvote(designId: string) {
  const [isUpvoted, setIsUpvoted] = useState(false);
  const [count, setCount] = useState(0);

  const toggleUpvote = async () => {
    // Optimistic update
    setIsUpvoted(prev => !prev);
    setCount(prev => isUpvoted ? prev - 1 : prev + 1);

    try {
      await fetch(`/api/designs/${designId}/upvote`, { method: 'POST' });
    } catch {
      // Rollback on failure
      setIsUpvoted(prev => !prev);
      setCount(prev => isUpvoted ? prev + 1 : prev - 1);
    }
  };

  return { isUpvoted, count, toggleUpvote };
}
```

### Comment System

**Design: Threaded comments (one level of nesting)**

Two levels max (top-level + replies). Deeper nesting creates poor UX and is unnecessary for educational discussion.

```sql
CREATE TABLE comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id   UUID NOT NULL REFERENCES designs(id),
  author_id   UUID NOT NULL REFERENCES users(id),
  parent_id   UUID REFERENCES comments(id),    -- NULL for top-level, comment_id for replies
  body        TEXT NOT NULL,                     -- max 2000 chars, Markdown supported
  upvote_count INT DEFAULT 0,
  is_edited   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_comments_design ON comments(design_id, created_at DESC);
CREATE INDEX idx_comments_parent ON comments(parent_id);
```

**Comment Rendering (flat storage, nested display):**

```typescript
// Fetch flat, build tree client-side
function buildCommentTree(comments: Comment[]): CommentNode[] {
  const map = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  comments.forEach(c => map.set(c.id, { ...c, replies: [] }));
  comments.forEach(c => {
    const node = map.get(c.id)!;
    if (c.parentId) {
      map.get(c.parentId)?.replies.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}
```

### Gallery Layout

**Grid Layout:**
- Responsive card grid: 1 column (mobile), 2 columns (tablet), 3-4 columns (desktop)
- Each card shows: diagram thumbnail (auto-generated via `html-to-image`), title, author avatar + name, upvote count, comment count, difficulty badge
- Masonry layout optional (via CSS `columns` or `react-masonry-css`)

**Sort/Filter Options:**
- Trending (upvotes in last 7 days, weighted by recency)
- Most Popular (all-time upvotes)
- Newest
- Filter by category, difficulty, component type

**Trending Algorithm:**

```typescript
// Wilson score confidence interval (Reddit-style, adapted)
function trendingScore(upvotes: number, ageHours: number): number {
  // Hacker News ranking: score / (age + 2)^gravity
  const gravity = 1.8;
  return upvotes / Math.pow(ageHours + 2, gravity);
}
```

## 2.6 Fork & Remix Public Designs

**Workflow (Git-inspired):**

1. User clicks "Fork" on any public design
2. System creates a deep copy of the design JSON (nodes, edges, metadata)
3. Fork is saved to user's workspace with `forkedFrom: { designId, authorId, authorName }`
4. User can modify freely -- changes do not affect the original
5. "Forked from @bob/twitter-fanout" attribution link shown on the fork
6. User can publish their fork as a new public design

```sql
CREATE TABLE designs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id       UUID NOT NULL REFERENCES users(id),
  title           TEXT NOT NULL,
  description     TEXT,
  slug            TEXT NOT NULL,                -- URL-friendly title
  content         JSONB NOT NULL,               -- { nodes, edges, viewport, metadata }
  is_public       BOOLEAN DEFAULT FALSE,
  forked_from_id  UUID REFERENCES designs(id),  -- NULL if original
  fork_count      INT DEFAULT 0,
  upvote_count    INT DEFAULT 0,
  comment_count   INT DEFAULT 0,
  view_count      INT DEFAULT 0,
  difficulty      TEXT,
  category        TEXT,
  tags            TEXT[],
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_designs_author_slug ON designs(author_id, slug);
CREATE INDEX idx_designs_public ON designs(is_public, upvote_count DESC) WHERE is_public = TRUE;
CREATE INDEX idx_designs_forked ON designs(forked_from_id) WHERE forked_from_id IS NOT NULL;
```

**Fork API:**

```typescript
// POST /api/designs/:id/fork
async function forkDesign(originalId: string, userId: string): Promise<Design> {
  const original = await db.designs.findById(originalId);
  if (!original.isPublic) throw new ForbiddenError();

  const fork = await db.designs.create({
    authorId: userId,
    title: `${original.title} (fork)`,
    description: original.description,
    slug: generateUniqueSlug(original.slug, userId),
    content: structuredClone(original.content),  // deep copy
    isPublic: false,  // forks start as private
    forkedFromId: original.id,
    difficulty: original.difficulty,
    category: original.category,
    tags: original.tags,
  });

  // Increment fork count on original
  await db.designs.increment(originalId, 'fork_count');

  return fork;
}
```

## 2.7 Follow System

```sql
-- Already defined above in follows table
-- Additional: follower/following counts denormalized on users table

-- API endpoints:
-- POST   /api/users/:id/follow       -- follow user
-- DELETE /api/users/:id/follow       -- unfollow user
-- GET    /api/users/:id/followers    -- paginated followers list
-- GET    /api/users/:id/following    -- paginated following list
```

**Follow Recommendations (who to follow):**
- Users who authored templates the user has viewed
- Users who completed similar challenges
- Most-followed users in the same difficulty tier
- Users active in the same categories

---

# PART 3: THIRD-PARTY INTEGRATIONS

## 3.1 VS Code Extension

**Extension Name:** `architex-vscode`
**Approach:** Custom Editor + Webview Panel

### Architecture

```
VS Code Extension Host
  ├── CustomEditorProvider (for .architex files)
  │   └── Opens Architex webview with full editor
  ├── WebviewPanel (sidebar diagram preview)
  │   └── Read-only preview of current design
  ├── TreeDataProvider (sidebar explorer)
  │   └── Lists local .architex files + cloud designs
  └── Commands
      ├── architex.open          -- Open design in editor
      ├── architex.preview       -- Preview design in sidebar
      ├── architex.newDesign     -- Create new design
      ├── architex.export        -- Export to Mermaid/PlantUML/PNG
      ├── architex.sync          -- Sync with cloud account
      └── architex.insertDiagram -- Insert diagram reference in code
```

### Implementation

**Custom Editor for `.architex` files:**

```typescript
// packages: vscode (Extension API)
import * as vscode from 'vscode';

class ArchtexEditorProvider implements vscode.CustomTextEditorProvider {
  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.window.registerCustomEditorProvider(
      'architex.editor',
      new ArchtexEditorProvider(context),
      { webviewOptions: { retainContextWhenHidden: true } }
    );
  }

  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel
  ): Promise<void> {
    webviewPanel.webview.options = { enableScripts: true };
    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

    // Bidirectional sync: document <-> webview
    const updateWebview = () => {
      webviewPanel.webview.postMessage({
        type: 'update',
        content: document.getText(),
      });
    };

    // Listen for changes from the webview (user edits the diagram)
    webviewPanel.webview.onDidReceiveMessage(message => {
      if (message.type === 'edit') {
        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), message.content);
        vscode.workspace.applyEdit(edit);
      }
    });

    // Listen for changes to the document (external edits)
    vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document.uri.toString() === document.uri.toString()) {
        updateWebview();
      }
    });

    updateWebview();
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    // Load the Architex editor as a bundled SPA inside the webview
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview.js')
    );
    return `<!DOCTYPE html>
      <html>
        <head><meta charset="UTF-8"></head>
        <body>
          <div id="architex-root"></div>
          <script src="${scriptUri}"></script>
        </body>
      </html>`;
  }
}
```

**File Format: `.architex` (JSON)**

```json
{
  "version": "1.0",
  "type": "system-design",
  "title": "My Architecture",
  "nodes": [/* React Flow nodes */],
  "edges": [/* React Flow edges */],
  "viewport": { "x": 0, "y": 0, "zoom": 1 },
  "metadata": {
    "difficulty": "medium",
    "category": "e-commerce",
    "components": ["load-balancer", "cache", "database"]
  }
}
```

**Key Technologies:**
- `@vscode/webview-ui-toolkit` is deprecated (January 2025) -- use plain HTML/CSS or bundle shadcn components
- Bundle the Architex editor as a standalone React app with Vite, output to `dist/webview.js`
- Use `vscode.workspace.fs` for file operations
- Use VS Code's built-in `CustomTextEditorProvider` for undo/redo integration

**VS Code Marketplace Listing:**
- Category: Visualization
- Keywords: system design, architecture, diagram, UML
- Icon: Architex logo

## 3.2 Chrome Extension

**Extension Name:** "Architex Clipper"
**Purpose:** Save architecture diagrams from any website into Architex library

### Manifest V3 Configuration

```json
{
  "manifest_version": 3,
  "name": "Architex Clipper",
  "version": "1.0.0",
  "description": "Save architecture diagrams and system design resources to Architex",
  "permissions": ["activeTab", "storage", "contextMenus"],
  "host_permissions": ["https://architex.dev/*"],
  "action": {
    "default_popup": "popup.html",
    "default_icon": { "16": "icons/16.png", "48": "icons/48.png", "128": "icons/128.png" }
  },
  "background": { "service_worker": "background.js" },
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content.js"],
    "css": ["content.css"]
  }],
  "icons": { "16": "icons/16.png", "48": "icons/48.png", "128": "icons/128.png" }
}
```

### Features

**1. Clip Diagram Image:**
- Right-click any image -> "Save to Architex"
- Extension captures image URL + page title + page URL
- Saves to user's Architex library via API

**2. Clip Page as Reference:**
- Click extension icon -> "Save this page"
- Extracts: title, URL, selected text, meta description
- Tags auto-suggested based on page content

**3. Highlight & Annotate:**
- Select text on any page -> right-click -> "Highlight in Architex"
- Creates a reference card in Architex with the highlighted text

**4. Quick Capture Popup:**

```typescript
// popup.tsx -- React app bundled for the popup
function ClipperPopup() {
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [collection, setCollection] = useState('inbox');

  useEffect(() => {
    // Get current tab info via chrome.tabs API
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      setPageInfo({ title: tab.title, url: tab.url, favicon: tab.favIconUrl });
    });
  }, []);

  const saveToArchtex = async () => {
    const token = await chrome.storage.sync.get('authToken');
    await fetch('https://architex.dev/api/clips', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token.authToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...pageInfo, tags, collection }),
    });
  };
}
```

**Authentication:**
- User logs into Architex web -> copies API token -> pastes into extension settings
- Or: OAuth redirect flow to `architex.dev/auth/extension`
- Token stored in `chrome.storage.sync` (syncs across Chrome instances)

**Build Tooling:**
- Vite + React + TypeScript for popup and options pages
- `@crxjs/vite-plugin` for hot reload during development
- Bundle size target: < 200KB total

## 3.3 GitHub Action

**Action Name:** `architex/validate-design`
**Purpose:** Validate `.architex` files in CI, ensuring design documents are valid and meet standards.

### action.yml

```yaml
name: 'Architex Design Validator'
description: 'Validate system design files in your repository'
inputs:
  path:
    description: 'Path to .architex files (glob pattern)'
    required: false
    default: '**/*.architex'
  api-key:
    description: 'Architex API key for AI validation (optional)'
    required: false
  rules:
    description: 'Validation rules to enforce'
    required: false
    default: 'schema,components,connections'
  fail-on:
    description: 'When to fail: error, warning, or info'
    required: false
    default: 'error'
runs:
  using: 'node20'
  main: 'dist/index.js'
```

### Validation Rules

| Rule | Description |
|---|---|
| `schema` | Valid .architex JSON structure |
| `components` | All components are recognized types |
| `connections` | All edges connect valid node handles |
| `single-point-of-failure` | Warn if any component has no redundancy |
| `missing-cache` | Warn if database has no cache layer |
| `missing-load-balancer` | Warn if multi-server setup has no LB |
| `naming-conventions` | Components follow naming standards |
| `ai-review` | AI-powered architecture review (requires API key) |

### Usage in CI

```yaml
# .github/workflows/validate-designs.yml
name: Validate System Designs
on:
  pull_request:
    paths: ['**/*.architex']

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: architex/validate-design@v1
        with:
          path: 'docs/designs/**/*.architex'
          rules: 'schema,components,connections,single-point-of-failure'
          fail-on: 'warning'
          api-key: ${{ secrets.ARCHITEX_API_KEY }}
```

### PR Comment Output

The action posts a PR comment with validation results:

```markdown
## Architex Design Validation

**docs/designs/payment-service.architex** -- 2 warnings, 0 errors

| Severity | Rule | Message |
|---|---|---|
| warn | single-point-of-failure | Database `payments-db` has no replica |
| warn | missing-cache | Consider adding cache between `api-gateway` and `payments-db` |
| pass | schema | Valid .architex format |
| pass | components | All 8 components recognized |
| pass | connections | All 12 connections valid |
```

### Implementation

```typescript
// GitHub Action main entry point
import * as core from '@actions/core';
import * as github from '@actions/github';
import { glob } from 'glob';

async function run() {
  const path = core.getInput('path');
  const rules = core.getInput('rules').split(',');
  const failOn = core.getInput('fail-on');

  const files = await glob(path);
  const results: ValidationResult[] = [];

  for (const file of files) {
    const content = JSON.parse(await fs.readFile(file, 'utf-8'));
    const fileResults = await validateDesign(content, rules);
    results.push({ file, results: fileResults });
  }

  // Post PR comment with results
  const octokit = github.getOctokit(core.getInput('github-token'));
  await octokit.rest.issues.createComment({
    ...github.context.repo,
    issue_number: github.context.payload.pull_request!.number,
    body: formatResultsAsMarkdown(results),
  });

  // Fail if violations exceed threshold
  const hasFailures = results.some(r =>
    r.results.some(v => severityMeetsThreshold(v.severity, failOn))
  );
  if (hasFailures) core.setFailed('Design validation failed');
}
```

## 3.4 Slack Bot

**Bot Name:** "Architex Bot"
**Framework:** Slack Bolt for JavaScript (`@slack/bolt@4`)

### Features

| Feature | Trigger | Response |
|---|---|---|
| Daily Challenge | Scheduled (configurable, default 9am) | Posts system design challenge of the day |
| Streak Reminder | Scheduled (evening, only if user hasn't been active) | DM: "Your 15-day streak is at risk!" |
| Design Share | Slash command `/architex share <url>` | Unfurls Architex design as rich card |
| Quick Search | Slash command `/architex search <query>` | Returns top 3 matching templates |
| Leaderboard | Slash command `/architex leaderboard` | Shows team's weekly leaderboard |
| Achievement Alert | Webhook (when user earns achievement) | Posts in channel: "@alice earned Streak Month!" |

### Implementation

```typescript
// packages: @slack/bolt@4.1, node-cron@3.0
import { App, LogLevel } from '@slack/bolt';
import cron from 'node-cron';

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,   // Simpler than HTTP for bots
  logLevel: LogLevel.INFO,
});

// Daily challenge at 9am (configurable per workspace)
cron.schedule('0 9 * * *', async () => {
  const challenge = await getRandomChallenge();
  await app.client.chat.postMessage({
    channel: process.env.SLACK_CHANNEL_ID!,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:brain: *Daily System Design Challenge*\n\n*${challenge.title}*\n${challenge.description}`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Start Challenge' },
            url: `https://architex.dev/challenges/${challenge.slug}`,
            style: 'primary',
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: 'View Hint' },
            action_id: 'view_hint',
            value: challenge.id,
          },
        ],
      },
    ],
  });
});

// Slash command: /architex search <query>
app.command('/architex', async ({ command, ack, respond }) => {
  await ack();
  const [action, ...args] = command.text.split(' ');

  if (action === 'search') {
    const query = args.join(' ');
    const results = await searchArchitex(query);
    await respond({
      blocks: results.slice(0, 3).map(r => ({
        type: 'section',
        text: { type: 'mrkdwn', text: `*<${r.url}|${r.title}>*\n${r.description}` },
        accessory: {
          type: 'button',
          text: { type: 'plain_text', text: 'Open' },
          url: r.url,
        },
      })),
    });
  }

  if (action === 'share') {
    const url = args[0];
    const design = await getDesignFromUrl(url);
    await respond({
      blocks: buildDesignUnfurlBlocks(design),
    });
  }
});

// Streak reminder DMs (evening, only for users at risk)
cron.schedule('0 20 * * *', async () => {
  const atRiskUsers = await getAtRiskStreakUsers();  // users active yesterday but not today
  for (const user of atRiskUsers) {
    if (!user.slackUserId) continue;
    await app.client.chat.postMessage({
      channel: user.slackUserId,  // DM
      text: `:fire: Your ${user.currentStreak}-day streak is at risk! Complete a quick challenge to keep it going.`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `:fire: *Streak Alert!* Your *${user.currentStreak}-day* learning streak is at risk!\nComplete a quick challenge to keep it going.`,
          },
        },
        {
          type: 'actions',
          elements: [{
            type: 'button',
            text: { type: 'plain_text', text: 'Quick 5-min Challenge' },
            url: 'https://architex.dev/challenges/random?difficulty=easy',
            style: 'primary',
          }],
        },
      ],
    });
  }
});
```

**Slack App Setup:**
- OAuth scopes: `chat:write`, `commands`, `im:write`, `users:read`
- Socket Mode for simpler deployment (no public HTTP endpoint needed)
- Deploy as: standalone Node.js process, or as a serverless function triggered by cron

## 3.5 Notion / Obsidian Embed

### Notion Integration

**Approach: oEmbed + iframe embed**

Architex designs can be embedded in Notion via the `/embed` block.

**Requirements:**
1. Every public design gets an embeddable URL: `https://architex.dev/embed/{designId}`
2. The embed page renders a read-only, interactive diagram (no sidebar, no panels)
3. Register with Iframely for automatic Notion embed support

**Embed Page Implementation:**

```typescript
// app/embed/[id]/page.tsx
// Minimal Architex viewer: just the canvas, no chrome
export default function EmbedPage({ params }: { params: { id: string } }) {
  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <ArchtexViewer
        designId={params.id}
        mode="embed"
        showControls={false}
        showMinimap={true}
        interactive={true}     // pan/zoom allowed
        editable={false}
        watermark={true}       // "Made with Architex" link
      />
    </div>
  );
}
```

**oEmbed Endpoint:**

```typescript
// app/api/oembed/route.ts
// Standard oEmbed endpoint for rich embeds
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const maxwidth = parseInt(searchParams.get('maxwidth') || '800');
  const maxheight = parseInt(searchParams.get('maxheight') || '600');

  const designId = extractDesignId(url);
  const design = await getDesign(designId);

  return Response.json({
    version: '1.0',
    type: 'rich',
    provider_name: 'Architex',
    provider_url: 'https://architex.dev',
    title: design.title,
    author_name: design.author.displayName,
    author_url: `https://architex.dev/@${design.author.username}`,
    thumbnail_url: `https://architex.dev/api/og/${design.id}`,
    thumbnail_width: 1200,
    thumbnail_height: 630,
    width: Math.min(maxwidth, 800),
    height: Math.min(maxheight, 600),
    html: `<iframe src="https://architex.dev/embed/${design.id}" width="${maxwidth}" height="${maxheight}" frameborder="0" allowfullscreen></iframe>`,
  });
}
```

**Notion Embed Steps (user-facing):**
1. Copy the public design URL from Architex
2. In Notion, type `/embed`
3. Paste the URL
4. Interactive diagram appears inline

### Obsidian Plugin

**Plugin Name:** `obsidian-architex`
**Purpose:** Embed and reference Architex designs directly in Obsidian notes

**Features:**
1. Embed command: renders Architex diagrams inline in notes
2. Link auto-preview: hovering an Architex URL shows a diagram preview
3. Sidebar panel: browse your Architex designs
4. Export to Architex: send Mermaid code blocks to Architex for interactive viewing

```typescript
// main.ts -- Obsidian plugin entry point
// packages: obsidian (Obsidian API types)
import { Plugin, MarkdownPostProcessorContext, requestUrl } from 'obsidian';

export default class ArchtexPlugin extends Plugin {
  async onload() {
    // Register code block processor for ```architex blocks
    this.registerMarkdownCodeBlockProcessor('architex', async (source, el, ctx) => {
      const designId = source.trim();
      const container = el.createDiv({ cls: 'architex-embed' });

      // Render an iframe with the Architex embed
      const iframe = container.createEl('iframe', {
        attr: {
          src: `https://architex.dev/embed/${designId}`,
          width: '100%',
          height: '400px',
          frameBorder: '0',
          loading: 'lazy',
        },
      });

      // Add "Open in Architex" link below
      container.createEl('a', {
        text: 'Open in Architex',
        href: `https://architex.dev/designs/${designId}`,
        cls: 'architex-link',
      });
    });

    // Command: Insert Architex design
    this.addCommand({
      id: 'insert-architex-design',
      name: 'Insert Architex Design',
      callback: async () => {
        // Show design picker modal
        const modal = new ArchtexDesignPickerModal(this.app, this);
        modal.open();
      },
    });

    // Register view for sidebar panel
    this.registerView('architex-panel', (leaf) => new ArchtexSidebarView(leaf, this));

    // Add ribbon icon
    this.addRibbonIcon('layout-dashboard', 'Architex', () => {
      this.activateView('architex-panel');
    });
  }
}
```

**Obsidian Usage:**

```markdown
## My System Design Notes

Here's the Twitter fanout architecture I studied:

```architex
twitter-fanout-abc123
```

Key observations:
- Fan-out on write for users with < 10K followers
- Fan-out on read for celebrity accounts
```

## 3.6 Integration Priority Matrix

| Integration | Effort | Impact | Priority | Phase |
|---|---|---|---|---|
| Command Palette (Cmd+K) | Low (already specced) | Critical | P0 | MVP |
| Client-side search (FlexSearch) | Low (2-3 days) | High | P0 | MVP |
| Notion/Obsidian embed (oEmbed) | Low (1-2 days) | Medium | P1 | Phase 1 |
| OG Image generation | Low (1-2 days) | High | P1 | Phase 1 |
| Share to Twitter/LinkedIn | Low (< 1 day) | Medium | P1 | Phase 1 |
| Meilisearch (cloud search) | Medium (1 week) | High | P1 | Phase 2 |
| Community gallery + upvotes | Medium (2 weeks) | High | P1 | Phase 2 |
| Public profiles | Medium (1 week) | High | P1 | Phase 2 |
| Contribution heatmap | Low (2-3 days) | Medium | P2 | Phase 2 |
| Fork/remix | Medium (1 week) | High | P2 | Phase 2 |
| Activity feed | Medium (2-3 weeks) | Medium | P2 | Phase 2 |
| Comment system | Medium (1-2 weeks) | Medium | P2 | Phase 2 |
| Follow system | Low (3-5 days) | Medium | P2 | Phase 2 |
| Chrome extension | Medium (2 weeks) | Medium | P3 | Phase 3 |
| VS Code extension | High (3-4 weeks) | High | P3 | Phase 3 |
| Slack bot | Medium (1-2 weeks) | Medium | P3 | Phase 3 |
| GitHub Action | Medium (1-2 weeks) | Medium | P3 | Phase 3 |
| Obsidian plugin | Medium (1-2 weeks) | Low | P4 | Phase 4 |

---

# PART 4: COMPLETE PACKAGE LIST

## Search Packages

| Package | Version | Size | Purpose |
|---|---|---|---|
| `flexsearch` | ^0.7.43 | ~6KB gzip | Client-side full-text search (offline/PWA) |
| `cmdk` | ^1.1 | ~7KB gzip | Command palette (already in MEGA_PROMPT) |
| `meilisearch` | ^0.45 | ~15KB | Server-side Meilisearch client |
| `@meilisearch/instant-meilisearch` | ^0.21 | ~8KB | React InstantSearch adapter |
| `react-instantsearch` | ^7.13 | ~45KB | Search UI components (facets, hits, pagination) |

## Social Feature Packages

| Package | Version | Size | Purpose |
|---|---|---|---|
| `@uiw/react-heat-map` | ^2.3 | ~12KB | GitHub-style contribution heatmap |
| `next/og` (built-in) | -- | 0 | Dynamic OG image generation |
| `react-masonry-css` | ^1.0 | ~2KB | Masonry grid for community gallery |
| `react-markdown` | ^9.0 | ~15KB | Render markdown in comments |
| `react-timeago` | ^7.2 | ~3KB | Relative timestamps ("2 hours ago") |

## Integration Packages

| Package | Version | Purpose |
|---|---|---|
| `@slack/bolt` | ^4.1 | Slack bot framework |
| `node-cron` | ^3.0 | Scheduled tasks (daily challenges, streak reminders) |
| `@actions/core` | ^1.11 | GitHub Actions toolkit |
| `@actions/github` | ^6.0 | GitHub API for PR comments |
| `@crxjs/vite-plugin` | ^2.0 | Chrome extension dev tooling |
| `obsidian` | (types only) | Obsidian plugin API types |

---

# PART 5: DATABASE SCHEMA SUMMARY

All social features use PostgreSQL (same database as the rest of Architex cloud):

```sql
-- Core social tables (add to existing schema)

-- Users table (extend existing)
ALTER TABLE users ADD COLUMN follower_count INT DEFAULT 0;
ALTER TABLE users ADD COLUMN following_count INT DEFAULT 0;
ALTER TABLE users ADD COLUMN design_count INT DEFAULT 0;
ALTER TABLE users ADD COLUMN total_upvotes INT DEFAULT 0;
ALTER TABLE users ADD COLUMN current_streak INT DEFAULT 0;
ALTER TABLE users ADD COLUMN longest_streak INT DEFAULT 0;

-- Follows
CREATE TABLE follows (
  follower_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Designs (community gallery)
CREATE TABLE designs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  slug            TEXT NOT NULL,
  content         JSONB NOT NULL,
  thumbnail_url   TEXT,
  is_public       BOOLEAN DEFAULT FALSE,
  forked_from_id  UUID REFERENCES designs(id) ON DELETE SET NULL,
  fork_count      INT DEFAULT 0,
  upvote_count    INT DEFAULT 0,
  comment_count   INT DEFAULT 0,
  view_count      INT DEFAULT 0,
  difficulty      TEXT CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
  category        TEXT,
  tags            TEXT[],
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (author_id, slug)
);

-- Upvotes
CREATE TABLE upvotes (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  design_id  UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, design_id)
);

-- Comments (threaded, one level of nesting)
CREATE TABLE comments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id    UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
  author_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id    UUID REFERENCES comments(id) ON DELETE CASCADE,
  body         TEXT NOT NULL CHECK (length(body) <= 2000),
  upvote_count INT DEFAULT 0,
  is_edited    BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activities (event log)
CREATE TABLE activities (
  id           BIGSERIAL PRIMARY KEY,
  actor_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  verb         TEXT NOT NULL,
  object_type  TEXT NOT NULL,
  object_id    TEXT NOT NULL,
  target_type  TEXT,
  target_id    TEXT,
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Feed items (fan-out-on-write)
CREATE TABLE feed_items (
  id           BIGSERIAL PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_id  BIGINT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  is_read      BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Daily activity (for heatmap)
CREATE TABLE user_daily_activity (
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  count         INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, activity_date)
);

-- Achievements
CREATE TABLE user_achievements (
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  earned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

-- Saved clips (Chrome extension)
CREATE TABLE clips (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  url         TEXT,
  image_url   TEXT,
  excerpt     TEXT,
  tags        TEXT[],
  collection  TEXT DEFAULT 'inbox',
  source      TEXT DEFAULT 'web',    -- 'web', 'chrome-extension', 'vscode', 'slack'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_designs_public_popular ON designs(upvote_count DESC) WHERE is_public = TRUE;
CREATE INDEX idx_designs_public_recent ON designs(created_at DESC) WHERE is_public = TRUE;
CREATE INDEX idx_designs_author ON designs(author_id, created_at DESC);
CREATE INDEX idx_designs_category ON designs(category) WHERE is_public = TRUE;
CREATE INDEX idx_designs_forked ON designs(forked_from_id) WHERE forked_from_id IS NOT NULL;
CREATE INDEX idx_comments_design ON comments(design_id, created_at DESC);
CREATE INDEX idx_comments_parent ON comments(parent_id);
CREATE INDEX idx_activities_actor ON activities(actor_id, created_at DESC);
CREATE INDEX idx_feed_user ON feed_items(user_id, created_at DESC);
CREATE INDEX idx_follows_following ON follows(following_id);
CREATE INDEX idx_clips_user ON clips(user_id, created_at DESC);
CREATE INDEX idx_daily_activity ON user_daily_activity(user_id, activity_date DESC);
```

---

## Sources

- [Algolia vs Typesense vs Meilisearch Comparison](https://www.meilisearch.com/blog/algolia-vs-typesense)
- [Typesense vs Algolia vs Elasticsearch vs Meilisearch](https://typesense.org/typesense-vs-algolia-vs-elasticsearch-vs-meilisearch/)
- [Meilisearch vs Typesense vs Algolia Comparison](https://blog.elest.io/meilisearch-vs-typesense-vs-algolia-which-search-engine-fits-your-stack/)
- [JavaScript Search Libraries Comparison (npm-compare)](https://npm-compare.com/elasticlunr,flexsearch,fuse.js,minisearch)
- [FlexSearch vs Fuse.js vs Lunr Trends](https://npmtrends.com/flexsearch-vs-fuse.js-vs-lunr)
- [cmdk - Fast Command Menu React Component](https://github.com/dip/cmdk)
- [shadcn/ui Command Component](https://www.shadcn.io/ui/command)
- [kbar - Portable Cmd+K Interface](https://github.com/timc1/kbar)
- [Faceted Search Best Practices (Algolia)](https://www.algolia.com/blog/ux/faceted-search-and-navigation)
- [Faceted Navigation Design Pattern (A List Apart)](https://alistapart.com/article/design-patterns-faceted-navigation/)
- [Mobile Faceted Search Tray Pattern (NN/g)](https://www.nngroup.com/articles/mobile-faceted-search/)
- [Unified Search Platform on AWS OpenSearch](https://aws.amazon.com/blogs/publicsector/implementing-a-unified-search-platform-for-educational-content-on-amazon-opensearch-service/)
- [Federated Search Types (Algolia)](https://www.algolia.com/blog/product/federated-search-types)
- [Building Search Bar in Next.js with Typesense](https://typesense.org/docs/guide/next-js-search-bar.html)
- [Meilisearch React Integration Guide](https://www.meilisearch.com/with/react)
- [React InstantSearch with Meilisearch](https://www.meilisearch.com/docs/guides/front_end/react_instantsearch)
- [Social Learning Platforms 2026 Features Guide](https://www.educate-me.co/blog/social-learning-platforms)
- [Activity Feed APIs and Stream SDKs](https://www.contus.com/blog/best-activity-feed-apis-sdks/)
- [GetStream React Activity Feed SDK](https://github.com/GetStream/react-activity-feed)
- [@uiw/react-heat-map (GitHub-style Heatmap)](https://github.com/uiwjs/react-heat-map)
- [react-calendar-heatmap](https://github.com/kevinsqi/react-calendar-heatmap)
- [Dynamic OG Image Generation in Next.js](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image)
- [Next.js OG Image Generation Guide](https://www.buildwithmatija.com/blog/complete-guide-dynamic-og-image-generation-for-next-js-15)
- [Upvote System with React and Socket.io](https://novu.co/blog/creating-an-upvote-system-with-react-and-socket-io)
- [Facebook Newsfeed Fan-Out Design](https://corgicorporation.medium.com/baseline-system-design-facebook-newsfeed-and-fanout-e95311d52f65)
- [Scalable News Feed System Design](https://blog.algomaster.io/p/designing-a-scalable-news-feed-system)
- [VS Code Webview API Documentation](https://code.visualstudio.com/api/extension-guides/webview)
- [VS Code Custom Editor API](https://code.visualstudio.com/api/extension-guides/custom-editors)
- [VS Code Webview UI Toolkit](https://github.com/microsoft/vscode-webview-ui-toolkit)
- [Chrome Extension Manifest V3 Guide](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)
- [Slack Bolt SDK](https://api.slack.com/bolt)
- [Slack Scheduled Messages API](https://api.slack.com/messaging/scheduling)
- [GitHub Actions CI Documentation](https://docs.github.com/en/actions/get-started/continuous-integration)
- [Building CI Checks with GitHub Apps](https://docs.github.com/en/apps/creating-github-apps/writing-code-for-a-github-app/building-ci-checks-with-a-github-app)
- [Notion Embed Documentation](https://www.notion.com/help/embed-and-connect-other-apps)
- [Obsidian Plugin API](https://github.com/obsidianmd/obsidian-api)
- [Obsidian Developer Documentation](https://docs.obsidian.md/)
