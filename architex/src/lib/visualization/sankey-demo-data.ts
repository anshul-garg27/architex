// ─────────────────────────────────────────────────────────────
// Architex — Sankey Diagram Demo Data
// ─────────────────────────────────────────────────────────────
//
// Three example topologies demonstrating common system design
// data flow patterns. Each dataset includes nodes with categories
// and links with realistic flow values.
// ─────────────────────────────────────────────────────────────

import type { SankeyInputNode, SankeyInputLink } from './sankey-types';

// ── Types ──────────────────────────────────────────────────

export interface SankeyDemoDataset {
  name: string;
  description: string;
  nodes: SankeyInputNode[];
  links: SankeyInputLink[];
}

// ── 1. Microservice Data Flow ──────────────────────────────
// Users → API Gateway → Services → Databases

export const MICROSERVICE_FLOW: SankeyDemoDataset = {
  name: 'Microservice Data Flow',
  description: 'Users → API Gateway → Services → Databases',
  nodes: [
    { id: 'web', label: 'Web Clients', category: 'client' },
    { id: 'mobile', label: 'Mobile Clients', category: 'client' },
    { id: 'api-gw', label: 'API Gateway', category: 'gateway' },
    { id: 'auth', label: 'Auth Service', category: 'service' },
    { id: 'user-svc', label: 'User Service', category: 'service' },
    { id: 'order-svc', label: 'Order Service', category: 'service' },
    { id: 'payment-svc', label: 'Payment Service', category: 'service' },
    { id: 'notify-svc', label: 'Notification Service', category: 'service' },
    { id: 'user-db', label: 'User DB', category: 'database' },
    { id: 'order-db', label: 'Order DB', category: 'database' },
    { id: 'cache', label: 'Redis Cache', category: 'cache' },
    { id: 'queue', label: 'Message Queue', category: 'messaging' },
  ],
  links: [
    { source: 'web', target: 'api-gw', value: 5000 },
    { source: 'mobile', target: 'api-gw', value: 3000 },
    { source: 'api-gw', target: 'auth', value: 8000 },
    { source: 'api-gw', target: 'user-svc', value: 2500 },
    { source: 'api-gw', target: 'order-svc', value: 3500 },
    { source: 'api-gw', target: 'payment-svc', value: 1500 },
    { source: 'auth', target: 'cache', value: 6000 },
    { source: 'auth', target: 'user-db', value: 2000 },
    { source: 'user-svc', target: 'user-db', value: 2500 },
    { source: 'order-svc', target: 'order-db', value: 3500 },
    { source: 'order-svc', target: 'queue', value: 2000 },
    { source: 'payment-svc', target: 'order-db', value: 1500 },
    { source: 'queue', target: 'notify-svc', value: 2000 },
  ],
};

// ── 2. ETL Pipeline ────────────────────────────────────────
// Sources → Ingestion → Transform → Load → Data Warehouse

