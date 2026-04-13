# PHASE 8: DESKTOP APP, EXPORT, SEARCH, PLUGINS & EXTENSIONS

> **Goal:** Build the Tauri desktop app, full export suite (8+ formats), GIF recording, client-side search with command palette, plugin architecture with iframe sandboxing, multi-region visualization, sound design, micro-interactions, and external integrations (VS Code, Chrome, GitHub Actions, Slack).

---

## WHAT YOU ARE BUILDING

This phase extends Architex beyond the browser. Users get a native desktop app (5-15MB, instant startup), can export diagrams in any format (PNG, SVG, PDF, Mermaid, PlantUML, draw.io, Terraform, code), search instantly across all content, install plugins safely, and integrate with their existing toolchain (VS Code, Chrome, GitHub, Slack). This phase also adds the polish layer: sound design and micro-interactions that make the product feel alive.

---

## 1. TAURI V2 DESKTOP APP

### Architecture

```
┌──────────────────────────────────────────┐
│  Tauri App                               │
│  ┌────────────────────────────────────┐  │
│  │  WebView (platform-native)         │  │
│  │  - macOS: WebKit (WKWebView)       │  │
│  │  - Windows: WebView2 (Chromium)    │  │
│  │  - Linux: WebKitGTK               │  │
│  │                                    │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │  Next.js App (same codebase)│  │  │
│  │  │  served as static export    │  │  │
│  │  └─────────────────────────────┘  │  │
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │  Rust Backend (Tauri Core)         │  │
│  │  - File system access              │  │
│  │  - Native dialogs                  │  │
│  │  - System tray                     │  │
│  │  - Auto-updater                    │  │
│  │  - Secure storage (keyring)        │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

### Performance Targets

```
Binary size:     5-15 MB (vs Electron 150MB+)
Startup time:    <1 second
Idle RAM:        ~50-80 MB (vs Electron 200MB+)
Update size:     ~2-5 MB (delta updates)
```

### tauri.conf.json

```json
{
  "$schema": "https://raw.githubusercontent.com/nicehash/Tauri/dev/cli/schema.json",
  "app": {
    "windows": [
      {
        "title": "Architex",
        "width": 1400,
        "height": 900,
        "minWidth": 800,
        "minHeight": 600,
        "resizable": true,
        "fullscreen": false,
        "decorations": true,
        "transparent": false,
        "center": true
      }
    ],
    "security": {
      "csp": "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self' https://api.architex.dev wss://architex-collab.partykit.dev; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'"
    }
  },
  "build": {
    "distDir": "../out",
    "devUrl": "http://localhost:3000",
    "beforeDevCommand": "pnpm dev",
    "beforeBuildCommand": "pnpm build && pnpm export"
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "identifier": "dev.architex.app",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  },
  "plugins": {
    "updater": {
      "active": true,
      "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ...",
      "endpoints": ["https://releases.architex.dev/{{target}}/{{arch}}/{{current_version}}"]
    }
  }
}
```

### Rust Commands

```rust
// src-tauri/src/commands.rs
use std::fs;
use std::path::PathBuf;
use tauri::command;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct DiagramData {
    pub id: String,
    pub title: String,
    pub nodes: serde_json::Value,
    pub edges: serde_json::Value,
    pub metadata: serde_json::Value,
}

#[command]
pub async fn save_diagram(path: String, data: DiagramData) -> Result<(), String> {
    let json = serde_json::to_string_pretty(&data)
        .map_err(|e| format!("Serialization error: {}", e))?;
    fs::write(&path, json)
        .map_err(|e| format!("Write error: {}", e))?;
    Ok(())
}

#[command]
pub async fn load_diagram(path: String) -> Result<DiagramData, String> {
    let content = fs::read_to_string(&path)
        .map_err(|e| format!("Read error: {}", e))?;
    serde_json::from_str(&content)
        .map_err(|e| format!("Parse error: {}", e))
}

#[command]
pub async fn export_png(
    data: Vec<u8>,
    path: String,
) -> Result<(), String> {
    fs::write(&path, &data)
        .map_err(|e| format!("Write error: {}", e))?;
    Ok(())
}

#[command]
pub async fn get_default_save_dir() -> Result<String, String> {
    let dir = dirs::document_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("Architex");
    fs::create_dir_all(&dir)
        .map_err(|e| format!("Create dir error: {}", e))?;
    Ok(dir.to_string_lossy().to_string())
}

// Register commands in main.rs:
// tauri::Builder::default()
//     .invoke_handler(tauri::generate_handler![
//         save_diagram,
//         load_diagram,
//         export_png,
//         get_default_save_dir,
//     ])
```

### Frontend Tauri Integration

```typescript
// lib/desktop/tauri-bridge.ts
import { invoke } from '@tauri-apps/api/core';
import { save, open } from '@tauri-apps/plugin-dialog';

// Detect if running in Tauri
export const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

export async function saveToFile(diagram: DiagramData): Promise<void> {
  if (!isTauri) {
    // Fallback: browser download
    downloadJSON(diagram);
    return;
  }

  const path = await save({
    filters: [{ name: 'Architex', extensions: ['architex'] }],
    defaultPath: `${diagram.title}.architex`,
  });

  if (path) {
    await invoke('save_diagram', { path, data: diagram });
  }
}

export async function loadFromFile(): Promise<DiagramData | null> {
  if (!isTauri) return null;

  const path = await open({
    filters: [{ name: 'Architex', extensions: ['architex'] }],
    multiple: false,
  });

  if (path) {
    return invoke<DiagramData>('load_diagram', { path: path as string });
  }
  return null;
}
```

### Cross-Platform Testing

```
macOS:   Test on Apple Silicon (M1+) and Intel
         WebKit rendering quirks: test all CSS features
         Code signing: Apple Developer ID certificate
         Notarization: staple notarization ticket

Windows: Test on Windows 10 and 11
         WebView2 auto-installs if missing (evergreen)
         Code signing: EV certificate for SmartScreen
         Installer: NSIS or WiX

Linux:   Test on Ubuntu 22.04+, Fedora 38+
         WebKitGTK dependencies: libwebkit2gtk-4.1-dev
         Package: .deb, .AppImage, .rpm
         Note: WebKitGTK may lag behind WebKit features
```

---

## 2. FULL EXPORT SUITE

### JSON Export (React Flow Native)

```typescript
// lib/export/json.ts
import { toObject } from '@xyflow/react';

