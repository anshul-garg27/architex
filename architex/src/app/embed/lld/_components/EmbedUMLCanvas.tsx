// ---------------------------------------------------------------------------
// EmbedUMLCanvas — Standalone SVG UML class diagram renderer (LLD-141)
// ---------------------------------------------------------------------------
// Server component that renders a lightweight SVG representation of UML
// classes and relationships. Designed for iframe embedding — no interactivity,
// just a clean static diagram with an "Open in Architex" link.
// ---------------------------------------------------------------------------

import type { UMLClass, UMLRelationship } from "@/lib/lld";

// -- Layout constants -------------------------------------------------------

const CLASS_WIDTH = 220;
const CLASS_HEADER_HEIGHT = 32;
const ROW_HEIGHT = 20;
const CLASS_PADDING_X = 12;
const CLASS_GAP_X = 40;
const CLASS_GAP_Y = 30;
const COLS = 3;

// -- Helpers ----------------------------------------------------------------

const VISIBILITY_SYMBOL: Record<string, string> = {
  "+": "+",
  "-": "-",
  "#": "#",
  "~": "~",
};

const STEREOTYPE_LABEL: Record<string, string> = {
  interface: "\u00ABinterface\u00BB",
  abstract: "\u00ABabstract\u00BB",
  enum: "\u00ABenumeration\u00BB",
  class: "",
};

function classHeight(cls: UMLClass): number {
  const memberRows = Math.max(cls.attributes.length + cls.methods.length, 1);
  // header + divider + members + bottom padding
  return CLASS_HEADER_HEIGHT + 4 + memberRows * ROW_HEIGHT + 8;
}

interface ClassRect {
  cls: UMLClass;
  x: number;
  y: number;
  w: number;
  h: number;
}

function layoutClasses(classes: UMLClass[]): ClassRect[] {
  const rects: ClassRect[] = [];
  let col = 0;
  let row = 0;
  let rowMaxHeight = 0;
  let yOffset = 20;

  for (const cls of classes) {
    const h = classHeight(cls);
    const x = 20 + col * (CLASS_WIDTH + CLASS_GAP_X);
    const y = yOffset;

    rects.push({ cls, x, y, w: CLASS_WIDTH, h });
    rowMaxHeight = Math.max(rowMaxHeight, h);
    col++;

    if (col >= COLS) {
      col = 0;
      row++;
      yOffset += rowMaxHeight + CLASS_GAP_Y;
      rowMaxHeight = 0;
    }
  }

  return rects;
}

const ARROW_MARKERS: Record<string, { id: string; fill: string; path: string }> = {
  inheritance: { id: "arrowInherit", fill: "none", path: "M0,0 L10,5 L0,10 z" },
  realization: { id: "arrowRealize", fill: "none", path: "M0,0 L10,5 L0,10 z" },
  composition: { id: "arrowCompose", fill: "#a78bfa", path: "M0,5 L5,0 L10,5 L5,10 z" },
  aggregation: { id: "arrowAggregate", fill: "none", path: "M0,5 L5,0 L10,5 L5,10 z" },
  association: { id: "arrowAssoc", fill: "#71717a", path: "M0,0 L10,5 L0,10" },
  dependency: { id: "arrowDep", fill: "#71717a", path: "M0,0 L10,5 L0,10" },
};

// -- Component ---------------------------------------------------------------

interface EmbedUMLCanvasProps {
  title: string;
  category: string;
  classes: UMLClass[];
  relationships: UMLRelationship[];
  linkHref: string;
}