export const ETL_PIPELINE: SankeyDemoDataset = {
  name: 'ETL Pipeline',
  description: 'Data sources → Ingestion → Transform → Load → Warehouse',
  nodes: [
    { id: 'clickstream', label: 'Clickstream', category: 'source' },
    { id: 'app-logs', label: 'App Logs', category: 'source' },
    { id: 'db-cdc', label: 'DB CDC Stream', category: 'source' },
    { id: 'third-party', label: '3rd Party API', category: 'source' },
    { id: 'kafka', label: 'Kafka Ingest', category: 'ingestion' },
    { id: 'kinesis', label: 'Kinesis Stream', category: 'ingestion' },
    { id: 'dedupe', label: 'Deduplication', category: 'transform' },
    { id: 'enrich', label: 'Enrichment', category: 'transform' },
    { id: 'validate', label: 'Validation', category: 'transform' },
    { id: 'aggregate', label: 'Aggregation', category: 'transform' },
    { id: 's3-staging', label: 'S3 Staging', category: 'staging' },
    { id: 'redshift', label: 'Redshift', category: 'warehouse' },
    { id: 'snowflake', label: 'Snowflake', category: 'warehouse' },
    { id: 'dead-letter', label: 'Dead Letter Queue', category: 'error' },
  ],
  links: [
    { source: 'clickstream', target: 'kafka', value: 10000 },
    { source: 'app-logs', target: 'kafka', value: 8000 },
    { source: 'db-cdc', target: 'kinesis', value: 5000 },
    { source: 'third-party', target: 'kinesis', value: 2000 },
    { source: 'kafka', target: 'dedupe', value: 17000 },
    { source: 'kafka', target: 'dead-letter', value: 1000 },
    { source: 'kinesis', target: 'validate', value: 7000 },
    { source: 'dedupe', target: 'enrich', value: 15000 },
    { source: 'dedupe', target: 'dead-letter', value: 2000 },
    { source: 'validate', target: 'enrich', value: 6500 },
    { source: 'validate', target: 'dead-letter', value: 500 },
    { source: 'enrich', target: 'aggregate', value: 21500 },
    { source: 'aggregate', target: 's3-staging', value: 21500 },
    { source: 's3-staging', target: 'redshift', value: 12000 },
    { source: 's3-staging', target: 'snowflake', value: 9500 },
  ],
};

// ── 3. CDN Request Routing ─────────────────────────────────
// Global Regions → Edge PoPs → Origin Servers → Storage

export const CDN_ROUTING: SankeyDemoDataset = {
  name: 'CDN Request Routing',
  description: 'Regions → Edge PoPs → Origin Servers → Storage',
  nodes: [
    { id: 'us-east', label: 'US East', category: 'region' },
    { id: 'us-west', label: 'US West', category: 'region' },
    { id: 'eu', label: 'Europe', category: 'region' },
    { id: 'asia', label: 'Asia Pacific', category: 'region' },
    { id: 'edge-nyc', label: 'Edge NYC', category: 'edge' },
    { id: 'edge-sfo', label: 'Edge SFO', category: 'edge' },
    { id: 'edge-lon', label: 'Edge London', category: 'edge' },
    { id: 'edge-tyo', label: 'Edge Tokyo', category: 'edge' },
    { id: 'cache-hit', label: 'Cache Hit', category: 'cache' },
    { id: 'origin-1', label: 'Origin US', category: 'origin' },
    { id: 'origin-2', label: 'Origin EU', category: 'origin' },
    { id: 's3', label: 'S3 Bucket', category: 'storage' },
    { id: 'db-origin', label: 'Origin DB', category: 'storage' },
  ],
  links: [
    { source: 'us-east', target: 'edge-nyc', value: 8000 },
    { source: 'us-west', target: 'edge-sfo', value: 6000 },
    { source: 'eu', target: 'edge-lon', value: 5000 },
    { source: 'asia', target: 'edge-tyo', value: 4000 },
    { source: 'edge-nyc', target: 'cache-hit', value: 6400 },
    { source: 'edge-nyc', target: 'origin-1', value: 1600 },
    { source: 'edge-sfo', target: 'cache-hit', value: 4800 },
    { source: 'edge-sfo', target: 'origin-1', value: 1200 },
    { source: 'edge-lon', target: 'cache-hit', value: 4000 },
    { source: 'edge-lon', target: 'origin-2', value: 1000 },
    { source: 'edge-tyo', target: 'cache-hit', value: 3200 },
    { source: 'edge-tyo', target: 'origin-1', value: 800 },
    { source: 'origin-1', target: 's3', value: 2500 },
    { source: 'origin-1', target: 'db-origin', value: 1100 },
    { source: 'origin-2', target: 's3', value: 700 },
    { source: 'origin-2', target: 'db-origin', value: 300 },
  ],
};

// ── All Demo Datasets ──────────────────────────────────────

export const SANKEY_DEMO_DATASETS: SankeyDemoDataset[] = [
  MICROSERVICE_FLOW,
  ETL_PIPELINE,
  CDN_ROUTING,
];
