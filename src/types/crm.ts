export type UserRole = 'admin' | 'manager' | 'consultant' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  phone: string;
  active: boolean;
  department: string;
  monthlyGoalValue: number; // Target in R$
  monthlyGoalLeads: number; // Target leads won
  currentMonthWonValue: number;
  currentMonthWonCount: number;
  permissions?: {
    canExport: boolean;
    canEditAutomations: boolean;
    canViewAllLeads: boolean;
    canEditPhaseFields: boolean;
    canManageUsers: boolean;
    canDeleteCards: boolean;
  };
}

export type PhaseId =
  | 'mapeados'
  | 'prospeccao'
  | 'diagnostica'
  | 'proposta'
  | 'negociacao'
  | 'followup_1'
  | 'followup_2'
  | 'followup_3'
  | 'followup_4'
  | 'followup_5'
  | 'ganho'
  | 'perdido';

export interface PhaseFieldDefinition {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'currency' | 'date' | 'select' | 'boolean' | 'url';
  required: boolean;
  options?: string[];
  placeholder?: string;
  helpText?: string;
}

export interface PhaseConfig {
  id: PhaseId;
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeColor: string;
  description: string;
  slaHours: number; // Maximum recommended hours in this phase
  requiredFields: PhaseFieldDefinition[];
  isFinal?: 'won' | 'lost';
}

export type ProspectingChannel =
  | 'LinkedIn Sales Nav'
  | 'Cold Call'
  | 'Outbound E-mail'
  | 'Indicação / Parceiro'
  | 'Evento / Feira'
  | 'Inbound Marketing'
  | 'WhatsApp / Instagram'
  | 'Outro';

export type Priority = 'baixa' | 'media' | 'alta' | 'urgente';

export interface CardMessage {
  id: string;
  channel: 'whatsapp' | 'email' | 'internal_note';
  sender: 'consultant' | 'lead' | 'system';
  senderName: string;
  content: string;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
  subject?: string; // For email
  attachments?: string[];
  audioDuration?: string;
}

export interface CardChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
}

export interface CardAuditHistory {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  previousPhase?: string;
  newPhase?: string;
  fieldChanges?: { field: string; from: any; to: any }[];
}

export interface CardCustomData {
  // Mapeados
  dataMapeamento?: string;
  canalProspeccao?: ProspectingChannel;
  perfilICP?: string;
  linkPerfilLead?: string;
  scorePotencial?: 'A (Alto)' | 'B (Médio)' | 'C (Baixo)';

  // Prospecção
  tentativasContato?: number;
  decisorIdentificado?: string;
  cargoDecisor?: string;
  melhorHorarioContato?: string;

  // Diagnóstica
  dataReuniaoDiagnostico?: string;
  doresIdentificadas?: string;
  orcamentoEstimado?: number;
  urgenciaProjeto?: 'Imediata' | 'Próximos 30 dias' | 'Próximo Trimestre' | 'Apenas pesquisando';
  resumoDiagnostico?: string;

  // Proposta
  valorProposta?: number;
  prazoValidadeProposta?: string;
  escopoResumido?: string;
  condicaoPagamento?: string;
  linkPropostaPdf?: string;

  // Negociação
  principalObjecao?: string;
  descontoSolicitadoPercent?: number;
  previsaoFechamento?: string;
  concorrenteEmDisputa?: string;

  // Follow-up 1 ao 5
  followup1Data?: string;
  followup1Canal?: 'WhatsApp' | 'Telefone' | 'E-mail' | 'Presencial';
  followup1Resumo?: string;
  followup1Status?: 'Respondeu - Interessado' | 'Pediu mais tempo' | 'Sem resposta';

  followup2Data?: string;
  followup2Canal?: 'WhatsApp' | 'Telefone' | 'E-mail';
  followup2Resumo?: string;
  followup2Status?: 'Respondeu - Interessado' | 'Pediu mais tempo' | 'Sem resposta';

  followup3Data?: string;
  followup3Canal?: 'WhatsApp' | 'Telefone' | 'E-mail';
  followup3Resumo?: string;
  followup3Status?: 'Respondeu - Interessado' | 'Pediu mais tempo' | 'Sem resposta';

