# PHASE 7: COLLABORATION & COMMUNITY

> **Goal:** Build real-time collaboration with live cursors and presence, shareable links with encryption, a community gallery with upvotes/comments/forks, full email system, notification center, and social sharing. Transform Architex from a solo tool into a social platform.

---

## WHAT YOU ARE BUILDING

This phase adds multiplayer to Architex. Users collaborate on diagrams in real-time (like Figma), share designs via encrypted URLs, discover and fork community designs, receive smart notifications, and get personalized email sequences. The CRDT-based collaboration ensures offline-first editing with seamless merge on reconnect.

---

## 1. YJS CRDT INTEGRATION WITH PARTYKIT

### Y.Doc Structure

```typescript
// lib/collaboration/yjs-schema.ts
import * as Y from 'yjs';

// The Yjs document mirrors the Zustand canvas store structure.
// Y.Map for nodes (key-value, supports individual node updates)
// Y.Array for edges (ordered list)
// Y.Map for metadata (title, description, etc.)

interface YjsDiagramDoc {
  nodes: Y.Map<Y.Map<any>>;    // nodeId → { type, position, data, config }
  edges: Y.Array<Y.Map<any>>;  // [{ id, source, target, label, ... }]
  metadata: Y.Map<any>;         // { title, description, createdAt, ... }
}

function initializeYDoc(doc: Y.Doc): YjsDiagramDoc {
  const nodes = doc.getMap('nodes');
  const edges = doc.getArray('edges');
  const metadata = doc.getMap('metadata');
  return { nodes, edges, metadata };
}

// Each node is a nested Y.Map so individual properties can be updated
// without triggering full node replacement:
function addNode(yNodes: Y.Map<Y.Map<any>>, node: ArchitexNode) {
  const yNode = new Y.Map();
  yNode.set('id', node.id);
  yNode.set('type', node.type);
  yNode.set('position', { x: node.position.x, y: node.position.y });
  yNode.set('data', node.data);
  yNode.set('config', node.config);
  yNodes.set(node.id, yNode);
}

function updateNodePosition(yNodes: Y.Map<Y.Map<any>>, nodeId: string, pos: { x: number, y: number }) {
  const yNode = yNodes.get(nodeId);
  if (yNode) {
    yNode.set('position', pos);  // Only triggers position update, not full node re-render
  }
}
```

### Zustand ↔ Yjs Middleware

```typescript
// lib/collaboration/yjs-zustand-middleware.ts
import { StateCreator, StoreApi } from 'zustand';
import * as Y from 'yjs';

type YjsMiddleware = <T extends object>(
  config: StateCreator<T>,
  ydoc: Y.Doc,
  mapping: YjsMapping<T>
) => StateCreator<T>;

interface YjsMapping<T> {
  // Maps Zustand state keys to Yjs shared types
  [key: string]: {
    yType: 'map' | 'array';
    yPath: string;              // path in Y.Doc (e.g., 'nodes')
    toYjs: (value: any) => any;  // Zustand → Yjs conversion
    fromYjs: (yValue: any) => any; // Yjs → Zustand conversion
  };
}

// Sync flow:
// 1. User drags node → Zustand updates → middleware writes to Y.Doc
// 2. Y.Doc fires 'update' event → middleware reads → Zustand updates
// 3. Y.Doc syncs via PartyKit WebSocket to other clients
// 4. Other clients: Y.Doc update → middleware → Zustand → React re-render

// Important: Guard against infinite loops.
// Use a flag `_isRemoteUpdate` to distinguish local vs remote changes.

function createYjsMiddleware<T extends object>(
  ydoc: Y.Doc,
  mapping: YjsMapping<T>
): (config: StateCreator<T>) => StateCreator<T> {
  return (config) => (set, get, api) => {
    let isRemoteUpdate = false;

    // Observe Yjs changes → update Zustand
    for (const [key, map] of Object.entries(mapping)) {
      const yType = ydoc.get(map.yPath, map.yType === 'map' ? Y.Map : Y.Array);
      yType.observe(() => {
        if (isRemoteUpdate) return; // Prevent loops
        isRemoteUpdate = true;
        set({ [key]: map.fromYjs(yType) } as Partial<T>);
        isRemoteUpdate = false;
      });
    }

    return config(
      (partial) => {
        if (isRemoteUpdate) {
          set(partial);
          return;
        }
        // Write to Yjs first, which triggers the observer → Zustand update
        ydoc.transact(() => {
          for (const [key, value] of Object.entries(partial as object)) {
            if (mapping[key]) {
              const yType = ydoc.get(mapping[key].yPath);
              mapping[key].toYjs(yType);
            }
          }
        });
        set(partial);
      },
      get,
      api
    );
  };
}
```

### Awareness Protocol (Cursors + Presence)

```typescript
// lib/collaboration/awareness.ts
import { Awareness } from 'y-protocols/awareness';

interface UserPresence {
  userId: string;
  name: string;
  avatar: string;
  color: string;             // from 8-color palette
  cursor: { x: number; y: number } | null;  // canvas coordinates
  selectedNodes: string[];   // IDs of currently selected nodes
  viewport: { x: number; y: number; zoom: number };
  isIdle: boolean;
  lastActive: number;
}

// 8-color palette for collaboration cursors:
const CURSOR_COLORS = [
  '#EF4444', // red
  '#F59E0B', // amber
  '#22C55E', // green
  '#06B6D4', // cyan
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#F97316', // orange
];

function assignColor(awareness: Awareness): string {
  const usedColors = new Set<string>();
  awareness.getStates().forEach((state) => {
    if (state.color) usedColors.add(state.color);
  });
  return CURSOR_COLORS.find(c => !usedColors.has(c)) ?? CURSOR_COLORS[0];
}

// Set local awareness state:
function updatePresence(awareness: Awareness, partial: Partial<UserPresence>) {
  const current = awareness.getLocalState() || {};
  awareness.setLocalState({ ...current, ...partial });
}
```