function exportJSON(nodes: ArchitexNode[], edges: ArchitexEdge[]): string {
  const flow = toObject();  // React Flow's native serialization
  return JSON.stringify({
    version: '1.0',
    format: 'architex',
    exportedAt: new Date().toISOString(),
    ...flow,
  }, null, 2);
}
```

### PNG/SVG Export

```typescript
// lib/export/image.ts
import { toPng, toSvg } from 'html-to-image';
// Alternative: use SnapDOM for better fidelity

async function exportPNG(
  element: HTMLElement,
  options?: { scale?: number; backgroundColor?: string }
): Promise<Blob> {
  const scale = options?.scale ?? 2;  // 2x for retina
  const dataUrl = await toPng(element, {
    pixelRatio: scale,
    backgroundColor: options?.backgroundColor ?? '#0C0D0F',
    filter: (node) => {
      // Exclude UI controls, only capture canvas content
      const excludeClasses = ['react-flow__controls', 'react-flow__minimap', 'react-flow__attribution'];
      return !excludeClasses.some(c => node.classList?.contains(c));
    },
  });

  const res = await fetch(dataUrl);
  return res.blob();
}

async function exportSVG(element: HTMLElement): Promise<string> {
  return toSvg(element, {
    backgroundColor: '#0C0D0F',
    filter: (node) => !node.classList?.contains('react-flow__controls'),
  });
}
```

### PDF Export

```typescript
// lib/export/pdf.ts
import jsPDF from 'jspdf';

