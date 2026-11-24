// Drizzle schema for 小孩数学空间: knowledge cards filed under categories,
// plus a tiny meta table that records one-time seeding.

import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  // Palette key (coral/blue/purple/green/teal/pink/orange/amber); the
  // client maps it to the category's bright color.
  color: text("color").notNull().default("orange"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const cards = sqliteTable("cards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  points: text("points").notNull().default(""),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id),
  // ctx.blobs key for the knowledge-summary image; null = text-only card.
  imageBlobKey: text("image_blob_key"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const meta = sqliteTable("meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
