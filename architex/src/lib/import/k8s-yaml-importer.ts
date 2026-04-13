import type { Node, Edge } from '@xyflow/react';

// ─────────────────────────────────────────────────────────────
// Kubernetes YAML Importer (IO-005)
// Imports Kubernetes YAML manifests and converts them to
// Architex canvas nodes and edges. Supports Deployments,
// Services, Ingresses, ConfigMaps, Secrets, StatefulSets.
// ─────────────────────────────────────────────────────────────

/** Result returned by the K8s YAML importer. */
export type K8sImportResult =
  | { ok: true; nodes: Node[]; edges: Edge[]; warnings: string[] }
  | { ok: false; error: string };

// ── Minimal K8s Manifest Types ──────────────────────────────

interface K8sResource {
  apiVersion?: string;
  kind?: string;
  metadata?: {
    name?: string;
    namespace?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  spec?: Record<string, unknown>;
}

// ── YAML Parser (minimal, no external deps) ─────────────────

function parseSimpleYAMLDocument(yaml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = yaml.split('\n');
  const stack: Array<{ obj: Record<string, unknown>; indent: number }> = [
    { obj: result, indent: -1 },
  ];

  for (const rawLine of lines) {
    const commentIdx = rawLine.indexOf('#');
    const line = commentIdx >= 0 ? rawLine.substring(0, commentIdx) : rawLine;

    const trimmed = line.trimEnd();
    if (trimmed.trim().length === 0) continue;

    const indent = line.search(/\S/);
    if (indent < 0) continue;

    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }
    const parent = stack[stack.length - 1].obj;

    const content = trimmed.trim();

    // Handle list items
    if (content.startsWith('- ')) {
      const itemContent = content.slice(2).trim();
      const parentKeys = Object.keys(parent);
      const lastKey = parentKeys[parentKeys.length - 1];

      if (lastKey && Array.isArray(parent[lastKey])) {
        const arr = parent[lastKey] as unknown[];
        const kvMatch = /^(\w[\w.-]*)\s*:\s*(.+)$/.exec(itemContent);
        if (kvMatch) {
          const newObj: Record<string, unknown> = {};
          newObj[kvMatch[1]] = parseYAMLValue(kvMatch[2].trim());
          arr.push(newObj);
          stack.push({ obj: newObj, indent });
        } else if (itemContent.includes(':')) {
          const colonIdx = itemContent.indexOf(':');
          const key = itemContent.substring(0, colonIdx).trim();
          const val = itemContent.substring(colonIdx + 1).trim();
          const newObj: Record<string, unknown> = {};
          if (val) {
            newObj[key] = parseYAMLValue(val);
          } else {
            newObj[key] = {};
          }
          arr.push(newObj);
          stack.push({ obj: newObj, indent });
        } else {
          arr.push(parseYAMLValue(itemContent));
        }
      }
      continue;
    }

    // Handle key: value
    const kvMatch = /^(\w[\w.-]*)\s*:\s*(.*)$/.exec(content);
    if (kvMatch) {
      const key = kvMatch[1];
      const val = kvMatch[2].trim();

      if (val === '' || val === '|' || val === '>') {
        const nextLineIdx = lines.indexOf(rawLine) + 1;
        let isArray = false;
        for (let i = nextLineIdx; i < lines.length; i++) {
          const nextTrimmed = lines[i].trim();
          if (nextTrimmed.length === 0 || nextTrimmed.startsWith('#')) continue;
          if (nextTrimmed.startsWith('-')) {
            isArray = true;
          }
          break;
        }

        if (isArray) {
          parent[key] = [];
        } else {
          const newObj: Record<string, unknown> = {};
          parent[key] = newObj;
          stack.push({ obj: newObj, indent });
        }
      } else {
        parent[key] = parseYAMLValue(val);
      }
    }
  }

  return result;
}

