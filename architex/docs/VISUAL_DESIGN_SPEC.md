# Architex -- Visual Design Specification

> Implementation-ready visual specs for every canvas component.
> All values reference CSS custom properties from `globals.css` and the design system (research/22-architex-design-system.md).
> Target: React Flow nodes/edges rendered with Tailwind + inline styles.

---

## Table of Contents

1. [Node Visual Design by Category](#1-node-visual-design-by-category)
2. [Edge Animation Design](#2-edge-animation-design)
3. [Canvas Micro-Interactions](#3-canvas-micro-interactions)
4. [Simulation Visual States](#4-simulation-visual-states)
5. [Level of Detail (LOD)](#5-level-of-detail-lod)
6. [15 Component Visual Mockups](#6-component-visual-mockups)

---

## 1. Node Visual Design by Category

### 1.0 Shared Node Anatomy (BaseNode)

Every node shares this structural skeleton. Category-specific nodes add sections within the body zone.

```
Dimensions:     w-[180px] default | w-[140px] compact | w-[280px] expanded
Border:         1px solid var(--node-{category})
Border radius:  rounded-lg (8px / var(--radius-lg))
Background:     var(--surface)  (dark: hsl(228 15% 10%))
Text:           var(--foreground) (dark: hsl(220 14% 90%))
```

**Structural zones (top to bottom):**

| Zone          | Height   | Contents                                                      |
|---------------|----------|---------------------------------------------------------------|
| Header bar    | 32px     | Icon (24x24) + Label (13px/600) + State dot (8x8)            |
| Body          | auto     | Category-specific content (metrics, indicators, bars)         |
| Footer badge  | 24px opt | Throughput badge, status tags                                 |

**Handles (connection ports):**

```css
.react-flow__handle {
  width: 8px;
  height: 8px;
  background: var(--primary);         /* hsl(252 87% 67%) */
  border: 2px solid var(--surface);   /* hsl(228 15% 10%) */
}
/* 4 source + 4 target handles at Top/Right/Bottom/Left */
```

### 1.1 Universal Node States

Each state applies to ALL node types regardless of category.

#### Idle State
```css
.node--idle {
  border-color: color-mix(in srgb, var(--node-{category}) 40%, var(--border));
  opacity: 0.85;
  filter: none;
  /* State dot: var(--state-idle) = hsl(220 9% 42%) */
}
/* No animation. Dim border at 40% blend with default border color. */
```

#### Active State
```css
.node--active {
  border-color: var(--node-{category});
  opacity: 1;
  /* State dot: var(--state-active) = hsl(217 91% 60%) */
}
/* Glow pulse animation: */
@keyframes node-active-pulse {
  0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--node-{category}) 25%, transparent); }
  50%      { box-shadow: 0 0 8px 2px color-mix(in srgb, var(--node-{category}) 25%, transparent); }
}
/* animation: node-active-pulse 2s ease-in-out infinite; */
```

#### Error State
```css
.node--error {
  border-color: var(--state-error);  /* hsl(0 72% 51%) */
  /* State dot: var(--state-error) = hsl(0 72% 51%) */
}
@keyframes node-error-flash {
  0%, 100% { box-shadow: 0 0 0 0 transparent; }
  15%, 30% { box-shadow: 0 0 12px 3px color-mix(in srgb, var(--state-error) 35%, transparent); }
}
/* animation: node-error-flash 1.5s ease-in-out infinite; */
/* Flash twice quickly then pause. Attention-grabbing but not seizure-inducing. */
```

#### Warning / Degraded State
```css
.node--warning {
  border-color: var(--state-warning);  /* hsl(38 92% 50%) */
  /* State dot: var(--state-warning) = hsl(38 92% 50%) */
}
@keyframes node-warning-pulse {
  0%, 100% { box-shadow: 0 0 0 0 transparent; }
  50%      { box-shadow: 0 0 6px 1px color-mix(in srgb, var(--state-warning) 20%, transparent); }
}
/* animation: node-warning-pulse 2.5s ease-in-out infinite; */
/* Slower, gentler amber pulse compared to error. */
```

#### Processing State
```css
.node--processing {
  border-color: var(--state-processing);  /* hsl(271 81% 56%) */
  /* State dot: var(--state-processing) = hsl(271 81% 56%) */
}
/* Rotating border segment animation (like a spinner on the border): */
@keyframes node-processing-spin {
  to { --border-angle: 360deg; }
}
/* Uses conic-gradient border with a bright arc that rotates. Duration: 1.5s linear infinite. */
```

#### Hover State (all nodes)
```css
.node:hover {
  transform: scale(1.02);
  transition: transform 150ms var(--ease-out), box-shadow 150ms var(--ease-out);
  border-color: color-mix(in srgb, var(--node-{category}) 100%, white 15%);
  /* Slightly brighter border -- 15% white mix */
  box-shadow: 0 2px 8px 0 rgba(0,0,0,0.3);
  cursor: grab;
}
/* Tooltip appears after 500ms showing: label, component type, key metric values. */
```

#### Selected State
```css
.node--selected {
  ring: 2px solid var(--ring);  /* hsl(252 87% 67%) */
  box-shadow: 0 0 12px 2px color-mix(in srgb, var(--node-{category}) 35%, transparent);
  /* Elevated shadow for perceived depth. */
  /* z-index bump to ensure selected node renders above siblings. */
}
```

### 1.2 Size Variations

| Size       | Width   | Visible Sections                                    | When Used                  |
|------------|---------|-----------------------------------------------------|----------------------------|
| Compact    | 140px   | Header only (icon + label + dot)                    | Dense diagrams, LOD 30-60% |
| Default    | 180px   | Header + throughput badge                            | Normal canvas view         |
| Expanded   | 280px   | Header + full metrics panel + all indicators         | Selected node detail view  |

---

### 1.3 Compute Nodes

**Category color:** `var(--node-compute)` = `hsl(217 91% 60%)` (Blue)

**Header bar background:** `color-mix(in srgb, var(--node-compute) 12%, transparent)`

Components in this category: Web Server, App Server, Serverless Function, Container, Worker, Kubernetes Pod

#### Icon Specifications

| Component         | Lucide Icon      | Size | Color                     |
|-------------------|------------------|------|---------------------------|
| Web Server        | `Globe`          | 16px | `var(--node-compute)`     |
| App Server        | `Server`         | 16px | `var(--node-compute)`     |
| Serverless        | `Zap`            | 16px | `var(--node-compute)`     |
| Container         | `Container`      | 16px | `var(--node-compute)`     |
| Worker            | `Cog`            | 16px | `var(--node-compute)`     |
| K8s Pod           | `Hexagon`        | 16px | `var(--node-compute)`     |

#### Inline Metrics Display

```
+------------------------------------------+
| [icon]  Web Server               [*]     |  <- header 32px
|------------------------------------------|
|  [=======----------]  72% CPU            |  <- utilization bar
|  12.4K rps   |   4.2ms p99               |  <- throughput + latency
+------------------------------------------+
```

**Utilization bar:**
```css
.utilization-bar {
  height: 4px;
  border-radius: 2px;
  background: var(--border);  /* track */
}
.utilization-bar__fill {
  height: 4px;
  border-radius: 2px;
  background: var(--node-compute);
  /* Color shifts at thresholds: */
  /* 0-70%:  var(--node-compute)   blue    */
  /* 70-90%: var(--state-warning)  amber   */
  /* 90%+:   var(--state-error)    red     */
  transition: width 400ms var(--ease-emphasized), background-color 300ms ease;
}
```

**Throughput badge:**
```css
.metric-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;       /* --text-xs equivalent */
  font-weight: 500;
  font-family: var(--font-mono);
  background: color-mix(in srgb, var(--node-compute) 10%, transparent);
  color: var(--node-compute);
}
```

**Latency badge (right of throughput):**
```css
.latency-badge {
  /* Same structure as metric-badge */
  /* Color logic: */
  /* < 50ms:   var(--state-success)  green   */
  /* 50-200ms: var(--state-warning)  amber   */
  /* > 200ms:  var(--state-error)    red     */
}
```

---

### 1.4 Storage Nodes

**Category color:** `var(--node-storage)` = `hsl(142 71% 45%)` (Green)

**Header bar background:** `color-mix(in srgb, var(--node-storage) 12%, transparent)`

Components: PostgreSQL, Redis, MongoDB, Cassandra, S3, Elasticsearch

#### Icon Specifications

| Component       | Lucide Icon      | Size | Color                     |
|-----------------|------------------|------|---------------------------|
| PostgreSQL      | `Database`       | 16px | `var(--node-storage)`     |
| Redis           | `Zap`            | 16px | `var(--node-storage)`     |
| MongoDB         | `FileJson`       | 16px | `var(--node-storage)`     |
| Cassandra       | `Database`       | 16px | `var(--node-storage)`     |
| S3              | `HardDrive`      | 16px | `var(--node-storage)`     |
| Elasticsearch   | `Search`         | 16px | `var(--node-storage)`     |

#### Read/Write Activity Indicator

Positioned at the right edge of the header bar, 2 tiny animated bars.

```css
.rw-indicator {
  display: flex;
  gap: 2px;
  align-items: flex-end;
  height: 12px;
  width: 12px;
}
.rw-indicator__bar {
  width: 4px;
  border-radius: 1px;
  background: var(--node-storage);
}
.rw-indicator__bar--read {
  /* Animate height: 4px -> 12px -> 4px, 800ms ease-in-out infinite */
  /* Represents read ops. Left bar. */
}
.rw-indicator__bar--write {
  /* Animate height: 8px -> 4px -> 8px, 800ms ease-in-out infinite (offset 400ms) */
  /* Represents write ops. Right bar. Staggered from read for visual interest. */
}
/* When idle: both bars at 4px, no animation, opacity 0.4 */
```

#### Storage Capacity Bar

Appears in the body zone. Shows disk/memory usage as a progress bar.

```
+------------------------------------------+
| [icon]  PostgreSQL               [*]  |||  <- header + r/w bars
|------------------------------------------|
|  Storage  [==============--------] 72%   |  <- capacity bar
|  Replicas:  [o] [o] [o]                  |  <- replication badge
|  8.2K qps                                |  <- query rate badge
+------------------------------------------+
```

**Capacity bar spec:**
```css
.capacity-bar {
  height: 6px;
  border-radius: 3px;
  background: color-mix(in srgb, var(--node-storage) 15%, var(--border));
  margin: 4px 12px;
}
.capacity-bar__fill {
  height: 6px;
  border-radius: 3px;
  transition: width 400ms var(--ease-emphasized);
  /* Color thresholds: */
  /* 0-70%:  var(--node-storage)    green  */
  /* 70-85%: var(--state-warning)   amber  */
  /* 85%+:   var(--state-error)     red    */
}
```

#### Replication Badge

Small dots representing replica count, displayed inline.

```css
.replica-dots {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 2px 12px;
}
.replica-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--node-storage);
}
.replica-dot--primary {
  /* Slightly larger: 8px. Filled solid. */
  width: 8px;
  height: 8px;
}
.replica-dot--replica {
  /* Standard 6px. */
  opacity: 0.7;
}
.replica-dot--syncing {
  /* Pulsing opacity animation 0.5 -> 1.0, 1s ease-in-out infinite */
}
.replica-dot--down {
  background: var(--state-error);
}
/* Label "Replicas: " in 10px, var(--foreground-muted), font-weight 400 */
```

---

### 1.5 Messaging Nodes

**Category color:** `var(--node-messaging)` = `hsl(25 95% 53%)` (Orange)

**Header bar background:** `color-mix(in srgb, var(--node-messaging) 12%, transparent)`

Components: Kafka, RabbitMQ, SQS, Google Pub/Sub

#### Icon Specifications

| Component       | Lucide Icon        | Size | Color                      |
|-----------------|--------------------|------|----------------------------|
| Kafka           | `ListOrdered`      | 16px | `var(--node-messaging)`    |
| RabbitMQ        | `MessageSquare`    | 16px | `var(--node-messaging)`    |
| SQS             | `Inbox`            | 16px | `var(--node-messaging)`    |
| Pub/Sub         | `Radio`            | 16px | `var(--node-messaging)`    |

#### Queue Depth Indicator

A fill-level visualization inside the node body. Renders as a rectangular "tank" that fills from bottom to top.

```
+------------------------------------------+
| [icon]  Kafka Topic              [*]     |  <- header
|------------------------------------------|
|  Queue: [       |||||||||||||]  84%      |  <- fill level
|  ~~/\/\~~~/\~~~  1.2K msg/s             |  <- sparkline + rate
|  Consumer lag: 342   [!]                 |  <- lag warning
+------------------------------------------+
```

**Queue depth fill:**
```css
.queue-depth {
  width: 80px;
  height: 16px;
  border: 1px solid color-mix(in srgb, var(--node-messaging) 40%, transparent);
  border-radius: 3px;
  background: color-mix(in srgb, var(--node-messaging) 8%, transparent);
  overflow: hidden;
  position: relative;
}
.queue-depth__fill {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: color-mix(in srgb, var(--node-messaging) 50%, transparent);
  border-radius: 0 0 2px 2px;
  transition: height 300ms var(--ease-emphasized);
  /* Height is percentage of queue capacity. */
  /* Color thresholds: */
  /* 0-60%:  var(--node-messaging) at 50% mix  */
  /* 60-80%: var(--state-warning) at 50% mix   */
  /* 80%+:   var(--state-error) at 50% mix     */
}
```

#### Message Rate Sparkline

A tiny inline SVG sparkline showing the last 20 data points of message throughput.

```css
.msg-sparkline {
  width: 60px;
  height: 16px;
  display: inline-block;
  vertical-align: middle;
}
.msg-sparkline path {
  fill: none;
  stroke: var(--node-messaging);
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.msg-sparkline .area-fill {
  fill: color-mix(in srgb, var(--node-messaging) 15%, transparent);
  stroke: none;
}
/* SVG viewBox: "0 0 60 16". Polyline of 20 points, x spaced 3px apart. */
/* On update: new point slides in from right, oldest drops off left. transition 200ms. */
```

#### Consumer Lag Warning

```css
.consumer-lag {
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--foreground-muted);
  padding: 2px 12px;
}
.consumer-lag--warn {
  color: var(--state-warning);
}
.consumer-lag__icon {
  /* Lucide AlertTriangle, 12px, color: var(--state-warning) */
  /* Shown when lag > threshold (configurable, default 1000) */
  display: inline-block;
  margin-left: 4px;
}
```

---

### 1.6 Networking Nodes

**Category color:** `var(--node-networking)` = `hsl(271 81% 56%)` (Purple)

**Header bar background:** `color-mix(in srgb, var(--node-networking) 12%, transparent)`

Components: Load Balancer (L4/L7), API Gateway, CDN, DNS, Reverse Proxy, Rate Limiter

#### Icon Specifications

| Component       | Lucide Icon      | Size | Color                       |
|-----------------|------------------|------|-----------------------------|
| Load Balancer   | `GitBranch`      | 16px | `var(--node-networking)`    |
| API Gateway     | `Shield`         | 16px | `var(--node-networking)`    |
| CDN             | `Globe2`         | 16px | `var(--node-networking)`    |
| DNS             | `Globe`          | 16px | `var(--node-networking)`    |
| Rate Limiter    | `Filter`         | 16px | `var(--node-networking)`    |
| Circuit Breaker | `ZapOff`         | 16px | `var(--node-networking)`    |

#### Connection Count Badge

```
+------------------------------------------+
| [icon]  Load Balancer (L7)       [*]     |
|------------------------------------------|
|  Connections: 12.4K    [algo: RR]        |  <- count + algorithm
|  [o] [o] [o] [x] [o]  4/5 healthy       |  <- backend health dots
|  8.2K rps                                |
+------------------------------------------+
```

**Connection count:**
```css
.conn-count {
  font-size: 10px;
  font-family: var(--font-mono);
  font-weight: 600;
  color: var(--node-networking);
  padding: 0 12px;
}
```

#### Algorithm Indicator Badge

```css
.algo-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 9px;
  font-family: var(--font-mono);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  background: color-mix(in srgb, var(--node-networking) 12%, transparent);
  color: color-mix(in srgb, var(--node-networking) 100%, white 20%);
}
/* Values: "RR" (round-robin), "LC" (least-conn), "WRR" (weighted), "IP" (ip-hash) */
```

#### Backend Health Check Dots

A row of small circles, one per known backend. Green = healthy, red = down.

```css
.health-dots {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 4px 12px 2px;
}
.health-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  transition: background 200ms ease;
}
.health-dot--healthy {
  background: var(--state-success);  /* hsl(142 71% 45%) */
}
.health-dot--unhealthy {
  background: var(--state-error);    /* hsl(0 72% 51%) */
  /* Gentle pulse animation when newly failed: */
  animation: health-dot-alert 1s ease-in-out 3;
}
.health-dot--draining {
  background: var(--state-warning);  /* hsl(38 92% 50%) */
  opacity: 0.6;
}
.health-summary {
  font-size: 10px;
  color: var(--foreground-muted);
  margin-left: 6px;
}
/* Example: "4/5 healthy" in 10px muted text */
```

---

### 1.7 Security Nodes

**Category color:** `var(--node-security)` = `hsl(0 72% 51%)` (Red)

**Header bar background:** `color-mix(in srgb, var(--node-security) 12%, transparent)`

Components: Auth Service, Firewall, WAF, Token Service, Secret Manager

Icon specs follow the same pattern: 16px lucide icon in `var(--node-security)` color.

---

### 1.8 Observability Nodes

**Category color:** `var(--node-observability)` = `hsl(38 92% 50%)` (Amber/Gold)

**Header bar background:** `color-mix(in srgb, var(--node-observability) 12%, transparent)`

Components: Prometheus, Grafana, Jaeger, ELK Stack, Alertmanager

---

### 1.9 Client Nodes

**Category color:** `var(--node-client)` = `hsl(199 89% 48%)` (Cyan)

**Header bar background:** `color-mix(in srgb, var(--node-client) 12%, transparent)`

Components: Web Client (Browser), Mobile Client, Desktop Client, IoT Device

---

### 1.10 Processing Nodes

**Category color:** `var(--node-processing)` = `hsl(340 82% 52%)` (Pink)

**Header bar background:** `color-mix(in srgb, var(--node-processing) 12%, transparent)`

Components: Flink, Spark, MapReduce, ETL Pipeline

---

## 2. Edge Animation Design

### 2.1 Edge Type Visual Styles (current implementation)

| Edge Type       | Stroke Color              | Dash Pattern   | Semantic Meaning              |
|-----------------|---------------------------|----------------|-------------------------------|
| `http`          | `hsl(217 91% 60%)`       | solid          | Synchronous HTTP/REST         |
| `grpc`          | `hsl(271 81% 56%)`       | solid          | Synchronous gRPC              |
| `graphql`       | `hsl(340 82% 52%)`       | solid          | GraphQL queries               |
| `websocket`     | `hsl(142 71% 45%)`       | `6 3`          | Persistent WebSocket          |
| `message-queue` | `hsl(25 95% 53%)`        | `8 4`          | Async queue (Kafka, RabbitMQ) |
| `event-stream`  | `hsl(38 92% 50%)`        | `4 4`          | Async event stream            |
| `db-query`      | `hsl(142 71% 45%)`       | solid          | Database read/write           |
| `cache-lookup`  | `hsl(199 89% 48%)`       | solid          | Cache get/set                 |
| `replication`   | `hsl(220 9% 42%)`        | `3 3`          | DB replication / sync         |

### 2.2 Particle Flow System

Particles are small circles that travel along the edge path during simulation. They encode throughput and latency visually.

**Particle base spec:**
```css
.edge-particle {
  r: 2.5;           /* SVG circle radius, 5px diameter */
  fill: {edge-stroke-color};
  opacity: 0.9;
  filter: drop-shadow(0 0 2px {edge-stroke-color});
}
```

**Particle motion:**
```
- Path:       Follow the SVG bezier path of the edge
- Animation:  CSS offset-path + offset-distance (0% -> 100%)
- Duration:   Base 2s, adjusted by latency encoding (see below)
- Easing:     linear (constant speed along path)
- Direction:  source -> target (one-way)
```

**Throughput encoding (particle count):**

| Throughput Range  | Particles Visible on Edge | Spacing (% of path)  |
|-------------------|--------------------------|----------------------|
| < 100 rps         | 1                        | single particle      |
| 100-1K rps        | 2                        | 50% apart            |
| 1K-10K rps        | 3                        | 33% apart            |
| 10K-100K rps      | 5                        | 20% apart            |
| > 100K rps        | 8                        | 12.5% apart          |

**Latency encoding (particle speed):**

| Latency Range    | Animation Duration | Visual Interpretation           |
|------------------|--------------------|---------------------------------|
| < 10ms           | 0.8s               | Very fast-moving particles      |
| 10-50ms          | 1.2s               | Fast                            |
| 50-200ms         | 2.0s               | Normal                          |
| 200-500ms        | 3.0s               | Noticeably slow                 |
| > 500ms          | 4.5s               | Very slow, visually sluggish    |

**Particle color by data type:**

| Context             | Particle Color                    |
|---------------------|-----------------------------------|
| Normal request      | Same as edge stroke color         |
| Successful response | `var(--state-success)` green      |
| Error response      | `var(--state-error)` red          |
| Cache hit           | `var(--node-client)` cyan         |
| Cache miss          | `var(--state-warning)` amber      |

### 2.3 Error Particles

```css
.edge-particle--error {
  r: 3;             /* Slightly larger: 6px diameter */
  fill: var(--state-error);   /* hsl(0 72% 51%) */
  opacity: 1.0;
  filter: drop-shadow(0 0 4px var(--state-error));
  /* Pulsing radius animation: r 3 -> 4 -> 3, 600ms ease-in-out infinite */
}
/* Error particles have a trailing glow effect -- a second circle following 10% behind
   with r: 6, opacity: 0.15, same color. Creates a "comet tail." */
```

### 2.4 Protocol Labels

Labels appear at the midpoint of the edge path, sitting on a small pill-shaped background.

```css
.edge-label {
  position: absolute;
  transform: translate(-50%, -50%);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  font-family: var(--font-mono);
  background: var(--surface);
  border: 1px solid {edge-stroke-color};
  color: {edge-stroke-color};
  pointer-events: auto;
  /* Show on hover or when edge is selected */
  opacity: 0;
  transition: opacity 150ms ease;
}
.edge:hover .edge-label,
.edge--selected .edge-label {
  opacity: 1;
}
/* Content examples: "HTTP 200", "gRPC", "GraphQL", "ws://", "Kafka", "42ms" */
```

**Latency sub-label (already implemented):**
When `data.latency` is set, a latency label renders at the edge midpoint:
```
background: var(--surface)
border: 1px solid {edge stroke color}
color: {edge stroke color}
font: 10px / mono / 500
padding: 2px 6px
border-radius: 4px (rounded-md)
```

### 2.5 Queue Edge (Message-Queue Type)

For `message-queue` type edges, a small queue icon renders at the midpoint of the edge.

```css
.edge-queue-icon {
  /* Positioned at edge midpoint (labelX, labelY) */
  width: 20px;
  height: 14px;
  background: var(--surface);
  border: 1px solid var(--node-messaging);
  border-radius: 3px;
  /* Contains 3 tiny horizontal lines (2px tall, 12px wide, 2px gap) */
  /* representing stacked messages. */
  /* When queue has messages: lines animate in from left (slide-in 300ms staggered). */
  /* When queue is empty: only the border box shows. */
}
.edge-queue-icon__message {
  width: 12px;
  height: 2px;
  background: var(--node-messaging);
  border-radius: 1px;
  opacity: 0.6;
}
/* Message count label below: "342 msgs" in 9px mono, var(--foreground-muted) */
```

---

## 3. Canvas Micro-Interactions

### 3.1 Node Drag

```
Trigger:    mousedown on node
Physics:    Spring-based (stiffness: 600, damping: 40 -- "stiff" config)
Cursor:     cursor: grabbing
Visual:     
  - Node lifts: box-shadow deepens to var(--shadow-lg)
  - Node opacity: 0.92 (slight transparency to see grid beneath)
  - Snap-to-grid: when within 4px of grid line, snap with a subtle 
    1px bright line flash at the snap point
  - Grid snap feedback: brief flash of grid intersection point
    (8px circle, var(--primary) at 30% opacity, 200ms fade-out)
Drop:       
  - Spring settle animation (stiffness: 400, damping: 30 -- "snappy")
  - Shadow returns to default
  - Opacity returns to 1.0
```

### 3.2 Connection Creation

```
Trigger:    Drag from any handle (port)
Line:       
  - Animated dashed line: stroke-dasharray "6 4", animated dash flow
  - Color: var(--primary) at 60% opacity
  - Stroke width: 2px
  - Follows cursor position with smooth interpolation
  
Valid target:
  - Handle scales to 1.5x (12px) with transition 150ms ease-out
  - Handle color: var(--state-success)
  - Green glow ring: 0 0 0 4px color-mix(in srgb, var(--state-success) 30%, transparent)
  - Entire target node border brightens to var(--state-success) at 40%

Invalid target:
  - Handle stays default
  - If hovering a node of same type (self-loop prevention):
    Handle color: var(--state-error)
    Red glow: 0 0 0 4px color-mix(in srgb, var(--state-error) 30%, transparent)

Connection made:
  - Line solidifies: dasharray removed, stroke-width transitions to 2px
  - Brief "connect" animation: particles burst from connection point 
    (8 particles, 3px radius, category color, explode outward 150ms, fade 200ms)
  
Connection cancelled:
  - Line retracts back to origin handle (200ms ease-in)
  - Fade out simultaneously
```

### 3.3 Node Deletion

```
Trigger:    Delete key or context menu "Remove"
Animation:  
  - Scale: 1.0 -> 0.85 (200ms ease-in)
  - Opacity: 1.0 -> 0.0 (200ms ease-in, stagger 50ms after scale starts)
  - Connected edges: fade out simultaneously (150ms)
  - After removal: connected nodes' handles reset to default color
Duration:   Total 250ms
Easing:     var(--ease-in) = cubic-bezier(0.32, 0, 0.67, 0)
```

### 3.4 Node Add (from palette drag)

```
Trigger:    Drop from sidebar palette onto canvas
Animation:
  - Initial: scale(0.8), opacity(0)
  - Final: scale(1.0), opacity(1.0)
  - Spring: "bouncy" (stiffness: 300, damping: 15)
  - Duration: ~300ms (spring-controlled)
  - Slight overshoot to 1.03 then settle to 1.0
Drop zone:
  - Canvas shows a dashed rectangle preview (2px dashed var(--primary) at 30%)
  - Preview rectangle matches node dimensions (180x80)
```

### 3.5 Zoom Transitions

```
Easing:     var(--ease-emphasized) = cubic-bezier(0.2, 0, 0, 1)
Duration:   300ms for discrete zoom steps (ctrl+scroll)
            Real-time for pinch/scroll (no additional easing, native)
Fit-to-view:  500ms with var(--ease-emphasized)
Zoom-to-node: 400ms with var(--ease-emphasized-out)
```

### 3.6 Selection Box

```css
.react-flow__selection {
  background: var(--canvas-selection);  /* hsla(252 87% 67% / 0.15) */
  border: 1px dashed var(--primary);    /* hsl(252 87% 67%) */
  border-radius: 2px;
}
/* As selection box grows, selected nodes get: */
/*   border-color transition to var(--ring) */
/*   Subtle highlight: box-shadow: 0 0 0 1px var(--ring) at 40% */
```

---

## 4. Simulation Visual States

### 4.1 Idle (simulation not started)

```
All nodes:
  - Border: category color at 40% blend with var(--border)
  - State dot: var(--state-idle) = hsl(220 9% 42%)
  - No animations running
  - Metrics display: "--" placeholder in var(--foreground-muted)
  
All edges:
  - Static lines, no particle animation
  - Stroke: default edge type color at 70% opacity
  - No dash animation

Status bar:
  - Background: var(--statusbar)
  - Text: "Ready" in var(--statusbar-foreground)
  - No pulsing indicator

Canvas:
  - Dot grid visible: var(--canvas-dot)
  - No ambient animations
```

### 4.2 Running (simulation active)

```
Status bar:
  - Green pulsing dot: 8px, var(--state-success), pulse animation 1.5s
  - Text: "Simulating... Step 42/100" in var(--state-success)
  
All nodes:
  - Borders at full category color opacity
  - State dots reflect real-time state
  - Metrics update with counter animation (400ms ease-out per update)
  - Utilization-based glow:
    0-50%:   No glow
    50-75%:  Subtle glow: 0 0 4px 1px {category-color} at 15%
    75-90%:  Medium glow: 0 0 8px 2px var(--state-warning) at 20%
    90%+:    Strong glow: 0 0 12px 3px var(--state-error) at 25%
  
All edges:
  - Particles flowing (see section 2.2)
  - Throughput-proportional particle count
  - Latency-proportional particle speed
  - Dash animation active on async edges (message-queue, event-stream, websocket)

Canvas:
  - Slight ambient warmth: background shifts from var(--canvas-bg) to
    color-mix(in srgb, var(--canvas-bg) 98%, var(--state-success) 2%)
    (barely perceptible, subconscious "alive" feel)
```

### 4.3 Paused

```
Status bar:
  - Amber pulsing dot: 8px, var(--state-warning), pulse animation 2.5s (slow)
  - Text: "Paused at Step 42" in var(--state-warning)

All animations:
  - Frozen in place (animation-play-state: paused)
  - Particles stop mid-path
  - Sparklines freeze
  - R/W bars freeze
  - Node glow freezes at current intensity

Visual overlay:
  - Subtle diagonal stripes pattern over entire canvas at 3% opacity:
    repeating-linear-gradient(45deg, transparent, transparent 10px, 
    var(--state-warning) 10px, var(--state-warning) 11px)
    opacity: 0.03
  - Communicates "paused" without obscuring content
```

### 4.4 Error (simulation encountered failure)

```
Error nodes:
  - node-error-flash animation active (see section 1.1)
  - Border: 2px solid var(--state-error)
  - State dot: var(--state-error), larger (10px), pulsing

Error edges:
  - Stroke color transitions to var(--state-error)
  - Red error particles flowing (see section 2.3)
  - Normal particles stop

Error toast:
  - Slides in from top-right: slideY(-100%) -> 0, 300ms spring.smooth
  - Background: var(--error-subtle-bg) (#1F1315)
  - Border: 1px solid var(--error-border) (#3C2024)
  - Border-left: 3px solid var(--state-error)
  - Icon: AlertTriangle 16px, var(--error-text) (#FF6369)
  - Title: 13px / 600, var(--error-text)
  - Body: 12px / 400, var(--foreground)
  - Dismiss: 16px X icon, var(--foreground-muted)
  - Auto-dismiss after 8s with fade-out (300ms)
  - Max width: 360px
  - Border-radius: 8px
  - Shadow: var(--shadow-lg)

Status bar:
  - Red pulsing dot: 8px, var(--state-error), pulse 1s
  - Text: "Error at [NodeName]: [message]" in var(--state-error)
```

---

## 5. Level of Detail (LOD)

LOD system adjusts rendering complexity based on zoom level to maintain performance and readability.

### 5.1 Full Detail (zoom > 60%)

Everything visible.

```
Node renders:
  - Icon: 16px, category color
  - Label: 13px / 600, truncated with ellipsis at node width
  - Metrics section: all badges, bars, sparklines visible
  - State dot: 8px, animated per state
  - Handles: 8px diameter, visible at edges
  - Category-specific indicators (health dots, R/W bars, queue fill, etc.)
  - Hover tooltip enabled

Edge renders:
  - Full stroke with type-specific dash pattern
  - Particles visible (during simulation)
  - Protocol labels visible on hover/selection
  - Latency labels visible

Performance:
  - All CSS animations active
  - All SVG sparklines rendered
  - Full event handlers
```

### 5.2 Simplified (zoom 30% - 60%)

Reduced detail for overview.

```
Node renders:
  - Colored rectangle: category fill color at 20% mix
  - Border: 1px solid category color
  - Label: 11px / 500, single line, centered
  - NO icon
  - NO metrics section
  - NO state indicators (bars, dots, sparklines)
  - NO handles (hidden, but still functional for connections)
  - State communicated via border color only (error = red border, etc.)
  - Border-radius: 6px
  - Fixed size: 120px x 40px

Edge renders:
  - Simplified stroke: 1.5px, edge color
  - NO particles (performance optimization)
  - NO labels
  - Dash pattern preserved for async types

Performance:
  - CSS animations reduced to state transitions only
  - No SVG elements rendered inside nodes
  - Reduced event handler surface
```

### 5.3 Dot View (zoom < 30%)

Maximum density view for large architectures.

```
Node renders:
  - Colored circle only: 12px diameter
  - Fill: category color at 60% opacity
  - Border: 1px solid category color
  - NO text of any kind
  - NO handles visible
  - State: error nodes get red fill, warning get amber
  - On hover: tooltip shows node label (appears immediately, no 500ms delay)

Edge renders:
  - Thin line: 1px, edge color at 50% opacity
  - NO dash patterns
  - NO particles
  - NO labels

Performance:
  - Minimal DOM nodes per canvas element
  - Near-zero animation overhead
  - Optimized for 100+ node diagrams
```

### 5.4 LOD Transition

```
Transition between LOD levels:
  - Crossfade: 200ms ease-out
  - Elements fade out (opacity 1 -> 0, 100ms)
  - New LOD level fades in (opacity 0 -> 1, 100ms)
  - Staggered by 50ms so it feels smooth, not a hard switch
  - Hysteresis zone: 5% zoom buffer to prevent flicker at boundaries
    (e.g., transitions to simplified at 58% when zooming out,
     but back to full at 63% when zooming in)
```

---

## 6. Component Visual Mockups

All 15 components below are described with exact dimensions, colors, sections, and animations. Each is a specialization of BaseNode.

---

### 6.1 Load Balancer (L7)

```
Dimensions:    180px wide (default) / 280px (expanded)
Category:      networking
Category var:  var(--node-networking) = hsl(271 81% 56%)
Border:        1px solid var(--node-networking)
Background:    var(--surface)
Border-radius: 8px
```

**Sections:**

```
+--------------------------------------------------+  <- 180px wide
| [GitBranch 16px]  Load Balancer (L7)  [*state]   |  <- Header: 32px
|                    purple icon                    |
|--------------------------------------------------|
| Conns: 12.4K           [algo: RR ]               |  <- Metric row: 20px
|--------------------------------------------------|
| [o] [o] [o] [x] [o]   4/5 healthy                |  <- Health dots: 20px
|--------------------------------------------------|
| 8.2K rps                                         |  <- Throughput badge: 24px
+--------------------------------------------------+
```

**Header bar:**
```css
background: color-mix(in srgb, hsl(271 81% 56%) 12%, transparent);
padding: 8px 12px;
display: flex;
align-items: center;
gap: 8px;
border-radius: 8px 8px 0 0;
```

**Icon:** Lucide `GitBranch`, 16px, `color: var(--node-networking)`

**Label:** "Load Balancer (L7)", 12px, font-weight 600, `color: var(--foreground)`, truncate with ellipsis

**State dot:** 8px circle, top-right of header, `background: var(--state-{current})`

**Connection count row:**
```css
padding: 4px 12px;
font: 500 10px/1 var(--font-mono);
color: var(--foreground-muted);
display: flex;
justify-content: space-between;
align-items: center;
```
- Left: "Conns: " label (10px, muted) + value (10px, mono, bold, `var(--node-networking)`)
- Right: Algorithm badge (see algo-badge spec in section 1.6)

**Health dots row:**
```css
padding: 4px 12px;
display: flex;
gap: 4px;
align-items: center;
```
- Each dot: 6px circle. Healthy = `var(--state-success)`, Unhealthy = `var(--state-error)`
- Summary text: "4/5 healthy" in 10px, `var(--foreground-muted)`

**Throughput badge row:**
```css
padding: 4px 12px 8px;
text-align: center;
```
- Badge: `background: color-mix(in srgb, var(--node-networking) 10%, transparent)`, `color: var(--node-networking)`, 10px mono, 500 weight, `padding: 2px 8px`, `border-radius: 4px`

**States:**
- idle: border at 40% blend, no glow
- active: full border color, `node-active-pulse` animation
- error: border `var(--state-error)`, `node-error-flash`
- selected: `ring-2 ring-[var(--ring)]`, elevated shadow

---

### 6.2 PostgreSQL Database

```
Dimensions:    180px wide (default) / 280px (expanded)
Category:      storage
Category var:  var(--node-storage) = hsl(142 71% 45%)
```

**Sections:**

```
+--------------------------------------------------+
| [Database 16px]  PostgreSQL           [*] [|||]   |  <- Header + R/W bars
|                  green icon                       |
|--------------------------------------------------|
| Storage [==============--------] 72%  480GB       |  <- Capacity bar
|--------------------------------------------------|
| Replicas: [O] [o] [o]  1 primary + 2 read        |  <- Replication dots
|--------------------------------------------------|
| 8.2K qps  |  3.4ms p99                           |  <- Query metrics
+--------------------------------------------------+
```

**Icon:** Lucide `Database`, 16px, `color: var(--node-storage)`

**R/W Activity bars:** 2 tiny bars at header right edge (see section 1.4). Animate height when actively reading/writing.

**Capacity bar:**
```css
.pg-capacity {
  margin: 4px 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.pg-capacity__label {
  font: 400 10px var(--font-sans);
  color: var(--foreground-muted);
  width: 46px;
}
.pg-capacity__bar {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: color-mix(in srgb, var(--node-storage) 15%, var(--border));
}
.pg-capacity__fill {
  height: 6px;
  border-radius: 3px;
  background: var(--node-storage);
  transition: width 400ms var(--ease-emphasized);
  /* Thresholds: green < 70%, amber 70-85%, red > 85% */
}
.pg-capacity__value {
  font: 600 10px var(--font-mono);
  color: var(--foreground-muted);
  width: 28px;
  text-align: right;
}
```

**Replication indicator:**
```css
.pg-replicas {
  padding: 4px 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}
/* Primary dot: 8px, filled solid green */
/* Replica dots: 6px, green at 70% opacity */
/* Label: "1 primary + 2 read" in 10px muted */
/* If replica is syncing: pulsing opacity animation */
/* If replica is down: red dot */
```

**Query metrics row:**
```css
padding: 4px 12px 8px;
display: flex;
gap: 8px;
font: 500 10px var(--font-mono);
```
- Throughput: "8.2K qps" in `var(--node-storage)`
- Latency: "3.4ms p99" -- green < 50ms, amber 50-200ms, red > 200ms
- Separator: `1px solid var(--border)`, height 12px

---

### 6.3 Redis Cache

```
Dimensions:    180px wide
Category:      storage
Category var:  var(--node-storage) = hsl(142 71% 45%)
```

**Sections:**

```
+--------------------------------------------------+
| [Zap 16px]  Redis Cache              [*] [|||]   |
|             green icon                            |
|--------------------------------------------------|
| Memory [==========---------] 62%     5.0/8.0 GB  |  <- Memory bar
|--------------------------------------------------|
| Hit Rate: 94.2%  [==========-]                    |  <- Hit rate bar
|--------------------------------------------------|
| 42.1K ops/s  |  0.3ms p99                        |  <- Ops metrics
+--------------------------------------------------+
```

**Icon:** Lucide `Zap`, 16px, `color: var(--node-storage)`

**Memory usage bar:**
```css
/* Same structure as pg-capacity bar */
/* Label: "Memory" */
/* Value: "5.0/8.0 GB" in mono */
/* Fill color: green < 70%, amber 70-85%, red > 85% */
```

**Hit rate bar:**
```css
.cache-hitrate {
  padding: 4px 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.cache-hitrate__label {
  font: 400 10px var(--font-sans);
  color: var(--foreground-muted);
}
.cache-hitrate__value {
  font: 700 10px var(--font-mono);
  /* Color based on rate: */
  /* > 90%: var(--state-success) */
  /* 70-90%: var(--state-warning) */
  /* < 70%: var(--state-error) */
}
.cache-hitrate__bar {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: color-mix(in srgb, var(--node-storage) 15%, var(--border));
}
.cache-hitrate__fill {
  height: 4px;
  border-radius: 2px;
  /* Same threshold coloring as value */
  transition: width 400ms var(--ease-emphasized);
}
```

**Ops metrics:** Same pattern as PostgreSQL query metrics row.

---

### 6.4 Kafka Message Queue

```
Dimensions:    180px wide (default) / 280px (expanded)
Category:      messaging
Category var:  var(--node-messaging) = hsl(25 95% 53%)
```

**Sections:**

```
+--------------------------------------------------+
| [ListOrdered 16px]  Kafka Topic          [*]     |
|                     orange icon                   |
|--------------------------------------------------|
| Queue [       |||||||||||||] 84%  1.2M msgs      |  <- Queue depth
|--------------------------------------------------|
| Partitions: [|] [|] [|] [|] [|] [|]  P=6        |  <- Partition indicators
|--------------------------------------------------|
| Consumers:  group-a(3)  group-b(2)               |  <- Consumer groups
|--------------------------------------------------|
| ~~~/\/\~~~/\~~~  42.1K msg/s                     |  <- Sparkline + rate
| Consumer lag: 342  [!]                            |  <- Lag warning
+--------------------------------------------------+
```

**Icon:** Lucide `ListOrdered`, 16px, `color: var(--node-messaging)`

**Queue depth fill:** (see section 1.5 for full spec)

**Partition indicators:**
```css
.partitions {
  padding: 4px 12px;
  display: flex;
  gap: 3px;
  align-items: center;
}
.partition-bar {
  width: 4px;
  height: 14px;
  border-radius: 2px;
  background: var(--node-messaging);
  opacity: 0.5;
  transition: opacity 200ms ease, height 200ms ease;
}
.partition-bar--active {
  opacity: 1.0;
  /* Height varies 8-14px based on partition's relative throughput */
  /* Animate height changes smoothly */
}
.partition-bar--lagging {
  background: var(--state-warning);
}
.partition-count {
  font: 500 10px var(--font-mono);
  color: var(--foreground-muted);
  margin-left: 6px;
}
```

**Consumer groups:**
```css
.consumer-groups {
  padding: 2px 12px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.consumer-group-tag {
  padding: 1px 5px;
  border-radius: 3px;
  font: 500 9px var(--font-mono);
  background: color-mix(in srgb, var(--node-messaging) 10%, transparent);
  color: var(--node-messaging);
  /* Format: "group-name(count)" */
}
```

**Sparkline + rate:** (see section 1.5 for sparkline spec)

**Consumer lag:** (see section 1.5 for lag warning spec)

---

### 6.5 API Gateway

```
Dimensions:    180px wide
Category:      networking
Category var:  var(--node-networking) = hsl(271 81% 56%)
```

**Sections:**

```
+--------------------------------------------------+
| [Shield 16px]  API Gateway               [*]     |
|                purple icon                        |
|--------------------------------------------------|
| [JWT]  [Rate: 10K/s]  [CORS]                     |  <- Feature badges
|--------------------------------------------------|
| Routes: 24 active                                 |  <- Route count
|--------------------------------------------------|
| 18.4K rps  |  12ms p99                            |  <- Throughput
+--------------------------------------------------+
```

**Icon:** Lucide `Shield`, 16px, `color: var(--node-networking)`

**Feature badges:**
```css
.feature-badges {
  padding: 4px 12px;
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.feature-badge {
  padding: 1px 5px;
  border-radius: 3px;
  font: 600 9px var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.feature-badge--auth {
  background: color-mix(in srgb, var(--node-security) 12%, transparent);
  color: color-mix(in srgb, var(--node-security) 100%, white 30%);
  border: 1px solid color-mix(in srgb, var(--node-security) 25%, transparent);
  /* Displays: "JWT", "OAuth", "API Key", "mTLS" based on config.authType */
}
.feature-badge--rate {
  background: color-mix(in srgb, var(--node-networking) 12%, transparent);
  color: color-mix(in srgb, var(--node-networking) 100%, white 20%);
  border: 1px solid color-mix(in srgb, var(--node-networking) 25%, transparent);
  /* Displays: "Rate: {formatMetric(config.rateLimitRps)}/s" */
}
.feature-badge--cors {
  background: color-mix(in srgb, var(--state-success) 12%, transparent);
  color: var(--state-success);
  border: 1px solid color-mix(in srgb, var(--state-success) 25%, transparent);
}
```

**Route count:**
```css
padding: 2px 12px;
font: 400 10px var(--font-sans);
color: var(--foreground-muted);
/* "Routes: " label + "{count} active" in 10px mono, category color */
```

---

### 6.6 CDN

```
Dimensions:    180px wide
Category:      networking
Category var:  var(--node-networking) = hsl(271 81% 56%)
```

**Sections:**

```
+--------------------------------------------------+
| [Globe2 16px]  CDN                       [*]     |
|                purple icon                        |
|--------------------------------------------------|
| Cache Hit Rate: 94.2%  [==========-]             |  <- Hit rate bar
|--------------------------------------------------|
| Edge Locations: 50  [globe dots]                  |  <- Location count
|--------------------------------------------------|
| 124.8K rps  |  2.1ms avg                         |
+--------------------------------------------------+
```

**Icon:** Lucide `Globe2`, 16px, `color: var(--node-networking)`

**Cache hit rate bar:**
```css
/* Same structure as Redis hit rate bar */
/* Color thresholds: > 90% green, 70-90% amber, < 70% red */
```

**Edge location indicator:**
```css
.edge-locations {
  padding: 2px 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.edge-locations__count {
  font: 600 10px var(--font-mono);
  color: var(--node-networking);
}
.edge-locations__dots {
  /* 5 tiny dots (3px) in a loose cluster pattern to represent geographic spread */
  display: flex;
  gap: 2px;
}
.edge-locations__dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--node-networking);
  opacity: 0.5;
}
```

---

### 6.7 Web Client (Browser)

```
Dimensions:    180px wide
Category:      client
Category var:  var(--node-client) = hsl(199 89% 48%)
```

**Sections:**

```
+--------------------------------------------------+
| [Monitor 16px]  Web Client              [*]      |
|                 cyan icon                         |
|--------------------------------------------------|
| Users: 1.2K concurrent                            |  <- User count
|--------------------------------------------------|
| Request Rate: ~~~/\~~~  142 rps                   |  <- Sparkline + rate
+--------------------------------------------------+
```

**Icon:** Lucide `Monitor`, 16px, `color: var(--node-client)`

**User count:**
```css
padding: 4px 12px;
display: flex;
align-items: center;
gap: 6px;
```
- Icon: Lucide `Users` at 12px, `var(--foreground-muted)`
- Count: font 600 10px mono, `var(--node-client)`
- Label: "concurrent" in 10px, `var(--foreground-muted)`

**Request rate sparkline:**
```css
/* Same sparkline structure as messaging nodes (section 1.5) */
/* Color: var(--node-client) */
/* Rate badge to right: 10px mono, category color */
```

---

### 6.8 Serverless Function

```
Dimensions:    180px wide
Category:      compute
Category var:  var(--node-compute) = hsl(217 91% 60%)
```

**Sections:**

```
+--------------------------------------------------+
| [Zap 16px]  Lambda Function             [*]      |
|             blue icon                             |
|--------------------------------------------------|
| [COLD]  Timeout: 30s  Mem: 512MB                 |  <- Config badges
|--------------------------------------------------|
| [=====--]  42% utilization                        |  <- Util bar
|--------------------------------------------------|
| 2.4K invoc/s  |  120ms p99                        |
+--------------------------------------------------+
```

**Icon:** Lucide `Zap`, 16px, `color: var(--node-compute)`

**Cold start indicator:**
```css
.cold-start-badge {
  padding: 1px 5px;
  border-radius: 3px;
  font: 700 9px var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.cold-start-badge--cold {
  background: color-mix(in srgb, var(--state-warning) 15%, transparent);
  color: var(--state-warning);
  border: 1px solid color-mix(in srgb, var(--state-warning) 30%, transparent);
  /* Shown when function has not been invoked recently */
  /* Pulses gently: opacity 0.7 -> 1.0 -> 0.7, 2s ease-in-out infinite */
}
.cold-start-badge--warm {
  background: color-mix(in srgb, var(--state-success) 15%, transparent);
  color: var(--state-success);
  border: 1px solid color-mix(in srgb, var(--state-success) 30%, transparent);
  /* Shown when function is warm. Static, no animation. */
  /* Text: "WARM" */
}
```

**Config badges:** Same style as API Gateway feature badges, but in compute blue.

---

### 6.9 Elasticsearch

```
Dimensions:    180px wide
Category:      storage
Category var:  var(--node-storage) = hsl(142 71% 45%)
```

**Sections:**

```
+--------------------------------------------------+
| [Search 16px]  Elasticsearch            [*] [||] |
|                green icon                         |
|--------------------------------------------------|
| Indices: 12 [green] [green] [amber]              |  <- Index status dots
|--------------------------------------------------|
| Shards: 36/36 allocated                           |  <- Shard health
|--------------------------------------------------|
| Query Rate: ~~~/\~~~  1.8K qps  |  24ms p99      |
+--------------------------------------------------+
```

**Icon:** Lucide `Search`, 16px, `color: var(--node-storage)`

**Index status indicators:**
```css
.index-status {
  padding: 4px 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.index-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.index-dot--green {
  background: var(--state-success);  /* All shards allocated */
}
.index-dot--yellow {
  background: var(--state-warning);  /* Replicas unassigned */
  animation: index-dot-pulse 2s ease-in-out infinite;
}
.index-dot--red {
  background: var(--state-error);    /* Primary shards missing */
  animation: index-dot-alert 1s ease-in-out infinite;
}
```

**Shard health:**
```css
padding: 2px 12px;
font: 400 10px var(--font-sans);
color: var(--foreground-muted);
/* "36/36 allocated" -- green text when all allocated */
/* "34/36 allocated" -- amber text when some unassigned */
/* "30/36 allocated" -- red text when significant loss */
```

---

### 6.10 Rate Limiter

```
Dimensions:    180px wide
Category:      networking
Category var:  var(--node-networking) = hsl(271 81% 56%)
```

**Sections:**

```
+--------------------------------------------------+
| [Filter 16px]  Rate Limiter             [*]      |
|                purple icon                        |
|--------------------------------------------------|
|     Token Bucket Visualization                    |
|     +--------+                                    |
|     | oooooo |  <- tokens (fill level)            |
|     | oooooo |                                    |
|     | ...... |  <- empty slots                    |
|     +--------+                                    |
|     72/100 tokens                                 |
|--------------------------------------------------|
| Refill: 100/s  |  Rejected: 2.1%                 |
+--------------------------------------------------+
```

**Icon:** Lucide `Filter`, 16px, `color: var(--node-networking)`

**Token bucket visualization:**
```css
.token-bucket {
  width: 48px;
  height: 36px;
  margin: 4px auto;
  border: 1.5px solid color-mix(in srgb, var(--node-networking) 50%, transparent);
  border-radius: 4px 4px 6px 6px;  /* Wider at bottom like a bucket */
  background: color-mix(in srgb, var(--node-networking) 5%, transparent);
  position: relative;
  overflow: hidden;
}
.token-bucket__fill {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: color-mix(in srgb, var(--node-networking) 30%, transparent);
  transition: height 300ms var(--ease-emphasized);
  border-radius: 0 0 4px 4px;
  /* Height = (tokens / maxTokens) * 100% */
}
.token-bucket__tokens {
  /* Grid of tiny 3px circles inside the fill area */
  /* Arranged in rows, 6 per row */
  /* Color: var(--node-networking) */
  /* When a token is consumed: top-most token shrinks to 0 (150ms) and disappears */
  /* When tokens refill: new token grows from 0 at bottom-most empty slot (200ms spring) */
}
.token-bucket__label {
  text-align: center;
  font: 500 10px var(--font-mono);
  color: var(--foreground-muted);
  padding: 2px 0;
}
```

**Rejection rate:**
```css
/* "Rejected: 2.1%" */
/* Color: green if < 1%, amber 1-5%, red > 5% */
```

---

### 6.11 Auth Service

```
Dimensions:    180px wide
Category:      security
Category var:  var(--node-security) = hsl(0 72% 51%)
```

**Sections:**

```
+--------------------------------------------------+
| [KeyRound 16px]  Auth Service           [*]      |
|                  red icon                         |
|--------------------------------------------------|
| [JWT]  [OAuth 2.0]  [RBAC]                       |  <- Auth type badges
|--------------------------------------------------|
| Active Sessions: 4.2K                             |  <- Sessions count
|--------------------------------------------------|
| Auth Rate: 842 rps  |  Fail: 0.3%                |
+--------------------------------------------------+
```

**Icon:** Lucide `KeyRound`, 16px, `color: var(--node-security)`

**Auth type badges:**
```css
.auth-badges {
  padding: 4px 12px;
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.auth-badge {
  padding: 1px 5px;
  border-radius: 3px;
  font: 600 9px var(--font-mono);
  text-transform: uppercase;
  background: color-mix(in srgb, var(--node-security) 10%, transparent);
  color: color-mix(in srgb, var(--node-security) 100%, white 40%);
  border: 1px solid color-mix(in srgb, var(--node-security) 20%, transparent);
}
```

**Active sessions count:**
```css
.sessions {
  padding: 2px 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.sessions__icon {
  /* Lucide Users, 12px, var(--foreground-muted) */
}
.sessions__count {
  font: 700 10px var(--font-mono);
  color: var(--node-security);
}
/* Number animates with counter effect on update: 400ms ease-out */
```

**Auth rate + failure rate:**
```css
/* Layout: same as other metric rows */
/* Failure rate color: green < 1%, amber 1-5%, red > 5% */
```

---

### 6.12 Metrics Collector (Prometheus)

```
Dimensions:    180px wide
Category:      observability
Category var:  var(--node-observability) = hsl(38 92% 50%)
```

**Sections:**

```
+--------------------------------------------------+
| [Activity 16px]  Prometheus              [*]     |
|                  amber icon                       |
|--------------------------------------------------|
| Scrape Targets: 24/24 UP                          |  <- Target status
|--------------------------------------------------|
| [o][o][o][o][o][o][o][o]...  (target grid)        |  <- Target dots
|--------------------------------------------------|
| Ingestion: 142K samples/s                         |
| Storage: 12.4 GB / 100 GB                         |
+--------------------------------------------------+
```

**Icon:** Lucide `Activity`, 16px, `color: var(--node-observability)`

**Scrape target dots:**
```css
.scrape-targets {
  padding: 4px 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}
.scrape-target-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}
.scrape-target-dot--up {
  background: var(--state-success);
}
.scrape-target-dot--down {
  background: var(--state-error);
  /* Pulse animation when newly down */
}
.scrape-target-dot--unknown {
  background: var(--state-idle);
}
/* Max visible: 24 dots. If more targets, show "..." and count. */
/* Summary: "24/24 UP" in green, or "22/24 UP" in amber */
```

---

### 6.13 Distributed Tracer (Jaeger)

```
Dimensions:    180px wide
Category:      observability
Category var:  var(--node-observability) = hsl(38 92% 50%)
```

**Sections:**

```
+--------------------------------------------------+
| [GitCommit 16px]  Jaeger Tracing         [*]     |
|                   amber icon                      |
|--------------------------------------------------|
| Traces: 84.2K/min                                 |
|--------------------------------------------------|
| Span Depth: avg 6.2  |  max 24                    |
|--------------------------------------------------|
| Services Traced: 12                                |
| ~~~/\/\~~~/\~~~  trace rate sparkline              |
+--------------------------------------------------+
```

**Icon:** Lucide `GitCommit` (represents trace path), 16px, `color: var(--node-observability)`

**Trace count:**
```css
padding: 4px 12px;
font: 600 10px var(--font-mono);
color: var(--node-observability);
/* Value animates on update with counter effect */
```

**Span depth:**
```css
.span-depth {
  padding: 2px 12px;
  display: flex;
  gap: 8px;
  font: 400 10px var(--font-sans);
  color: var(--foreground-muted);
}
.span-depth__value {
  font-weight: 600;
  font-family: var(--font-mono);
  color: var(--node-observability);
}
```

**Services traced count:**
```css
/* Simple numeric display */
/* font: 400 10px var(--font-sans), muted label + bold mono value */
```

---

### 6.14 Object Storage (S3)

```
Dimensions:    180px wide
Category:      storage
Category var:  var(--node-storage) = hsl(142 71% 45%)
```

**Sections:**

```
+--------------------------------------------------+
| [HardDrive 16px]  S3 Object Storage      [*]    |
|                   green icon                      |
|--------------------------------------------------|
| Storage: 2.4 TB                                   |
| [==============================-----] 80%        |  <- Capacity bar
|--------------------------------------------------|
| Bandwidth: 1.2 GB/s  [IN]  0.8 GB/s  [OUT]       |  <- I/O metrics
|--------------------------------------------------|
| Objects: 142M  |  Replication: 3x                 |
+--------------------------------------------------+
```

**Icon:** Lucide `HardDrive`, 16px, `color: var(--node-storage)`

**Capacity bar:** Same spec as PostgreSQL capacity bar.

**Bandwidth I/O:**
```css
.bandwidth {
  padding: 4px 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  font: 400 10px var(--font-sans);
  color: var(--foreground-muted);
}
.bandwidth__value {
  font: 600 10px var(--font-mono);
  color: var(--node-storage);
}
.bandwidth__direction {
  padding: 0px 3px;
  border-radius: 2px;
  font: 700 8px var(--font-mono);
  text-transform: uppercase;
}
.bandwidth__direction--in {
  background: color-mix(in srgb, var(--state-success) 15%, transparent);
  color: var(--state-success);
}
.bandwidth__direction--out {
  background: color-mix(in srgb, var(--node-compute) 15%, transparent);
  color: var(--node-compute);
}
```

---

### 6.15 Stream Processor (Flink)

```
Dimensions:    180px wide (default) / 280px (expanded)
Category:      processing
Category var:  var(--node-processing) = hsl(340 82% 52%)
```

**Sections:**

```
+--------------------------------------------------+
| [Workflow 16px]  Flink Processor         [*]     |
|                  pink icon                        |
|--------------------------------------------------|
| Parallelism: [||||  ]  4/8 slots                  |  <- Slot usage
|--------------------------------------------------|
| Window: tumbling 30s  |  Trigger: count(100)      |  <- Window config
|--------------------------------------------------|
| Throughput: 42.1K evt/s                            |
| Backpressure: [====------] 42%                     |  <- Backpressure bar
+--------------------------------------------------+
```

**Icon:** Lucide `Workflow`, 16px, `color: var(--node-processing)`

**Parallelism slots:**
```css
.parallelism {
  padding: 4px 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.slot-bars {
  display: flex;
  gap: 2px;
}
.slot-bar {
  width: 4px;
  height: 14px;
  border-radius: 2px;
}
.slot-bar--active {
  background: var(--node-processing);
  /* Subtle pulsing when actively processing */
}
.slot-bar--idle {
  background: color-mix(in srgb, var(--node-processing) 20%, var(--border));
}
.slot-count {
  font: 500 10px var(--font-mono);
  color: var(--foreground-muted);
  /* "4/8 slots" */
}
```

**Window configuration badges:**
```css
.window-config {
  padding: 2px 12px;
  display: flex;
  gap: 6px;
  font: 400 10px var(--font-sans);
  color: var(--foreground-muted);
}
.window-badge {
  padding: 1px 5px;
  border-radius: 3px;
  font: 500 9px var(--font-mono);
  background: color-mix(in srgb, var(--node-processing) 10%, transparent);
  color: var(--node-processing);
}
/* Values: "tumbling 30s", "sliding 10s/5s", "session 15min" */
/* Trigger: "count(100)", "time(30s)", "delta(0.1)" */
```

**Backpressure bar:**
```css
.backpressure-bar {
  margin: 4px 12px;
  height: 4px;
  border-radius: 2px;
  background: color-mix(in srgb, var(--node-processing) 15%, var(--border));
}
.backpressure-bar__fill {
  height: 4px;
  border-radius: 2px;
  transition: width 400ms var(--ease-emphasized);
  /* Color thresholds: */
  /* 0-30%:  var(--state-success)   green   (healthy) */
  /* 30-60%: var(--state-warning)   amber   (building up) */
  /* 60%+:   var(--state-error)     red     (critical) */
}
.backpressure-label {
  font: 400 10px var(--font-sans);
  color: var(--foreground-muted);
  padding: 0 12px;
}
/* "Backpressure: 42%" -- value inherits color threshold from bar */
```

---

## Appendix A: CSS Keyframe Definitions

All animation keyframes referenced throughout this spec, collected for a single stylesheet injection.

```css
/* ── Node State Animations ── */

@keyframes node-active-pulse {
  0%, 100% { box-shadow: 0 0 0 0 var(--_glow-color, transparent); }
  50%      { box-shadow: 0 0 8px 2px var(--_glow-color, transparent); }
}

@keyframes node-error-flash {
  0%, 40%, 100% { box-shadow: 0 0 0 0 transparent; }
  10%, 25%      { box-shadow: 0 0 12px 3px color-mix(in srgb, var(--state-error) 35%, transparent); }
}

@keyframes node-warning-pulse {
  0%, 100% { box-shadow: 0 0 0 0 transparent; }
  50%      { box-shadow: 0 0 6px 1px color-mix(in srgb, var(--state-warning) 20%, transparent); }
}

@keyframes node-processing-spin {
  to { --border-angle: 360deg; }
}

/* ── Health & Activity Animations ── */

@keyframes health-dot-alert {
  0%, 100% { transform: scale(1); opacity: 1; }
  50%      { transform: scale(1.4); opacity: 0.7; }
}

@keyframes rw-bar-read {
  0%, 100% { height: 4px; }
  50%      { height: 12px; }
}

@keyframes rw-bar-write {
  0%, 100% { height: 8px; }
  50%      { height: 4px; }
}

@keyframes index-dot-pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.5; }
}

@keyframes index-dot-alert {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.6; transform: scale(1.3); }
}

@keyframes cold-start-pulse {
  0%, 100% { opacity: 0.7; }
  50%      { opacity: 1.0; }
}

/* ── Edge Animations ── */

@keyframes architex-dash-flow {
  to { stroke-dashoffset: -20; }
}

@keyframes particle-flow {
  from { offset-distance: 0%; }
  to   { offset-distance: 100%; }
}

@keyframes particle-error-pulse {
  0%, 100% { r: 3; opacity: 1; }
  50%      { r: 4; opacity: 0.8; }
}

/* ── Canvas Micro-Interaction Animations ── */

@keyframes node-add-bounce {
  from { transform: scale(0.8); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
}

@keyframes node-delete-shrink {
  from { transform: scale(1); opacity: 1; }
  to   { transform: scale(0.85); opacity: 0; }
}

@keyframes connection-burst {
  from { transform: scale(0); opacity: 1; }
  to   { transform: scale(2); opacity: 0; }
}

@keyframes grid-snap-flash {
  from { opacity: 0.3; transform: scale(1); }
  to   { opacity: 0; transform: scale(1.5); }
}

/* ── Status Bar ── */

@keyframes status-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.5; transform: scale(0.85); }
}

/* ── Reduced Motion Override ── */

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Appendix B: CSS Variable Quick Reference

Variables a frontend developer needs, grouped by usage in this spec.

```
CATEGORY COLORS:
  var(--node-compute)       hsl(217 91% 60%)   Blue
  var(--node-storage)       hsl(142 71% 45%)   Green
  var(--node-messaging)     hsl(25 95% 53%)    Orange
  var(--node-networking)    hsl(271 81% 56%)   Purple
  var(--node-security)      hsl(0 72% 51%)     Red
  var(--node-observability) hsl(38 92% 50%)    Amber
  var(--node-client)        hsl(199 89% 48%)   Cyan
  var(--node-processing)    hsl(340 82% 52%)   Pink

STATE COLORS:
  var(--state-idle)         hsl(220 9% 42%)    Gray
  var(--state-active)       hsl(217 91% 60%)   Blue
  var(--state-success)      hsl(142 71% 45%)   Green
  var(--state-warning)      hsl(38 92% 50%)    Amber
  var(--state-error)        hsl(0 72% 51%)     Red
  var(--state-processing)   hsl(271 81% 56%)   Purple

SURFACES:
  var(--background)         hsl(228 15% 7%)
  var(--surface)            hsl(228 15% 10%)
  var(--elevated)           hsl(228 15% 12%)
  var(--overlay)            hsl(228 15% 15%)
  var(--canvas-bg)          hsl(228 15% 6%)
  var(--border)             hsl(228 15% 16%)

TEXT:
  var(--foreground)         hsl(220 14% 90%)
  var(--foreground-muted)   hsl(220 10% 50%)
  var(--foreground-subtle)  hsl(220 10% 35%)

FONTS:
  var(--font-sans)          Geist, Inter, system-ui
  var(--font-mono)          Geist Mono, JetBrains Mono, monospace

MOTION:
  var(--ease-out)           cubic-bezier(0.33, 1, 0.68, 1)
  var(--ease-in)            cubic-bezier(0.32, 0, 0.67, 0)
  var(--ease-emphasized)    cubic-bezier(0.2, 0, 0, 1)
  var(--ease-emphasized-out) cubic-bezier(0.05, 0.7, 0.1, 1.0)
  Spring "snappy":          stiffness 400, damping 30
  Spring "bouncy":          stiffness 300, damping 15
  Spring "stiff":           stiffness 600, damping 40
```

---

## Appendix C: Metric Color Threshold Summary

Consistent threshold rules applied across all node types.

| Metric           | Green (good)    | Amber (warning) | Red (critical)  |
|------------------|-----------------|-----------------|-----------------|
| Utilization      | 0-70%           | 70-90%          | 90%+            |
| Storage capacity | 0-70%           | 70-85%          | 85%+            |
| Cache hit rate   | > 90%           | 70-90%          | < 70%           |
| Error rate       | < 1%            | 1-5%            | > 5%            |
| Latency (p99)    | < 50ms          | 50-200ms        | > 200ms         |
| Queue depth      | 0-60%           | 60-80%          | 80%+            |
| Backpressure     | 0-30%           | 30-60%          | 60%+            |
| Rejection rate   | < 1%            | 1-5%            | > 5%            |
| Replica health   | All up          | 1 syncing       | Any down        |

Color mapping:
```
Green:  var(--state-success)  hsl(142 71% 45%)
Amber:  var(--state-warning)  hsl(38 92% 50%)
Red:    var(--state-error)    hsl(0 72% 51%)
```

---

## Appendix D: Implementation Priority

Recommended build order for a frontend developer.

| Phase | Scope                                          | Depends On       |
|-------|-------------------------------------------------|------------------|
| 1     | Enhanced BaseNode with state animations         | Current BaseNode |
| 2     | LOD system (3 zoom tiers)                       | Phase 1          |
| 3     | Category-specific node bodies (15 components)   | Phase 1          |
| 4     | Edge particle system                            | DataFlowEdge     |
| 5     | Canvas micro-interactions (drag, connect, etc.) | React Flow hooks |
| 6     | Simulation visual states                        | Phases 1-4       |
| 7     | Expanded node view (280px detail panels)        | Phase 3          |
