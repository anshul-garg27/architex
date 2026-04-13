import Link from "next/link";
import { ChevronRight } from "lucide-react";

/** A single breadcrumb segment. Items without href render as plain text (current page). */
export interface BreadcrumbItem {
  /** Display text for this breadcrumb segment. */
  label: string;
  /** Navigation target. Omit for the current (last) page. */
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

/**
 * Simple breadcrumb navigation: Home > Section > Current Page.
 * The last item renders as plain text (current page), all others are links.
 */
export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center gap-1.5 text-sm text-[var(--foreground-muted)]">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-1.5">
              {i > 0 && (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--foreground-subtle)]" aria-hidden="true" />
              )}
              {isLast || !item.href ? (
                <span className="text-[var(--foreground)]" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="transition-colors hover:text-[var(--primary)]"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
