import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { db, usersTable, productsTable, transactionsTable } from "@workspace/db";
import { eq, and, gte, desc, sql, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import {
  GetAdminOverviewResponse,
  GetAdminRecentActivityResponse,
  GetTopSellersResponse,
} from "@workspace/api-zod";
import { resolveCurrentUserId } from "../lib/current-user";

const router: IRouter = Router();

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = await resolveCurrentUserId(req);
    const rows = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    const u = rows[0];
    if (!u) return res.status(401).json({ error: "Unauthorized" });
    if (u.role !== "admin") return res.status(403).json({ error: "Admin access required" });
    next();
  } catch (e) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

router.use(requireAdmin);

const buyersTable = alias(usersTable, "buyers");
const sellersTable = alias(usersTable, "sellers");

router.get("/admin/overview", async (_req, res) => {
  const cutoff7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const cutoff30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [users] = await db.select({ count: sql<number>`COUNT(*)::int` }).from(usersTable);
  const [listings] = await db.select({ count: sql<number>`COUNT(*)::int` }).from(productsTable);
  const [activeListings] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(productsTable)
    .where(eq(productsTable.status, "active"));
  const [tx7] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(transactionsTable)
    .where(gte(transactionsTable.createdAt, cutoff7));
  const [tx30] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(transactionsTable)
    .where(gte(transactionsTable.createdAt, cutoff30));
  const [points] = await db
    .select({ total: sql<number>`COALESCE(SUM(${transactionsTable.pointsAmount}), 0)::int` })
    .from(transactionsTable)
    .where(eq(transactionsTable.status, "completed"));
  const [cash] = await db
    .select({ total: sql<number>`COALESCE(SUM(${transactionsTable.cashCents}), 0)::int` })
    .from(transactionsTable)
    .where(eq(transactionsTable.status, "completed"));
  const [newUsers] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(usersTable)
    .where(gte(usersTable.createdAt, cutoff7));

  res.json(
    GetAdminOverviewResponse.parse({
      totalUsers: Number(users?.count ?? 0),
      totalListings: Number(listings?.count ?? 0),
      activeListings: Number(activeListings?.count ?? 0),
      transactions7d: Number(tx7?.count ?? 0),
      transactions30d: Number(tx30?.count ?? 0),
      pointsCirculated: Number(points?.total ?? 0),
      cashVolumeCents: Number(cash?.total ?? 0),
      newUsers7d: Number(newUsers?.count ?? 0),
    }),
  );
});

router.get("/admin/recent-activity", async (_req, res) => {
  const txns = await db
    .select({
      id: transactionsTable.id,
      type: transactionsTable.type,
      pointsAmount: transactionsTable.pointsAmount,
      createdAt: transactionsTable.createdAt,
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
    .orderBy(desc(transactionsTable.createdAt))
    .limit(25);

  const items = txns.map((t) => {
    let title = "";
    let subtitle = "";
    if (t.type === "purchase") {
      title = `${t.buyerName ?? "Someone"} bought "${t.productTitle ?? "an item"}"`;
      subtitle = `from ${t.sellerName ?? "a seller"} for ${t.pointsAmount} points`;
    } else if (t.type === "transfer") {
      title = `${t.sellerName ?? "Someone"} sent points`;
      subtitle = `to ${t.buyerName ?? "a friend"}`;
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
      actorName: t.buyerName ?? t.sellerName ?? null,
      actorAvatarUrl: t.buyerAvatarUrl ?? t.sellerAvatarUrl ?? null,
      createdAt: t.createdAt.toISOString(),
    };
  });
  res.json(GetAdminRecentActivityResponse.parse(items));
});

router.get("/admin/top-sellers", async (_req, res) => {
  const rows = await db
    .select({
      userId: usersTable.id,
      name: usersTable.name,
      avatarUrl: usersTable.avatarUrl,
      totalSales: sql<number>`COUNT(${transactionsTable.id})::int`,
      pointsEarned: sql<number>`COALESCE(SUM(${transactionsTable.pointsAmount}), 0)::int`,
    })
    .from(usersTable)
    .leftJoin(
      transactionsTable,
      and(
        eq(transactionsTable.sellerId, usersTable.id),
        eq(transactionsTable.type, "purchase"),
        eq(transactionsTable.status, "completed"),
      ),
    )
    .groupBy(usersTable.id, usersTable.name, usersTable.avatarUrl)
    .orderBy(desc(sql`COUNT(${transactionsTable.id})`), desc(sql`COALESCE(SUM(${transactionsTable.pointsAmount}), 0)`))
    .limit(10);

  res.json(
    GetTopSellersResponse.parse(
      rows.map((r) => ({
        userId: r.userId,
        name: r.name,
        avatarUrl: r.avatarUrl,
        totalSales: Number(r.totalSales),
        pointsEarned: Number(r.pointsEarned),
      })),
    ),
  );
  void or; // unused import safety
});

export default router;
