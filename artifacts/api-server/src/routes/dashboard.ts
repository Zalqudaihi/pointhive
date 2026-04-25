import { Router, type IRouter } from "express";
import {
  db,
  usersTable,
  productsTable,
  transactionsTable,
  notificationsTable,
} from "@workspace/db";
import { eq, and, or, gte, desc, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import {
  GetDashboardSummaryResponse,
  GetDashboardActivityResponse,
  GetTrendingProductsResponse,
} from "@workspace/api-zod";
import { resolveCurrentUserId } from "../lib/current-user";

const router: IRouter = Router();

const buyersTable = alias(usersTable, "buyers");
const sellersTable = alias(usersTable, "sellers");

router.get("/dashboard/summary", async (req, res) => {
  const userId = await resolveCurrentUserId(req);
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [user] = await db
    .select({ pointsBalance: usersTable.pointsBalance })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  if (!user) return res.status(404).json({ error: "User not found" });

  const [earnedRow] = await db
    .select({ total: sql<number>`COALESCE(SUM(${transactionsTable.pointsAmount}), 0)::int` })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.sellerId, userId),
        gte(transactionsTable.createdAt, cutoff),
        eq(transactionsTable.status, "completed"),
      ),
    );
  const [spentRow] = await db
    .select({ total: sql<number>`COALESCE(SUM(${transactionsTable.pointsAmount}), 0)::int` })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.buyerId, userId),
        gte(transactionsTable.createdAt, cutoff),
        eq(transactionsTable.status, "completed"),
      ),
    );

  const [activeRow] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(productsTable)
    .where(and(eq(productsTable.sellerId, userId), eq(productsTable.status, "active")));

  const [completedRow] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.buyerId, userId),
        eq(transactionsTable.type, "purchase"),
        eq(transactionsTable.status, "completed"),
      ),
    );

  const [couponRow] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(transactionsTable)
    .leftJoin(productsTable, eq(transactionsTable.productId, productsTable.id))
    .where(
      and(
        eq(transactionsTable.buyerId, userId),
        eq(productsTable.type, "coupon"),
        eq(transactionsTable.status, "completed"),
      ),
    );

  const [unreadRow] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(notificationsTable)
    .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.read, false)));

  return res.json(
    GetDashboardSummaryResponse.parse({
      pointsBalance: user.pointsBalance,
      pointsEarned30d: Number(earnedRow?.total ?? 0),
      pointsSpent30d: Number(spentRow?.total ?? 0),
      activeListings: Number(activeRow?.count ?? 0),
      completedPurchases: Number(completedRow?.count ?? 0),
      couponsOwned: Number(couponRow?.count ?? 0),
      unreadNotifications: Number(unreadRow?.count ?? 0),
    }),
  );
});

