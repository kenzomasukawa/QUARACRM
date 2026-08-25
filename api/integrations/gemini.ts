import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuthenticatedUser } from '../_lib/auth';

/**
 * Server-side proxy for Google Gemini AI features.
 * GEMINI_API_KEY lives exclusively in the Vercel project's server environment
 * variables — it is NEVER bundled or exposed in the client-side JavaScript.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, message: 'Método não permitido.' });
  }

  const user = await requireAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Acesso não autorizado. Faça login no CRM.' });
  }

  const { prompt, systemInstruction, model = 'gemini-2.5-flash' } = (req.body || {}) as {
    prompt?: string;
    systemInstruction?: string;
    model?: string;
  };

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ success: false, message: 'Prompt de instrução não fornecido.' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(200).json({
      configured: false,
      success: false,
      message: 'GEMINI_API_KEY não configurada no servidor Vercel. Configure a variável de ambiente no dashboard.',
    });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const bodyPayload: Record<string, any> = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    };

    if (systemInstruction) {
      bodyPayload.systemInstruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = errorData?.error?.message || `Erro ${response.status}: ${response.statusText}`;
      return res.status(response.status).json({
        configured: true,
        success: false,
        message: `Google AI Studio: ${msg}`,
      });
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;

    if (!text) {
      return res.status(200).json({
        configured: true,
        success: false,
        message: 'Nenhuma resposta foi gerada pelo modelo Gemini.',
      });
    }

    return res.status(200).json({
      configured: true,
      success: true,
      text,
    });
  } catch (err: any) {
    return res.status(502).json({
      configured: true,
      success: false,
      message: err?.message || 'Falha de conexão com a API do Google Gemini.',
    });
  }
}
