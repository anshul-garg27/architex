// ── JSON-LD Structured Data generators for Architex SEO ─────────────

const SITE_URL = "https://architex.dev";
const SITE_NAME = "Architex";

// ── Types ───────────────────────────────────────────────────────────

export interface CourseJsonLdInput {
  name: string;
  description: string;
  url?: string;
  provider?: string;
}

export interface LearningResourceJsonLdInput {
  name: string;
  description: string;
  url: string;
  educationalLevel?: string;
  keywords?: string[];
  datePublished?: string;
  dateModified?: string;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

// ── JSON-LD output types ────────────────────────────────────────────

export interface JsonLdObject {
  "@context": "https://schema.org";
  "@type": string;
  [key: string]: unknown;
}

// ── Generators ──────────────────────────────────────────────────────

/**
 * Course schema — positions Architex as a structured learning platform.
 */
export function generateCourseJsonLd(course: CourseJsonLdInput): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.name,
    description: course.description,
    url: course.url ?? SITE_URL,
    provider: {
      "@type": "Organization",
      name: course.provider ?? SITE_NAME,
      sameAs: SITE_URL,
    },
    isAccessibleForFree: true,
    inLanguage: "en",
  };
}

/**
 * LearningResource schema — used for individual concept / problem pages.
 */
export function generateLearningResourceJsonLd(
  resource: LearningResourceJsonLdInput,
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: resource.name,
    description: resource.description,
    url: resource.url,
    educationalLevel: resource.educationalLevel ?? "Intermediate",
    learningResourceType: "Concept Explanation",
    inLanguage: "en",
    isAccessibleForFree: true,
    provider: {
      "@type": "Organization",
      name: SITE_NAME,
      sameAs: SITE_URL,
    },
    ...(resource.keywords && { keywords: resource.keywords.join(", ") }),
    ...(resource.datePublished && { datePublished: resource.datePublished }),
    ...(resource.dateModified && { dateModified: resource.dateModified }),
  };
}

/**
 * BreadcrumbList schema — provides hierarchical navigation context.
 */
export function generateBreadcrumbJsonLd(
  items: BreadcrumbItem[],
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * FAQPage schema — surfaces FAQ content in search results.
 */
export function generateFAQJsonLd(faqs: FAQItem[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

// ── DS-specific JSON-LD (DST-170) ─────────────────────────────────

export interface DSJsonLdInput {
  id: string;
  name: string;
  description: string;
  category: string;
  /** Optional slug override; defaults to `id`. */
  slug?: string;
}

/**
 * LearningResource schema for a data-structure page.
 * Ready for /ds/[slug] routes when DST-169 lands.
 */
export function generateDSJsonLd(ds: DSJsonLdInput): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: `${ds.name} Data Structure`,
    description: ds.description,
    url: `${SITE_URL}/ds/${ds.slug ?? ds.id}`,
    educationalLevel: "Intermediate",
    teaches: `${ds.name} data structure`,
    learningResourceType: "interactive visualization",
    timeRequired: "PT15M",
    inLanguage: "en",
    isAccessibleForFree: true,
    keywords: `${ds.name}, ${ds.category}, data structure, computer science`,
    provider: {
      "@type": "Organization",
      name: SITE_NAME,
      sameAs: SITE_URL,
    },
  };
}

/**
 * Organization schema — establishes Architex brand identity for Google.
 */
export function generateOrganizationJsonLd(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description:
      "Interactive engineering laboratory for system design, algorithms, and technical interview preparation.",
    sameAs: [SITE_URL],
  };
}
