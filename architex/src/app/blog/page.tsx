import type { Metadata } from "next";
import Link from "next/link";
import { BLOG_POSTS } from "@/lib/blog/posts";
import { BlogPostFilters } from "./BlogPostFilters";

// ---------------------------------------------------------------------------
// SEO metadata
// ---------------------------------------------------------------------------
export const metadata: Metadata = {
  title: "Blog — System Design Insights & Interactive Guides | Architex",
  description:
    "Deep dives into system design, distributed systems, and software architecture. Each post pairs with interactive visualizations in Architex.",
  openGraph: {
    title: "Blog — System Design Insights & Interactive Guides | Architex",
    description:
      "Deep dives into system design, distributed systems, and software architecture.",
    url: "https://architex.dev/blog",
    siteName: "Architex",
    type: "website",
    images: [
      {
        url: "https://architex.dev/api/og?title=System+Design+Blog&type=blog",
        width: 1200,
        height: 630,
        alt: "Architex Blog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog | Architex",
    description:
      "System design deep dives with interactive visualizations.",
    images: ["https://architex.dev/api/og?title=System+Design+Blog&type=blog"],
  },
  alternates: {
    types: {
      "application/rss+xml": "https://architex.dev/blog/feed.xml",
    },
  },
};

// ---------------------------------------------------------------------------
// Collect unique categories from all posts
// ---------------------------------------------------------------------------
const ALL_CATEGORIES = Array.from(
  new Set(BLOG_POSTS.flatMap((p) => p.tags)),
).sort();

// ---------------------------------------------------------------------------
// Page (server component)
// ---------------------------------------------------------------------------
export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-10">
          <Link
            href="/landing"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--foreground-muted)] transition-colors hover:text-[var(--primary)]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Home
          </Link>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Blog
          </h1>
          <p className="mt-2 max-w-2xl text-[var(--foreground-muted)]">
            Deep dives into system design, distributed systems, and software
            architecture. Each post pairs with interactive visualizations in
            Architex.
          </p>
        </header>

        {/* Interactive filters + post grid (client component) */}
        <BlogPostFilters
          posts={BLOG_POSTS.map((p) => ({
            slug: p.slug,
            title: p.title,
            excerpt: p.excerpt,
            date: p.date,
            readingTime: p.readingTime,
            tags: p.tags,
          }))}
          categories={ALL_CATEGORIES}
        />
      </div>
    </div>
  );
}
