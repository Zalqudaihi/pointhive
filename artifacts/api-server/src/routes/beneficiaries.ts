import { Router, type IRouter } from "express";
import { db, beneficiariesTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  AddBeneficiaryBody,
  RemoveBeneficiaryParams,
} from "@workspace/api-zod";
import { resolveCurrentUserId } from "../lib/current-user";

const router: IRouter = Router();

router.get("/beneficiaries", async (req, res) => {
  const userId = await resolveCurrentUserId(req);

  const rows = await db
    .select({
      id: beneficiariesTable.id,
      userId: beneficiariesTable.userId,
      beneficiaryId: beneficiariesTable.beneficiaryId,
      nickname: beneficiariesTable.nickname,
      createdAt: beneficiariesTable.createdAt,
      beneficiaryName: usersTable.name,
      beneficiaryPhone: usersTable.phone,
      beneficiaryAvatarUrl: usersTable.avatarUrl,
    })
    .from(beneficiariesTable)
    .leftJoin(usersTable, eq(beneficiariesTable.beneficiaryId, usersTable.id))
    .where(eq(beneficiariesTable.userId, userId))
    .orderBy(beneficiariesTable.createdAt);

  return res.json(
    rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      beneficiaryId: r.beneficiaryId,
      beneficiaryName: r.beneficiaryName ?? "",
      beneficiaryPhone: r.beneficiaryPhone ?? null,
      beneficiaryAvatarUrl: r.beneficiaryAvatarUrl ?? null,
      nickname: r.nickname ?? null,
      createdAt: r.createdAt.toISOString(),
    })),
  );
});

router.post("/beneficiaries", async (req, res) => {
  const userId = await resolveCurrentUserId(req);
  const parsed = AddBeneficiaryBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  const { beneficiaryId, nickname } = parsed.data;

  if (beneficiaryId === userId) {
    return res.status(400).json({ error: "You cannot add yourself as a beneficiary" });
  }

  const [target] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, beneficiaryId))
    .limit(1);
  if (!target) return res.status(400).json({ error: "User not found" });

  try {
    const [created] = await db
      .insert(beneficiariesTable)
      .values({ userId, beneficiaryId, nickname: nickname ?? null })
      .returning();

    if (!created) return res.status(500).json({ error: "Failed to add beneficiary" });

    return res.status(201).json({
      id: created.id,
      userId: created.userId,
      beneficiaryId: created.beneficiaryId,
      beneficiaryName: target.name,
      beneficiaryPhone: target.phone ?? null,
      beneficiaryAvatarUrl: target.avatarUrl ?? null,
      nickname: created.nickname ?? null,
      createdAt: created.createdAt.toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to add beneficiary";
    if (msg.includes("unique")) {
      return res.status(400).json({ error: "Already in your friends list" });
    }
    return res.status(400).json({ error: msg });
  }
});

router.delete("/beneficiaries/:id", async (req, res) => {
  const userId = await resolveCurrentUserId(req);
  const parsed = RemoveBeneficiaryParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  const deleted = await db
    .delete(beneficiariesTable)
    .where(and(eq(beneficiariesTable.id, parsed.data.id), eq(beneficiariesTable.userId, userId)))
    .returning();

  if (!deleted.length) return res.status(404).json({ error: "Not found" });

  return res.status(204).send();
});

export default router;