async function exportPDF(
  element: HTMLElement,
  title: string,
  options?: { orientation?: 'landscape' | 'portrait'; includeMetadata?: boolean }
): Promise<Blob> {
  const orientation = options?.orientation ?? 'landscape';
  const pdf = new jsPDF({ orientation, unit: 'mm', format: 'a4' });

  // Add title
  pdf.setFontSize(18);
  pdf.text(title, 20, 20);

  // Add diagram as image
  const pngBlob = await exportPNG(element, { scale: 3 });
  const pngUrl = URL.createObjectURL(pngBlob);

  const imgWidth = orientation === 'landscape' ? 257 : 170;
  const imgHeight = orientation === 'landscape' ? 150 : 220;

  pdf.addImage(pngUrl, 'PNG', 20, 30, imgWidth, imgHeight);

  URL.revokeObjectURL(pngUrl);

  // Add metadata footer
  if (options?.includeMetadata) {
    pdf.setFontSize(10);
    pdf.setTextColor(150);
    pdf.text(`Generated by Architex | ${new Date().toLocaleDateString()}`, 20, orientation === 'landscape' ? 195 : 280);
  }

  return pdf.output('blob');
}
```

### Mermaid Export

```typescript
// lib/export/mermaid.ts
function exportMermaid(nodes: ArchitexNode[], edges: ArchitexEdge[]): string {
  const lines: string[] = ['graph LR'];

  // Map node types to Mermaid shapes
  const shapeMap: Record<string, (id: string, label: string) => string> = {
    'client':        (id, l) => `${id}[${l}]`,                // rectangle
    'service':       (id, l) => `${id}[${l}]`,                // rectangle
    'database':      (id, l) => `${id}[(${l})]`,              // cylinder
    'cache':         (id, l) => `${id}{{${l}}}`,              // hexagon
    'queue':         (id, l) => `${id}>[${l}]`,               // flag
    'load-balancer': (id, l) => `${id}{${l}}`,                // diamond
    'cdn':           (id, l) => `${id}([${l}])`,              // stadium
    'api-gateway':   (id, l) => `${id}[/${l}\\]`,             // parallelogram
    'storage':       (id, l) => `${id}[(${l})]`,              // cylinder
    'monitoring':    (id, l) => `${id}((${l}))`,              // circle
  };

  // Add nodes with shapes
  for (const node of nodes) {
    const shapeFn = shapeMap[node.data.category] || shapeMap['service'];
    lines.push(`  ${shapeFn(node.id, node.data.label)}`);
  }

  // Add edges with labels
  for (const edge of edges) {
    const arrow = edge.data?.protocol === 'async' ? '-.->|' : '-->|';
    const label = edge.label || edge.data?.protocol || '';
    if (label) {
      lines.push(`  ${edge.source} ${arrow}${label}| ${edge.target}`);
    } else {
      lines.push(`  ${edge.source} --> ${edge.target}`);
    }
  }

  // Add styling
  lines.push('');
  lines.push('  classDef database fill:#22C55E,stroke:#16A34A,color:#fff');
  lines.push('  classDef cache fill:#F97316,stroke:#EA580C,color:#fff');
  lines.push('  classDef queue fill:#A855F7,stroke:#9333EA,color:#fff');

  // Apply classes
  const dbNodes = nodes.filter(n => n.data.category === 'database').map(n => n.id);
  if (dbNodes.length) lines.push(`  class ${dbNodes.join(',')} database`);

  const cacheNodes = nodes.filter(n => n.data.category === 'cache').map(n => n.id);
  if (cacheNodes.length) lines.push(`  class ${cacheNodes.join(',')} cache`);

  const queueNodes = nodes.filter(n => n.data.category === 'queue').map(n => n.id);
  if (queueNodes.length) lines.push(`  class ${queueNodes.join(',')} queue`);

  return lines.join('\n');
}
```

### PlantUML Export

```typescript
// lib/export/plantuml.ts
function exportPlantUML(nodes: ArchitexNode[], edges: ArchitexEdge[]): string {
  const lines: string[] = ['@startuml'];
  lines.push('!theme cyborg');
  lines.push('');

  // Map node types to PlantUML components
  const componentMap: Record<string, string> = {
    'client':        'actor',
    'service':       'component',
    'database':      'database',
    'cache':         'storage',
    'queue':         'queue',
    'load-balancer': 'boundary',
    'cdn':           'cloud',
    'api-gateway':   'interface',
    'storage':       'storage',
    'monitoring':    'control',
  };

  // Declare components
  for (const node of nodes) {
    const type = componentMap[node.data.category] || 'component';
    const sanitized = node.data.label.replace(/[^a-zA-Z0-9_ ]/g, '');
    lines.push(`${type} "${node.data.label}" as ${node.id}`);
  }

  lines.push('');

  // Add connections
  for (const edge of edges) {
    const arrow = edge.data?.protocol === 'async' ? '..>' : '-->';
    const label = edge.label ? ` : ${edge.label}` : '';
    lines.push(`${edge.source} ${arrow} ${edge.target}${label}`);
  }

  lines.push('');
  lines.push('@enduml');
  return lines.join('\n');
}
```

### draw.io XML Export

```typescript
// lib/export/drawio.ts
function exportDrawio(nodes: ArchitexNode[], edges: ArchitexEdge[]): string {
  // mxGraphModel XML format
  const cells: string[] = [];
  let cellId = 2; // 0 and 1 are reserved for root and layer

  // Add nodes as mxCell elements
  for (const node of nodes) {
    const style = getDrawioStyle(node.data.category);
    cells.push(
      `<mxCell id="${cellId}" value="${escapeXml(node.data.label)}" ` +
      `style="${style}" vertex="1" parent="1">` +
      `<mxGeometry x="${node.position.x}" y="${node.position.y}" ` +
      `width="120" height="60" as="geometry"/>` +
      `</mxCell>`
    );
    node._drawioId = cellId;
    cellId++;
  }

  // Add edges
  for (const edge of edges) {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    const label = edge.label ? ` value="${escapeXml(edge.label)}"` : '';
    const style = edge.data?.protocol === 'async'
      ? 'dashed=1;dashPattern=8 8;'
      : '';

    cells.push(
      `<mxCell id="${cellId}"${label} ` +
      `style="edgeStyle=orthogonalEdgeStyle;${style}" edge="1" ` +
      `source="${sourceNode?._drawioId}" target="${targetNode?._drawioId}" parent="1">` +
      `<mxGeometry relative="1" as="geometry"/>` +
      `</mxCell>`
    );
    cellId++;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile>
  <diagram name="Architex Export">
    <mxGraphModel>
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        ${cells.join('\n        ')}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
}

function getDrawioStyle(category: string): string {
  const styles: Record<string, string> = {
    'database': 'shape=cylinder3;size=15;whiteSpace=wrap;fillColor=#d5e8d4;strokeColor=#82b366;',
    'cache': 'shape=hexagon;perimeter=hexagonPerimeter2;fillColor=#fff2cc;strokeColor=#d6b656;',
    'queue': 'shape=process;whiteSpace=wrap;fillColor=#e1d5e7;strokeColor=#9673a6;',
    'load-balancer': 'rhombus;whiteSpace=wrap;fillColor=#dae8fc;strokeColor=#6c8ebf;',
    'cdn': 'ellipse;shape=cloud;whiteSpace=wrap;fillColor=#f8cecc;strokeColor=#b85450;',
    'service': 'rounded=1;whiteSpace=wrap;fillColor=#dae8fc;strokeColor=#6c8ebf;',
    'client': 'shape=mxgraph.basic.rect;fillColor=#f5f5f5;strokeColor=#666666;',
  };
  return styles[category] || styles['service'];
}
```

### Terraform HCL Export

```typescript
// lib/export/terraform.ts
function exportTerraform(nodes: ArchitexNode[], edges: ArchitexEdge[]): string {
  const blocks: string[] = [];

  blocks.push(`# Generated by Architex`);
  blocks.push(`# This is a starting point — customize for your infrastructure\n`);

  // Map node types to Terraform AWS resource blocks
  const resourceMap: Record<string, (node: ArchitexNode) => string> = {
    'load-balancer': (n) => `
resource "aws_lb" "${sanitizeId(n.id)}" {
  name               = "${n.data.label}"
  internal           = false
  load_balancer_type = "application"
  subnets            = var.public_subnets
  security_groups    = [aws_security_group.lb.id]
}`,
    'service': (n) => `
resource "aws_ecs_service" "${sanitizeId(n.id)}" {
  name            = "${n.data.label}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.${sanitizeId(n.id)}.arn
  desired_count   = ${n.data.config?.replicas || 2}
  launch_type     = "FARGATE"
}`,
    'database': (n) => `
resource "aws_rds_instance" "${sanitizeId(n.id)}" {
  identifier     = "${sanitizeId(n.id)}"
  engine         = "${n.data.config?.technology || 'postgres'}"
  instance_class = "db.${n.data.config?.size || 'r6g.large'}"
  multi_az       = ${n.data.config?.replicas > 1 ? 'true' : 'false'}
  storage_type   = "gp3"
  allocated_storage = ${n.data.config?.storageGB || 100}
}`,
    'cache': (n) => `
resource "aws_elasticache_cluster" "${sanitizeId(n.id)}" {
  cluster_id      = "${sanitizeId(n.id)}"
  engine          = "${n.data.config?.technology || 'redis'}"
  node_type       = "cache.${n.data.config?.size || 'r6g.large'}"
  num_cache_nodes = ${n.data.config?.replicas || 3}
}`,
    'queue': (n) => `
resource "aws_sqs_queue" "${sanitizeId(n.id)}" {
  name                      = "${sanitizeId(n.id)}"
  visibility_timeout_seconds = 30
  message_retention_seconds  = 345600
}`,
    'cdn': (n) => `
resource "aws_cloudfront_distribution" "${sanitizeId(n.id)}" {
  enabled = true
  origin {
    domain_name = aws_lb.${findConnectedLB(n, edges, nodes)}.dns_name
    origin_id   = "${sanitizeId(n.id)}-origin"
  }
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "${sanitizeId(n.id)}-origin"
    viewer_protocol_policy = "redirect-to-https"
  }
  restrictions { geo_restriction { restriction_type = "none" } }
  viewer_certificate { cloudfront_default_certificate = true }
}`,
    'storage': (n) => `
resource "aws_s3_bucket" "${sanitizeId(n.id)}" {
  bucket = "${sanitizeId(n.id)}-\${var.environment}"
}`,
  };

  for (const node of nodes) {
    const generator = resourceMap[node.data.category];
    if (generator) {
      blocks.push(generator(node));
    }
  }

  // Add security groups based on edges
  blocks.push(generateSecurityGroups(nodes, edges));

  return blocks.join('\n');
}

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, '_');
}
```

### Code Generation (Class Diagram → Code)

```typescript
// lib/export/codegen.ts
type Language = 'typescript' | 'python' | 'java';

function exportCode(nodes: ArchitexNode[], edges: ArchitexEdge[], language: Language): string {
  // For LLD/class diagrams, generate class stubs
  switch (language) {
    case 'typescript':
      return generateTypeScript(nodes, edges);
    case 'python':
      return generatePython(nodes, edges);
    case 'java':
      return generateJava(nodes, edges);
  }
}

