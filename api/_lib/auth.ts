import type { VercelRequest } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * Verifies the caller's Supabase access token (sent by the client as
 * `Authorization: Bearer <token>`) so these serverless endpoints can't be
 * hit anonymously and used to relay email/enrichment traffic on the
 * project's dime. Uses the public anon key — sufficient for validating a
 * JWT, no service-role key required.
 */
export async function requireAuthenticatedUser(req: VercelRequest): Promise<{ id: string; email?: string } | null> {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return null;

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  return { id: data.user.id, email: data.user.email || undefined };
}
