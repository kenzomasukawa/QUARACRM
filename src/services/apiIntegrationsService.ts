import { supabase } from '../lib/supabase';

export type ApiStatus = 'connected' | 'disconnected' | 'v2_planned';

/**
 * Attaches the current Supabase session's access token so the /api/*
 * serverless endpoints can verify the caller before touching
 * Apollo.io / Resend on the server's behalf.
 */
async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface WhatsAppConfig {
  gateway: 'direct_web' | 'evolution_api' | 'z_api' | 'custom_webhook';
  apiUrl?: string;
  instanceId?: string;
  apiKey?: string;
  webhookUrl?: string;
  enabled: boolean;
}

export interface EmailConfig {
  provider: 'smtp' | 'resend' | 'sendgrid' | 'custom_webhook';
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  apiKey?: string;
  fromEmail?: string;
  fromName?: string;
  enabled: boolean;
}

export interface ApolloConfig {
  apiKey?: string;
  version: 'v2.0_github_ready';
  enabled: boolean;
  features: {
    leadEnrichment: boolean;
    domainSearch: boolean;
    emailVerification: boolean;
    decisionMakerFinder: boolean;
  };
}

const STORAGE_KEY_WHATSAPP = 'quaracrm_whatsapp_config';
const STORAGE_KEY_EMAIL = 'quaracrm_email_config';
const STORAGE_KEY_APOLLO = 'quaracrm_apollo_config';

export function getWhatsAppConfig(): WhatsAppConfig {
  const saved = localStorage.getItem(STORAGE_KEY_WHATSAPP);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }
  return {
    gateway: 'direct_web',
    apiUrl: '',
    instanceId: '',
    apiKey: '',
    webhookUrl: '',
    enabled: true,
  };
}

export function saveWhatsAppConfig(config: WhatsAppConfig): void {
  localStorage.setItem(STORAGE_KEY_WHATSAPP, JSON.stringify(config));
}

export function getEmailConfig(): EmailConfig {
  const saved = localStorage.getItem(STORAGE_KEY_EMAIL);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }
  return {
    provider: 'resend',
    apiKey: '',
    fromEmail: 'contato@suaempresa.com.br',
    fromName: 'QuaraCRM Vendas',
    enabled: true,
  };
}

export function saveEmailConfig(config: EmailConfig): void {
  localStorage.setItem(STORAGE_KEY_EMAIL, JSON.stringify(config));
}

export function getApolloConfig(): ApolloConfig {
  const saved = localStorage.getItem(STORAGE_KEY_APOLLO);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }
  return {
    apiKey: '',
    version: 'v2.0_github_ready',
    enabled: false, // In v1 this is disabled, ready for v2 after github release
    features: {
      leadEnrichment: true,
      domainSearch: true,
      emailVerification: true,
      decisionMakerFinder: true,
    },
  };
}

export function saveApolloConfig(config: ApolloConfig): void {
  localStorage.setItem(STORAGE_KEY_APOLLO, JSON.stringify(config));
}

/**
 * 1. WhatsApp API Dispatch Handler
 */
export async function sendWhatsAppViaApi(
  toPhone: string,
  message: string
): Promise<{ success: boolean; message: string; messageId?: string }> {
  const config = getWhatsAppConfig();
  const cleanPhone = toPhone.replace(/\D/g, '');

  if (!cleanPhone) {
    return { success: false, message: 'Número de telefone/WhatsApp inválido.' };
  }

  // If using webhook or Evolution / Z-API
  if (config.gateway === 'evolution_api' && config.apiUrl && config.apiKey && config.instanceId) {
    try {
      const endpoint = `${config.apiUrl.replace(/\/$/, '')}/message/sendText/${config.instanceId}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: config.apiKey,
        },
        body: JSON.stringify({
          number: cleanPhone,
          text: message,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { success: false, message: err?.message || 'Falha ao enviar via Evolution API' };
      }

      return { success: true, message: 'Mensagem enviada com sucesso via WhatsApp API!' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Erro de conexão com WhatsApp Gateway' };
    }
  }

  if (config.gateway === 'custom_webhook' && config.webhookUrl) {
    try {
      const res = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'whatsapp',
          to: cleanPhone,
          content: message,
          timestamp: new Date().toISOString(),
        }),
      });
      return { success: res.ok, message: res.ok ? 'Disparado via Webhook!' : 'Erro no Webhook' };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  // Default: Direct Web / App Integration
  return {
    success: true,
    message: 'Disparo preparado e sincronizado via WhatsApp Web.',
  };
}

/**
 * 2. E-mail API Dispatch Handler
 */
export async function sendEmailViaApi(
  toEmail: string,
  subject: string,
  content: string
): Promise<{ success: boolean; message: string }> {
  const config = getEmailConfig();

  if (!toEmail || !toEmail.includes('@')) {
    return { success: false, message: 'E-mail do destinatário inválido.' };
  }

  // Webhook integration for E-mail (user's own automation infra — no shared secret to protect)
  if (config.provider === 'custom_webhook' && (config as any).webhookUrl) {
    try {
      await fetch((config as any).webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'email', to: toEmail, subject, content }),
      });
      return { success: true, message: 'E-mail disparado para fila do Webhook!' };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  // Default path: server-side proxy (/api/integrations/email). The Resend
  // API key lives only in the Vercel server environment, never in the client.
  try {
    const res = await fetch('/api/integrations/email', {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({
        to: toEmail,
        subject,
        content,
        fromName: config.fromName,
        fromEmail: config.fromEmail,
      }),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, message: body?.message || `Erro ${res.status} ao enviar e-mail.` };
    }
    return { success: Boolean(body.success), message: body.message || 'E-mail processado.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Erro de conexão com o servidor.' };
  }
}

/**
 * 3. Apollo.io API — enrichment via server-side proxy (/api/integrations/apollo).
 * The Apollo API key lives only in the Vercel server environment.
 */
export async function enrichLeadWithApollo(
  companyDomainOrName: string
): Promise<{
  success: boolean;
  configured: boolean;
  message: string;
  organization?: {
    name?: string;
    industry?: string;
    employeeRange?: string;
    annualRevenue?: string;
    technologies?: string[];
    website?: string;
  } | null;
}> {
  try {
    const res = await fetch('/api/integrations/apollo', {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ companyDomainOrName }),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        configured: Boolean(body.configured),
        message: body?.message || `Erro ${res.status} ao consultar Apollo.io.`,
      };
    }

    if (body.configured === false) {
      return { success: false, configured: false, message: body.message };
    }

    return {
      success: Boolean(body.success),
      configured: true,
      message: body.success ? 'Empresa enriquecida via Apollo.io.' : body.message || 'Falha ao enriquecer via Apollo.io.',
      organization: body.organization,
    };
  } catch (err: any) {
    return {
      success: false,
      configured: false,
      message: err.message || 'Erro de conexão com o servidor.',
    };
  }
}
