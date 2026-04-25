import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, ilike, or, asc } from "drizzle-orm";
import {
  GetCurrentUserResponse,
  UpdateCurrentUserBody,
  UpdateCurrentUserResponse,
  ListUsersQueryParams,
  ListUsersResponse,
  GetUserParams,
  GetUserResponse,
} from "@workspace/api-zod";
import { resolveCurrentUserId } from "../lib/current-user";

const router: IRouter = Router();

router.get("/users/me", async (req, res) => {
  const userId = await resolveCurrentUserId(req);
  const rows = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const u = rows[0];
  if (!u) return res.status(404).json({ error: "Current user not found" });
  res.json(GetCurrentUserResponse.parse({ ...u, createdAt: u.createdAt.toISOString() }));
});

router.patch("/users/me", async (req, res) => {
  const userId = await resolveCurrentUserId(req);
  const parsed = UpdateCurrentUserBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.bio !== undefined) updates.bio = parsed.data.bio;
  if (parsed.data.avatarUrl !== undefined) updates.avatarUrl = parsed.data.avatarUrl;
  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, userId))
    .returning();
  if (!updated) return res.status(404).json({ error: "User not found" });
  res.json(
    UpdateCurrentUserResponse.parse({ ...updated, createdAt: updated.createdAt.toISOString() }),
  );
});

router.get("/users", async (req, res) => {
  const parsed = ListUsersQueryParams.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const search = parsed.data.search?.trim();
  const rows = search
    ? await db
        .select()
        .from(usersTable)
        .where(or(ilike(usersTable.name, `%${search}%`), ilike(usersTable.email, `%${search}%`)))
        .orderBy(asc(usersTable.id))
    : await db.select().from(usersTable).orderBy(asc(usersTable.id));
  res.json(
    ListUsersResponse.parse(rows.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))),
  );
});

router.get("/users/:id", async (req, res) => {
  const parsed = GetUserParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const rows = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, parsed.data.id))
    .limit(1);
  const u = rows[0];
  if (!u) return res.status(404).json({ error: "User not found" });
  res.json(GetUserResponse.parse({ ...u, createdAt: u.createdAt.toISOString() }));
});

export default router;
