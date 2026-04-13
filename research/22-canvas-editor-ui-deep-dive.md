# Canvas/Diagram Editor UI Deep Dive — Architex Editor Specs

> Research from Figma (UI3), Excalidraw, tldraw, Miro, draw.io, React Flow, Rete.js, Blender Node Editor, Unreal Engine Blueprints, VS Code, VisuAlgo, and n8n.

---

## MASTER LAYOUT: THE ARCHITEX EDITOR

```
+-----------------------------------------------------------------------------------+
| [Menu]  File  Edit  View  Insert  Simulate  Help    [Share] [Avatars] [Settings]  |  <- Menu Bar (36px)
+--------+----------------------------------------------------+--------------------+
|        |                                                    |                    |
| COMP   |                                                    |  PROPERTIES        |
| PALETTE|              CANVAS AREA                           |  PANEL             |
|        |          (Infinite, zoomable)                      |                    |
| 280px  |                                                    |  320px             |
| resiz- |    +------+                   +------+             |  resiz-            |
| able   |    | Node |---connection----->| Node |             |  able              |
|        |    +------+                   +------+             |                    |
| Search |                                                    |  [Design]          |
| Categ. |                                                    |  [Metrics]         |
| Favs   |              [Minimap]                             |  [Config]          |
| Recent |               bottom-right                         |                    |
|        |                                                    |                    |
+--------+----------------------------------------------------+--------------------+
|  [Toolbar: Select | Pan | Connect | Text | Shapes | ...]   | Sim: [>][||][x] 1x |  <- Bottom Toolbar (48px)
+--------+----------------------------------------------------+--------------------+
|  [Code Editor (Monaco)]  |  [Metrics Dashboard]  |  [Console]  |  [Timeline]     |  <- Bottom Panel
|                          |                       |             |                 |     (200-400px, resizable)
+--------+----------------------------------------------------+--------------------+
| Module: System Design | Nodes: 14 | Sim: Running | Zoom: 75% | 3 online | Saved |  <- Status Bar (24px)
+-----------------------------------------------------------------------------------+
```

---

## 1. TOOLBAR DESIGN

### Research Findings

**Figma UI3** — Moved toolbar to the BOTTOM (2024 redesign). Rationale: frees canvas space at top, creates consistent pattern across products, forms a "floating" bar that makes the canvas feel larger. Tools grouped into dropdowns: Move tools (Move/Hand/Scale), Region tools (Frame/Section/Slice), Shape tools (Rectangle/Line/Arrow/Ellipse/Polygon/Star/Image), Creation tools (Pen/Pencil), Text, Comment tools, and an Actions menu for AI/plugins.

**Excalidraw** — Single horizontal toolbar at TOP CENTER. Extremely minimal: Selection, Rectangle, Ellipse, Diamond, Arrow, Line, Freehand, Text, Image, Eraser. Single-key shortcuts (V=select, R=rect, E=ellipse, A=arrow, L=line, X=freehand, T=text). No grouping, all tools visible. Philosophy: show everything you need and nothing you don't.

**tldraw** — Toolbar at LEFT side (vertical) with select, draw, arrow, shapes. NavigationPanel at BOTTOM-LEFT with zoom controls and minimap toggle. StylePanel appears contextually.

**Miro** — "Creation toolbar" on the LEFT side (vertical). Collaboration toolbar at BOTTOM-LEFT. Navigation toolbar at BOTTOM-RIGHT (zoom in/out, frames/layers). Customizable: can move icons in/out of toolbar for quick access.

**draw.io** — Traditional TOP toolbar below menu bar. Left-to-right: view controls, zoom%, undo/redo, delete, front/back, fill/line color, shadow, connection styles, insert menu. Right side: fullscreen, format panel toggle.

**Blender Node Editor** — No traditional toolbar; right-click context menu driven. Header bar at top with menu and view controls only.

**Unreal Blueprints** — Toolbar at TOP with compile, save, find, class settings, defaults, graph options. Tab-based for different graph views.

### Best Practices Synthesized

- **Spacing**: 4px between buttons in same group, 16px between groups, vertical dividers between major sections (PatternFly guidelines)
- **5+ actions rule**: If more than 5 tools, MUST group with separators
- **Icon + tooltip**: Icon-only for primary tools, always include tooltip with name + keyboard shortcut
- **Non-essential overflow**: Put infrequent tools under "..." overflow menu
- **Proximity**: Toolbar must be close to the content it controls (W3C toolbar pattern)

### Architex Toolbar Spec

**Position**: BOTTOM CENTER (floating, like Figma UI3)
**Height**: 48px
**Style**: Rounded corners (12px radius), subtle shadow, semi-transparent background with backdrop blur
**Layout**: Horizontal, icon-only with tooltips

```
|  [V] Select  |  [H] Pan  |  [C] Connect  | ---- |  [T] Text  |  [R] Rect  |  [^] Shapes v  | ---- |  [P] Pen  |  [E] Eraser  | ---- |  [+] Insert  |  [AI] Actions  |
   group 1: Navigation          divider         group 2: Creation                                   divider  group 3: Editing             divider  group 4: Advanced
```

**Group 1 — Navigation** (left):
- Select (V) — Default tool, cursor icon
- Pan (H / Space held) — Hand icon
- Connect (C) — Arrow-with-dot icon, for creating edges

**Group 2 — Creation** (center):
- Text (T) — "T" icon
- Rectangle (R) — Square outline icon
- Shapes dropdown (S) — Ellipse, Diamond, Hexagon, Cloud, Cylinder, Database, Queue, custom
- Pen (P) — Freehand draw icon
- Eraser (E) — Eraser icon

**Group 3 — Advanced** (right):
- Insert (+) — Open component palette at cursor, or quick-add from library
- Actions (Cmd+K) — Command palette / AI actions

**Keyboard Shortcuts on Tooltips**:
Every tool tooltip shows: "Select (V)" or "Pan (H or hold Space)"

**Active State**: Blue filled background, white icon
**Hover State**: Light grey background
**Disabled State**: 40% opacity

