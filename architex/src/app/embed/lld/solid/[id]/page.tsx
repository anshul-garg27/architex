// ---------------------------------------------------------------------------
// Embed: SOLID Principle UML Canvas (LLD-141)
// ---------------------------------------------------------------------------

import { notFound } from "next/navigation";
import { getSEOContent, getSEOContentBySlug } from "@/lib/seo/content-from-db";
import { SOLID_DEMOS, getSOLIDDemoById } from "@/lib/lld";
import { EmbedUMLCanvas } from "../../_components/EmbedUMLCanvas";

export async function generateStaticParams() {
  const dbItems = await getSEOContent("lld", "solid-demo");
  if (dbItems.length > 0) return dbItems.map((d) => ({ id: d.slug }));
  return SOLID_DEMOS.map((d) => ({ id: d.id }));
}

export const revalidate = 86400;

type Props = { params: Promise<{ id: string }> };

export default async function EmbedSOLIDPage({ params }: Props) {
  const { id } = await params;

  const dbItem = await getSEOContentBySlug("lld", "solid-demo", id);
  if (dbItem) {
    const content = dbItem.content as Record<string, unknown>;
    return (
      <EmbedUMLCanvas
        title={`${content.principle ?? ""} — ${dbItem.name}`}
        category={(content.principle as string) ?? "SOLID"}
        classes={(content.afterClasses as any[]) ?? []}
        relationships={(content.afterRelationships as any[]) ?? []}
        linkHref={`/?lld=solid:${id}`}
      />
    );
  }

  const demo = getSOLIDDemoById(id);
  if (!demo) notFound();

  return (
    <EmbedUMLCanvas
      title={`${demo.principle} — ${demo.name}`}
      category={demo.principle}
      classes={demo.afterClasses}
      relationships={demo.afterRelationships}
      linkHref={`/?lld=solid:${demo.id}`}
    />
  );
}
