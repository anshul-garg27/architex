import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - Architex",
  description: "Track your learning progress, daily challenges, and module exploration.",
  openGraph: {
    title: "Dashboard - Architex",
    description: "Track your learning progress, daily challenges, and module exploration.",
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
