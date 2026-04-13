/**
 * Database Design Lab — B-Tree Index Visualization (DBL-018)
 *
 * Interactive B-Tree with step-by-step insert and search operations.
 * Records each comparison/split as a BTreeStep for animated playback.
 */

// ── Types ──────────────────────────────────────────────────────

export interface BTreeNode {
  id: string;
  keys: number[];
  children: BTreeNode[];
  isLeaf: boolean;
}

export interface BTreeStep {
  description: string;
  tree: BTreeNode;
  highlightNodeId?: string;
  highlightKey?: number;
  operation: "search" | "insert" | "split";
}

// ── Deep-clone helper ──────────────────────────────────────────

function cloneTree(node: BTreeNode): BTreeNode {
  return {
    id: node.id,
    keys: [...node.keys],
    children: node.children.map(cloneTree),
    isLeaf: node.isLeaf,
  };
}

// ── BTreeViz ───────────────────────────────────────────────────

/**
 * Interactive B-Tree that records every comparison, insertion, and split
 * as a {@link BTreeStep} for step-by-step animated playback in the UI.
 *
 * Each instance maintains its own ID counter so multiple trees never
 * produce conflicting node IDs.
 *
 * @example
 * const tree = new BTreeViz(3);
 * tree.insert(10);
 * tree.insert(20);
 * const steps = tree.insert(30); // triggers a root split
 * console.log(steps.map(s => s.operation)); // ["split", "insert"]
 */
export class BTreeViz {
  root: BTreeNode;
  order: number; // max number of children per node
  private idCounter = 0;

  /**
   * Create a new B-Tree with the given branching factor.
   *
   * @param order - Maximum number of children per node (default 3).
   *   A node holds at most `order - 1` keys before it must split.
   */
  constructor(order?: number) {
    this.order = order ?? 3;
    this.root = { id: this.nextId(), keys: [], children: [], isLeaf: true };
  }

  /** Generate a unique node ID scoped to this instance. */
  private nextId(): string {
    return `bn-${++this.idCounter}`;
  }

  /** Maximum keys a node can hold before it must split. */
  private get maxKeys(): number {
    return this.order - 1;
  }

  /**
   * Insert a key into the B-Tree, splitting nodes as needed to maintain
   * the B-Tree invariant (every node has at most `order - 1` keys).
   * Duplicate keys are rejected with an explanatory step.
   *
   * @param key - The numeric key to insert
   * @returns An ordered array of steps describing each traversal,
   *   split, and final insertion (or duplicate rejection)
   *
   * @example
   * const steps = tree.insert(42);
   * // steps[0].operation === "insert"
   * // steps[0].description explains where 42 was placed and why
   */
  insert(key: number): BTreeStep[] {
    const steps: BTreeStep[] = [];

    // If root is full, split it first
    if (this.root.keys.length === this.maxKeys) {
      const oldRoot = this.root;
      const newRoot: BTreeNode = {
        id: this.nextId(),
        keys: [],
        children: [oldRoot],
        isLeaf: false,
      };
      this.root = newRoot;
      this.splitChild(newRoot, 0, steps);
    }

    this.insertNonFull(this.root, key, steps);
    return steps;
  }

  /**
   * Search for a key, recording each node visited and the reasoning
   * for descending left, right, or middle at every level.
   *
   * @param key - The numeric key to search for
   * @returns Steps describing the search path; the last step indicates
   *   whether the key was found or confirmed missing
   */
  search(key: number): BTreeStep[] {
    const steps: BTreeStep[] = [];
    this.searchNode(this.root, key, steps);
    return steps;
  }

  /**
   * Return a deep copy of the current tree structure.
   * Safe for serialization or snapshotting without risk of mutation.
   *
   * @returns A recursively cloned {@link BTreeNode} root
   */
  getTree(): BTreeNode {
    return cloneTree(this.root);
  }

  /**
   * Reset to an empty single-node tree, preserving the configured order.
   * The ID counter continues from its current value so IDs remain unique
   * across the lifetime of this instance.
   */
  reset(): void {
    this.root = { id: this.nextId(), keys: [], children: [], isLeaf: true };
  }

