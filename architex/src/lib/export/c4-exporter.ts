import type { Node, Edge } from '@xyflow/react';
import type { SystemDesignNodeData } from '@/lib/types';

// ─────────────────────────────────────────────────────────────
// C4 Model Exporter (IO-002)
// Exports React Flow diagrams to C4 model format, supporting
// both Structurizr DSL and PlantUML C4 notation.
// ─────────────────────────────────────────────────────────────

/** Output format for the C4 export. */
export type C4OutputFormat = 'structurizr' | 'plantuml';

/** Options for C4 export. */
export interface C4ExportOptions {
  /** Output format — Structurizr DSL or PlantUML C4 (default: structurizr). */
  format?: C4OutputFormat;
  /** Name for the top-level software system (default: "System"). */
  systemName?: string;
  /** Description for the software system. */
  systemDescription?: string;
}

// ── C4 Element Classification ───────────────────────────────

type C4ElementType = 'person' | 'softwareSystem' | 'container' | 'component';

interface C4Element {
  id: string;
  name: string;
  description: string;
  technology: string;
  elementType: C4ElementType;
  tags: string[];
}

interface C4Relationship {
  sourceId: string;
  targetId: string;
  description: string;
  technology: string;
  tags: string[];
}

/** Create a C4-safe identifier. */
function c4Id(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, '_');
}

/**
 * Classify an Architex node into a C4 element type and infer technology.
 */
function classifyNode(node: Node): C4Element {
  const data = node.data as SystemDesignNodeData;
  const component = data.componentType ?? '';
  const category = data.category ?? 'compute';
  const label = data.label ?? node.id;

  // Clients are modelled as "person" in C4
  if (
    category === 'client' ||
    component.includes('client') ||
    component.includes('browser') ||
    component.includes('mobile') ||
    component.includes('user')
  ) {
    return {
      id: c4Id(node.id),
      name: label,
      description: `${label} user / client`,
      technology: '',
      elementType: 'person',
      tags: ['client'],
    };
  }

  // Everything else is a container (within our software system)
  const technology = inferTechnology(component);
  const description = inferDescription(component, label);

  return {
    id: c4Id(node.id),
    name: label,
    description,
    technology,
    elementType: 'container',
    tags: [category, component].filter(Boolean),
  };
}

function inferTechnology(component: string): string {
  if (component.includes('postgres')) return 'PostgreSQL';
  if (component.includes('mysql')) return 'MySQL';
  if (component.includes('mongo')) return 'MongoDB';
  if (component.includes('dynamo')) return 'DynamoDB';
  if (component.includes('redis')) return 'Redis';
  if (component.includes('memcached')) return 'Memcached';
  if (component.includes('kafka')) return 'Apache Kafka';
  if (component.includes('rabbit')) return 'RabbitMQ';
  if (component.includes('sqs')) return 'AWS SQS';
  if (component.includes('queue')) return 'Message Queue';
  if (component.includes('cdn') || component.includes('cloudfront'))
    return 'CDN';
  if (component.includes('s3') || component.includes('storage'))
    return 'Object Storage';
  if (component.includes('lambda') || component.includes('serverless'))
    return 'Serverless Function';
  if (component.includes('load-balancer') || component.includes('lb'))
    return 'Load Balancer';
  if (component.includes('api-gateway') || component.includes('gateway'))
    return 'API Gateway';
  if (component.includes('web-server')) return 'Web Server';
  if (component.includes('database') || component.includes('db'))
    return 'Relational Database';
  if (component.includes('cache')) return 'Cache';
  return '';
}

function inferDescription(component: string, label: string): string {
  if (component.includes('database') || component.includes('db'))
    return `Stores persistent data for ${label}`;
  if (component.includes('cache') || component.includes('redis'))
    return `Provides caching layer for ${label}`;
  if (component.includes('queue') || component.includes('kafka'))
    return `Handles asynchronous message processing for ${label}`;
  if (component.includes('load-balancer') || component.includes('lb'))
    return `Distributes traffic across ${label}`;
  if (component.includes('gateway'))
    return `Routes and manages API requests for ${label}`;
  if (component.includes('cdn'))
    return `Serves static content via ${label}`;
  return `Provides ${label} functionality`;
}

/**
 * Map an edge to a C4 relationship.
 */
function mapEdgeToRelationship(edge: Edge): C4Relationship {
  const data = (edge.data ?? {}) as Record<string, unknown>;
  const edgeType = String(data.edgeType ?? edge.type ?? 'http');

  let description: string;
  let technology: string;

  switch (edgeType) {
    case 'http':
      description = 'Makes HTTP requests to';
      technology = 'HTTP/HTTPS';
      break;
    case 'grpc':
      description = 'Calls via gRPC';
      technology = 'gRPC';
      break;
    case 'graphql':
      description = 'Queries via GraphQL';
      technology = 'GraphQL';
      break;
    case 'websocket':
      description = 'Communicates via WebSocket';
      technology = 'WebSocket';
      break;
    case 'message-queue':
      description = 'Sends messages to';
      technology = 'Async / Message Queue';
      break;
    case 'event-stream':
      description = 'Streams events to';
      technology = 'Event Stream';
      break;
    case 'db-query':
      description = 'Reads from and writes to';
      technology = 'SQL/NoSQL';
      break;
    case 'cache-lookup':
      description = 'Reads/writes cache entries in';
      technology = 'Cache Protocol';
      break;
    case 'replication':
      description = 'Replicates data to';
      technology = 'Replication';
      break;
    default:
      description = 'Connects to';
      technology = edgeType;
  }

  return {
    sourceId: c4Id(edge.source),
    targetId: c4Id(edge.target),
    description,
    technology,
    tags: [edgeType],
  };
}

