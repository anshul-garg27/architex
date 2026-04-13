/**
 * Template Command Handler
 *
 * Loads a system design template by ID into the canvas store.
 * Runs outside React — accesses stores via `.getState()`.
 */

import type { Command, LoadTemplatePayload } from '../types';
import { getTemplateById } from '@/lib/templates';
import { useCanvasStore } from '@/stores/canvas-store';
import type { Node, Edge } from '@xyflow/react';

export function handleLoadTemplate(
  command: Command<LoadTemplatePayload>,
): void {
  const { templateId } = command.payload;

  const template = getTemplateById(templateId);
  if (!template) {
    throw new Error(
      `Template handler: template with id "${templateId}" not found`,
    );
  }

  const canvas = useCanvasStore.getState();

  // Map template nodes to React Flow nodes
  const nodes: Node[] = template.nodes.map((n) => ({
    id: n.id,
    type: n.type,
    position: n.position,
    data: { ...n.data },
  }));

  // Map template edges to React Flow edges
  const edges: Edge[] = template.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: e.type,
    ...(e.sourceHandle ? { sourceHandle: e.sourceHandle } : {}),
    ...(e.targetHandle ? { targetHandle: e.targetHandle } : {}),
    data: { ...e.data },
  }));

  canvas.setNodes(nodes);
  // Defer edges to next frame so node handles render in the DOM first.
  // Without this, edges with sourceHandle/targetHandle are silently dropped.
  requestAnimationFrame(() => {
    useCanvasStore.getState().setEdges(edges);
  });
}
