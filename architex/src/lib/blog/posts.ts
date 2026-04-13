import { BLOG_POST_DATA } from "@/lib/seo/blog-data";

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readingTime: string;
  tags: string[];
  content: string; // markdown content
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'how-consistent-hashing-works',
    title: 'How Consistent Hashing Works — An Interactive Guide',
    excerpt: 'Learn consistent hashing through interactive visualization. See how keys redistribute when nodes join or leave.',
    date: '2026-04-11',
    readingTime: '8 min',
    tags: ['distributed-systems', 'system-design'],
    content: `# How Consistent Hashing Works\n\nConsistent hashing is a technique...\n\n## The Problem with Simple Hashing\n\nWhen you have N servers...\n\n## The Hash Ring\n\nImagine a circle from 0 to 2^32...\n\n## Virtual Nodes\n\nTo improve distribution...\n\n## Try It Yourself\n\nOpen the [Distributed Systems module](/distributed) and select "Consistent Hashing" to see it in action.`,
  },
  {
    slug: 'system-design-interview-framework',
    title: 'The 4-Step System Design Interview Framework',
    excerpt: 'A structured approach to ace any system design interview: Requirements, Estimation, Design, Deep Dive.',
    date: '2026-04-10',
    readingTime: '12 min',
    tags: ['interview', 'system-design'],
    content: `# The 4-Step Framework\n\n## Step 1: Clarify Requirements\n\n...\n\n## Step 2: Back-of-Envelope Estimation\n\n...\n\n## Step 3: High-Level Design\n\n...\n\n## Step 4: Deep Dive\n\n...`,
  },
  {
    slug: 'understanding-cap-theorem',
    title: 'Understanding CAP Theorem Through Interactive Simulation',
    excerpt: 'Explore CP vs AP trade-offs with a live 3-node cluster simulation.',
    date: '2026-04-09',
    readingTime: '6 min',
    tags: ['distributed-systems', 'database'],
    content: `# CAP Theorem Explained\n\n...`,
  },
  // New posts from blog-data.ts
  ...BLOG_POST_DATA.map((post) => ({
    slug: post.slug,
    title: post.title,
    excerpt: post.description,
    date: post.date,
    readingTime: post.readingTime,
    tags: post.tags,
    content: post.content,
  })),
];

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

export function getAllBlogSlugs(): string[] {
  return BLOG_POSTS.map((post) => post.slug);
}

export function getRelatedPosts(currentSlug: string, limit = 2): BlogPost[] {
  const current = getBlogPostBySlug(currentSlug);
  if (!current) return [];

  return BLOG_POSTS.filter((post) => post.slug !== currentSlug)
    .map((post) => ({
      post,
      score: post.tags.filter((tag) => current.tags.includes(tag)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ post }) => post);
}
