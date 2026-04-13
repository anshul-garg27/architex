import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getBlogPostBySlug,
  getAllBlogSlugs,
  getRelatedPosts,
} from "@/lib/blog/posts";
import { blogMetaDescription } from "@/lib/seo/meta-templates";

// ---------------------------------------------------------------------------
// Static generation for all blog slugs
// ---------------------------------------------------------------------------
export function generateStaticParams() {
  return getAllBlogSlugs().map((slug) => ({ slug }));
}

// ---------------------------------------------------------------------------
// Dynamic metadata (title, description, OG)
// ---------------------------------------------------------------------------
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) return { title: "Post Not Found — Architex" };

  const title = `${post.title} | Architex Blog`;
  const description = blogMetaDescription(post.title, post.tags);

  const ogImage = `https://architex.dev/api/og?title=${encodeURIComponent(post.title)}&type=blog`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://architex.dev/blog/${post.slug}`,
      siteName: "Architex",
      type: "article",
      publishedTime: post.date,
      tags: post.tags,
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
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
// Simple markdown renderer
// ---------------------------------------------------------------------------
function renderMarkdown(content: string): React.ReactNode[] {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("### ")) {
      elements.push(
        <h3
          key={key++}
          className="mb-3 mt-8 text-lg font-semibold text-[var(--foreground)]"
        >
          {trimmed.slice(4)}
        </h3>
      );
    } else if (trimmed.startsWith("## ")) {
      elements.push(
        <h2
          key={key++}
          className="mb-4 mt-10 text-xl font-bold text-[var(--foreground)]"
        >
          {trimmed.slice(3)}
        </h2>
      );
    } else if (trimmed.startsWith("# ")) {
      elements.push(
        <h1
          key={key++}
          className="mb-6 text-3xl font-bold tracking-tight text-[var(--foreground)]"
        >
          {trimmed.slice(2)}
        </h1>
      );
    } else {
      // Render inline markdown links: [text](url)
      const parts: React.ReactNode[] = [];
      let partKey = 0;
      const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = linkPattern.exec(trimmed)) !== null) {
        if (match.index > lastIndex) {
          parts.push(trimmed.slice(lastIndex, match.index));
        }
        parts.push(
          <Link
            key={`link-${partKey++}`}
            href={match[2]}
            className="text-[var(--primary)] underline underline-offset-2 hover:text-[var(--primary-hover)]"
          >
            {match[1]}
          </Link>
        );
        lastIndex = match.index + match[0].length;
      }

      if (lastIndex < trimmed.length) {
        parts.push(trimmed.slice(lastIndex));
      }

      elements.push(
        <p
          key={key++}
          className="mb-4 leading-relaxed text-[var(--foreground-muted)]"
        >
          {parts}
        </p>
      );
    }
  }

  return elements;
}

// ---------------------------------------------------------------------------
// Tag colors (same as list page)
// ---------------------------------------------------------------------------
const TAG_COLORS: Record<string, string> = {
  "distributed-systems": "bg-blue-500/15 text-blue-400",
  "system-design": "bg-purple-500/15 text-purple-400",
  interview: "bg-amber-500/15 text-amber-400",
  database: "bg-emerald-500/15 text-emerald-400",
};

function tagClass(tag: string): string {
  return TAG_COLORS[tag] ?? "bg-[var(--elevated)] text-[var(--foreground-muted)]";
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) notFound();

  const related = getRelatedPosts(slug);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/blog"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-[var(--foreground-muted)] transition-colors hover:text-[var(--primary)]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          All Posts
        </Link>

        {/* Article header */}
        <header className="mb-10">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tagClass(tag)}`}
              >
                {tag}
              </span>
            ))}
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {post.title}
          </h1>

          <div className="mt-3 flex items-center gap-3 text-sm text-[var(--foreground-muted)]">
            <time dateTime={post.date}>
              {new Date(post.date).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </time>
            <span aria-hidden="true">&middot;</span>
            <span>{post.readingTime} read</span>
          </div>
        </header>

        {/* Article body */}
        <article className="mb-16">{renderMarkdown(post.content)}</article>

        {/* CTA */}
        <div className="mb-16 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center sm:p-8">
          <h2 className="mb-2 text-xl font-semibold">Try it in Architex</h2>
          <p className="mb-6 text-sm text-[var(--foreground-muted)]">
            Explore the concepts from this post with interactive visualizations
            and hands-on system design tools.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary-hover)]"
          >
            Open Architex
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>

        {/* Related posts */}
        {related.length > 0 && (
          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
              Related Posts
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {related.map((relatedPost) => (
                <Link
                  key={relatedPost.slug}
                  href={`/blog/${relatedPost.slug}`}
                  className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--primary)]/50 hover:bg-[var(--elevated)]"
                >
                  <h3 className="mb-1 text-sm font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                    {relatedPost.title}
                  </h3>
                  <p className="text-xs text-[var(--foreground-muted)] line-clamp-2">
                    {relatedPost.excerpt}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-[10px] text-[var(--foreground-subtle)]">
                    <time dateTime={relatedPost.date}>
                      {new Date(relatedPost.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                    <span aria-hidden="true">&middot;</span>
                    <span>{relatedPost.readingTime}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
