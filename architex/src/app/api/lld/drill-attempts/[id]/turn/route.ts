/**
 * POST /api/lld/drill-attempts/[id]/turn
 *
 * Thin alias that delegates to /api/lld/drill-interviewer/:id/stream POST.
 * Used by useDrillInterviewer to persist the user turn before opening
 * the SSE connection.
 */

import { POST as streamPost } from "@/app/api/lld/drill-interviewer/[id]/stream/route";

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return streamPost(request, ctx);
}
