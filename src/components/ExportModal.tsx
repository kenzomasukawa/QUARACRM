import React, { useState, useRef } from 'react';
import {
  X,
  FileSpreadsheet,
  Download,
  Upload,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  ShieldCheck,
  FileJson,
  Layers,
  Users,
  Database,
  ArrowRight,
  Sparkles,
  Monitor,
  FolderDown,
  Terminal,
  Laptop,
  Lock,
  ShieldAlert,
} from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { exportCardsToCSV, exportAuditLogsToCSV, exportConsultantReportToCSV, validateBackupJSON } from '../utils/exportUtils';
import { CRMBackupData } from '../types/crm';
import { formatDate } from '../utils/formatters';

export const ExportModal: React.FC = () => {
  const {
    isExportModalOpen,
    setIsExportModalOpen,
    cards,
    phases,
    users,
    auditLogs,
    exportFullJSONBackup,
    importFullJSONBackup,
    resetToDefaultData,
    clearAllCards,
    storageInfo,
    currentUser,
  } = useCRM();

  const canExport = Boolean(
    currentUser.permissions?.canExport || currentUser.role === 'admin' || currentUser.role === 'manager'
  );
  const isAdmin = currentUser.role === 'admin';

  const [activeTab, setActiveTab] = useState<'json' | 'csv' | 'desktop' | 'reset'>('json');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<CRMBackupData | null>(null);
  const [importSummary, setImportSummary] = useState<{
    cardsCount: number;
    phasesCount: number;
    usersCount: number;
    automationsCount: number;
    exportedAt?: string;
  } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isExportModalOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportSuccessMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const res = validateBackupJSON(content);
      if (!res.valid || !res.data) {
        setImportError(res.error || 'Arquivo JSON inválido.');
        setParsedData(null);
        setImportSummary(null);
      } else {
        setParsedData(res.data);
        setImportSummary(res.summary || null);
        setImportError(null);
      }
    };
    reader.onerror = () => {
      setImportError('Erro ao ler o arquivo selecionado.');
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = (mode: 'replace' | 'merge') => {
    if (!parsedData) return;
    const res = importFullJSONBackup(parsedData, mode);
    if (res.success) {
      setImportSuccessMsg(res.message);
      setParsedData(null);
      setImportFile(null);
      setImportSummary(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      setImportError(res.message);
    }
  };

  const handleResetDefaults = () => {
    resetToDefaultData();
    setShowResetConfirm(false);
    setImportSuccessMsg('Base local restaurada para os dados padrão com sucesso!');
  };

  const handleClearCards = () => {
    clearAllCards();
    setShowClearConfirm(false);
    setImportSuccessMsg('Todos os cards foram removidos do seu banco local.');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/70 dark:bg-neutral-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 flex items-center justify-center text-red-600 dark:text-red-400">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 leading-tight">Central de Dados & Backups</h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Memória local independente (localStorage)</p>
            </div>
          </div>
          <button
            onClick={() => setIsExportModalOpen(false)}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('json')}
            className={`flex items-center gap-1.5 py-2.5 px-3 text-xs font-medium border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'json'
                ? 'border-red-600 text-red-600 dark:text-red-400 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>Backup JSON (Importar/Exportar)</span>
          </button>
          <button
            onClick={() => setActiveTab('desktop')}
            className={`flex items-center gap-1.5 py-2.5 px-3 text-xs font-medium border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'desktop'
                ? 'border-red-600 text-red-600 dark:text-red-400 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Instalar no Computador (Desktop)</span>
          </button>
          <button
            onClick={() => setActiveTab('csv')}
            className={`flex items-center gap-1.5 py-2.5 px-3 text-xs font-medium border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'csv'
                ? 'border-red-600 text-red-600 dark:text-red-400 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Planilhas Excel / CSV</span>
          </button>
          <button
            onClick={() => setActiveTab('reset')}
            className={`flex items-center gap-1.5 py-2.5 px-3 text-xs font-medium border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'reset'
                ? 'border-red-600 text-red-600 dark:text-red-400 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Redefinir Base</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Notifications / Feedback */}
          {importSuccessMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl flex items-center justify-between gap-2 text-emerald-800 dark:text-emerald-300 animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-medium">{importSuccessMsg}</span>
              </div>
              <button
                onClick={() => setImportSuccessMsg(null)}
                className="text-xs text-emerald-600 hover:text-emerald-900 dark:hover:text-emerald-200 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {importError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-center justify-between gap-2 text-rose-800 dark:text-rose-300 animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>{importError}</span>
              </div>
              <button
                onClick={() => setImportError(null)}
                className="text-xs text-rose-600 hover:text-rose-900 dark:hover:text-rose-200 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* DLP Guard Banner if user cannot export */}
          {!canExport && (activeTab === 'json' || activeTab === 'csv') && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Exportação Bloqueada por Política de Proteção de Dados (DLP)</span>
              </div>
              <p className="text-[11px] text-amber-700/90 dark:text-amber-400 leading-relaxed">
                Seu perfil de acesso atual (<span className="font-semibold capitalize">{currentUser.role}</span>) não possui autorização para download em massa da carteira de clientes ou relatórios comerciais. Para exportar dados, solicite permissão a um Administrador ou Gestor.
              </p>
            </div>
          )}

          {/* TAB 1: JSON BACKUP */}
          {activeTab === 'json' && (
            <div className="space-y-4">
              {/* Info Pill */}
              <div className="p-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800 rounded-xl flex items-center justify-between gap-3 text-neutral-600 dark:text-neutral-400">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>
                    Armazenado no navegador deste computador: <strong className="text-neutral-800 dark:text-neutral-200">{cards.length} cards</strong> ({storageInfo.usedKB} KB usados)
                  </span>
                </div>
                <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500">100% Offline / Privado</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Export Card */}
                <div className="p-4 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl flex flex-col justify-between hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
                  <div>
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-1.5">
                      <Download className="w-4 h-4" />
                      <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">Exportar Backup JSON</h4>
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      Gere um arquivo <code className="bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded text-neutral-700 dark:text-neutral-300 font-mono">.json</code> com todas as oportunidades, perguntas preenchidas, automações e histórico.
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                    <span className="text-[10px] text-neutral-400">{cards.length} registros prontos</span>
                    <button
                      onClick={exportFullJSONBackup}
                      disabled={!canExport}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 active:bg-red-800 text-white font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {canExport ? <Download className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      <span>Baixar JSON</span>
                    </button>
                  </div>
                </div>

                {/* Import Card */}
                <div className="p-4 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl flex flex-col justify-between hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
                  <div>
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-1.5">
                      <Upload className="w-4 h-4" />
                      <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">Importar Backup JSON</h4>
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      Carregue um arquivo salvo anteriormente para restaurar sua base neste ou em outro computador.
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".json"
                      onChange={handleFileChange}
                      className="hidden"
                      id="json-file-input"
                    />
                    <label
                      htmlFor="json-file-input"
                      className="w-full py-1.5 px-3 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-850 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors text-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{importFile ? importFile.name : 'Selecionar Arquivo .json'}</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Import Preview and Actions */}
              {parsedData && importSummary && (
                <div className="p-4 bg-red-50/40 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60 rounded-xl space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-red-900 dark:text-red-200 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <span>Arquivo validado com sucesso</span>
                    </div>
                    {importSummary.exportedAt && (
                      <span className="text-[10px] text-red-600 dark:text-red-400">
                        Exportado em: {formatDate(importSummary.exportedAt)}
                      </span>
                    )}
                  </div>

                  {/* Summary Grid */}
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2 bg-white dark:bg-neutral-900 rounded-lg border border-red-100 dark:border-neutral-800">
                      <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{importSummary.cardsCount}</div>
                      <div className="text-[10px] text-neutral-500">Cards</div>
                    </div>
                    <div className="p-2 bg-white dark:bg-neutral-900 rounded-lg border border-red-100 dark:border-neutral-800">
                      <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{importSummary.phasesCount}</div>
                      <div className="text-[10px] text-neutral-500">Fases</div>
                    </div>
                    <div className="p-2 bg-white dark:bg-neutral-900 rounded-lg border border-red-100 dark:border-neutral-800">
                      <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{importSummary.usersCount}</div>
                      <div className="text-[10px] text-neutral-500">Usuários</div>
                    </div>
                    <div className="p-2 bg-white dark:bg-neutral-900 rounded-lg border border-red-100 dark:border-neutral-800">
                      <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{importSummary.automationsCount}</div>
                      <div className="text-[10px] text-neutral-500">Regras</div>
                    </div>
                  </div>

                  <p className="text-[11px] text-neutral-700 dark:text-neutral-300">
                    Como deseja carregar estes dados no seu navegador?
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      onClick={() => handleExecuteImport('replace')}
                      className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white font-medium rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Substituir Base Atual</span>
                    </button>
                    <button
                      onClick={() => handleExecuteImport('merge')}
                      className="px-3.5 py-1.5 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-750 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 font-medium rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Mesclar com Dados Atuais</span>
                    </button>
                    <button
                      onClick={() => {
                        setParsedData(null);
                        setImportFile(null);
                        setImportSummary(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="px-2.5 py-1.5 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 text-xs ml-auto cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CSV / SPREADSHEETS */}
          {activeTab === 'csv' && (
            <div className="space-y-3">
              <p className="text-neutral-500 dark:text-neutral-400 text-xs">
                Exporte relatórios formatados em UTF-8 com suporte nativo ao Microsoft Excel e Google Sheets:
              </p>

              {/* Option 1 */}
              <div className="p-3 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl flex items-center justify-between gap-3 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
                <div>
                  <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">Pipeline Completo de Oportunidades</h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Todos os {cards.length} cards com campos customizados das 12 fases (dores, propostas, follow-ups).
                  </p>
                </div>
                <button
                  onClick={() => exportCardsToCSV(cards, phases, users)}
                  disabled={!canExport}
                  className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-white font-medium rounded-lg flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {canExport ? <Download className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  <span>CSV</span>
                </button>
              </div>

              {/* Option 2 */}
              <div className="p-3 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl flex items-center justify-between gap-3 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
                <div>
                  <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">Produtividade & Metas dos Consultores</h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Metas mensais, volume realizado em R$, taxas de conversão e fechamentos por vendedor.
                  </p>
                </div>
                <button
                  onClick={() => exportConsultantReportToCSV(users, cards)}
                  disabled={!canExport}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white font-medium rounded-lg flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {canExport ? <Download className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  <span>CSV</span>
                </button>
              </div>

              {/* Option 3 */}
              <div className="p-3 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl flex items-center justify-between gap-3 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
                <div>
                  <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">Trilha de Auditoria & Compliance</h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Histórico de {auditLogs.length} logs com movimentações, disparos e alterações.
                  </p>
                </div>
                <button
                  onClick={() => exportAuditLogsToCSV(auditLogs)}
                  disabled={!canExport}
                  className="px-3 py-1.5 bg-neutral-700 hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-white font-medium rounded-lg flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {canExport ? <Download className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  <span>CSV</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB: DESKTOP INSTALLATION & OFFLINE WORKSTATION */}
          {activeTab === 'desktop' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-red-50/50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 rounded-xl">
                <div className="flex items-center gap-2 text-red-900 dark:text-red-200 font-bold mb-1">
                  <Monitor className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                  <span>Operação 100% Local no Computador (Sem Servidor na Nuvem)</span>
                </div>
                <p className="text-[11px] text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  O QuaraCRM foi desenvolvido com arquitetura <strong>Local-First</strong>. Cada membro da equipe pode usar em sua própria máquina, gravando seus dados no disco/navegador local com privacidade total.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Method 1: PWA Desktop App */}
                <div className="p-4 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl flex flex-col justify-between hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
                  <div>
                    <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100 font-semibold mb-2">
                      <div className="w-6 h-6 rounded-md bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 flex items-center justify-center text-xs font-bold">1</div>
                      <h4>Instalar como App no Desktop (PWA)</h4>
                    </div>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed mb-3">
                      Abre como um aplicativo nativo na barra de tarefas do Windows ou Mac sem precisar de instaladores:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-neutral-500 dark:text-neutral-400 font-normal">
                      <li>Abra no <strong>Chrome</strong> ou <strong>Edge</strong>.</li>
                      <li>Clique no menu (3 pontinhos) no topo direito.</li>
                      <li>Selecione <strong>"Instalar QuaraCRM..."</strong> ou <strong>"Criar atalho"</strong> marcando <em>"Abrir como janela"</em>.</li>
                    </ol>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800 text-[10px] text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Recomendado para o dia a dia
                  </div>
                </div>

                {/* Method 2: Offline Folder / Code Export */}
                <div className="p-4 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl flex flex-col justify-between hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
                  <div>
                    <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100 font-semibold mb-2">
                      <div className="w-6 h-6 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center text-xs font-bold">2</div>
                      <h4>Rodar Offline na Máquina (ZIP / Local)</h4>
                    </div>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed mb-3">
                      Para executar 100% offline em redes corporativas fechadas:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-neutral-500 dark:text-neutral-400 font-normal">
                      <li>Baixe o projeto pelo menu <strong>Export &gt; Download ZIP</strong>.</li>
                      <li>Extraia a pasta no computador do consultor.</li>
                      <li>Execute <code className="bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded font-mono text-neutral-700 dark:text-neutral-300">npm run build</code> e sirva a pasta <code className="bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded font-mono text-neutral-700 dark:text-neutral-300">dist/</code>.</li>
                    </ol>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800 text-[10px] text-neutral-500 flex items-center gap-1">
                    <HardDrive className="w-3.5 h-3.5 text-neutral-400" /> Funciona sem conexão com a internet
                  </div>
                </div>
              </div>

              {/* Team Sharing Strategy */}
              <div className="p-3.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl space-y-2">
                <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                  <span>Como compartilhar e consolidar dados entre os membros da área:</span>
                </h4>
                <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  1. O consultor clica em <strong>"Baixar JSON"</strong> na aba Backup JSON e envia o arquivo para o gestor.<br/>
                  2. O gestor abre o QuaraCRM em sua máquina e clica em <strong>"Importar Backup JSON"</strong> &gt; <strong>"Mesclar com Dados Atuais"</strong>.<br/>
                  3. Os cards são consolidados instantaneamente, atualizando o painel geral de metas da área!
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: RESET / DATABASE MAINTENANCE */}
          {activeTab === 'reset' && (
            <div className="space-y-3">
              {!isAdmin ? (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                    <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Manutenção e Reset Restritos ao Administrador</span>
                  </div>
                  <p className="text-[11px] text-amber-700/90 dark:text-amber-400 leading-relaxed">
                    Apenas administradores do sistema possuem autorização para resetar ou limpar dados da base comercial.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-neutral-500 dark:text-neutral-400 text-xs">
                    Controles de manutenção para a memória local do seu navegador:
                  </p>

                  {/* Reset to Mock Data */}
                  <div className="p-3.5 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">Restaurar Dados Padrão</h4>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          Recarrega a estrutura e os cards de demonstração iniciais.
                        </p>
                      </div>
                      {!showResetConfirm ? (
                        <button
                          onClick={() => setShowResetConfirm(true)}
                          className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-700 dark:text-neutral-300 font-medium rounded-lg flex items-center gap-1.5 cursor-pointer text-xs transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Restaurar</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleResetDefaults}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs cursor-pointer"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setShowResetConfirm(false)}
                            className="px-2 py-1 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 text-xs cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Clear All Cards */}
                  <div className="p-3.5 bg-white dark:bg-neutral-950 border border-rose-200/70 dark:border-rose-900/60 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-rose-900 dark:text-rose-300">Limpar Todos os Cards</h4>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          Remove todos os cards do funil para começar um pipeline do zero.
                        </p>
                      </div>
                      {!showClearConfirm ? (
                        <button
                          onClick={() => setShowClearConfirm(true)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 font-medium rounded-lg flex items-center gap-1.5 cursor-pointer text-xs transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Limpar Cards</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleClearCards}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs cursor-pointer"
                          >
                            Confirmar Limpeza
                          </button>
                          <button
                            onClick={() => setShowClearConfirm(false)}
                            className="px-2 py-1 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 text-xs cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Dados armazenados exclusivamente no seu navegador (sem tracking)</span>
          </div>
          <button
            onClick={() => setIsExportModalOpen(false)}
            className="px-3.5 py-1 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-750 text-neutral-700 dark:text-neutral-300 font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