**Responsive**: On smaller screens, collapse into icon-group dropdowns. On tablet, show abbreviated toolbar.

---

## 2. COMPONENT PALETTE (LEFT SIDEBAR)

### Research Findings

**draw.io** — Left panel contains "shape libraries" organized into logical groups. Users can expand/collapse categories, enable/disable libraries via checkboxes. Includes a search field for finding shapes by name. A "scratchpad" for personal favorites (drag shapes there to save).

**Figma** — Assets tab in left sidebar: searchable component library with nested categories. Components listed with thumbnails. Recently used items tracked.

**Miro** — Creation toolbar opens into expanded panels showing templates, shapes, and integrations. Organized by category with search.

**Unreal Blueprints** — "Palette" panel provides context-sensitive listing of all available functions/variables. "My Blueprint" panel shows the current blueprint's hierarchy: graphs, functions, macros, variables, event dispatchers. Searchable. Drag-and-drop to graph.

**React Flow** — Drag-and-drop from external sidebar demonstrated in examples. Items dragged from sidebar create nodes on canvas.

### Architex Component Palette Spec

**Position**: LEFT sidebar
**Default Width**: 280px (resizable, min 200px, max 400px)
**Collapsible**: Yes, to 48px icon strip (Activity Bar style)

### Header (48px)
```
[Search icon] [Search: "Find components..."]  [Filter] [+]
```

### Sections (Scrollable)

**Section 1: Recently Used** (collapsible, default open)
- Last 8 components used, shown as small icon + label
- Horizontal wrap layout, 4 per row
- Click to stamp, drag to place

**Section 2: Favorites** (collapsible, default open)
- User-starred components, drag to add/remove
- Star icon toggle on each component card
- Max 12 shown, "Show all" link

**Section 3: Categories** (collapsible accordion)

| Category | Components (examples) | Icon |
|---|---|---|
| **Compute** | Server, Microservice, Lambda Function, Container, VM, K8s Pod | CPU chip |
| **Storage** | SQL Database, NoSQL DB, Object Storage (S3), Cache (Redis), Data Lake | Cylinder |
| **Networking** | Load Balancer, API Gateway, CDN, DNS, Firewall, VPN | Globe |
| **Messaging** | Message Queue (Kafka), Pub/Sub, Event Bus, Stream Processor | Arrow-split |
| **Clients** | Web Browser, Mobile App, Desktop Client, IoT Device | Phone/laptop |
| **Data Processing** | MapReduce, Spark Job, ETL Pipeline, Batch Processor | Gears |
| **Security** | Auth Service, OAuth Provider, WAF, Certificate Manager | Shield |
| **Monitoring** | Metrics Collector, Log Aggregator, Alert Manager, Health Check | Chart |
| **Infrastructure** | Region, Availability Zone, VPC, Subnet, Cluster | Cloud |
| **Algorithm Structures** | Array, Linked List, Tree, Graph, Hash Table, Stack, Queue, Heap | Brackets |
| **Connectors** | Sync Arrow, Async Arrow, Data Flow, Dependency, Replication | Arrow types |
| **Annotations** | Note, Label, Region/Boundary, Decision Diamond, Text Block | Sticky note |

**Each Component Card** (within category):
- 48x48 thumbnail icon
- Label below (12px, truncated)
- Tooltip on hover: full name + brief description
- Drag handle visible on hover
- Star/favorite toggle in top-right corner on hover

### Search Behavior
- Fuzzy matching across all categories
- Results grouped by category
- Highlights matching text
- Shows matching count per category
- "No results? Create custom component" CTA
- Debounced (150ms)

### Drag-and-Drop Behavior
- Ghost preview follows cursor at 60% opacity
- Canvas highlights valid drop zones
- Snapping guides appear during drag
- Drop creates node at position with default configuration
- Undo-able (Cmd+Z)

---

## 3. PROPERTIES PANEL (RIGHT SIDEBAR)

### Research Findings

**Figma UI3** — Right sidebar reorganized into contextual sections: Layout (width/height/auto layout), Position (X/Y/constraints/rotation), Appearance (blend modes/corner radius/visibility), Typography, Component properties. Sections are collapsible. Quick-action buttons in header for masks/components/boolean operations.

**draw.io** — Right "Format" panel with 3 tabs: Style (fill/outline color), Text (font/size/alignment), Arrange (position/layering/rotation). When nothing selected, shows global diagram settings.

**Unreal Blueprints** — "Details" panel shows selected node properties. Organized into collapsible sections. Search bar at top to filter properties.

**Blender** — Properties panel uses sections/categories with collapsible headers. Heavy use of inline editing. Color-coded values.

**n8n Node Design** — Fields organized most important to least important, broad scope to narrow scope. Dependent fields bundled under a parent toggle.

### Architex Properties Panel Spec

**Position**: RIGHT sidebar
**Default Width**: 320px (resizable, min 240px, max 480px)
**Collapsible**: Yes, to 0px (hidden) or 48px icon strip

### When Nothing Selected — Canvas Properties
```
+--------------------------------+
| Canvas Properties              |
+--------------------------------+
| Background:  [Dots v] [Color]  |
| Grid Spacing: [20px]           |
| Snap to Grid: [Toggle ON]     |
| Show Minimap: [Toggle ON]     |
+--------------------------------+
| Diagram Info                   |
| Name: "Uber Ride Service"     |
| Module: System Design          |
| Created: 2026-04-09           |
| Last Modified: 2 min ago      |
+--------------------------------+
```

### When Node Selected — Tabbed Properties

**Tab Bar** (top of panel):
```
[Design]  [Metrics]  [Config]  [Notes]
```

