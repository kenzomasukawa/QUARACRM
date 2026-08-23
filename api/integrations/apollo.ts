import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuthenticatedUser } from '../_lib/auth';

/**
 * Server-side proxy for Apollo.io organization enrichment.
 * APOLLO_API_KEY lives only in the Vercel project's server environment
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

  const { companyDomainOrName } = (req.body || {}) as { companyDomainOrName?: string };
  if (!companyDomainOrName || !companyDomainOrName.trim()) {
    return res.status(400).json({ success: false, message: 'Informe o domínio ou nome da empresa.' });
  }

  const apolloApiKey = process.env.APOLLO_API_KEY;
  if (!apolloApiKey) {
    // Graceful degrade: Apollo not configured on the server yet.
    return res.status(200).json({
      configured: false,
      message: 'Integração com Apollo.io ainda não configurada no servidor (defina APOLLO_API_KEY).',
    });
  }

  try {
    const domain = companyDomainOrName.trim();
    const apolloRes = await fetch(
      `https://api.apollo.io/api/v1/organizations/enrich?domain=${encodeURIComponent(domain)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apolloApiKey,
        },
      }
    );

    if (!apolloRes.ok) {
      const errBody = await apolloRes.json().catch(() => ({}));
      return res.status(apolloRes.status).json({
        configured: true,
        success: false,
        message: errBody?.error || `Erro ${apolloRes.status} ao consultar Apollo.io`,
      });
    }

    const data = await apolloRes.json();
    const org = data?.organization;

    return res.status(200).json({
      configured: true,
      success: true,
      organization: org
        ? {
            name: org.name,
            industry: org.industry,
            employeeRange: org.estimated_num_employees ? `${org.estimated_num_employees} colaboradores` : undefined,
            annualRevenue: org.annual_revenue_printed,
            technologies: org.technology_names || [],
            website: org.website_url,
          }
        : null,
    });
  } catch (err: any) {
    return res.status(502).json({
      configured: true,
      success: false,
      message: err?.message || 'Falha de conexão com Apollo.io',
    });
  }
}
