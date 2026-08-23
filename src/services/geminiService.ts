import { CRMCard, PhaseId, User } from '../types/crm';

const STORAGE_KEY_GEMINI_KEY = 'quaracrm_gemini_api_key';
const STORAGE_KEY_GEMINI_MODEL = 'quaracrm_gemini_model';

export function getGeminiApiKey(): string {
  const metaEnv = (import.meta as any).env || {};
  const envKey = (metaEnv.VITE_GEMINI_API_KEY as string) || '';
  const localKey = localStorage.getItem(STORAGE_KEY_GEMINI_KEY) || '';
  return (envKey || localKey).trim();
}

export function saveGeminiApiKey(key: string): void {
  localStorage.setItem(STORAGE_KEY_GEMINI_KEY, key.trim());
}

export function getGeminiModel(): string {
  return localStorage.getItem(STORAGE_KEY_GEMINI_MODEL) || 'gemini-2.5-flash';
}

export function saveGeminiModel(model: string): void {
  localStorage.setItem(STORAGE_KEY_GEMINI_MODEL, model);
}

export function isGeminiConfigured(): boolean {
  const key = getGeminiApiKey();
  return Boolean(key && key.length > 15);
}

/**
 * Direct call to Google Gemini REST API
 */
async function callGeminiApi(prompt: string, systemInstruction?: string): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('Chave de API do Google AI Studio não configurada.');
  }

  const model = getGeminiModel();
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
    const message = errorData?.error?.message || `Erro ${response.status}: ${response.statusText}`;
    throw new Error(`Google AI Studio: ${message}`);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Nenhuma resposta gerada pelo modelo Gemini.');
  }

  return text;
}

/**
 * Test Gemini API Key
 */
export async function testGeminiConnection(customKey?: string): Promise<{ success: boolean; message: string }> {
  const key = customKey || getGeminiApiKey();
  if (!key) {
    return { success: false, message: 'Chave de API não informada.' };
  }

  try {
    const model = getGeminiModel();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Responda apenas: OK' }] }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { success: false, message: err?.error?.message || 'Chave inválida ou erro na API.' };
    }

    return { success: true, message: `Conexão bem-sucedida com Google AI Studio (${model})!` };
  } catch (err: any) {
    return { success: false, message: err.message || 'Falha de conexão com a API do Google.' };
  }
}

/**
 * 1. AI Copywriting Generation (Follow-up, Objeção, Proposta, Cold Call, Reativação)
 */
