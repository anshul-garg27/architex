// ─────────────────────────────────────────────────────────────
// Architex — Consistent Hashing Ring
// ─────────────────────────────────────────────────────────────
//
// Implements a consistent hashing ring with virtual nodes,
// redistribution tracking, and load distribution analysis.
// Uses FNV-1a (32-bit) as a fast, pure-TypeScript hash.
// ─────────────────────────────────────────────────────────────

/** A physical node on the hash ring. */
export interface HashNode {
  /** Unique identifier for this node. */
  id: string;
  /** Human-readable label. */
  label: string;
  /** Primary position on the ring (0 to 2^32 - 1). */
  position: number;
  /** Positions of virtual replicas on the ring. */
  virtualNodes: number[];
}

/** A key placed on the ring and its assignment. */
export interface HashKey {
  /** Raw key string. */
  key: string;
  /** Computed hash (position on the ring). */
  hash: number;
  /** ID of the node this key is assigned to. */
  assignedNode: string;
}

// ── FNV-1a hash (32-bit) ────────────────────────────────────

const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/**
 * Computes a 32-bit FNV-1a hash of the input string.
 * Returns an unsigned 32-bit integer (0 to 2^32 - 1).
 */
function fnv1a(input: string): number {
  let hash = FNV_OFFSET_BASIS;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return hash >>> 0; // force unsigned
}

/**
 * Consistent hashing ring supporting virtual nodes, key
 * placement, redistribution tracking, and load analysis.
 *
 * @example
 * ```ts
 * const ring = new ConsistentHashRing(150);
 * ring.addNode('n1', 'Node 1');
 * ring.addNode('n2', 'Node 2');
 * ring.addKey('user:42');
 * const owner = ring.getNode('user:42');
 * ```
 */
export class ConsistentHashRing {
  /** Number of virtual nodes per physical node (0 = disabled). */
  private vnodeCount: number;
  /** Whether virtual nodes are active. */
  private vnodeEnabled: boolean;
  /** Physical node metadata. */
  private nodes: Map<string, HashNode>;
  /** All ring positions (both physical + virtual) mapped to node id. */
  private ring: Map<number, string>;
  /** Sorted array of ring positions (cache, rebuilt on topology change). */
  private sortedPositions: number[];
  /** Tracked keys. */
  private keys: Map<string, HashKey>;

  constructor(virtualNodesPerNode: number = 150) {
    this.vnodeCount = virtualNodesPerNode;
    this.vnodeEnabled = true;
    this.nodes = new Map();
    this.ring = new Map();
    this.sortedPositions = [];
    this.keys = new Map();
  }

  // ── Node management ────────────────────────────────────────

  /**
   * Adds a physical node to the ring.
   * Returns a map of key -> new-owner-id for every key that was redistributed.
   */
  addNode(id: string, label: string): { redistribution: Map<string, string> } {
    if (this.nodes.has(id)) {
      throw new Error(`Node "${id}" already exists on the ring.`);
    }

    const position = fnv1a(id);
    const virtualNodes: number[] = [];

    // Place primary
    this.ring.set(position, id);

    // Place virtual nodes
    if (this.vnodeEnabled) {
      for (let i = 0; i < this.vnodeCount; i++) {
        const vpos = fnv1a(`${id}#vn${i}`);
        virtualNodes.push(vpos);
        this.ring.set(vpos, id);
      }
    }

    this.nodes.set(id, { id, label, position, virtualNodes });
    this.rebuildSortedPositions();

    // Reassign keys and track redistribution
    const redistribution = this.reassignKeys();
    return { redistribution };
  }

  /**
   * Removes a physical node and all its virtual nodes from the ring.
   * Returns a map of key -> new-owner-id for every key that was redistributed.
   */
  removeNode(id: string): { redistribution: Map<string, string> } {
    const node = this.nodes.get(id);
    if (!node) {
      throw new Error(`Node "${id}" does not exist on the ring.`);
    }

    // Remove primary and virtual positions
    this.ring.delete(node.position);
    for (const vpos of node.virtualNodes) {
      this.ring.delete(vpos);
    }
    this.nodes.delete(id);
    this.rebuildSortedPositions();

    // Reassign keys
    const redistribution = this.reassignKeys();
    return { redistribution };
  }

  // ── Key operations ─────────────────────────────────────────

  /**
   * Looks up which node owns a key (without tracking the key).
   * Returns the node id, or throws if no nodes exist.
   */
  getNode(key: string): string {
    if (this.sortedPositions.length === 0) {
      throw new Error('Cannot look up key: no nodes on the ring.');
    }
    const hash = fnv1a(key);
    return this.findOwner(hash);
  }

