import React, { useState } from 'react';
import {
  Kanban,
  Table,
  BarChart3,
  MessageSquare,
  Zap,
  Shield,
  FileText,
  Plus,
  Search,
  Bell,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  ChevronDown,
  UserCheck,
  Download,
  Sun,
  Moon,
  Sparkles,
  Database,
  LogOut,
  Share2,
  Settings,
  HelpCircle,
  Layers,
  Link as LinkIcon,
  SlidersHorizontal,
  Workflow,
  Mail,
  PanelLeft,
} from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { useAuth } from '../context/AuthContext';
import { formatTimeAgo } from '../utils/formatters';

interface HeaderProps {
  activeTab?: 'kanban' | 'table' | 'dashboard' | 'omnichannel' | 'automations' | 'admin' | 'audit';
  setActiveTab?: (tab: 'kanban' | 'table' | 'dashboard' | 'omnichannel' | 'automations' | 'admin' | 'audit') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab: propActiveTab, setActiveTab: propSetActiveTab }) => {
  const {
    currentView,
    setCurrentView,
    currentUser,
    setCurrentUserId,
    users,
    unreadCount,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    searchQuery,
    setSearchQuery,
    openNewCardModal,
    setIsExportModalOpen,
    setIsSupabaseModalOpen,
    setIsIntegrationsModalOpen,
    isSupabaseActive,
    setSelectedCard,
    cards,
    storageInfo,
    theme,
    toggleTheme,
  } = useCRM();

  const { authUser, signOut } = useAuth();

  const activeTab = propActiveTab || currentView;
  const setActiveTab = propSetActiveTab || setCurrentView;

  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isConnectionsDropdownOpen, setIsConnectionsDropdownOpen] = useState(false);
  const [showPipeInfo, setShowPipeInfo] = useState(false);
  const [copiedFormLink, setCopiedFormLink] = useState(false);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800">
            Admin
          </span>
        );
      case 'manager':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800">
            Gerente
          </span>
        );
      case 'consultant':
        return (
          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-amber-50 text-amber-700 border border-amber-200 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700">
            Consultor
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-neutral-100 text-neutral-600 border border-neutral-300 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700">
            Visualizador
          </span>
        );
    }
  };

  const handleNotificationClick = (cardId?: string, notifId?: string) => {
    if (notifId) markNotificationRead(notifId);
    if (cardId) {
      const card = cards.find((c) => c.id === cardId);
      if (card) {
        setSelectedCard(card);
        setIsNotifDropdownOpen(false);
      }
    }
  };

  const handleShareForm = () => {
    openNewCardModal('mapeados');
    setCopiedFormLink(true);
    setTimeout(() => setCopiedFormLink(false), 2500);
  };

  return (
    <header className="bg-white dark:bg-neutral-950 border-b border-neutral-200/90 dark:border-neutral-800/90 sticky top-0 z-30 transition-colors duration-200">
      {/* 1. PIPEFY TOP ROW */}
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-850">
        {/* Left Side: Brand, Pipe Name & Action Pills */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Pipefy Logo Style: Ribbon Badge + Brand */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-rose-500 hover:bg-rose-600 transition-colors text-white flex items-center justify-center font-black text-sm shadow-xs cursor-pointer">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-neutral-900 dark:text-white text-base tracking-tight hidden sm:inline">
              quara<span className="text-rose-500 font-extrabold">crm</span>
            </span>
          </div>

          <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-800 hidden sm:block shrink-0" />

          {/* Pipe Icon & Pipe Title */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-md bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-500 shrink-0">
              <Layers className="w-3.5 h-3.5" />
            </div>

            <div className="flex items-center gap-1.5 truncate">
              <h1 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 truncate tracking-tight">
                3ª OKR Comercial 2026
              </h1>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPipeInfo(!showPipeInfo)}
                  className="p-1 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                  title="Informações do Pipe"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>

                {showPipeInfo && (
                  <div className="absolute left-0 top-full mt-2 w-72 p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl z-50 text-xs space-y-1.5 animate-in fade-in">
                    <div className="font-bold text-neutral-900 dark:text-white flex items-center justify-between">
                      <span>3ª OKR Comercial 2026</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400 font-semibold">
                        Ativo
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      Funil comercial oficial com 12 fases padronizadas, metas mensais por consultor, inteligência Gemini AI e auditoria de transições.
                    </p>
                    <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[10px] text-neutral-400 flex items-center justify-between">
                      <span>Total de cards: {cards.length}</span>
                      <span>100% Sincronizado</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Pills (Pipefy Style) */}
          <div className="hidden lg:flex items-center gap-1.5 ml-2">
            <button
              type="button"
              onClick={() => setActiveTab('kanban')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'kanban'
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60'
                  : 'bg-neutral-100 hover:bg-neutral-200/80 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Pipe</span>
            </button>

            <button
              type="button"
              onClick={() => setIsIntegrationsModalOpen(true)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-neutral-100 hover:bg-neutral-200/80 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Zap className="w-3 h-3 text-amber-500" />
              <span>Integrações</span>
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsConnectionsDropdownOpen(!isConnectionsDropdownOpen)}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-neutral-100 hover:bg-neutral-200/80 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <LinkIcon className="w-3 h-3 text-rose-500" />
                <span>Conexões</span>
                <ChevronDown className="w-3 h-3 text-neutral-400" />
              </button>

              {isConnectionsDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-60 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl z-50 p-2 text-xs space-y-1 animate-in fade-in">
                  <button
                    onClick={() => {
                      setIsConnectionsDropdownOpen(false);
                      setIsSupabaseModalOpen(true);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-emerald-500" />
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">Supabase Cloud</span>
                    </div>
                    <span className={`w-2 h-2 rounded-full ${isSupabaseActive ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                  </button>

                  <button
                    onClick={() => {
                      setIsConnectionsDropdownOpen(false);
                      setIsExportModalOpen(true);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-rose-500" />
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">Backup JSON & CSV</span>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-mono">{storageInfo.usedKB} KB</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Compartilhar formulário, Gerenciar, Notificações, Tema & Avatar */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Compartilhar Formulário */}
          <button
            type="button"
            onClick={handleShareForm}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-700 hover:text-rose-600 bg-neutral-100 hover:bg-rose-50 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-rose-950/50 dark:hover:text-rose-300 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/60 transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-rose-500" />
            <span>{copiedFormLink ? 'Aberto!' : 'Compartilhar formulário'}</span>
          </button>

          {/* Gerenciar (Admin / Configurações) */}
          {(currentUser.role === 'admin' || currentUser.role === 'manager') && (
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-700 hover:text-rose-600 bg-neutral-100 hover:bg-rose-50 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-rose-950/50 dark:hover:text-rose-300 transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-neutral-500" />
              <span>Gerenciar</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button
            id="btn-theme-toggle"
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Mudar para Modo Claro (Vermelho Claro & Branco)' : 'Mudar para Modo Escuro'}
            className="p-2 rounded-lg text-neutral-500 hover:text-rose-600 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-rose-500" />}
          </button>

          {/* Notifications Bell (Pipefy style with Red counter) */}
          <div className="relative">
            <button
              id="btn-notifications-toggle"
              type="button"
              onClick={() => {
                setIsNotifDropdownOpen(!isNotifDropdownOpen);
                setIsUserDropdownOpen(false);
              }}
              className="relative p-2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-lg transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-neutral-950 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {isNotifDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Notificações & SLA</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline font-semibold cursor-pointer"
                    >
                      Marcar lidas
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-neutral-400 text-xs">
                      Nenhuma notificação no momento.
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif.cardId, notif.id)}
                        className={`p-3 text-left transition-colors cursor-pointer flex items-start gap-2.5 ${
                          notif.read
                            ? 'bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-850'
                            : 'bg-rose-50/50 dark:bg-rose-950/30 hover:bg-rose-50/80 dark:hover:bg-rose-950/50'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {notif.urgency === 'critical' ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                          ) : notif.type === 'deal_won' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Info className="w-3.5 h-3.5 text-amber-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">{notif.title}</p>
                          <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5 line-clamp-2">{notif.message}</p>
                          <span className="text-[10px] text-neutral-400 mt-1 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {formatTimeAgo(notif.timestamp)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar */}
          <div className="relative">
            <button
              id="btn-user-switcher"
              type="button"
              onClick={() => {
                setIsUserDropdownOpen(!isUserDropdownOpen);
                setIsNotifDropdownOpen(false);
              }}
              className="flex items-center gap-1.5 p-1 rounded-full hover:ring-2 hover:ring-rose-400/40 transition-all cursor-pointer"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-neutral-300 dark:ring-neutral-700"
              />
            </button>

            {isUserDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl z-50 p-3 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-rose-500/30"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">{currentUser.email || authUser?.email}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      {getRoleBadge(currentUser.role)}
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-medium">
                        {currentUser.department}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="py-2.5 space-y-1.5 text-[11px] border-b border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                    <span>Nível de Acesso:</span>
                    <span className="font-semibold text-neutral-700 dark:text-neutral-200 capitalize">{currentUser.role}</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                    <span>Exportação de Dados:</span>
                    <span className={`font-semibold ${currentUser.permissions?.canExport ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-400'}`}>
                      {currentUser.permissions?.canExport ? 'Autorizado' : 'Restrito'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                    <span>Proteção da Sessão:</span>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Supabase RLS
                    </span>
                  </div>
                </div>

                <div className="mt-2 pt-1">
                  <button
                    id="btn-logout"
                    type="button"
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      signOut();
                    }}
                    className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sair com Segurança
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. PIPEFY SUBHEADER: TABS ON LEFT + SEARCH PILL & FILTER ON RIGHT */}
      <div className="px-4 sm:px-6 py-1.5 flex items-center justify-between gap-4 bg-white dark:bg-neutral-950 overflow-x-auto no-scrollbar">
        {/* Navigation Tabs (Kanban, Lista, Relatórios, Formulário, Emails, Painéis, Admin, Auditoria) */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            id="nav-tab-kanban"
            onClick={() => setActiveTab('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'kanban'
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Kanban</span>
          </button>

          <button
            id="nav-tab-table"
            onClick={() => setActiveTab('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'table'
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Lista</span>
          </button>

          <button
            id="nav-tab-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Relatórios</span>
          </button>

          <button
            type="button"
            onClick={handleShareForm}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Formulário</span>
          </button>

          <button
            id="nav-tab-omnichannel"
            onClick={() => setActiveTab('omnichannel')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'omnichannel'
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Emails & Zap</span>
          </button>

          <button
            id="nav-tab-automations"
            onClick={() => setActiveTab('automations')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'automations'
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
            <span>Painéis</span>
          </button>

          {(currentUser.role === 'admin' || currentUser.role === 'manager') && (
            <>
              <button
                id="nav-tab-admin"
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>

              <button
                id="nav-tab-audit"
                onClick={() => setActiveTab('audit')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'audit'
                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Auditoria</span>
              </button>
            </>
          )}
        </div>

        {/* Right Search Input & Filters (Pipefy Pill Search) */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              id="global-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Procurar cards"
              className="w-44 sm:w-56 pl-8 pr-6 py-1 text-xs bg-neutral-50 dark:bg-neutral-900 hover:bg-white dark:hover:bg-neutral-850 focus:bg-white dark:focus:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border border-neutral-300/80 dark:border-neutral-700 rounded-full focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder:text-neutral-400 text-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
