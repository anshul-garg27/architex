# How to Add a New Template

This guide covers adding a new system-design diagram template to Architex. Templates are pre-built architectures (e.g., "URL Shortener", "Chat System", "Payment Gateway") that users can load onto the canvas to study or modify.

## Prerequisites

- Familiarity with the `DiagramTemplate` type and the template gallery UI.
- An understanding of the node types available in `systemDesignNodeTypes` and `PALETTE_ITEMS`.

## Overview of touched files

| Step | File | Purpose |
|------|------|---------|
| 1 | `templates/system-design/your-template.json` | Template data file |
| 2 | `src/lib/templates/index.ts` | Import and register |

---

## Step 1: Create the template JSON file

Templates live as static JSON files in the `templates/system-design/` directory. Each file is a complete `DiagramTemplate` object.

### Template structure

The template type is defined in `src/lib/templates/types.ts`:

```ts
export interface DiagramTemplate {
  id: string;                          // unique kebab-case identifier
  name: string;                        // display name shown in gallery
  description: string;                 // 1-2 sentence summary
  difficulty: 1 | 2 | 3 | 4 | 5;     // 1=easy, 5=very advanced
  category: 'classic' | 'modern' | 'infrastructure' | 'advanced';
  tags: string[];                      // searchable keywords
  nodes: TemplateNode[];               // components in the architecture
  edges: TemplateEdge[];               // connections between components
  learnSteps?: LearnStep[];            // optional guided walkthrough
}
```

### Creating a template file

Create `templates/system-design/your-template.json`. Here is a minimal but complete example:

```json
{
  "id": "your-template",
  "name": "Your System (Short Name)",
  "description": "Design a system that does X. Covers Y, Z, and W at scale.",
  "difficulty": 3,
  "category": "modern",
  "tags": ["your-tag", "caching", "messaging", "microservices"],
  "nodes": [
    {
      "id": "web-client",
      "type": "client",
      "position": { "x": 0, "y": 200 },
      "data": {
        "label": "Web Client",
        "category": "client",
        "componentType": "web-client",
        "icon": "Monitor",
        "config": {
          "concurrentUsers": 10000,
          "requestsPerSecond": 500
        },
        "state": "idle"
      }
    },
    {
      "id": "api-gw",
      "type": "api-gateway",
      "position": { "x": 250, "y": 200 },
      "data": {
        "label": "API Gateway",
        "category": "load-balancing",
        "componentType": "api-gateway",
        "icon": "Shield",
        "config": {
          "rateLimitRps": 10000,
          "authType": "jwt",
          "timeoutMs": 30000
        },
        "state": "idle"
      }
    },
    {
      "id": "app-server",
      "type": "app-server",
      "position": { "x": 500, "y": 200 },
      "data": {
        "label": "App Server",
        "category": "compute",
        "componentType": "app-server",
        "icon": "Server",
        "config": {
          "instances": 3,
          "threads": 200,
          "processingTimeMs": 15
        },
        "state": "idle"
      }
    },
    {
      "id": "database",
      "type": "database",
      "position": { "x": 750, "y": 300 },
      "data": {
        "label": "Primary DB (PostgreSQL)",
        "category": "storage",
        "componentType": "database",
        "icon": "Database",
        "config": {
          "type": "postgresql",
          "replicas": 2,
          "maxConnections": 200,
          "storageGB": 500
        },
        "state": "idle"
      }
    },
    {
      "id": "cache",
      "type": "cache",
      "position": { "x": 750, "y": 100 },
      "data": {
        "label": "Cache (Redis)",
        "category": "storage",
        "componentType": "cache",
        "icon": "Zap",
        "config": {
          "type": "redis",
          "memoryGB": 16,
          "evictionPolicy": "lru",
          "ttlSeconds": 3600
        },
        "state": "idle"
      }
    }
  ],
  "edges": [
    {
      "id": "e-client-gw",
      "source": "web-client",
      "target": "api-gw",
      "sourceHandle": "right",
      "targetHandle": "left-target",
      "type": "data-flow",
      "data": {
        "edgeType": "http",
        "latency": 50,
        "animated": true
      }
    },
    {
      "id": "e-gw-app",
      "source": "api-gw",
      "target": "app-server",
      "sourceHandle": "right",
      "targetHandle": "left-target",
      "type": "data-flow",
      "data": {
        "edgeType": "http",
        "latency": 2,
        "animated": false
      }
    },
    {
      "id": "e-app-cache",
      "source": "app-server",
      "target": "cache",
      "sourceHandle": "top",
      "targetHandle": "bottom-target",
      "type": "data-flow",
      "data": {
        "edgeType": "cache-lookup",
        "latency": 1,
        "animated": false
      }
    },
    {
      "id": "e-app-db",
      "source": "app-server",
      "target": "database",
      "sourceHandle": "right",
      "targetHandle": "left-target",
      "type": "data-flow",
      "data": {
        "edgeType": "db-query",
        "latency": 5,
        "animated": false
      }
    }
  ],
  "learnSteps": [
    {
      "title": "Client Request",
      "description": "A user sends an HTTP request from the web client to the API Gateway.",
      "highlightNodes": ["web-client", "api-gw"],
      "highlightEdges": ["e-client-gw"]
    },
    {
      "title": "Request Routing",
      "description": "The API Gateway authenticates the request and routes it to the app server.",
      "highlightNodes": ["api-gw", "app-server"],
      "highlightEdges": ["e-gw-app"]
    },
    {
      "title": "Cache Check",
      "description": "The app server first checks the Redis cache for a cached response.",
      "highlightNodes": ["app-server", "cache"],
      "highlightEdges": ["e-app-cache"]
    },
    {
      "title": "Database Fallback",
      "description": "On cache miss, the app server queries the PostgreSQL database.",
      "highlightNodes": ["app-server", "database"],
      "highlightEdges": ["e-app-db"]
    }
  ]
}
```

