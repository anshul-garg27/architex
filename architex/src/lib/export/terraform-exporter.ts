import type { Node, Edge } from '@xyflow/react';
import type { SystemDesignNodeData } from '@/lib/types';

// ─────────────────────────────────────────────────────────────
// Terraform HCL Exporter (IO-001)
// Generates Terraform configuration from React Flow diagrams.
// Maps Architex node types to AWS Terraform resources.
// ─────────────────────────────────────────────────────────────

/** A single Terraform resource block with its metadata. */
interface TerraformResource {
  resourceType: string;
  resourceName: string;
  comment: string;
  attributes: Record<string, TerraformValue>;
  /** Optional depends_on references. */
  dependsOn?: string[];
}

type TerraformValue =
  | string
  | number
  | boolean
  | TerraformValue[]
  | Record<string, string | number | boolean>;

// ── Naming ──────────────────────────────────────────────────

/** Create a Terraform-safe resource name from an id and label. */
function toTfName(id: string, label: string): string {
  const base = label || id;
  return (
    base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 60) || 'resource'
  );
}

// ── Resource Mapping ────────────────────────────────────────

/**
 * Maps for translating Architex component types to AWS Terraform
 * resource types with sensible default attributes.
 */
function mapNodeToResource(node: Node): TerraformResource | null {
  const data = node.data as SystemDesignNodeData;
  const component = data.componentType ?? '';
  const label = data.label ?? node.id;
  const name = toTfName(node.id, label);
  const config = data.config ?? {};

  // ── ECS Service (App Servers / Services / Compute) ───────
  if (
    component.includes('web-server') ||
    component.includes('server') ||
    component.includes('service') ||
    component === 'compute'
  ) {
    return {
      resourceType: 'aws_ecs_service',
      resourceName: name,
      comment: `ECS Service: ${label}`,
      attributes: {
        name: `"${label}"`,
        cluster: 'aws_ecs_cluster.main.id',
        desired_count: Number(config.replicas) || 2,
        launch_type: '"FARGATE"',
        network_configuration: {
          subnets: '"var.private_subnet_ids"' as unknown as string,
          security_groups: '"var.ecs_security_group_ids"' as unknown as string,
          assign_public_ip: false,
        },
      },
    };
  }

  // ── Application Load Balancer ────────────────────────────
  if (component.includes('load-balancer') || component.includes('lb')) {
    return {
      resourceType: 'aws_lb',
      resourceName: name,
      comment: `Application Load Balancer: ${label}`,
      attributes: {
        name: `"${label}"`,
        internal: false,
        load_balancer_type: `"${String(config.type ?? 'application')}"`,
        subnets: 'var.public_subnet_ids',
      },
    };
  }

  // ── RDS Database ─────────────────────────────────────────
  if (
    component.includes('database') ||
    component.includes('db') ||
    component.includes('postgres') ||
    component.includes('mysql') ||
    component.includes('rds')
  ) {
    return {
      resourceType: 'aws_rds_instance',
      resourceName: name,
      comment: `RDS Database: ${label}`,
      attributes: {
        identifier: `"${name}"`,
        engine: `"${String(config.engine ?? 'postgres')}"`,
        engine_version: `"${String(config.engineVersion ?? '15.4')}"`,
        instance_class: `"${String(config.instanceType ?? 'db.t3.micro')}"`,
        allocated_storage: Number(config.storageGB) || 20,
        skip_final_snapshot: true,
        multi_az: Boolean(config.multiAz ?? false),
      },
    };
  }

  // ── ElastiCache (Redis / Memcached) ──────────────────────
  if (
    component.includes('cache') ||
    component.includes('redis') ||
    component.includes('memcached')
  ) {
    const engineType = component.includes('memcached') ? 'memcached' : 'redis';
    return {
      resourceType: 'aws_elasticache_cluster',
      resourceName: name,
      comment: `ElastiCache: ${label}`,
      attributes: {
        cluster_id: `"${name}"`,
        engine: `"${engineType}"`,
        node_type: `"${String(config.instanceType ?? 'cache.t3.micro')}"`,
        num_cache_nodes: Number(config.replicas) || 1,
        port: engineType === 'redis' ? 6379 : 11211,
      },
    };
  }

  // ── SQS Queue ────────────────────────────────────────────
  if (component.includes('queue') || component.includes('sqs')) {
    return {
      resourceType: 'aws_sqs_queue',
      resourceName: name,
      comment: `SQS Queue: ${label}`,
      attributes: {
        name: `"${name}"`,
        delay_seconds: 0,
        max_message_size: 262_144,
        message_retention_seconds: 345_600,
        visibility_timeout_seconds: 30,
        receive_wait_time_seconds: 0,
      },
    };
  }

  // ── Kafka / MSK ──────────────────────────────────────────
  if (
    component.includes('kafka') ||
    component.includes('msk') ||
    component.includes('stream')
  ) {
    return {
      resourceType: 'aws_msk_cluster',
      resourceName: name,
      comment: `MSK Cluster: ${label}`,
      attributes: {
        cluster_name: `"${name}"`,
        kafka_version: '"3.5.1"',
        number_of_broker_nodes: Number(config.replicas) || 3,
      },
    };
  }

  // ── API Gateway ──────────────────────────────────────────
  if (component.includes('api-gateway') || component.includes('gateway')) {
    return {
      resourceType: 'aws_apigatewayv2_api',
      resourceName: name,
      comment: `API Gateway: ${label}`,
      attributes: {
        name: `"${label}"`,
        protocol_type: '"HTTP"',
      },
    };
  }

  // ── CloudFront / CDN ─────────────────────────────────────
  if (component.includes('cdn') || component.includes('cloudfront')) {
    return {
      resourceType: 'aws_cloudfront_distribution',
      resourceName: name,
      comment: `CloudFront Distribution: ${label}`,
      attributes: {
        enabled: true,
        comment: `"${label}"`,
        is_ipv6_enabled: true,
      },
    };
  }

  // ── S3 / Object Storage ──────────────────────────────────
  if (
    component.includes('storage') ||
    component.includes('s3') ||
    component.includes('bucket') ||
    component.includes('blob')
  ) {
    return {
      resourceType: 'aws_s3_bucket',
      resourceName: name,
      comment: `S3 Bucket: ${label}`,
      attributes: {
        bucket: `"${name}"`,
      },
    };
  }

  // ── Lambda / Serverless ──────────────────────────────────
  if (
    component.includes('lambda') ||
    component.includes('function') ||
    component.includes('serverless')
  ) {
    return {
      resourceType: 'aws_lambda_function',
      resourceName: name,
      comment: `Lambda Function: ${label}`,
      attributes: {
        function_name: `"${name}"`,
        runtime: `"${String(config.runtime ?? 'nodejs20.x')}"`,
        handler: '"index.handler"',
        memory_size: Number(config.memoryMB) || 256,
        timeout: Number(config.timeoutSeconds) || 30,
      },
    };
  }

  // ── DNS ──────────────────────────────────────────────────
  if (component.includes('dns') || component.includes('route53')) {
    return {
      resourceType: 'aws_route53_zone',
      resourceName: name,
      comment: `Route53 DNS Zone: ${label}`,
      attributes: {
        name: `"${String(config.domain ?? 'example.com')}"`,
      },
    };
  }

  // ── Firewall / WAF ───────────────────────────────────────
  if (
    component.includes('firewall') ||
    component.includes('waf') ||
    component.includes('rate-limiter')
  ) {
    return {
      resourceType: 'aws_wafv2_web_acl',
      resourceName: name,
      comment: `WAF Web ACL: ${label}`,
      attributes: {
        name: `"${name}"`,
        scope: '"REGIONAL"',
      },
    };
  }

  // Unrecognised node — skip
  return null;
}

