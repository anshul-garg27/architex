import { DS_CATALOG } from "@/lib/data-structures/catalog";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

// ---------------------------------------------------------------------------
// Static generation for all DS slugs  (DST-169)
// ---------------------------------------------------------------------------
export function generateStaticParams() {
  return DS_CATALOG.map((ds) => ({ slug: ds.id }));
}

// ---------------------------------------------------------------------------
// Dynamic metadata (title, description, OG)
// ---------------------------------------------------------------------------
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const ds = DS_CATALOG.find((d) => d.id === slug);
  if (!ds) return { title: "Data Structure Not Found" };

  const title = `${ds.name} — Interactive Visualization | Architex`;
  const description = ds.description.slice(0, 160);

  return {
    title,
    description,
    openGraph: {
      title: `${ds.name} — Architex`,
      description,
    },
  };
}

// ---------------------------------------------------------------------------
// Page — redirect to SPA with hash so the DS module picks it up (DST-066)
// ---------------------------------------------------------------------------
export default async function DSPage({ params }: Props) {
  const { slug } = await params;
  const ds = DS_CATALOG.find((d) => d.id === slug);
  if (!ds) redirect("/");

  // Redirect to main app with hash — the DS module reads the hash
  redirect(`/#${slug}`);
}
