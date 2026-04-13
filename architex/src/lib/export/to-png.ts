// ─────────────────────────────────────────────────────────────
// PNG Export (EXP-006)
// Uses Canvas API to render the React Flow viewport as a PNG.
// No external dependencies required.
// ─────────────────────────────────────────────────────────────

const DEFAULT_SCALE = 2; // 2x for retina displays

/** Options for PNG export. */
export interface PNGExportOptions {
  /** CSS selector to scope the search for `.react-flow` (default: document). */
  elementSelector?: string;
  /** Pixel scale factor for retina support (default: 2). */
  scale?: number;
  /** Background colour for the exported image (default: '#ffffff'). */
  backgroundColor?: string;
}

/**
 * Get the React Flow viewport element, optionally scoped by a parent selector.
 */
function getReactFlowElement(elementSelector?: string): Element {
  const scope = elementSelector
    ? document.querySelector(elementSelector)
    : document;
  if (!scope) {
    throw new Error(
      `Element not found for selector: ${elementSelector ?? 'document'}`,
    );
  }
  const el =
    scope instanceof Element
      ? scope.querySelector('.react-flow')
      : scope.querySelector('.react-flow');
  if (!el) {
    throw new Error(
      'React Flow element (.react-flow) not found in the document.',
    );
  }
  return el;
}

/**
 * Inline all computed styles onto an element tree so that the serialised
 * SVG/foreignObject renders identically to the live DOM.
 */
function inlineStyles(source: Element, target: Element): void {
  const computed = window.getComputedStyle(source);
  const targetEl = target as HTMLElement | SVGElement;
  if ('style' in targetEl) {
    for (let i = 0; i < computed.length; i++) {
      const prop = computed[i];
      (targetEl.style as CSSStyleDeclaration).setProperty(
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
 * Export the React Flow canvas as a PNG Blob.
 *
 * Accepts either the new options object or the legacy positional arguments
 * for backward compatibility.
 */
export async function exportToPNG(
  options?: PNGExportOptions,
): Promise<Blob>;
export async function exportToPNG(
  elementSelector?: string,
  scale?: number,
): Promise<Blob>;
export async function exportToPNG(
  optionsOrSelector?: PNGExportOptions | string,
  legacyScale?: number,
): Promise<Blob> {
  // Normalise arguments — support both old and new call signatures
  let elementSelector: string | undefined;
  let scale = DEFAULT_SCALE;
  let backgroundColor = '#ffffff';

  if (typeof optionsOrSelector === 'object' && optionsOrSelector !== null) {
    elementSelector = optionsOrSelector.elementSelector;
    scale = optionsOrSelector.scale ?? DEFAULT_SCALE;
    backgroundColor = optionsOrSelector.backgroundColor ?? '#ffffff';
  } else {
    elementSelector = optionsOrSelector;
    scale = legacyScale ?? DEFAULT_SCALE;
  }

  const reactFlowEl = getReactFlowElement(elementSelector);

  // Find the SVG viewport that React Flow renders
  const svgViewport = reactFlowEl.querySelector('.react-flow__viewport');
  if (!svgViewport) {
    throw new Error('React Flow viewport not found.');
  }

  // Get the bounding rect of the whole React Flow container
  const rfRect = reactFlowEl.getBoundingClientRect();

  // Clone the entire React Flow element
  const clone = reactFlowEl.cloneNode(true) as Element;

  // Remove interactive controls and UI overlays from the clone
  const selectorsToRemove = [
    '.react-flow__controls',
    '.react-flow__minimap',
    '.react-flow__panel',
    '.react-flow__attribution',
    // CanvasToolbar and other overlay panels
    '[class*="toolbar"]',
    '[class*="Toolbar"]',
  ];
  for (const sel of selectorsToRemove) {
    clone.querySelectorAll(sel).forEach((el) => el.remove());
  }

  // Inline computed styles so the clone renders correctly outside the DOM
  inlineStyles(reactFlowEl, clone);

  // Serialize the clone to an SVG foreignObject
  const serializer = new XMLSerializer();
  const htmlString = serializer.serializeToString(clone);

  const width = rfRect.width;
  const height = rfRect.height;

  // Escape the background colour for embedding in the SVG attribute
  const escapedBg = backgroundColor.replace(/"/g, '&quot;');

  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="${escapedBg}" />
      <foreignObject width="100%" height="100%">
        ${htmlString}
      </foreignObject>
    </svg>
  `.trim();

  const svgBlob = new Blob([svgString], {
    type: 'image/svg+xml;charset=utf-8',
  });
  const url = URL.createObjectURL(svgBlob);

  // Draw SVG onto a canvas at the requested scale
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    URL.revokeObjectURL(url);
    throw new Error('Failed to create canvas 2D context.');
  }

  return new Promise<Blob>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Fill background first so transparency is replaced
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas toBlob returned null.'));
          }
        },
        'image/png',
        1.0,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG image for PNG conversion.'));
    };
    img.src = url;
  });
}

/**
 * Convert a PNG Blob to a base-64 data URL.  Used by the PDF exporter.
 */
export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('FileReader did not return a string.'));
      }
    };
    reader.onerror = () => reject(new Error('FileReader error.'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Export the React Flow canvas and trigger a browser download as PNG.
 *
 * @param filename - download filename (default "architex-diagram.png")
 * @param options  - optional PNG export options
 */
export async function downloadPNG(
  filename?: string,
  options?: PNGExportOptions,
): Promise<void> {
  const blob = await exportToPNG(options ?? {});
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename ?? 'architex-diagram.png';
  document.body.appendChild(anchor);
  anchor.click();

  // Cleanup
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
