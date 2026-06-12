// ---------------------------------------------------------------------------
// Facebook · October 4, 2021 — the BGP withdrawal.
//
// Source narrative: Meta's published postmortem
// (engineering.fb.com/2021/10/05/networking-traffic/outage-details/).
// A routine backbone-capacity audit command disconnected every data center;
// Facebook's authoritative DNS servers — by design — withdrew their BGP
// route advertisements when they lost sight of the data centers, erasing
// facebook.com from the internet. Internal tools and badge systems rode the
// same network, so recovery required humans physically inside data centers.
// Total outage: roughly 6 hours 5 minutes. No data lost.
//
// Chaos-engine vocabulary: this is `bgp-leak` (BGP route withdrawal) followed
// by `dns-failure` (authoritative DNS unreachable), compounded by a circular
// auth dependency.
// ---------------------------------------------------------------------------

import type {
  IncidentEdge,
  IncidentKeyframe,
  IncidentNode,
  IncidentReplay,
  NodeHealth,
} from "./index";

// ── Architecture snapshot (simplified, faithful) ─────────────

const NODES: IncidentNode[] = [
  { id: "users", label: "3.5B users", kind: "client", position: { x: 0, y: 240 } },
  { id: "resolvers", label: "Recursive resolvers", kind: "resolver", position: { x: 230, y: 100 } },
  { id: "dns", label: "Authoritative DNS", kind: "dns", position: { x: 460, y: 100 } },
  { id: "bgp", label: "BGP edge routers", kind: "router", position: { x: 690, y: 100 } },
  { id: "edge", label: "Edge POPs", kind: "edge", position: { x: 260, y: 330 } },
  { id: "backbone", label: "Backbone network", kind: "backbone", position: { x: 640, y: 300 } },
  { id: "dc", label: "Data centers", kind: "datacenter", position: { x: 900, y: 300 } },
  { id: "frontend", label: "Frontend tier", kind: "frontend", position: { x: 1150, y: 210 } },
  { id: "app", label: "App services", kind: "service", position: { x: 1150, y: 390 } },
  { id: "tools", label: "Internal tools", kind: "tooling", position: { x: 640, y: 530 } },
  { id: "internal-auth", label: "Internal auth", kind: "auth", position: { x: 900, y: 530 } },
  { id: "badge", label: "Badge systems", kind: "physical", position: { x: 1150, y: 550 } },
];

const EDGES: IncidentEdge[] = [
  { id: "e-users-resolvers", source: "users", target: "resolvers", label: "resolve facebook.com" },
  { id: "e-resolvers-dns", source: "resolvers", target: "dns" },
  { id: "e-dns-bgp", source: "dns", target: "bgp", label: "advertises routes" },
  { id: "e-bgp-backbone", source: "bgp", target: "backbone", sourceHandle: "b", targetHandle: "t" },
  { id: "e-users-edge", source: "users", target: "edge", label: "HTTPS" },
  { id: "e-edge-backbone", source: "edge", target: "backbone" },
  { id: "e-backbone-dc", source: "backbone", target: "dc" },
  { id: "e-dc-frontend", source: "dc", target: "frontend" },
  { id: "e-dc-app", source: "dc", target: "app" },
  { id: "e-dc-auth", source: "dc", target: "internal-auth", label: "hosts", sourceHandle: "b", targetHandle: "t" },
  { id: "e-tools-auth", source: "tools", target: "internal-auth" },
  { id: "e-auth-badge", source: "internal-auth", target: "badge", label: "backs door access" },
];

// ── Keyframe helper: complete snapshot, omitted ids = healthy ─

const NODE_IDS = NODES.map((n) => n.id);

function snapshot(overrides: Record<string, NodeHealth>): Record<string, NodeHealth> {
  const states: Record<string, NodeHealth> = {};
  for (const id of NODE_IDS) {
    states[id] = overrides[id] ?? "healthy";
  }
  return states;
}

// ── Timeline — 10 beats, T+0 → T+6:05:00 ─────────────────────