router.get("/dashboard/activity", async (req, res) => {
  const userId = await resolveCurrentUserId(req);
  const txns = await db
    .select({
      id: transactionsTable.id,
      type: transactionsTable.type,
      pointsAmount: transactionsTable.pointsAmount,
      createdAt: transactionsTable.createdAt,
      buyerId: transactionsTable.buyerId,
      sellerId: transactionsTable.sellerId,
      buyerName: buyersTable.name,
      buyerAvatarUrl: buyersTable.avatarUrl,
      sellerName: sellersTable.name,
      sellerAvatarUrl: sellersTable.avatarUrl,
      productTitle: productsTable.title,
    })
    .from(transactionsTable)
    .leftJoin(buyersTable, eq(transactionsTable.buyerId, buyersTable.id))
    .leftJoin(sellersTable, eq(transactionsTable.sellerId, sellersTable.id))
    .leftJoin(productsTable, eq(transactionsTable.productId, productsTable.id))
    .where(or(eq(transactionsTable.buyerId, userId), eq(transactionsTable.sellerId, userId)))
    .orderBy(desc(transactionsTable.createdAt))
    .limit(20);

  const items = txns.map((t) => {
    const isBuyer = t.buyerId === userId;
    let title = "";
    let subtitle = "";
    let actorName: string | null = null;
    let actorAvatarUrl: string | null = null;
    if (t.type === "purchase") {
      if (isBuyer) {
        title = `You bought "${t.productTitle ?? "an item"}"`;
        subtitle = `from ${t.sellerName ?? "a seller"}`;
        actorName = t.sellerName;
        actorAvatarUrl = t.sellerAvatarUrl;
      } else {
        title = `You sold "${t.productTitle ?? "an item"}"`;
        subtitle = `to ${t.buyerName ?? "a buyer"}`;
        actorName = t.buyerName;
        actorAvatarUrl = t.buyerAvatarUrl;
      }
    } else if (t.type === "transfer") {
      if (isBuyer) {
        title = `You received points`;
        subtitle = `from ${t.sellerName ?? "a friend"}`;
        actorName = t.sellerName;
        actorAvatarUrl = t.sellerAvatarUrl;
      } else {
        title = `You sent points`;
        subtitle = `to ${t.buyerName ?? "a friend"}`;
        actorName = t.buyerName;
        actorAvatarUrl = t.buyerAvatarUrl;
      }
    } else {
      title = `Exchange`;
      subtitle = `${t.pointsAmount} points`;
    }
    return {
      id: t.id,
      type: t.type,
      title,
      subtitle,
      pointsAmount: t.pointsAmount,
      actorName,
      actorAvatarUrl,
      createdAt: t.createdAt.toISOString(),
    };
  });

  return res.json(GetDashboardActivityResponse.parse(items));
});

router.get("/dashboard/trending", async (req, res) => {
  await resolveCurrentUserId(req);
  const trending = await db
    .select({
      product: productsTable,
      seller: { id: usersTable.id, name: usersTable.name, avatarUrl: usersTable.avatarUrl },
      sales: sql<number>`COUNT(${transactionsTable.id})::int`,
    })
    .from(productsTable)
    .leftJoin(usersTable, eq(productsTable.sellerId, usersTable.id))
    .leftJoin(
      transactionsTable,
      and(
        eq(transactionsTable.productId, productsTable.id),
        eq(transactionsTable.status, "completed"),
      ),
    )
    .where(eq(productsTable.status, "active"))
    .groupBy(productsTable.id, usersTable.id, usersTable.name, usersTable.avatarUrl)
    .orderBy(desc(sql`COUNT(${transactionsTable.id})`), desc(productsTable.createdAt))
    .limit(8);

  // Fallback if no sales yet — show newest active listings
  let rows = trending;
  if (!rows.some((r) => Number(r.sales) > 0)) {
    rows = await db
      .select({
        product: productsTable,
        seller: { id: usersTable.id, name: usersTable.name, avatarUrl: usersTable.avatarUrl },
        sales: sql<number>`0::int`,
      })
      .from(productsTable)
      .leftJoin(usersTable, eq(productsTable.sellerId, usersTable.id))
      .where(eq(productsTable.status, "active"))
      .orderBy(desc(productsTable.createdAt))
      .limit(8);
  }

  return res.json(
    GetTrendingProductsResponse.parse(
      rows.map((r) => ({
        id: r.product.id,
        sellerId: r.product.sellerId,
        sellerName: r.seller?.name ?? "Unknown",
        sellerAvatarUrl: r.seller?.avatarUrl ?? null,
        title: r.product.title,
        description: r.product.description,
        imageUrl: r.product.imageUrl,
        category: r.product.category,
        type: r.product.type,
        pointPrice: r.product.pointPrice,
        cashPriceCents: r.product.cashPriceCents,
        stock: r.product.stock,
        status: r.product.status,
        couponCode: r.product.couponCode,
        couponDiscountPct: r.product.couponDiscountPct,
        couponExpiresAt: r.product.couponExpiresAt
          ? r.product.couponExpiresAt.toISOString()
          : null,
        createdAt: r.product.createdAt.toISOString(),
      })),
    ),
  );
});

export default router;
