import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

export async function verifyJWT(token: string): Promise<boolean> {
  try {
    const { data, error } = await sb.auth.getUser(token);
    return !error && !!data.user;
  } catch {
    return false;
  }
}
