import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from './AuthContext';
import {
  User,
  PhaseConfig,
  PhaseId,
  CRMCard,
  AutomationRule,
  NotificationItem,
  AuditLogEntry,
  CardMessage,
  CardAuditHistory,
  CardCustomData,
  CRMBackupData,
  LeadInteraction,
  SupabaseConfig,
  LeadFilterParams,
  PaginatedLeadsResponse,
} from '../types/crm';
import {
  INITIAL_USERS,
  INITIAL_PHASES,
  INITIAL_CARDS,
  INITIAL_AUTOMATIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
} from '../data/initialData';
import { exportAllToJSON, getLocalStorageSizeKB } from '../utils/exportUtils';
import { isSupabaseEnvConfigured } from '../lib/supabase';
import { getSupabaseCredentials } from '../services/supabaseClient';
import {
  fetchAllLeads,
  fetchLeadInteractions,
  createLeadInSupabase,
  updateLeadInSupabase,
  moveLeadPhaseInSupabase,
  addLeadInteractionToSupabase,
  deleteLeadFromSupabase,
  migrateCardsToSupabase,
  getSupabaseSchemaSQL,
} from '../services/leadsService';

export interface PendingTransition {
  card: CRMCard;
  targetPhaseId: PhaseId;
  onSuccess?: () => void;
}

interface CRMContextType {
  // Current user and roles
  currentUser: User;
  setCurrentUserId: (id: string) => void;
  users: User[];
  updateUserGoal: (userId: string, monthlyGoalValue: number, monthlyGoalLeads: number) => void;
  updateUserPermissions: (userId: string, permissions: Partial<NonNullable<User['permissions']>>) => void;
  addUser: (user: Omit<User, 'id'>) => void;

  // Phases
  phases: PhaseConfig[];
  updatePhaseConfig: (phaseId: PhaseId, updates: Partial<PhaseConfig>) => void;
  addPhaseField: (phaseId: PhaseId, field: any) => void;

  // Cards
  cards: CRMCard[];
  selectedCard: CRMCard | null;
  setSelectedCard: (card: CRMCard | null) => void;
  createCard: (cardData: Partial<CRMCard>) => Promise<CRMCard>;
  updateCard: (id: string, updates: Partial<CRMCard>, auditDetails?: string) => Promise<void>;
  moveCardPhase: (cardId: string, targetPhaseId: PhaseId, additionalFields?: CardCustomData) => Promise<boolean>;
  deleteCard: (id: string) => Promise<void>;

  // Phase Transition Rules & Modal Control
  pendingTransition: PendingTransition | null;
  requestPhaseTransition: (card: CRMCard, targetPhaseId: PhaseId, onSuccess?: () => void) => void;
  cancelPhaseTransition: () => void;

  // On-demand Lead Interactions (from lead_interactions table)
  currentLeadInteractions: LeadInteraction[];
  isLoadingInteractions: boolean;
  loadLeadInteractions: (leadId: string) => Promise<void>;
  addLeadInteraction: (leadId: string, interaction: Partial<LeadInteraction>) => Promise<void>;

  // Communications & Messages
  sendCardMessage: (cardId: string, message: Omit<CardMessage, 'id' | 'timestamp'>) => Promise<void>;
  toggleChecklistItem: (cardId: string, itemId: string) => void;
  addChecklistItem: (cardId: string, text: string) => void;

  // Automations
  automations: AutomationRule[];
  toggleAutomation: (id: string) => void;
  addAutomation: (rule: Omit<AutomationRule, 'id' | 'executionCount'>) => void;
  deleteAutomation: (id: string) => void;

  // Notifications
  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  unreadCount: number;

  // Audit Logs
  auditLogs: AuditLogEntry[];
  addAuditLog: (action: AuditLogEntry['action'], details: string, cardId?: string, cardTitle?: string) => void;

  // Global filters & Pagination
  activeFilterConsultant: string | 'all';
  setActiveFilterConsultant: (id: string | 'all') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activePriorityFilter: string | 'all';
  setActivePriorityFilter: (priority: string | 'all') => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  totalLeadsCount: number;
  totalPages: number;
  phaseCounts: Record<PhaseId, number>;
  pipelineStats: {
    totalPipelineValue: number;
    totalWonValue: number;
    totalWonCount: number;
    totalLostCount: number;
  };
  isLoadingLeads: boolean;
  refreshLeads: () => Promise<void>;

  // Supabase Status & Setup
  supabaseConfig: SupabaseConfig;
  isSupabaseActive: boolean;
  syncToSupabase: () => Promise<{ success: boolean; message: string }>;
  isSupabaseModalOpen: boolean;
  setIsSupabaseModalOpen: (open: boolean) => void;
  isIntegrationsModalOpen: boolean;
  setIsIntegrationsModalOpen: (open: boolean) => void;

  // View Navigation
  currentView: 'kanban' | 'table' | 'dashboard' | 'omnichannel' | 'automations' | 'admin' | 'audit';
  setCurrentView: (view: 'kanban' | 'table' | 'dashboard' | 'omnichannel' | 'automations' | 'admin' | 'audit') => void;

