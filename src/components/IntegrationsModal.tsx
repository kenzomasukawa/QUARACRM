import React, { useState } from 'react';
import {
  Sparkles,
  MessageSquare,
  Mail,
  Zap,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  RefreshCw,
  Layers,
  Globe,
  Radio,
  Send,
  Lock,
} from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import {
  getGeminiModel,
  saveGeminiModel,
  testGeminiConnection,
} from '../services/geminiService';
import {
  getWhatsAppConfig,
  saveWhatsAppConfig,
  getEmailConfig,
  saveEmailConfig,
  getApolloConfig,
  saveApolloConfig,
  WhatsAppConfig,
  EmailConfig,
} from '../services/apiIntegrationsService';

interface IntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IntegrationsModal: React.FC<IntegrationsModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useCRM();
  const [activeTab, setActiveTab] = useState<'gemini' | 'whatsapp' | 'email' | 'apollo'>('gemini');

  // Gemini State
  const [geminiModel, setGeminiModel] = useState(getGeminiModel());
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState<{ success: boolean; message: string } | null>(null);

  // WhatsApp State
  const [waConfig, setWaConfig] = useState<WhatsAppConfig>(getWhatsAppConfig());
  const [waSavedStatus, setWaSavedStatus] = useState<string | null>(null);

  // Email State
  const [emailConfig, setEmailConfigState] = useState<EmailConfig>(getEmailConfig());
  const [emailSavedStatus, setEmailSavedStatus] = useState<string | null>(null);

  // Apollo State
  const apolloConfig = getApolloConfig();

  if (!isOpen) return null;

  const handleSaveGemini = async (e: React.FormEvent) => {
    e.preventDefault();
    saveGeminiModel(geminiModel);
    setIsTestingGemini(true);
    setGeminiStatus(null);
    const result = await testGeminiConnection();
    setIsTestingGemini(false);
    setGeminiStatus(result);
  };

  const handleSaveWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    saveWhatsAppConfig(waConfig);
    setWaSavedStatus('Configurações de WhatsApp salvas com sucesso!');
    setTimeout(() => setWaSavedStatus(null), 3000);
  };

  const handleSaveEmail = (e: React.FormEvent) => {
    e.preventDefault();
    saveEmailConfig(emailConfig);
    setEmailSavedStatus('Configurações de E-mail salvas com sucesso!');
    setTimeout(() => setEmailSavedStatus(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-neutral-950 dark:bg-black text-white flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600/20 text-red-400 rounded-xl border border-red-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Central de Inteligência Artificial & APIs</h3>
                <span className="text-[10px] uppercase font-bold bg-red-600/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30">
                  Google AI Studio + 3 APIs
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Gerencie modelos do Google Gemini e conectores de comunicação do QuaraCRM
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition cursor-pointer text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-6 pt-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('gemini')}
            className={`pb-2.5 px-4 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'gemini'
                ? 'border-red-600 text-red-600 dark:text-red-400 bg-white dark:bg-neutral-900 rounded-t-lg'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-red-500" />
            Google AI Studio (Gemini)
          </button>

          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`pb-2.5 px-4 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'whatsapp'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-neutral-900 rounded-t-lg'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
            WhatsApp API <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded font-bold">Ativa</span>
          </button>

          <button
            onClick={() => setActiveTab('email')}
            className={`pb-2.5 px-4 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'email'
                ? 'border-red-600 text-red-600 dark:text-red-400 bg-white dark:bg-neutral-900 rounded-t-lg'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-red-500" />
            E-mail API <span className="text-[10px] bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 px-1.5 py-0.2 rounded font-bold">Ativa</span>
          </button>

          <button
            onClick={() => setActiveTab('apollo')}
            className={`pb-2.5 px-4 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'apollo'
                ? 'border-neutral-700 text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-900 rounded-t-lg'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-purple-500" />
            Apollo.io API <span className="text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-1.5 py-0.2 rounded font-bold">Servidor</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-neutral-50/50 dark:bg-neutral-950/50">
          {currentUser.role !== 'admin' && currentUser.role !== 'manager' ? (
            <div className="p-8 bg-white dark:bg-neutral-900 border border-red-200 dark:border-red-900/40 rounded-2xl shadow-sm text-center space-y-3 my-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">Gerenciamento Restrito de Integrações e APIs</h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
                Por motivos de segurança e sigilo de credenciais, a visualização e edição de chaves de API, webhooks e credenciais de mensageria são restritas a Administradores e Gestores.
              </p>
            </div>
          ) : (
            <>
              {/* TAB 1: GOOGLE AI STUDIO (GEMINI) */}
              {activeTab === 'gemini' && (
                <form onSubmit={handleSaveGemini} className="space-y-4">
                  <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl p-4 text-xs flex gap-3 text-neutral-800 dark:text-neutral-200">
                    <ShieldCheck className="w-5 h-5 text-red-600 dark:text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                        Google AI Studio — Inteligência Comercial Integrada
                      </h4>
                      <p className="leading-relaxed text-neutral-700 dark:text-neutral-300">
                        O QuaraCRM utiliza os modelos <strong>Gemini 2.5 Flash / Pro</strong> para gerar copys de vendas instantâneas, calcular probabilidade de fechamento (% score de vitória), transcrever atas de reuniões e atuar como Copilot estratégico nos seus cards.
                      </p>
                    </div>
                  </div>

              <div className="p-3.5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-xl text-[11px] text-neutral-600 dark:text-neutral-400 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                <span>
                  Por segurança, a API Key do Google AI Studio não fica salva no navegador. Configure{' '}
                  <code className="bg-white dark:bg-black px-1 py-0.5 rounded font-mono">GEMINI_API_KEY</code> nas variáveis de
                  ambiente do servidor (Vercel → Project Settings → Environment Variables). O envio passa pelo endpoint{' '}
                  <code className="bg-white dark:bg-black px-1 py-0.5 rounded font-mono">/api/integrations/gemini</code>, que só
                  aceita chamadas de usuários autenticados. Sem essa variável, os recursos de IA usam automaticamente um
                  gerador heurístico local.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                  Modelo de Inteligência Artificial
                </label>
                <select
                  value={geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-red-500 text-neutral-900 dark:text-neutral-100 font-semibold"
                >
                  <option value="gemini-2.5-flash">⚡ Gemini 2.5 Flash (Recomendado - Ultrarrápido)</option>
                  <option value="gemini-2.5-pro">🧠 Gemini 2.5 Pro (Raciocínio Comercial Avançado)</option>
                  <option value="gemini-2.0-flash">🚀 Gemini 2.0 Flash</option>
                </select>
              </div>

              {geminiStatus && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                    geminiStatus.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                      : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-300'
                  }`}
                >
                  {geminiStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{geminiStatus.message}</span>
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="submit"
                  disabled={isTestingGemini}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  {isTestingGemini ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Testando Conexão...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Salvar e Testar Google AI
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: WHATSAPP API (ATIVA) */}
          {activeTab === 'whatsapp' && (
            <form onSubmit={handleSaveWhatsApp} className="space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-4 text-xs flex gap-3 text-neutral-800 dark:text-neutral-200">
                <MessageSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                    API de WhatsApp Oficial & Direct Web (Ativa)
                  </h4>
                  <p className="leading-relaxed text-neutral-700 dark:text-neutral-300">
                    Dispare mensagens diretamente para os leads, envie templates de follow-up e sincronize conversas no histórico do card.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                  Modo de Integração WhatsApp
                </label>
                <select
                  value={waConfig.gateway}
                  onChange={(e) => setWaConfig({ ...waConfig, gateway: e.target.value as any })}
                  className="w-full px-3.5 py-2 text-xs bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl font-semibold text-neutral-900 dark:text-neutral-100"
                >
                  <option value="direct_web">📱 WhatsApp Web Direct (Padrão - Sem necessidade de servidor)</option>
                  <option value="evolution_api">⚡ Evolution API / Baileys (Disparo via Backend)</option>
                  <option value="z_api">🔌 Z-API Gateway</option>
                  <option value="custom_webhook">🔗 Webhook Customizado (N8N / Typebot / Make)</option>
                </select>
              </div>

              {waConfig.gateway === 'evolution_api' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">API Endpoint URL</label>
                    <input
                      type="url"
                      placeholder="https://api.seuzap.com.br"
                      value={waConfig.apiUrl || ''}
                      onChange={(e) => setWaConfig({ ...waConfig, apiUrl: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Instance ID</label>
                    <input
                      type="text"
                      placeholder="instancia_quara"
                      value={waConfig.instanceId || ''}
                      onChange={(e) => setWaConfig({ ...waConfig, instanceId: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">API Key</label>
                    <input
                      type="password"
                      placeholder="Chave secreta da API"
                      value={waConfig.apiKey || ''}
                      onChange={(e) => setWaConfig({ ...waConfig, apiKey: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 font-mono"
                    />
                  </div>
                </div>
              )}

              {waConfig.gateway === 'custom_webhook' && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Webhook URL</label>
                  <input
                    type="url"
                    placeholder="https://seu-n8n.com/webhook/whatsapp"
                    value={waConfig.webhookUrl || ''}
                    onChange={(e) => setWaConfig({ ...waConfig, webhookUrl: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 font-mono"
                  />
                </div>
              )}

              {waSavedStatus && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{waSavedStatus}</span>
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  Salvar Configuração de WhatsApp
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: E-MAIL API (ATIVA) */}
          {activeTab === 'email' && (
            <form onSubmit={handleSaveEmail} className="space-y-4">
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl p-4 text-xs flex gap-3 text-neutral-800 dark:text-neutral-200">
                <Mail className="w-5 h-5 text-red-600 dark:text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                    API de Envio de E-mails Transacionais (Ativa)
                  </h4>
                  <p className="leading-relaxed text-neutral-700 dark:text-neutral-300">
                    Envie e-mails diretos, propostas em PDF e follow-ups comerciais aos clientes com tracking de entrega.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                    Provedor de E-mail
                  </label>
                  <select
                    value={emailConfig.provider}
                    onChange={(e) => setEmailConfigState({ ...emailConfig, provider: e.target.value as any })}
                    className="w-full px-3.5 py-2 text-xs bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl font-semibold text-neutral-900 dark:text-neutral-100"
                  >
                    <option value="resend">✉️ Resend.com (Recomendado - API Moderna)</option>
                    <option value="sendgrid">📨 SendGrid API</option>
                    <option value="smtp">⚙️ Servidor SMTP Padrão</option>
                    <option value="custom_webhook">🔗 Webhook Customizado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                    Nome do Remetente
                  </label>
                  <input
                    type="text"
                    placeholder="QuaraCRM Vendas"
                    value={emailConfig.fromName || ''}
                    onChange={(e) => setEmailConfigState({ ...emailConfig, fromName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-xl text-[11px] text-neutral-600 dark:text-neutral-400 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                <span>
                  Por segurança, a API Key do provedor não fica mais salva no navegador. Configure{' '}
                  <code className="bg-white dark:bg-black px-1 py-0.5 rounded font-mono">RESEND_API_KEY</code> nas variáveis de
                  ambiente do servidor (Vercel → Project Settings → Environment Variables). O envio passa pelo endpoint{' '}
                  <code className="bg-white dark:bg-black px-1 py-0.5 rounded font-mono">/api/integrations/email</code>, que só
                  aceita chamadas de usuários autenticados.
                </span>
              </div>

              {emailSavedStatus && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{emailSavedStatus}</span>
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  Salvar Configuração de E-mail
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: APOLLO.IO API (VERSÃO 2.0 GITHUB) */}
          {activeTab === 'apollo' && (
            <div className="space-y-4">
              <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 rounded-xl p-5 text-xs text-neutral-800 dark:text-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                      Apollo.io B2B Intelligence & Enrichment
                    </h4>
                  </div>
                  <span className="px-2.5 py-1 bg-purple-600 text-white font-bold rounded-full text-[10px] tracking-wider uppercase shadow-xs">
                    Servidor (Vercel Function)
                  </span>
                </div>

                <p className="leading-relaxed text-neutral-700 dark:text-neutral-300">
                  O enriquecimento roda no endpoint <code className="bg-white dark:bg-black px-1 py-0.5 rounded font-mono text-[11px]">/api/integrations/apollo</code>,
                  autenticado por sessão do CRM. A chave da Apollo.io fica somente no servidor:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div className="p-3 bg-white dark:bg-neutral-900 rounded-lg border border-purple-200 dark:border-purple-900/40 text-xs">
                    <strong className="text-purple-700 dark:text-purple-300 block mb-1">🔍 Localização de Decisores (C-Level)</strong>
                    <span className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                      Busca automática de Diretores, CEOs e CFOs da empresa com e-mail corporativo verificado.
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-neutral-900 rounded-lg border border-purple-200 dark:border-purple-900/40 text-xs">
                    <strong className="text-purple-700 dark:text-purple-300 block mb-1">🏢 Dados da Empresa & Tecnologias</strong>
                    <span className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                      Porte, faturamento anual estimado, número de funcionários e stack tecnológica usada.
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-neutral-100 dark:bg-neutral-900 rounded-lg border border-neutral-300 dark:border-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-neutral-400" />
                  <span>
                    Configure <code className="bg-white dark:bg-black px-1 py-0.5 rounded font-mono">APOLLO_API_KEY</code> nas
                    variáveis de ambiente do servidor (Vercel) para ativar o enriquecimento real. Sem essa variável, o endpoint
                    responde de forma graciosa informando que a integração ainda não está configurada.
                  </span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-neutral-100 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
          <span>QuaraCRM • Arquitetura Modular de IA & Multi-APIs</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold rounded-lg transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
