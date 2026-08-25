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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-red-950/80 text-red-300 border border-red-800/60 dark:bg-red-950 dark:text-red-300 dark:border-red-800">Admin</span>;
      case 'manager':
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800">Gerente</span>;
      case 'consultant':
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-amber-50 text-amber-700 border border-amber-200 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700">Consultor</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-neutral-100 text-neutral-600 border border-neutral-300 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700">Visualizador</span>;
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

  return (
    <header className="bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800/90 sticky top-0 z-30 transition-colors duration-200">
      {/* Top Navbar */}
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Brand & Workspace Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 to-red-800 dark:from-red-700 dark:to-neutral-950 flex items-center justify-center text-white font-black text-base shadow-sm border border-red-500/30 dark:border-red-900/60">
            Q
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-neutral-900 dark:text-white text-base tracking-tight">
                Quara<span className="text-red-600 dark:text-red-500">CRM</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border border-red-200 dark:border-red-900/60 hidden sm:inline">
                Pipeline B2B
              </span>
            </div>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-sm hidden md:block">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" />
            <input
              type="text"
              id="global-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar oportunidades, contatos ou empresas..."
              className="w-full pl-8 pr-4 py-1.5 bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100/80 dark:hover:bg-neutral-850 focus:bg-white dark:focus:bg-neutral-900 text-xs text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Actions, Theme Toggle & Local Storage Portability */}
        <div className="flex items-center gap-2">
          {/* Google AI & APIs Integration Trigger */}
          <button
            id="btn-integrations-modal"
            type="button"
            onClick={() => setIsIntegrationsModalOpen(true)}
            title="Configurar Google AI Studio (Gemini) e APIs (WhatsApp, E-mail, Apollo v2)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-neutral-700 hover:text-red-600 bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:text-red-400 dark:hover:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-red-600 dark:text-red-500" />
            <span className="hidden sm:inline">IA & APIs</span>
            <span className="text-[9px] font-bold px-1 py-0.2 bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 rounded border border-red-200 dark:border-red-900/60">
              Gemini
            </span>
          </button>

          {/* Supabase Status & Setup Trigger */}
          <button
            id="btn-supabase-modal"
            type="button"
            onClick={() => setIsSupabaseModalOpen(true)}
            title="Conexão com Banco de Dados Supabase em Nuvem"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-neutral-700 hover:text-red-600 bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:text-red-400 dark:hover:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 transition-colors cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
            <span className="hidden md:inline">Supabase</span>
            <span className={`w-2 h-2 rounded-full ${isSupabaseActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
          </button>

          {/* Theme Toggle Button (Light Mode: White & Red / Dark Mode: Black & Dark Red) */}
          <button
            id="btn-theme-toggle"
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Mudar para Modo Claro (Branco & Vermelho)' : 'Mudar para Modo Escuro (Preto & Vermelho Escuro)'}
            className="flex items-center gap-1.5 p-2 rounded-lg text-neutral-600 hover:text-red-600 bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:text-red-400 dark:hover:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden xl:inline text-[11px] font-medium text-neutral-300">Modo Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-red-600" />
                <span className="hidden xl:inline text-[11px] font-medium text-neutral-700">Modo Escuro</span>
              </>
            )}
          </button>

          {/* Local Storage Indicator & JSON Portability Button */}
          <button
            id="btn-local-storage-status"
            onClick={() => setIsExportModalOpen(true)}
            title="Armazenamento no navegador. Clique para Exportar/Importar JSON."
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-850 rounded-lg border border-neutral-200 dark:border-neutral-800 transition-colors cursor-pointer"
          >
            <HardDrive className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            <span className="hidden lg:inline text-[11px] text-neutral-600 dark:text-neutral-400">Local ({cards.length})</span>
            <span className="text-[10px] font-bold text-red-700 bg-red-50 dark:bg-red-950/80 dark:text-red-300 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-900/60">
              Backup JSON
            </span>
          </button>

          {/* New Card Action (Brand Red) */}
          <button
            id="btn-new-card"
            onClick={() => openNewCardModal('mapeados')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 active:bg-red-800 dark:bg-red-700 dark:hover:bg-red-600 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Novo Card</span>
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              id="btn-notifications-toggle"
              onClick={() => {
                setIsNotifDropdownOpen(!isNotifDropdownOpen);
                setIsUserDropdownOpen(false);
              }}
              className="relative p-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-lg transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full ring-2 ring-white dark:ring-neutral-950" />
              )}
            </button>

            {isNotifDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Notificações & SLA</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-[11px] text-red-600 dark:text-red-400 hover:underline font-semibold"
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
                            : 'bg-red-50/50 dark:bg-red-950/30 hover:bg-red-50/80 dark:hover:bg-red-950/50'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {notif.urgency === 'critical' ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
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

          {/* User Role Switcher */}
          <div className="relative">
            <button
              id="btn-user-switcher"
              onClick={() => {
                setIsUserDropdownOpen(!isUserDropdownOpen);
                setIsNotifDropdownOpen(false);
              }}
              className="flex items-center gap-2 p-1 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-lg transition-colors cursor-pointer"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-neutral-300 dark:ring-neutral-700"
              />
              <div className="text-left hidden lg:block">
                <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 leading-tight">{currentUser.name}</p>
                <p className="text-[10px] text-neutral-400 leading-tight">{currentUser.department}</p>
              </div>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>

            {isUserDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl z-50 p-3 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-red-500/30"
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

                {!isSupabaseActive && (
                  <div className="py-2 border-b border-neutral-100 dark:border-neutral-800">
                    <div className="px-1 py-1 mb-1 text-[10px] text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Modo Demonstração (Offline)
                    </div>
                    <div className="space-y-0.5">
                      {users.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => {
                            setCurrentUserId(u.id);
                            setIsUserDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                            u.id === currentUser.id
                              ? 'bg-red-50 dark:bg-red-950/60 text-red-900 dark:text-red-300 font-semibold'
                              : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <img src={u.avatar} alt={u.name} className="w-5 h-5 rounded-full object-cover" />
                            <span className="font-semibold text-neutral-800 dark:text-neutral-200 text-xs">{u.name}</span>
                          </div>
                          {getRoleBadge(u.role)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-2 pt-1">
                  <button
                    id="btn-logout"
                    type="button"
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      signOut();
                    }}
                    className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
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

      {/* Clean Navigation Tabs with Quara Red Accents */}
      <div className="px-4 sm:px-6 flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-950/60">
        <button
          id="nav-tab-kanban"
          onClick={() => setActiveTab('kanban')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'kanban'
              ? 'border-red-600 text-red-600 dark:border-red-500 dark:text-red-400 bg-white/60 dark:bg-neutral-900/60'
              : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
          }`}
        >
          <Kanban className="w-3.5 h-3.5" />
          <span>Kanban (12 Fases)</span>
        </button>

        <button
          id="nav-tab-table"
          onClick={() => setActiveTab('table')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'table'
              ? 'border-red-600 text-red-600 dark:border-red-500 dark:text-red-400 bg-white/60 dark:bg-neutral-900/60'
              : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
          }`}
        >
          <Table className="w-3.5 h-3.5" />
          <span>Tabela</span>
        </button>

        <button
          id="nav-tab-dashboard"
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'dashboard'
              ? 'border-red-600 text-red-600 dark:border-red-500 dark:text-red-400 bg-white/60 dark:bg-neutral-900/60'
              : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Metas & Indicadores</span>
        </button>

        <button
          id="nav-tab-omnichannel"
          onClick={() => setActiveTab('omnichannel')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'omnichannel'
              ? 'border-red-600 text-red-600 dark:border-red-500 dark:text-red-400 bg-white/60 dark:bg-neutral-900/60'
              : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>WhatsApp & Mensagens</span>
        </button>

        <button
          id="nav-tab-automations"
          onClick={() => setActiveTab('automations')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'automations'
              ? 'border-red-600 text-red-600 dark:border-red-500 dark:text-red-400 bg-white/60 dark:bg-neutral-900/60'
              : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Automações</span>
        </button>

        {(currentUser.role === 'admin' || currentUser.role === 'manager') && (
          <button
            id="nav-tab-admin"
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'admin'
                ? 'border-red-600 text-red-600 dark:border-red-500 dark:text-red-400 bg-white/60 dark:bg-neutral-900/60'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        )}

        {(currentUser.role === 'admin' || currentUser.role === 'manager') && (
          <button
            id="nav-tab-audit"
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'audit'
                ? 'border-red-600 text-red-600 dark:border-red-500 dark:text-red-400 bg-white/60 dark:bg-neutral-900/60'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Auditoria</span>
          </button>
        )}
      </div>
    </header>
  );
};
