// -----------------------------------------------------------------
// Architex -- Cosine Similarity with Step Recording
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';

export const COSINE_SIMILARITY_CONFIG: AlgorithmConfig = {
  id: 'cosine-similarity',
  name: 'Cosine Similarity',
  category: 'sorting',
  timeComplexity: { best: 'O(n)', average: 'O(n)', worst: 'O(n)' },
  spaceComplexity: 'O(1)',
  stable: false,
  inPlace: false,
  description:
    "How does Spotify know two songs are similar? It compares their embedding vectors using cosine similarity \u2014 the cosine of the angle between them. Two identical vectors: cos=1. Perpendicular (unrelated): cos=0. Opposite: cos=-1. Computed as: dot(A,B) / (|A| \u00D7 |B|). The key insight: it measures DIRECTION, not magnitude \u2014 a quiet version of a song and a loud version have the same cosine similarity. Used in: recommendation systems, semantic search, document similarity, RAG retrieval. Remember: 'Same direction = similar meaning, regardless of scale.'",
  pseudocode: [
    'procedure cosineSimilarity(A, B)',
    '  dotProduct = 0',
    '  magnitudeA = 0',
    '  magnitudeB = 0',
    '  for i = 0 to n-1:',
    '    dotProduct += A[i] * B[i]',
    '    magnitudeA += A[i] * A[i]',
    '    magnitudeB += B[i] * B[i]',
    '  magnitudeA = sqrt(magnitudeA)',
    '  magnitudeB = sqrt(magnitudeB)',
    '  return dotProduct / (magnitudeA * magnitudeB)',
  ],
  complexityIntuition:
    'We walk through both vectors once, computing the dot product and magnitudes in a single pass. Double the vector length, double the work \u2014 strictly linear. The final division is O(1).',
  difficulty: 'beginner',
};

// -- Default inputs --------------------------------------------------

const DEFAULT_VEC_A = [1, 2, 3, 4];
const DEFAULT_VEC_B = [2, 4, 6, 8];

// -- Main algorithm --------------------------------------------------

