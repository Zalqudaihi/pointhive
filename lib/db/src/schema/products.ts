import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id")
    .notNull()
    .references(() => usersTable.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  category: text("category").notNull(),
  type: text("type").notNull().default("item"),
  pointPrice: integer("point_price").notNull(),
  cashPriceCents: integer("cash_price_cents"),
  stock: integer("stock").notNull().default(1),
  status: text("status").notNull().default("active"),
  couponCode: text("coupon_code"),
  couponDiscountPct: integer("coupon_discount_pct"),
  couponExpiresAt: timestamp("coupon_expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
