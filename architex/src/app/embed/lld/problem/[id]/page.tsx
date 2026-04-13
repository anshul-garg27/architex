// ---------------------------------------------------------------------------
// Embed: LLD Problem UML Canvas (LLD-141)
// ---------------------------------------------------------------------------
// Renders the starter UML class diagram for an LLD interview problem.
// ---------------------------------------------------------------------------

import { notFound } from "next/navigation";
import {
  LLD_PROBLEMS,
  getProblemById,
} from "@/lib/lld";
import { EmbedUMLCanvas } from "../../_components/EmbedUMLCanvas";

// ---------------------------------------------------------------------------
// Static generation for all LLD problems
// ---------------------------------------------------------------------------
export function generateStaticParams() {
  return LLD_PROBLEMS.map((p) => ({ id: p.id }));
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
type Props = { params: Promise<{ id: string }> };

export default async function EmbedProblemPage({ params }: Props) {
  const { id } = await params;
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
