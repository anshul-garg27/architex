// -----------------------------------------------------------------
// Architex -- Tarjan's Strongly Connected Components  (ALG-032)
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';
import type { Graph } from './types';

const CONFIG: AlgorithmConfig = {
  id: 'tarjan-scc',
  name: "Tarjan's SCC",
  category: 'graph',
  timeComplexity: {
    best: 'O(V + E)',
    average: 'O(V + E)',
    worst: 'O(V + E)',
  },
  spaceComplexity: 'O(V)',
  description:
    'Finds all strongly connected components in a directed graph using DFS with lowlink values and an explicit stack.',
  pseudocode: [
    'procedure Tarjan(G)',
    '  index = 0; S = empty stack',
    '  for each vertex v in G do',
    '    if v.index is undefined then',
    '      strongconnect(v)',
    'procedure strongconnect(v)',
    '  v.index = v.lowlink = index++',
    '  push v onto S; v.onStack = true',
    '  for each edge (v, w) do',
    '    if w.index is undefined then',
    '      strongconnect(w)',
    '      v.lowlink = min(v.lowlink, w.lowlink)',
    '    else if w.onStack then',
    '      v.lowlink = min(v.lowlink, w.index)',
    '  if v.lowlink == v.index then',
    '    pop SCC from stack until v',
    '    output SCC',
  ],
};

/** Color palette for highlighting different SCCs. */
const SCC_HIGHLIGHTS: string[] = [
  'in-path',
  'current',
  'discovered',
  'visiting',
  'visited',
  'in-queue',
];