---

## 2. PARTYKIT SERVER

### Server Implementation

```typescript
// party/diagram.ts
import type * as Party from "partykit/server";
import { onConnect } from "y-partykit";
import * as Y from "yjs";

export default class DiagramParty implements Party.Server {
  ydoc: Y.Doc;
  connections: Map<string, { userId: string; rateLimit: RateLimiter }>;

  constructor(readonly room: Party.Room) {
    this.ydoc = new Y.Doc();
    this.connections = new Map();
  }

  // JWT auth on every connection
  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // 1. Extract JWT from query string or header
    const token = new URL(ctx.request.url).searchParams.get("token");
    if (!token) {
      conn.close(4001, "Missing auth token");
      return;
    }

    // 2. Validate Clerk JWT
    try {
      const payload = await verifyClerkJWT(token);
      const userId = payload.sub;

      // 3. Check room access (is user allowed in this diagram?)
      const hasAccess = await this.checkAccess(userId, this.room.id);
      if (!hasAccess) {
        conn.close(4003, "Forbidden");
        return;
      }

      // 4. Set up rate limiter (60 updates/sec per connection)
      this.connections.set(conn.id, {
        userId,
        rateLimit: new RateLimiter(60, 1000),
      });

      // 5. Sync Yjs document
      return onConnect(conn, this.room, {
        persist: true,
        callback: {
          handler: async (doc) => {
            // Save to Neon on interval (every 30s)
            await this.persistToNeon(doc);
          },
        },
      });
    } catch (err) {
      conn.close(4001, "Invalid auth token");
    }
  }

  async onMessage(message: string, sender: Party.Connection) {
    const connInfo = this.connections.get(sender.id);
    if (!connInfo) return;

    // Rate limiting: 60 updates/sec per connection
    if (!connInfo.rateLimit.tryConsume()) {
      sender.send(JSON.stringify({ type: "rate_limited", retryAfter: 100 }));
      return;
    }

    // Forward to all other connections
    this.room.broadcast(message, [sender.id]);
  }

  async onClose(conn: Party.Connection) {
    this.connections.delete(conn.id);

    // If no more connections, compact document and save
    if (this.connections.size === 0) {
      await this.compactAndSave();
    }
  }

  // Document compaction: merge all updates into a single state
  private async compactAndSave() {
    const state = Y.encodeStateAsUpdate(this.ydoc);
    // Save compacted state to Neon
    await this.persistToNeon(this.ydoc);
  }

  // Save to Neon Postgres
  private async persistToNeon(doc: Y.Doc) {
    const state = Buffer.from(Y.encodeStateAsUpdate(doc)).toString('base64');
    // POST to our API to save
    await fetch(`${process.env.APP_URL}/api/collaboration/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`,
      },
      body: JSON.stringify({
        roomId: this.room.id,
        state,
        updatedAt: new Date().toISOString(),
      }),
    });
  }

  private async checkAccess(userId: string, roomId: string): Promise<boolean> {
    const res = await fetch(`${process.env.APP_URL}/api/collaboration/access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`,
      },
      body: JSON.stringify({ userId, roomId }),
    });
    return res.ok;
  }
}

// Rate limiter (token bucket)
class RateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private maxTokens: number,
    private refillInterval: number
  ) {
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  tryConsume(): boolean {
    this.refill();
    if (this.tokens > 0) {
      this.tokens--;
      return true;
    }
    return false;
  }

  private refill() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = Math.floor(elapsed / this.refillInterval * this.maxTokens);
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}
```

### PartyKit Configuration

```json
// partykit.json
{
  "name": "architex-collab",
  "main": "party/diagram.ts",
  "compatibilityDate": "2024-09-01",
  "parties": {
    "diagram": "party/diagram.ts"
  }
}
```

---

## 3. LIVE CURSORS

```typescript
// components/collaboration/LiveCursors.tsx
import { useAwareness } from '../hooks/use-awareness';

interface CursorProps {
  userId: string;
  name: string;
  color: string;
  x: number;
  y: number;
  isIdle: boolean;
}

// Implementation:
// - Render SVG cursor icon at each remote user's position
// - Transform coordinates from canvas space to screen space
// - Name label below cursor (pill shape with user's color)
// - 50ms debounce on cursor position broadcasts (not every mousemove)
// - Idle fadeout: opacity → 0.3 after 5 seconds of no movement
// - Fully hidden after 30 seconds idle

function LiveCursors() {
  const remoteCursors = useAwareness();

  return (
    <div className="pointer-events-none absolute inset-0 z-50">
      {remoteCursors.map(cursor => (
        <RemoteCursor
          key={cursor.userId}
          x={cursor.cursor.x}
          y={cursor.cursor.y}
          color={cursor.color}
          name={cursor.name}
          isIdle={cursor.isIdle}
        />
      ))}
    </div>
  );
}

// Cursor broadcasting with debounce:
function useCursorBroadcast(awareness: Awareness) {
  const lastBroadcast = useRef(0);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastBroadcast.current < 50) return; // 50ms debounce = 20Hz max
    lastBroadcast.current = now;

    const canvasPos = screenToCanvas(e.clientX, e.clientY); // transform to canvas coords
    awareness.setLocalState({
      ...awareness.getLocalState(),
      cursor: canvasPos,
      isIdle: false,
      lastActive: now,
    });
  }, [awareness]);

  // Idle detection: set isIdle after 5s of no movement
  useEffect(() => {
    const interval = setInterval(() => {
      const state = awareness.getLocalState();
      if (state && !state.isIdle && Date.now() - state.lastActive > 5000) {
        awareness.setLocalState({ ...state, isIdle: true });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [awareness]);

  return handleMouseMove;
}
```

---

## 4. SELECTION RINGS