export async function generateSalesCopy(
  lead: CRMCard,
  type: 'followup' | 'objection' | 'proposal' | 'cold_call' | 'reactivation' | 'custom',
  currentUser: User,
  customInstructions?: string
): Promise<string> {
  const leadContext = `
DADOS DO LEAD:
- Empresa: ${lead.companyName}
- Contato: ${lead.contactName} (${lead.contactRole || 'Decisor'})
- Fase Atual no CRM: ${lead.phaseId}
- Valor da Oportunidade: R$ ${lead.value.toLocaleString('pt-BR')}
- Prioridade: ${lead.priority}
- Telefone/WhatsApp: ${lead.contactPhone || lead.contactWhatsapp || 'Não informado'}
- Dores / Necessidades registradas: ${lead.customFields?.necessidadeCliente || lead.customFields?.doresIdentificadas || 'Em levantamento'}
- Serviços em negociação: ${lead.customFields?.servicosAdquiridos || 'Soluções corporativas'}
- Consultor Responsável: ${currentUser.name} (${currentUser.department || 'Equipe Comercial'})
- Histórico de Interações Recentes: ${lead.messages.slice(-3).map((m) => `[${m.channel}] ${m.sender}: ${m.content}`).join(' | ') || 'Nenhuma recente'}
`;

  let promptGoal = '';
  if (type === 'followup') {
    promptGoal = `Crie uma mensagem persuasiva e educada de follow-up personalizada para o WhatsApp/E-mail de ${lead.contactName}, incentivando uma resposta rápida para avançarmos da fase ${lead.phaseId}.`;
  } else if (type === 'objection') {
    promptGoal = `Crie uma resposta elegante de quebra de objeção de preço e orçamento sobre o valor de R$ ${lead.value.toLocaleString('pt-BR')}, focando no retorno sobre investimento (ROI), redução de riscos e valor agregado para a ${lead.companyName}.`;
  } else if (type === 'proposal') {
    promptGoal = `Crie um resumo executivo de apresentação de proposta comercial claro e impactante, destacando os objetivos do projeto, escopo proposto e o valor acordado.`;
  } else if (type === 'cold_call') {
    promptGoal = `Crie um roteiro (script) de ligação de prospecção rápida de 30 segundos (Cold Call) com gancho de abertura, pergunta de qualificação e call-to-action para agendar diagnóstico.`;
  } else if (type === 'reactivation') {
    promptGoal = `Crie uma mensagem acolhedora de reativação para este lead que esfriou ou parou de responder, apresentando uma novidade ou motivo irresistível para retomar contato.`;
  } else {
    promptGoal = customInstructions || `Escreva uma mensagem comercial estratégica adaptada para este lead.`;
  }

  const prompt = `${leadContext}\n\nOBJETIVO DA IA:\n${promptGoal}\n${customInstructions ? `Instruções adicionais do consultor: ${customInstructions}` : ''}\n\nEscreva em português brasileiro fluido, profissional, objetivo e persuasivo.`;

  if (isGeminiConfigured()) {
    try {
      return await callGeminiApi(
        prompt,
        'Você é o consultor sênior de inteligência comercial do QuaraCRM. Gere copys de altíssima conversão para vendedores consultivos B2B e B2C.'
      );
    } catch (err: any) {
      console.warn('Fallback para gerador local de IA:', err);
    }
  }

  // Smart Fallback when no API Key is set yet
  if (type === 'followup') {
    return `Olá ${lead.contactName}, tudo bem? Aqui é o ${currentUser.name} da equipe comercial.\n\nGostaria de entender se você conseguiu avaliar os pontos que conversamos para a ${lead.companyName} em relação à fase de ${lead.phaseId}.\n\nPodemos fazer um alinhamento rápido de 15 minutos amanhã às 10h ou às 15h?`;
  }
  if (type === 'objection') {
    return `Prezado ${lead.contactName},\n\nCompreendo perfeitamente a sua atenção em relação ao investimento de R$ ${lead.value.toLocaleString('pt-BR')}.\n\nQuando estruturamos essa solução para a ${lead.companyName}, dimensionamos cada etapa para gerar retorno líquido e previsibilidade de resultados nos primeiros meses. Vamos analisar juntos os indicadores de ROI para demonstrar como o projeto se paga rapidamente?`;
  }
  if (type === 'proposal') {
    return `📋 Proposta Comercial Executiva — ${lead.companyName}\n\n• Contato Principal: ${lead.contactName} (${lead.contactRole || 'Decisor'})\n• Valor de Investimento: R$ ${lead.value.toLocaleString('pt-BR')}\n• Escopo: ${lead.customFields?.servicosAdquiridos || 'Transformação e aceleração comercial integrada'}\n• Próximo Passo: Validação dos termos e início do cronograma de implantação.`;
  }
  if (type === 'cold_call') {
    return `📞 Roteiro de Ligação (Cold Call):\n\n"Olá ${lead.contactName}, tudo bem? Aqui é o ${currentUser.name} da Quara. Estou ligando porque acompanho o mercado da ${lead.companyName} e temos ajudado empresas similares a aumentarem a eficiência e conversão em até 35%.\n\nVocê teria 3 minutos para entender como implementamos isso sem alterar sua operação atual?"`;
  }
  return `Olá ${lead.contactName}, tudo bem? Passando para compartilhar uma nova condição especial para a ${lead.companyName}. Conseguimos avançar com aquela etapa pendente esta semana?`;
}

/**
 * 2. Deal Health & Win Prediction Analysis
 */
