import { BlueprintComingSoon } from "@/components/modules/blueprint/BlueprintComingSoon";

export default async function PatternDetailPage({
  params,
}: {
  params: Promise<{ patternSlug: string }>;
}) {
  const { patternSlug } = await params;
  return (
    <BlueprintComingSoon
      subprojectId="SP4"
      hint={`Pattern detail for "${patternSlug}" ships in sub-project 4.`}
    />
  );
}