export function cosineSimilarity(
  arr: number[],
  vecA: number[] = DEFAULT_VEC_A,
  vecB: number[] = DEFAULT_VEC_B,
): AlgorithmResult {
  const n = vecA.length;
  const steps: AnimationStep[] = [];
  let stepId = 0;
  let reads = 0;
  let comparisons = 0;

  // We visualize the two vectors interleaved: A[0], B[0], A[1], B[1], ...
  // So element-0 = A[0], element-1 = B[0], element-2 = A[1], element-3 = B[1], etc.
  // The final state array holds the interleaved values for the visualizer.
  const visualArray: number[] = [];
  for (let i = 0; i < n; i++) {
    visualArray.push(vecA[i], vecB[i]);
  }

  // ---- Step 0: overview ----
  steps.push({
    id: stepId++,
    description:
      `Compute cosine similarity between A=[${vecA.join(', ')}] and B=[${vecB.join(', ')}]. We need three things: dot product (A\u00B7B), magnitude |A|, and magnitude |B|.`,
    pseudocodeLine: 0,
    mutations: [],
    complexity: { comparisons: 0, swaps: 0, reads: 0, writes: 0 },
    duration: 700,
  });

  let dotProduct = 0;
  let magASquared = 0;
  let magBSquared = 0;

  // ---- Element-by-element computation ----
  for (let i = 0; i < n; i++) {
    const a = vecA[i];
    const b = vecB[i];
    const product = a * b;
    dotProduct += product;
    magASquared += a * a;
    magBSquared += b * b;
    reads += 2;
    comparisons++;

    const aIdx = i * 2;
    const bIdx = i * 2 + 1;

    // Highlight the pair being processed
    const pairMutations: VisualMutation[] = [
      {
        targetId: `element-${aIdx}`,
        property: 'highlight',
        from: 'default',
        to: 'active',
        easing: 'spring',
      },
      {
        targetId: `element-${bIdx}`,
        property: 'highlight',
        from: 'default',
        to: 'active',
        easing: 'spring',
      },
    ];

    steps.push({
      id: stepId++,
      description: i === 0
        ? `Dimension ${i}: A[${i}]=${a}, B[${i}]=${b}. Multiply: ${a}\u00D7${b} = ${product}. This is the first component of the dot product \u2014 it measures how much these dimensions "agree."`
        : `Dimension ${i}: A[${i}]=${a} \u00D7 B[${i}]=${b} = ${product}. Running dot product: ${dotProduct}. Running |A|\u00B2: ${magASquared}, |B|\u00B2: ${magBSquared}.`,
      pseudocodeLine: 5,
      mutations: pairMutations,
      complexity: { comparisons, swaps: 0, reads, writes: 0 },
      duration: 450,
    });

    // Mark pair as processed
    const doneMutations: VisualMutation[] = [
      {
        targetId: `element-${aIdx}`,
        property: 'highlight',
        from: 'active',
        to: 'sorted',
        easing: 'ease-out',
      },
      {
        targetId: `element-${bIdx}`,
        property: 'highlight',
        from: 'active',
        to: 'sorted',
        easing: 'ease-out',
      },
    ];

    steps.push({
      id: stepId++,
      description:
        `Pair ${i} done. Accumulated: dot=${dotProduct}, |A|\u00B2=${magASquared}, |B|\u00B2=${magBSquared}.`,
      pseudocodeLine: 7,
      mutations: doneMutations,
      complexity: { comparisons, swaps: 0, reads, writes: 0 },
      duration: 300,
    });
  }

  // ---- Magnitude computation ----
  const magA = Math.sqrt(magASquared);
  const magB = Math.sqrt(magBSquared);

  steps.push({
    id: stepId++,
    description:
      `All dimensions processed. Now compute magnitudes: |A| = \u221A${magASquared} = ${magA.toFixed(4)}, |B| = \u221A${magBSquared} = ${magB.toFixed(4)}.`,
    pseudocodeLine: 8,
    mutations: [],
    complexity: { comparisons, swaps: 0, reads, writes: 0 },
    duration: 500,
  });

  // ---- Final division ----
  const denominator = magA * magB;
  const similarity = denominator === 0 ? 0 : dotProduct / denominator;

  const allFoundMutations: VisualMutation[] = visualArray.map((_, idx) => ({
    targetId: `element-${idx}`,
    property: 'highlight' as const,
    from: 'sorted' as const,
    to: 'found' as const,
    easing: 'spring' as const,
  }));

  steps.push({
    id: stepId++,
    description:
      `Final: cosine similarity = dot(A,B) / (|A| \u00D7 |B|) = ${dotProduct} / (${magA.toFixed(4)} \u00D7 ${magB.toFixed(4)}) = ${dotProduct} / ${denominator.toFixed(4)} = ${similarity.toFixed(6)}.`,
    pseudocodeLine: 10,
    mutations: allFoundMutations,
    complexity: { comparisons, swaps: 0, reads, writes: 0 },
    duration: 500,
  });

  // ---- Interpretation step ----
  let interpretation: string;
  if (Math.abs(similarity - 1) < 0.0001) {
    interpretation = `cos = ${similarity.toFixed(4)} (exactly 1.0) \u2014 the vectors point in the SAME direction. They are perfectly similar (one is a scalar multiple of the other). In ML, this means the embeddings represent the same concept.`;
  } else if (similarity > 0.9) {
    interpretation = `cos = ${similarity.toFixed(4)} (close to 1.0) \u2014 highly similar vectors. In a recommendation system, these items would be considered near-identical matches.`;
  } else if (Math.abs(similarity) < 0.0001) {
    interpretation = `cos = ${similarity.toFixed(4)} (near 0) \u2014 orthogonal vectors. These items are completely unrelated in the embedding space.`;
  } else if (similarity < -0.9) {
    interpretation = `cos = ${similarity.toFixed(4)} (near -1) \u2014 opposite vectors. These items are as dissimilar as possible in the embedding space.`;
  } else if (similarity > 0) {
    interpretation = `cos = ${similarity.toFixed(4)} (positive) \u2014 somewhat similar vectors. The higher the value, the more the vectors "agree" in direction.`;
  } else {
    interpretation = `cos = ${similarity.toFixed(4)} (negative) \u2014 somewhat dissimilar vectors. Negative cosine means the vectors generally point in opposite directions.`;
  }

  const finalMutations: VisualMutation[] = visualArray.map((_, idx) => ({
    targetId: `element-${idx}`,
    property: 'highlight' as const,
    from: 'found' as const,
    to: 'sorted' as const,
    easing: 'ease-out' as const,
  }));

  steps.push({
    id: stepId++,
    description: interpretation,
    pseudocodeLine: 10,
    mutations: finalMutations,
    complexity: { comparisons, swaps: 0, reads, writes: 0 },
    duration: 700,
  });

  return { config: COSINE_SIMILARITY_CONFIG, steps, finalState: visualArray };
}
