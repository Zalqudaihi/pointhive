import { Router, type IRouter } from "express";
import { db, transactionsTable, productsTable, usersTable, notificationsTable } from "@workspace/db";
import { eq, and, or, desc, type SQL, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import {
  ListTransactionsQueryParams,
  ListTransactionsResponse,
  GetTransactionParams,
  GetTransactionResponse,
  CreatePurchaseBody,
  CreateTransferBody,
} from "@workspace/api-zod";
import { resolveCurrentUserId } from "../lib/current-user";

const router: IRouter = Router();

const buyersTable = alias(usersTable, "buyers");
const sellersTable = alias(usersTable, "sellers");

function shape(row: {
  txn: typeof transactionsTable.$inferSelect;
  buyer: { id: number; name: string } | null;
  seller: { id: number; name: string } | null;
  product: { id: number; title: string; imageUrl: string | null } | null;
}) {
  const t = row.txn;
  return {
    id: t.id,
    type: t.type,
    buyerId: t.buyerId,
    buyerName: row.buyer?.name ?? null,
    sellerId: t.sellerId,
    sellerName: row.seller?.name ?? null,
    productId: t.productId,
    productTitle: row.product?.title ?? null,
    productImageUrl: row.product?.imageUrl ?? null,
    pointsAmount: t.pointsAmount,
    cashCents: t.cashCents,
    note: t.note,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
  };
}

router.get("/transactions", async (req, res) => {
  const userId = await resolveCurrentUserId(req);
  const parsed = ListTransactionsQueryParams.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const { type, limit } = parsed.data;
  const conditions: SQL[] = [
    or(eq(transactionsTable.buyerId, userId), eq(transactionsTable.sellerId, userId))!,
  ];
  if (type) conditions.push(eq(transactionsTable.type, type));
  let q = db
    .select({
      txn: transactionsTable,
      buyer: { id: buyersTable.id, name: buyersTable.name },
      seller: { id: sellersTable.id, name: sellersTable.name },
      product: { id: productsTable.id, title: productsTable.title, imageUrl: productsTable.imageUrl },
    })
    .from(transactionsTable)
    .leftJoin(buyersTable, eq(transactionsTable.buyerId, buyersTable.id))
    .leftJoin(sellersTable, eq(transactionsTable.sellerId, sellersTable.id))
    .leftJoin(productsTable, eq(transactionsTable.productId, productsTable.id))
    .where(and(...conditions))
    .orderBy(desc(transactionsTable.createdAt))
    .$dynamic();
  if (limit) q = q.limit(limit);
  const rows = await q;
  return res.json(ListTransactionsResponse.parse(rows.map(shape)));
});

router.get("/transactions/:id", async (req, res) => {
  const userId = await resolveCurrentUserId(req);
  const parsed = GetTransactionParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const rows = await db
    .select({
      txn: transactionsTable,
      buyer: { id: buyersTable.id, name: buyersTable.name },
      seller: { id: sellersTable.id, name: sellersTable.name },
      product: { id: productsTable.id, title: productsTable.title, imageUrl: productsTable.imageUrl },
    })
    .from(transactionsTable)
    .leftJoin(buyersTable, eq(transactionsTable.buyerId, buyersTable.id))
    .leftJoin(sellersTable, eq(transactionsTable.sellerId, sellersTable.id))
    .leftJoin(productsTable, eq(transactionsTable.productId, productsTable.id))
    .where(eq(transactionsTable.id, parsed.data.id))
    .limit(1);
  const r = rows[0];
  if (!r) return res.status(404).json({ error: "Transaction not found" });
  if (r.txn.buyerId !== userId && r.txn.sellerId !== userId) {
    return res.status(404).json({ error: "Transaction not found" });
  }
  return res.json(GetTransactionResponse.parse(shape(r)));
});

router.post("/transactions/purchase", async (req, res) => {
  const userId = await resolveCurrentUserId(req);
  const parsed = CreatePurchaseBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const { productId } = parsed.data;

  try {
    const result = await db.transaction(async (tx) => {
      const [product] = await tx
        .select()
        .from(productsTable)
        .where(eq(productsTable.id, productId))
        .limit(1);
      if (!product) throw new Error("Product not found");
      if (product.status !== "active") throw new Error("Product is not available");
      if (product.stock <= 0) throw new Error("Product is out of stock");
      if (product.sellerId === userId) throw new Error("You cannot buy your own listing");

      const [buyer] = await tx
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);
      if (!buyer) throw new Error("Buyer not found");
      if (buyer.pointsBalance < product.pointPrice) {
        throw new Error("Insufficient points");
      }

      await tx
        .update(usersTable)
        .set({ pointsBalance: buyer.pointsBalance - product.pointPrice })
        .where(eq(usersTable.id, userId));

      await tx
        .update(usersTable)
        .set({ pointsBalance: sql`${usersTable.pointsBalance} + ${product.pointPrice}` })
        .where(eq(usersTable.id, product.sellerId));

      const newStock = product.stock - 1;
      await tx
        .update(productsTable)
        .set({ stock: newStock, status: newStock <= 0 ? "sold" : "active" })
        .where(eq(productsTable.id, product.id));

      const [created] = await tx
        .insert(transactionsTable)
        .values({
          type: "purchase",
          buyerId: userId,
          sellerId: product.sellerId,
          productId: product.id,
          pointsAmount: product.pointPrice,
          cashCents: product.cashPriceCents ?? null,
          status: "completed",
        })
        .returning();
      if (!created) throw new Error("Failed to record transaction");

      await tx.insert(notificationsTable).values([
        {
          userId: product.sellerId,
          type: "purchase",
          title: "You sold an item",
          body: `${buyer.name} purchased "${product.title}" for ${product.pointPrice} points.`,
          read: false,
        },
        {
          userId,
          type: "purchase",
          title: "Purchase confirmed",
          body: `You bought "${product.title}" for ${product.pointPrice} points.`,
          read: false,
        },
      ]);

      return { created, product };
    });

    const [seller] = await db
      .select({ id: usersTable.id, name: usersTable.name })
      .from(usersTable)
      .where(eq(usersTable.id, result.product.sellerId))
      .limit(1);
    const [buyerRow] = await db
      .select({ id: usersTable.id, name: usersTable.name })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    return res.status(201).json(
      shape({
        txn: result.created,
        buyer: buyerRow ?? null,
        seller: seller ?? null,
        product: {
          id: result.product.id,
          title: result.product.title,
          imageUrl: result.product.imageUrl,
        },
      }),
    );
  } catch (err) {
    return res.status(400).json({ error: err instanceof Error ? err.message : "Purchase failed" });
  }
});

