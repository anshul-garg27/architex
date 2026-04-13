import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  SORTING_ALGORITHMS,
  GRAPH_ALGORITHMS,
  TREE_ALGORITHMS,
  DP_ALGORITHMS,
  STRING_ALGORITHMS,
  BACKTRACKING_ALGORITHMS,
  GEOMETRY_ALGORITHMS,
  SEARCH_ALGORITHMS,
  GREEDY_ALGORITHMS,
  PATTERN_ALGORITHMS,
  PROBABILISTIC_ALGORITHMS,
  VECTOR_SEARCH_ALGORITHMS,
  DESIGN_ALGORITHMS,
} from "@/lib/algorithms";
import type { AlgorithmConfig } from "@/lib/algorithms";

// ---------------------------------------------------------------------------
// Aggregate every algorithm from every category
// ---------------------------------------------------------------------------
const ALL_ALGORITHMS: AlgorithmConfig[] = [
  ...SORTING_ALGORITHMS,
  ...GRAPH_ALGORITHMS,
  ...TREE_ALGORITHMS,
  ...DP_ALGORITHMS,
  ...STRING_ALGORITHMS,
  ...BACKTRACKING_ALGORITHMS,
  ...GEOMETRY_ALGORITHMS,
  ...SEARCH_ALGORITHMS,
  ...GREEDY_ALGORITHMS,
  ...PATTERN_ALGORITHMS,
  ...PROBABILISTIC_ALGORITHMS,
  ...VECTOR_SEARCH_ALGORITHMS,
  ...DESIGN_ALGORITHMS,
];

// Map internal category names to URL-safe slugs
const CATEGORY_SLUGS: Record<string, string> = {
  sorting: "sorting",
  graph: "graph",
  tree: "tree",
  dp: "dp",
  string: "string",
  backtracking: "backtracking",
  geometry: "geometry",
};

// ---------------------------------------------------------------------------
// Static generation — one page per algorithm
// ---------------------------------------------------------------------------
export function generateStaticParams() {
  return ALL_ALGORITHMS.map((algo) => ({
    category: CATEGORY_SLUGS[algo.category] || algo.category,
    slug: algo.id,
  }));
}

// ---------------------------------------------------------------------------
// Dynamic metadata (title, description, OG)
// ---------------------------------------------------------------------------
type Props = { params: Promise<{ category: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const algo = ALL_ALGORITHMS.find((a) => a.id === slug);
  if (!algo) return { title: "Algorithm Not Found — Architex" };

  const title = `${algo.name} — Interactive Visualization | Architex`;
  const description = algo.description.slice(0, 155);
  const ogImage = `https://architex.dev/api/og?title=${encodeURIComponent(algo.name)}&type=algorithm`;

  return {
    title,
    description,
    openGraph: {
      title: `${algo.name} — Step-by-Step Visualization`,
      description,
      url: `https://architex.dev/algorithms/${CATEGORY_SLUGS[algo.category] || algo.category}/${algo.id}`,
      siteName: "Architex",
      type: "article",
      images: [{ url: ogImage, width: 1200, height: 630, alt: algo.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default async function AlgorithmPage({ params }: Props) {
  const { slug } = await params;
  const algo = ALL_ALGORITHMS.find((a) => a.id === slug);
  if (!algo) notFound();

  const categorySlug = CATEGORY_SLUGS[algo.category] || algo.category;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <nav className="mb-6 text-sm text-foreground-subtle">
        <a href="/algorithms" className="hover:text-foreground">
          Algorithms
        </a>
        <span className="mx-2">/</span>
        <a
          href={`/algorithms/${categorySlug}`}
          className="capitalize hover:text-foreground"
        >
          {algo.category}
        </a>
        <span className="mx-2">/</span>
        <span className="text-foreground">{algo.name}</span>
      </nav>

      <h1 className="text-2xl font-bold text-foreground mb-4">{algo.name}</h1>
      <p className="text-foreground-muted max-w-lg text-center mb-6">
        {algo.description}
      </p>

      <div className="flex gap-4">
        <a
          href={`/?module=algorithms&algo=${algo.id}`}
          className="rounded-lg bg-primary px-6 py-3 text-white font-medium hover:bg-primary/90"
        >
          Open in Visualizer &rarr;
        </a>
      </div>

      <div className="mt-8 text-sm text-foreground-subtle space-y-1">
        <p>
          Time: {algo.timeComplexity.best} / {algo.timeComplexity.average} /{" "}
          {algo.timeComplexity.worst}
        </p>
        <p>Space: {algo.spaceComplexity}</p>
        {algo.difficulty && (
          <p className="capitalize">Difficulty: {algo.difficulty}</p>
        )}
      </div>
    </div>
  );
}
