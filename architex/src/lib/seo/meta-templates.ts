// ── SEO meta description template functions for Architex pages ────────
//
// Each function generates a consistent, 150-160 character meta description
// following the format:
//   "[Title] — Learn [topic] with interactive visualizations on Architex. [specific detail]."

const MAX_LENGTH = 160;

/** Truncate to fit within the character budget, ending at a word boundary. */
function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const truncated = text.slice(0, max - 1);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > max * 0.5 ? truncated.slice(0, lastSpace) : truncated).trimEnd() + ".";
}

/**
 * Concept page — e.g. "Load Balancer", "Caching"
 */
export function conceptMetaDescription(
  title: string,
  category: string,
  difficulty: string,
): string {
  return truncate(
    `${title} — Learn this ${difficulty} ${category} concept with interactive visualizations on Architex. Includes deep-dive explanation and interview questions.`,
    MAX_LENGTH,
  );
}

/**
 * System design problem page — e.g. "Design a URL Shortener"
 */
export function problemMetaDescription(
  title: string,
  companies: string[],
): string {
  const companyNote =
    companies.length > 0
      ? ` Asked at ${companies.slice(0, 3).join(", ")}.`
      : "";
  return truncate(
    `${title} — Practice this system design challenge with interactive architecture tools on Architex.${companyNote}`,
    MAX_LENGTH,
  );
}

/**
 * Design pattern page — e.g. "Singleton Pattern"
 */
export function patternMetaDescription(
  title: string,
  category: string,
): string {
  return truncate(
    `${title} Pattern — Learn this ${category} design pattern with interactive visualizations on Architex. Includes code examples and use cases.`,
    MAX_LENGTH,
  );
}

/**
 * Blog post page
 */
export function blogMetaDescription(
  title: string,
  tags: string[],
): string {
  const topicNote =
    tags.length > 0 ? ` Covers ${tags.slice(0, 2).join(" and ")}.` : "";
  return truncate(
    `${title} — Read this in-depth guide with interactive visualizations on Architex.${topicNote}`,
    MAX_LENGTH,
  );
}

/**
 * Company interview prep page — e.g. "Google", "Meta"
 */
export function companyMetaDescription(
  companyName: string,
  focusAreas: string[],
): string {
  const areasNote =
    focusAreas.length > 0
      ? ` Focuses on ${focusAreas.slice(0, 3).join(", ")}.`
      : "";
  return truncate(
    `${companyName} System Design Interview — Prepare with interactive practice on Architex.${areasNote}`,
    MAX_LENGTH,
  );
}

/**
 * LLD problem page — e.g. "Parking Lot System"
 */
export function lldProblemMetaDescription(
  title: string,
  keyPatterns: string[],
): string {
  const patternsNote =
    keyPatterns.length > 0
      ? ` Uses ${keyPatterns.slice(0, 3).join(", ")} patterns.`
      : "";
  return truncate(
    `${title} — Design this low-level system with interactive OOP tools on Architex.${patternsNote}`,
    MAX_LENGTH,
  );
}
