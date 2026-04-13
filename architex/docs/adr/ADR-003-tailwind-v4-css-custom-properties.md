# ADR-003: Tailwind v4 with CSS Custom Properties for Theming

**Status:** Accepted

**Date:** 2024

## Context

Architex needs a theming system that supports:

- Dark and light modes with a system-preference option.
- Semantic color tokens for UI surfaces, foreground text, borders, and interactive states.
- Node-specific color palettes (compute=blue, storage=green, messaging=orange, etc.).
- Simulation state colors (idle=gray, active=blue, error=red, etc.).
- Visualization chart colors for metrics dashboards.
- Easy customization without modifying component code.

Options considered:

1. **Tailwind v4 + CSS custom properties** -- Tailwind for utility classes, with a custom property layer for semantic tokens.
2. **CSS Modules** -- Scoped styles per component. Verbose for a design system with hundreds of shared tokens.
3. **styled-components / Emotion** -- CSS-in-JS with theme providers. Runtime cost, and not aligned with the Next.js App Router server component model.
4. **Tailwind v3 with theme config** -- Works but requires `tailwind.config.js` theme extension. V4 uses CSS-native theming.

## Decision

Use **Tailwind CSS v4** with `@tailwindcss/postcss` and define all theme tokens as **CSS custom properties** in `src/app/globals.css`.

## Rationale

1. **CSS-native theming.** Tailwind v4 reads custom properties directly, eliminating the need for a JavaScript theme config. All tokens are defined in one file:

   ```css
   /* src/app/globals.css */
   @import "tailwindcss";

   :root, .dark {
     --background: hsl(228 15% 7%);
     --surface: hsl(228 15% 10%);
     --elevated: hsl(228 15% 12%);
     --foreground: hsl(220 14% 90%);
     --primary: hsl(252 87% 67%);
     /* ... 60+ tokens ... */
   }

   .light {
     --background: hsl(0 0% 100%);
     --surface: hsl(220 14% 96%);
     /* ... light theme overrides ... */
   }
   ```

2. **4-layer background system.** The design system uses four background layers (`--background`, `--surface`, `--elevated`, `--overlay`) to create visual depth without relying on shadows, matching the Linear/VS Code aesthetic.

3. **Node type colors.** Each node category has a dedicated CSS variable consumed by `BaseNode.tsx`:

   ```css
   --node-compute: hsl(217 91% 60%);
   --node-storage: hsl(142 71% 45%);
   --node-messaging: hsl(25 95% 53%);
   --node-networking: hsl(271 81% 56%);
   --node-security: hsl(0 72% 51%);
   --node-observability: hsl(38 92% 50%);
   --node-client: hsl(199 89% 48%);
   --node-processing: hsl(340 82% 52%);
   ```

   `BaseNode` reads these via `var(--node-compute)` etc., and uses `color-mix()` for derived shades:

   ```tsx
   // src/components/canvas/nodes/system-design/BaseNode.tsx
   style={{ backgroundColor: `color-mix(in srgb, ${categoryColor} 12%, transparent)` }}
   ```

4. **Simulation state colors.** Node states use semantic variables:

   ```css
   --state-idle: hsl(220 9% 42%);
   --state-active: hsl(217 91% 60%);
   --state-success: hsl(142 71% 45%);
   --state-warning: hsl(38 92% 50%);
   --state-error: hsl(0 72% 51%);
   --state-processing: hsl(271 81% 56%);
   ```

5. **Theme switching.** The `ThemeProvider` in `src/components/providers/theme-provider.tsx` uses `next-themes` to toggle the `.dark` / `.light` class on `<html>`. All components reactively update because they reference CSS variables, not hardcoded colors.

6. **Utility class composition.** Components use Tailwind utilities that reference the custom properties:

   ```tsx
   className="bg-background text-foreground border-border"
   className="bg-sidebar text-foreground-muted hover:bg-sidebar-accent"
   ```

   The `cn()` helper (wrapping `clsx` + `tailwind-merge`) in `src/lib/utils.ts` handles conditional class merging.

7. **PostCSS pipeline.** The build uses `@tailwindcss/postcss` v4 configured in `postcss.config.mjs`:

   ```js
   export default { plugins: { "@tailwindcss/postcss": {} } };
   ```

## Consequences

### Positive

- Single source of truth for all colors in one CSS file.
- Dark/light themes require only CSS variable overrides, no JavaScript changes.
- `color-mix()` enables derived colors without a preprocessor.
- Node and state colors are decoupled from component code -- a designer can restyle the entire app by editing `globals.css`.
- Zero runtime JS for theming (CSS-only).

### Negative

- CSS custom properties are not type-checked. A typo in `var(--backgrund)` silently fails.
- Tailwind v4 is relatively new; some community plugins may not yet support it.
- The `color-mix()` function requires modern browsers (Safari 15+, Chrome 111+), which is acceptable for a developer tool.

## References

- Theme tokens: `src/app/globals.css`
- Theme provider: `src/components/providers/theme-provider.tsx`
- PostCSS config: `postcss.config.mjs`
- Utility helper: `src/lib/utils.ts`
- BaseNode color mapping: `src/components/canvas/nodes/system-design/BaseNode.tsx` (lines 12-33)
- Palette color mapping: `src/lib/palette-items.ts` (`CATEGORY_COLORS`)
- Package: `tailwindcss` ^4, `@tailwindcss/postcss` ^4 in `package.json`
