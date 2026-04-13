// ─────────────────────────────────────────────────────────────
// SVG Export (EXP-007)
// Clones the React Flow SVG viewport, inlines styles, embeds
// fonts, and serializes to a self-contained SVG string.
// ─────────────────────────────────────────────────────────────

const DEFAULT_PADDING = 20;

/** Options for SVG export. */
export interface SVGExportOptions {
  /**
   * Embed @font-face rules and CSS custom properties so the SVG
   * renders identically on any system (default: true).
   */
  embedFonts?: boolean;
}

/**
 * Collect all @font-face rules from the document's stylesheets
 * so they can be embedded into the exported SVG.
 */
function collectFontFaceRules(): string {
  const fontRules: string[] = [];
  try {
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        for (const rule of Array.from(sheet.cssRules)) {
          if (rule instanceof CSSFontFaceRule) {
            fontRules.push(rule.cssText);
          }
        }
      } catch {
        // CORS-restricted stylesheet — skip silently
      }
    }
  } catch {
    // styleSheets not available
  }
  return fontRules.join('\n');
}

/**
 * Collect relevant CSS custom properties (design tokens) from :root
 * so the exported SVG resolves `var(--*)` references.
 */
function collectCSSVariables(): string {
  const root = document.documentElement;
  const computed = window.getComputedStyle(root);
  const vars: string[] = [];

  // Iterate all properties and pick CSS custom properties
  for (let i = 0; i < computed.length; i++) {
    const prop = computed[i];
    if (prop.startsWith('--')) {
      vars.push(`  ${prop}: ${computed.getPropertyValue(prop)};`);
    }
  }

  if (vars.length === 0) return '';
  return `:root {\n${vars.join('\n')}\n}`;
}

/**
 * Recursively inline computed styles on a cloned element tree.
 */
function inlineStyles(source: Element, target: Element): void {
  const computed = window.getComputedStyle(source);

  if (target instanceof HTMLElement || target instanceof SVGElement) {
    // Copy all computed styles onto the inline style attribute
    for (let i = 0; i < computed.length; i++) {
      const prop = computed[i];
      target.style.setProperty(
        prop,
        computed.getPropertyValue(prop),
        computed.getPropertyPriority(prop),
      );
    }
  }

  const sourceChildren = source.children;
  const targetChildren = target.children;
  for (let i = 0; i < sourceChildren.length; i++) {
    if (targetChildren[i]) {
      inlineStyles(sourceChildren[i], targetChildren[i]);
    }
  }
}

/**
 * Export the React Flow canvas as a self-contained SVG string.
 *
 * The SVG includes inlined styles and — when `embedFonts` is true
 * (the default) — embedded font-face rules and CSS custom properties
 * so it renders identically in any viewer.
 */
export function exportToSVG(options?: SVGExportOptions): string {
  const embedFonts = options?.embedFonts ?? true;

  const reactFlowEl = document.querySelector('.react-flow');
  if (!reactFlowEl) {
    throw new Error('React Flow element (.react-flow) not found.');
  }

  // Locate the inner SVG that React Flow renders for edges/connections
  // and the viewport wrapper that contains all node HTML
  const viewport = reactFlowEl.querySelector('.react-flow__viewport');
  if (!viewport) {
    throw new Error('React Flow viewport not found.');
  }

  // Get bounds of the content area
  const rfRect = reactFlowEl.getBoundingClientRect();
  const width = rfRect.width + DEFAULT_PADDING * 2;
  const height = rfRect.height + DEFAULT_PADDING * 2;

  // Deep-clone the entire React Flow element
  const clone = reactFlowEl.cloneNode(true) as Element;

  // Strip UI controls from the clone
  const selectorsToRemove = [
    '.react-flow__controls',
    '.react-flow__minimap',
    '.react-flow__panel',
    '.react-flow__attribution',
  ];
  for (const sel of selectorsToRemove) {
    clone.querySelectorAll(sel).forEach((el) => el.remove());
  }

  // Inline all computed styles so the SVG is self-contained
  inlineStyles(reactFlowEl, clone);

  // Collect embedded resources (only when embedding is enabled)
  const fontFaces = embedFonts ? collectFontFaceRules() : '';
  const cssVars = embedFonts ? collectCSSVariables() : '';

  // Serialize the cloned DOM
  const serializer = new XMLSerializer();
  const innerHtml = serializer.serializeToString(clone);

  // Build the final SVG with an embedded foreignObject
  const svgString = [
    `<svg xmlns="http://www.w3.org/2000/svg"`,
    `     xmlns:xlink="http://www.w3.org/1999/xlink"`,
    `     width="${width}" height="${height}"`,
    `     viewBox="0 0 ${width} ${height}"`,
    `     style="background: hsl(228 15% 7%);">`,
    `  <defs>`,
    `    <style type="text/css">`,
    `      <![CDATA[`,
    fontFaces ? `        ${fontFaces}` : '',
    cssVars ? `        ${cssVars}` : '',
    `      ]]>`,
    `    </style>`,
    `  </defs>`,
    `  <foreignObject x="${DEFAULT_PADDING}" y="${DEFAULT_PADDING}"`,
    `                  width="${rfRect.width}" height="${rfRect.height}">`,
    `    ${innerHtml}`,
    `  </foreignObject>`,
    `</svg>`,
  ]
    .filter(Boolean)
    .join('\n');

  return svgString;
}

/**
 * Export the SVG and trigger a browser download.
 *
 * @param filename - download filename (default "architex-diagram.svg")
 * @param options  - optional SVG export options
 */
export function downloadSVG(
  filename?: string,
  options?: SVGExportOptions,
): void {
  const svgString = exportToSVG(options);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename ?? 'architex-diagram.svg';
  document.body.appendChild(anchor);
  anchor.click();

  // Cleanup
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
