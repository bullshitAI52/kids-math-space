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
  // External learning-page URL for link cards; null = ordinary card.
  // A link card opens this URL in a new window instead of showing an
  // image / practice section. (Superseded for the seeded 专题 cards by
  // contentHtml/pages below; kept for user-made link cards.)
  linkUrl: text("link_url"),
  // Full self-contained HTML of a tutorial page stored inside the
  // space (专题 card); the client renders it in a sandboxed iframe
  // srcDoc so the kid reads/plays without leaving the space.
  // null = not a tutorial card.
  contentHtml: text("content_html"),
  // Comic card page list: JSON array of image filenames in the
  // mathmanhua123 GitHub repo, in reading order; the reader loads
  // each page from the repo's raw URLs. null = not a comic card.
  pages: text("pages"),
  // Practice questions as a JSON string: [{ q, a }] — question and
  // answer (with a brief worked step) stored separately so the client
  // can keep answers folded until the kid taps 看答案. "[]" = none yet.
  practice: text("practice").notNull().default("[]"),
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