export async function analyzeDealHealth(
  lead: CRMCard
): Promise<{
  winProbability: number;
  healthStatus: 'excelente' | 'moderado' | 'risco';
  strengths: string[];
  risks: string[];
  recommendedStrategy: string;
}> {
  const prompt = `
Analise a saúde desta oportunidade comercial e retorne APENAS um JSON válido no formato abaixo:
{
  "winProbability": 75,
  "healthStatus": "excelente",
  "strengths": ["Ponto forte 1", "Ponto forte 2"],
  "risks": ["Risco 1", "Risco 2"],
  "recommendedStrategy": "Estratégia recomendada em 2 linhas"
}

DADOS DA OPORTUNIDADE:
- Empresa: ${lead.companyName}
- Fase Atual: ${lead.phaseId}
- Valor: R$ ${lead.value}
- Prioridade: ${lead.priority}
- Dores: ${lead.customFields?.necessidadeCliente || 'Não detalhadas'}
- Checklist Concluído: ${lead.checklist.filter((i) => i.completed).length}/${lead.checklist.length} tarefas
- Mensagens registradas: ${lead.messages.length}
`;

  if (isGeminiConfigured()) {
    try {
      const rawJson = await callGeminiApi(prompt, 'Você é um algoritmo preditivo de vendas B2B que calcula probabilidade de vitória de negociações.');
      const cleaned = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return {
        winProbability: Math.min(100, Math.max(5, Number(parsed.winProbability) || 60)),
        healthStatus: parsed.healthStatus || (parsed.winProbability > 70 ? 'excelente' : parsed.winProbability > 40 ? 'moderado' : 'risco'),
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['Lead qualificado com interesse declarado'],
        risks: Array.isArray(parsed.risks) ? parsed.risks : ['Acompanhar tempo de resposta do decisor'],
        recommendedStrategy: parsed.recommendedStrategy || 'Agendar reunião com tomadores de decisão para validar cronograma.',
      };
    } catch (err) {
      console.warn('Fallback no Deal Health AI:', err);
    }
  }

  // Heuristic estimation fallback
  let prob = 50;
  if (lead.phaseId === 'negociacao' || lead.phaseId === 'proposta') prob += 25;
  if (lead.phaseId === 'ganho') prob = 100;
  if (lead.phaseId === 'perdido') prob = 0;
  if (lead.priority === 'urgente') prob += 10;
  if (lead.checklist.some((i) => i.completed)) prob += 10;
  if (lead.value > 0) prob += 5;
  prob = Math.min(95, Math.max(15, prob));

  return {
    winProbability: prob,
    healthStatus: prob >= 70 ? 'excelente' : prob >= 45 ? 'moderado' : 'risco',
    strengths: [
      `Posicionado na fase estratégica de ${lead.phaseId}`,
      lead.value > 0 ? `Valor definido em R$ ${lead.value.toLocaleString('pt-BR')}` : 'Oportunidade ativa no pipeline',
      `${lead.messages.length} interações registradas`,
    ],
    risks: [
      lead.phaseId.includes('followup') ? 'Lead em ciclo de follow-up exige atenção contra esfriamento' : 'Validar autoridade orçamentária do interlocutor',
      'Definir data limite clara para fechamento da proposta',
    ],
    recommendedStrategy: `Focar na proposta de valor única para a ${lead.companyName} e conduzir o fechamento com validação dos prazos de implantação.`,
  };
}

/**
 * 3. Extract Meeting / Call Transcript Insights
 */
