/**
 * Real-World Scale Numbers & AWS Cost Estimates (2025 Edition)
 *
 * Use these for back-of-the-envelope calculations in system design
 * interviews and capacity planning exercises.
 *
 * Scale numbers sourced from company engineering blogs, SEC filings,
 * and public post-mortems (rounded for easy mental math).
 *
 * Cost estimates are approximate AWS on-demand prices (US regions)
 * as of early 2025 — use for relative comparisons, not invoicing.
 */

// ---------------------------------------------------------------------------
// Real-world scale numbers
// ---------------------------------------------------------------------------

export const REAL_WORLD = {
  // ---- Social & Messaging ----

  /** Twitter/X: tweets created per day */
  TWITTER_TWEETS_PER_DAY: 500_000_000,

  /** Twitter/X: timeline reads per day (~200B fan-out reads) */
  TWITTER_TIMELINE_READS_PER_DAY: 200_000_000_000,

  /** Twitter/X: monthly active users */
  TWITTER_MAU: 550_000_000,

  /** WhatsApp: messages delivered per day */
  WHATSAPP_MSGS_PER_DAY: 100_000_000_000,

  /** WhatsApp: peak concurrent connections */
  WHATSAPP_PEAK_CONNECTIONS: 2_000_000_000,

  /** Instagram: photos uploaded per day */
  INSTAGRAM_PHOTOS_PER_DAY: 100_000_000,

  /** Instagram: stories viewed per day */
  INSTAGRAM_STORIES_PER_DAY: 500_000_000,

  /** Facebook: daily active users */
  FACEBOOK_DAU: 2_000_000_000,

  /** Discord: messages sent per day */
  DISCORD_MSGS_PER_DAY: 4_000_000_000,

  /** Slack: messages sent per day (paid workspaces) */
  SLACK_MSGS_PER_DAY: 1_500_000_000,

  // ---- Search & Web ----

  /** Google: search queries per day */
  GOOGLE_SEARCHES_PER_DAY: 8_500_000_000,

  /** Google: searches per second (peak) */
  GOOGLE_PEAK_QPS: 100_000,

  // ---- Streaming & Media ----

  /** Netflix: peak concurrent streams globally */
  NETFLIX_CONCURRENT_STREAMS: 15_000_000,

  /** Netflix: total subscribers */
  NETFLIX_SUBSCRIBERS: 280_000_000,

  /** Netflix: Gbps served at peak */
  NETFLIX_PEAK_GBPS: 400_000,

  /** YouTube: hours of video uploaded per minute */
  YOUTUBE_HOURS_UPLOADED_PER_MIN: 500,

  /** YouTube: daily video views */
  YOUTUBE_VIEWS_PER_DAY: 5_000_000_000,

  /** Spotify: daily active users */
  SPOTIFY_DAU: 200_000_000,

  /** Spotify: total songs in catalog */
  SPOTIFY_CATALOG_SIZE: 100_000_000,

  // ---- Ride-sharing & Logistics ----

  /** Uber: trips completed per day globally */
  UBER_TRIPS_PER_DAY: 25_000_000,

  /** Uber: active drivers at any moment (peak) */
  UBER_PEAK_ACTIVE_DRIVERS: 5_000_000,

  /** Uber: location updates ingested per second */
  UBER_LOCATION_UPDATES_PER_SEC: 1_000_000,

  // ---- E-commerce ----

  /** Amazon: orders per day */
  AMAZON_ORDERS_PER_DAY: 60_000_000,

  /** Amazon Prime Day: peak orders per second */
  AMAZON_PRIME_DAY_PEAK_OPS: 100_000,

  // ---- Infrastructure ----

  /** Cloudflare: HTTP requests handled per second */
  CLOUDFLARE_RPS: 57_000_000,

  /** Let's Encrypt: certificates issued per day */
  LETSENCRYPT_CERTS_PER_DAY: 3_000_000,

  // ---- Useful size constants for estimation ----

  /** Average tweet size in bytes (280 chars UTF-8 + metadata) */
  AVG_TWEET_BYTES: 1_000,

  /** Average chat message size in bytes */
  AVG_CHAT_MSG_BYTES: 200,

  /** Average photo size in bytes (compressed JPEG, Instagram-quality) */
  AVG_PHOTO_BYTES: 2_000_000,

  /** Average 1-minute video size in bytes (720p, compressed) */
  AVG_VIDEO_1MIN_BYTES: 50_000_000,

  /** Average web page size in bytes (HTML + assets) */
  AVG_WEB_PAGE_BYTES: 2_500_000,

  /** Average user profile record size in bytes (JSON) */
  AVG_USER_PROFILE_BYTES: 5_000,
} as const;

