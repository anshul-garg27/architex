import type { Node, Edge } from '@xyflow/react';
import type { SystemDesignNodeData } from '@/lib/types';

// ─────────────────────────────────────────────────────────────
// Terraform HCL Export (approximate / educational)
// ─────────────────────────────────────────────────────────────

interface TerraformBlock {
  resourceType: string;
  resourceName: string;
  comment: string;
  attributes: Record<string, string | number | boolean | Record<string, string | number | boolean>>;
}

/** Create a Terraform-safe resource name from a node id + label. */
function tfName(id: string, label: string): string {
  const base = label || id;
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 60) || 'resource';
}

/**
 * Map a node's componentType to an AWS resource block.
 */
function mapNodeToTerraform(
  node: Node,
): TerraformBlock | null {
  const data = node.data as SystemDesignNodeData;
  const component = data.componentType ?? '';
  const label = data.label ?? node.id;
  const name = tfName(node.id, label);
  const config = data.config ?? {};

  // ── Web Server / Compute ────────────────────────────────
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
      },
    };
  }

  // ── Load Balancer ───────────────────────────────────────
  if (
    component.includes('load-balancer') ||
    component.includes('lb')
  ) {
    return {
      resourceType: 'aws_lb',
      resourceName: name,
      comment: `Application Load Balancer: ${label}`,
      attributes: {
        name: `"${label}"`,
        internal: false,
        load_balancer_type: `"${String(config.type ?? 'application')}"`,
      },
    };
  }

  // ── Database ────────────────────────────────────────────
  if (
    component.includes('database') ||
    component.includes('db') ||
    component.includes('postgres') ||
    component.includes('mysql') ||
    component.includes('rds')
  ) {
    return {
      resourceType: 'aws_db_instance',
      resourceName: name,
      comment: `RDS Database: ${label}`,
      attributes: {
        identifier: `"${name}"`,
        engine: `"${String(config.engine ?? 'postgres')}"`,
        instance_class: `"${String(config.instanceType ?? 'db.t3.micro')}"`,
        allocated_storage: Number(config.storageGB) || 20,
        skip_final_snapshot: true,
      },
    };
  }

  // ── Cache ───────────────────────────────────────────────
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
      },
    };
  }

  // ── Message Queue ───────────────────────────────────────
  if (
    component.includes('queue') ||
    component.includes('sqs')
  ) {
    return {
      resourceType: 'aws_sqs_queue',
      resourceName: name,
      comment: `SQS Queue: ${label}`,
      attributes: {
        name: `"${name}"`,
        delay_seconds: 0,
        max_message_size: 262144,
        message_retention_seconds: 345600,
        visibility_timeout_seconds: 30,
      },
    };
  }

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

  // ── API Gateway ─────────────────────────────────────────
  if (
    component.includes('api-gateway') ||
    component.includes('gateway')
  ) {
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

  // ── CDN ─────────────────────────────────────────────────
  if (
    component.includes('cdn') ||
    component.includes('cloudfront')
  ) {
    return {
      resourceType: 'aws_cloudfront_distribution',
      resourceName: name,
      comment: `CloudFront Distribution: ${label}`,
      attributes: {
        enabled: true,
        comment: `"${label}"`,
      },
    };
  }

  // ── Object Storage ──────────────────────────────────────
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

  // Unrecognised node — skip
  return null;
}

/**
 * Render a single Terraform resource block as HCL text.
 */
function renderBlock(block: TerraformBlock): string {
  const lines: string[] = [];
  lines.push(`# ${block.comment}`);
  lines.push(`resource "${block.resourceType}" "${block.resourceName}" {`);

  for (const [key, val] of Object.entries(block.attributes)) {
    if (typeof val === 'object' && val !== null) {
      lines.push(`  ${key} {`);
      for (const [k, v] of Object.entries(val)) {
        lines.push(`    ${k} = ${formatValue(v)}`);
      }
      lines.push('  }');
    } else {
      lines.push(`  ${key} = ${formatValue(val)}`);
    }
  }

  lines.push('}');
  return lines.join('\n');
}

function formatValue(v: string | number | boolean): string {
  if (typeof v === 'boolean') return String(v);
  if (typeof v === 'number') return String(v);
  // String values — if already quoted or is a reference, leave as-is
  if (v.startsWith('"') || v.startsWith('aws_') || v.startsWith('var.')) {
    return v;
  }
  return `"${v}"`;
}

/**
 * Generate a comment block summarizing detected connections.
 */
function renderEdgeComments(edges: Edge[], nodeMap: Map<string, string>): string {
  if (edges.length === 0) return '';

  const lines: string[] = [
    '# ─────────────────────────────────────────────────────',
    '# Connections (for reference — configure security groups,',
    '# IAM roles, and networking to match these relationships)',
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

/**
 * Convert canvas nodes and edges to Terraform HCL targeting AWS.
 *
 * NOTE: This output is approximate and educational. It is not
 * production-ready — review and customise before applying.
 */
export function exportToTerraform(nodes: Node[], edges: Edge[]): string {
  const sections: string[] = [
    '# ═══════════════════════════════════════════════════════════',
    '# Terraform — Auto-generated by Architex',
    '# This is an approximate skeleton. Review before applying.',
    '# ═══════════════════════════════════════════════════════════',
    '',
    'terraform {',
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

  // Build a name map for edge comments
  const nodeMap = new Map<string, string>();
  for (const node of nodes) {
    const data = node.data as SystemDesignNodeData;
    nodeMap.set(node.id, data.label ?? node.id);
  }

  // Render resource blocks
  const rendered: string[] = [];
  for (const node of nodes) {
    const block = mapNodeToTerraform(node);
    if (block) {
      rendered.push(renderBlock(block));
    }
  }

  if (rendered.length === 0) {
    sections.push('# No mappable AWS resources found in the diagram.');
  } else {
    sections.push(rendered.join('\n\n'));
  }

  // Edge comments
  const edgeSection = renderEdgeComments(edges, nodeMap);
  if (edgeSection) {
    sections.push('');
    sections.push(edgeSection);
  }

  return sections.join('\n');
}
