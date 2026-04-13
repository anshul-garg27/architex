// ─────────────────────────────────────────────────────────────
// Architex — COL-015 oEmbed Provider
// ─────────────────────────────────────────────────────────────
//
// Returns oEmbed JSON for shared design URLs.
// Supports auto-expansion in Slack, Notion, Discord, etc.
//
// GET /api/oembed?url=https://architex.app/?d=...&format=json

import { NextResponse } from 'next/server';

// ── Constants ─────────────────────────────────────────────────

const PROVIDER_NAME = 'Architex';
const PROVIDER_URL = 'https://architex.app';
const OEMBED_VERSION = '1.0';

// ── Types ─────────────────────────────────────────────────────

interface OEmbedRichResponse {
  version: string;
  type: 'rich';
  provider_name: string;
  provider_url: string;
  title: string;
  html: string;
  width: number;
  height: number;
  thumbnail_url?: string;
  thumbnail_width?: number;
  thumbnail_height?: number;
  cache_age?: number;
}

interface OEmbedErrorResponse {
  error: string;
  status: number;
}

// ── Route handler ─────────────────────────────────────────────

export async function GET(request: Request): Promise<NextResponse<OEmbedRichResponse | OEmbedErrorResponse>> {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const format = searchParams.get('format') ?? 'json';
  const maxWidth = parseInt(searchParams.get('maxwidth') ?? '800', 10);
  const maxHeight = parseInt(searchParams.get('maxheight') ?? '450', 10);

  // Only JSON format is supported
  if (format !== 'json') {
    return NextResponse.json(
      { error: 'Only JSON format is supported.', status: 501 },
      { status: 501 },
    );
  }

  // URL is required
  if (!url) {
    return NextResponse.json(
      { error: 'Missing required "url" parameter.', status: 400 },
      { status: 400 },
    );
  }

  // Validate the URL is an Architex design URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json(
      { error: 'Invalid URL format.', status: 400 },
      { status: 400 },
    );
  }

  const isArchitexUrl =
    parsedUrl.hostname === 'architex.app' ||
    parsedUrl.hostname === 'www.architex.app' ||
    parsedUrl.hostname === 'localhost';

  if (!isArchitexUrl) {
    return NextResponse.json(
      { error: 'URL must be an Architex design URL.', status: 400 },
      { status: 400 },
    );
  }

  // Extract design data parameter
  const designData = parsedUrl.searchParams.get('d');
  const hasDesignData = !!designData;

  // Extract title from URL path or use default
  const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
  const title = pathSegments.length > 0
    ? decodeURIComponent(pathSegments[pathSegments.length - 1]).replace(/-/g, ' ')
    : 'Architex Design';

  // Clamp dimensions
  const width = Math.min(maxWidth, 800);
  const height = Math.min(maxHeight, 450);

  // Build the embed HTML — an iframe pointing to the design
  const embedUrl = hasDesignData
    ? `${PROVIDER_URL}/embed?d=${encodeURIComponent(designData)}`
    : `${PROVIDER_URL}/embed?url=${encodeURIComponent(url)}`;

  const html = [
    `<iframe`,
    `  src="${embedUrl}"`,
    `  width="${width}"`,
    `  height="${height}"`,
    `  frameborder="0"`,
    `  allowfullscreen`,
    `  sandbox="allow-scripts allow-same-origin"`,
    `  style="border: 1px solid #27272a; border-radius: 12px;"`,
    `  title="${escapeHtml(title)} — Architex"`,
    `></iframe>`,
  ].join('\n');

  // OG image as thumbnail
  const thumbnailUrl = `${PROVIDER_URL}/api/og?title=${encodeURIComponent(title)}&type=concept`;

  const response: OEmbedRichResponse = {
    version: OEMBED_VERSION,
    type: 'rich',
    provider_name: PROVIDER_NAME,
    provider_url: PROVIDER_URL,
    title: `${title} — Architex`,
    html,
    width,
    height,
    thumbnail_url: thumbnailUrl,
    thumbnail_width: 1200,
    thumbnail_height: 630,
    cache_age: 86400, // 24 hours
  };

  return NextResponse.json(response, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=604800',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// ── Helpers ───────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
