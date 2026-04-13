"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Tag color map
// ---------------------------------------------------------------------------
const TAG_COLORS: Record<string, string> = {
  "distributed-systems": "bg-blue-500/15 text-blue-400",
  "system-design": "bg-purple-500/15 text-purple-400",
  interview: "bg-amber-500/15 text-amber-400",
  database: "bg-emerald-500/15 text-emerald-400",
};

function tagClass(tag: string): string {
  return (
    TAG_COLORS[tag] ?? "bg-[var(--elevated)] text-[var(--foreground-muted)]"
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface PostSummary {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readingTime: string;
  tags: string[];
}

interface BlogPostFiltersProps {
  posts: PostSummary[];
  categories: string[];
}

// ---------------------------------------------------------------------------
// Post card (compact — used for 2-col grid)
// ---------------------------------------------------------------------------
function PostCard({ post }: { post: PostSummary }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--primary)]/50 hover:bg-[var(--elevated)]"
    >
      {/* Tags */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {post.tags.map((tag) => (
          <span
            key={tag}
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${tagClass(tag)}`}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Title */}
      <h2 className="mb-2 text-base font-semibold leading-snug text-[var(--foreground)] transition-colors group-hover:text-[var(--primary)]">
        {post.title}
      </h2>

      {/* Excerpt */}
      <p className="mb-4 flex-1 text-sm leading-relaxed text-[var(--foreground-muted)]">
        {post.excerpt}
      </p>

      {/* Meta */}
      <div className="flex items-center gap-3 text-xs text-[var(--foreground-subtle)]">
        <time dateTime={post.date}>
          {new Date(post.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </time>
        <span aria-hidden="true">&middot;</span>
        <span>{post.readingTime} read</span>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Featured post card (full-width hero)
// ---------------------------------------------------------------------------
function FeaturedPostCard({ post }: { post: PostSummary }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] transition-colors hover:border-[var(--primary)]/50 hover:bg-[var(--elevated)] sm:flex-row"
    >
      {/* Thumbnail / accent area */}
      <div className="relative flex h-48 shrink-0 items-center justify-center bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/5 sm:h-auto sm:w-2/5">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="rounded-full bg-[var(--primary)]/15 px-3 py-1 text-xs font-semibold text-[var(--primary)]">
            Featured
          </span>
          <svg
            className="h-12 w-12 text-[var(--primary)]/30"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
            />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {/* Tags */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${tagClass(tag)}`}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Title */}
        <h2 className="mb-2 text-lg font-bold leading-snug text-[var(--foreground)] transition-colors group-hover:text-[var(--primary)] sm:text-xl">
          {post.title}
        </h2>

        {/* Excerpt */}
        <p className="mb-4 flex-1 text-sm leading-relaxed text-[var(--foreground-muted)]">
          {post.excerpt}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-[var(--foreground-subtle)]">
          <time dateTime={post.date}>
            {new Date(post.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </time>
          <span aria-hidden="true">&middot;</span>
          <span>{post.readingTime} read</span>
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function BlogPostFilters({ posts, categories }: BlogPostFiltersProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredPosts = useMemo(() => {
    if (!activeCategory) return posts;
    return posts.filter((p) => p.tags.includes(activeCategory));
  }, [posts, activeCategory]);

  const [featured, ...rest] = filteredPosts;

  return (
    <>
      {/* Category filter pills */}
      {categories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          <button
            onClick={() => setActiveCategory(null)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              activeCategory === null
                ? "border-[var(--primary)] bg-[var(--primary)]/15 text-[var(--primary)]"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground-muted)] hover:border-[var(--primary)]/40 hover:text-[var(--foreground)]"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() =>
                setActiveCategory((prev) => (prev === cat ? null : cat))
              }
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? "border-[var(--primary)] bg-[var(--primary)]/15 text-[var(--primary)]"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground-muted)] hover:border-[var(--primary)]/40 hover:text-[var(--foreground)]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Featured post */}
      {featured && <FeaturedPostCard post={featured} />}

      {/* Remaining posts — 2-column grid */}
      {rest.length > 0 && (
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {rest.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}

      {filteredPosts.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-sm text-[var(--foreground-muted)]">
            No posts found for this category.
          </p>
        </div>
      )}
    </>
  );
}