**Design Tab** (visual properties):
```
+--------------------------------+
| Node: "API Gateway"           |  <- Node name (editable inline)
| Type: Networking > API Gateway |  <- Breadcrumb to type
+--------------------------------+
| APPEARANCE                     |  <- Collapsible section
| Fill Color:    [#3B82F6] [v]  |
| Border Color:  [#1E40AF] [v]  |
| Border Width:  [2px]          |
| Corner Radius: [8px]          |
| Opacity:       [100%]  ----o  |
| Icon:          [Gateway] [v]  |
+--------------------------------+
| SIZE & POSITION                |
| W: [200px]    H: [120px]     |
| X: [340]      Y: [180]       |
| Rotation: [0deg]              |
| Lock Aspect: [Toggle OFF]     |
+--------------------------------+
| LABEL                          |
| Text: "API Gateway"           |
| Font: Inter  Size: 14px       |
| Color: [#FFFFFF]              |
| Position: [Center v]          |
+--------------------------------+
| CONNECTIONS                    |
| Incoming: 2  Outgoing: 3     |
| [Show connection details v]   |
+--------------------------------+
```

**Metrics Tab** (system design specific, the differentiator):
```
+--------------------------------+
| PERFORMANCE                    |
| Throughput: [10,000 req/s]    |
| Latency (P50): [5ms]         |
| Latency (P99): [50ms]        |
| Error Rate: [0.1%]           |
+--------------------------------+
| CAPACITY                       |
| Max Connections: [50,000]     |
| Bandwidth: [1 Gbps]          |
| Storage: [N/A]                |
| Memory: [8 GB]                |
+--------------------------------+
| RELIABILITY                    |
| Availability: [99.99%]       |
| MTTR: [15 min]               |
| Replicas: [3]                 |
| Failover: [Active-Passive v]  |
+--------------------------------+
| COST                           |
| Hourly: [$0.12/hr]           |
| Monthly Est: [$87.60]        |
+--------------------------------+
```

**Config Tab** (component-specific configuration):
```
+--------------------------------+
| CONFIGURATION                  |
| Protocol: [HTTPS v]           |
| Auth Method: [JWT v]          |
| Rate Limit: [1000/min]       |
| Timeout: [30s]                |
| Retry Policy: [Exponential v] |
| Max Retries: [3]              |
+--------------------------------+
| CUSTOM PROPERTIES              |
| [+ Add Property]              |
| region: "us-east-1"          |
| provider: "AWS"               |
+--------------------------------+
```

**Notes Tab**:
```
+--------------------------------+
| NOTES                          |
| [Rich text editor area]       |
| "This gateway handles all     |
|  external API traffic.        |
|  Consider adding rate         |
|  limiting per user."          |
|                                |
| [@ mention] [link] [code]    |
+--------------------------------+
| COMMENTS (3)                   |
| [Avatar] User1: "Should we   |
|   add circuit breaker?"       |
|   [Reply] [Resolve]           |
+--------------------------------+
```

### When Edge Selected
```
+--------------------------------+
| Edge: Server -> Database       |
+--------------------------------+
| STYLE                          |
| Type: [Solid v] (solid/dashed/dotted) |
| Color: [#6B7280]             |
| Width: [2px]                  |
| Arrow: [End v] (none/start/end/both) |
| Curve: [Bezier v] (straight/step/bezier) |
| Animation: [Flow v] (none/flow/pulse) |
+--------------------------------+
| DATA FLOW                      |
| Protocol: [gRPC v]           |
| Data Format: [Protobuf v]    |
| Throughput: [5,000 msg/s]    |
| Latency: [2ms]               |
| Encryption: [TLS 1.3 v]      |
+--------------------------------+
| LABEL                          |
| Text: "Read replicas"        |
| Position: [50%] on edge      |
+--------------------------------+
```

---

## 4. BOTTOM PANEL

### Research Findings

**VS Code** — Panel below editor containing: Terminal, Output, Problems, Debug Console. Tab-based navigation. Resizable height via dragging. Can be moved to left/right for vertical space. Default height ~200px. Panel can be toggled with Ctrl+`.

**Miro** — No bottom panel (pure canvas tool). All tools in sidebars/toolbars.

**Figma** — No bottom panel. Properties and code inspection in right sidebar.

**Key Pattern**: VS Code's SplitView component enables resizable dividers. Tabs allow switching between views without losing state. Each tab maintains its own scroll position and state.

### Architex Bottom Panel Spec

**Position**: Below canvas, above status bar
**Default Height**: 280px (resizable, min 120px, max 50% viewport)
**Collapsible**: Yes, to just the tab bar (32px)
**Toggle**: Ctrl+` or clicking tab bar

### Tab Bar (32px height)
```
[Code]  [Metrics]  [Console]  [Timeline]  [Terminal]    [--- drag handle ---]    [Maximize] [Minimize] [X]
```

**Tab 1: Code Editor (Monaco)**
- Full Monaco Editor instance
- Language: YAML/JSON/TypeScript/Python depending on context
- Shows generated infrastructure code for current diagram
- Live sync: editing code updates diagram and vice versa
- Split view option: code left, diagram right
- Syntax highlighting, IntelliSense, error squiggles
- File tabs within the code editor for multi-file support

**Tab 2: Metrics Dashboard**
- Real-time metrics when simulation is running
- Layout: 2-3 sparkline charts side by side
- Charts: Throughput over time, Latency distribution, Error rate, Queue depth
- Configurable: drag to rearrange, click to expand individual chart
- Live updating (1s refresh during simulation)
- Time range selector: last 30s, 1m, 5m, 15m
- Uses lightweight charting (visx or recharts, not full Grafana)

**Tab 3: Console**
- Log output from simulation engine
- Color-coded by level: grey=debug, white=info, yellow=warn, red=error
- Filterable: checkboxes for each log level
- Searchable: Ctrl+F within console
- Timestamps with millisecond precision
- Auto-scroll toggle (default ON)
- Clear button

**Tab 4: Timeline / Playback**
- Horizontal timeline scrubber for algorithm animations
- Step markers showing each algorithm step
- Hover over step for preview tooltip
- Current step highlighted
- Variable watch panel below timeline
- Call stack visualization (for algorithm mode)
- Integrated with canvas: current step highlights relevant nodes/edges

**Tab 5: Terminal**
- Embedded terminal for advanced users
- Run deployment scripts, test commands
- xterm.js integration
- Multiple terminal instances (tabs within tab)

