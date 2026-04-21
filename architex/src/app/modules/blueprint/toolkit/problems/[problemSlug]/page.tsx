import { BlueprintComingSoon } from "@/components/modules/blueprint/BlueprintComingSoon";

export default async function ProblemDetailPage({
  params,
}: {
  params: Promise<{ problemSlug: string }>;
}) {
  const { problemSlug } = await params;
  return (
    <BlueprintComingSoon
      subprojectId="SP5"
      hint={`Problem detail for "${problemSlug}" ships in sub-project 5.`}
    />
  );
}
