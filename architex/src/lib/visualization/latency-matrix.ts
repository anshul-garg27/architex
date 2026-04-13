// -----------------------------------------------------------------
// Architex -- Inter-Region Latency Matrix
// -----------------------------------------------------------------
//
// Realistic round-trip latency data (milliseconds) between major
// cloud regions. Values are based on published cloud provider
// inter-region latency benchmarks.
//
// Latency tiers:
//   <30ms   -- same region / same metro area
//   30-80ms -- same continent
//   80-200ms -- cross-continent (nearby)
//   200-350ms -- global (opposite sides)
// -----------------------------------------------------------------

import type { DataCenterLocation } from './world-map-data';
import { DATA_CENTERS } from './world-map-data';

// -- Latency Tier Classification ------------------------------------

export type LatencyTier = 'local' | 'regional' | 'cross-continent' | 'global';

export interface LatencyTierInfo {
  tier: LatencyTier;
  label: string;
  color: string;
  maxMs: number;
}

export const LATENCY_TIERS: LatencyTierInfo[] = [
  { tier: 'local', label: 'Same Region', color: '#22C55E', maxMs: 30 },
  { tier: 'regional', label: 'Same Continent', color: '#EAB308', maxMs: 80 },
  { tier: 'cross-continent', label: 'Cross-Continent', color: '#F97316', maxMs: 200 },
  { tier: 'global', label: 'Global', color: '#EF4444', maxMs: 350 },
];

export function getLatencyTier(ms: number): LatencyTierInfo {
  for (const tier of LATENCY_TIERS) {
    if (ms <= tier.maxMs) return tier;
  }
  return LATENCY_TIERS[LATENCY_TIERS.length - 1];
}

/** Get the color for a latency value. */
export function getLatencyColor(ms: number): string {
  if (ms < 50) return '#22C55E';   // green
  if (ms < 150) return '#EAB308';  // yellow
  return '#EF4444';                 // red
}

// -- Geographic Regions for Matrix Grouping -------------------------

type GeoRegion =
  | 'us-east'
  | 'us-west'
  | 'us-central'
  | 'eu-west'
  | 'eu-central'
  | 'ap-southeast'
  | 'ap-northeast'
  | 'ap-east'
  | 'sa-east';

/** Map each data center to a geographic region for matrix lookup. */
const DC_GEO_MAP: Record<string, GeoRegion> = {
  // AWS
  'aws-use1': 'us-east',
  'aws-use2': 'us-east',
  'aws-usw1': 'us-west',
  'aws-usw2': 'us-west',
  'aws-euw1': 'eu-west',
  'aws-euw2': 'eu-west',
  'aws-euc1': 'eu-central',
  'aws-apse1': 'ap-southeast',
  'aws-apne1': 'ap-northeast',
  'aws-sae1': 'sa-east',
  // GCP
  'gcp-usc1': 'us-central',
  'gcp-use1': 'us-east',
  'gcp-usw1': 'us-west',
  'gcp-euw1': 'eu-central',
  'gcp-euw3': 'eu-central',
  'gcp-ase1': 'ap-east',
  'gcp-asne1': 'ap-northeast',
  'gcp-asse1': 'ap-southeast',
  // Azure
  'az-eastus': 'us-east',
  'az-westus': 'us-west',
  'az-westeu': 'eu-west',
  'az-seasia': 'ap-southeast',
  'az-japan': 'ap-northeast',
  'az-brazil': 'sa-east',
};

// -- Latency Matrix (symmetric, milliseconds RTT) ------------------
// Indexed by GeoRegion pairs. Values represent typical RTT.

const GEO_REGIONS: GeoRegion[] = [
  'us-east',
  'us-west',
  'us-central',
  'eu-west',
  'eu-central',
  'ap-southeast',
  'ap-northeast',
  'ap-east',
  'sa-east',
];

