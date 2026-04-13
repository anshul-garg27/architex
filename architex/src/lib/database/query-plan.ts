/**
 * Database Design Lab — Query Plan Visualizer (DBL-015 to DBL-017)
 *
 * Heuristic-based SQL query plan generator for educational purposes.
 * Parses basic SQL patterns with regex and produces a tree of
 * QueryPlanNode objects representing a simplified execution plan.
 */

// ── Types ──────────────────────────────────────────────────────

export interface QueryPlanNode {
  id: string;
  type:
    | "SeqScan"
    | "IndexScan"
    | "HashJoin"
    | "MergeJoin"
    | "NestedLoop"
    | "Sort"
    | "Aggregate"
    | "Filter"
    | "Limit";
  table?: string;
  cost: number;
  rows: number;
  description: string;
  children: QueryPlanNode[];
}

// ── Helpers ────────────────────────────────────────────────────

/** Estimate row count for a table (simple heuristic). */
function estimateRows(table: string): number {
  // Deterministic pseudo-random based on table name
  let hash = 0;
  for (let i = 0; i < table.length; i++) {
    hash = (hash * 31 + table.charCodeAt(i)) | 0;
  }
  return 500 + Math.abs(hash % 9500); // 500–9999
}

// ── Primary key / index heuristic ──────────────────────────────

/** Returns true when the WHERE clause looks like a primary-key lookup. */
function isPKLookup(whereClause: string): boolean {
  // Matches patterns like `id = 1`, `user_id = 42`, `users.id = 5`
  return /\b(\w+\.)?(id|pk|_id)\s*=\s*\d+/i.test(whereClause);
}

// ── Main generator ─────────────────────────────────────────────

/**
 * Generate a simplified, heuristic-based query execution plan tree for
 * educational visualization. Parses basic SQL patterns (SELECT, JOIN,
 * WHERE, GROUP BY, ORDER BY, LIMIT) with regex and produces a tree of
 * {@link QueryPlanNode} objects representing the plan operators.
 *
 * ID generation is scoped to each call, so the same SQL always produces
 * identical node IDs (deterministic for tests and snapshots).
 *
 * @param sql - A SQL query string (e.g., "SELECT * FROM users WHERE id = 1")
 * @returns The root {@link QueryPlanNode} of the execution plan tree.
 *   Leaf nodes are scans; parent nodes are joins, filters, sorts, etc.
 *
 * @example
 * const plan = generateQueryPlan("SELECT * FROM users WHERE id = 1");
 * // plan.type === "IndexScan"
 * // plan.description === "Index scan on users using pk"
 */
export function generateQueryPlan(sql: string): QueryPlanNode {
  // Local counter scoped to this call for deterministic, non-leaking IDs
  let nodeId = 0;
  const nextId = () => `qp-${++nodeId}`;

  function seqScan(table: string): QueryPlanNode {
    const rows = estimateRows(table);
    return {
      id: nextId(),
      type: "SeqScan",
      table,
      cost: rows * 0.01,
      rows,
      description: `Sequential scan on ${table}`,
      children: [],
    };
  }

  function indexScan(table: string, index: string): QueryPlanNode {
    const rows = 1; // point lookup
    return {
      id: nextId(),
      type: "IndexScan",
      table,
      cost: 0.05,
      rows,
      description: `Index scan on ${table} using ${index}`,
      children: [],
    };
  }

  const trimmed = sql.trim().replace(/;$/, "");

  // ── LIMIT ──────────────────────────────────────────────────
  const limitMatch = trimmed.match(/\bLIMIT\s+(\d+)/i);
  const hasLimit = !!limitMatch;
  const limitN = hasLimit ? parseInt(limitMatch![1], 10) : 0;
  const sqlNoLimit = trimmed.replace(/\bLIMIT\s+\d+/i, "").trim();

  // ── GROUP BY / aggregate ───────────────────────────────────
  const hasAggregate =
    /\b(count|sum|avg|min|max)\s*\(/i.test(sqlNoLimit) ||
    /\bGROUP\s+BY\b/i.test(sqlNoLimit);

  // ── ORDER BY ───────────────────────────────────────────────
  const orderByMatch = sqlNoLimit.match(/\bORDER\s+BY\s+(\w+)/i);
  const hasOrderBy = !!orderByMatch;

  // ── JOIN ───────────────────────────────────────────────────
  const joinMatch = sqlNoLimit.match(
    /\bFROM\s+(\w+)\s+(?:INNER\s+)?JOIN\s+(\w+)\s+ON\s+(.+?)(?:\s+WHERE|\s+GROUP|\s+ORDER|\s+LIMIT|$)/i,
  );

  // ── WHERE ──────────────────────────────────────────────────
  const whereMatch = sqlNoLimit.match(
    /\bWHERE\s+(.+?)(?:\s+GROUP|\s+ORDER|\s+LIMIT|$)/i,
  );

  // ── FROM (simple) ─────────────────────────────────────────
  const fromMatch = sqlNoLimit.match(/\bFROM\s+(\w+)/i);

  let root: QueryPlanNode;

  if (joinMatch) {
    // JOIN query
    const [, leftTable, rightTable] = joinMatch;
    const leftScan = seqScan(leftTable);
    const rightScan = seqScan(rightTable);
    const joinCost = leftScan.cost + rightScan.cost + 5;
    root = {
      id: nextId(),
      type: "HashJoin",
      cost: joinCost,
      rows: Math.min(leftScan.rows, rightScan.rows),
      description: `Hash join ${leftTable} and ${rightTable}`,
      children: [leftScan, rightScan],
    };
  } else if (fromMatch) {
    const table = fromMatch[1];

    if (whereMatch && isPKLookup(whereMatch[1])) {
      // PK / index lookup
      root = indexScan(table, "pk");
    } else if (whereMatch) {
      // Non-index filter over seq scan
      const scan = seqScan(table);
      root = {
        id: nextId(),
        type: "Filter",
        cost: scan.cost + 0.5,
        rows: Math.max(1, Math.floor(scan.rows * 0.1)),
        description: `Filter: ${whereMatch[1].trim()}`,
        children: [scan],
      };
    } else {
      root = seqScan(table);
    }
  } else {
    // Fallback — cannot parse
    root = {
      id: nextId(),
      type: "SeqScan",
      cost: 1,
      rows: 1,
      description: "Unable to parse query",
      children: [],
    };
  }

  // Wrap with aggregate if needed
  if (hasAggregate) {
    const aggRows = Math.max(1, Math.floor(root.rows * 0.05));
    root = {
      id: nextId(),
      type: "Aggregate",
      cost: root.cost + 2,
      rows: aggRows,
      description: "Aggregate (GROUP BY / function)",
      children: [root],
    };
  }

  // Wrap with sort if needed
  if (hasOrderBy) {
    root = {
      id: nextId(),
      type: "Sort",
      cost: root.cost + root.rows * 0.005,
      rows: root.rows,
      description: `Sort by ${orderByMatch![1]}`,
      children: [root],
    };
  }

  // Wrap with limit if needed
  if (hasLimit) {
    root = {
      id: nextId(),
      type: "Limit",
      cost: root.cost + 0.01,
      rows: Math.min(limitN, root.rows),
      description: `Limit ${limitN}`,
      children: [root],
    };
  }

  return root;
}