```typescript
// components/collaboration/SelectionRings.tsx
// When a remote user selects a node, show a colored ring around it

function SelectionRings() {
  const remoteCursors = useAwareness();

  return (
    <>
      {remoteCursors.flatMap(user =>
        user.selectedNodes.map(nodeId => (
          <SelectionRing
            key={`${user.userId}-${nodeId}`}
            nodeId={nodeId}
            color={user.color}
            userName={user.name}
          />
        ))
      )}
    </>
  );
}

// SelectionRing renders a dashed border + small avatar chip
// around the selected node. Uses React Flow's node internals
// to get the node's DOM element and overlay the ring.

// CSS:
// .selection-ring {
//   border: 2px dashed var(--ring-color);
//   border-radius: 8px;
//   padding: 4px;
//   pointer-events: none;
//   animation: pulse-ring 2s ease-in-out infinite;
// }
```

---

## 5. FOLLOW MODE

```typescript
// components/collaboration/FollowMode.tsx
// Click a user's avatar in the presence bar → follow their viewport

interface FollowModeState {
  following: string | null;  // userId being followed
}

function useFollowMode(awareness: Awareness) {
  const [following, setFollowing] = useState<string | null>(null);
  const { setViewport } = useReactFlow();

  useEffect(() => {
    if (!following) return;

    const handler = () => {
      const states = awareness.getStates();
      const followedUser = states.get(/* clientId for following userId */);
      if (followedUser?.viewport) {
        setViewport(followedUser.viewport, { duration: 300 });
      }
    };

    awareness.on('change', handler);
    return () => awareness.off('change', handler);
  }, [following, awareness, setViewport]);

  return { following, setFollowing };
}

// UI: Presence bar at top of canvas shows avatars of connected users.
// Click avatar → "Following [name]" banner appears, viewport syncs.
// Click again or manually pan/zoom → stop following.
```

---

## 6. DEBOUNCED NODE POSITION UPDATES

```typescript
// hooks/use-debounced-node-drag.ts
// During node drag, update Yjs at 10Hz (every 100ms), not 60Hz

function useDebouncedNodeDrag(yNodes: Y.Map<Y.Map<any>>) {
  const pendingUpdates = useRef<Map<string, { x: number; y: number }>>(new Map());
  const flushInterval = useRef<number>();

  // Start flushing at 10Hz when drag begins
  const onNodeDragStart = useCallback(() => {
    flushInterval.current = window.setInterval(() => {
      if (pendingUpdates.current.size === 0) return;

      yNodes.doc!.transact(() => {
        pendingUpdates.current.forEach((pos, nodeId) => {
          const yNode = yNodes.get(nodeId);
          if (yNode) yNode.set('position', pos);
        });
      });
      pendingUpdates.current.clear();
    }, 100); // 10Hz
  }, [yNodes]);

  // Queue position updates (called at 60Hz by React Flow)
  const onNodeDrag = useCallback((event: any, node: any) => {
    pendingUpdates.current.set(node.id, node.position);
  }, []);

  // Final flush on drag end
  const onNodeDragStop = useCallback((event: any, node: any) => {
    clearInterval(flushInterval.current);
    // Flush any remaining updates
    yNodes.doc!.transact(() => {
      pendingUpdates.current.forEach((pos, nodeId) => {
        const yNode = yNodes.get(nodeId);
        if (yNode) yNode.set('position', pos);
      });
    });
    pendingUpdates.current.clear();
  }, [yNodes]);

  return { onNodeDragStart, onNodeDrag, onNodeDragStop };
}
```

---

## 7. SHAREABLE LINKS

### Small Diagrams (<30 nodes): URL Hash Compression

```typescript
// lib/sharing/url-share.ts
import lzString from 'lz-string';

function generateShareURL(diagram: SerializedDiagram): string {
  // 1. Serialize to compact JSON (strip unnecessary fields)
  const compact = {
    n: diagram.nodes.map(n => ({
      i: n.id, t: n.type, l: n.label,
      x: Math.round(n.position.x), y: Math.round(n.position.y),
      c: n.config,
    })),
    e: diagram.edges.map(e => ({
      s: e.source, t: e.target, l: e.label, p: e.protocol,
    })),
  };

  // 2. Compress with lz-string
  const compressed = lzString.compressToEncodedURIComponent(JSON.stringify(compact));

  // 3. Check size — URL should be < 2000 chars for browser compatibility
  if (compressed.length > 1800) {
    return null; // Too large, use encrypted blob method
  }

  return `${window.location.origin}/view#d=${compressed}`;
}

function parseShareURL(hash: string): SerializedDiagram | null {
  try {
    const params = new URLSearchParams(hash.slice(1));
    const compressed = params.get('d');
    if (!compressed) return null;

    const json = lzString.decompressFromEncodedURIComponent(compressed);
    if (!json) return null;

    // Size limit: reject decompressed data > 500KB (decompression bomb prevention)
    if (json.length > 500_000) return null;

    const compact = JSON.parse(json);
    // Reconstruct full diagram from compact format
    return expandCompactDiagram(compact);
  } catch {
    return null;
  }
}
```

### Large Diagrams: Encrypted Blob Upload

```typescript
// lib/sharing/encrypted-share.ts

async function generateEncryptedShareURL(diagram: SerializedDiagram): Promise<string> {
  // 1. Serialize diagram to JSON
  const plaintext = JSON.stringify(diagram);

  // 2. Generate AES-GCM key using Web Crypto API
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,  // extractable
    ['encrypt', 'decrypt']
  );

  // 3. Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // 4. Encrypt
  const encoder = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );

  // 5. Export key as base64
  const exportedKey = await crypto.subtle.exportKey('raw', key);
  const keyB64 = btoa(String.fromCharCode(...new Uint8Array(exportedKey)));

  // 6. Upload encrypted blob to server (server never sees plaintext or key)
  const blob = new Uint8Array([...iv, ...new Uint8Array(ciphertext)]);
  const res = await fetch('/api/share/upload', {
    method: 'POST',
    body: blob,
    headers: { 'Content-Type': 'application/octet-stream' },
  });
  const { id } = await res.json();

  // 7. URL = origin + hash with ID and key
  // Key is in fragment ONLY (never sent to server)
  return `${window.location.origin}/view#json=${id},${keyB64}`;
}

