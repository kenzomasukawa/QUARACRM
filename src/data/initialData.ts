import { User, PhaseConfig, CRMCard, AutomationRule, NotificationItem, AuditLogEntry } from '../types/crm';

export const INITIAL_USERS: User[] = [
  {
    id: 'user_admin',
    name: 'William',
    email: 'willian.kenzo@paulistajr.com.br',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    phone: '',
    active: true,
    department: 'Diretoria Comercial',
    monthlyGoalValue: 0,
    monthlyGoalLeads: 0,
    currentMonthWonValue: 0,
    currentMonthWonCount: 0,
    permissions: {
      canExport: true,
      canEditAutomations: true,
      canViewAllLeads: true,
      canEditPhaseFields: true,
      canManageUsers: true,
      canDeleteCards: true,
    },
  },
];

export const INITIAL_PHASES: PhaseConfig[] = [
  {
    id: 'mapeados',
    name: '1. Mapeados',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50/70',
    borderColor: 'border-indigo-200',
    badgeColor: 'bg-indigo-100 text-indigo-800',
    description: 'Leads identificados e mapeados para primeira abordagem',
    slaHours: 24,
    requiredFields: [
      {
        id: 'dataProspeccao',
        label: 'Data da Prospecção / Contato',
        type: 'date',
        required: true,
        helpText: 'Data em que o lead foi registrado ou abordado',
      },
      {
        id: 'canalIndicacao',
        label: 'Canal de Indicação / Origem',
        type: 'select',
        required: true,
        options: ['Passivo', 'Ativo Apollo', 'Indicação'],
        helpText: 'Origem: Passivo, Ativo Apollo ou Indicação',
      },
      {
        id: 'perfilICP',
        label: 'Segmento / Perfil (ICP)',
        type: 'text',
        required: false,
        placeholder: 'Ex: Fintech B2B > 50 funcionários',
      },
    ],
  },
  {
    id: 'prospeccao',
    name: '2. Prospecção',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50/70',
    borderColor: 'border-blue-200',
    badgeColor: 'bg-blue-100 text-blue-800',
    description: 'Primeiro contato ativo e qualificação inicial',
    slaHours: 48,
    requiredFields: [
      {
        id: 'tamanhoEmpresa',
        label: 'Tamanho da Empresa',
        type: 'select',
        required: true,
        options: ['Pequena', 'Média', 'Grande'],
        helpText: 'Porte qualificado da empresa',
      },
      {
        id: 'dataProximaAtividade',
        label: 'Data da Próxima Atividade',
        type: 'date',
        required: true,
        helpText: 'Data da próxima reunião ou atividade agendada',
      },
    ],
  },
  {
    id: 'diagnostica',
    name: '3. Diagnóstica',
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-50/70',
    borderColor: 'border-cyan-200',
    badgeColor: 'bg-cyan-100 text-cyan-800',
    description: 'Reunião de alinhamento de dores, escopo e qualificação técnica',
    slaHours: 72,
    requiredFields: [
      {
        id: 'necessidadeCliente',
        label: 'Necessidade do Cliente',
        type: 'textarea',
        required: true,
        placeholder: 'Descreva detalhadamente a dor, o gargalo ou a necessidade levantada no diagnóstico...',
        helpText: 'O que o cliente precisa resolver?',
      },
    ],
  },
  {
    id: 'proposta',
    name: '4. Proposta',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50/70',
    borderColor: 'border-amber-200',
    badgeColor: 'bg-amber-100 text-amber-800',
    description: 'Elaboração e apresentação da proposta comercial e técnica',
    slaHours: 72,
    requiredFields: [
      {
        id: 'servicosAdquiridos',
        label: 'Quais Serviços está Adquirindo',
        type: 'textarea',
        required: true,
        placeholder: 'Ex: Consultoria Estratégica, Licenciamento Enterprise, Treinamento da Equipe...',
        helpText: 'Serviços e módulos incluídos na proposta',
      },
      {
        id: 'validadeProposta',
        label: 'Validade da Proposta',
        type: 'date',
        required: true,
        helpText: 'Data limite de validade da proposta comercial',
      },
      {
        id: 'valorInicialProposta',
        label: 'Valor Inicial da Proposta (R$)',
        type: 'currency',
        required: true,
        helpText: 'Valor financeiro inicial apresentado na proposta',
      },
    ],
  },
  {
    id: 'negociacao',
    name: '5. Negociação',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50/70',
    borderColor: 'border-orange-200',
    badgeColor: 'bg-orange-100 text-orange-800',
    description: 'Ajustes contratuais, descontos e validação com diretoria',
    slaHours: 96,
    requiredFields: [
      {
        id: 'principalObjecao',
        label: 'Principal Objeção / Ponto em Negociação',
        type: 'text',
        required: false,
        placeholder: 'Ex: Preço de implantação, prazo de início...',
      },
      {
        id: 'previsaoFechamento',
        label: 'Previsão de Fechamento',
        type: 'date',
        required: false,
      },
    ],
  },
  {
    id: 'followup_1',
    name: '6. Follow up 1',
    color: 'text-yellow-800',
    bgColor: 'bg-yellow-50/70',
    borderColor: 'border-yellow-200',
    badgeColor: 'bg-yellow-100 text-yellow-800',
    description: '1º contato de acompanhamento',
    slaHours: 48,
    requiredFields: [
      {
        id: 'dataProximoFollowup',
        label: 'Data do Próximo Follow-up',
        type: 'date',
        required: true,
        helpText: 'Data combinada ou estipulada para a próxima tentativa',
      },
    ],
  },
  {
    id: 'followup_2',
    name: '7. Follow up 2',
    color: 'text-yellow-800',
    bgColor: 'bg-yellow-50/70',
    borderColor: 'border-yellow-300',
    badgeColor: 'bg-yellow-200 text-yellow-900',
    description: '2º contato de acompanhamento de decisão',
    slaHours: 72,
    requiredFields: [
      {
        id: 'dataProximoFollowup',
        label: 'Data do Próximo Follow-up',
        type: 'date',
        required: true,
        helpText: 'Data combinada ou estipulada para a próxima tentativa',
      },
    ],
  },
  {
    id: 'followup_3',
    name: '8. Follow up 3',
    color: 'text-purple-800',
    bgColor: 'bg-purple-50/70',
    borderColor: 'border-purple-200',
    badgeColor: 'bg-purple-100 text-purple-800',
    description: '3º contato estratégico com novo benefício/case',
    slaHours: 72,
    requiredFields: [
      {
        id: 'dataProximoFollowup',
        label: 'Data do Próximo Follow-up',
        type: 'date',
        required: true,
        helpText: 'Data combinada ou estipulada para a próxima tentativa',
      },
    ],
  },
  {
    id: 'followup_4',
    name: '9. Follow up 4',
    color: 'text-pink-800',
    bgColor: 'bg-pink-50/70',
    borderColor: 'border-pink-200',
    badgeColor: 'bg-pink-100 text-pink-800',
    description: '4º contato - Revalidação de timing e interesse',
    slaHours: 96,
    requiredFields: [
      {
        id: 'dataProximoFollowup',
        label: 'Data do Próximo Follow-up',
        type: 'date',
        required: true,
        helpText: 'Data combinada ou estipulada para a próxima tentativa',
      },
    ],
  },
  {
    id: 'followup_5',
    name: '10. Follow up 5 (Break-up)',
    color: 'text-rose-800',
    bgColor: 'bg-rose-50/70',
    borderColor: 'border-rose-300',
    badgeColor: 'bg-rose-100 text-rose-800',
    description: '5º contato - Última cartada antes do encerramento/perda',
    slaHours: 96,
    requiredFields: [
      {
        id: 'dataProximoFollowup',
        label: 'Data do Próximo Follow-up',
        type: 'date',
        required: true,
        helpText: 'Data combinada ou estipulada para a última tentativa',
      },
    ],
  },
  {
    id: 'ganho',
    name: '11. Ganho (Won)',
    color: 'text-emerald-800',
    bgColor: 'bg-emerald-50/80',
    borderColor: 'border-emerald-300',
    badgeColor: 'bg-emerald-100 text-emerald-800',
    description: 'Contrato assinado e pagamento confirmado',
    slaHours: 0,
    isFinal: 'won',
    requiredFields: [
      {
        id: 'valorFechadoFinal',
        label: 'Valor Fechado Final (R$)',
        type: 'currency',
        required: true,
      },
      {
        id: 'dataFechamento',
        label: 'Data de Assinatura',
        type: 'date',
        required: true,
      },
      {
        id: 'formaPagamentoFinal',
        label: 'Condição de Pagamento Acertada',
        type: 'text',
        required: true,
      },
    ],
  },
  {
    id: 'perdido',
    name: '12. Perdido (Lost)',
    color: 'text-slate-700',
    bgColor: 'bg-slate-100/80',
    borderColor: 'border-slate-300',
    badgeColor: 'bg-slate-200 text-slate-800',
    description: 'Oportunidade desqualificada ou perdida',
    slaHours: 0,
    isFinal: 'lost',
    requiredFields: [
      {
        id: 'motivoPerda',
        label: 'Motivo da Perda',
        type: 'select',
        required: true,
        options: [
          'Preço muito alto',
          'Escolheu concorrente',
          'Sem orçamento atual',
          'Desistiu do projeto',
          'Lead sumiu (Ghosting)',
          'Fora do Perfil (ICP)',
          'Outro',
        ],
      },
      {
        id: 'detalhesPerda',
        label: 'Detalhamento do Motivo / Lições Aprendidas',
        type: 'textarea',
        required: false,
      },
    ],
  },
];