function parseYAMLValue(val: string): unknown {
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (val === 'null' || val === '~') return null;
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    return val.slice(1, -1);
  }
  const num = Number(val);
  if (!isNaN(num) && val.length > 0) return num;
  return val;
}

function splitYAMLDocuments(yaml: string): string[] {
  return yaml
    .split(/^---\s*$/m)
    .map((doc) => doc.trim())
    .filter((doc) => doc.length > 0);
}

// ── Resource Parsing ────────────────────────────────────────

function parseK8sResource(raw: Record<string, unknown>): K8sResource {
  return {
    apiVersion: raw.apiVersion as string | undefined,
    kind: raw.kind as string | undefined,
    metadata: raw.metadata as K8sResource['metadata'],
    spec: raw.spec as Record<string, unknown> | undefined,
  };
}

// ── Node Type Mapping ───────────────────────────────────────

interface NodeTypeInfo {
  componentType: string;
  category: string;
  icon: string;
}

function kindToNodeType(kind: string): NodeTypeInfo {
  switch (kind.toLowerCase()) {
    case 'deployment':
      return { componentType: 'web-server', category: 'compute', icon: 'server' };
    case 'statefulset':
      return { componentType: 'database', category: 'storage', icon: 'database' };
    case 'service':
      return { componentType: 'service', category: 'compute', icon: 'server' };
    case 'ingress':
      return { componentType: 'load-balancer-l7', category: 'load-balancing', icon: 'git-branch' };
    case 'configmap':
      return { componentType: 'config-store', category: 'storage', icon: 'file-text' };
    case 'secret':
      return { componentType: 'secret-store', category: 'security', icon: 'lock' };
    case 'horizontalpodautoscaler':
    case 'hpa':
      return { componentType: 'autoscaler', category: 'compute', icon: 'trending-up' };
    case 'persistentvolumeclaim':
    case 'pvc':
      return { componentType: 'persistent-volume', category: 'storage', icon: 'hard-drive' };
    case 'networkpolicy':
      return { componentType: 'firewall', category: 'security', icon: 'shield' };
    case 'daemonset':
      return { componentType: 'daemon', category: 'compute', icon: 'cpu' };
    case 'cronjob':
    case 'job':
      return { componentType: 'worker', category: 'processing', icon: 'clock' };
    case 'poddisruptionbudget':
    case 'pdb':
      return { componentType: 'policy', category: 'compute', icon: 'shield' };
    default:
      return { componentType: 'app-server', category: 'compute', icon: 'server' };
  }
}

function refineFromContainerImages(
  spec: Record<string, unknown> | undefined,
  baseInfo: NodeTypeInfo,
): NodeTypeInfo {
  if (!spec) return baseInfo;

  const template = spec.template as Record<string, unknown> | undefined;
  const podSpec = template?.spec as Record<string, unknown> | undefined;
  const containers = podSpec?.containers as Array<Record<string, unknown>> | undefined;

  if (!containers || !Array.isArray(containers)) return baseInfo;

  for (const container of containers) {
    const image = String(container.image ?? '').toLowerCase();
    if (image.includes('postgres'))
      return { componentType: 'postgres-primary', category: 'storage', icon: 'database' };
    if (image.includes('mysql'))
      return { componentType: 'mysql-primary', category: 'storage', icon: 'database' };
    if (image.includes('mongo'))
      return { componentType: 'mongo-primary', category: 'storage', icon: 'database' };
    if (image.includes('redis'))
      return { componentType: 'redis-cache', category: 'storage', icon: 'database' };
    if (image.includes('memcached'))
      return { componentType: 'memcached', category: 'storage', icon: 'database' };
    if (image.includes('kafka'))
      return { componentType: 'kafka', category: 'messaging', icon: 'mail' };
    if (image.includes('rabbitmq'))
      return { componentType: 'rabbitmq', category: 'messaging', icon: 'mail' };
    if (image.includes('nginx') || image.includes('envoy') || image.includes('haproxy'))
      return { componentType: 'load-balancer-l7', category: 'load-balancing', icon: 'git-branch' };
    if (image.includes('elasticsearch') || image.includes('opensearch'))
      return { componentType: 'search-engine', category: 'storage', icon: 'search' };
  }

  return baseInfo;
}