  /**
   * Adds a key to the ring, tracks it, and returns its assignment.
   */
  addKey(key: string): HashKey {
    if (this.sortedPositions.length === 0) {
      throw new Error('Cannot add key: no nodes on the ring.');
    }
    const hash = fnv1a(key);
    const assignedNode = this.findOwner(hash);
    const hk: HashKey = { key, hash, assignedNode };
    this.keys.set(key, hk);
    return hk;
  }

  /** Removes a tracked key. */
  removeKey(key: string): void {
    this.keys.delete(key);
  }

  // ── Analysis ───────────────────────────────────────────────

  /** Returns a map of node-id -> number of assigned keys. */
  getLoadDistribution(): Map<string, number> {
    const dist = new Map<string, number>();
    for (const node of Array.from(this.nodes.values())) {
      dist.set(node.id, 0);
    }
    for (const hk of Array.from(this.keys.values())) {
      dist.set(hk.assignedNode, (dist.get(hk.assignedNode) ?? 0) + 1);
    }
    return dist;
  }

  /** Returns all physical nodes. */
  getAllNodes(): HashNode[] {
    return Array.from(this.nodes.values());
  }

  /** Returns all tracked keys. */
  getAllKeys(): HashKey[] {
    return Array.from(this.keys.values());
  }

  /**
   * Returns the arc ranges owned by a node.
   * Each range is `{ start, end }` where start < end on the number line,
   * representing the open interval (start, end] that maps to this node.
   * A node may own multiple disjoint arcs (one per virtual node).
   */
  getKeyRange(nodeId: string): { start: number; end: number }[] {
    if (!this.nodes.has(nodeId)) {
      throw new Error(`Node "${nodeId}" does not exist.`);
    }
    if (this.sortedPositions.length === 0) return [];

    const ranges: { start: number; end: number }[] = [];
    for (let i = 0; i < this.sortedPositions.length; i++) {
      const pos = this.sortedPositions[i];
      if (this.ring.get(pos) !== nodeId) continue;

      // The range owned is (predecessor, this position]
      const prevIdx =
        i === 0 ? this.sortedPositions.length - 1 : i - 1;
      const start = this.sortedPositions[prevIdx];
      ranges.push({ start, end: pos });
    }
    return ranges;
  }

  /**
   * Toggles virtual nodes on or off.
   * When toggling off, existing virtual positions are removed.
   * When toggling on, virtual positions are re-created.
   */
  toggleVirtualNodes(enabled: boolean): void {
    if (this.vnodeEnabled === enabled) return;
    this.vnodeEnabled = enabled;

    // Rebuild ring
    this.ring.clear();
    for (const node of Array.from(this.nodes.values())) {
      this.ring.set(node.position, node.id);
      if (enabled) {
        // Recreate virtual nodes
        const vns: number[] = [];
        for (let i = 0; i < this.vnodeCount; i++) {
          const vpos = fnv1a(`${node.id}#vn${i}`);
          vns.push(vpos);
          this.ring.set(vpos, node.id);
        }
        node.virtualNodes = vns;
      } else {
        node.virtualNodes = [];
      }
    }
    this.rebuildSortedPositions();
    this.reassignKeys();
  }

  /** Resets the ring to an empty state. */
  reset(): void {
    this.nodes.clear();
    this.ring.clear();
    this.sortedPositions = [];
    this.keys.clear();
  }

  // ── Internals ──────────────────────────────────────────────

  /** Rebuild the sorted position cache. */
  private rebuildSortedPositions(): void {
    this.sortedPositions = Array.from(this.ring.keys()).sort((a, b) => a - b);
  }

  /**
   * Finds the owning node for a hash value using binary search.
   * Walks clockwise to the first position >= hash; wraps around.
   */
  private findOwner(hash: number): string {
    const positions = this.sortedPositions;
    // Binary search for first position >= hash
    let lo = 0;
    let hi = positions.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (positions[mid] < hash) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    // Wrap around
    const idx = lo % positions.length;
    return this.ring.get(positions[idx])!;
  }

  /**
   * Re-evaluates all tracked keys against the current ring topology.
   * Returns a map of key -> new-owner for any keys that moved.
   */
  private reassignKeys(): Map<string, string> {
    const moved = new Map<string, string>();
    if (this.sortedPositions.length === 0) {
      // All keys become unassigned — clear assignments
      for (const hk of Array.from(this.keys.values())) {
        if (hk.assignedNode !== '') {
          moved.set(hk.key, '');
          hk.assignedNode = '';
        }
      }
      return moved;
    }

    for (const hk of Array.from(this.keys.values())) {
      const newOwner = this.findOwner(hk.hash);
      if (newOwner !== hk.assignedNode) {
        moved.set(hk.key, newOwner);
        hk.assignedNode = newOwner;
      }
    }
    return moved;
  }
}