const TIMELINE: IncidentKeyframe[] = [
  {
    atSeconds: 0,
    headline: "15:39 UTC. A routine maintenance command.",
    narrative:
      "An engineer runs a command to audit spare capacity on Facebook's global backbone — the private network stitching its data centers together. The command was never meant to run against production routers. The audit tool has a bug, and the safeguard that should have blocked it doesn't fire.",
    nodeStates: snapshot({}),
    metrics: { globalErrorRate: 0, affectedUsers: 0 },
  },
  {
    atSeconds: 60,
    headline: "The backbone goes dark.",
    narrative:
      "The command severs every data center from the backbone at once. Facebook's data centers can no longer talk to each other — or to the internet. Edge POPs still hold warm caches, but every request that needs an origin starts to fail.",
    nodeStates: snapshot({
      backbone: "down",
      dc: "degraded",
      frontend: "degraded",
      app: "degraded",
    }),
    metrics: { globalErrorRate: 38, affectedUsers: 800_000_000 },
  },
  {
    atSeconds: 300,
    headline: "The DNS servers withdraw themselves.",
    narrative:
      "Facebook's authoritative DNS servers run a health check: if they can't reach the data centers, they assume *they* are the broken ones and withdraw their BGP route advertisements. Sensible for one bad site — catastrophic when the whole backbone is gone. Every DNS server pulls itself off the internet simultaneously.",
    nodeStates: snapshot({
      backbone: "down",
      dc: "degraded",
      frontend: "down",
      app: "down",
      dns: "down",
      bgp: "down",
      resolvers: "degraded",
    }),
    metrics: { globalErrorRate: 91, affectedUsers: 2_400_000_000 },
  },
  {
    atSeconds: 600,
    headline: "facebook.com no longer exists.",
    narrative:
      "With the BGP routes withdrawn, recursive resolvers worldwide can't find Facebook's name servers. facebook.com, instagram.com, and whatsapp.net stop resolving — to the internet, the company has vanished. Billions of apps retry aggressively, hammering public resolvers with a global storm of failed lookups.",
    nodeStates: snapshot({
      backbone: "down",
      dc: "degraded",
      frontend: "down",
      app: "down",
      dns: "down",
      bgp: "down",
      edge: "down",
      resolvers: "degraded",
      users: "degraded",
    }),
    metrics: { globalErrorRate: 100, affectedUsers: 3_500_000_000 },
  },
  {
    atSeconds: 1800,
    headline: "The tools to fix it are behind the outage.",
    narrative:
      "Engineers reach for dashboards, internal tools, remote router access — all of it resolves through the same DNS and rides the same backbone that just disappeared. Even paging and incident tooling degrade. The people who know how to fix the network can't see it, and can't reach it.",
    nodeStates: snapshot({
      backbone: "down",
      dc: "degraded",
      frontend: "down",
      app: "down",
      dns: "down",
      bgp: "down",
      edge: "down",
      resolvers: "degraded",
      users: "degraded",
      tools: "down",
      "internal-auth": "down",
    }),
    metrics: { globalErrorRate: 100, affectedUsers: 3_500_000_000 },
  },
  {
    atSeconds: 3600,
    headline: "Badges stop opening doors.",
    narrative:
      "Engineers are dispatched to the data centers — but the badge readers authenticate against internal systems that are down with everything else. The buildings are hardened against intrusion, which now means hardened against rescue. Getting through a door becomes part of the critical path.",
    nodeStates: snapshot({
      backbone: "down",
      dc: "degraded",
      frontend: "down",
      app: "down",
      dns: "down",
      bgp: "down",
      edge: "down",
      resolvers: "degraded",
      users: "degraded",
      tools: "down",
      "internal-auth": "down",
      badge: "down",
    }),
    metrics: { globalErrorRate: 100, affectedUsers: 3_500_000_000 },
  },
  {
    atSeconds: 7200,
    headline: "Recovery by screwdriver.",
    narrative:
      "On-site engineers with physical access to the routers activate secure out-of-band procedures. The routers are deliberately difficult to modify by hand — a security posture designed against attackers that now slows down the defenders. Progress is real, but it's measured in hours, not minutes.",
    nodeStates: snapshot({
      backbone: "down",
      dc: "degraded",
      frontend: "down",
      app: "down",
      dns: "down",
      bgp: "down",
      edge: "down",
      resolvers: "degraded",
      users: "degraded",
      tools: "down",
      "internal-auth": "down",
      badge: "degraded",
    }),
    metrics: { globalErrorRate: 100, affectedUsers: 3_500_000_000 },
  },
  {
    atSeconds: 19200,
    headline: "The backbone breathes again.",
    narrative:
      "Backbone connectivity is restored. The DNS servers see the data centers again, pass their health checks, and re-advertise their BGP prefixes. Resolver caches around the world slowly relearn that facebook.com exists. The internal tools and badge systems come back with the network they depended on.",
    nodeStates: snapshot({
      backbone: "healthy",
      dc: "healthy",
      frontend: "degraded",
      app: "degraded",
      dns: "degraded",
      bgp: "degraded",
      edge: "degraded",
      resolvers: "degraded",
      users: "degraded",
      tools: "degraded",
      "internal-auth": "degraded",
    }),
    metrics: { globalErrorRate: 55, affectedUsers: 2_000_000_000 },
  },
  {
    atSeconds: 20700,
    headline: "Don't crash on the way back up.",
    narrative:
      "Turning everything on at once could cause a second outage: caches are cold, and 3.5 billion clients are retrying in unison. Power draw alone could trip electrical systems. Facebook had rehearsed exactly this in 'storm' drills — services are brought back deliberately, region by region, shedding load as they go.",
    nodeStates: snapshot({
      frontend: "degraded",
      app: "degraded",
      edge: "degraded",
      resolvers: "healthy",
      users: "degraded",
    }),
    metrics: { globalErrorRate: 22, affectedUsers: 900_000_000 },
  },
  {
    atSeconds: 21900,
    headline: "Back online. Six hours, five minutes.",
    narrative:
      "21:44 UTC: traffic is flowing globally again. Nothing was hacked, no data was lost, and nobody was hurt — one config command, one well-intentioned health check, and two circular dependencies took the world's largest social network offline for an afternoon. Every architecture has a day like this waiting.",
    nodeStates: snapshot({}),
    metrics: { globalErrorRate: 0, affectedUsers: 0 },
  },
];