export function tarjanSCC(graph: Graph): AlgorithmResult {
  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let reads = 0;
  let writes = 0;

  // Build adjacency list (directed edges only)
  const adj = new Map<string, string[]>();
  for (const node of graph.nodes) {
    adj.set(node.id, []);
  }
  for (const edge of graph.edges) {
    // Tarjan's SCC algorithm only works on directed graphs.
    // Skip undirected edges to avoid incorrect results.
    if (!edge.directed) continue;
    adj.get(edge.source)?.push(edge.target);
  }

  // Tarjan state
  const disc = new Map<string, number>();
  const lowlink = new Map<string, number>();
  const onStack = new Map<string, boolean>();
  const stack: string[] = [];
  let indexCounter = 0;
  const allSCCs: string[][] = [];

  steps.push({
    id: stepId++,
    description: 'Initialize Tarjan\'s SCC: start DFS on directed graph',
    pseudocodeLine: 0,
    mutations: [],
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 400,
  });

  function strongConnect(v: string): void {
    // Set discovery index and lowlink
    const vIndex = indexCounter;
    disc.set(v, vIndex);
    lowlink.set(v, vIndex);
    indexCounter++;
    writes += 2;

    stack.push(v);
    onStack.set(v, true);

    steps.push({
      id: stepId++,
      description: `Visit ${v}: disc=${vIndex}, lowlink=${vIndex}. Push onto stack`,
      pseudocodeLine: 6,
      mutations: [
        {
          targetId: `node-${v}`,
          property: 'highlight',
          from: 'default',
          to: 'visiting',
          easing: 'ease-out',
        },
        {
          targetId: `node-${v}`,
          property: 'label',
          from: '',
          to: `d=${vIndex} ll=${vIndex}`,
          easing: 'ease-out',
        },
      ],
      complexity: { comparisons, swaps: 0, reads, writes },
      duration: 400,
    });

    // Explore neighbors
    const neighbors = adj.get(v) ?? [];
    for (const w of neighbors) {
      comparisons++;
      reads++;

      const edgeMutations: VisualMutation[] = [
        {
          targetId: `edge-${v}-${w}`,
          property: 'highlight',
          from: 'default',
          to: 'visiting',
          easing: 'ease-out',
        },
      ];

      if (!disc.has(w)) {
        // w not yet visited -- recurse
        steps.push({
          id: stepId++,
          description: `Edge ${v} -> ${w}: ${w} not visited. Recurse`,
          pseudocodeLine: 9,
          mutations: edgeMutations,
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 300,
        });

        strongConnect(w);

        // Update lowlink after recursion
        const vLow = lowlink.get(v)!;
        const wLow = lowlink.get(w)!;
        const newLow = Math.min(vLow, wLow);
        lowlink.set(v, newLow);
        writes++;

        if (newLow !== vLow) {
          steps.push({
            id: stepId++,
            description: `Back to ${v}: lowlink[${v}] = min(${vLow}, lowlink[${w}]=${wLow}) = ${newLow}`,
            pseudocodeLine: 11,
            mutations: [
              {
                targetId: `node-${v}`,
                property: 'label',
                from: `d=${disc.get(v)} ll=${vLow}`,
                to: `d=${disc.get(v)} ll=${newLow}`,
                easing: 'ease-out',
              },
            ],
            complexity: { comparisons, swaps: 0, reads, writes },
            duration: 300,
          });
        }
      } else if (onStack.get(w)) {
        // w on stack -- back edge
        const vLow = lowlink.get(v)!;
        const wDisc = disc.get(w)!;
        const newLow = Math.min(vLow, wDisc);
        lowlink.set(v, newLow);
        writes++;

        steps.push({
          id: stepId++,
          description: `Edge ${v} -> ${w}: ${w} on stack. lowlink[${v}] = min(${vLow}, disc[${w}]=${wDisc}) = ${newLow}`,
          pseudocodeLine: 13,
          mutations: [
            ...edgeMutations,
            {
              targetId: `node-${v}`,
              property: 'label',
              from: `d=${disc.get(v)} ll=${vLow}`,
              to: `d=${disc.get(v)} ll=${newLow}`,
              easing: 'ease-out',
            },
          ],
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 350,
        });
      } else {
        // w already processed and not on stack -- cross edge
        steps.push({
          id: stepId++,
          description: `Edge ${v} -> ${w}: ${w} already processed (not on stack). Skip`,
          pseudocodeLine: 8,
          mutations: edgeMutations,
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 200,
        });
      }
    }

    // Check if v is a root of an SCC
    if (lowlink.get(v) === disc.get(v)) {
      // Pop SCC from stack
      const scc: string[] = [];
      let w: string;
      const colorIdx = allSCCs.length % SCC_HIGHLIGHTS.length;
      const highlight = SCC_HIGHLIGHTS[colorIdx];
      const sccMutations: VisualMutation[] = [];

      do {
        w = stack.pop()!;
        onStack.set(w, false);
        scc.push(w);
        sccMutations.push({
          targetId: `node-${w}`,
          property: 'highlight',
          from: 'visiting',
          to: highlight,
          easing: 'ease-out',
        });
      } while (w !== v);

      allSCCs.push(scc);

      steps.push({
        id: stepId++,
        description: `SCC #${allSCCs.length} found: {${scc.join(', ')}} (${scc.length} node${scc.length > 1 ? 's' : ''})`,
        pseudocodeLine: 15,
        mutations: sccMutations,
        complexity: { comparisons, swaps: 0, reads, writes },
        duration: 600,
      });
    }
  }

  // Run Tarjan on all unvisited nodes
  for (const node of graph.nodes) {
    if (!disc.has(node.id)) {
      strongConnect(node.id);
    }
  }

  // Summary step
  steps.push({
    id: stepId++,
    description: `Complete: found ${allSCCs.length} strongly connected component${allSCCs.length !== 1 ? 's' : ''}`,
    pseudocodeLine: 0,
    mutations: [],
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 400,
  });

  // finalState: SCC index for each node (0-based)
  const nodeToSCC = new Map<string, number>();
  for (let i = 0; i < allSCCs.length; i++) {
    for (const nodeId of allSCCs[i]) {
      nodeToSCC.set(nodeId, i);
    }
  }
  const finalState = graph.nodes.map((n) => nodeToSCC.get(n.id) ?? -1);

  return { config: CONFIG, steps, finalState };
}
