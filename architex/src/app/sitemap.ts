import type { MetadataRoute } from "next";
import { CHALLENGES } from "@/lib/interview/challenges";
import { BLOG_POSTS } from "@/lib/blog/posts";
import { CONCEPTS } from "@/lib/seo/concepts-data";
import { LLD_PROBLEMS } from "@/lib/seo/lld-problems-data";
import { DESIGN_PATTERNS } from "@/lib/seo/design-patterns-data";
import { COMPANIES } from "@/lib/seo/company-data";
import { DS_CATALOG } from "@/lib/data-structures/catalog";
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

export default function sitemap(): MetadataRoute.Sitemap {
  const problems: MetadataRoute.Sitemap = CHALLENGES.map((c) => ({
    url: `https://architex.dev/problems/${c.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const blogPosts: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `https://architex.dev/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const concepts: MetadataRoute.Sitemap = CONCEPTS.map((c) => ({
    url: `https://architex.dev/concepts/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const lldProblems: MetadataRoute.Sitemap = LLD_PROBLEMS.map((p) => ({
    url: `https://architex.dev/lld-problems/${p.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const designPatterns: MetadataRoute.Sitemap = DESIGN_PATTERNS.map((p) => ({
    url: `https://architex.dev/patterns/${p.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const companyInterviews: MetadataRoute.Sitemap = COMPANIES.map((c) => ({
    url: `https://architex.dev/interviews/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const osConcepts: MetadataRoute.Sitemap = [
    "cpu-scheduling",
    "page-replacement",
    "deadlock",
    "memory",
    "mem-alloc",
    "thread-sync",
  ].map((slug) => ({
    url: `https://architex.dev/os/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const CATEGORY_SLUGS: Record<string, string> = {
    sorting: "sorting",
    graph: "graph",
    tree: "tree",
    dp: "dp",
    string: "string",
    backtracking: "backtracking",
    geometry: "geometry",
  };

  const allAlgorithms: AlgorithmConfig[] = [
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

  const algorithms: MetadataRoute.Sitemap = allAlgorithms.map((algo) => ({
    url: `https://architex.dev/algorithms/${CATEGORY_SLUGS[algo.category] || algo.category}/${algo.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const dataStructures: MetadataRoute.Sitemap = DS_CATALOG.map((ds) => ({
    url: `https://architex.dev/ds/${ds.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    {
      url: "https://architex.dev",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: "https://architex.dev/problems",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: "https://architex.dev/blog",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: "https://architex.dev/concepts",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: "https://architex.dev/lld-problems",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: "https://architex.dev/patterns",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: "https://architex.dev/interviews",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: "https://architex.dev/os",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: "https://architex.dev/algorithms",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...problems,
    ...blogPosts,
    ...concepts,
    ...lldProblems,
    ...designPatterns,
    ...companyInterviews,
    ...osConcepts,
    ...algorithms,
    ...dataStructures,
  ];
}
