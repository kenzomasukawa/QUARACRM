import React, { useState } from 'react';
import {
  Database,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Zap,
  Server,
  Layers,
  ArrowRight,
  Info,
  Sliders,
  Code2,
  Lock,
} from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { getSupabaseSchemaSQL } from '../services/leadsService';

export const SupabaseSetupModal: React.FC = () => {
  const {
    supabaseConfig,
    isSupabaseActive,
    saveSupabaseSettings,
    disconnectSupabase,
    syncToSupabase,
    isSupabaseModalOpen,
    setIsSupabaseModalOpen,
    totalLeadsCount,
    cards,
  } = useCRM();

  const [url, setUrl] = useState(supabaseConfig.url || '');
  const [anonKey, setAnonKey] = useState(supabaseConfig.anonKey || '');
  const [activeTab, setActiveTab] = useState<'config' | 'schema' | 'sync'>('config');
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSQL, setCopiedSQL] = useState(false);

  if (!isSupabaseModalOpen) return null;

  const sqlSchema = getSupabaseSchemaSQL();

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !anonKey.trim()) {
      setTestResult({ success: false, message: 'Preencha a URL e a Anon Key do Supabase.' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const result = await saveSupabaseSettings(url.trim(), anonKey.trim());
    setIsTesting(false);
    setTestResult(result);
  };

  const handleSyncData = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    const result = await syncToSupabase();
    setIsSyncing(false);
    setSyncResult(result);
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSQL(true);
    setTimeout(() => setCopiedSQL(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Integração com Supabase</h3>
                {isSupabaseActive ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Ativo & Conectado
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-medium bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                    Modo Local (Offline)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Persistência em nuvem de alta escala com tabelas indexadas e paginação
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSupabaseModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2">
          <button
            onClick={() => setActiveTab('config')}
            className={`pb-2.5 px-4 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'config'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Configuração de Acesso
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`pb-2.5 px-4 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'schema'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Script SQL (DDL & Tabelas)
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`pb-2.5 px-4 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'sync'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Migração de Dados ({cards.length} cards)
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {activeTab === 'config' && (
            <form onSubmit={handleTestAndSave} className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 flex gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-emerald-950 mb-1">Arquitetura de Alto Volume</h4>
                  <p className="text-emerald-800 leading-relaxed">
                    Com o Supabase conectado, o CRM armazena dados na tabela <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono font-semibold">leads</code> e carrega o histórico de conversas sob demanda da tabela <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono font-semibold">lead_interactions</code>. Isso garante rapidez mesmo com dezenas de milhares de leads.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Project URL (ex: https://xyz.supabase.co)
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://sua-instancia.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Anon / Public API Key
                </label>
                <input
                  type="password"
                  required
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Encontre estes valores no painel do Supabase em: <strong>Project Settings → API</strong>.
                </p>
              </div>

              {testResult && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                    testResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                {isSupabaseActive ? (
                  <button
                    type="button"
                    onClick={disconnectSupabase}
                    className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition"
                  >
                    Desconectar Supabase
                  </button>
                ) : (
                  <div></div>
                )}

                <button
                  type="submit"
                  disabled={isTesting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition disabled:opacity-50"
                >
                  {isTesting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Testando conexão...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Salvar e Conectar
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'schema' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Script SQL para o Supabase SQL Editor
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Crie as tabelas <code className="font-mono font-semibold text-slate-700">leads</code> e <code className="font-mono font-semibold text-slate-700">lead_interactions</code> com índices de alto desempenho.
                  </p>
                </div>
                <button
                  onClick={handleCopySQL}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-2xs"
                >
                  {copiedSQL ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copiar SQL
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <pre className="bg-slate-900 text-slate-200 text-xs p-4 rounded-xl font-mono overflow-x-auto max-h-72 border border-slate-800 leading-relaxed">
                  {sqlSchema}
                </pre>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Como aplicar:</strong> Abra o painel do seu projeto no Supabase, clique em <strong>SQL Editor</strong> no menu lateral esquerdo, cole o script acima e clique em <strong>Run</strong>.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'sync' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
                <h4 className="text-sm font-bold text-slate-800">
                  Sincronização & Migração de Dados
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Você possui atualmente <strong>{cards.length} cards</strong> com histórico e mensagens no armazenamento local. Clique abaixo para enviar todos os dados para o Supabase, preenchendo as tabelas <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">leads</code> e <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">lead_interactions</code>.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
                    <span className="text-[11px] text-slate-500 block">Total de Leads Locais</span>
                    <span className="text-lg font-bold text-slate-800">{cards.length}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
                    <span className="text-[11px] text-slate-500 block">Status do Supabase</span>
                    <span className={`text-sm font-bold ${isSupabaseActive ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {isSupabaseActive ? 'Pronto para sincronizar' : 'Não conectado'}
                    </span>
                  </div>
                </div>

                {syncResult && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                      syncResult.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    {syncResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{syncResult.message}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={handleSyncData}
                    disabled={isSyncing || !isSupabaseActive}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition disabled:opacity-50"
                  >
                    {isSyncing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Migrando leads para Supabase...
                      </>
                    ) : (
                      <>
                        <Layers className="w-4 h-4" />
                        Migrar {cards.length} Leads para Supabase
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-slate-500" />
            <span>
              {isSupabaseActive ? 'Banco de dados ativo via REST / WebSockets' : 'Persistência local ativa'}
            </span>
          </div>
          <button
            onClick={() => setIsSupabaseModalOpen(false)}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