### Node conventions

| Field | Requirements |
|-------|-------------|
| `id` | Unique within the template. Use descriptive kebab-case names. |
| `type` | Must match a key in `systemDesignNodeTypes` (see `src/components/canvas/nodes/system-design/index.ts`). |
| `position` | `{ x, y }` coordinates. Lay out left-to-right. Use ~250px horizontal spacing. |
| `data.category` | Must be a valid `NodeCategory`. |
| `data.componentType` | Matches the `type` field in `PALETTE_ITEMS`. |
| `data.icon` | PascalCase lucide-react icon name. |
| `data.config` | Key-value pairs matching the component's `defaultConfig` in `PALETTE_ITEMS`. |
| `data.state` | Always `"idle"` in templates. |

### Edge conventions

| Field | Requirements |
|-------|-------------|
| `id` | Unique within the template. Convention: `e-{source}-{target}`. |
| `source` / `target` | Must reference valid node IDs in the template. |
| `sourceHandle` / `targetHandle` | Handle IDs from BaseNode: `top`, `right`, `bottom`, `left` (source) and `top-target`, `right-target`, `bottom-target`, `left-target` (target). |
| `type` | Always `"data-flow"`. |
| `data.edgeType` | One of: `http`, `grpc`, `graphql`, `websocket`, `message-queue`, `event-stream`, `db-query`, `cache-lookup`, `replication`. |
| `data.latency` | Estimated latency in milliseconds for this hop. |
| `data.animated` | `true` for the primary request path, `false` for secondary connections. |

### Learn steps (optional)

The `learnSteps` array provides a guided walkthrough. Each step highlights specific nodes and edges, helping users understand the request flow. This is optional but highly recommended for educational value.

### Categories and difficulty

**Categories** determine grouping in the template gallery:

| Category | Description | Examples |
|----------|-------------|---------|
| `classic` | Fundamental system design problems | URL Shortener, Rate Limiter, Chat System |
| `modern` | Contemporary architectures | Discord, Spotify, YouTube |
| `infrastructure` | DevOps and platform systems | CI/CD Pipeline, Monitoring, Logging |
| `advanced` | Complex multi-service architectures | Stock Exchange, Collaborative Editor |

**Difficulty** (1-5) affects sort order in the gallery and helps users find appropriate challenges:

| Level | Description | Examples |
|-------|-------------|---------|
| 1 | Single-service, few components | Feature Flags, Typeahead |
| 2 | Standard CRUD with caching | URL Shortener, API Rate Limiter |
| 3 | Multiple services, async processing | Chat System, Notification System |
| 4 | Complex data pipelines, real-time | Video Processing, Food Delivery |
| 5 | Global-scale, multi-region | Stock Exchange, Collaborative Editor |

### Tags

Tags are used for search/filter in the gallery. Include:

- The system name (e.g., `"url-shortener"`, `"chat-system"`)
- Key patterns used (e.g., `"caching"`, `"event-driven"`, `"microservices"`)
- Relevant domains (e.g., `"social-media"`, `"e-commerce"`, `"fintech"`)

---

## Step 2: Register in the template registry

Open `src/lib/templates/index.ts` and make two additions:

### 2a. Import the JSON file

```ts
import yourTemplate from '../../../templates/system-design/your-template.json';
```

### 2b. Add to the SYSTEM_DESIGN_TEMPLATES array

Insert the template at the appropriate position. Templates are loosely ordered by difficulty (ascending) then name:

```ts
export const SYSTEM_DESIGN_TEMPLATES: DiagramTemplate[] = [
  // ... existing templates sorted by difficulty ...
  yourTemplate,
  // ... more templates ...
] as unknown as DiagramTemplate[];
```

The `as unknown as DiagramTemplate[]` cast is necessary because TypeScript infers JSON imports as literal types. This is an existing pattern used throughout the file.

The template gallery (`src/components/shared/template-gallery.tsx`) reads from this array to render the gallery grid. The gallery supports:

- Search by name, description, and tags
- Filtering by category and difficulty
- Click to load onto canvas

---

## Layout tips

When positioning nodes, follow these conventions used by existing templates:

```
Left-to-right flow:
  Client (x:0) -> Gateway (x:250) -> Server (x:500) -> Storage (x:750)

Vertical spacing for branching:
  Cache at y:100 (above main path)
  Main path at y:200
  Database at y:300 (below main path)
  Async components at y:400+

Standard horizontal gap: 250px
Standard vertical gap: 150px
```

For reference, study the layout of existing templates:

- Simple: `templates/system-design/url-shortener.json` (6 nodes, linear flow)
- Medium: `templates/system-design/chat-system.json` (multi-service with WebSocket)
- Complex: `templates/system-design/stock-exchange.json` (many components, multiple paths)

---

## Verification checklist

1. The JSON file is valid (no syntax errors).
2. `pnpm typecheck` passes.
3. `pnpm build` completes without errors (JSON import resolution).
4. Opening the Template Gallery (`Cmd+T`) shows your template.
5. Searching for the template name or tags finds it.
6. Clicking the template loads all nodes and edges onto the canvas.
7. All nodes render with correct icons and colors.
8. All edges connect properly between the specified handles.
9. (If present) Learn steps highlight the correct nodes and edges.
10. Running the simulation produces reasonable metrics for the architecture.

---

## Thumbnail / preview

Templates do not currently require a separate thumbnail image. The template gallery generates a preview card from the template metadata (name, description, difficulty badge, category tag, and tag chips). The visual preview of the architecture is shown when the template is loaded onto the canvas.

If a thumbnail system is added in the future, the convention will be to place PNG files at `public/templates/{template-id}.png` at 400x300px resolution.