async function loadEncryptedShare(hash: string): Promise<SerializedDiagram | null> {
  // 1. Parse hash
  const params = hash.slice(1);
  const jsonMatch = params.match(/json=([^,]+),(.+)/);
  if (!jsonMatch) return null;

  const [, id, keyB64] = jsonMatch;

  // 2. IMMEDIATELY strip hash from URL (prevent leakage via referrer, history, etc.)
  history.replaceState(null, '', window.location.pathname);

  // 3. Download encrypted blob
  const res = await fetch(`/api/share/${id}`);
  const blob = new Uint8Array(await res.arrayBuffer());

  // 4. Extract IV (first 12 bytes) and ciphertext (rest)
  const iv = blob.slice(0, 12);
  const ciphertext = blob.slice(12);

  // 5. Import key
  const keyBytes = Uint8Array.from(atob(keyB64), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    'raw', keyBytes, { name: 'AES-GCM' }, false, ['decrypt']
  );

  // 6. Decrypt
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv }, key, ciphertext
  );

  // 7. Parse JSON
  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(plaintext));
}
```

---

## 8. COMMUNITY GALLERY

### Public Profiles

```typescript
// app/(main)/profile/[username]/page.tsx
interface PublicProfile {
  username: string;           // @username
  displayName: string;
  avatar: string;
  bio: string;               // max 160 chars
  joinedAt: Date;
  stats: {
    designs: number;
    upvotesReceived: number;
    forksReceived: number;
    streak: number;
    level: number;
    xp: number;
  };
  publishedDesigns: PublishedDesign[];
  contributionHeatmap: DayActivity[];   // last 365 days
  badges: Achievement[];
}

// Contribution heatmap using @uiw/react-heat-map:
// - Color intensity based on activity level (0-4 scale)
// - Activity = challenges completed + diagrams created + SRS reviews
// - Tooltip shows "X activities on Jan 15, 2026"
// - GitHub-style grid layout (weeks as columns, days as rows)

import HeatMap from '@uiw/react-heat-map';

function ContributionHeatmap({ data }: { data: DayActivity[] }) {
  return (
    <HeatMap
      value={data.map(d => ({ date: d.date, count: d.count }))}
      startDate={subDays(new Date(), 365)}
      endDate={new Date()}
      width={720}
      rectSize={11}
      space={3}
      legendCellSize={0}
      style={{ color: '#8b8d98' }}
      panelColors={{
        0: '#161b22',
        1: '#0e4429',
        2: '#006d32',
        3: '#26a641',
        4: '#39d353',
      }}
    />
  );
}
```

### Published Designs

```typescript
// Components for the community gallery
interface PublishedDesign {
  id: string;
  title: string;
  description: string;
  author: { username: string; avatar: string };
  thumbnail: string;           // auto-generated OG image
  difficulty: 1 | 2 | 3 | 4 | 5;
  module: string;
  tags: string[];
  nodeCount: number;
  upvotes: number;
  comments: number;
  forks: number;
  createdAt: Date;
  updatedAt: Date;
}

// Gallery page: /community
// - Grid of design cards (3 columns desktop, 2 tablet, 1 mobile)
// - Sort: Hot (upvotes * recency), New, Top (all time), Top (this week)
// - Filter: Module, Difficulty, Tags
// - Search: FlexSearch across title + description + tags
```

### Upvote System

```typescript
// app/api/community/upvote/route.ts
export async function POST(req: Request) {
  const { userId } = await requireAuth();
  const { designId } = await req.json();

  // Check if already upvoted
  const existing = await db.query.upvotes.findFirst({
    where: and(eq(upvotes.userId, userId), eq(upvotes.designId, designId)),
  });

  if (existing) {
    // Toggle off (remove upvote)
    await db.delete(upvotes).where(eq(upvotes.id, existing.id));
    await db.update(designs).set({
      upvoteCount: sql`upvote_count - 1`
    }).where(eq(designs.id, designId));
    return Response.json({ upvoted: false });
  }

  // Add upvote (single-vote only, no downvotes)
  await db.insert(upvotes).values({ userId, designId });
  await db.update(designs).set({
    upvoteCount: sql`upvote_count + 1`
  }).where(eq(designs.id, designId));

  return Response.json({ upvoted: true });
}

// Client-side optimistic UI:
// 1. Immediately toggle upvote icon + increment count
// 2. Fire API call
// 3. On error → rollback to previous state
// 4. Debounce rapid clicks (300ms)
```

### Comment System

```typescript
// Threaded comments (1 level nesting max)
interface Comment {
  id: string;
  designId: string;
  parentId: string | null;     // null = top-level, string = reply
  authorId: string;
  author: { username: string; avatar: string };
  content: string;             // Markdown
  upvotes: number;
  createdAt: Date;
  updatedAt: Date;
  replies?: Comment[];          // only 1 level deep
}

// Rendering with react-markdown + rehype-sanitize:
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

function CommentBody({ content }: { content: string }) {
  return (
    <ReactMarkdown
      rehypePlugins={[rehypeSanitize]}    // XSS prevention
      allowedElements={['p', 'a', 'strong', 'em', 'code', 'pre', 'ul', 'ol', 'li', 'br']}
    >
      {content}
    </ReactMarkdown>
  );
}

