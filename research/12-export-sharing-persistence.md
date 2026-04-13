# Export, Sharing & Persistence

> Complete technology choices for every export format, sharing mechanism, and persistence strategy.

---

## 1. IMAGE EXPORT

| Library | Size | Speed | Best For |
|---|---|---|---|
| **SnapDOM** | ~8KB | 2-6× faster | Modern CSS, shadow DOM |
| **html-to-image** | ~3KB | Fast | Simple diagrams |
| **html2canvas** | ~40KB | Slowest | Broadest compatibility |

## 2. PDF EXPORT
Capture as image (SnapDOM/html-to-image) → embed in **jsPDF** (~280KB, 2.6M+ weekly downloads).

## 3. DIAGRAM FORMAT EXPORTS

| Format | Approach |
|---|---|
| **Mermaid** | Custom serializer: walk nodes/edges → emit Mermaid syntax |
| **PlantUML** | Custom serializer: nodes/edges → PlantUML syntax. Use plantuml-core (WASM) for rendering |
| **draw.io XML** | Generate `<mxGraphModel>` XML with `<mxCell>` elements |
| **Terraform HCL** | Template each node type to corresponding `resource` block |
| **JSON** | React Flow `toObject()` → `{ nodes, edges, viewport }` |
| **Code** | UML class diagram → TypeScript/Python/Java class definitions |

## 4. SHAREABLE URLS

### Small diagrams (< 30 nodes, no server needed):
```
JSON.stringify(state) → lz-string.compressToEncodedURIComponent() → URL hash
```

### Large diagrams (Excalidraw model):
1. Serialize to JSON
2. Encrypt with AES-GCM (Web Crypto API)
3. Upload encrypted blob → get ID
4. URL: `{origin}#json={id},{encryptionKey}`
5. Key lives only in URL fragment (never sent to server)

### Compression Libraries
| Library | Size | Best For |
|---|---|---|
| **lz-string** | 3.5KB | URL params (has `compressToEncodedURIComponent()`) |
| **JSONCrush** | ~2KB | Repetitive JSON |
| **fflate** | ~8KB | Larger payloads (DEFLATE) |

## 5. REAL-TIME COLLABORATION

**Winner: Yjs (CRDT framework)**
- y-webrtc: P2P sync (no server for 2-20 users)
- y-indexeddb: Offline persistence
- Awareness protocol: Live cursors + presence
- React Flow integration: Synergy Codes published an e-book on Yjs + React Flow

| Feature | Yjs | Automerge | Liveblocks |
|---|---|---|---|
| Type | Open-source CRDT | Open-source CRDT | Managed SaaS |
| Performance | Fastest | Improving | Good |
| Self-hosted | Yes | Yes | No |
| Cost | Free | Free | Paid SaaS |

## 6. PERSISTENCE & OFFLINE

| Storage | Capacity | Speed | Best For |
|---|---|---|---|
| localStorage | 5-10 MB | Fast (sync) | Small settings |
| **IndexedDB** (Dexie.js) | 60% of disk | Moderate | Diagram state, undo history |
| **OPFS** | Same as IDB | 3-4× faster | Large binary assets |
| Cache API | Same | Fast | Service worker caching |

**Recommendation:** Dexie.js for diagram state + OPFS for exports + localStorage for preferences

## 7. FILE SYSTEM ACCESS

**Library:** `browser-fs-access` (Google Chrome Labs)
- Native file picker on Chrome/Edge
- Graceful fallback on Firefox/Safari
- Persistent file handles (re-save without picker)

## 8. PWA / OFFLINE

**Stack:** `@ducanh2912/next-pwa` + Workbox

| Resource | Strategy |
|---|---|
| App shell | Precache |
| WASM files | CacheFirst (long TTL) |
| API responses | NetworkFirst |
| User diagrams | IndexedDB (Dexie) |
| Static assets | CacheFirst |

## 9. EMBEDDING

| Method | Approach |
|---|---|
| **iframe** | `/embed/[id]` route + PostMessage API |
| **Web Component** | `@r2wc/react-to-web-component` wraps React as `<system-diagram>` |
| **oEmbed** | Provider endpoint → auto-expand in Slack/Notion/Medium |