### Resize Behavior
- Drag the top edge to resize
- Double-click top edge to snap to default height
- Shift+double-click to maximize
- When maximized, canvas shrinks but remains visible (minimum 200px)

---

## 5. CANVAS AREA

### Research Findings

**Background Options Across Tools**:
- **draw.io**: Default 10pt grey grid, customizable. Sketch theme hides grid for natural feel. Grid not included in exports.
- **Excalidraw**: Blank by default, community requests for math-notebook dots/grid
- **Figma**: Configurable grid overlay, pixel grid at high zoom
- **Miro**: Subtle dot pattern by default
- **Concepts App**: Offers dots, graph, lined paper, isometric, triangle grids

**Zoom UI** (Steve Ruiz / tldraw creator):
- Two coordinate systems: Screen coordinates and Canvas coordinates
- Camera model: point (x, y) + zoom (z)
- Screen-to-Canvas: `x: point.x / camera.z - camera.x`
- Canvas-to-Screen: `x: (point.x + camera.x) * camera.z`
- Zoom 1 = 100%. Zoom in 25% increments toward viewport center.
- Pan: divide deltas by zoom for consistent feel
- CSS transforms: scale() then translate() (order matters)

**Minimap**:
- VS Code: Right side, shows code overview
- React Flow MiniMap: SVG-based, renders each node. Shows viewport rectangle. Click to jump.
- tldraw: OpenGL minimap, bottom-left in NavigationPanel
- Figma: Minimap plugin (not built-in to main canvas, but available)

### Architex Canvas Spec

**Background**: DOT GRID (default)
- Options: Dots (default), Grid Lines, Blank, Isometric
- Dot color: `#2A2A2A` (dark mode), `#E5E5E5` (light mode)
- Dot spacing: 20px (adjustable 10-50px)
- Dots scale with zoom (visible at 25-400%, fade at extremes)
- Not included in exports

**Zoom**:
- Range: 10% to 800%
- Controls:
  - Scroll wheel = zoom (toward cursor point)
  - Pinch-to-zoom (trackpad)
  - Ctrl+= / Ctrl+- (keyboard)
  - Zoom percentage button (bottom-left) opens zoom menu:
    - Zoom to Fit (Ctrl+1)
    - Zoom to Selection (Ctrl+2)
    - Zoom to 100% (Ctrl+0)
    - 25%, 50%, 75%, 100%, 150%, 200%
  - Zoom snaps to standard levels when close (within 3%)

**Minimap**:
- Position: BOTTOM-RIGHT of canvas area (above status bar)
- Size: 200x150px (resizable)
- Shows: All nodes as simplified colored rectangles, all edges as lines
- Viewport indicator: Semi-transparent blue rectangle showing current view
- Interaction: Click to jump, drag viewport rectangle to pan
- Toggle: View > Minimap, or button in zoom controls
- Collapses to small icon when not needed

**Breadcrumb / Path Indicator**:
- Position: TOP-LEFT of canvas, below menu bar
- Shows: `System Design > Uber Ride Service > Payment Subsystem`
- Clickable: each level navigates to that zoom/view
- Appears when zoomed into a subsystem or group node
- Updates dynamically as user navigates nested components

**Canvas Interactions**:
- Click: Select node/edge
- Click + drag: Move node / selection box
- Right-click: Context menu
- Double-click node: Edit label inline
- Double-click canvas: Quick-add node (opens mini-search at cursor)
- Space + drag: Pan (or middle mouse)
- Scroll: Vertical pan (or zoom if Ctrl held)
- Two-finger scroll: Pan on trackpad

**Snapping & Alignment**:
- Smart guides appear when aligning with other nodes (magenta dashed lines)
- Snap to grid when within 5px of grid point
- Snap to node centers and edges
- Distribution guides when spacing multiple nodes
- Hold Alt to temporarily disable snapping

---

## 6. CONTEXT MENUS

### Research Findings

**NNGroup 10 Guidelines** (key ones):
1. Use for secondary, noncritical actions only
2. Place near the content they affect
3. Ensure icon visibility with sufficient size/contrast
4. Group related actions with separators (max ~3 groups)
5. Maintain consistent behavior across product
6. Use tooltips/labels for clarity
7. Use for actions only, not content expansion
8. Avoid for single actions (surface those directly)
9. Don't use hamburger icon for context menus
10. Must be keyboard and screen reader accessible

**React Flow** — onNodeContextMenu event for custom menus. Simple menus with duplicate/delete for clicked node.

**Apple HIG** — Show keyboard shortcuts in main menus, not context menus (context menus ARE shortcuts). However, many desktop apps (VS Code, Figma) DO show shortcuts in context menus to aid learning.

**Carbon Design System** — Separators between groups, max ~3 groups, destructive actions at bottom in red.

### Architex Context Menu Spec