function generateTypeScript(nodes: ArchitexNode[], edges: ArchitexEdge[]): string {
  const classes: string[] = [];

  for (const node of nodes) {
    if (node.type !== 'class') continue;

    const { label, fields = [], methods = [] } = node.data;

    // Find inheritance edges
    const parentEdge = edges.find(e => e.target === node.id && e.data?.type === 'extends');
    const parentNode = parentEdge ? nodes.find(n => n.id === parentEdge.source) : null;
    const extendsClause = parentNode ? ` extends ${parentNode.data.label}` : '';

    // Find interface implementations
    const implEdges = edges.filter(e => e.target === node.id && e.data?.type === 'implements');
    const interfaces = implEdges.map(e => nodes.find(n => n.id === e.source)?.data.label).filter(Boolean);
    const implClause = interfaces.length ? ` implements ${interfaces.join(', ')}` : '';

    let cls = `export class ${label}${extendsClause}${implClause} {\n`;

    for (const field of fields) {
      cls += `  ${field.visibility === 'private' ? 'private ' : field.visibility === 'protected' ? 'protected ' : ''}${field.name}: ${field.type};\n`;
    }

    cls += '\n';

    for (const method of methods) {
      const params = method.params?.map((p: any) => `${p.name}: ${p.type}`).join(', ') || '';
      const returnType = method.returnType || 'void';
      cls += `  ${method.visibility === 'private' ? 'private ' : ''}${method.name}(${params}): ${returnType} {\n`;
      cls += `    // TODO: Implement\n`;
      cls += `    throw new Error('Not implemented');\n`;
      cls += `  }\n\n`;
    }

    cls += '}\n';
    classes.push(cls);
  }

  return classes.join('\n');
}
```

---

## 3. GIF RECORDING

```typescript
// lib/export/gif-recorder.ts
class DiagramRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];

  async startRecording(canvasElement: HTMLElement): Promise<void> {
    // Get the canvas stream
    const canvas = canvasElement.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) throw new Error('No canvas found');

    const stream = canvas.captureStream(30); // 30fps

    this.chunks = [];
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 2_500_000, // 2.5 Mbps
    });

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };

    this.mediaRecorder.start(100); // collect data every 100ms
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) throw new Error('Not recording');

      this.mediaRecorder.onstop = () => {
        const webmBlob = new Blob(this.chunks, { type: 'video/webm' });
        resolve(webmBlob);
      };

      this.mediaRecorder.stop();
    });
  }
}

// Note: Browser MediaRecorder produces WebM, not GIF.
// For true GIF output, use a WebM-to-GIF library (gif.js) or
// recommend users use the WebM directly (better quality, smaller size).
// Most social platforms accept WebM.

// UI: Recording indicator (red dot + timer) in status bar
// Controls: [Record] → [Stop] → [Preview] → [Download as WebM/GIF]
```

---

## 4. CLIENT-SIDE SEARCH (FLEXSEARCH)

### FlexSearch Setup

```typescript
// lib/search/flex-search.ts
import FlexSearch from 'flexsearch';

// FlexSearch: 6KB gzipped, sub-1ms for 500+ documents
// Indexes all searchable content client-side

interface SearchableItem {
  id: string;
  type: 'template' | 'algorithm' | 'data-structure' | 'pattern' | 'concept' | 'challenge';
  title: string;
  description: string;
  tags: string[];
  module: string;
  difficulty?: number;
  content?: string;     // additional searchable text
}

class SearchIndex {
  private index: FlexSearch.Document<SearchableItem>;

  constructor() {
    this.index = new FlexSearch.Document({
      tokenize: 'forward',       // prefix matching ("cach" matches "caching")
      optimize: true,
      resolution: 9,
      document: {
        id: 'id',
        index: ['title', 'description', 'tags', 'content'],
        store: ['id', 'type', 'title', 'description', 'module', 'difficulty'],
      },
    });
  }

  async populate(items: SearchableItem[]) {
    for (const item of items) {
      this.index.add(item);
    }
  }

  search(query: string, limit: number = 20): SearchableItem[] {
    if (!query.trim()) return [];

    const results = this.index.search(query, {
      limit,
      enrich: true,
    });

    // Deduplicate across field matches
    const seen = new Set<string>();
    const items: SearchableItem[] = [];

    for (const fieldResult of results) {
      for (const match of fieldResult.result) {
        const doc = match.doc || match;
        if (!seen.has(doc.id)) {
          seen.add(doc.id);
          items.push(doc);
        }
      }
    }

    return items;
  }
}

// Content catalog sizes:
// Templates: 55+
// Algorithms: 100+
// Data Structures: 45+
// Patterns: 23+
// Concepts: 200+
// Challenges: 200+
// TOTAL: ~623+ searchable items
```

### Command Palette Integration (Cmd+K)

```typescript
// components/command-palette/CommandPalette.tsx
import { Command } from 'cmdk';

// Extend existing command palette with search results

function CommandPalette() {
  const [query, setQuery] = useState('');
  const searchIndex = useSearchIndex();
  const searchResults = useMemo(
    () => searchIndex.search(query, 10),
    [query, searchIndex]
  );

  return (
    <Command.Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Command.Input
        value={query}
        onValueChange={setQuery}
        placeholder="Search templates, algorithms, concepts..."
      />
      <Command.List>
        {/* Quick actions */}
        <Command.Group heading="Actions">
          <Command.Item onSelect={() => createNewDiagram()}>New Diagram</Command.Item>
          <Command.Item onSelect={() => openExportMenu()}>Export...</Command.Item>
          <Command.Item onSelect={() => toggleTheme()}>Toggle Theme</Command.Item>
        </Command.Group>

        {/* Search results grouped by type */}
        {query && (
          <>
            <Command.Group heading="Templates">
              {searchResults.filter(r => r.type === 'template').map(r => (
                <Command.Item key={r.id} onSelect={() => openTemplate(r.id)}>
                  <TemplateIcon className="mr-2 h-4 w-4" />
                  {r.title}
                  <Badge className="ml-auto">{r.module}</Badge>
                </Command.Item>
              ))}
            </Command.Group>
            <Command.Group heading="Algorithms">
              {searchResults.filter(r => r.type === 'algorithm').map(r => (
                <Command.Item key={r.id} onSelect={() => openAlgorithm(r.id)}>
                  <CodeIcon className="mr-2 h-4 w-4" />
                  {r.title}
                </Command.Item>
              ))}
            </Command.Group>
            <Command.Group heading="Concepts">
              {searchResults.filter(r => r.type === 'concept').map(r => (
                <Command.Item key={r.id} onSelect={() => openConcept(r.id)}>
                  <BookIcon className="mr-2 h-4 w-4" />
                  {r.title}
                </Command.Item>
              ))}
            </Command.Group>
          </>
        )}
      </Command.List>
    </Command.Dialog>
  );
}
```

### Template Gallery Filters

```typescript
// components/gallery/TemplateGallery.tsx
interface GalleryFilters {
  difficulty: number[];           // [1, 2, 3, 4, 5]
  category: string[];             // ["system-design", "algorithm", "lld"]
  module: string[];               // specific module filters
  sort: 'popular' | 'newest' | 'difficulty-asc' | 'difficulty-desc' | 'alphabetical';
  search: string;                 // FlexSearch query
}