// Rules:
// - Max 1 level nesting (replies to replies become top-level replies)
// - Max 2000 characters per comment
// - Rate limit: 10 comments per hour per user
// - Markdown support: bold, italic, code, links, lists
// - No images in comments (prevent abuse)
// - Edit within 15 minutes of posting
// - Soft delete (mark as deleted, show "[deleted]")
```

### Fork / Remix

```typescript
// app/api/community/fork/route.ts
export async function POST(req: Request) {
  const { userId } = await requireAuth();
  const { designId } = await req.json();

  const original = await db.query.designs.findFirst({
    where: eq(designs.id, designId),
  });

  if (!original) return Response.json({ error: "Not found" }, { status: 404 });

  // Deep copy diagram data
  const forkedData = structuredClone(original.diagramData);

  // Create new diagram with forkedFrom attribution
  const forked = await db.insert(designs).values({
    id: createId(),
    userId,
    title: `${original.title} (fork)`,
    description: original.description,
    diagramData: forkedData,
    forkedFromId: original.id,         // attribution link
    isPublic: false,                    // forks start private
    module: original.module,
    difficulty: original.difficulty,
    tags: original.tags,
  }).returning();

  // Increment fork count on original
  await db.update(designs).set({
    forkCount: sql`fork_count + 1`
  }).where(eq(designs.id, designId));

  return Response.json({ forkedDesign: forked[0] });
}

// UI shows "Forked from @username/original-title" link on forked designs
```

---

## 9. OG IMAGE GENERATION

```typescript
// app/api/og/[designId]/route.tsx
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(req: Request, { params }: { params: { designId: string } }) {
  const design = await getDesign(params.designId);
  if (!design) return new Response('Not found', { status: 404 });

  // 1200x630px OG image (standard size for Twitter/LinkedIn/Facebook)
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0A0A0F',
          padding: 60,
          fontFamily: 'Inter',
        }}
      >
        {/* Top bar: Architex logo + difficulty badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: '#6366F1', fontSize: 28, fontWeight: 700 }}>
            Architex
          </div>
          <div style={{
            backgroundColor: getDifficultyColor(design.difficulty),
            color: 'white',
            padding: '6px 16px',
            borderRadius: 20,
            fontSize: 18,
            fontWeight: 600,
          }}>
            Level {design.difficulty}
          </div>
        </div>

        {/* Title */}
        <div style={{
          color: '#F4F4F5',
          fontSize: 48,
          fontWeight: 800,
          marginTop: 40,
          lineHeight: 1.2,
        }}>
          {design.title}
        </div>

        {/* Description */}
        <div style={{
          color: '#94A3B8',
          fontSize: 24,
          marginTop: 20,
          lineHeight: 1.5,
          maxHeight: 120,
          overflow: 'hidden',
        }}>
          {design.description}
        </div>

        {/* Bottom bar: component count + author */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 'auto',
        }}>
          <div style={{ color: '#64748B', fontSize: 20 }}>
            {design.nodeCount} components  |  {design.edgeCount} connections
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img
              src={design.author.avatar}
              width={36}
              height={36}
              style={{ borderRadius: '50%' }}
            />
            <span style={{ color: '#94A3B8', fontSize: 20 }}>
              @{design.author.username}
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

function getDifficultyColor(level: number): string {
  const colors = { 1: '#22C55E', 2: '#3B82F6', 3: '#F59E0B', 4: '#EF4444', 5: '#A855F7' };
  return colors[level] || '#6B7280';
}
```

---

## 10. SOCIAL SHARING

### Share to Twitter/LinkedIn

```typescript
// lib/sharing/social.ts
function getTwitterShareURL(design: PublishedDesign): string {
  const text = `Check out my system design for "${design.title}" on Architex! 🏗️\n\n${design.nodeCount} components, Level ${design.difficulty}`;
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/community/${design.id}`;
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
}

function getLinkedInShareURL(design: PublishedDesign): string {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/community/${design.id}`;
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
}

// Meta tags for auto-preview (in design page head):
// <meta property="og:title" content="{title}" />
// <meta property="og:description" content="{description}" />
// <meta property="og:image" content="/api/og/{designId}" />
// <meta property="og:image:width" content="1200" />
// <meta property="og:image:height" content="630" />
// <meta name="twitter:card" content="summary_large_image" />
```

### oEmbed Provider (Slack/Notion Auto-Expand)

```typescript
// app/api/oembed/route.ts
export async function GET(req: Request) {
  const url = new URL(req.url);
  const designUrl = url.searchParams.get('url');
  const format = url.searchParams.get('format') || 'json';
  const maxWidth = parseInt(url.searchParams.get('maxwidth') || '800');
  const maxHeight = parseInt(url.searchParams.get('maxheight') || '600');

  const designId = extractDesignId(designUrl);
  if (!designId) return Response.json({ error: 'Invalid URL' }, { status: 400 });

  const design = await getDesign(designId);
  if (!design) return Response.json({ error: 'Not found' }, { status: 404 });

  const oembedData = {
    version: '1.0',
    type: 'rich',
    provider_name: 'Architex',
    provider_url: process.env.NEXT_PUBLIC_APP_URL,
    title: design.title,
    author_name: design.author.username,
    author_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile/${design.author.username}`,
    width: Math.min(maxWidth, 800),
    height: Math.min(maxHeight, 450),
    thumbnail_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/og/${designId}`,
    thumbnail_width: 1200,
    thumbnail_height: 630,
    html: `<iframe src="${process.env.NEXT_PUBLIC_APP_URL}/embed/${designId}" width="${Math.min(maxWidth, 800)}" height="${Math.min(maxHeight, 450)}" frameborder="0" allowfullscreen></iframe>`,
  };

  return Response.json(oembedData, {
    headers: { 'Content-Type': 'application/json+oembed' },
  });
}

