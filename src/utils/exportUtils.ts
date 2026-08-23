import { CRMCard, AuditLogEntry, User, PhaseConfig, CRMBackupData, AutomationRule, NotificationItem } from '../types/crm';
import { formatCurrency, formatDate } from './formatters';

export function exportAllToJSON(data: CRMBackupData) {
  const jsonString = JSON.stringify(data, null, 2);
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  downloadFile(jsonString, `pipecrm_backup_${dateStr}_${timeStr}.json`, 'application/json;charset=utf-8;');
}

export function validateBackupJSON(jsonString: string): {
  valid: boolean;
  data?: CRMBackupData;
  error?: string;
  summary?: {
    cardsCount: number;
    phasesCount: number;
    usersCount: number;
    automationsCount: number;
    exportedAt?: string;
  };
} {
  try {
    const parsed = JSON.parse(jsonString);

    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'O arquivo selecionado não contém um JSON válido.' };
    }

    if (!Array.isArray(parsed.cards) && !Array.isArray(parsed.users) && !Array.isArray(parsed.phases)) {
      return {
        valid: false,
        error: 'Estrutura inválida: O arquivo não contém coleções do PipeCRM (cards, usuários ou fases).',
      };
    }

    const cards = Array.isArray(parsed.cards) ? parsed.cards : [];
    const phases = Array.isArray(parsed.phases) ? parsed.phases : [];
    const users = Array.isArray(parsed.users) ? parsed.users : [];
    const automations = Array.isArray(parsed.automations) ? parsed.automations : [];
    const notifications = Array.isArray(parsed.notifications) ? parsed.notifications : [];
    const auditLogs = Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [];

    const data: CRMBackupData = {
      version: parsed.version || 1,
      exportedAt: parsed.exportedAt || new Date().toISOString(),
      app: 'PipeCRM',
      currentUserId: parsed.currentUserId,
      users,
      phases,
      cards,
      automations,
      notifications,
      auditLogs,
    };

    return {
      valid: true,
      data,
      summary: {
        cardsCount: cards.length,
        phasesCount: phases.length,
        usersCount: users.length,
        automationsCount: automations.length,
        exportedAt: parsed.exportedAt,
      },
    };
  } catch (err: any) {
    return { valid: false, error: `Erro ao analisar JSON: ${err.message || 'Arquivo corrompido'}` };
  }
}

export function getLocalStorageSizeKB(): { usedKB: number; itemsCount: number } {
  let totalBytes = 0;
  let itemsCount = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('pipecrm_app_v2_')) {
        const val = localStorage.getItem(key) || '';
        totalBytes += (key.length + val.length) * 2;
        itemsCount++;
      }
    }
  } catch {
    // ignore
  }
  return {
    usedKB: Math.round(totalBytes / 1024),
    itemsCount,
  };
}

