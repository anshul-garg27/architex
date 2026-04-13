import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";

/**
 * Clerk webhook handler — syncs user lifecycle events to our database.
 *
 * Verifies the webhook signature using the Svix library and the
 * CLERK_WEBHOOK_SECRET env var before processing any events.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Clerk webhook secret is not configured" },
      { status: 503 },
    );
  }

  // ── Verify Svix signature ──────────────────────────────────
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "Missing Svix headers" },
      { status: 400 },
    );
  }

  const body = await req.text();

  let payload: Record<string, unknown>;
  try {
    const wh = new Webhook(secret);
    payload = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as Record<string, unknown>;
  } catch {
    console.error("[clerk-webhook] Signature verification failed");
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 401 },
    );
  }

  // ── Process event ──────────────────────────────────────────
  const eventType = payload.type as string;
  const data = payload.data as Record<string, unknown>;

  const db = getDb();

  try {
    switch (eventType) {
      case "user.created":
      case "user.updated": {
        const clerkId = data.id as string;
        const emailAddresses = data.email_addresses as
          | Array<{ email_address: string }>
          | undefined;
        const email = emailAddresses?.[0]?.email_address ?? `${clerkId}@unknown`;
        const firstName = data.first_name as string | null;
        const lastName = data.last_name as string | null;
        const name = [firstName, lastName].filter(Boolean).join(" ") || null;

        await db
          .insert(users)
          .values({ clerkId, email, name, tier: "free" })
          .onConflictDoUpdate({
            target: users.clerkId,
            set: { email, name, updatedAt: new Date() },
          });
        break;
      }

      case "user.deleted": {
        const clerkId = data.id as string;
        if (clerkId) {
          await db.delete(users).where(eq(users.clerkId, clerkId));
        }
        break;
      }

      default:
        console.log(`[clerk-webhook] Unhandled event type: ${eventType}`);
    }

    return NextResponse.json(
      { received: true, type: eventType },
      { status: 200 },
    );
  } catch (error) {
    console.error("[clerk-webhook] Error processing event:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