// Upper triangle matrix (row index < col index).
// Order matches GEO_REGIONS above.
// Self = 2ms (same-region), same-provider cross-AZ = ~2ms.
const MATRIX: number[][] = [
  //       e-us  w-us  c-us  e-eu  c-eu  se-ap ne-ap e-ap  e-sa
  /* e-us */ [2,   62,   32,   85,   92,   230,  170,  200,  120],
  /* w-us */ [62,   2,   42,  145,  152,   175,  110,  140,  175],
  /* c-us */ [32,  42,    2,  105,  112,   210,  155,  180,  140],
  /* e-eu */ [85, 145,  105,    2,   10,   175,  245,  215,  195],
  /* c-eu */ [92, 152,  112,   10,    2,   165,  240,  210,  205],
  /* se-ap*/ [230,175,  210,  175,  165,     2,   70,   35,  325],
  /* ne-ap*/ [170,110,  155,  245,  240,    70,    2,   45,  280],
  /* e-ap */ [200,140,  180,  215,  210,    35,   45,    2,  310],
  /* e-sa */ [120,175,  140,  195,  205,   325,  280,  310,    2],
];

// Build a fast lookup map
const regionIndexMap = new Map<GeoRegion, number>();
GEO_REGIONS.forEach((r, i) => regionIndexMap.set(r, i));

function lookupGeoLatency(a: GeoRegion, b: GeoRegion): number {
  const ai = regionIndexMap.get(a);
  const bi = regionIndexMap.get(b);
  if (ai === undefined || bi === undefined) return 300; // unknown
  return MATRIX[ai][bi];
}

// -- Cross-Provider Penalty -----------------------------------------
// Different providers in the same region add ~3-8ms for peering.

const CROSS_PROVIDER_PENALTY = 5;

// -- Public API -----------------------------------------------------

/**
 * Get the estimated round-trip latency (ms) between two data centers.
 *
 * @param fromId - Source data center ID (e.g. 'aws-use1')
 * @param toId   - Destination data center ID (e.g. 'gcp-euw1')
 * @returns Estimated RTT in milliseconds
 */
export function getLatency(fromId: string, toId: string): number {
  if (fromId === toId) return 0;

  const fromGeo = DC_GEO_MAP[fromId];
  const toGeo = DC_GEO_MAP[toId];

  if (!fromGeo || !toGeo) return -1; // unknown data center

  let latency = lookupGeoLatency(fromGeo, toGeo);

  // Add cross-provider penalty
  const fromDc = DATA_CENTERS.find((dc) => dc.id === fromId);
  const toDc = DATA_CENTERS.find((dc) => dc.id === toId);
  if (fromDc && toDc && fromDc.provider !== toDc.provider) {
    latency += CROSS_PROVIDER_PENALTY;
  }

  return latency;
}

/**
 * Get all latencies from a source region to every other data center.
 * Returns sorted by latency (ascending).
 */
export function getAllLatencies(
  fromId: string,
): Array<{ dc: DataCenterLocation; latencyMs: number; tier: LatencyTierInfo }> {
  return DATA_CENTERS
    .filter((dc) => dc.id !== fromId)
    .map((dc) => {
      const latencyMs = getLatency(fromId, dc.id);
      return { dc, latencyMs, tier: getLatencyTier(latencyMs) };
    })
    .sort((a, b) => a.latencyMs - b.latencyMs);
}

/**
 * Get the recommended failover region for a data center.
 * Picks the lowest-latency region from the same provider,
 * or any provider if no same-provider option is available.
 */
export function getRecommendedFailover(
  dcId: string,
): DataCenterLocation | null {
  const source = DATA_CENTERS.find((dc) => dc.id === dcId);
  if (!source) return null;

  const allLatencies = getAllLatencies(dcId);

  // Prefer same-provider failover
  const sameProvider = allLatencies.find(
    (entry) => entry.dc.provider === source.provider,
  );
  if (sameProvider) return sameProvider.dc;

  // Fallback to any provider
  return allLatencies[0]?.dc ?? null;
}

/**
 * Compute the Haversine distance between two data centers (km).
 * Useful for rendering proportional latency lines.
 */
export function haversineDistance(
  from: DataCenterLocation,
  to: DataCenterLocation,
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
