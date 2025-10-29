// api/src/db/schema.ts – Esquema PostgreSQL con Drizzle ORM
// KATANA v7 – 2025-10-28 – Última versión
// Define: tablas, relaciones, índices y tipos TypeScript

import {
  pgTable,
  text,
  timestamp,
  integer,
  uuid,
  boolean,
  jsonb,
  index
} from 'drizzle-orm/pg-core';

/* ==========  USERS (mirror de auth.users) ========== */
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey(),               // mismo UUID que auth.users
    email: text('email').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull()
  },
  (table) => ({
    emailIdx: index('users_email_idx').on(table.email)
  })
);

/* ==========  NOTAS ========== */
export const notes = pgTable(
  'notes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    content: text('content').notNull(),
    isPublic: boolean('is_public').default(false).notNull(),
    tags: jsonb('tags').$type<string[]>().default([]),
    version: integer('version').default(1).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
  },
  (table) => ({
    userIdIdx: index('notes_user_id_idx').on(table.userId),
    updatedAtIdx: index('notes_updated_at_idx').on(table.updatedAt)
  })
);

/* ==========  TIPOS TypeScript ========== */
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;