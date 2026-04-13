/**
 * Export Command Handler
 *
 * Triggers diagram export in the requested format by opening
 * the export dialog or directly invoking export functions.
 * Runs outside React — accesses stores via `.getState()`.
 */

import type { Command, ExportPayload } from '../types';
import { useUIStore } from '@/stores/ui-store';
import { useCanvasStore } from '@/stores/canvas-store';
import { exportToJSON, downloadJSON } from '@/lib/export/to-json';
import { downloadPNG } from '@/lib/export/to-png';
import { downloadSVG } from '@/lib/export/to-svg';
import { downloadPDF } from '@/lib/export/to-pdf';

export async function handleExport(
  command: Command<ExportPayload>,
): Promise<void> {
  const { format } = command.payload;
  const { nodes, edges } = useCanvasStore.getState();

  switch (format) {
    case 'json': {
      const diagram = exportToJSON(nodes, edges, 'architex-diagram');
      downloadJSON(diagram, 'architex-diagram');
      break;
    }
    case 'png':
      await downloadPNG('architex-diagram');
      break;
    case 'svg':
      downloadSVG('architex-diagram');
      break;
    case 'pdf':
      await downloadPDF('architex-diagram');
      break;
    default: {
      // Open the export dialog as fallback for unknown formats
      useUIStore.getState().setExportDialogOpen(true);
    }
  }
}
