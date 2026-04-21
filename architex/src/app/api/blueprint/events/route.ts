/**
 * POST /api/blueprint/events
 *   body: { events: Array<{ name: string; payload?: object }> }
 *
 * Append-only analytics log. Anonymous events have null user_id.
 * Cap: 100 events per request (drop the tail if over).
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb, blueprintEvents } from "@/db";
import { resolveUserId } from "@/lib/auth";

type IncomingEvent = { name: string; payload?: Record<string, unknown> };
type Body = { events?: IncomingEvent[] };

const MAX_EVENTS_PER_REQUEST = 100;

export async function POST(req: Request) {
  try {
    // Optional auth — anonymous events are fine.
    const { userId: clerkId } = await auth();
    const userId = clerkId ? await resolveUserId(clerkId) : null;

    const body = (await req.json()) as Body;
    const events = Array.isArray(body.events) ? body.events : [];
    if (events.length === 0) {
      return NextResponse.json({ ok: true, count: 0 });
    }

    const capped = events.slice(0, MAX_EVENTS_PER_REQUEST);
    const db = getDb();

    await db.insert(blueprintEvents).values(
      capped.map((e) => ({
        userId,
        eventName: e.name,
        eventPayload: e.payload ?? {},
      })),
    );

    return NextResponse.json({ ok: true, count: capped.length });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[api/blueprint/events] POST error:", error);
    // Never block the UI on analytics — 200 with an error marker instead
    // of 500, so the client's keepalive POST doesn't retry endlessly.
    return NextResponse.json(
      { ok: false, error: "log-failed" },
      { status: 200 },
    );
  }
}
