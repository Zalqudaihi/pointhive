import { Router, type IRouter } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import {
  ListNotificationsResponse,
  MarkNotificationReadParams,
  MarkNotificationReadResponse,
  MarkAllNotificationsReadResponse,
} from "@workspace/api-zod";
import { resolveCurrentUserId } from "../lib/current-user";

const router: IRouter = Router();

router.get("/notifications", async (req, res) => {
  const userId = await resolveCurrentUserId(req);
  const rows = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, userId))
    .orderBy(desc(notificationsTable.createdAt));
  return res.json(
    ListNotificationsResponse.parse(
      rows.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() })),
    ),
  );
});

router.patch("/notifications/:id/read", async (req, res) => {
  const userId = await resolveCurrentUserId(req);
  const parsed = MarkNotificationReadParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const [updated] = await db
    .update(notificationsTable)
    .set({ read: true })
    .where(
      and(eq(notificationsTable.id, parsed.data.id), eq(notificationsTable.userId, userId)),
    )
    .returning();
  if (!updated) return res.status(404).json({ error: "Notification not found" });
  return res.json(
    MarkNotificationReadResponse.parse({ ...updated, createdAt: updated.createdAt.toISOString() }),
  );
});

router.post("/notifications/mark-all-read", async (req, res) => {
  const userId = await resolveCurrentUserId(req);
  const updated = await db
    .update(notificationsTable)
    .set({ read: true })
    .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.read, false)))
    .returning({ id: notificationsTable.id });
  return res.json(MarkAllNotificationsReadResponse.parse({ updatedCount: updated.length }));
});

export default router;
