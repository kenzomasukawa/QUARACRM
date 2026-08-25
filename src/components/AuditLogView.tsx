import React, { useState } from 'react';
import {
  FileText,
  Download,
  Search,
  Filter,
  UserCheck,
  Zap,
  MessageSquare,
  Mail,
  Shield,
  Clock,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { formatDate } from '../utils/formatters';
import { exportAuditLogsToCSV } from '../utils/exportUtils';
import { AuditLogEntry } from '../types/crm';

export const AuditLogView: React.FC = () => {
  const { auditLogs, users, currentUser } = useCRM();

  const [searchLog, setSearchLog] = useState('');
  const [selectedUserFilter, setSelectedUserFilter] = useState('all');
  const [selectedActionFilter, setSelectedActionFilter] = useState('all');

  // RBAC Access Guard
  if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 bg-white dark:bg-neutral-900 border border-red-200 dark:border-red-900/40 rounded-2xl shadow-xl text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Acesso Restrito à Trilha de Auditoria</h2>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-md mx-auto">
          A visualização do registro cronológico de ações, mensagens e auditoria do sistema é restrita a administradores e gestores para garantir a conformidade e integridade dos dados da organização.
        </p>
      </div>
    );
  }

  const filteredLogs = auditLogs.filter((log) => {
    if (selectedUserFilter !== 'all' && log.userId !== selectedUserFilter) return false;
    if (selectedActionFilter !== 'all' && log.action !== selectedActionFilter) return false;
    if (searchLog.trim()) {
      const q = searchLog.toLowerCase();
      return (
        log.details.toLowerCase().includes(q) ||
        log.userName.toLowerCase().includes(q) ||
        (log.cardTitle && log.cardTitle.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getActionBadge = (action: AuditLogEntry['action']) => {
    switch (action) {
      case 'card_created':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Card Criado</span>;
      case 'card_moved':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">Fase Alterada</span>;
      case 'whatsapp_sent':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900">WhatsApp</span>;
      case 'email_sent':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900">E-mail</span>;
      case 'automation_executed':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">Automação</span>;
      case 'goals_updated':
      case 'permissions_updated':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900">Segurança/Admin</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">Edição</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-red-600 dark:text-red-500" />
            <span>Log Completo de Auditoria & Rastreabilidade</span>
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Registro cronológico imutável de todas as ações de usuários, mensagens, automações e alterações no pipeline
          </p>
        </div>

        <button
          onClick={() => exportAuditLogsToCSV(filteredLogs)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4 text-red-500" />
          <span>Exportar Trilha de Auditoria (CSV)</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchLog}
              onChange={(e) => setSearchLog(e.target.value)}
              placeholder="Buscar por detalhes, empresa ou usuário..."
              className="pl-8 pr-3 py-1.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20 w-64"
            />
          </div>

          <select
            value={selectedUserFilter}
            onChange={(e) => setSelectedUserFilter(e.target.value)}
            className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20"
          >
            <option value="all">👤 Todos os Usuários</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>

          <select
            value={selectedActionFilter}
            onChange={(e) => setSelectedActionFilter(e.target.value)}
            className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20"
          >
            <option value="all">⚡ Todos os Tipos de Ação</option>
            <option value="card_created">Criação de Cards</option>
            <option value="card_moved">Movimentação de Fases</option>
            <option value="whatsapp_sent">WhatsApp Disparado</option>
            <option value="email_sent">E-mail Enviado</option>
            <option value="automation_executed">Execução de Automação</option>
            <option value="goals_updated">Atualização de Metas</option>
            <option value="permissions_updated">Permissões de Acesso</option>
          </select>
        </div>

        <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">{filteredLogs.length} eventos registrados</span>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-neutral-100 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400 font-bold uppercase text-[10px] border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th className="p-3.5">Data / Hora</th>
                <th className="p-3.5">Usuário Responsável</th>
                <th className="p-3.5">Tipo de Ação</th>
                <th className="p-3.5">Card / Oportunidade</th>
                <th className="p-3.5">Detalhamento da Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-850/60 transition-colors">
                  <td className="p-3.5 font-mono text-neutral-500 dark:text-neutral-400 text-[11px] whitespace-nowrap">
                    {formatDate(log.timestamp)}
                  </td>
                  <td className="p-3.5">
                    <span className="font-bold text-neutral-900 dark:text-neutral-100 block">{log.userName}</span>
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase font-semibold">{log.userRole}</span>
                  </td>
                  <td className="p-3.5">{getActionBadge(log.action)}</td>
                  <td className="p-3.5">
                    {log.cardTitle ? (
                      <div>
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200 block">{log.cardTitle}</span>
                        <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">{log.cardId}</span>
                      </div>
                    ) : (
                      <span className="text-neutral-400 dark:text-neutral-500">-</span>
                    )}
                  </td>
                  <td className="p-3.5 text-neutral-600 dark:text-neutral-400 max-w-md">{log.details}</td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-neutral-400 dark:text-neutral-500">
                    Nenhum registro de auditoria encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