/** Union of all real-world metric keys */
export type RealWorldKey = keyof typeof REAL_WORLD;

// ---------------------------------------------------------------------------
// AWS cost estimates (monthly, on-demand, US regions, 2025 approx.)
// ---------------------------------------------------------------------------

export const COST_ESTIMATES = {
  // ---- Compute ----

  /** EC2 t3.medium (2 vCPU, 4 GB) per month */
  EC2_T3_MEDIUM_MONTHLY: 30,

  /** EC2 c7g.xlarge (4 vCPU, 8 GB Graviton3) per month */
  EC2_C7G_XLARGE_MONTHLY: 95,

  /** EC2 r7g.2xlarge (8 vCPU, 64 GB) per month */
  EC2_R7G_2XLARGE_MONTHLY: 290,

  /** Lambda per 1M invocations (128 MB, 200ms avg) */
  LAMBDA_PER_1M_INVOCATIONS: 3.5,

  /** Fargate per vCPU-hour */
  FARGATE_VCPU_HOUR: 0.04,

  /** Fargate per GB-hour (memory) */
  FARGATE_GB_HOUR: 0.004,

  // ---- Databases ----

  /** RDS PostgreSQL db.r6g.large (2 vCPU, 16 GB) per month */
  RDS_POSTGRES_R6G_LARGE_MONTHLY: 200,

  /** RDS Multi-AZ surcharge multiplier */
  RDS_MULTI_AZ_MULTIPLIER: 2,

  /** DynamoDB per 1M read request units (on-demand) */
  DYNAMODB_PER_1M_RRU: 0.25,

  /** DynamoDB per 1M write request units (on-demand) */
  DYNAMODB_PER_1M_WRU: 1.25,

  /** ElastiCache Redis r7g.large (2 vCPU, 13 GB) per month */
  ELASTICACHE_REDIS_R7G_LARGE_MONTHLY: 175,

  // ---- Storage ----

  /** S3 Standard per GB per month */
  S3_STANDARD_PER_GB_MONTH: 0.023,

  /** S3 GET per 1K requests */
  S3_GET_PER_1K: 0.0004,

  /** S3 PUT per 1K requests */
  S3_PUT_PER_1K: 0.005,

  /** S3 Glacier Instant Retrieval per GB per month */
  S3_GLACIER_INSTANT_PER_GB_MONTH: 0.004,

  /** EBS gp3 per GB per month */
  EBS_GP3_PER_GB_MONTH: 0.08,

  // ---- Networking ----

  /** Data transfer OUT to internet per GB (first 10 TB) */
  DATA_TRANSFER_OUT_PER_GB: 0.09,

  /** Data transfer between AZs per GB */
  DATA_TRANSFER_CROSS_AZ_PER_GB: 0.01,

  /** Data transfer between regions per GB */
  DATA_TRANSFER_CROSS_REGION_PER_GB: 0.02,

  /** CloudFront per 10K HTTPS requests (US/EU) */
  CLOUDFRONT_PER_10K_REQUESTS: 0.01,

  /** CloudFront per GB data transfer (US/EU, first 10 TB) */
  CLOUDFRONT_PER_GB: 0.085,

  /** NAT Gateway per GB processed */
  NAT_GATEWAY_PER_GB: 0.045,

  /** NAT Gateway hourly charge */
  NAT_GATEWAY_PER_HOUR: 0.045,

  // ---- Messaging & Streaming ----

  /** MSK (Kafka) per broker-hour (kafka.m5.large) */
  MSK_BROKER_HOUR: 0.21,

  /** SQS per 1M requests (standard) */
  SQS_PER_1M_REQUESTS: 0.40,

  /** SNS per 1M publish requests */
  SNS_PER_1M_PUBLISHES: 0.50,

  // ---- Search & Analytics ----

  /** OpenSearch (Elasticsearch) m6g.large per hour */
  OPENSEARCH_M6G_LARGE_HOUR: 0.135,

  // ---- Load Balancing ----

  /** ALB per hour */
  ALB_PER_HOUR: 0.0225,

  /** ALB per LCU-hour (load balancer capacity unit) */
  ALB_PER_LCU_HOUR: 0.008,
} as const;

/** Union of all cost keys */
export type CostKey = keyof typeof COST_ESTIMATES;

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

