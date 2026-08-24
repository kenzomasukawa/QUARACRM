import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuthenticatedUser } from '../_lib/auth';

/**
 * Server-side proxy for transactional email via Resend.
 * RESEND_API_KEY lives only in the Vercel project's server environment
 * variables — it is never sent to or readable from the browser bundle.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, message: 'Método não permitido.' });
  }

  const user = await requireAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Não autenticado.' });
  }

  const { to, subject, content, fromName, fromEmail } = (req.body || {}) as {
    to?: string;
    subject?: string;
    content?: string;
    fromName?: string;
    fromEmail?: string;
  };

  if (!to || !to.includes('@')) {
    return res.status(400).json({ success: false, message: 'E-mail do destinatário inválido.' });
  }
  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, message: 'Conteúdo do e-mail vazio.' });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return res.status(200).json({
      configured: false,
      success: true,
      message: 'RESEND_API_KEY não configurada no servidor — e-mail registrado apenas no histórico do CRM.',
    });
  }

  try {
    const escapedHtml = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/\n/g, '<br/>');

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `${fromName || 'QuaraCRM'} <${fromEmail || 'onboarding@resend.dev'}>`,
        to: [to],
        subject: subject || 'Contato Comercial — QuaraCRM',
        text: content,
        html: `<div style="font-family: sans-serif; font-size: 14px; line-height: 1.6; color: #111;">${escapedHtml}</div>`,
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.json().catch(() => ({}));
      return res.status(resendRes.status).json({
        configured: true,
        success: false,
        message: errBody?.message || `Erro ${resendRes.status} ao enviar via Resend`,
      });
    }

    return res.status(200).json({ configured: true, success: true, message: 'E-mail enviado com sucesso via Resend API!' });
  } catch (err: any) {
    return res.status(502).json({
      configured: true,
      success: false,
      message: err?.message || 'Falha de conexão com o provedor de e-mail.',
    });
  }
}