// Filter UI:
// - Difficulty pills: [1] [2] [3] [4] [5] (toggle multiple)
// - Category dropdown: All, System Design, Algorithm, Data Structure, LLD, ...
// - Module tabs: All | System Design | Algorithms | Data Structures | ...
// - Sort dropdown: Popular, Newest, Difficulty ↑, Difficulty ↓, A-Z
// - Search input with instant results (FlexSearch)
```

---

## 5. PLUGIN ARCHITECTURE (IFRAME SANDBOX)

### Figma-Style Plugin Model

```typescript
// lib/plugins/plugin-host.ts

interface PluginManifest {
  id: string;                    // "com.example.my-plugin"
  name: string;                  // "My Plugin"
  version: string;               // "1.0.0"
  description: string;
  author: string;
  permissions: PluginPermission[];
  main: string;                  // relative path to JS entry point
  ui?: string;                   // relative path to UI HTML
  icon?: string;
}

type PluginPermission =
  | 'read-selection'       // read currently selected nodes/edges
  | 'read-diagram'         // read full diagram data
  | 'modify-diagram'       // add/remove/update nodes and edges
  | 'show-ui'              // display UI panel
  | 'network'              // make HTTP requests
  | 'storage'              // persist plugin data (1MB per plugin)
  ;

// Plugin types:
// 1. UI Plugin: iframe with allow-scripts sandbox (NO allow-same-origin)
// 2. Computation Plugin: Web Worker with Comlink
// 3. Theme Plugin: CSS-only, no scripts

interface PluginMessage {
  type: string;
  pluginId: string;
  payload: any;
}
```

### iframe Sandbox Security

```typescript
// components/plugins/PluginFrame.tsx
function PluginFrame({ plugin }: { plugin: PluginManifest }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // CRITICAL: Never add allow-same-origin to sandbox
  // This would let the plugin access the host's cookies, localStorage, etc.
  const sandboxAttrs = 'allow-scripts';

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      // Validate origin — must match the plugin's sandbox origin
      if (event.source !== iframeRef.current?.contentWindow) return;

      const message = event.data as PluginMessage;
      if (message.pluginId !== plugin.id) return;

      // Check permission before executing
      handlePluginMessage(plugin, message);
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [plugin]);

  return (
    <iframe
      ref={iframeRef}
      src={getPluginURL(plugin)}
      sandbox={sandboxAttrs}
      style={{ width: '100%', height: 400, border: 'none' }}
      title={`Plugin: ${plugin.name}`}
    />
  );
}

function handlePluginMessage(plugin: PluginManifest, message: PluginMessage) {
  // Permission checking
  switch (message.type) {
    case 'getSelection':
      if (!plugin.permissions.includes('read-selection')) {
        sendToPlugin(plugin.id, { type: 'error', error: 'Permission denied: read-selection' });
        return;
      }
      const selection = useCanvasStore.getState().selectedNodes;
      sendToPlugin(plugin.id, { type: 'selection', data: selection });
      break;

    case 'modifyNode':
      if (!plugin.permissions.includes('modify-diagram')) {
        sendToPlugin(plugin.id, { type: 'error', error: 'Permission denied: modify-diagram' });
        return;
      }
      // Rate limit: max 100 modifications per second per plugin
      if (!pluginRateLimiter.tryConsume(plugin.id)) {
        sendToPlugin(plugin.id, { type: 'error', error: 'Rate limited' });
        return;
      }
      useCanvasStore.getState().updateNode(message.payload.nodeId, message.payload.data);
      break;

    // ... other message types
  }
}
```

### Computation Plugin (Web Worker + Comlink)

```typescript
// lib/plugins/worker-plugin.ts
import { wrap } from 'comlink';

