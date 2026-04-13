import type { Metadata } from "next";
import { PricingContent } from "./PricingContent";

// ---------------------------------------------------------------------------
// SEO metadata
// ---------------------------------------------------------------------------
export const metadata: Metadata = {
  title: "Pricing — Plans for Every Engineer | Architex",
  description:
    "Choose the Architex plan that fits your learning journey. Free, Student, Pro, and Team tiers with interactive system design simulations, AI hints, and collaboration tools.",
  openGraph: {
    title: "Pricing — Plans for Every Engineer | Architex",
    description:
      "Free, Student, Pro, and Team plans for interactive system design learning.",
    url: "https://architex.dev/pricing",
    siteName: "Architex",
    type: "website",
    images: [
      {
        url: "https://architex.dev/api/og?title=Pricing&type=pricing",
        width: 1200,
        height: 630,
        alt: "Architex Pricing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing | Architex",
    description:
      "Choose the plan that fits your system design learning journey.",
    images: ["https://architex.dev/api/og?title=Pricing&type=pricing"],
  },
};

export default function PricingPage() {
  return <PricingContent />;
}
