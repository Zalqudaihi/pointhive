import { Router, type IRouter } from "express";
import { db, pointVouchersTable, usersTable, notificationsTable } from "@workspace/db";
import { eq, or, and, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import {
  CreateVoucherBody,
  RedeemVoucherBody,
  TransferVoucherParams,
  TransferVoucherBody,
} from "@workspace/api-zod";
import { resolveCurrentUserId } from "../lib/current-user";

const router: IRouter = Router();

const issuersTable = alias(usersTable, "issuers");
const holdersTable = alias(usersTable, "holders");

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const parts = [4, 4, 4].map(() =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join(""),
  );
  return `PH-${parts.join("-")}`;
}

function shapeVoucher(row: {
  v: typeof pointVouchersTable.$inferSelect;
  issuerName: string | null;
  holderName: string | null;
}) {
  return {
    id: row.v.id,
    code: row.v.code,
    issuerUserId: row.v.issuerUserId,
    issuerName: row.issuerName ?? "",
    holderUserId: row.v.holderUserId ?? null,
    holderName: row.holderName ?? null,
    pointsValue: row.v.pointsValue,
    note: row.v.note ?? null,
    status: row.v.status,
    expiresAt: row.v.expiresAt?.toISOString() ?? null,
    redeemedAt: row.v.redeemedAt?.toISOString() ?? null,
    createdAt: row.v.createdAt.toISOString(),
  };
}

router.get("/vouchers", async (req, res) => {
  const userId = await resolveCurrentUserId(req);

  const rows = await db
    .select({
      v: pointVouchersTable,
      issuerName: issuersTable.name,
      holderName: holdersTable.name,
    })
    .from(pointVouchersTable)
    .leftJoin(issuersTable, eq(pointVouchersTable.issuerUserId, issuersTable.id))
    .leftJoin(holdersTable, eq(pointVouchersTable.holderUserId, holdersTable.id))
    .where(
      or(
        eq(pointVouchersTable.issuerUserId, userId),
        eq(pointVouchersTable.holderUserId, userId),
      ),
    )
    .orderBy(sql`${pointVouchersTable.createdAt} desc`);

  return res.json(rows.map(shapeVoucher));
});

router.post("/vouchers", async (req, res) => {
  const userId = await resolveCurrentUserId(req);
  const parsed = CreateVoucherBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  const { pointsValue, note, expiresAt } = parsed.data;

  if (pointsValue < 1) return res.status(400).json({ error: "Points value must be at least 1" });

  try {
    const result = await db.transaction(async (tx) => {
      const [user] = await tx
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);
      if (!user) throw new Error("User not found");
      if (!user.phone) throw new Error("Phone number required to create vouchers");
      if (user.pointsBalance < pointsValue) throw new Error("Insufficient points");

      await tx
        .update(usersTable)
        .set({ pointsBalance: user.pointsBalance - pointsValue })
        .where(eq(usersTable.id, userId));

      let code = generateCode();
      let attempts = 0;
      while (attempts < 5) {
        const existing = await tx
          .select({ id: pointVouchersTable.id })
          .from(pointVouchersTable)
          .where(eq(pointVouchersTable.code, code))
          .limit(1);
        if (!existing.length) break;
        code = generateCode();
        attempts++;
      }

      const [created] = await tx
        .insert(pointVouchersTable)
        .values({
          code,
          issuerUserId: userId,
          holderUserId: userId,
          pointsValue,
          note: note ?? null,
          status: "active",
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        })
        .returning();

      return { created, user };
    });

    return res.status(201).json(
      shapeVoucher({
        v: result.created,
        issuerName: result.user.name,
        holderName: result.user.name,
      }),
    );
  } catch (err) {
    return res.status(400).json({ error: err instanceof Error ? err.message : "Failed to create voucher" });
  }
});

