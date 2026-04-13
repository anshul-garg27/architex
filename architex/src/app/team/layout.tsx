import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team - Architex",
  description: "Manage your team, roles, and collaborative workspaces.",
  openGraph: {
    title: "Team - Architex",
    description: "Manage your team, roles, and collaborative workspaces.",
  },
};

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return children;
}
