import { UnitPage } from "@/components/modules/blueprint/unit/UnitPage";

export default async function BlueprintUnitPage({
  params,
}: {
  params: Promise<{ unitSlug: string }>;
}) {
  const { unitSlug } = await params;
  return <UnitPage unitSlug={unitSlug} />;
}
