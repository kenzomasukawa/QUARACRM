import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'pipe_crm_supabase_url';
const STORAGE_KEY_KEY = 'pipe_crm_supabase_anon_key';

let cachedClient: SupabaseClient | null = null;
let lastUrl: string | null = null;
let lastKey: string | null = null;

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

  const localUrl = localStorage.getItem(STORAGE_KEY_URL) || '';
  const localKey = localStorage.getItem(STORAGE_KEY_KEY) || '';

  const finalUrl = sanitizeSupabaseUrl(envUrl || localUrl);
  const finalKey = (envKey || localKey).trim();

  return {
    url: finalUrl,
    anonKey: finalKey,
  };
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(url && anonKey && url.startsWith('http') && anonKey.length > 10);
}

export function getSupabase(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseCredentials();
  if (!url || !anonKey || !url.startsWith('http')) {
    return null;
  }

  if (cachedClient && lastUrl === url && lastKey === anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    lastUrl = url;
    lastKey = anonKey;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export async function testSupabaseConnection(customUrl?: string, customKey?: string): Promise<{
  success: boolean;
  message: string;
  hasLeadsTable?: boolean;
  hasInteractionsTable?: boolean;
}> {
  const rawUrl = customUrl || getSupabaseCredentials().url;
  const anonKey = (customKey || getSupabaseCredentials().anonKey).trim();
  const url = sanitizeSupabaseUrl(rawUrl);

  if (!url || !anonKey) {
    return {
      success: false,
      message: 'URL e Chave Anônima do Supabase não fornecidas.',
    };
  }

  try {
    const testClient = createClient(url, anonKey);
    // Test query on 'leads' table
    const { data: leadsData, error: leadsError } = await testClient
      .from('leads')
      .select('id')
      .limit(1);

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

export function saveSupabaseCredentials(url: string, anonKey: string): void {
  localStorage.setItem(STORAGE_KEY_URL, sanitizeSupabaseUrl(url));
  localStorage.setItem(STORAGE_KEY_KEY, anonKey.trim());
  cachedClient = null;
}

export function clearSupabaseCredentials(): void {
  localStorage.removeItem(STORAGE_KEY_URL);
  localStorage.removeItem(STORAGE_KEY_KEY);
  cachedClient = null;
}