// Register oEmbed discovery in page head:
// <link rel="alternate" type="application/json+oembed"
//       href="/api/oembed?url={pageUrl}" title="{title}" />
```

### Web Component Embed

```typescript
// lib/embed/web-component.ts
import r2wc from '@r2wc/react-to-web-component';
import { DiagramViewer } from '../components/embed/DiagramViewer';

// Convert React component to Web Component
const SystemDiagram = r2wc(DiagramViewer, {
  props: {
    diagramId: 'string',
    theme: 'string',      // 'light' | 'dark'
    interactive: 'boolean', // allow pan/zoom
    height: 'string',
    width: 'string',
  },
});

// Register custom element
customElements.define('system-diagram', SystemDiagram);

// Usage in any HTML page:
// <script src="https://architex.dev/embed.js"></script>
// <system-diagram
//   diagram-id="abc123"
//   theme="dark"
//   interactive="true"
//   height="400px"
//   width="100%"
// ></system-diagram>
```

---

## 11. EMAIL SYSTEM (RESEND + REACT-EMAIL + INNGEST)

### Email Templates

```typescript
// emails/welcome-drip.tsx (react-email template)
import { Html, Head, Body, Container, Text, Button, Section, Img } from '@react-email/components';

interface WelcomeEmailProps {
  name: string;
  step: 1 | 2 | 3 | 4 | 5;
}

// Welcome Drip: 5 emails over 7 days (adaptive — skip if user already completed action)

// Email 1 (Day 0): "Welcome to Architex" — quick tour, link to first challenge
// Email 2 (Day 1): "Your First System Design" — guided URL shortener tutorial
// Email 3 (Day 2): "Meet Your AI Tutor" — highlight AI feedback features
// Email 4 (Day 4): "Level Up with Spaced Repetition" — SRS introduction
// Email 5 (Day 7): "You're Ready for the Real Thing" — interview mode CTA

export function WelcomeEmail({ name, step }: WelcomeEmailProps) {
  const content = WELCOME_CONTENT[step];
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#0A0A0F', fontFamily: 'Inter, sans-serif' }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
          <Img src="https://architex.dev/logo.png" width={120} alt="Architex" />
          <Text style={{ color: '#F4F4F5', fontSize: 24, fontWeight: 700 }}>
            {content.title}
          </Text>
          <Text style={{ color: '#94A3B8', fontSize: 16, lineHeight: 1.6 }}>
            {content.body}
          </Text>
          <Button
            href={content.ctaUrl}
            style={{
              backgroundColor: '#6366F1',
              color: 'white',
              padding: '12px 24px',
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            {content.ctaText}
          </Button>
        </Container>
      </Body>
    </Html>
  );
}

// Adaptive logic (Inngest):
// Before sending email 2, check if user already created first diagram → skip to email 3
// Before sending email 4, check if user already tried SRS → skip to email 5
```

### Weekly Digest

```typescript
// emails/weekly-digest.tsx
interface WeeklyDigestProps {
  name: string;
  stats: {
    challengesCompleted: number;
    xpEarned: number;
    streakDays: number;
    rank: number;
    leagueChange: 'promoted' | 'demoted' | 'stayed';
  };
  recommendedChallenge: {
    title: string;
    difficulty: number;
    url: string;
  };
  srsDue: number;              // concepts due for review
}

// Sent: Mondays at 9:00 AM UTC
// Layout:
// - Stats grid (4 columns: Challenges, XP, Streak, Rank)
// - Recommended challenge card (based on adaptive difficulty)
// - SRS due concepts count with "Review Now" button
// - Leaderboard position + league status
// - Community highlight (most upvoted design this week)
```

### SRS Reminder Emails

```typescript
// lib/email/srs-reminders.ts
// Schedule: 1 day, 3 days, 7 days, 14 days after last review
// Only send if user has due cards AND hasn't opened the app today

// Inngest function:
export const srsReminder = inngest.createFunction(
  { id: 'srs-reminder' },
  { cron: '0 9 * * *' },  // Daily at 9 AM UTC
  async ({ step }) => {
    // Get users with due SRS cards who haven't been active today
    const users = await step.run('get-users-with-due-cards', async () => {
      return db.query.srsCards.findMany({
        where: and(
          lte(srsCards.nextReviewAt, new Date()),
          not(inArray(srsCards.userId, activeToday)),
        ),
        columns: { userId: true },
        distinct: true,
      });
    });

    // Check last reminder sent per user (respect 1d, 3d, 7d, 14d intervals)
    for (const user of users) {
      await step.run(`send-srs-reminder-${user.userId}`, async () => {
        const lastReminder = await getLastSRSReminder(user.userId);
        const daysSinceLast = lastReminder ? daysBetween(lastReminder, new Date()) : Infinity;

        // Progressive intervals: 1d → 3d → 7d → 14d
        const intervals = [1, 3, 7, 14];
        const reminderCount = await getSRSReminderCount(user.userId);
        const nextInterval = intervals[Math.min(reminderCount, intervals.length - 1)];

        if (daysSinceLast >= nextInterval) {
          const dueCount = await getDueCardCount(user.userId);
          await sendEmail(user.userId, 'srs-reminder', { dueCount });
        }
      });
    }
  }
);
```

### Re-engagement Emails

```typescript
// Inngest function for inactive users:
// 7 days inactive: "We miss you! Here's what you missed..."
// 14 days inactive: "Your streak was X days — pick back up?"
// 30 days inactive: "New features since you left" (last attempt, then stop)

export const reEngagement = inngest.createFunction(
  { id: 're-engagement' },
  { cron: '0 10 * * *' },  // Daily at 10 AM UTC
  async ({ step }) => {
    const inactiveUsers = await step.run('find-inactive', async () => {
      return db.query.users.findMany({
        where: and(
          lte(users.lastActiveAt, subDays(new Date(), 7)),
          eq(users.emailOptIn, true),
          not(eq(users.reEngagementSent, 3)),  // max 3 re-engagement emails
        ),
      });
    });

    for (const user of inactiveUsers) {
      const inactiveDays = daysBetween(user.lastActiveAt, new Date());
      let template: string | null = null;

      if (inactiveDays >= 30 && user.reEngagementSent < 3) {
        template = 're-engagement-30d';
      } else if (inactiveDays >= 14 && user.reEngagementSent < 2) {
        template = 're-engagement-14d';
      } else if (inactiveDays >= 7 && user.reEngagementSent < 1) {
        template = 're-engagement-7d';
      }

      if (template) {
        await step.run(`send-${template}-${user.id}`, async () => {
          await sendEmail(user.id, template, { name: user.name, inactiveDays });
          await db.update(users).set({
            reEngagementSent: user.reEngagementSent + 1,
          }).where(eq(users.id, user.id));
        });
      }
    }
  }
);
```

### Resend Integration

```typescript
// lib/email/resend.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail(userId: string, template: string, props: Record<string, any>) {
  const user = await getUserById(userId);
  if (!user?.email) return;

  // Check daily email limit per channel
  const todayCount = await getEmailCountToday(userId);
  if (todayCount >= 3) return; // 3 emails/day max

  // Check quiet hours (10pm - 8am user timezone)
  if (isQuietHours(user.timezone)) return;

  const { subject, react } = getEmailTemplate(template, { ...props, name: user.name });

  await resend.emails.send({
    from: 'Architex <hello@architex.dev>',
    to: user.email,
    subject,
    react,
  });

  await logEmailSent(userId, template);
}
```

---

## 12. NOTIFICATION CENTER

### Bell Icon + Popover

```typescript
// components/notifications/NotificationCenter.tsx
interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  actionUrl: string | null;
  channel: 'in_app' | 'email' | 'push';
  read: boolean;
  createdAt: Date;
}