export function exportCardsToCSV(cards: CRMCard[], phases: PhaseConfig[], users: User[]) {
  const userMap = new Map(users.map((u) => [u.id, u.name]));
  const phaseMap = new Map(phases.map((p) => [p.id, p.name]));

  const headers = [
    'ID do Card',
    'Título',
    'Empresa',
    'Contato',
    'E-mail',
    'Telefone / WhatsApp',
    'Fase Atual',
    'Responsável',
    'Valor (R$)',
    'Prioridade',
    'Tags',
    'Data de Criação',
    'Última Atualização',
    // Custom mapped fields
    'Canal de Prospeccao',
    'Data Mapeamento',
    'Dores Identificadas',
    'Orcamento Estimado',
    'Decisor Identificado',
    'Valor Proposta',
    'Principal Objecao',
    'Follow-up 1 Resumo',
    'Follow-up 2 Resumo',
    'Follow-up 3 Resumo',
    'Follow-up 4 Resumo',
    'Follow-up 5 Resumo',
    'Motivo da Perda',
    'Detalhes da Perda',
  ];

  const rows = cards.map((c) => {
    return [
      c.id,
      `"${(c.title || '').replace(/"/g, '""')}"`,
      `"${(c.companyName || '').replace(/"/g, '""')}"`,
      `"${(c.contactName || '').replace(/"/g, '""')}"`,
      `"${(c.contactEmail || '').replace(/"/g, '""')}"`,
      `"${(c.contactPhone || c.contactWhatsapp || '').replace(/"/g, '""')}"`,
      `"${phaseMap.get(c.phaseId) || c.phaseId}"`,
      `"${userMap.get(c.assignedUserId) || 'Não atribuído'}"`,
      c.value || 0,
      c.priority,
      `"${(c.tags || []).join(', ')}"`,
      `"${formatDate(c.createdAt)}"`,
      `"${formatDate(c.updatedAt)}"`,
      `"${(c.customFields?.canalProspeccao || '').replace(/"/g, '""')}"`,
      `"${(c.customFields?.dataMapeamento || '').replace(/"/g, '""')}"`,
      `"${(c.customFields?.doresIdentificadas || '').replace(/"/g, '""')}"`,
      c.customFields?.orcamentoEstimado || 0,
      `"${(c.customFields?.decisorIdentificado || '').replace(/"/g, '""')}"`,
      c.customFields?.valorProposta || 0,
      `"${(c.customFields?.principalObjecao || '').replace(/"/g, '""')}"`,
      `"${(c.customFields?.followup1Resumo || '').replace(/"/g, '""')}"`,
      `"${(c.customFields?.followup2Resumo || '').replace(/"/g, '""')}"`,
      `"${(c.customFields?.followup3Resumo || '').replace(/"/g, '""')}"`,
      `"${(c.customFields?.followup4Resumo || '').replace(/"/g, '""')}"`,
      `"${(c.customFields?.followup5Resumo || '').replace(/"/g, '""')}"`,
      `"${(c.customFields?.motivoPerda || '').replace(/"/g, '""')}"`,
      `"${(c.customFields?.detalhesPerda || '').replace(/"/g, '""')}"`,
    ].join(';');
  });

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
  downloadFile(csvContent, `crm_pipeline_export_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
}

export function exportAuditLogsToCSV(logs: AuditLogEntry[]) {
  const headers = ['ID', 'Data/Hora', 'Usuário', 'Cargo', 'Ação Realizada', 'Detalhes', 'Card ID', 'Card Título'];

  const rows = logs.map((l) => [
    l.id,
    `"${formatDate(l.timestamp)}"`,
    `"${l.userName}"`,
    `"${l.userRole}"`,
    `"${l.action}"`,
    `"${(l.details || '').replace(/"/g, '""')}"`,
    `"${l.cardId || '-'}"`,
    `"${(l.cardTitle || '-').replace(/"/g, '""')}"`,
  ].join(';'));

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
  downloadFile(csvContent, `crm_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
}

export function exportConsultantReportToCSV(users: User[], cards: CRMCard[]) {
  const headers = [
    'Consultor',
    'E-mail',
    'Cargo',
    'Meta R$',
    'Realizado R$',
    '% Atingimento Meta R$',
    'Meta Qtd Leads Fechados',
    'Qtd Fechados Atual',
    'Total de Cards Ativos',
    'Pipeline Ativo R$',
    'Taxa de Conversão Estimada',
  ];

  const rows = users
    .filter((u) => u.role === 'consultant' || u.role === 'manager')
    .map((u) => {
      const userCards = cards.filter((c) => c.assignedUserId === u.id);
      const wonCards = userCards.filter((c) => c.phaseId === 'ganho');
      const wonTotal = wonCards.reduce((acc, c) => acc + (c.value || 0), 0);
      const activeCards = userCards.filter((c) => c.phaseId !== 'ganho' && c.phaseId !== 'perdido');
      const activeTotal = activeCards.reduce((acc, c) => acc + (c.value || 0), 0);
      const percentVal = u.monthlyGoalValue > 0 ? ((wonTotal / u.monthlyGoalValue) * 100).toFixed(1) + '%' : '0%';
      const conversionRate = userCards.length > 0 ? ((wonCards.length / userCards.length) * 100).toFixed(1) + '%' : '0%';

      return [
        `"${u.name}"`,
        `"${u.email}"`,
        `"${u.role}"`,
        u.monthlyGoalValue,
        wonTotal,
        percentVal,
        u.monthlyGoalLeads,
        wonCards.length,
        activeCards.length,
        activeTotal,
        conversionRate,
      ].join(';');
    });

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
  downloadFile(csvContent, `crm_produtividade_consultores_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
