import { notFound } from 'next/navigation';
import {
  SORTING_ALGORITHMS,
  GRAPH_ALGORITHMS,
  TREE_ALGORITHMS,
  DP_ALGORITHMS,
  STRING_ALGORITHMS,
  BACKTRACKING_ALGORITHMS,
  GEOMETRY_ALGORITHMS,
} from '@/lib/algorithms';

const ALL_ALGOS = [
  ...SORTING_ALGORITHMS,
  ...GRAPH_ALGORITHMS,
  ...TREE_ALGORITHMS,
  ...DP_ALGORITHMS,
  ...STRING_ALGORITHMS,
  ...BACKTRACKING_ALGORITHMS,
  ...GEOMETRY_ALGORITHMS,
];

export default async function EmbedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const algo = ALL_ALGOS.find(a => a.id === slug);
  if (!algo) notFound();

  return (
    <div className="h-screen w-screen bg-background p-4 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-foreground">{algo.name}</h2>
        <a
          href={`/algorithms/${algo.category}/${algo.id}`}
          target="_blank"
          className="text-[10px] text-primary hover:underline"
        >
          Open in Architex &#8599;
        </a>
      </div>
      <div className="flex-1 rounded-lg border border-border bg-elevated flex items-center justify-center">
        <p className="text-sm text-foreground-muted text-center">
          Embedded visualization for {algo.name}.
          <br />
          Full interactive version at architex.dev
        </p>
      </div>
      <div className="mt-2 text-center text-[9px] text-foreground-subtle">
        Powered by <a href="/" className="text-primary">Architex</a>
      </div>
    </div>
  );
}