function extractReplicas(spec: Record<string, unknown> | undefined): number {
  if (!spec) return 1;
  const replicas = spec.replicas;
  return typeof replicas === 'number' ? replicas : 1;
}

// ── Layout ──────────────────────────────────────────────────

const GRID_COLS = 4;
const GRID_SPACING_X = 280;
const GRID_SPACING_Y = 180;
const GRID_OFFSET = 80;

function gridPosition(index: number): { x: number; y: number } {
  const col = index % GRID_COLS;
  const row = Math.floor(index / GRID_COLS);
  return {
    x: GRID_OFFSET + col * GRID_SPACING_X,
    y: GRID_OFFSET + row * GRID_SPACING_Y,
  };
}

// ── Edge Inference ──────────────────────────────────────────

interface ParsedResource {
  resource: K8sResource;
  nodeId: string;
  kind: string;
  name: string;
}

function inferEdges(parsedResources: ParsedResource[]): Edge[] {
  const edges: Edge[] = [];
  let edgeIndex = 0;

  const nameToNodeId = new Map<string, string>();
  const labelToNodeIds = new Map<string, string[]>();
  const resourcesByKind = new Map<string, ParsedResource[]>();

  for (const pr of parsedResources) {
    nameToNodeId.set(pr.name, pr.nodeId);

    const kindGroup = resourcesByKind.get(pr.kind) ?? [];
    kindGroup.push(pr);
    resourcesByKind.set(pr.kind, kindGroup);

    const labels = pr.resource.metadata?.labels;
    if (labels) {
      for (const [key, val] of Object.entries(labels)) {
        const labelKey = `${key}=${val}`;
        const existing = labelToNodeIds.get(labelKey) ?? [];
        existing.push(pr.nodeId);
        labelToNodeIds.set(labelKey, existing);
      }
    }
  }

  // Service -> Deployment/StatefulSet (via selector)
  const services = resourcesByKind.get('Service') ?? [];
  for (const svc of services) {
    const selector = svc.resource.spec?.selector as Record<string, unknown> | undefined;
    if (!selector) continue;

    const matchLabels = (selector.matchLabels ?? selector) as Record<string, string>;
    if (typeof matchLabels !== 'object') continue;

    for (const [key, val] of Object.entries(matchLabels)) {
      if (typeof val !== 'string') continue;
      const labelKey = `${key}=${val}`;
      const targetNodeIds = labelToNodeIds.get(labelKey) ?? [];
      for (const targetId of targetNodeIds) {
        if (targetId === svc.nodeId) continue;
        edges.push({
          id: `k8s-edge-${edgeIndex++}`,
          source: svc.nodeId,
          target: targetId,
          type: 'default',
          data: { edgeType: 'http', label: 'routes to' },
        });
      }
    }
  }

  // Ingress -> Service (via backend)
  const ingresses = resourcesByKind.get('Ingress') ?? [];
  for (const ingress of ingresses) {
    const rules = ingress.resource.spec?.rules as Array<Record<string, unknown>> | undefined;
    if (rules && Array.isArray(rules)) {
      for (const rule of rules) {
        const http = rule.http as Record<string, unknown> | undefined;
        const paths = http?.paths as Array<Record<string, unknown>> | undefined;
        if (!paths) continue;
        for (const path of paths) {
          const backend = path.backend as Record<string, unknown> | undefined;
          const service = backend?.service as Record<string, unknown> | undefined;
          const serviceName = (service?.name ?? backend?.serviceName) as string | undefined;
          if (serviceName) {
            const targetId = nameToNodeId.get(serviceName);
            if (targetId) {
              edges.push({
                id: `k8s-edge-${edgeIndex++}`,
                source: ingress.nodeId,
                target: targetId,
                type: 'default',
                data: { edgeType: 'http', label: 'routes to' },
              });
            }
          }
        }
      }
    }

    const defaultBackend = ingress.resource.spec?.defaultBackend as Record<string, unknown> | undefined;
    if (defaultBackend) {
      const service = defaultBackend.service as Record<string, unknown> | undefined;
      const serviceName = (service?.name ?? defaultBackend.serviceName) as string | undefined;
      if (serviceName) {
        const targetId = nameToNodeId.get(serviceName);
        if (targetId) {
          edges.push({
            id: `k8s-edge-${edgeIndex++}`,
            source: ingress.nodeId,
            target: targetId,
            type: 'default',
            data: { edgeType: 'http', label: 'default backend' },
          });
        }
      }
    }
  }

  // ConfigMap/Secret references from workloads
  const workloads = [
    ...(resourcesByKind.get('Deployment') ?? []),
    ...(resourcesByKind.get('StatefulSet') ?? []),
    ...(resourcesByKind.get('DaemonSet') ?? []),
  ];

  for (const workload of workloads) {
    const template = workload.resource.spec?.template as Record<string, unknown> | undefined;
    const podSpec = template?.spec as Record<string, unknown> | undefined;

    const volumes = podSpec?.volumes as Array<Record<string, unknown>> | undefined;
    if (volumes && Array.isArray(volumes)) {
      for (const vol of volumes) {
        const cmRef = vol.configMap as Record<string, unknown> | undefined;
        if (cmRef?.name) {
          const targetId = nameToNodeId.get(String(cmRef.name));
          if (targetId) {
            edges.push({
              id: `k8s-edge-${edgeIndex++}`,
              source: workload.nodeId,
              target: targetId,
              type: 'default',
              data: { edgeType: 'cache-lookup', label: 'mounts config' },
            });
          }
        }
        const secretRef = vol.secret as Record<string, unknown> | undefined;
        if (secretRef?.secretName) {
          const targetId = nameToNodeId.get(String(secretRef.secretName));
          if (targetId) {
            edges.push({
              id: `k8s-edge-${edgeIndex++}`,
              source: workload.nodeId,
              target: targetId,
              type: 'default',
              data: { edgeType: 'cache-lookup', label: 'mounts secret' },
            });
          }
        }
      }
    }

    const containers = podSpec?.containers as Array<Record<string, unknown>> | undefined;
    if (containers && Array.isArray(containers)) {
      for (const container of containers) {
        const envFrom = container.envFrom as Array<Record<string, unknown>> | undefined;
        if (envFrom && Array.isArray(envFrom)) {
          for (const ref of envFrom) {
            const cmEnvRef = ref.configMapRef as Record<string, unknown> | undefined;
            if (cmEnvRef?.name) {
              const targetId = nameToNodeId.get(String(cmEnvRef.name));
              if (targetId) {
                edges.push({
                  id: `k8s-edge-${edgeIndex++}`,
                  source: workload.nodeId,
                  target: targetId,
                  type: 'default',
                  data: { edgeType: 'cache-lookup', label: 'reads env' },
                });
              }
            }
            const secretEnvRef = ref.secretRef as Record<string, unknown> | undefined;
            if (secretEnvRef?.name) {
              const targetId = nameToNodeId.get(String(secretEnvRef.name));
              if (targetId) {
                edges.push({
                  id: `k8s-edge-${edgeIndex++}`,
                  source: workload.nodeId,
                  target: targetId,
                  type: 'default',
                  data: { edgeType: 'cache-lookup', label: 'reads secret' },
                });
              }
            }
          }
        }
      }
    }
  }

  // HPA -> target Deployment
  const hpas = resourcesByKind.get('HorizontalPodAutoscaler') ?? [];
  for (const hpa of hpas) {
    const scaleTargetRef = hpa.resource.spec?.scaleTargetRef as Record<string, unknown> | undefined;
    if (scaleTargetRef?.name) {
      const targetId = nameToNodeId.get(String(scaleTargetRef.name));
      if (targetId) {
        edges.push({
          id: `k8s-edge-${edgeIndex++}`,
          source: hpa.nodeId,
          target: targetId,
          type: 'default',
          data: { edgeType: 'http', label: 'scales' },
        });
      }
    }
  }

  return edges;
}