// ── HCL Rendering ───────────────────────────────────────────

function formatHclValue(v: TerraformValue, indent: number): string {
  const pad = '  '.repeat(indent);

  if (typeof v === 'boolean') return String(v);
  if (typeof v === 'number') return String(v);

  if (typeof v === 'string') {
    // Already-quoted strings, references, or variables — leave as-is
    if (v.startsWith('"') || v.startsWith('aws_') || v.startsWith('var.')) {
      return v;
    }
    return `"${v}"`;
  }

  if (Array.isArray(v)) {
    if (v.length === 0) return '[]';
    const items = v.map((item) => `${pad}  ${formatHclValue(item, indent + 1)}`);
    return `[\n${items.join(',\n')}\n${pad}]`;
  }

  if (typeof v === 'object' && v !== null) {
    const entries = Object.entries(v);
    if (entries.length === 0) return '{}';
    const items = entries.map(
      ([k, val]) => `${pad}  ${k} = ${formatHclValue(val, indent + 1)}`,
    );
    return `{\n${items.join('\n')}\n${pad}}`;
  }

  return String(v);
}

function renderResource(resource: TerraformResource): string {
  const lines: string[] = [];
  lines.push(`# ${resource.comment}`);
  lines.push(
    `resource "${resource.resourceType}" "${resource.resourceName}" {`,
  );

  for (const [key, val] of Object.entries(resource.attributes)) {
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      lines.push(`  ${key} {`);
      for (const [k, v] of Object.entries(val)) {
        lines.push(`    ${k} = ${formatHclValue(v, 2)}`);
      }
      lines.push('  }');
    } else {
      lines.push(`  ${key} = ${formatHclValue(val, 1)}`);
    }
  }

  if (resource.dependsOn && resource.dependsOn.length > 0) {
    const deps = resource.dependsOn.map((d) => `    ${d}`).join(',\n');
    lines.push('');
    lines.push(`  depends_on = [\n${deps}\n  ]`);
  }

  lines.push('}');
  return lines.join('\n');
}