async function loadComputationPlugin(plugin: PluginManifest) {
  const worker = new Worker(getPluginURL(plugin), { type: 'module' });
  const api = wrap<PluginWorkerAPI>(worker);

  // Worker API (exposed by plugin):
  // interface PluginWorkerAPI {
  //   analyze(diagram: SerializedDiagram): Promise<AnalysisResult>;
  //   compute(input: any): Promise<any>;
  // }

  return api;
}
```

### Theme Plugin (CSS Only)

```typescript
// lib/plugins/theme-plugin.ts
async function loadThemePlugin(plugin: PluginManifest) {
  // Theme plugins only provide CSS — no JavaScript execution
  const cssUrl = getPluginURL(plugin);
  const response = await fetch(cssUrl);
  const css = await response.text();

  // Validate: no @import, no url(), no javascript: URIs
  if (/@import|url\(|javascript:/i.test(css)) {
    throw new Error('Theme CSS contains disallowed content');
  }

  // Apply as a style element
  const style = document.createElement('style');
  style.dataset.pluginId = plugin.id;
  style.textContent = css;
  document.head.appendChild(style);
}
```

---

## 6. MULTI-REGION VISUALIZATION

```typescript
// components/visualization/MultiRegionMap.tsx
// World map showing data center locations with connections

interface Region {
  id: string;
  name: string;            // "us-east-1", "eu-west-1"
  displayName: string;     // "US East (Virginia)"
  coords: { lat: number; lng: number };
  services: string[];      // services deployed here
  isPrimary: boolean;
}

interface RegionConnection {
  source: string;          // region ID
  target: string;          // region ID
  latencyMs: number;       // cross-region latency
  type: 'replication' | 'traffic' | 'failover';
  bandwidth: string;       // "10 Gbps"
}

// Features:
// - SVG world map (simplified, lightweight)
// - Data center markers at geographic coordinates
// - Animated connection lines between regions (dashed for replication, solid for traffic)
// - Latency labels on connections (e.g., "45ms")
// - Traffic routing visualization (GeoDNS arrows from user regions to nearest DC)
// - Failover scenario animation (click "Fail Region" → show traffic rerouting)
// - Color coding: green = healthy, yellow = degraded, red = failed

// Used in:
// - Distributed Systems module (multi-region exercises)
// - System Design challenges (global scale)
// - CDN topology visualization
```

---

## 7. SOUND DESIGN

### Web Audio API Setup

```typescript
// lib/audio/sound-engine.ts
class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled: boolean = false;
  private volume: number = 0.3;          // 0-1, default 30%

  constructor() {
    // OFF by default — must be explicitly enabled in settings
    // Respect prefers-reduced-motion
    if (typeof window !== 'undefined') {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) this.enabled = false;
    }
  }

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    return this.ctx;
  }

  // Triangle wave oscillator for algorithm sonification
  private playTone(frequency: number, duration: number, gain: number = this.volume) {
    if (!this.enabled) return;
    const ctx = this.getContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.value = frequency;
    gainNode.gain.value = gain;
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  // === 6 Sound Categories ===

  // 1. Algorithm Sonification
  // Map array values to frequencies: 120Hz (min) to 1212Hz (max)
  algorithmCompare(value: number, maxValue: number) {
    const freq = 120 + (value / maxValue) * (1212 - 120);
    this.playTone(freq, 0.05);
  }

  algorithmSwap() {
    this.playTone(440, 0.08);     // A4
    setTimeout(() => this.playTone(523, 0.08), 50); // C5
  }

  algorithmComplete() {
    // Ascending arpeggio: C E G C
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.15), i * 100);
    });
  }

  // 2. Simulation Events
  simulationStart() { this.playTone(440, 0.1); }
  simulationPause() { this.playTone(330, 0.15); }
  simulationError() { this.playTone(200, 0.3); }
  requestFlow() { this.playTone(600, 0.03, this.volume * 0.3); } // soft blip

  // 3. UI Feedback
  click() { this.playTone(800, 0.02, this.volume * 0.2); }
  hover() { this.playTone(1000, 0.01, this.volume * 0.1); }
  toggle() { this.playTone(700, 0.04); }

  // 4. State Changes
  nodeConnected() { this.playTone(523, 0.08); this.playTone(659, 0.08); }
  nodeDisconnected() { this.playTone(659, 0.08); this.playTone(523, 0.08); }
  save() { this.playTone(880, 0.05); }

  // 5. Achievements
  achievementUnlocked() {
    // Triumphant fanfare
    [523, 659, 784, 1047, 1319].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.2, this.volume * 0.5), i * 120);
    });
  }

  levelUp() {
    [262, 330, 392, 523].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.25), i * 150);
    });
  }

  // 6. Errors
  error() { this.playTone(150, 0.3, this.volume * 0.4); }
  warning() { this.playTone(250, 0.2, this.volume * 0.3); }
}

export const soundEngine = new SoundEngine();
```

---

## 8. MICRO-INTERACTIONS

### Node Interactions

```typescript
// Defined as Tailwind classes + Motion (framer-motion) animations

// Node hover: glow + connected edge brightening
// CSS:
// .react-flow__node:hover {
//   filter: drop-shadow(0 0 8px var(--node-color));
//   transition: filter 150ms ease;
// }
// Connected edges: when node hovered, add 'highlighted' class to connected edges
// .react-flow__edge.highlighted path {
//   stroke-opacity: 1;
//   stroke-width: 2.5;
//   filter: drop-shadow(0 0 4px var(--edge-color));
// }

// Node drag: lift shadow + snap guides + spring settle
// On drag start: scale(1.03), shadow-xl, z-index: 1000
// During drag: show alignment guides (horizontal/vertical lines) when near other nodes
// On drag stop: spring animation to final position (stiffness: 300, damping: 30)

// Selection: ring + rubber band/lasso
// Selected node: 2px solid ring in accent color with 2px offset
// Rubber band selection: semi-transparent rectangle overlay during drag-select

