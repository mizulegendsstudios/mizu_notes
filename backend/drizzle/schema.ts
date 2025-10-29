import { pgTable, text, varchar } from 'drizzle-orm/pg-core';

export const notes = pgTable('notes', {
  id: varchar('id', { length: 64 }).primaryKey(),
  text: text('text').notNull(),
});