// ── Export ───────────────────────────────────────────────────

export const FACEBOOK_BGP_2021: IncidentReplay = {
  meta: {
    slug: "facebook-bgp-2021",
    title: "The Day Facebook Vanished",
    company: "Facebook (Meta)",
    date: "2021-10-04",
    durationLabel: "6h 05m",
    tagline: "Six hours. 3.5 billion users. Zero bytes of data lost.",
    summary:
      "A routine BGP configuration push removed Facebook's authoritative name servers from the global routing table. DNS failed for every Facebook property, internal tools died with the network they depended on, and recovery required engineers physically inside the data centers.",
    postmortemUrl:
      "https://engineering.fb.com/2021/10/05/networking-traffic/outage-details/",
    chaosEventIds: ["bgp-leak", "dns-failure"],
  },
  nodes: NODES,
  edges: EDGES,
  timeline: TIMELINE,
  lessons: [
    {
      title: "Never host your only DNS inside the blast radius",
      body: "Facebook's authoritative name servers lived on the network they described. When the backbone died, the names died with it. An off-network secondary DNS provider would have kept facebook.com resolving — even with every origin dark.",
    },
    {
      title: "Circular auth dependencies fail closed",
      body: "Internal tools, remote access, and badge readers all authenticated through systems hosted behind the outage. Break the loop: incident tooling and physical access need a break-glass path that works when everything else doesn't.",
    },
    {
      title: "Write the physical-access runbook before you need it",
      body: "Once remote access died, recovery time was dominated by getting humans through doors and onto consoles. Out-of-band management networks and rehearsed physical-access procedures turn hours into minutes.",
    },
    {
      title: "Health checks need a theory of total failure",
      body: "The DNS self-withdrawal was correct for one unhealthy site and catastrophic for all of them at once. Automated self-removal should carry a sanity threshold: if every health check fails simultaneously, the problem probably isn't you.",
    },
  ],
};
