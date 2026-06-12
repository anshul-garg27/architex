// ---------------------------------------------------------------------------
// Incident Replay page — /incidents/[slug]
// Statically generated over the incident registry; renders the client replay.
// ---------------------------------------------------------------------------

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { INCIDENT_SLUGS, getIncidentBySlug } from "@/lib/incidents";
import { IncidentReplay } from "./IncidentReplay";

export function generateStaticParams() {
  return INCIDENT_SLUGS.map((slug) => ({ slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const incident = getIncidentBySlug(slug);
  if (!incident) return { title: "Incident Not Found — Architex" };

  const { meta } = incident;
  const title = `${meta.title} — Incident Replay | Architex`;
  const description = `${meta.tagline} Replay the ${meta.company} outage of ${meta.date}, beat by beat — then find out if your design would survive it.`;
  const ogImage = `https://architex.dev/api/og?title=${encodeURIComponent(meta.title)}&type=incident&slug=${encodeURIComponent(meta.slug)}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://architex.dev/incidents/${meta.slug}`,
      siteName: "Architex",
      type: "article",
      images: [{ url: ogImage, width: 1200, height: 630, alt: meta.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function IncidentPage({ params }: Props) {
  const { slug } = await params;
  const incident = getIncidentBySlug(slug);
  if (!incident) notFound();

  return <IncidentReplay incident={incident} />;
}