// ── Public API ──────────────────────────────────────────────

/**
 * Import a Kubernetes YAML manifest (single or multi-document) and
 * convert resources to Architex canvas nodes and edges.
 *
 * Supported resource kinds:
 * - Deployment, StatefulSet, DaemonSet
 * - Service, Ingress
 * - ConfigMap, Secret
 * - HorizontalPodAutoscaler, PodDisruptionBudget
 * - NetworkPolicy
 * - CronJob, Job
 * - PersistentVolumeClaim
 *
 * Edges are inferred from Service selectors, Ingress backends,
 * ConfigMap/Secret volume references, and HPA scaleTargetRef.
 */
export function importFromK8sYAML(yaml: string): K8sImportResult {
  if (!yaml || yaml.trim().length === 0) {
    return { ok: false, error: 'Empty YAML input.' };
  }

  const warnings: string[] = [];
  const documents = splitYAMLDocuments(yaml);

  if (documents.length === 0) {
    return { ok: false, error: 'No YAML documents found.' };
  }

  const parsedResources: ParsedResource[] = [];
  const nodes: Node[] = [];
  let nodeIndex = 0;

  for (const doc of documents) {
    let raw: Record<string, unknown>;
    try {
      raw = parseSimpleYAMLDocument(doc);
    } catch (e) {
      warnings.push(
        `Skipped unparseable YAML document: ${e instanceof Error ? e.message : 'unknown error'}`,
      );
      continue;
    }

    const resource = parseK8sResource(raw);
    const kind = resource.kind;
    const name = resource.metadata?.name;

    if (!kind || !name) {
      warnings.push('Skipped resource with missing kind or metadata.name');
      continue;
    }

    let nodeTypeInfo = kindToNodeType(kind);

    if (
      kind === 'Deployment' ||
      kind === 'StatefulSet' ||
      kind === 'DaemonSet'
    ) {
      nodeTypeInfo = refineFromContainerImages(resource.spec, nodeTypeInfo);
    }

    const nodeId = `k8s-${kind.toLowerCase()}-${name.replace(/[^a-zA-Z0-9-_]/g, '-')}`;
    const replicas = extractReplicas(resource.spec);
    const namespace = resource.metadata?.namespace ?? 'default';

    nodes.push({
      id: nodeId,
      type: 'system-design',
      position: gridPosition(nodeIndex),
      data: {
        label: name,
        category: nodeTypeInfo.category,
        componentType: nodeTypeInfo.componentType,
        icon: nodeTypeInfo.icon,
        config: {
          replicas,
          namespace,
          kind,
        },
        state: 'idle',
      },
    });

    parsedResources.push({
      resource,
      nodeId,
      kind,
      name,
    });

    nodeIndex++;
  }

  if (nodes.length === 0) {
    return {
      ok: false,
      error: 'No valid Kubernetes resources found in the YAML.',
    };
  }

  const edges = inferEdges(parsedResources);

  return { ok: true, nodes, edges, warnings };
}

/**
 * Quick validation that input looks like K8s YAML (has kind and apiVersion).
 */
export function isK8sYAML(yaml: string): boolean {
  const lower = yaml.toLowerCase();
  return (
    (lower.includes('apiversion:') || lower.includes('apiversion :')) &&
    (lower.includes('kind:') || lower.includes('kind :'))
  );
}