// Connection drawing: bezier preview + magnetic snap
// While dragging from a handle: show dashed bezier curve following cursor
// When near a compatible target handle: snap to it with subtle pulse animation
```

### Canvas Interactions

```typescript
// Pan inertia: when releasing after pan, continue with momentum
// friction coefficient: 0.95 (decays over ~20 frames to stop)
function applyInertia(velocity: { x: number; y: number }) {
  const friction = 0.95;
  let vx = velocity.x;
  let vy = velocity.y;

  function tick() {
    vx *= friction;
    vy *= friction;
    if (Math.abs(vx) < 0.5 && Math.abs(vy) < 0.5) return;
    panBy({ x: vx, y: vy });
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// Zoom: focal point zoom (zoom toward cursor position)
// + Level of Detail (LOD) crossfade at zoom thresholds
// zoom < 0.3: show labels only (no details, no icons)
// zoom 0.3-0.7: show labels + basic shapes
// zoom > 0.7: show full detail (ports, badges, metrics)
// Crossfade: opacity transition over 150ms at threshold boundaries
```

### Panel Animations

```typescript
// Panel open/close: width animation + content stagger
// Panel opens: width 0 → 300px (200ms ease-out)
// Content items: stagger fade-in (50ms between items, 150ms each)
// Panel closes: content fade out (100ms), then width collapse (150ms)

// Motion (framer-motion) variants:
const panelVariants = {
  open: {
    width: 300,
    transition: { duration: 0.2, ease: 'easeOut' }
  },
  closed: {
    width: 0,
    transition: { duration: 0.15, ease: 'easeIn' }
  }
};

const contentVariants = {
  open: {
    transition: { staggerChildren: 0.05 }
  },
  closed: {}
};

const itemVariants = {
  open: { opacity: 1, x: 0, transition: { duration: 0.15 } },
  closed: { opacity: 0, x: -20 }
};
```

### Play/Pause SVG Morph

```typescript
// components/ui/PlayPauseButton.tsx
// SVG path morph between play triangle and pause bars
// Uses motion's animate layout or svg path interpolation

import { motion } from 'motion/react';

function PlayPauseButton({ isPlaying, onToggle }: { isPlaying: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="p-2">
      <svg viewBox="0 0 24 24" width={24} height={24}>
        <motion.path
          d={isPlaying
            ? "M6 4h4v16H6zM14 4h4v16h-4z"     // pause (two bars)
            : "M6 4l14 8-14 8z"                   // play (triangle)
          }
          fill="currentColor"
          animate={{ d: isPlaying
            ? "M6 4h4v16H6zM14 4h4v16h-4z"
            : "M6 4l14 8-14 8z"
          }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        />
      </svg>
    </button>
  );
}
```

### Confetti for Achievements

```typescript
// lib/confetti.ts
import confetti from 'canvas-confetti';

// 5 tiers of confetti based on achievement rarity
const CONFETTI_TIERS = {
  // Tier 1: Micro (common achievements) — 300ms
  micro: () => confetti({
    particleCount: 30,
    spread: 50,
    origin: { y: 0.7 },
    disableForReducedMotion: true,
  }),

  // Tier 2: Small (uncommon) — 500ms
  small: () => confetti({
    particleCount: 60,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#6366F1', '#8B5CF6', '#22C55E'],
    disableForReducedMotion: true,
  }),

  // Tier 3: Medium (rare) — 1000ms
  medium: () => {
    confetti({ particleCount: 80, angle: 60, spread: 55, origin: { x: 0 } });
    confetti({ particleCount: 80, angle: 120, spread: 55, origin: { x: 1 } });
  },

  // Tier 4: Large (epic) — 2000ms
  large: async () => {
    for (let i = 0; i < 3; i++) {
      confetti({ particleCount: 100, spread: 100, origin: { y: 0.5 + Math.random() * 0.2 } });
      await new Promise(r => setTimeout(r, 300));
    }
  },

  // Tier 5: Epic (legendary) — 3000ms
  epic: async () => {
    const duration = 3000;
    const end = Date.now() + duration;
    const interval = setInterval(() => {
      if (Date.now() > end) { clearInterval(interval); return; }
      confetti({
        particleCount: 50,
        startVelocity: 30,
        spread: 360,
        origin: { x: Math.random(), y: Math.random() * 0.5 },
        colors: ['#6366F1', '#8B5CF6', '#EC4899', '#22C55E', '#F59E0B'],
      });
    }, 100);
  },
};

// Map achievement rarity to confetti tier:
// common → micro
// uncommon → small
// rare → medium
// epic → large
// legendary → epic
```

---

## 9. VS CODE EXTENSION

```typescript
// vscode-extension/src/extension.ts
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  // Register CustomTextEditorProvider for .architex files
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      'architex.diagramEditor',
      new ArchitexEditorProvider(context),
      {
        webviewOptions: { retainContextWhenHidden: true },
        supportsMultipleEditorsPerDocument: false,
      }
    )
  );
}

class ArchitexEditorProvider implements vscode.CustomTextEditorProvider {
  constructor(private readonly context: vscode.ExtensionContext) {}

  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel
  ): Promise<void> {
    webviewPanel.webview.options = { enableScripts: true };
    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

    // Sync document changes to webview
    const changeDisposable = vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document.uri.toString() === document.uri.toString()) {
        webviewPanel.webview.postMessage({
          type: 'update',
          content: document.getText(),
        });
      }
    });

    // Receive changes from webview
    webviewPanel.webview.onDidReceiveMessage(message => {
      if (message.type === 'edit') {
        const edit = new vscode.WorkspaceEdit();
        edit.replace(
          document.uri,
          new vscode.Range(0, 0, document.lineCount, 0),
          message.content
        );
        vscode.workspace.applyEdit(edit);
      }
    });

    webviewPanel.onDidDispose(() => changeDisposable.dispose());
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    // Load the embedded React Flow viewer
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'editor.js')
    );
    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>body { margin: 0; overflow: hidden; }</style>
</head><body>
<div id="root"></div>
<script src="${scriptUri}"></script>
</body></html>`;
  }
}
```

---

## 10. CHROME EXTENSION ("ARCHITEX CLIPPER")

```json
// chrome-extension/manifest.json (Manifest V3)
{
  "manifest_version": 3,
  "name": "Architex Clipper",
  "version": "1.0.0",
  "description": "Save system design diagrams from the web to Architex",
  "permissions": ["activeTab", "storage", "contextMenus"],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "css": ["content.css"],
      "run_at": "document_idle"
    }
  ]
}
```

```typescript
// chrome-extension/background.ts
// Context menu: right-click image → "Save to Architex"
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'save-to-architex',
    title: 'Save diagram to Architex',
    contexts: ['image'],
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === 'save-to-architex' && info.srcUrl) {
    // Send image URL to Architex API for processing
    chrome.storage.local.get('authToken', async (data) => {
      await fetch('https://api.architex.dev/clip', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${data.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl: info.srcUrl, pageUrl: info.pageUrl }),
      });
    });
  }
});
```

---

## 11. GITHUB ACTION

```yaml
# .github/actions/validate-design/action.yml
name: 'Architex Validate Design'
description: 'Validates .architex design files in your repository'
inputs:
  path:
    description: 'Path to .architex files (glob pattern)'
    default: '**/*.architex'
  strict:
    description: 'Fail on warnings (not just errors)'
    default: 'false'
runs:
  using: 'node20'
  main: 'dist/index.js'
```

```typescript
// github-action/src/index.ts
import * as core from '@actions/core';
import * as glob from '@actions/glob';
import { validateDesign } from './validator';

async function run() {
  const pattern = core.getInput('path');
  const strict = core.getBooleanInput('strict');

  const globber = await glob.create(pattern);
  const files = await globber.glob();

  let hasErrors = false;
  let hasWarnings = false;

  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');
    const diagram = JSON.parse(content);
    const results = validateDesign(diagram);

    for (const issue of results) {
      if (issue.severity === 'error') {
        core.error(issue.message, { file, startLine: 1 });
        hasErrors = true;
      } else {
        core.warning(issue.message, { file, startLine: 1 });
        hasWarnings = true;
      }
    }
  }

  if (hasErrors || (strict && hasWarnings)) {
    core.setFailed('Design validation failed');
  }
}

// 8 Validation Rules:
// 1. Schema validation: all required fields present
// 2. Node connectivity: no orphan nodes (except clients)
// 3. Single point of failure: databases without replicas
// 4. Missing load balancer: >1 service instance without LB
// 5. Circular dependencies: detect cycles in service graph
// 6. Missing cache: high-read workload without caching
// 7. Missing queue: sync connections where async would be better
// 8. Missing monitoring: no observability components in production designs
```

