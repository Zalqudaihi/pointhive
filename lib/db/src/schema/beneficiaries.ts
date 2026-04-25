import { pgTable, serial, integer, text, timestamp, unique } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const beneficiariesTable = pgTable(
  "beneficiaries",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    beneficiaryId: integer("beneficiary_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    nickname: text("nickname"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.userId, t.beneficiaryId)],
);

export type Beneficiary = typeof beneficiariesTable.$inferSelect;
