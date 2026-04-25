import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const pointVouchersTable = pgTable("point_vouchers", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  issuerUserId: integer("issuer_user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  holderUserId: integer("holder_user_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  pointsValue: integer("points_value").notNull(),
  note: text("note"),
  status: text("status").notNull().default("active"),
  redeemedAt: timestamp("redeemed_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PointVoucher = typeof pointVouchersTable.$inferSelect;
