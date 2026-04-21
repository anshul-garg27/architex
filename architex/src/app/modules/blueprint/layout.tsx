import type { Metadata } from "next";
import { BlueprintShell } from "@/components/modules/blueprint/BlueprintShell";

export const metadata: Metadata = {
  title: "Blueprint · Architex",
  description: "Design patterns, one unit at a time.",
  openGraph: {
    title: "Blueprint · Architex",
    description: "Design patterns, one unit at a time.",
  },
};

export default function BlueprintRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BlueprintShell>{children}</BlueprintShell>;
}