type NotificationType =
  | 'achievement_unlocked'
  | 'streak_reminder'
  | 'srs_due'
  | 'design_upvoted'
  | 'design_commented'
  | 'design_forked'
  | 'challenge_available'
  | 'league_promoted'
  | 'league_demoted'
  | 'collab_invite'
  | 'weekly_digest'
  | 'system_announcement';

// UI:
// - Bell icon in top nav bar
// - Unread badge (red dot with count, max "99+")
// - Click → popover with scrollable notification list
// - Each notification: icon + title + body + time ago + read indicator
// - Click notification → mark read + navigate to actionUrl
// - "Mark all as read" button at top
// - "Settings" link → notification preferences page
```

### Channel Limits and Anti-Spam

```typescript
// lib/notifications/throttle.ts
const CHANNEL_LIMITS: Record<string, number> = {
  in_app: 20,    // max 20 in-app notifications per day
  email: 3,      // max 3 emails per day
  push: 5,       // max 5 push notifications per day
};

const COOLDOWNS: Record<NotificationType, number> = {
  // Minimum seconds between same notification type
  achievement_unlocked: 0,     // no cooldown (rare event)
  streak_reminder: 86400,      // once per day
  srs_due: 28800,              // every 8 hours max
  design_upvoted: 300,         // batch: "5 people upvoted your design"
  design_commented: 60,        // 1 min cooldown
  design_forked: 300,          // 5 min cooldown
  challenge_available: 86400,  // once per day
  league_promoted: 0,          // no cooldown (weekly event)
  league_demoted: 0,           // no cooldown (weekly event)
  collab_invite: 0,            // no cooldown (manual action)
  weekly_digest: 604800,       // once per week
  system_announcement: 0,      // no cooldown (manual)
};

// Quiet hours: 10pm - 8am in user's timezone
// During quiet hours: queue notifications, deliver at 8am
function isQuietHours(timezone: string): boolean {
  const userTime = new Date().toLocaleString('en-US', { timeZone: timezone, hour12: false });
  const hour = parseInt(userTime.split(', ')[1].split(':')[0]);
  return hour >= 22 || hour < 8;
}

async function sendNotification(
  userId: string,
  type: NotificationType,
  data: { title: string; body: string; actionUrl?: string }
): Promise<void> {
  // 1. Check cooldown
  const lastOfType = await getLastNotification(userId, type);
  if (lastOfType && secondsSince(lastOfType.createdAt) < COOLDOWNS[type]) return;

  // 2. Check daily limit per channel
  const channels = getChannelsForType(type);  // which channels this type uses
  for (const channel of channels) {
    const count = await getDailyNotificationCount(userId, channel);
    if (count >= CHANNEL_LIMITS[channel]) continue;

    // 3. Check quiet hours
    const user = await getUserById(userId);
    if (['email', 'push'].includes(channel) && isQuietHours(user.timezone)) {
      await queueForDelivery(userId, type, data, channel, getNextDeliveryTime(user.timezone));
      continue;
    }

    // 4. Send
    await deliverNotification(userId, channel, { type, ...data });
  }
}
```

### Notification Database Schema

```typescript
// src/db/schema/notifications.ts
export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  actionUrl: text('action_url'),
  channel: text('channel').notNull(),    // 'in_app', 'email', 'push'
  read: boolean('read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIdx: index('idx_notifications_user').on(table.userId, table.createdAt),
  unreadIdx: index('idx_notifications_unread').on(table.userId, table.read).where(eq(table.read, false)),
}));