router.post("/transactions/transfer", async (req, res) => {
  const userId = await resolveCurrentUserId(req);
  const parsed = CreateTransferBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const { recipientId, pointsAmount, note } = parsed.data;

  try {
    if (recipientId === userId) throw new Error("You cannot transfer points to yourself");
    if (pointsAmount <= 0) throw new Error("Amount must be greater than zero");

    const result = await db.transaction(async (tx) => {
      const [sender] = await tx
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);
      if (!sender) throw new Error("Sender not found");
      const [recipient] = await tx
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, recipientId))
        .limit(1);
      if (!recipient) throw new Error("Recipient not found");
      if (sender.pointsBalance < pointsAmount) throw new Error("Insufficient points");

      await tx
        .update(usersTable)
        .set({ pointsBalance: sender.pointsBalance - pointsAmount })
        .where(eq(usersTable.id, userId));
      await tx
        .update(usersTable)
        .set({ pointsBalance: sql`${usersTable.pointsBalance} + ${pointsAmount}` })
        .where(eq(usersTable.id, recipientId));

      const [created] = await tx
        .insert(transactionsTable)
        .values({
          type: "transfer",
          buyerId: recipientId,
          sellerId: userId,
          pointsAmount,
          note: note ?? null,
          status: "completed",
        })
        .returning();
      if (!created) throw new Error("Failed to record transfer");

      await tx.insert(notificationsTable).values([
        {
          userId: recipientId,
          type: "transfer",
          title: "Points received",
          body: `${sender.name} sent you ${pointsAmount} points${note ? `: ${note}` : "."}`,
          read: false,
        },
        {
          userId,
          type: "transfer",
          title: "Transfer sent",
          body: `You sent ${pointsAmount} points to ${recipient.name}.`,
          read: false,
        },
      ]);

      return { created, sender, recipient };
    });

    return res.status(201).json(
      shape({
        txn: result.created,
        buyer: { id: result.recipient.id, name: result.recipient.name },
        seller: { id: result.sender.id, name: result.sender.name },
        product: null,
      }),
    );
  } catch (err) {
    return res.status(400).json({ error: err instanceof Error ? err.message : "Transfer failed" });
  }
});

export default router;