function renderEdgeDependencies(
  edges: Edge[],
  nodeMap: Map<string, string>,
): string {
  if (edges.length === 0) return '';

  const lines: string[] = [
    '',
    '# ─────────────────────────────────────────────────────',
    '# Connection Reference (configure security groups, IAM',
    '# roles, and networking to match these relationships)',
    '# ─────────────────────────────────────────────────────',
  ];

  for (const edge of edges) {
    const src = nodeMap.get(edge.source) ?? edge.source;
    const tgt = nodeMap.get(edge.target) ?? edge.target;
    const data = (edge.data ?? {}) as Record<string, unknown>;
    const edgeType = String(data.edgeType ?? edge.type ?? 'connection');
    lines.push(`# ${src} --(${edgeType})--> ${tgt}`);
  }

  return lines.join('\n');
}

// ── Public API ──────────────────────────────────────────────

/**
 * Export React Flow nodes and edges as Terraform HCL configuration
 * targeting AWS resources.
 *
 * The output is an approximate skeleton — review and customise before applying.
 */
export function exportToTerraformHCL(nodes: Node[], edges: Edge[]): string {
  const header = [
    '# ═══════════════════════════════════════════════════════════',
    '# Terraform — Auto-generated by Architex',
    '# Review and customise before applying.',
    '# ═══════════════════════════════════════════════════════════',
    '',
    'terraform {',
    '  required_version = ">= 1.5"',
    '',
    '  required_providers {',
    '    aws = {',
    '      source  = "hashicorp/aws"',
    '      version = "~> 5.0"',
    '    }',
    '  }',
    '}',
    '',
    'provider "aws" {',
    '  region = var.aws_region',
    '}',
    '',
    'variable "aws_region" {',
    '  description = "AWS region"',
    '  type        = string',
    '  default     = "us-east-1"',
    '}',
    '',
  ];

  // Build label map for edge comments
  const nodeMap = new Map<string, string>();
  for (const node of nodes) {
    const data = node.data as SystemDesignNodeData;
    nodeMap.set(node.id, data.label ?? node.id);
  }

  // Render resource blocks
  const blocks: string[] = [];
  for (const node of nodes) {
    const resource = mapNodeToResource(node);
    if (resource) {
      blocks.push(renderResource(resource));
    }
  }

  const sections: string[] = [...header];

  if (blocks.length === 0) {
    sections.push('# No mappable AWS resources found in the diagram.');
  } else {
    sections.push(blocks.join('\n\n'));
  }

  sections.push(renderEdgeDependencies(edges, nodeMap));

  return sections.join('\n');
}

/**
 * Returns a summary of which nodes mapped to which Terraform resource types.
 * Useful for reporting before exporting.
 */
export function previewTerraformMapping(
  nodes: Node[],
): Array<{ nodeId: string; label: string; resourceType: string | null }> {
  return nodes.map((node) => {
    const data = node.data as SystemDesignNodeData;
    const resource = mapNodeToResource(node);
    return {
      nodeId: node.id,
      label: data.label ?? node.id,
      resourceType: resource?.resourceType ?? null,
    };
  });
}