/**
 * Format a large number with SI suffixes for readability.
 *
 * @example
 *   formatScale(8_500_000_000) // "8.5B"
 *   formatScale(500_000_000)   // "500M"
 *   formatScale(25_000_000)    // "25M"
 */
export function formatScale(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000_000) {
    return `${+(n / 1_000_000_000_000).toPrecision(3)}T`;
  }
  if (abs >= 1_000_000_000) {
    return `${+(n / 1_000_000_000).toPrecision(3)}B`;
  }
  if (abs >= 1_000_000) {
    return `${+(n / 1_000_000).toPrecision(3)}M`;
  }
  if (abs >= 1_000) {
    return `${+(n / 1_000).toPrecision(3)}K`;
  }
  return `${n}`;
}

/**
 * Format a dollar amount for display.
 *
 * @example
 *   formatCost(0.023)  // "$0.023"
 *   formatCost(200)    // "$200"
 *   formatCost(1500)   // "$1,500"
 */
export function formatCost(dollars: number): string {
  if (dollars < 1) {
    return `$${dollars}`;
  }
  return `$${dollars.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

/**
 * Format bytes into a human-readable string.
 *
 * @example
 *   formatBytes(2_000_000) // "1.91 MB"
 *   formatBytes(5_000)     // "4.88 KB"
 */
export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let i = 0;
  let value = Math.abs(bytes);
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${+value.toPrecision(3)} ${units[i]}`;
}

/**
 * Convert a "per day" metric to per-second for QPS estimation.
 *
 * @example
 *   perSecond(REAL_WORLD.TWITTER_TWEETS_PER_DAY)
 *   // ~5787 tweets/sec
 */
export function perSecond(perDay: number): number {
  return Math.round(perDay / 86_400);
}

/**
 * Estimate daily storage growth for a service.
 *
 * @param itemsPerDay    - Number of items created per day
 * @param avgItemBytes   - Average item size in bytes
 * @param replication    - Replication factor (default 3)
 * @returns Object with daily/monthly/yearly growth in bytes
 *
 * @example
 *   estimateStorage(
 *     REAL_WORLD.TWITTER_TWEETS_PER_DAY,
 *     REAL_WORLD.AVG_TWEET_BYTES,
 *   )
 *   // { dailyBytes: 1_500_000_000_000, monthlyTB: ~43.7, yearlyTB: ~521 }
 */
export function estimateStorage(
  itemsPerDay: number,
  avgItemBytes: number,
  replication = 3,
): {
  dailyBytes: number;
  monthlyTB: number;
  yearlyTB: number;
  display: string;
} {
  const dailyBytes = itemsPerDay * avgItemBytes * replication;
  const monthlyTB = (dailyBytes * 30) / 1e12;
  const yearlyTB = (dailyBytes * 365) / 1e12;
  return {
    dailyBytes,
    monthlyTB: +monthlyTB.toPrecision(3),
    yearlyTB: +yearlyTB.toPrecision(3),
    display: `${formatBytes(dailyBytes)}/day | ${+monthlyTB.toPrecision(3)} TB/mo | ${+yearlyTB.toPrecision(3)} TB/yr`,
  };
}

/**
 * Estimate monthly S3 storage cost for a given data volume.
 *
 * @param totalGB - Total gigabytes stored
 * @param tier    - 'standard' or 'glacier'
 *
 * @example
 *   estimateS3Cost(50_000) // "$1,150/mo"
 */
export function estimateS3Cost(
  totalGB: number,
  tier: 'standard' | 'glacier' = 'standard',
): { monthlyCost: number; display: string } {
  const rate =
    tier === 'glacier'
      ? COST_ESTIMATES.S3_GLACIER_INSTANT_PER_GB_MONTH
      : COST_ESTIMATES.S3_STANDARD_PER_GB_MONTH;
  const monthlyCost = +(totalGB * rate).toFixed(2);
  return {
    monthlyCost,
    display: `${formatCost(monthlyCost)}/mo for ${formatScale(totalGB)} GB (${tier})`,
  };
}

/**
 * Quick capacity estimate: given a per-day number, return peak QPS
 * assuming a 3x peak-to-average ratio.
 *
 * @example
 *   peakQPS(REAL_WORLD.UBER_TRIPS_PER_DAY) // ~868
 */
export function peakQPS(perDay: number, peakMultiplier = 3): number {
  return Math.round((perDay / 86_400) * peakMultiplier);
}