// ── Structurizr DSL Output ──────────────────────────────────

function escapeStructurizr(s: string): string {
  return s.replace(/"/g, '\\"');
}

function toStructurizrDSL(
  elements: C4Element[],
  relationships: C4Relationship[],
  options: C4ExportOptions,
): string {
  const systemName = options.systemName ?? 'System';
  const systemDesc =
    options.systemDescription ?? 'Auto-generated from Architex diagram';
  const lines: string[] = [];

  lines.push('workspace {');
  lines.push('');
  lines.push('  model {');

  // Declare persons first
  const persons = elements.filter((e) => e.elementType === 'person');
  const containers = elements.filter((e) => e.elementType !== 'person');

  for (const person of persons) {
    lines.push(
      `    ${person.id} = person "${escapeStructurizr(person.name)}" "${escapeStructurizr(person.description)}"`,
    );
  }

  if (persons.length > 0 && containers.length > 0) {
    lines.push('');
  }

  // Declare software system with containers
  lines.push(
    `    system = softwareSystem "${escapeStructurizr(systemName)}" "${escapeStructurizr(systemDesc)}" {`,
  );

  for (const container of containers) {
    const tech = container.technology
      ? ` "${escapeStructurizr(container.technology)}"`
      : '';
    lines.push(
      `      ${container.id} = container "${escapeStructurizr(container.name)}" "${escapeStructurizr(container.description)}"${tech}`,
    );
  }

  lines.push('    }');

  // Relationships
  if (relationships.length > 0) {
    lines.push('');
    for (const rel of relationships) {
      const tech = rel.technology
        ? ` "${escapeStructurizr(rel.technology)}"`
        : '';
      lines.push(
        `    ${rel.sourceId} -> ${rel.targetId} "${escapeStructurizr(rel.description)}"${tech}`,
      );
    }
  }

  lines.push('  }');
  lines.push('');

  // Views section — auto-generate a container view
  lines.push('  views {');
  lines.push(`    container system "Containers" {`);
  lines.push('      include *');
  lines.push('      autoLayout');
  lines.push('    }');
  lines.push('');
  lines.push('    styles {');
  lines.push('      element "Element" {');
  lines.push('        shape RoundedBox');
  lines.push('      }');
  lines.push('      element "Person" {');
  lines.push('        shape Person');
  lines.push('      }');
  lines.push('    }');
  lines.push('  }');

  lines.push('}');

  return lines.join('\n');
}

// ── PlantUML C4 Output ──────────────────────────────────────

function escapePlantUML(s: string): string {
  return s.replace(/"/g, "'");
}

function toPlantUMLC4(
  elements: C4Element[],
  relationships: C4Relationship[],
  options: C4ExportOptions,
): string {
  const systemName = options.systemName ?? 'System';
  const lines: string[] = [];

  lines.push('@startuml');
  lines.push('!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Container.puml');
  lines.push('');
  lines.push(`title Container diagram for ${escapePlantUML(systemName)}`);
  lines.push('');

  // Persons
  const persons = elements.filter((e) => e.elementType === 'person');
  for (const person of persons) {
    lines.push(
      `Person(${person.id}, "${escapePlantUML(person.name)}", "${escapePlantUML(person.description)}")`,
    );
  }

  if (persons.length > 0) {
    lines.push('');
  }

  // System boundary with containers
  const containers = elements.filter((e) => e.elementType !== 'person');
  lines.push(
    `System_Boundary(system, "${escapePlantUML(systemName)}") {`,
  );

  for (const container of containers) {
    const tech = container.technology
      ? `, "${escapePlantUML(container.technology)}"`
      : '';
    const isDb =
      container.technology?.includes('SQL') ||
      container.technology?.includes('Postgre') ||
      container.technology?.includes('MySQL') ||
      container.technology?.includes('Mongo') ||
      container.technology?.includes('Dynamo') ||
      container.technology?.includes('Database');

    const macro = isDb ? 'ContainerDb' : 'Container';
    lines.push(
      `  ${macro}(${container.id}, "${escapePlantUML(container.name)}", "${escapePlantUML(container.description)}"${tech})`,
    );
  }

  lines.push('}');
  lines.push('');

  // Relationships
  for (const rel of relationships) {
    const tech = rel.technology
      ? `, "${escapePlantUML(rel.technology)}"`
      : '';
    lines.push(
      `Rel(${rel.sourceId}, ${rel.targetId}, "${escapePlantUML(rel.description)}"${tech})`,
    );
  }

  lines.push('');
  lines.push('@enduml');

  return lines.join('\n');
}

// ── Public API ──────────────────────────────────────────────

/**
 * Export React Flow nodes and edges to C4 model format.
 *
 * Supports Structurizr DSL (default) and PlantUML C4 output formats.
 * Maps Architex nodes to C4 containers and edges to C4 relationships.
 */
export function exportToC4(
  nodes: Node[],
  edges: Edge[],
  options: C4ExportOptions = {},
): string {
  const elements = nodes.map(classifyNode);
  const relationships = edges.map(mapEdgeToRelationship);
  const format = options.format ?? 'structurizr';

  if (format === 'plantuml') {
    return toPlantUMLC4(elements, relationships, options);
  }

  return toStructurizrDSL(elements, relationships, options);
}

/**
 * Returns the classified C4 elements for preview/debugging purposes.
 */
export function previewC4Elements(nodes: Node[]): C4Element[] {
  return nodes.map(classifyNode);
}