**Style**: Dark background (#1A1A2E), 240px width, 8px border radius, subtle shadow, 8px padding, appears at cursor position with smart edge-avoidance

**Right-Click on Node**:
```
+--------------------------------+
|  Cut                    Ctrl+X |
|  Copy                   Ctrl+C |
|  Paste                  Ctrl+V |
|  Duplicate              Ctrl+D |
|  ─────────────────────────────  |
|  Edit Label              F2    |
|  Edit Configuration      E    |
|  View Connections        →    |  <- Sub-menu showing connected nodes
|  ─────────────────────────────  |
|  Group                  Ctrl+G |
|  Lock                    L    |
|  Bring to Front          ]    |
|  Send to Back            [    |
|  ─────────────────────────────  |
|  Add Note                      |
|  Set Breakpoint (Sim)    B    |
|  ─────────────────────────────  |
|  Delete              ⌫ / Del  |  <- Red text
+--------------------------------+
```

**Right-Click on Canvas** (empty space):
```
+--------------------------------+
|  Paste                  Ctrl+V |
|  Paste from Clipboard    →    |
|  ─────────────────────────────  |
|  Add Component...       Ctrl+I |  <- Opens mini-search palette at click position
|  Add Text               T     |
|  Add Note                      |
|  ─────────────────────────────  |
|  Select All             Ctrl+A |
|  Zoom to Fit            Ctrl+1 |
|  ─────────────────────────────  |
|  Canvas Settings...            |
|  Auto-Layout              →    |  <- Sub-menu: Horizontal, Vertical, Force-directed, Dagre
+--------------------------------+
```

**Right-Click on Edge**:
```
+--------------------------------+
|  Edit Label              F2    |
|  Edit Data Flow          E    |
|  ─────────────────────────────  |
|  Straighten                    |
|  Add Waypoint                  |
|  Change Style             →    |  <- Sub-menu: Solid, Dashed, Dotted, Animated
|  Reverse Direction             |
|  ─────────────────────────────  |
|  Delete              ⌫ / Del  |  <- Red text
+--------------------------------+
```

**Keyboard Access**: Arrow keys to navigate, Enter to select, Escape to close. Sub-menus open with Right arrow, close with Left arrow.

---

## 7. STATUS BAR

### Research Findings

**VS Code** — Status bar at very bottom. Left side: branch name, errors/warnings count, line:column. Right side: language mode, encoding, line ending, indentation, feedback. Color-coded: blue=normal, orange=debugging, purple=no folder.

**draw.io** — Status message area showing autosave status.

**Figma** — Zoom level shown in bottom-left. No traditional status bar, but the toolbar at bottom serves dual purpose.

**Microsoft UX Guidelines** — Status bars indicate status through text and icons. Can be divided into sections. Can include progress indicators and menus. Typically at bottom edge of window.

### Architex Status Bar Spec

**Position**: Very bottom of window
**Height**: 24px
**Background**: Slightly lighter than main background (#1E2028 dark mode)
**Font**: 12px, medium weight

### Layout

```
| [icon] System Design  |  Nodes: 14  Edges: 22  |  Sim: Running [●]  |  ---- stretch ----  |  Zoom: 75%  |  [●][●][●] 3 online  |  Saved ✓  |  [?]  |
  ^                        ^                         ^                                          ^              ^                       ^           ^
  Current module           Object counts              Simulation status                         Zoom level     Collaborators            Save state  Help
```

**Left Section** (information):
- Module indicator icon + name (clickable: switch modules)
- Node/Edge count (updates live)

**Center Section** (status):
- Simulation status: Idle / Running (green dot) / Paused (yellow dot) / Error (red dot)
- Progress indicator during operations (slim progress bar)

**Right Section** (controls):
- Zoom level (clickable: opens zoom menu)
- Online collaborator dots (colored circles matching cursor colors, clickable: opens presence panel)
- Save status: "Saved" / "Saving..." / "Unsaved changes" (with auto-save indicator)
- Help icon (?) opens keyboard shortcut cheat sheet

**Color Coding**:
- Default: Neutral grey text on dark background
- Simulation Running: Status section has subtle green tint
- Error State: Status section has subtle red tint
- Unsaved: Save indicator turns yellow

---

## 8. SIMULATION CONTROLS

### Research Findings

**MATLAB Simulink** — Dashboard blocks for interactive tuning and monitoring. Start, Pause/Resume, Step Into, Step Over, Terminate buttons.

**General simulation UIs** — Play/Pause at top, restart after, settings below. Continue button should be selected immediately when pausing.

**Game engine patterns** — Transport controls (Play/Pause/Stop) universally understood. Speed multiplier common. Step-forward for debugging.

### Architex Simulation Controls Spec

**Position**: RIGHT side of bottom toolbar, separated by vertical divider
**Also accessible**: Via dedicated simulation panel when expanded

### Compact Mode (in toolbar)
```
|  [▶ Play]  [⏸ Pause]  [⏹ Stop]  |  Speed: [1x v]  |  [💥 Chaos]  |  [📊 Toggle Metrics]  |
```

### Expanded Mode (when simulation panel is open, replaces part of bottom panel)
```
+-------------------------------------------------------------------+
| SIMULATION CONTROL                                                 |
+-------------------------------------------------------------------+
| [▶ Play]  [⏸ Pause]  [⏹ Stop]  [⏭ Step]     Speed: [0.5x] [1x] [2x] [5x] [10x]  |
+-------------------------------------------------------------------+
| Timeline: [====●=================================]  00:45 / 05:00  |
| Events:   [*]    [*]        [*] [*]      [*]                      |  <- Event markers on timeline
+-------------------------------------------------------------------+
| CHAOS ENGINEERING                                                  |
| [💥 Inject Failure]  Type: [Node Crash v]  Target: [Random v]    |
| Active Chaos Events: Server-2 (down), Network-3 (latency +200ms) |
+-------------------------------------------------------------------+
| LIVE METRICS TOGGLE                                                |
| [✓] Throughput  [✓] Latency  [✓] Error Rate  [ ] Queue Depth    |
| [✓] CPU Usage   [ ] Memory   [ ] Network I/O                     |
+-------------------------------------------------------------------+
```

### Controls Detail

**Play (▶)**:
- Starts simulation from current state
- Keyboard: Space (when not in text input)
- Visual: Green pulse animation on button while running
- Canvas: Animated data flow on edges (moving dots along connections)

**Pause (⏸)**:
- Freezes simulation state
- All metrics freeze at current values
- Canvas: Flow animations stop, nodes retain current state colors
- Step button becomes active

**Stop (⏹)**:
- Resets simulation to initial state
- Clears all runtime metrics
- Canvas: Returns to design-time appearance

**Step (⏭)**:
- Only active when paused
- Advances simulation by one tick/event
- Canvas highlights: which node processed, which edges carried data
- Console shows step details

**Speed Control**:
- Dropdown or segmented control: 0.25x, 0.5x, 1x, 2x, 5x, 10x
- Keyboard: + and - to adjust
- Visual: Speed badge appears next to play button when not 1x

**Chaos Event Injection**:
- Button opens dropdown of chaos types:
  - Node Crash (kills a service)
  - Network Partition (splits network)
  - Latency Spike (adds delay to edge)
  - Disk Full (storage node failure)
  - CPU Spike (compute throttling)
  - Memory Leak (gradual degradation)
- Target: Specific node, random node, or specific edge
- Active chaos events shown as badges on affected nodes (red lightning bolt icon)

**Metrics Toggle**:
- Checkboxes to show/hide metric overlays on canvas
- When enabled, small metric badges appear on nodes (mini sparklines or values)
- Color coded: green=healthy, yellow=degraded, red=critical

---

## 9. ALGORITHM PLAYBACK CONTROLS

### Research Findings

**VisuAlgo** — Spacebar: play/pause/replay. Arrow keys: step forward/backward. +/-: speed control. Status bar shows current operation. Variable values displayed alongside. Step counter visible.

**USF Algorithm Visualization** — Skip back, Step back, Play/Pause, Step forward, Skip forward. Canvas size adjustment. Controls below the visualization.

**General algorithm animation research** — Users can pause, resume, and step through at their own pace. Stepping backward can be confusing; recommend stepping forward primarily when first exploring. Allow segmenting animations at different levels (per-operation vs per-loop).

### Architex Algorithm Playback Spec

**Position**: Bottom panel "Timeline" tab, or floating overlay at bottom-center of canvas in Algorithm mode

### Floating Overlay Mode (during algorithm visualization)
```
+------------------------------------------------------------------------+
|  [|◀]  [◀]  [▶ Play]  [▶|]  [▶▶|]  |  Step 14/47  |  Speed: [1x v]  |
|  skip   step   play    step    skip     counter         speed           |
|  back   back           fwd     end                                     |
+------------------------------------------------------------------------+
|  Timeline: [======●=======================================]             |
|  Steps:    [1] [2] [3] ... [14*] [15] ... [47]                        |
|            ^markers for each algorithm step, current highlighted       |
+------------------------------------------------------------------------+
```

### Controls

**Skip Back (|◀)** — Jump to beginning (step 0)
**Step Back (◀)** — Go back one step. Undo last operation.
**Play/Pause (▶ / ⏸)** — Auto-play through steps at selected speed
**Step Forward (▶|)** — Advance one step. Canvas animates the operation.
**Skip End (▶▶|)** — Jump to final state

**Timeline Scrubber**:
- Horizontal bar showing full algorithm duration
- Draggable handle to scrub to any step
- Step markers as small dots/ticks on timeline
- Hover over marker: tooltip shows operation description ("Compare arr[3] with arr[4]")
- Color coding on timeline: Green=completed, Blue=current, Grey=upcoming

**Speed Control**: 0.25x, 0.5x, 1x, 2x, 4x
- Keyboard: [ and ] to decrease/increase speed

**Variable Watch Panel** (below timeline in expanded mode):
```
+------------------------------------------+
| VARIABLES                                 |
| arr = [3, 1, |4|, 1, 5, 9, 2, 6]       |  <- Current element highlighted
| i = 3                                    |
| j = 4                                    |
| pivot = 4                                |
| comparisons = 12                         |
| swaps = 3                                |
+------------------------------------------+
```

**Canvas Integration**:
- Current step highlights relevant nodes/edges with glow effect
- Previously visited nodes have subtle "visited" overlay
- Active comparison/swap/operation shown with animation
- Data values displayed inside nodes
- Color legend: Green=sorted/complete, Blue=current, Orange=comparing, Red=swapping

**Keyboard Shortcuts**:
- Space: Play/Pause
- Right Arrow: Step forward
- Left Arrow: Step back
- Home: Skip to beginning
- End: Skip to end
- [ : Slow down
- ] : Speed up

---

## 10. COLLABORATION UI

### Research Findings

**Figma Multiplayer**:
- Every user gets an avatar in top-right corner
- Each user assigned a unique color
- Cursor + name label shown for all active participants
- Selection rings show who is working where
- Opt-in presentations: click avatar to follow someone, can temporarily disable
- Changes sync via WebSocket, cursor positions debounced to 50ms
- Overhauled file format for small message sizes

**Collaboration Cursor Evolution** (Prototypr.io):
- Started as blinking carets in Google Docs
- Became flying mouse cursors in Mural
- Figma brought them to design canvas
- Evolved into floating avatars and video-cursors

**Liveblocks** — Collaboration kit provides: presence (who is online), live cursors, comments, notifications. Common implementation patterns.

### Architex Collaboration Spec

### User Presence (Top Right of Menu Bar)
```
[Share]  [Avatar1] [Avatar2] [Avatar3] [+2]  [●]
                                               ^online indicator
```

- Avatars: 28px circles with user photos or initials
- Border color matches user's cursor color
- Max 4 visible, "+N" overflow shows tooltip with all users on hover
- Click avatar: Follow that user's viewport (opt-in presentation)
- Double-click avatar: Open their profile / send nudge
- Green dot: Online and active
- Yellow dot: Online but idle (no input for 2+ minutes)
- Grey dot: Recently online (left within last 5 minutes)

### Live Cursors
- Each user's cursor shown on canvas with:
  - Colored cursor arrow (matches their avatar border)
  - Name label below cursor (small pill badge, same color as cursor)
  - Label auto-hides after 3 seconds of inactivity, reappears on movement
- Cursor update rate: debounced to 50ms (20fps)
- Cursors fade out when user is idle (>30 seconds)
- Cursors disappear when user leaves

### Selection Indicators
- When a user selects a node, that node gets a colored selection ring matching the user's color
- "UserName is editing" appears below the node if someone is actively editing its properties
- Prevents edit conflicts: if User A is editing a node's properties, User B sees a lock icon + "Locked by UserA"

### Color Assignment
Predefined palette of 8 high-contrast colors (cycle through):
```
#EF4444 (Red)
#F97316 (Orange)
#EAB308 (Yellow)
#22C55E (Green)
#06B6D4 (Cyan)
#3B82F6 (Blue)
#8B5CF6 (Purple)
#EC4899 (Pink)
```
Colors assigned in order of joining. If user leaves and rejoins, they get the same color.

### Share Button
- Position: Top-right, before avatars
- Opens share modal:
  - Copy link (with permission level selector: View / Comment / Edit)
  - Invite by email
  - Public/Private toggle
  - Embed code generation
  - Export options (PNG, SVG, PDF, JSON)

### Real-time Sync Architecture
- WebSocket connection for live updates
- Operational Transform or CRDT for conflict resolution
- Debounced cursor positions (50ms)
- Batched property changes (100ms)
- Optimistic UI: changes appear instantly for the actor, sync to others within 100-200ms
- Offline support: queue changes, sync on reconnect

### Comments / Annotations
- Click "Comment" tool (or Ctrl+Shift+C)
- Click on canvas or node to place comment pin
- Comment thread opens in right sidebar "Notes" tab
- Resolve/unresolve comments
- @ mention collaborators for notifications

---

## APPENDIX A: KEYBOARD SHORTCUTS CHEAT SHEET

### General
| Shortcut | Action |
|---|---|
| Ctrl+K / Cmd+K | Command palette |
| Ctrl+Z / Cmd+Z | Undo |
| Ctrl+Shift+Z | Redo |
| Ctrl+S | Save |
| Ctrl+C / V / X | Copy / Paste / Cut |
| Ctrl+D | Duplicate |
| Ctrl+A | Select all |
| Delete / Backspace | Delete selected |
| Escape | Deselect / Cancel |
| Ctrl+G | Group selection |
| Ctrl+Shift+G | Ungroup |
| F2 | Rename / Edit label |
| ? | Show shortcut cheat sheet |

### Tools
| Shortcut | Tool |
|---|---|
| V | Select |
| H / Space (hold) | Pan / Hand |
| C | Connect (draw edge) |
| T | Text |
| R | Rectangle |
| S | Shapes menu |
| P | Pen / Freehand |
| E | Eraser |
| I or Ctrl+I | Insert component |

### Canvas
| Shortcut | Action |
|---|---|
| Ctrl+= | Zoom in |
| Ctrl+- | Zoom out |
| Ctrl+0 | Zoom to 100% |
| Ctrl+1 | Zoom to fit |
| Ctrl+2 | Zoom to selection |
| Scroll | Vertical pan |
| Ctrl+Scroll | Zoom |
| Shift+Scroll | Horizontal pan |

### Simulation
| Shortcut | Action |
|---|---|
| Space | Play / Pause simulation |
| Ctrl+Space | Stop simulation |
| Right Arrow | Step forward |
| Left Arrow | Step back |
| [ | Decrease speed |
| ] | Increase speed |
| B | Toggle breakpoint on node |

---

## APPENDIX B: COLOR SYSTEM FOR DATA TYPES (Inspired by Blender)

For connections/edges in Architex, use color-coded wires to indicate data type at a glance:

| Color | Hex | Data Type | Usage |
|---|---|---|---|
| Blue | #3B82F6 | HTTP / REST | Synchronous API calls |
| Green | #22C55E | Event / Message | Async messages, Kafka, pub/sub |
| Orange | #F97316 | Data / Query | Database reads/writes, SQL |
| Purple | #8B5CF6 | gRPC / Protobuf | Internal service communication |
| Cyan | #06B6D4 | WebSocket / Stream | Real-time bidirectional |
| Yellow | #EAB308 | File / Blob | S3, object storage, file transfer |
| Red | #EF4444 | Error / Failure | Error paths, circuit breaker |
| Grey | #6B7280 | Generic / Untyped | Default, unspecified |
| Pink | #EC4899 | Cache | Redis, Memcached reads/writes |

**Wire styles**:
- Solid: Synchronous / direct
- Dashed: Asynchronous / eventual
- Dotted: Optional / conditional
- Animated (moving dots): Active data flow during simulation

---

## APPENDIX C: NODE VISUAL DESIGN (Inspired by Blender + Unreal)

### Node Anatomy
```
+-- 12px border radius ----------------------------------------+
|  [Icon]  API Gateway                           [⋯] menu     |  <- Title bar (36px, colored by category)
+--------------------------------------------------------------+
|                                                              |
|  ● req/s: 10,000        Throughput: 15,000 ●               |  <- Input ports (left) / Output ports (right)
|  ● latency: 5ms         Response: JSON     ●               |
|  ● auth: JWT             Errors: 0.1%      ●               |
|                                                              |
|  [Mini sparkline chart when metrics enabled]                 |  <- Optional in-node metric preview
|                                                              |
+--------------------------------------------------------------+
```

**Title Bar Color by Category** (from Component Palette categories):
| Category | Title Bar Color |
|---|---|
| Compute | Blue #3B82F6 |
| Storage | Amber #F59E0B |
| Networking | Teal #14B8A6 |
| Messaging | Purple #8B5CF6 |
| Clients | Green #22C55E |
| Security | Red #EF4444 |
| Monitoring | Cyan #06B6D4 |
| Infrastructure | Slate #64748B |

**Port/Socket Design** (Blender-inspired):
- Small colored circles (8px diameter) on left (inputs) and right (outputs) of node
- Color matches the data type color from Appendix B
- Hover: port grows to 12px, shows tooltip with port name and type
- Compatible ports highlight when dragging a connection
- Incompatible ports dim to 30% opacity

**Node States**:
- Default: Dark surface (#1E293B), subtle border (#334155)
- Selected: Blue border (#3B82F6, 2px), slight glow
- Hovered: Lighter surface (#253349), border lightens
- Error: Red border (#EF4444), red glow pulse
- Simulating: Green glow pulse, animated throughput indicator
- Locked: Lock icon overlay, 70% opacity
- Breakpoint: Red dot in top-right corner

---

## APPENDIX D: DESIGN TOKENS

### Spacing
| Token | Value | Usage |
|---|---|---|
| space-xs | 4px | Between buttons in group, inline gaps |
| space-sm | 8px | Section padding, label gaps |
| space-md | 16px | Between groups, panel padding |
| space-lg | 24px | Section gaps, major spacing |
| space-xl | 32px | Panel top/bottom margins |

### Border Radius
| Token | Value | Usage |
|---|---|---|
| radius-sm | 4px | Buttons, inputs, badges |
| radius-md | 8px | Cards, nodes, panels |
| radius-lg | 12px | Floating toolbar, modals |
| radius-xl | 16px | Large containers |
| radius-full | 9999px | Pills, avatars |

### Shadows
| Token | Value | Usage |
|---|---|---|
| shadow-sm | 0 1px 2px rgba(0,0,0,0.3) | Buttons, small elements |
| shadow-md | 0 4px 12px rgba(0,0,0,0.4) | Floating toolbar, panels |
| shadow-lg | 0 8px 24px rgba(0,0,0,0.5) | Modals, context menus |
| shadow-glow | 0 0 12px rgba(59,130,246,0.5) | Selection, active states |

### Z-Index Layers (tldraw-inspired)
| Token | Value | Usage |
|---|---|---|
| z-canvas-bg | 100 | Canvas background, dot grid |
| z-canvas-grid | 150 | Grid overlay |
| z-canvas-edges | 200 | Connections/wires |
| z-canvas-nodes | 300 | Node shapes |
| z-canvas-overlay | 500 | Selection, handles, guides |
| z-toolbar | 1000 | Bottom toolbar |
| z-panel | 1100 | Side panels, bottom panel |
| z-context-menu | 2000 | Context menus |
| z-modal | 3000 | Modals, dialogs |
| z-toast | 4000 | Notifications |
| z-cursor | 5000 | Collaborator cursors |
| z-blocker | 10000 | Modal interaction blocker |

---

## APPENDIX E: RESPONSIVE BREAKPOINTS

| Breakpoint | Width | Layout Changes |
|---|---|---|
| Desktop XL | > 1440px | All panels visible, full toolbar |
| Desktop | 1024-1440px | All panels visible, compact spacing |
| Tablet | 768-1023px | Left palette collapses to icons, right panel overlays, bottom panel tabs collapse |
| Mobile | < 768px | Single panel mode, mobile toolbar (like Excalidraw mobile), swipe between canvas/panels |

---

## Sources

- [Figma UI3 Navigation Guide](https://help.figma.com/hc/en-us/articles/23954856027159-Navigating-UI3)
- [Figma Toolbar Documentation](https://help.figma.com/hc/en-us/articles/360041064174-Access-design-tools-from-the-toolbar)
- [Figma UI3 Redesign Blog](https://www.figma.com/blog/behind-our-redesign-ui3/)
- [Figma UI3 Design Approach](https://www.figma.com/blog/our-approach-to-designing-ui3/)
- [Figma Properties Panel](https://help.figma.com/hc/en-us/articles/360039832014-Design-prototype-and-explore-layer-properties-in-the-right-sidebar)
- [Figma Multiplayer Editing](https://medium.com/figma-design/multiplayer-editing-in-figma-8f8076c6c3a6)
- [Excalidraw GitHub Repository](https://github.com/excalidraw/excalidraw)
- [Excalidraw Actions and Toolbars (DeepWiki)](https://deepwiki.com/excalidraw/excalidraw/4.1-actions-and-toolbars)
- [tldraw SDK](https://tldraw.dev/)
- [tldraw UI and Rendering (DeepWiki)](https://deepwiki.com/tldraw/tldraw/3-ui-and-rendering)
- [tldraw User Interface Docs](https://tldraw.dev/docs/user-interface)
- [Miro Infinite Canvas](https://miro.com/online-canvas-for-design/)
- [Miro Toolbars Help](https://help.miro.com/hc/en-us/articles/360017730553-Toolbars)
- [draw.io Editor Guide](https://www.drawio.com/doc/getting-started-editor)
- [draw.io Grid Customization](https://www.drawio.com/blog/change-drawing-canvas)
- [React Flow Examples](https://reactflow.dev/examples)
- [React Flow MiniMap](https://reactflow.dev/api-reference/components/minimap)
- [Rete.js Framework](https://retejs.org/)
- [Blender Node Socket Colors](https://blendernotes.com/beyond-green-and-grey-a-guide-to-all-node-socket-colors-in-blender/)
- [Blender Node Parts Manual](https://docs.blender.org/manual/en/latest/interface/controls/nodes/parts.html)
- [Unreal Engine Blueprint Editor](https://dev.epicgames.com/documentation/en-us/unreal-engine/graph-editor-for-the-blueprints-visual-scripting-editor-in-unreal-engine)
- [Unreal Engine Blueprint Palette](https://docs.unrealengine.com/4.26/en-US/ProgrammingAndScripting/Blueprints/Editor/UIComponents/Palette)
- [VS Code User Interface](https://code.visualstudio.com/docs/getstarted/userinterface)
- [VS Code Custom Layout](https://code.visualstudio.com/docs/configure/custom-layout)
- [Steve Ruiz - Creating a Zoom UI](https://www.steveruiz.me/posts/zoom-ui)
- [Infinite Canvas Patterns](https://infinite-canvas.org/)
- [NNGroup Context Menu Guidelines](https://www.nngroup.com/articles/contextual-menus-guidelines/)
- [PatternFly Toolbar](https://www.patternfly.org/components/toolbar/design-guidelines/)
- [W3C Toolbar Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/)
- [Carbon Design System Menus](https://carbondesignsystem.com/components/menu/usage/)
- [VisuAlgo Algorithm Visualization](https://visualgo.net/en)
- [n8n Node UI Design](https://docs.n8n.io/integrations/creating-nodes/plan/node-ui-design/)
- [Awesome Node-Based UIs (GitHub)](https://github.com/xyflow/awesome-node-based-uis)
- [Grafana Panel Editor](https://grafana.com/docs/grafana/latest/panels-visualizations/panel-editor-overview/)
- [HCODX Split Panel Editor](https://hcodx.com/html-editor-with-preview)
- [Drag and Drop UX Best Practices (Smart Interface Design Patterns)](https://smart-interface-design-patterns.com/articles/drag-and-drop-ux/)
- [Microsoft Status Bar Guidelines](https://learn.microsoft.com/en-us/windows/win32/uxguide/ctrl-status-bars)
- [Collaboration Cursors (Prototypr)](https://prototypr.io/post/collaboration-tools-live-cursors)