  followup4Data?: string;
  followup4Canal?: 'WhatsApp' | 'Telefone' | 'E-mail';
  followup4Resumo?: string;
  followup4Status?: 'Respondeu - Interessado' | 'Pediu mais tempo' | 'Sem resposta';

  followup5Data?: string;
  followup5Canal?: 'WhatsApp' | 'Telefone' | 'E-mail';
  followup5Resumo?: string;
  followup5Status?: 'Última tentativa de contato' | 'Sem resposta definitivo' | 'Reativado';

  // Ganho
  valorFechadoFinal?: number;
  dataFechamento?: string;
  dataInicioContrato?: string;
  formaPagamentoFinal?: string;

  // Perdido
  motivoPerda?: 'Preço muito alto' | 'Escolheu concorrente' | 'Sem orçamento atual' | 'Desistiu do projeto' | 'Lead sumiu (Ghosting)' | 'Fora do Perfil (ICP)' | 'Outro';
  detalhesPerda?: string;

  // Generic dynamic fields
  [key: string]: any;
}

export interface CRMCard {
  id: string;
  title: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactWhatsapp: string;
  contactRole?: string;
  assignedUserId: string;
  phaseId: PhaseId;
  value: number; // in R$
  priority: Priority;
  tags: string[];
  customFields: CardCustomData;
  messages: CardMessage[];
  checklist: CardChecklistItem[];
  history: CardAuditHistory[];
  enteredCurrentPhaseAt: string;
  createdAt: string;
  updatedAt: string;
  lastContactAt?: string;
  dueDate?: string;
}

export interface AutomationRule {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  trigger: 'phase_enter' | 'card_created' | 'sla_breach' | 'card_lost' | 'card_won' | 'inactivity';
  triggerPhase?: PhaseId;
  triggerConditions?: {
    minValue?: number;
    hoursWithoutAction?: number;
    channel?: string;
  };
  actions: {
    type: 'send_whatsapp_template' | 'send_email_template' | 'notify_manager' | 'assign_user' | 'create_checklist_task' | 'add_tag';
    params: {
      templateId?: string;
      messageText?: string;
      assignToUserId?: string;
      taskTitle?: string;
      tagToAdd?: string;
      notificationUrgency?: 'critical' | 'warning' | 'info';
    };
  }[];
  executionCount: number;
  lastExecutedAt?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'manager_alert' | 'sla_breach' | 'deal_won' | 'deal_lost' | 'high_value' | 'followup_due' | 'system';
  urgency: 'critical' | 'warning' | 'info';
  cardId?: string;
  consultantId?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action:
    | 'card_created'
    | 'card_moved'
    | 'card_updated'
    | 'card_deleted'
    | 'whatsapp_sent'
    | 'email_sent'
    | 'automation_executed'
    | 'data_exported'
    | 'data_imported'
    | 'database_reset'
    | 'backup_created'
    | 'permissions_updated'
    | 'goals_updated'
    | 'phase_configured';
  details: string;
  cardId?: string;
  cardTitle?: string;
  ipAddress?: string;
}

export interface LeadInteraction {
  id: string;
  leadId: string;
  type: 'message' | 'history' | 'ai_note' | 'ai_prompt' | 'whatsapp' | 'email' | 'call' | 'note' | 'status_change';
  channel?: 'whatsapp' | 'email' | 'call' | 'internal' | 'system' | 'ai_assistant';
  sender: 'client' | 'user' | 'system' | 'ai';
  userId?: string;
  userName?: string;
  content: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  connected: boolean;
  tableLeadsCount?: number;
  tableInteractionsCount?: number;
}

export interface LeadFilterParams {
  phaseId?: PhaseId | 'all';
  assignedUserId?: string | 'all';
  priority?: Priority | 'all';
  search?: string;
  page: number;
  pageSize: number;
  sortBy?: 'created_at' | 'updated_at' | 'value' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedLeadsResponse {
  leads: CRMCard[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  phaseCounts: Record<PhaseId, number>;
  totalPipelineValue: number;
  totalWonValue: number;
  totalWonCount: number;
  totalLostCount: number;
}

export interface CRMBackupData {
  version: number;
  exportedAt: string;
  app: string;
  currentUserId?: string;
  users: User[];
  phases: PhaseConfig[];
  cards: CRMCard[];
  automations: AutomationRule[];
  notifications: NotificationItem[];
  auditLogs: AuditLogEntry[];
}