export const INITIAL_CARDS: CRMCard[] = [];

export const INITIAL_AUTOMATIONS: AutomationRule[] = [
  {
    id: 'auto-1',
    title: 'Disparo de Boas-Vindas WhatsApp no Diagnóstico',
    description: 'Quando um card entrar na fase Diagnóstica, disparar mensagem automática no WhatsApp com link de confirmação de reunião.',
    enabled: true,
    trigger: 'phase_enter',
    triggerPhase: 'diagnostica',
    actions: [
      {
        type: 'send_whatsapp_template',
        params: {
          templateId: 'diagnostico_confirmacao',
          messageText: 'Olá {{contato}}, tudo bem? Confirmando nossa reunião de Diagnóstico Estratégico. Estaremos prontos no horário combinado.',
        },
      },
      {
        type: 'add_tag',
        params: {
          tagToAdd: 'Diagnóstico Confirmado',
        },
      },
    ],
    executionCount: 24,
    lastExecutedAt: '2026-08-19T16:30:00Z',
  },
  {
    id: 'auto-2',
    title: 'Alerta de Gerente: SLA Excedido no Follow-up 2',
    description: 'Notificar gerente imediatamente se um card permanecer mais de 48 horas em Follow up 2 sem nenhuma nova interação registrada.',
    enabled: true,
    trigger: 'sla_breach',
    triggerPhase: 'followup_2',
    actions: [
      {
        type: 'notify_manager',
        params: {
          notificationUrgency: 'critical',
          messageText: 'Card {{titulo}} da empresa {{empresa}} ultrapassou 48h sem resposta no Follow-up 2!',
        },
      },
    ],
    executionCount: 12,
    lastExecutedAt: '2026-08-20T18:00:00Z',
  },
  {
    id: 'auto-3',
    title: 'Celebração e Notificação de Fechamento Ganho',
    description: 'Ao mover para a fase Ganho, notificar todos os gestores e gerar checklist de Onboarding imediato.',
    enabled: true,
    trigger: 'card_won',
    actions: [
      {
        type: 'notify_manager',
        params: {
          notificationUrgency: 'info',
          messageText: '🎉 Parabéns! Negócio fechado no valor de {{valor}} pelo consultor {{consultor}}!',
        },
      },
      {
        type: 'create_checklist_task',
        params: {
          taskTitle: 'Agendar Reunião de Kick-off com Equipe de Onboarding',
        },
      },
    ],
    executionCount: 15,
    lastExecutedAt: '2026-08-18T14:30:00Z',
  },
  {
    id: 'auto-4',
    title: 'Distribuição Inteligente de Leads Mapeados',
    description: 'Ao registrar um novo lead Mapeado, atribuir automaticamente consultor de acordo com o segmento da empresa.',
    enabled: true,
    trigger: 'card_created',
    actions: [
      {
        type: 'create_checklist_task',
        params: {
          taskTitle: 'Realizar enriquecimento de dados e 1º contato em até 24h',
        },
      },
    ],
    executionCount: 42,
    lastExecutedAt: '2026-08-21T09:00:00Z',
  },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [];
