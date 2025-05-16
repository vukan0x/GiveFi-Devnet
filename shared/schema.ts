import { pgTable, text, serial, integer, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Donation schema for storing donation preferences
export const donations = pgTable("donations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  recipientAddress: text("recipient_address").notNull(),
  amount: integer("amount").notNull(), // in lamports
  enabled: boolean("enabled").default(false),
  lastDonated: text("last_donated"), // ISO date string
  metadata: json("metadata").$type<{
    label?: string;
    description?: string;
    transactionIds?: string[];
  }>(),
});

export const insertDonationSchema = createInsertSchema(donations).pick({
  userId: true,
  recipientAddress: true,
  amount: true,
  enabled: true,
  metadata: true,
});

export type InsertDonation = z.infer<typeof insertDonationSchema>;
export type Donation = typeof donations.$inferSelect;