  // ── Private helpers ────────────────────────────────────────────

  private searchNode(
    node: BTreeNode,
    key: number,
    steps: BTreeStep[],
  ): void {
    let keyIndex = 0;
    while (keyIndex < node.keys.length && key > node.keys[keyIndex]) {
      keyIndex++;
    }

    if (keyIndex < node.keys.length && node.keys[keyIndex] === key) {
      steps.push({
        description: `Found key ${key} in node [${node.keys.join(", ")}] — it matched at position ${keyIndex}, so our search is complete`,
        tree: cloneTree(this.root),
        highlightNodeId: node.id,
        highlightKey: key,
        operation: "search",
      });
      return;
    }

    // Build a 'why' explanation for descending to child keyIndex
    let searchReason: string;
    if (node.isLeaf) {
      searchReason = `Key ${key} not found — we reached leaf [${node.keys.join(", ")}] with no more children to explore, so the key does not exist in this tree`;
    } else if (keyIndex === 0) {
      searchReason = `Searching node [${node.keys.join(", ")}] — key ${key} is less than the smallest key ${node.keys[0]}, so we descend to the leftmost child (child 0) which contains all keys below ${node.keys[0]}`;
    } else if (keyIndex === node.keys.length) {
      searchReason = `Searching node [${node.keys.join(", ")}] — key ${key} is greater than the largest key ${node.keys[node.keys.length - 1]}, so we descend to the rightmost child (child ${keyIndex}) which contains all keys above ${node.keys[node.keys.length - 1]}`;
    } else {
      searchReason = `Searching node [${node.keys.join(", ")}] — key ${key} is between ${node.keys[keyIndex - 1]} and ${node.keys[keyIndex]}, so we descend to the middle child (child ${keyIndex}) which contains keys in that range`;
    }

    steps.push({
      description: searchReason,
      tree: cloneTree(this.root),
      highlightNodeId: node.id,
      highlightKey: key,
      operation: "search",
    });

    if (node.isLeaf) return;
    this.searchNode(node.children[keyIndex], key, steps);
  }

  private insertNonFull(
    node: BTreeNode,
    key: number,
    steps: BTreeStep[],
  ): void {
    let keyIndex = node.keys.length - 1;

    if (node.isLeaf) {
      // Check for duplicate key before inserting — B-Trees require unique keys.
      // Allowing duplicates would break search (which result is correct?) and
      // waste space storing redundant entries.
      if (node.keys.includes(key)) {
        steps.push({
          description: `Key ${key} already exists in node [${node.keys.join(", ")}] — B-Trees require unique keys, so we skip this insertion. To update a value, use an update operation instead.`,
          tree: cloneTree(this.root),
          highlightNodeId: node.id,
          highlightKey: key,
          operation: "insert",
        });
        return;
      }

      // Insert into leaf in sorted order — scan from right to left to find
      // the correct position. We go right-to-left because we're looking for
      // the first key that is <= our new key; everything after it shifts right.
      while (keyIndex >= 0 && key < node.keys[keyIndex]) {
        keyIndex--;
      }
      node.keys.splice(keyIndex + 1, 0, key);

      // Build a 'why' explanation for the insertion position
      const keysBeforeInsert = node.keys.filter((k) => k !== key);
      let insertReason: string;
      if (keysBeforeInsert.length === 0) {
        insertReason = `Inserted key ${key} into leaf [${node.keys.join(", ")}] — the leaf was empty, so this is the first key`;
      } else {
        insertReason = `Inserted key ${key} into leaf [${node.keys.join(", ")}] — this leaf is the correct location because ${key} falls between the parent's key boundaries, and position ${keyIndex + 1} keeps the keys in sorted order`;
      }

      steps.push({
        description: insertReason,
        tree: cloneTree(this.root),
        highlightNodeId: node.id,
        highlightKey: key,
        operation: "insert",
      });
    } else {
      // Check for duplicate key in this internal node — if the key matches
      // one of the separator keys, it already exists in the tree.
      if (node.keys.includes(key)) {
        steps.push({
          description: `Key ${key} already exists in node [${node.keys.join(", ")}] — B-Trees require unique keys, so we skip this insertion. To update a value, use an update operation instead.`,
          tree: cloneTree(this.root),
          highlightNodeId: node.id,
          highlightKey: key,
          operation: "insert",
        });
        return;
      }

      // Find child to descend into
      while (keyIndex >= 0 && key < node.keys[keyIndex]) {
        keyIndex--;
      }
      keyIndex++;

      // Build a 'why' explanation for descending to child keyIndex
      let traverseReason: string;
      if (keyIndex === 0) {
        traverseReason = `Traversing node [${node.keys.join(", ")}] — key ${key} is less than ${node.keys[0]}, so we descend to the leftmost child (child 0) which holds keys below ${node.keys[0]}`;
      } else if (keyIndex === node.keys.length) {
        traverseReason = `Traversing node [${node.keys.join(", ")}] — key ${key} is greater than ${node.keys[node.keys.length - 1]}, so we descend to the rightmost child (child ${keyIndex}) which holds keys above ${node.keys[node.keys.length - 1]}`;
      } else {
        traverseReason = `Traversing node [${node.keys.join(", ")}] — key ${key} is between ${node.keys[keyIndex - 1]} and ${node.keys[keyIndex]}, so we descend to child ${keyIndex} which holds keys in that range`;
      }

      steps.push({
        description: traverseReason,
        tree: cloneTree(this.root),
        highlightNodeId: node.id,
        highlightKey: key,
        operation: "insert",
      });

      // If child is full, split it first
      if (node.children[keyIndex].keys.length === this.maxKeys) {
        this.splitChild(node, keyIndex, steps);
        // After split, determine which of the two children to descend into
        if (key > node.keys[keyIndex]) {
          keyIndex++;
        }
      }

      this.insertNonFull(node.children[keyIndex], key, steps);
    }
  }

