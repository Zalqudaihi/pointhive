import { Router, type IRouter } from "express";
import { db, productsTable, usersTable } from "@workspace/db";
import { eq, and, ilike, sql, desc, type SQL } from "drizzle-orm";
import {
  ListProductsQueryParams,
  ListProductsResponse,
  CreateProductBody,
  GetProductParams,
  GetProductResponse,
  UpdateProductParams,
  UpdateProductBody,
  UpdateProductResponse,
  DeleteProductParams,
  ListProductCategoriesResponse,
} from "@workspace/api-zod";
import { resolveCurrentUserId } from "../lib/current-user";

const router: IRouter = Router();

function shape(row: {
  product: typeof productsTable.$inferSelect;
  seller: { id: number; name: string; avatarUrl: string | null } | null;
}) {
  const p = row.product;
  return {
    id: p.id,
    sellerId: p.sellerId,
    sellerName: row.seller?.name ?? "Unknown",
    sellerAvatarUrl: row.seller?.avatarUrl ?? null,
    title: p.title,
    description: p.description,
    imageUrl: p.imageUrl,
    category: p.category,
    type: p.type,
    pointPrice: p.pointPrice,
    cashPriceCents: p.cashPriceCents,
    stock: p.stock,
    status: p.status,
    couponCode: p.couponCode,
    couponDiscountPct: p.couponDiscountPct,
    couponExpiresAt: p.couponExpiresAt ? p.couponExpiresAt.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/products", async (req, res) => {
  const parsed = ListProductsQueryParams.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const { type, category, search, sellerId, status } = parsed.data;
  const conditions: SQL[] = [];
  if (type) conditions.push(eq(productsTable.type, type));
  if (category) conditions.push(eq(productsTable.category, category));
  if (sellerId) conditions.push(eq(productsTable.sellerId, sellerId));
  if (status) conditions.push(eq(productsTable.status, status));
  if (search) {
    conditions.push(
      sql`(${productsTable.title} ILIKE ${"%" + search + "%"} OR ${productsTable.description} ILIKE ${"%" + search + "%"})`,
    );
  }
  const rows = await db
    .select({
      product: productsTable,
      seller: { id: usersTable.id, name: usersTable.name, avatarUrl: usersTable.avatarUrl },
    })
    .from(productsTable)
    .leftJoin(usersTable, eq(productsTable.sellerId, usersTable.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(productsTable.createdAt));
  return res.json(ListProductsResponse.parse(rows.map(shape)));
});

router.post("/products", async (req, res) => {
  const userId = await resolveCurrentUserId(req);
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const data = parsed.data;
  const [created] = await db
    .insert(productsTable)
    .values({
      sellerId: userId,
      title: data.title,
      description: data.description,
      imageUrl: data.imageUrl ?? null,
      category: data.category,
      type: data.type,
      pointPrice: data.pointPrice,
      cashPriceCents: data.cashPriceCents ?? null,
      stock: data.stock,
      couponCode: data.couponCode ?? null,
      couponDiscountPct: data.couponDiscountPct ?? null,
      couponExpiresAt: data.couponExpiresAt ? new Date(data.couponExpiresAt) : null,
      status: "active",
    })
    .returning();
  if (!created) return res.status(500).json({ error: "Failed to create" });
  const sellerRows = await db
    .select({ id: usersTable.id, name: usersTable.name, avatarUrl: usersTable.avatarUrl })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  return res.status(201).json(shape({ product: created, seller: sellerRows[0] ?? null }));
});

router.get("/products/categories", async (_req, res) => {
  const rows = await db
    .select({ category: productsTable.category, count: sql<number>`count(*)::int` })
    .from(productsTable)
    .groupBy(productsTable.category);
  return res.json(ListProductCategoriesResponse.parse(rows.map((r) => ({ category: r.category, count: Number(r.count) }))));
});

router.get("/products/:id", async (req, res) => {
  const parsed = GetProductParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const rows = await db
    .select({
      product: productsTable,
      seller: { id: usersTable.id, name: usersTable.name, avatarUrl: usersTable.avatarUrl },
    })
    .from(productsTable)
    .leftJoin(usersTable, eq(productsTable.sellerId, usersTable.id))
    .where(eq(productsTable.id, parsed.data.id))
    .limit(1);
  const r = rows[0];
  if (!r) return res.status(404).json({ error: "Product not found" });
  return res.json(GetProductResponse.parse(shape(r)));
});

router.patch("/products/:id", async (req, res) => {
  const userId = await resolveCurrentUserId(req);
  const paramsParsed = UpdateProductParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) return res.status(400).json({ error: paramsParsed.error.message });
  const bodyParsed = UpdateProductBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: bodyParsed.error.message });
  const existing = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, paramsParsed.data.id))
    .limit(1);
  if (!existing[0]) return res.status(404).json({ error: "Product not found" });
  if (existing[0].sellerId !== userId) {
    return res.status(403).json({ error: "Cannot edit another user's listing" });
  }
  const updates: Record<string, unknown> = {};
  const b = bodyParsed.data;
  if (b.title !== undefined) updates.title = b.title;
  if (b.description !== undefined) updates.description = b.description;
  if (b.imageUrl !== undefined) updates.imageUrl = b.imageUrl;
  if (b.category !== undefined) updates.category = b.category;
  if (b.pointPrice !== undefined) updates.pointPrice = b.pointPrice;
  if (b.cashPriceCents !== undefined) updates.cashPriceCents = b.cashPriceCents;
  if (b.stock !== undefined) updates.stock = b.stock;
  if (b.status !== undefined) updates.status = b.status;
  const [updated] = await db
    .update(productsTable)
    .set(updates)
    .where(eq(productsTable.id, paramsParsed.data.id))
    .returning();
  if (!updated) return res.status(404).json({ error: "Product not found" });
  const sellerRows = await db
    .select({ id: usersTable.id, name: usersTable.name, avatarUrl: usersTable.avatarUrl })
    .from(usersTable)
    .where(eq(usersTable.id, updated.sellerId))
    .limit(1);
  return res.json(UpdateProductResponse.parse(shape({ product: updated, seller: sellerRows[0] ?? null })));
});

router.delete("/products/:id", async (req, res) => {
  const userId = await resolveCurrentUserId(req);
  const parsed = DeleteProductParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const existing = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, parsed.data.id))
    .limit(1);
  if (!existing[0]) return res.status(404).json({ error: "Product not found" });
  if (existing[0].sellerId !== userId) {
    return res.status(403).json({ error: "Cannot delete another user's listing" });
  }
  await db.delete(productsTable).where(eq(productsTable.id, parsed.data.id));
  return res.status(204).send();
});

export default router;
