import type { JsonLdObject } from "@/lib/seo/json-ld";

// ── Props ───────────────────────────────────────────────────────────

interface JsonLdProps {
  /** A single JSON-LD structured data object or an array of them. */
  data: JsonLdObject | JsonLdObject[];
}

// ── Component ───────────────────────────────────────────────────────

/**
 * Renders one or more `<script type="application/ld+json">` tags for
 * search engine structured data.
 *
 * SAFETY: The JSON-LD content is generated exclusively from trusted
 * server-side data (concept definitions, site constants). No user input
 * flows into the serialized JSON.
 *
 * Usage:
 * ```tsx
 * <JsonLd data={generateOrganizationJsonLd()} />
 * <JsonLd data={[breadcrumb, learningResource]} />
 * ```
 */
export function JsonLd({ data }: JsonLdProps) {
  const items = Array.isArray(data) ? data : [data];

  return (
    <>
      {items.map((item, index) => (
        <script
          key={`jsonld-${item["@type"]}-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item),
          }}
        />
      ))}
    </>
  );
}
