import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Modules - Architex",
  description: "Browse all 13 interactive engineering modules with progress tracking.",
  openGraph: {
    title: "Modules - Architex",
    description: "Browse all 13 interactive engineering modules with progress tracking.",
  },
};

export default function ModulesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