  private splitChild(
    parent: BTreeNode,
    childIndex: number,
    steps: BTreeStep[],
  ): void {
    const child = parent.children[childIndex];
    const midIndex = Math.floor(this.maxKeys / 2);
    const midKey = child.keys[midIndex];

    // ── Split Algorithm (3 steps) ──────────────────────────────
    //
    // A full node has [maxKeys] keys. We split it into two halves
    // around the median, then push the median up to the parent.
    // This keeps the tree balanced: every path from root to leaf
    // has the same length.

    // Step 1: Extract the RIGHT half of keys for the new sibling.
    // splice(midIndex+1) removes everything after the median and
    // returns it as an array. These keys are all GREATER than the
    // median, so they belong in the new right sibling node.
    const rightSibling: BTreeNode = {
      id: this.nextId(),
      keys: child.keys.splice(midIndex + 1),
      children: [],
      isLeaf: child.isLeaf,
    };

    // Step 2: Remove the MEDIAN key from the original child.
    // splice(midIndex) truncates the array at the median position,
    // removing it. This key will be PROMOTED to the parent to serve
    // as the separator between the left child and right sibling.
    // After this, the original child only has keys LESS than median.
    child.keys.splice(midIndex);

    // Step 3: Move the RIGHT half of children to the right sibling.
    // If this isn't a leaf, the child pointers after the median
    // belong with the keys that moved to the right sibling (since
    // child[i] points to keys between key[i-1] and key[i]).
    // splice(midIndex+1) extracts those child pointers.
    if (!child.isLeaf) {
      rightSibling.children = child.children.splice(midIndex + 1);
    }

    // Finally: Insert the promoted median key into the parent at
    // the correct position, and add the right sibling as the
    // parent's child immediately after the original child.
    parent.keys.splice(childIndex, 0, midKey);
    parent.children.splice(childIndex + 1, 0, rightSibling);

    steps.push({
      description: `Split node — the node was full (${this.maxKeys} keys max for order ${this.order}), so we split it and promoted the median key ${midKey} to the parent [${parent.keys.join(", ")}] to maintain balance. The left child keeps keys below ${midKey}, and the new right sibling gets keys above ${midKey}.`,
      tree: cloneTree(this.root),
      highlightNodeId: parent.id,
      highlightKey: midKey,
      operation: "split",
    });
  }
}
