import { UnitCompletion } from "@/components/modules/blueprint/unit/UnitCompletion";

export default async function BlueprintUnitCompletePage({
  params,
}: {
  params: Promise<{ unitSlug: string }>;
}) {
  const { unitSlug } = await params;
  return <UnitCompletion unitSlug={unitSlug} />;
}
