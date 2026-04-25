import type { Request } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";

export async function resolveCurrentUserId(req: Request): Promise<number> {
  const headerVal = req.header("x-user-id");
  if (headerVal) {
    const parsed = Number.parseInt(headerVal, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      const found = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.id, parsed))
        .limit(1);
      if (found[0]) return found[0].id;
    }
  }

  const fallback = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .orderBy(asc(usersTable.id))
    .limit(1);

  if (!fallback[0]) {
    throw new Error("No users available in the system.");
  }
  return fallback[0].id;
}