---

## 12. SLACK BOT

```typescript
// slack-bot/src/app.ts
import { App } from '@slack/bolt';

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

// /architex search <query>
app.command('/architex', async ({ command, ack, respond }) => {
  await ack();

  const [subcommand, ...args] = command.text.split(' ');

  switch (subcommand) {
    case 'search': {
      const query = args.join(' ');
      const results = await searchArchitex(query);
      await respond({
        blocks: results.map(r => ({
          type: 'section',
          text: { type: 'mrkdwn', text: `*${r.title}* (Level ${r.difficulty})\n${r.description}` },
          accessory: {
            type: 'button',
            text: { type: 'plain_text', text: 'Open' },
            url: `https://architex.dev/challenge/${r.id}`,
          },
        })),
      });
      break;
    }

    case 'share': {
      const designId = args[0];
      const design = await getDesign(designId);
      await respond({
        blocks: [{
          type: 'section',
          text: { type: 'mrkdwn', text: `*${design.title}*\n${design.description}` },
          accessory: {
            type: 'image',
            image_url: `https://architex.dev/api/og/${designId}`,
            alt_text: design.title,
          },
        }],
      });
      break;
    }

    case 'daily': {
      const challenge = await getDailyChallenge();
      await respond({
        text: `Today's Challenge: *${challenge.title}* (Level ${challenge.difficulty}) - ${challenge.timeLimit / 60} min`,
      });
      break;
    }
  }
});

// Daily challenge cron (post to configured channel at 9 AM)
// Streak reminders (DM users who haven't been active today by 8 PM)
```

---

## FILES TO CREATE/MODIFY

```
src-tauri/
  src/
    main.rs                         ← Tauri entry point
    commands.rs                     ← Rust commands (save, load, export)
  tauri.conf.json
  Cargo.toml
  icons/

lib/
  desktop/
    tauri-bridge.ts                 ← Tauri API bridge
  export/
    json.ts                         ← JSON export
    image.ts                        ← PNG/SVG export
    pdf.ts                          ← PDF export
    mermaid.ts                      ← Mermaid export
    plantuml.ts                     ← PlantUML export
    drawio.ts                       ← draw.io XML export
    terraform.ts                    ← Terraform HCL export
    codegen.ts                      ← Code generation
    gif-recorder.ts                 ← GIF/WebM recording
  search/
    flex-search.ts                  ← FlexSearch index
    search-catalog.ts               ← Catalog data loading
  plugins/
    plugin-host.ts                  ← Plugin loader + message router
    plugin-sandbox.ts               ← iframe security
    worker-plugin.ts                ← Web Worker plugins
    theme-plugin.ts                 ← CSS theme plugins
  audio/
    sound-engine.ts                 ← Web Audio sound system
  animation/
    confetti.ts                     ← Achievement confetti tiers
    micro-interactions.ts           ← Interaction configs
  visualization/
    multi-region.ts                 ← Multi-region map data

components/
  plugins/
    PluginFrame.tsx                 ← iframe sandbox component
    PluginManager.tsx               ← Plugin list + install/remove
    PluginPermissionDialog.tsx      ← Permission request UI
  visualization/
    MultiRegionMap.tsx              ← World map with DCs
    RegionConnection.tsx            ← Animated connection lines
  ui/
    PlayPauseButton.tsx             ← SVG morph animation

vscode-extension/
  src/extension.ts
  package.json

chrome-extension/
  manifest.json
  background.ts
  content.ts
  popup.html

github-action/
  action.yml
  src/index.ts
  src/validator.ts

slack-bot/
  src/app.ts
  package.json
```

---

## DEPENDENCIES TO INSTALL

```bash
# Desktop (Tauri)
pnpm add -D @tauri-apps/cli
pnpm add @tauri-apps/api @tauri-apps/plugin-dialog @tauri-apps/plugin-fs

# Export
pnpm add html-to-image jspdf         # already from Phase 1
# snapdom is an alternative to html-to-image for better fidelity

# Search
pnpm add flexsearch

# Plugins
pnpm add comlink                      # already from Phase 1

# Sound
# No additional deps — Web Audio API is built-in

# Animations
pnpm add canvas-confetti              # already from Phase 6

# Slack bot (separate package)
# cd slack-bot && pnpm add @slack/bolt
```

---

## ACCEPTANCE CRITERIA

- [ ] Tauri app builds and launches on macOS, Windows, Linux
- [ ] Binary size under 15MB, startup under 1 second, RAM under 80MB idle
- [ ] Native file dialogs for save/load .architex files
- [ ] JSON export matches React Flow toObject() format
- [ ] PNG/SVG export captures full diagram at 2x resolution
- [ ] PDF export includes title, diagram image, metadata footer
- [ ] Mermaid export produces valid Mermaid syntax with correct shapes
- [ ] PlantUML export produces valid PlantUML syntax
- [ ] draw.io XML export opens correctly in draw.io
- [ ] Terraform export generates valid HCL with correct resource types
- [ ] Code generation produces compilable TypeScript/Python/Java class stubs
- [ ] GIF/WebM recorder captures canvas at 30fps
- [ ] FlexSearch indexes 623+ items and returns results in <1ms
- [ ] Cmd+K command palette shows grouped search results
- [ ] Template gallery filters by difficulty, category, module with instant updates
- [ ] Plugin iframe uses sandbox="allow-scripts" (NEVER allow-same-origin)
- [ ] Plugin postMessage validates origin + checks permissions
- [ ] Plugin rate limit enforces 100 messages/second per plugin
- [ ] Web Worker plugins communicate via Comlink
- [ ] Theme plugins are CSS-only (no scripts)
- [ ] Multi-region map shows data centers with animated connections
- [ ] Sound engine OFF by default, respects prefers-reduced-motion
- [ ] Algorithm sonification maps values to 120-1212Hz triangle wave range
- [ ] Node hover shows glow + connected edge brightening
- [ ] Node drag has lift shadow + snap guides + spring settle
- [ ] Canvas pan has inertia with 0.95 friction
- [ ] LOD switches at zoom thresholds with crossfade
- [ ] Panel open/close has width animation + content stagger
- [ ] Confetti fires on achievement unlock with 5 intensity tiers
- [ ] VS Code extension opens .architex files in custom editor
- [ ] Chrome extension captures diagrams from web pages
- [ ] GitHub Action validates .architex files with 8 rules
- [ ] Slack bot responds to /architex search, share, daily commands
