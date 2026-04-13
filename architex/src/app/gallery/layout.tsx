import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Gallery - Architex",
  description: "Explore and fork system designs shared by the community.",
  openGraph: {
    title: "Community Gallery - Architex",
    description: "Explore and fork system designs shared by the community.",
  },
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
