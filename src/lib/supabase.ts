import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || '';
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || '';

export const isSupabaseEnvConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

if (!isSupabaseEnvConfigured) {
  console.error(
    '[QuaraCRM] VITE_SUPABASE_URL e/ou VITE_SUPABASE_ANON_KEY não estão definidas. ' +
      'Configure essas variáveis de ambiente (.env local ou nas Environment Variables da Vercel) para habilitar login e persistência de dados.'
  );
}

/**
 * Canonical Supabase client for the whole app: authentication (supabase.auth)
 * and all 'leads' / 'lead_interactions' table access. Built once from env vars
 * so RLS policies keyed on auth.uid() work consistently across the app.
 */
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