export const notificationPreferences = pgTable('notification_preferences', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  inApp: boolean('in_app').default(true),
  email: boolean('email').default(true),
  push: boolean('push').default(false),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

---

## FILES TO CREATE/MODIFY

```
party/
  diagram.ts                        ← PartyKit server (Yjs + auth + rate limiting)

partykit.json                       ← PartyKit config

lib/
  collaboration/
    yjs-schema.ts                   ← Y.Doc structure definition
    yjs-zustand-middleware.ts       ← Zustand ↔ Yjs sync middleware
    awareness.ts                    ← Cursor + presence protocol
    connection.ts                   ← PartyKit connection manager
  sharing/
    url-share.ts                    ← lz-string URL compression
    encrypted-share.ts              ← AES-GCM encrypted blob sharing
    social.ts                       ← Twitter/LinkedIn share URLs
  embed/
    web-component.ts                ← @r2wc Web Component wrapper
  email/
    resend.ts                       ← Resend client wrapper
    templates.ts                    ← Template registry
  notifications/
    throttle.ts                     ← Rate limiting + quiet hours
    channels.ts                     ← Channel routing

components/
  collaboration/
    LiveCursors.tsx                 ← Remote cursor rendering
    SelectionRings.tsx              ← Node selection indicators
    PresenceBar.tsx                 ← Connected users avatar bar
    FollowMode.tsx                  ← Viewport following
    CollaborationProvider.tsx       ← Yjs + PartyKit setup context
  community/
    GalleryGrid.tsx                 ← Design card grid
    DesignCard.tsx                  ← Individual design card
    UpvoteButton.tsx                ← Optimistic upvote toggle
    CommentThread.tsx               ← Threaded comments
    CommentForm.tsx                 ← New comment input
    ForkButton.tsx                  ← Fork with attribution
    PublicProfile.tsx               ← Profile page component
    ContributionHeatmap.tsx         ← GitHub-style heatmap
    ShareMenu.tsx                   ← Share dropdown (link, Twitter, LinkedIn, embed)
  notifications/
    NotificationCenter.tsx          ← Bell + popover
    NotificationItem.tsx            ← Single notification row
    NotificationPreferences.tsx     ← Settings page

emails/
  welcome-drip.tsx                  ← 5-part welcome sequence
  weekly-digest.tsx                 ← Weekly stats email
  srs-reminder.tsx                  ← SRS due reminder
  re-engagement.tsx                 ← Win-back emails
  achievement.tsx                   ← Achievement unlocked
  collab-invite.tsx                 ← Collaboration invitation

hooks/
  use-awareness.ts                  ← Awareness state hook
  use-debounced-node-drag.ts        ← 10Hz drag broadcast
  use-follow-mode.ts                ← Viewport following hook
  use-notifications.ts              ← Notification polling/subscription

app/
  api/
    og/[designId]/route.tsx         ← OG image generation
    oembed/route.ts                 ← oEmbed provider
    share/
      upload/route.ts               ← Encrypted blob upload
      [id]/route.ts                 ← Encrypted blob download
    community/
      designs/route.ts              ← List/search designs
      upvote/route.ts               ← Toggle upvote
      comment/route.ts              ← CRUD comments
      fork/route.ts                 ← Fork design
    collaboration/
      save/route.ts                 ← Save Yjs state to Neon
      access/route.ts               ← Check room access
    notifications/
      route.ts                      ← Get user notifications
      read/route.ts                 ← Mark as read
      preferences/route.ts          ← Get/update preferences
  (main)/
    community/page.tsx              ← Gallery page
    community/[id]/page.tsx         ← Individual design page
    profile/[username]/page.tsx     ← Public profile page
    embed/[id]/page.tsx             ← Embeddable viewer

src/db/schema/
  community.ts                      ← (extend) designs, upvotes, comments, forks
  collaboration.ts                  ← (extend) rooms, access, Yjs state
  notifications.ts                  ← notifications, preferences
```

---

## DEPENDENCIES TO INSTALL

```bash
pnpm add yjs y-partykit y-protocols         # CRDT + PartyKit provider
pnpm add partykit                            # PartyKit server
pnpm add @r2wc/react-to-web-component       # Web Component wrapper
pnpm add @uiw/react-heat-map                # Contribution heatmap
pnpm add react-markdown rehype-sanitize      # Markdown rendering
pnpm add resend @react-email/components      # Email
pnpm add lz-string                           # URL compression (already in Phase 1)
```

---

## ACCEPTANCE CRITERIA

- [ ] Yjs document syncs correctly between 2+ browser tabs/windows
- [ ] PartyKit server validates JWT on every onConnect
- [ ] Rate limiting enforces 60 updates/sec per connection
- [ ] Live cursors render at correct canvas positions with 50ms debounce
- [ ] Cursor idle fadeout at 5s, hidden at 30s
- [ ] Selection rings show around nodes selected by remote users
- [ ] Follow mode syncs viewport to followed user
- [ ] Node drag broadcasts at 10Hz (not 60Hz)
- [ ] Small diagrams (<30 nodes) generate shareable URL hash with lz-string
- [ ] Large diagrams use AES-GCM encryption with key in fragment only
- [ ] URL hash stripped immediately after reading (history.replaceState)
- [ ] Decompression bomb prevention (500KB limit on decompressed data)
- [ ] Community gallery renders design cards with sort/filter/search
- [ ] Upvote toggles with optimistic UI and rollback on error
- [ ] Comments render Markdown with rehype-sanitize (no XSS)
- [ ] Threaded comments limited to 1 level nesting
- [ ] Fork creates deep copy with forkedFrom attribution
- [ ] OG images generate at 1200x630px with design metadata
- [ ] oEmbed endpoint returns valid oEmbed JSON for Slack/Notion
- [ ] Web Component <system-diagram> embeds correctly in external HTML
- [ ] Welcome drip sends 5 emails over 7 days (adaptive skipping)
- [ ] Weekly digest sends Mondays 9 AM UTC with stats + recommendations
- [ ] SRS reminders respect 1d/3d/7d/14d intervals
- [ ] Re-engagement stops after 3 emails
- [ ] Notification center shows unread badge with count
- [ ] Channel limits enforced (in_app 20/day, email 3/day, push 5/day)
- [ ] Quiet hours respected (10pm-8am user timezone)
- [ ] Anti-spam cooldowns per notification type
