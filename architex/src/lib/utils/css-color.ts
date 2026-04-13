/**
 * Reads a CSS custom property value at runtime.
 * Needed for canvas/SVG code that can't use Tailwind classes
 * (e.g., React Flow edge strokes, canvas.fillStyle, SVG fill attributes).
 */
export function getCSSColor(variable: string): string {
  if (typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();
}

// Pre-defined color getters for common use cases
export function getNodeColor(category: string): string {
  return getCSSColor(`--node-${category}`);
}

export function getStateColor(state: string): string {
  return getCSSColor(`--state-${state}`);
}
