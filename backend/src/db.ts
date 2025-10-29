import { drizzle } from 'drizzle-orm/neon-http';
import { redis } from '@upstash/redis';
import { eq } from 'drizzle-orm';
import { notes } from '../drizzle/schema.js';

const db = drizzle(process.env.DATABASE_URL!);

export async function get(id: string): Promise<string | null> {
  const cached = await redis.get<string>(id);
  if (cached) return cached;
  const row = await db.select().from(notes).where(eq(notes.id, id));
  const text = row[0]?.text ?? '';
  await redis.set(id, text, { ex: 60 });
  return text;
}

export async function set(id: string, text: string): Promise<void> {
  await redis.set(id, text, { ex: 60 });
  await db.insert(notes).values({ id, text }).onConflictDoUpdate({ target: notes.id, set: { text } });
}
