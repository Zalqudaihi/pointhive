import type { Request } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export class UnauthorizedError extends Error {
  readonly status = 401;
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export async function resolveCurrentUserId(req: Request): Promise<number> {
  // Header-based identity is a development-only shortcut. In production the
  // header MUST be ignored so an attacker cannot impersonate users by setting
  // it. A real auth provider (e.g. Clerk, OIDC) would replace this code.
  if (process.env.NODE_ENV === "production") {
    throw new UnauthorizedError(
      "Authentication is not configured for production. Connect a real auth provider before deploying.",
    );
  }
  const headerVal = req.header("x-user-id");
  if (!headerVal) {
    throw new UnauthorizedError("Missing x-user-id header");
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
