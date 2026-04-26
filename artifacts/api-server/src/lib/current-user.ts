import type { Request } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export class UnauthorizedError extends Error {
  readonly status = 401;
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

async function resolveCurrentUserIdFromClerk(req: Request): Promise<number> {
  const auth = getAuth(req);
  const clerkUserId = auth?.userId;
  if (!clerkUserId) {
    throw new UnauthorizedError("Not authenticated");
  }

  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkUserId))
    .limit(1);

  if (existing[0]) {
    return existing[0].id;
  }

  const clerkUser = await clerkClient.users.getUser(clerkUserId);
  const primaryEmail = clerkUser.emailAddresses.find(
    (e) => e.id === clerkUser.primaryEmailAddressId,
  )?.emailAddress;

  if (!primaryEmail) {
    throw new UnauthorizedError("Clerk user has no email address");
  }

  const byEmail = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, primaryEmail))
    .limit(1);

  if (byEmail[0]) {
    await db
      .update(usersTable)
      .set({ clerkId: clerkUserId })
      .where(eq(usersTable.id, byEmail[0].id));
    return byEmail[0].id;
  }

  const displayName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    primaryEmail.split("@")[0];

  const [newUser] = await db
    .insert(usersTable)
    .values({
      clerkId: clerkUserId,
      email: primaryEmail,
      name: displayName,
    })
    .returning({ id: usersTable.id });

  return newUser.id;
}

export async function resolveCurrentUserId(req: Request): Promise<number> {
  if (process.env.NODE_ENV === "production") {
    return resolveCurrentUserIdFromClerk(req);
  }

  const auth = getAuth(req);
  if (auth?.userId) {
    return resolveCurrentUserIdFromClerk(req);
  }

  const headerVal = req.header("x-user-id");
  if (!headerVal) {
    throw new UnauthorizedError("Missing x-user-id header (dev only)");
  }
  const parsed = Number.parseInt(headerVal, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new UnauthorizedError("Invalid x-user-id header");
  }
  const found = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.id, parsed))
    .limit(1);
  if (!found[0]) {
    throw new UnauthorizedError("Unknown user");
  }
  return found[0].id;
}
