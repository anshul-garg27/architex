// ---------------------------------------------------------------------------
// Embed: LLD Problem UML Canvas (LLD-141)
// ---------------------------------------------------------------------------

import { notFound } from "next/navigation";
import { getSEOContent, getSEOContentBySlug } from "@/lib/seo/content-from-db";
import { LLD_PROBLEMS, getProblemById } from "@/lib/lld";
import { EmbedUMLCanvas } from "../../_components/EmbedUMLCanvas";

export async function generateStaticParams() {
  const dbItems = await getSEOContent("lld", "problem");
  if (dbItems.length > 0) return dbItems.map((p) => ({ id: p.slug }));
  return LLD_PROBLEMS.map((p) => ({ id: p.id }));
}

export const revalidate = 86400;

type Props = { params: Promise<{ id: string }> };

export default async function EmbedProblemPage({ params }: Props) {
  const { id } = await params;

  const dbItem = await getSEOContentBySlug("lld", "problem", id);
  if (dbItem) {
    const content = dbItem.content as Record<string, unknown>;
    return (
      <EmbedUMLCanvas
        title={dbItem.name}
        category={`Difficulty ${content.difficulty ?? "?"}/5`}
        classes={(content.starterClasses as any[]) ?? []}
        relationships={(content.starterRelationships as any[]) ?? []}
        linkHref={`/?lld=problem:${id}`}
      />
    );
  }

  const problem = getProblemById(id);
  if (!problem) notFound();

  return (
    <EmbedUMLCanvas
      title={problem.name}
      category={`Difficulty ${problem.difficulty}/5`}
      classes={problem.starterClasses}
      relationships={problem.starterRelationships}
      linkHref={`/?lld=${problem.id}`}
    />
  );
}