export async function extractMeetingInsights(
  lead: CRMCard,
  rawNotesOrTranscript: string
): Promise<{
  summary: string;
  identifiedPains: string;
  budgetEstimate: string;
  decisionMakers: string;
  nextSteps: string;
  suggestedFields: Record<string, any>;
}> {
  const prompt = `
Analise o seguinte texto bruto (anotações de reunião ou transcrição de ligação comercial) referente ao cliente "${lead.companyName}" e contato "${lead.contactName}".
Retorne APENAS um JSON no formato:
{
  "summary": "Resumo objetivo da reunião em 2-3 frases",
  "identifiedPains": "Dores e problemas centrais do cliente identificados",
  "budgetEstimate": "Estimativa de orçamento ou valor discutido",
  "decisionMakers": "Decisores e stakeholders citados",
  "nextSteps": "Próximos passos e compromissos acordados",
  "suggestedFields": {
    "necessidadeCliente": "Texto sintetizado para campo de necessidade",
    "servicosAdquiridos": "Serviços recomendados identificados",
    "previsaoFechamento": "YYYY-MM-DD se identificado ou vazio"
  }
}

TEXTO DA REUNIÃO / CALL:
"""
${rawNotesOrTranscript}
"""
`;

  if (isGeminiConfigured()) {
    try {
      const rawJson = await callGeminiApi(prompt, 'Você é um assistente executivo de vendas especialista em transcrição e análise de reuniões comerciais.');
      const cleaned = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (err) {
      console.warn('Fallback no extrator de reunião:', err);
    }
  }

  // Heuristic Fallback
  return {
    summary: `Reunião comercial com ${lead.contactName} da ${lead.companyName}. Discutidas as diretrizes do projeto e alinhamento de expectativas.`,
    identifiedPains: rawNotesOrTranscript.slice(0, 150) || 'Necessidade de modernização e eficiência comercial.',
    budgetEstimate: lead.value > 0 ? `R$ ${lead.value.toLocaleString('pt-BR')}` : 'A definir no diagnóstico',
    decisionMakers: lead.contactName + (lead.contactRole ? ` (${lead.contactRole})` : ''),
    nextSteps: 'Enviar proposta atualizada e agendar alinhamento de fechamento.',
    suggestedFields: {
      necessidadeCliente: rawNotesOrTranscript.slice(0, 200),
      servicosAdquiridos: lead.customFields?.servicosAdquiridos || 'Consultoria e aceleração de vendas',
    },
  };
}

/**
 * 4. Chat with Sales Copilot (Gemini AI Mentor)
 */
export async function chatWithSalesCopilot(
  lead: CRMCard,
  history: { sender: 'user' | 'assistant'; text: string }[],
  userMessage: string
): Promise<string> {
  const context = `
CONTEXTO DO LEAD NO CRM:
- Empresa: ${lead.companyName}
- Contato: ${lead.contactName} (${lead.contactRole || 'Decisor'})
- Fase Atual: ${lead.phaseId}
- Valor: R$ ${lead.value.toLocaleString('pt-BR')}
- Dores: ${lead.customFields?.necessidadeCliente || 'Não especificadas'}
- Serviços: ${lead.customFields?.servicosAdquiridos || 'Soluções corporativas'}
- Prioridade: ${lead.priority}
- Histórico de Mensagens: ${lead.messages.slice(-4).map((m) => `${m.senderName}: ${m.content}`).join('\n')}
`;

  const conversationFormatted = history
    .map((h) => `${h.sender === 'user' ? 'Consultor Comercial' : 'Copilot IA'}: ${h.text}`)
    .join('\n');

  const prompt = `${context}\n\nHISTÓRICO DA CONVERSA:\n${conversationFormatted}\n\nConsultor Comercial: ${userMessage}\n\nCopilot IA (responda de forma prática, estratégica e direta para ajudar o vendedor a fechar esta oportunidade):`;

  if (isGeminiConfigured()) {
    try {
      return await callGeminiApi(
        prompt,
        'Você é o Copilot de Vendas QuaraCRM alimentado pelo Google Gemini. Você é especialista em negociação de alto nível, fechamento de contratos, spin selling e vendas consultivas.'
      );
    } catch (err: any) {
      console.warn('Fallback chat copilot:', err);
    }
  }

  // Fallback response
  return `Analisando a oportunidade da **${lead.companyName}** na fase de **${lead.phaseId}**:\n\nRecomendo focar nos seguintes pontos:\n1. **Alinhar o Decisor**: Certifique-se de que ${lead.contactName} tem autonomia para assinar ou se há outro sócio/CFO envolvido.\n2. **Urgência e Impacto**: Relembre o custo da inação caso a empresa não solucione as dores mapeadas.\n3. **Proposta de Valor**: Destaque a garantia e o retorno sobre o investimento de R$ ${lead.value.toLocaleString('pt-BR')}.\n\nPosso gerar uma mensagem de WhatsApp ou E-mail personalizada para você enviar agora?`;
}
