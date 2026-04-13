// ---------------------------------------------------------------------------
// Embed: SOLID Principle UML Canvas (LLD-141)
// ---------------------------------------------------------------------------
// Renders the "after" (refactored) UML for a SOLID principle demo.
// ---------------------------------------------------------------------------

import { notFound } from "next/navigation";
import {
  SOLID_DEMOS,
  getSOLIDDemoById,
} from "@/lib/lld";
import { EmbedUMLCanvas } from "../../_components/EmbedUMLCanvas";

// ---------------------------------------------------------------------------
// Static generation for all SOLID demos
// ---------------------------------------------------------------------------
export function generateStaticParams() {
  return SOLID_DEMOS.map((d) => ({ id: d.id }));
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
type Props = { params: Promise<{ id: string }> };

export default async function EmbedSOLIDPage({ params }: Props) {
  const { id } = await params;
  const demo = getSOLIDDemoById(id);
  if (!demo) notFound();

  return (
    <EmbedUMLCanvas
      title={`${demo.principle} — ${demo.name}`}
      category={demo.principle}
      classes={demo.afterClasses}
      relationships={demo.afterRelationships}
      linkHref={`/?solid=${demo.id}`}
    />
  );
}
