import { createClient } from '@supabase/supabase-js';
import { isSupabaseEnvConfigured } from '../lib/supabase';

/**
 * Env-vars are the single source of truth for the Supabase connection. The
 * canonical client lives in src/lib/supabase.ts and is built from
 * VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (set locally in .env or in the
 * Vercel project settings). The former in-app localStorage/modal config path
 * has been removed — it created a second, divergent client that the real data
 * layer never used, so the UI could report "connected" while nothing persisted.
 */

export function sanitizeSupabaseUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let clean = rawUrl.trim();
  clean = clean.replace(/\/rest\/v1\/?$/i, '');
  clean = clean.replace(/\/+$/, '');
  return clean;
}

export function getSupabaseCredentials(): { url: string; anonKey: string } {
  const metaEnv = (import.meta as any).env || {};
  const envUrl = (metaEnv.VITE_SUPABASE_URL as string) || '';
  const envKey = (metaEnv.VITE_SUPABASE_ANON_KEY as string) || '';

  return {
    url: sanitizeSupabaseUrl(envUrl),
    anonKey: envKey.trim(),
  };
}

export function isSupabaseConfigured(): boolean {
  return isSupabaseEnvConfigured;
}

/**
 * Best-effort connectivity check against the env-configured project. Used by the
 * Supabase status panel to verify the tables exist. Reuses the credentials from
 * the environment; a fresh client is fine here since it's only a throwaway probe.
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  hasLeadsTable?: boolean;
  hasInteractionsTable?: boolean;
}> {
  const { url, anonKey } = getSupabaseCredentials();

  if (!url || !anonKey) {
    return {
      success: false,
      message: 'VITE_SUPABASE_URL e/ou VITE_SUPABASE_ANON_KEY não configuradas.',
    };
  }

  try {
    const testClient = createClient(url, anonKey);
    const { error: leadsError } = await testClient.from('leads').select('id').limit(1);

    if (leadsError) {
      if (leadsError.code === '42P01' || leadsError.message?.includes('relation "leads" does not exist')) {
        return {
          success: true,
          message: 'Conectado ao Supabase! A tabela "leads" ainda precisa ser criada.',
          hasLeadsTable: false,
          hasInteractionsTable: false,
        };
      }
      return {
        success: false,
        message: `Erro ao conectar: ${leadsError.message}`,
      };
    }

    const { error: interactionsError } = await testClient
      .from('lead_interactions')
      .select('id')
      .limit(1);

    return {
      success: true,
      message: 'Conexão com Supabase bem-sucedida e tabelas verificadas!',
      hasLeadsTable: true,
      hasInteractionsTable: !interactionsError,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Falha na conexão: ${err?.message || 'Erro de rede desconhecido'}`,
    };
  }
}