export function EmbedUMLCanvas({
  title,
  category,
  classes,
  relationships,
  linkHref,
}: EmbedUMLCanvasProps) {
  const rects = layoutClasses(classes);
  const rectMap = new Map<string, ClassRect>();
  for (const r of rects) {
    rectMap.set(r.cls.id, r);
  }

  // Calculate SVG viewBox from laid-out classes
  let maxX = 600;
  let maxY = 400;
  for (const r of rects) {
    maxX = Math.max(maxX, r.x + r.w + 40);
    maxY = Math.max(maxY, r.y + r.h + 40);
  }

  return (
    <div className="flex h-full w-full flex-col">
      {/* Header bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            {title}
          </h2>
          <span className="rounded-full bg-[var(--primary)]/15 px-2 py-0.5 text-[10px] font-medium text-[var(--primary)]">
            {category}
          </span>
        </div>
        <a
          href={`https://architex.dev${linkHref}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-medium text-[var(--primary)] transition-colors hover:underline"
        >
          Open in Architex &#8599;
        </a>
      </div>

      {/* SVG Canvas */}
      <div className="flex flex-1 items-center justify-center overflow-auto bg-[var(--background)] p-2">
        <svg
          viewBox={`0 0 ${maxX} ${maxY}`}
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full"
          style={{ maxWidth: maxX, maxHeight: maxY }}
        >
          {/* Marker definitions for relationship arrows */}
          <defs>
            {Object.entries(ARROW_MARKERS).map(([, marker]) => (
              <marker
                key={marker.id}
                id={marker.id}
                viewBox="0 0 10 10"
                refX="10"
                refY="5"
                markerWidth="8"
                markerHeight="8"
                orient="auto-start-reverse"
              >
                <path
                  d={marker.path}
                  fill={marker.fill}
                  stroke="#71717a"
                  strokeWidth="1"
                />
              </marker>
            ))}
          </defs>

          {/* Relationships (drawn first so they appear behind classes) */}
          {relationships.map((rel) => {
            const src = rectMap.get(rel.source);
            const tgt = rectMap.get(rel.target);
            if (!src || !tgt) return null;

            const srcCx = src.x + src.w / 2;
            const srcCy = src.y + src.h / 2;
            const tgtCx = tgt.x + tgt.w / 2;
            const tgtCy = tgt.y + tgt.h / 2;

            // Connect from edge of source to edge of target
            const dx = tgtCx - srcCx;
            const dy = tgtCy - srcCy;
            const isVertical = Math.abs(dy) > Math.abs(dx);

            let x1: number, y1: number, x2: number, y2: number;
            if (isVertical) {
              x1 = srcCx;
              y1 = dy > 0 ? src.y + src.h : src.y;
              x2 = tgtCx;
              y2 = dy > 0 ? tgt.y : tgt.y + tgt.h;
            } else {
              x1 = dx > 0 ? src.x + src.w : src.x;
              y1 = srcCy;
              x2 = dx > 0 ? tgt.x : tgt.x + tgt.w;
              y2 = tgtCy;
            }

            const marker = ARROW_MARKERS[rel.type];
            const isDashed =
              rel.type === "dependency" || rel.type === "realization";

            return (
              <g key={rel.id}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#52525b"
                  strokeWidth="1.5"
                  strokeDasharray={isDashed ? "6,3" : undefined}
                  markerEnd={marker ? `url(#${marker.id})` : undefined}
                />
                {rel.label && (
                  <text
                    x={(x1 + x2) / 2}
                    y={(y1 + y2) / 2 - 6}
                    fill="#a1a1aa"
                    fontSize="10"
                    textAnchor="middle"
                  >
                    {rel.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Classes */}
          {rects.map(({ cls, x, y, w, h }) => {
            const stereo = STEREOTYPE_LABEL[cls.stereotype];
            let memberY = y + CLASS_HEADER_HEIGHT + 4;

            return (
              <g key={cls.id}>
                {/* Background */}
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  rx="6"
                  fill="#1c1c2e"
                  stroke="#3f3f60"
                  strokeWidth="1"
                />

                {/* Header background */}
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={CLASS_HEADER_HEIGHT}
                  rx="6"
                  fill="#2a2a45"
                />
                {/* Cover bottom corners of header */}
                <rect
                  x={x}
                  y={y + CLASS_HEADER_HEIGHT - 6}
                  width={w}
                  height={6}
                  fill="#2a2a45"
                />

                {/* Stereotype */}
                {stereo && (
                  <text
                    x={x + w / 2}
                    y={y + 13}
                    fill="#a78bfa"
                    fontSize="9"
                    fontStyle="italic"
                    textAnchor="middle"
                  >
                    {stereo}
                  </text>
                )}

                {/* Class name */}
                <text
                  x={x + w / 2}
                  y={y + (stereo ? 26 : 21)}
                  fill="#f4f4f5"
                  fontSize="12"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {cls.name}
                </text>

                {/* Divider */}
                <line
                  x1={x + 1}
                  y1={y + CLASS_HEADER_HEIGHT}
                  x2={x + w - 1}
                  y2={y + CLASS_HEADER_HEIGHT}
                  stroke="#3f3f60"
                  strokeWidth="0.5"
                />

                {/* Attributes */}
                {cls.attributes.map((attr) => {
                  const vis = VISIBILITY_SYMBOL[attr.visibility] ?? "+";
                  const label = `${vis} ${attr.name}: ${attr.type}`;
                  const currentY = memberY;
                  memberY += ROW_HEIGHT;
                  return (
                    <text
                      key={attr.id}
                      x={x + CLASS_PADDING_X}
                      y={currentY + 14}
                      fill="#a1a1aa"
                      fontSize="10"
                      fontFamily="monospace"
                    >
                      {label.length > 28 ? label.slice(0, 26) + ".." : label}
                    </text>
                  );
                })}

                {/* Methods */}
                {cls.methods.map((method) => {
                  const vis = VISIBILITY_SYMBOL[method.visibility] ?? "+";
                  const params =
                    method.params.length > 0 ? method.params.join(", ") : "";
                  const label = `${vis} ${method.name}(${params}): ${method.returnType}`;
                  const currentY = memberY;
                  memberY += ROW_HEIGHT;
                  return (
                    <text
                      key={method.id}
                      x={x + CLASS_PADDING_X}
                      y={currentY + 14}
                      fill="#d4d4d8"
                      fontSize="10"
                      fontFamily="monospace"
                    >
                      {label.length > 28 ? label.slice(0, 26) + ".." : label}
                    </text>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-[var(--border)] bg-[var(--surface)] px-4 py-1.5 text-center text-[9px] text-[var(--foreground-subtle)]">
        Powered by{" "}
        <a
          href="https://architex.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--primary)]"
        >
          Architex
        </a>
      </div>
    </div>
  );
}