router.post("/vouchers/redeem", async (req, res) => {
  const userId = await resolveCurrentUserId(req);
  const parsed = RedeemVoucherBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  const { code } = parsed.data;

  try {
    const result = await db.transaction(async (tx) => {
      const [voucher] = await tx
        .select()
        .from(pointVouchersTable)
        .where(eq(pointVouchersTable.code, code.toUpperCase()))
        .limit(1);

      if (!voucher) throw new Error("Voucher not found");
      if (voucher.status !== "active") throw new Error(`Voucher is already ${voucher.status}`);
      if (voucher.holderUserId !== userId && voucher.issuerUserId !== userId) {
        throw new Error("This voucher does not belong to you");
      }
      if (voucher.issuerUserId === userId && voucher.holderUserId === userId) {
        // Self-redemption only allowed if they are both issuer and holder
      }
      if (voucher.expiresAt && new Date(voucher.expiresAt) < new Date()) {
        throw new Error("Voucher has expired");
      }

      const [redeemer] = await tx
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);
      if (!redeemer) throw new Error("User not found");

      await tx
        .update(usersTable)
        .set({ pointsBalance: sql`${usersTable.pointsBalance} + ${voucher.pointsValue}` })
        .where(eq(usersTable.id, userId));

      const [updated] = await tx
        .update(pointVouchersTable)
        .set({ status: "redeemed", redeemedAt: new Date() })
        .where(eq(pointVouchersTable.id, voucher.id))
        .returning();

      await tx.insert(notificationsTable).values({
        userId,
        type: "system",
        title: "Voucher redeemed",
        body: `You redeemed voucher ${voucher.code} for ${voucher.pointsValue} points.`,
        read: false,
      });

      const [issuer] = await tx
        .select({ name: usersTable.name })
        .from(usersTable)
        .where(eq(usersTable.id, voucher.issuerUserId))
        .limit(1);

      return { updated, issuerName: issuer?.name ?? "", redeemerName: redeemer.name };
    });

    return res.json(
      shapeVoucher({
        v: result.updated,
        issuerName: result.issuerName,
        holderName: result.redeemerName,
      }),
    );
  } catch (err) {
    return res.status(400).json({ error: err instanceof Error ? err.message : "Failed to redeem voucher" });
  }
});

router.post("/vouchers/:id/transfer", async (req, res) => {
  const userId = await resolveCurrentUserId(req);
  const paramsParsed = TransferVoucherParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) return res.status(400).json({ error: paramsParsed.error.message });

  const bodyParsed = TransferVoucherBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: bodyParsed.error.message });

  const { recipientId } = bodyParsed.data;

  try {
    const result = await db.transaction(async (tx) => {
      const [voucher] = await tx
        .select()
        .from(pointVouchersTable)
        .where(and(eq(pointVouchersTable.id, paramsParsed.data.id), eq(pointVouchersTable.holderUserId, userId)))
        .limit(1);

      if (!voucher) throw new Error("Voucher not found or you are not the current holder");
      if (voucher.status !== "active") throw new Error(`Voucher is already ${voucher.status}`);
      if (recipientId === userId) throw new Error("You cannot transfer a voucher to yourself");

      const [recipient] = await tx
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, recipientId))
        .limit(1);
      if (!recipient) throw new Error("Recipient not found");

      const [sender] = await tx
        .select({ name: usersTable.name })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);

      const [updated] = await tx
        .update(pointVouchersTable)
        .set({ holderUserId: recipientId, status: "active" })
        .where(eq(pointVouchersTable.id, voucher.id))
        .returning();

      const [issuer] = await tx
        .select({ name: usersTable.name })
        .from(usersTable)
        .where(eq(usersTable.id, voucher.issuerUserId))
        .limit(1);

      await tx.insert(notificationsTable).values([
        {
          userId: recipientId,
          type: "transfer",
          title: "Voucher received",
          body: `${sender?.name ?? "Someone"} sent you a voucher worth ${voucher.pointsValue} points. Code: ${voucher.code}`,
          read: false,
        },
        {
          userId,
          type: "transfer",
          title: "Voucher transferred",
          body: `You transferred voucher ${voucher.code} to ${recipient.name}.`,
          read: false,
        },
      ]);

      return { updated, issuerName: issuer?.name ?? "", holderName: recipient.name };
    });

    return res.json(
      shapeVoucher({
        v: result.updated,
        issuerName: result.issuerName,
        holderName: result.holderName,
      }),
    );
  } catch (err) {
    return res.status(400).json({ error: err instanceof Error ? err.message : "Failed to transfer voucher" });
  }
});

export default router;
