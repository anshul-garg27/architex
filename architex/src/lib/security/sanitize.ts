// ─────────────────────────────────────────────────────────────
// Architex — Sanitization Utilities  (SCR-007)
// ─────────────────────────────────────────────────────────────
//
// Pure-function sanitizers for SVGs, Markdown, user input, and
// postMessage origin validation. No external dependencies.
// ─────────────────────────────────────────────────────────────

// ── SVG Sanitizer ────────────────────────────────────────────

/**
 * Dangerous SVG elements that can execute scripts or load external resources.
 */
const SVG_DANGEROUS_TAGS = [
  'script',
  'foreignObject',
  'iframe',
  'embed',
  'object',
  'applet',
  'link',
  'meta',
  'base',
  'form',
  'input',
  'textarea',
  'select',
  'button',
];

/**
 * Event handler attributes (onclick, onload, onerror, etc.)
 */
const EVENT_HANDLER_RE = /\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi;

/**
 * External reference attributes: xlink:href, href with external URLs.
 */
const EXTERNAL_REF_RE = /\s+(?:xlink:)?href\s*=\s*(?:"(?!#)[^"]*"|'(?!#)[^']*')/gi;

/**
 * Dangerous CSS in style attributes (expressions, url(), behavior).
 */
const DANGEROUS_CSS_RE = /expression\s*\(|url\s*\(\s*["']?(?:javascript|data|vbscript):/gi;

/**
 * Sanitizes an SVG string by removing:
 * - Script tags and other dangerous elements
 * - Event handler attributes (onclick, onerror, etc.)
 * - External resource references (non-fragment xlink:href/href)
 * - Dangerous CSS expressions in style attributes
 *
 * @param svgString  Raw SVG markup
 * @returns          Sanitized SVG markup safe for embedding
 */
export function sanitizeSVG(svgString: string): string {
  let result = svgString;

  // Remove dangerous tags and their content
  for (const tag of SVG_DANGEROUS_TAGS) {
    const openClose = new RegExp(
      `<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`,
      'gi',
    );
    const selfClosing = new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi');
    result = result.replace(openClose, '');
    result = result.replace(selfClosing, '');
  }

  // Remove event handlers
  result = result.replace(EVENT_HANDLER_RE, '');

  // Remove external references (keep fragment-only hrefs like href="#id")
  result = result.replace(EXTERNAL_REF_RE, '');

  // Remove dangerous CSS in style attributes
  result = result.replace(DANGEROUS_CSS_RE, '');

  return result;
}

// ── Markdown Sanitizer  (SCR-015) ───────────────────────────

/**
 * Dangerous HTML tags that can execute scripts or embed external content.
 * Each entry generates both open+close and self-closing removal patterns.
 */
const MD_DANGEROUS_TAGS = [
  'script',
  'iframe',
  'embed',
  'object',
  'applet',
  'form',
  'meta',
  'link',
  'base',
];

/**
 * Event handler attributes (onclick, onload, onerror, onmouseover, etc.)
 * found inside any remaining HTML tags in the markdown.
 */
const MD_EVENT_HANDLER_RE = /\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi;

/**
 * JavaScript / vbscript / data protocol URIs in markdown links/images.
 * Handles whitespace and mixed-case evasion attempts.
 */
const MD_JS_URI_RE = /(?:javascript|vbscript|data)\s*:/gi;

/**
 * Generic HTML tags that should be stripped from markdown content.
 * Matches both opening, closing, and self-closing tags.
 */
const HTML_TAG_RE = /<\/?[a-zA-Z][^>]*\/?>/g;

/**
 * Sanitizes markdown content to prevent XSS  (SCR-015):
 *
 * 1. Removes dangerous tags (`<script>`, `<iframe>`, etc.) and their content
 * 2. Strips event-handler attributes (`onclick`, `onerror`, ...)
 * 3. Neutralizes `javascript:` / `vbscript:` / `data:` URIs
 * 4. Strips all remaining HTML tags
 *
 * The function is intentionally aggressive since Architex renders
 * markdown through a dedicated renderer that handles formatting.
 *
 * @param md  Raw markdown string
 * @returns   Sanitized markdown string
 */
export function sanitizeMarkdown(md: string): string {
  let result = md;

  // 1. Remove dangerous tags and their content
  for (const tag of MD_DANGEROUS_TAGS) {
    const openClose = new RegExp(
      `<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`,
      'gi',
    );
    const selfClosing = new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi');
    result = result.replace(openClose, '');
    result = result.replace(selfClosing, '');
  }

  // 2. Strip event-handler attributes from any surviving tags
  result = result.replace(MD_EVENT_HANDLER_RE, '');

  // 3. Neutralize dangerous URIs (replace with empty string)
  result = result.replace(MD_JS_URI_RE, '');

  // 4. Strip all remaining HTML tags
  result = result.replace(HTML_TAG_RE, '');

  return result;
}

// ── User Input Sanitizer ─────────────────────────────────────

/**
 * Characters that must be escaped to prevent HTML injection / XSS.
 */
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#96;',
};

const HTML_ESCAPE_RE = /[&<>"'/`]/g;

/**
 * Sanitizes free-form user input for safe rendering in HTML.
 *
 * - Escapes HTML-significant characters
 * - Trims leading/trailing whitespace
 * - Collapses multiple newlines to max 2
 *
 * @param input  Raw user input string
 * @returns      HTML-safe string
 */
export function sanitizeUserInput(input: string): string {
  const trimmed = input.trim();

  // Escape HTML characters
  const escaped = trimmed.replace(HTML_ESCAPE_RE, (char) => HTML_ESCAPE_MAP[char] || char);

  // Collapse excessive newlines (3+ -> 2)
  return escaped.replace(/\n{3,}/g, '\n\n');
}

// ── postMessage Origin Validator ─────────────────────────────

/**
 * Validates that a MessageEvent comes from an allowed origin.
 *
 * @param event           The MessageEvent to validate
 * @param allowedOrigins  Array of origin strings (e.g. ['https://architex.dev'])
 * @returns               true if the event's origin is in the allow list
 */
export function validatePostMessageOrigin(
  event: { origin: string },
  allowedOrigins: string[],
): boolean {
  if (!event || typeof event.origin !== 'string') {
    return false;
  }
  return allowedOrigins.includes(event.origin);
}