  // Local Storage, JSON Backup & Portability
  exportFullJSONBackup: () => void;
  importFullJSONBackup: (backup: CRMBackupData, mode?: 'replace' | 'merge') => { success: boolean; message: string; cardsCount: number };
  resetToDefaultData: () => void;
  clearAllCards: () => void;
  storageInfo: { usedKB: number; itemsCount: number };

  // UI Modals & Theme
  isNewCardModalOpen: boolean;
  setIsNewCardModalOpen: (open: boolean) => void;
  newCardDefaultPhase: PhaseId;
  openNewCardModal: (phaseId?: PhaseId) => void;
  isExportModalOpen: boolean;
  setIsExportModalOpen: (open: boolean) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'quaracrm_app_v2_';
const LEGACY_STORAGE_PREFIX = 'pipecrm_app_v2_';

export const CRMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Authenticated Supabase user — the real identity behind assigned_user_id / RLS.
  // App.tsx only mounts CRMProvider once a session exists, so this is always set.
  const { authUser } = useAuth();
  const consultorId = authUser?.id || '';

  // Theme Management (Dark Mode: Black & Dark Red / Light Mode: White & Red)
  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'theme') || localStorage.getItem('quaracrm_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'dark'; // Default to company dark mode (Preto + Vermelho Escuro)
  });

  const setTheme = (newTheme: 'dark' | 'light') => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY_PREFIX + 'theme', newTheme);
    localStorage.setItem('quaracrm_theme', newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
      document.body.className = 'bg-neutral-950 text-neutral-100 antialiased selection:bg-red-600 selection:text-white transition-colors duration-200';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
      document.body.className = 'bg-neutral-100/70 text-neutral-900 antialiased selection:bg-red-500 selection:text-white transition-colors duration-200';
    }
  }, [theme]);

  // Load initial settings
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'users') || localStorage.getItem(LEGACY_STORAGE_PREFIX + 'users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUserId, setCurrentUserIdState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_PREFIX + 'current_user_id') || localStorage.getItem(LEGACY_STORAGE_PREFIX + 'current_user_id') || 'user_admin';
  });

  const [phases, setPhases] = useState<PhaseConfig[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'phases') || localStorage.getItem(LEGACY_STORAGE_PREFIX + 'phases');
    return saved ? JSON.parse(saved) : INITIAL_PHASES;
  });

  const [cards, setCards] = useState<CRMCard[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'cards') || localStorage.getItem(LEGACY_STORAGE_PREFIX + 'cards');
    return saved ? JSON.parse(saved) : INITIAL_CARDS;
  });

  const [automations, setAutomations] = useState<AutomationRule[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'automations') || localStorage.getItem(LEGACY_STORAGE_PREFIX + 'automations');
    return saved ? JSON.parse(saved) : INITIAL_AUTOMATIONS;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'notifications') || localStorage.getItem(LEGACY_STORAGE_PREFIX + 'notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'audit_logs') || localStorage.getItem(LEGACY_STORAGE_PREFIX + 'audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  // Navigation View
  const [currentView, setCurrentView] = useState<'kanban' | 'table' | 'dashboard' | 'omnichannel' | 'automations' | 'admin' | 'audit'>('kanban');

  // Selected Card Modal & Transition Modal
  const [selectedCard, setSelectedCard] = useState<CRMCard | null>(null);
  const [isNewCardModalOpen, setIsNewCardModalOpen] = useState(false);
  const [newCardDefaultPhase, setNewCardDefaultPhase] = useState<PhaseId>('mapeados');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isIntegrationsModalOpen, setIsIntegrationsModalOpen] = useState(false);
  const [pendingTransition, setPendingTransition] = useState<PendingTransition | null>(null);

  const requestPhaseTransition = (
    card: CRMCard,
    targetPhaseId: PhaseId,
    onSuccess?: () => void
  ) => {
    if (card.phaseId === targetPhaseId) return;
    setPendingTransition({
      card,
      targetPhaseId,
      onSuccess,
    });
  };

  const cancelPhaseTransition = () => {
    setPendingTransition(null);
  };

  // Filters & Pagination
  const [activeFilterConsultant, setActiveFilterConsultant] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activePriorityFilter, setActivePriorityFilter] = useState<string | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [totalLeadsCount, setTotalLeadsCount] = useState(INITIAL_CARDS.length);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);

  // On-demand lead interactions for the currently selected card
  const [currentLeadInteractions, setCurrentLeadInteractions] = useState<LeadInteraction[]>([]);
  const [isLoadingInteractions, setIsLoadingInteractions] = useState(false);

  // Supabase configuration state. Env vars are the single source of truth:
  // `connected` mirrors the same env-based client that AuthContext and
  // leadsService actually use, so the UI status can never diverge from reality.
  const [supabaseConfig] = useState<SupabaseConfig>(() => {
    const creds = getSupabaseCredentials();
    return {
      url: creds.url,
      anonKey: creds.anonKey,
      connected: isSupabaseEnvConfigured,
    };
  });

  const isSupabaseActive = isSupabaseEnvConfigured;

  // Pipeline metrics
  const [phaseCounts, setPhaseCounts] = useState<Record<PhaseId, number>>(() => {
    const counts: Record<PhaseId, number> = {
      mapeados: 0,
      prospeccao: 0,
      diagnostica: 0,
      proposta: 0,
      negociacao: 0,
      followup_1: 0,
      followup_2: 0,
      followup_3: 0,
      followup_4: 0,
      followup_5: 0,
      ganho: 0,
      perdido: 0,
    };
    INITIAL_CARDS.forEach((c) => {
      if (counts[c.phaseId] !== undefined) counts[c.phaseId]++;
    });
    return counts;
  });

  const [pipelineStats, setPipelineStats] = useState({
    totalPipelineValue: 0,
    totalWonValue: 0,
    totalWonCount: 0,
    totalLostCount: 0,
  });

  // Active current user
  const currentUser = users.find((u) => u.id === currentUserId) || users[0];

  const setCurrentUserId = (id: string) => {
    setCurrentUserIdState(id);
    localStorage.setItem(STORAGE_KEY_PREFIX + 'current_user_id', id);
  };

  // Sync users, phases, automations, notifications, auditLogs to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'phases', JSON.stringify(phases));
  }, [phases]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'cards', JSON.stringify(cards));
  }, [cards]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'automations', JSON.stringify(automations));
  }, [automations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  const addAuditLog = (
    action: AuditLogEntry['action'],
    details: string,
    cardId?: string,
    cardTitle?: string
  ) => {
    const newEntry: AuditLogEntry = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      details,
      cardId,
      cardTitle,
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  // Fetch paginated leads from Supabase when filters or page changes
  const refreshLeads = useCallback(async () => {
    if (!isSupabaseActive || !consultorId) {
      // Local calculation for pagination & counts
      let filtered = cards;
      if (activeFilterConsultant !== 'all') {
        filtered = filtered.filter((c) => c.assignedUserId === activeFilterConsultant);
      }
      if (activePriorityFilter !== 'all') {
        filtered = filtered.filter((c) => c.priority === activePriorityFilter);
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (c) =>
            c.title.toLowerCase().includes(q) ||
            c.companyName.toLowerCase().includes(q) ||
            c.contactName.toLowerCase().includes(q) ||
            c.tags.some((t) => t.toLowerCase().includes(q))
        );
      }

      setTotalLeadsCount(filtered.length);
      setTotalPages(Math.max(1, Math.ceil(filtered.length / pageSize)));

      const counts: Record<PhaseId, number> = {
        mapeados: 0,
        prospeccao: 0,
        diagnostica: 0,
        proposta: 0,
        negociacao: 0,
        followup_1: 0,
        followup_2: 0,
        followup_3: 0,
        followup_4: 0,
        followup_5: 0,
        ganho: 0,
        perdido: 0,
      };

      let pipeVal = 0;
      let wonVal = 0;
      let wonCnt = 0;
      let lostCnt = 0;

      cards.forEach((c) => {
        if (counts[c.phaseId] !== undefined) counts[c.phaseId]++;
        if (c.phaseId === 'ganho') {
          wonVal += c.value || 0;
          wonCnt++;
        } else if (c.phaseId === 'perdido') {
          lostCnt++;
        } else {
          pipeVal += c.value || 0;
        }
      });

      setPhaseCounts(counts);
      setPipelineStats({
        totalPipelineValue: pipeVal,
        totalWonValue: wonVal,
        totalWonCount: wonCnt,
        totalLostCount: lostCnt,
      });
      return;
    }

    setIsLoadingLeads(true);
    try {
      // The Kanban / table / dashboard views all render the full `cards` array
      // grouped across ~12 phases, so we load every RLS-visible lead here rather
      // than a single 30-row page (which left most columns empty). Page/pageSize
      // are still tracked in context for a future flat paginated list view.
      const response = await fetchAllLeads(
        {
          phaseId: 'all',
          assignedUserId: activeFilterConsultant,
          priority: activePriorityFilter as any,
          search: searchQuery,
          page: currentPage,
          pageSize,
        },
        consultorId
      );

      setCards(response.leads);
      setTotalLeadsCount(response.totalCount);
      setTotalPages(response.totalPages);
      setPhaseCounts(response.phaseCounts);
      setPipelineStats({
        totalPipelineValue: response.totalPipelineValue,
        totalWonValue: response.totalWonValue,
        totalWonCount: response.totalWonCount,
        totalLostCount: response.totalLostCount,
      });
    } catch (err: any) {
      console.warn('Error querying Supabase leads, fallback to local:', err);
    } finally {
      setIsLoadingLeads(false);
    }
  }, [isSupabaseActive, consultorId, activeFilterConsultant, activePriorityFilter, searchQuery, currentPage, pageSize, cards]);

  // Trigger refresh on filter or page change
  useEffect(() => {
    refreshLeads();
  }, [isSupabaseActive, consultorId, activeFilterConsultant, activePriorityFilter, searchQuery, currentPage, pageSize]);

  // On-demand interaction query when a lead is opened
  const loadLeadInteractions = useCallback(async (leadId: string) => {
    setIsLoadingInteractions(true);
    if (isSupabaseActive) {
      try {
        const { interactions, messages, history } = await fetchLeadInteractions(leadId);
        setCurrentLeadInteractions(interactions);

        // Update selected card messages and history from lead_interactions table
        setSelectedCard((prev) => {
          if (!prev || prev.id !== leadId) return prev;
          return {
            ...prev,
            messages: messages.length > 0 ? messages : prev.messages,
            history: history.length > 0 ? history : prev.history,
          };
        });
      } catch (err) {
        console.error(`Failed to load interactions for lead ${leadId}:`, err);
      } finally {
        setIsLoadingInteractions(false);
      }
    } else {
      // Local fallback
      const card = cards.find((c) => c.id === leadId);
      if (card) {
        const localInteractions: LeadInteraction[] = [];
        (card.messages || []).forEach((m) => {
          localInteractions.push({
            id: m.id,
            leadId: card.id,
            type: m.channel === 'whatsapp' ? 'whatsapp' : m.channel === 'email' ? 'email' : 'note',
            channel: m.channel,
            sender: m.sender === 'lead' ? 'client' : 'user',
            userName: m.senderName,
            content: m.content,
            metadata: { subject: m.subject },
            createdAt: m.timestamp,
          });
        });
        (card.history || []).forEach((h) => {
          localInteractions.push({
            id: h.id,
            leadId: card.id,
            type: 'history',
            channel: 'system',
            sender: 'user',
            userId: h.userId,
            userName: h.userName,
            content: h.action,
            metadata: { previousPhase: h.previousPhase, newPhase: h.newPhase },
            createdAt: h.timestamp,
          });
        });
        setCurrentLeadInteractions(localInteractions);
      }
      setIsLoadingInteractions(false);
    }
  }, [isSupabaseActive, cards]);

  // When selectedCard changes, automatically trigger on-demand interaction loading
  useEffect(() => {
    if (selectedCard?.id) {
      loadLeadInteractions(selectedCard.id);
    } else {
      setCurrentLeadInteractions([]);
    }
  }, [selectedCard?.id, loadLeadInteractions]);

  // Surfaces a Supabase write failure (e.g. an RLS permission-denied when a
  // consultant tries to assign a lead to someone else) in the notifications
  // bell, instead of the write failing silently and the row disappearing on the
  // next refresh.
  const notifySupabaseError = (title: string, err: any) => {
    const message =
      err?.message?.includes('row-level security') || err?.code === '42501'
        ? 'Permissão negada pelo banco de dados. Você não pode atribuir/alterar este lead. Ação salva apenas localmente e será revertida na próxima sincronização.'
        : `Falha ao salvar no Supabase: ${err?.message || 'erro desconhecido'}.`;
    setNotifications((prev) => [
      {
        id: 'notif-err-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        title,
        message,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'system',
        urgency: 'critical',
      },
      ...prev,
    ]);
  };

  const syncToSupabase = async (): Promise<{ success: boolean; message: string }> => {
    const res = await migrateCardsToSupabase(cards);
    if (res.success) {
      addAuditLog('backup_created', `Migração para Supabase concluída: ${res.insertedLeads} leads persistidos.`);
      refreshLeads();
    }
    return res;
  };

  const executeAutomationsForPhase = (card: CRMCard, targetPhaseId: PhaseId) => {
    const activeRules = automations.filter(
      (a) => a.enabled && ((a.trigger === 'phase_enter' && a.triggerPhase === targetPhaseId) || (targetPhaseId === 'ganho' && a.trigger === 'card_won') || (targetPhaseId === 'perdido' && a.trigger === 'card_lost'))
    );

    activeRules.forEach((rule) => {
      rule.actions.forEach((act) => {
        if (act.type === 'send_whatsapp_template') {
          const content = (act.params.messageText || 'Mensagem automática')
            .replace('{{contato}}', card.contactName)
            .replace('{{empresa}}', card.companyName)
            .replace('{{valor}}', `R$ ${card.value.toLocaleString('pt-BR')}`);

          const autoMsg: CardMessage = {
            id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            channel: 'whatsapp',
            sender: 'system',
            senderName: `Automação (${rule.title})`,
            content: `🤖 [Automação WhatsApp]: ${content}`,
            timestamp: new Date().toISOString(),
            status: 'sent',
          };

          setCards((prev) =>
            prev.map((c) => (c.id === card.id ? { ...c, messages: [...c.messages, autoMsg] } : c))
          );
        } else if (act.type === 'notify_manager') {
          const msg = (act.params.messageText || 'Alerta de automação')
            .replace('{{titulo}}', card.title)
            .replace('{{empresa}}', card.companyName)
            .replace('{{valor}}', `R$ ${card.value.toLocaleString('pt-BR')}`)
            .replace('{{consultor}}', currentUser.name);

          const newNotif: NotificationItem = {
            id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            title: `Automação: ${rule.title}`,
            message: msg,
            timestamp: new Date().toISOString(),
            read: false,
            type: targetPhaseId === 'ganho' ? 'deal_won' : 'manager_alert',
            urgency: act.params.notificationUrgency || 'warning',
            cardId: card.id,
          };
          setNotifications((prev) => [newNotif, ...prev]);
        } else if (act.type === 'create_checklist_task' && act.params.taskTitle) {
          const newTask = {
            id: 'chk-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            text: act.params.taskTitle,
            completed: false,
          };
          setCards((prev) =>
            prev.map((c) => (c.id === card.id ? { ...c, checklist: [...c.checklist, newTask] } : c))
          );
        } else if (act.type === 'add_tag' && act.params.tagToAdd) {
          const tag = act.params.tagToAdd;
          setCards((prev) =>
            prev.map((c) =>
              c.id === card.id && !c.tags.includes(tag) ? { ...c, tags: [...c.tags, tag] } : c
            )
          );
        }
      });

      // Update execution count
      setAutomations((prev) =>
        prev.map((r) =>
          r.id === rule.id
            ? { ...r, executionCount: r.executionCount + 1, lastExecutedAt: new Date().toISOString() }
            : r
        )
      );

      addAuditLog(
        'automation_executed',
        `Automação "${rule.title}" executada com sucesso ao entrar na fase ${targetPhaseId}.`,
        card.id,
        card.title
      );
    });
  };

  const moveCardPhase = async (
    cardId: string,
    targetPhaseId: PhaseId,
    additionalFields?: CardCustomData
  ): Promise<boolean> => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return false;
    if (card.phaseId === targetPhaseId) return true;

    const previousPhase = card.phaseId;
    const now = new Date().toISOString();

    // Check confetti on Won
    if (targetPhaseId === 'ganho') {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore
      }
    }

    const updatedCard: CRMCard = {
      ...card,
      phaseId: targetPhaseId,
      enteredCurrentPhaseAt: now,
      updatedAt: now,
      customFields: {
        ...card.customFields,
        ...(additionalFields || {}),
      },
      history: [
        ...card.history,
        {
          id: 'h-' + Date.now(),
          timestamp: now,
          userId: currentUser.id,
          userName: currentUser.name,
          action: `Fase alterada de "${previousPhase}" para "${targetPhaseId}"`,
          previousPhase,
          newPhase: targetPhaseId,
        },
      ],
    };

    setCards((prev) => prev.map((c) => (c.id === cardId ? updatedCard : c)));
    if (selectedCard?.id === cardId) {
      setSelectedCard(updatedCard);
    }

    if (isSupabaseActive) {
      try {
        await moveLeadPhaseInSupabase(cardId, targetPhaseId, previousPhase, currentUser, updatedCard.customFields);
      } catch (err) {
        console.error('Failed to move lead in Supabase:', err);
      }
    }

    addAuditLog(
      'card_moved',
      `Card movido da fase "${previousPhase}" para "${targetPhaseId}".`,
      card.id,
      card.title
    );

    if (targetPhaseId === 'ganho' && previousPhase !== 'ganho') {
      const notif: NotificationItem = {
        id: 'notif-won-' + Date.now(),
        title: `🎉 Negócio Fechado: ${card.title}`,
        message: `${currentUser.name} fechou ${card.companyName} por R$ ${card.value.toLocaleString('pt-BR')}!`,
        timestamp: now,
        read: false,
        type: 'deal_won',
        urgency: 'info',
        cardId: card.id,
      };
      setNotifications((prev) => [notif, ...prev]);

      setUsers((prev) =>
        prev.map((u) =>
          u.id === card.assignedUserId
            ? {
                ...u,
                currentMonthWonValue: u.currentMonthWonValue + card.value,
                currentMonthWonCount: u.currentMonthWonCount + 1,
              }
            : u
        )
      );
    } else if (previousPhase === 'ganho' && targetPhaseId !== 'ganho') {
      // Card is being moved back out of "ganho" — undo the earlier count so
      // re-entering "ganho" later doesn't inflate goal attainment.
      setUsers((prev) =>
        prev.map((u) =>
          u.id === card.assignedUserId
            ? {
                ...u,
                currentMonthWonValue: Math.max(0, u.currentMonthWonValue - card.value),
                currentMonthWonCount: Math.max(0, u.currentMonthWonCount - 1),
              }
            : u
        )
      );
    }

    executeAutomationsForPhase(updatedCard, targetPhaseId);
    return true;
  };

  const createCard = async (cardData: Partial<CRMCard>): Promise<CRMCard> => {
    const nextNum = totalLeadsCount + 101;
    const now = new Date().toISOString();

    const newCard: CRMCard = {
      id: cardData.id || `CARD-${nextNum}`,
      title: cardData.title || 'Novo Lead',
      companyName: cardData.companyName || 'Empresa Sem Nome',
      contactName: cardData.contactName || 'Contato Principal',
      contactEmail: cardData.contactEmail || '',
      contactPhone: cardData.contactPhone || '',
      contactWhatsapp: cardData.contactWhatsapp || cardData.contactPhone || '',
      contactRole: cardData.contactRole || 'Decisor',
      // Bound to the authenticated Supabase user when persisted (see createCard below);
      // falls back to the local profile id only in offline/local-storage mode.
      assignedUserId: cardData.assignedUserId || consultorId || currentUser.id,
      phaseId: cardData.phaseId || 'mapeados',
      value: cardData.value || 0,
      priority: cardData.priority || 'media',
      tags: cardData.tags || ['Novo Lead'],
      customFields: cardData.customFields || {
        dataMapeamento: now.slice(0, 10),
        canalProspeccao: 'LinkedIn Sales Nav',
      },
      messages: cardData.messages || [
        {
          id: 'msg-init-' + Date.now(),
          channel: 'internal_note',
          sender: 'system',
          senderName: 'Sistema PipeCRM',
          content: `Lead cadastrado no CRM por ${currentUser.name}.`,
          timestamp: now,
        },
      ],
      checklist: cardData.checklist || [
        { id: 'chk-init-1', text: 'Validar dados de contato e decisor', completed: false },
        { id: 'chk-init-2', text: 'Preencher perguntas da fase inicial', completed: false },
      ],
      history: [
        {
          id: 'h-init-' + Date.now(),
          timestamp: now,
          userId: currentUser.id,
          userName: currentUser.name,
          action: `Card criado na fase "${cardData.phaseId || 'mapeados'}"`,
        },
      ],
      enteredCurrentPhaseAt: now,
      createdAt: now,
      updatedAt: now,
    };

    setCards((prev) => [newCard, ...prev]);
    setTotalLeadsCount((prev) => prev + 1);

    if (isSupabaseActive && consultorId) {
      try {
        await createLeadInSupabase(newCard, currentUser, consultorId);
      } catch (err) {
        console.error('Failed to create lead in Supabase:', err);
        notifySupabaseError(`Erro ao salvar lead "${newCard.title}"`, err);
      }
    }

    addAuditLog('card_created', `Card criado por ${currentUser.name}.`, newCard.id, newCard.title);
    return newCard;
  };

  const updateCard = async (id: string, updates: Partial<CRMCard>, auditDetails?: string) => {
    const now = new Date().toISOString();
    setCards((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = {
            ...c,
            ...updates,
            updatedAt: now,
            history: [
              ...c.history,
              {
                id: 'h-' + Date.now(),
                timestamp: now,
                userId: currentUser.id,
                userName: currentUser.name,
                action: auditDetails || 'Informações do card atualizadas',
              },
            ],
          };
          return updated;
        }
        return c;
      })
    );

    if (selectedCard?.id === id) {
      setSelectedCard((prev) => (prev ? { ...prev, ...updates, updatedAt: now } : null));
    }

    if (isSupabaseActive) {
      try {
        await updateLeadInSupabase(id, updates, currentUser, auditDetails);
      } catch (err) {
        console.error(`Failed to update lead ${id} in Supabase:`, err);
        notifySupabaseError('Erro ao atualizar lead', err);
      }
    }

    addAuditLog('card_updated', auditDetails || 'Card editado.', id);
  };

  const deleteCard = async (id: string) => {
    const card = cards.find((c) => c.id === id);
    if (!card) return;
    setCards((prev) => prev.filter((c) => c.id !== id));
    setTotalLeadsCount((prev) => Math.max(0, prev - 1));
    if (selectedCard?.id === id) setSelectedCard(null);

    if (isSupabaseActive) {
      try {
        await deleteLeadFromSupabase(id);
      } catch (err) {
        console.error(`Failed to delete lead ${id} from Supabase:`, err);
      }
    }

    addAuditLog('card_deleted', `Card "${card.title}" excluído por ${currentUser.name}.`, id, card.title);
  };

  const addLeadInteraction = async (leadId: string, interaction: Partial<LeadInteraction>) => {
    const now = new Date().toISOString();
    const newRecord: LeadInteraction = {
      id: interaction.id || 'inter-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      leadId,
      type: interaction.type || 'note',
      channel: interaction.channel || 'internal',
      sender: interaction.sender || 'user',
      userId: interaction.userId || currentUser.id,
      userName: interaction.userName || currentUser.name,
      content: interaction.content || '',
      metadata: interaction.metadata || {},
      createdAt: now,
    };

    setCurrentLeadInteractions((prev) => [...prev, newRecord]);

    if (isSupabaseActive) {
      try {
        await addLeadInteractionToSupabase(leadId, newRecord);
      } catch (err) {
        console.error('Failed to save interaction in Supabase:', err);
      }
    }
  };

  const sendCardMessage = async (cardId: string, message: Omit<CardMessage, 'id' | 'timestamp'>) => {
    const now = new Date().toISOString();
    const newMsg: CardMessage = {
      ...message,
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      timestamp: now,
    };

    setCards((prev) =>
      prev.map((c) => {
        if (c.id === cardId) {
          return {
            ...c,
            messages: [...c.messages, newMsg],
            lastContactAt: now,
            updatedAt: now,
          };
        }
        return c;
      })
    );

    if (selectedCard?.id === cardId) {
      setSelectedCard((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, newMsg],
              lastContactAt: now,
              updatedAt: now,
            }
          : null
      );
    }

    // Save as interaction in Supabase
    await addLeadInteraction(cardId, {
      type: message.channel === 'whatsapp' ? 'whatsapp' : message.channel === 'email' ? 'email' : 'note',
      channel: message.channel as any,
      sender: message.sender === 'lead' ? 'client' : message.sender === 'system' ? 'system' : 'user',
      userId: currentUser.id,
      userName: message.senderName || currentUser.name,
      content: message.content,
      metadata: { subject: message.subject, status: message.status },
    });

    const card = cards.find((c) => c.id === cardId);
    const actionType = message.channel === 'whatsapp' ? 'whatsapp_sent' : 'email_sent';
    addAuditLog(
      actionType,
      `Mensagem enviada via ${message.channel.toUpperCase()} para ${card?.contactName || 'contato'}.`,
      cardId,
      card?.title
    );
  };

  const toggleChecklistItem = (cardId: string, itemId: string) => {
    setCards((prev) =>
      prev.map((c) => {
        if (c.id === cardId) {
          const updated = {
            ...c,
            checklist: c.checklist.map((item) =>
              item.id === itemId
                ? {
                    ...item,
                    completed: !item.completed,
                    completedAt: !item.completed ? new Date().toISOString() : undefined,
                    completedBy: !item.completed ? currentUser.name : undefined,
                  }
                : item
            ),
          };
          if (isSupabaseActive) {
            updateLeadInSupabase(cardId, { checklist: updated.checklist });
          }
          return updated;
        }
        return c;
      })
    );

    if (selectedCard?.id === cardId) {
      setSelectedCard((prev) =>
        prev
          ? {
              ...prev,
              checklist: prev.checklist.map((item) =>
                item.id === itemId
                  ? {
                      ...item,
                      completed: !item.completed,
                      completedAt: !item.completed ? new Date().toISOString() : undefined,
                      completedBy: !item.completed ? currentUser.name : undefined,
                    }
                  : item
              ),
            }
          : null
      );
    }
  };

  const addChecklistItem = (cardId: string, text: string) => {
    if (!text.trim()) return;
    const newItem = {
      id: 'chk-' + Date.now(),
      text: text.trim(),
      completed: false,
    };
    setCards((prev) =>
      prev.map((c) => {
        if (c.id === cardId) {
          const updated = { ...c, checklist: [...c.checklist, newItem] };
          if (isSupabaseActive) {
            updateLeadInSupabase(cardId, { checklist: updated.checklist });
          }
          return updated;
        }
        return c;
      })
    );

    if (selectedCard?.id === cardId) {
      setSelectedCard((prev) => (prev ? { ...prev, checklist: [...prev.checklist, newItem] } : null));
    }
  };

  const toggleAutomation = (id: string) => {
    setAutomations((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const next = !a.enabled;
          addAuditLog('automation_executed', `Automação "${a.title}" ${next ? 'ativada' : 'desativada'}.`);
          return { ...a, enabled: next };
        }
        return a;
      })
    );
  };

  const addAutomation = (rule: Omit<AutomationRule, 'id' | 'executionCount'>) => {
    const newRule: AutomationRule = {
      ...rule,
      id: 'auto-' + Date.now(),
      executionCount: 0,
    };
    setAutomations((prev) => [newRule, ...prev]);
    addAuditLog('automation_executed', `Nova regra de automação criada: "${newRule.title}".`);
  };

  const deleteAutomation = (id: string) => {
    setAutomations((prev) => prev.filter((a) => a.id !== id));
    addAuditLog('automation_executed', `Regra de automação excluída.`);
  };

  const updatePhaseConfig = (phaseId: PhaseId, updates: Partial<PhaseConfig>) => {
    setPhases((prev) =>
      prev.map((p) => (p.id === phaseId ? { ...p, ...updates } : p))
    );
    addAuditLog('phase_configured', `Configuração da fase ${phaseId} atualizada.`);
  };

  const addPhaseField = (phaseId: PhaseId, field: any) => {
    setPhases((prev) =>
      prev.map((p) => {
        if (p.id === phaseId) {
          return {
            ...p,
            requiredFields: [...p.requiredFields, field],
          };
        }
        return p;
      })
    );
    addAuditLog('phase_configured', `Novo campo personalizado "${field.label}" adicionado à fase ${phaseId}.`);
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const updateUserGoal = (userId: string, monthlyGoalValue: number, monthlyGoalLeads: number) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, monthlyGoalValue, monthlyGoalLeads } : u))
    );
    const targetUser = users.find((u) => u.id === userId);
    addAuditLog(
      'goals_updated',
      `Metas individuais de ${targetUser?.name || 'usuário'} atualizadas para R$ ${monthlyGoalValue.toLocaleString('pt-BR')} e ${monthlyGoalLeads} fechamentos.`
    );
  };

  const updateUserPermissions = (
    userId: string,
    permissions: Partial<NonNullable<User['permissions']>>
  ) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            permissions: {
              ...(u.permissions || {
                canExport: false,
                canEditAutomations: false,
                canViewAllLeads: true,
                canEditPhaseFields: false,
                canManageUsers: false,
                canDeleteCards: false,
              }),
              ...permissions,
            },
          };
        }
        return u;
      })
    );
    addAuditLog('permissions_updated', `Permissões de acesso atualizadas para usuário ${userId}.`);
  };

  const addUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: 'user_' + Date.now(),
    };
    setUsers((prev) => [...prev, newUser]);
    addAuditLog('permissions_updated', `Novo colaborador adicionado: ${newUser.name} (${newUser.role}).`);
  };

  const openNewCardModal = (phaseId: PhaseId = 'mapeados') => {
    setNewCardDefaultPhase(phaseId);
    setIsNewCardModalOpen(true);
  };

  // Local Storage & JSON Backup Operations
  const exportFullJSONBackup = () => {
    const backup: CRMBackupData = {
      version: 2,
      exportedAt: new Date().toISOString(),
      app: 'PipeCRM',
      currentUserId: currentUser.id,
      users,
      phases,
      cards,
      automations,
      notifications,
      auditLogs,
    };
    exportAllToJSON(backup);
    addAuditLog('backup_created', `Backup completo em JSON exportado (${cards.length} cards, ${users.length} usuários).`);
  };

  const importFullJSONBackup = (
    backup: CRMBackupData,
    mode: 'replace' | 'merge' = 'replace'
  ): { success: boolean; message: string; cardsCount: number } => {
    try {
      if (mode === 'replace') {
        if (backup.users && backup.users.length > 0) setUsers(backup.users);
        if (backup.phases && backup.phases.length > 0) setPhases(backup.phases);
        if (backup.cards) setCards(backup.cards);
        if (backup.automations) setAutomations(backup.automations);
        if (backup.notifications) setNotifications(backup.notifications);
        if (backup.auditLogs) {
          setAuditLogs([
            {
              id: 'log-' + Date.now(),
              timestamp: new Date().toISOString(),
              userId: currentUser.id,
              userName: currentUser.name,
              userRole: currentUser.role,
              action: 'data_imported',
              details: `Backup completo restaurado via JSON (${backup.cards?.length || 0} cards).`,
            },
            ...backup.auditLogs,
          ]);
        }
        if (backup.currentUserId && users.some((u) => u.id === backup.currentUserId)) {
          setCurrentUserId(backup.currentUserId);
        }
        return {
          success: true,
          message: `Backup restaurado com sucesso! ${backup.cards?.length || 0} oportunidades carregadas.`,
          cardsCount: backup.cards?.length || 0,
        };
      } else {
        const newCards = backup.cards || [];
        setCards((prev) => {
          const map = new Map(prev.map((c) => [c.id, c]));
          newCards.forEach((c) => map.set(c.id, c));
          return Array.from(map.values());
        });

        if (backup.users) {
          setUsers((prev) => {
            const userMap = new Map(prev.map((u) => [u.id, u]));
            backup.users.forEach((u) => userMap.set(u.id, u));
            return Array.from(userMap.values());
          });
        }

        addAuditLog('data_imported', `Dados em JSON mesclados (+${newCards.length} cards processados).`);
        return {
          success: true,
          message: `Dados mesclados com sucesso! ${newCards.length} cards processados.`,
          cardsCount: newCards.length,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        message: `Falha ao restaurar backup: ${err.message || 'Erro desconhecido'}`,
        cardsCount: 0,
      };
    }
  };

  const resetToDefaultData = () => {
    setUsers(INITIAL_USERS);
    setPhases(INITIAL_PHASES);
    setCards(INITIAL_CARDS);
    setAutomations(INITIAL_AUTOMATIONS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setAuditLogs([
      {
        id: 'log-' + Date.now(),
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'database_reset',
        details: 'Banco de dados restaurado para os dados iniciais padrão.',
      },
      ...INITIAL_AUDIT_LOGS,
    ]);
    setCurrentUserId('user_admin');
    setSelectedCard(null);
  };

  const clearAllCards = () => {
    setCards([]);
    setSelectedCard(null);
    addAuditLog('database_reset', 'Todos os cards foram removidos do banco.');
  };

  const storageInfo = getLocalStorageSizeKB();

  return (
    <CRMContext.Provider
      value={{
        currentUser,
        setCurrentUserId,
        users,
        updateUserGoal,
        updateUserPermissions,
        addUser,
        phases,
        updatePhaseConfig,
        addPhaseField,
        cards,
        selectedCard,
        setSelectedCard,
        createCard,
        updateCard,
        moveCardPhase,
        deleteCard,
        currentLeadInteractions,
        isLoadingInteractions,
        loadLeadInteractions,
        addLeadInteraction,
        sendCardMessage,
        toggleChecklistItem,
        addChecklistItem,
        automations,
        toggleAutomation,
        addAutomation,
        deleteAutomation,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        unreadCount,
        auditLogs,
        addAuditLog,
        activeFilterConsultant,
        setActiveFilterConsultant,
        searchQuery,
        setSearchQuery,
        activePriorityFilter,
        setActivePriorityFilter,
        currentPage,
        setCurrentPage,
        pageSize,
        setPageSize,
        totalLeadsCount,
        totalPages,
        phaseCounts,
        pipelineStats,
        isLoadingLeads,
        refreshLeads,
        supabaseConfig,
        isSupabaseActive,
        syncToSupabase,
        isSupabaseModalOpen,
        setIsSupabaseModalOpen,
        isIntegrationsModalOpen,
        setIsIntegrationsModalOpen,
        currentView,
        setCurrentView,
        exportFullJSONBackup,
        importFullJSONBackup,
        resetToDefaultData,
        clearAllCards,
        storageInfo,
        isNewCardModalOpen,
        setIsNewCardModalOpen,
        newCardDefaultPhase,
        openNewCardModal,
        isExportModalOpen,
        setIsExportModalOpen,
        pendingTransition,
        requestPhaseTransition,
        cancelPhaseTransition,
        theme,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </CRMContext.Provider>
  );
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
};

