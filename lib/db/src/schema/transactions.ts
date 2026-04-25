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
import { productsTable } from "./products";

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  buyerId: integer("buyer_id").references(() => usersTable.id),
  sellerId: integer("seller_id").references(() => usersTable.id),
  productId: integer("product_id").references(() => productsTable.id),
  pointsAmount: integer("points_amount").notNull().default(0),
  cashCents: integer("cash_cents"),
  note: text("note"),
  status: text("status").notNull().default("completed"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(
  transactionsTable,
).omit({ id: true, createdAt: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;
