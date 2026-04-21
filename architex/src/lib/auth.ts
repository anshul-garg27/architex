/**
 * DB-010: Clerk auth helpers
 *
 * Server-side authentication utilities wrapping @clerk/nextjs.
 */

import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";

/**
 * Dev-mode fallback: when NODE_ENV is development and no Clerk session is
 * present, pretend to be this stable fake user. Lets the app be usable
 * end-to-end without running the Clerk sign-in flow locally. Production is
 * unaffected — this branch is gated on NODE_ENV.
 */
const DEV_CLERK_ID = "dev-user-local";

function isDevEnv(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * Require authentication. Throws "Unauthorized" if no session exists.
 * In dev mode without a Clerk session, returns a synthetic user ID so the
 * full app flow works locally without auth setup.
 * @returns The Clerk user ID (string).
 */
export async function requireAuth(): Promise<string> {
  const { userId } = await auth();
  if (userId) return userId;
  if (isDevEnv()) return DEV_CLERK_ID;
  throw new Error("Unauthorized");
}

/**
 * Get the currently authenticated Clerk user, or null if not authenticated.
 */
export async function getAuthUser() {
  const user = await currentUser();
  return user;
}

/**
 * Resolve a Clerk user ID to an internal database user UUID.
 *
 * If the user does not exist in the database yet (first request after sign-up
 * before the webhook fires), this function creates a minimal record.
 *
 * @returns The internal user UUID, or null if clerkId is invalid.
 */
export async function resolveUserId(
  clerkId: string,
): Promise<string | null> {
  const db = getDb();

  // Try to find existing user.
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (existing) {
    return existing.id;
  }

  // Dev-mode synthetic user — no Clerk session, so skip currentUser() and
  // seed a plausible record directly. This keeps local dev unblocked when
  // Clerk isn't signed in.
  if (clerkId === DEV_CLERK_ID && isDevEnv()) {
    const [created] = await db
      .insert(users)
      .values({
        clerkId: DEV_CLERK_ID,
        email: "dev@localhost",
        name: "Local Dev",
        tier: "free",
      })
      .returning({ id: users.id });
    return created?.id ?? null;
  }

  // User not in DB yet — create a minimal record.
  // The Clerk webhook will fill in the remaining fields later.
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  // Clerk's User type can vary across versions — safely extract fields.
  const emailAddresses = clerkUser.emailAddresses as
    | Array<{ emailAddress: string }>
    | undefined;
  const email = emailAddresses?.[0]?.emailAddress ?? `${clerkId}@unknown`;
  const firstName = (clerkUser as Record<string, unknown>).firstName as
    | string
    | null;
  const lastName = (clerkUser as Record<string, unknown>).lastName as
    | string
    | null;

  const [created] = await db
    .insert(users)
    .values({
      clerkId,
      email,
      name: [firstName, lastName].filter(Boolean).join(" ") || null,
      tier: "free",
    })
    .returning({ id: users.id });

  return created?.id ?? null;
}

/**
 * Get the subscription tier for the current user.
 * Falls back to 'free' if the user is not found.
 */
export async function getUserTier(clerkId: string): Promise<string> {
  const db = getDb();
  const [row] = await db
    .select({ tier: users.tier })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  return row?.tier ?? "free";
}
