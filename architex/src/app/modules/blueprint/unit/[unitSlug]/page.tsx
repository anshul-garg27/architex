import { BlueprintComingSoon } from "@/components/modules/blueprint/BlueprintComingSoon";

export default async function BlueprintUnitPage({
  params,
}: {
  params: Promise<{ unitSlug: string }>;
}) {
  const { unitSlug } = await params;
  return (
    <BlueprintComingSoon
      subprojectId="SP3"
      hint={`Unit renderer for "${unitSlug}" ships in sub-project 3.`}
    />
  );
}
