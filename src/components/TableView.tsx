import React, { useState } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Phone,
  Eye,
  ExternalLink,
  ChevronRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { PhaseId, Priority, CRMCard, User } from '../types/crm';
import { formatCurrency, formatDate, getWhatsAppDirectUrl, WHATSAPP_WEB_TARGET } from '../utils/formatters';
import { exportCardsToCSV } from '../utils/exportUtils';

export const TableView: React.FC = () => {
  const {
    cards,
    phases,
    users,
    setSelectedCard,
    moveCardPhase,
    requestPhaseTransition,
    searchQuery,
    setSearchQuery,
    activeFilterConsultant,
    setActiveFilterConsultant,
    activePriorityFilter,
    setActivePriorityFilter,
  } = useCRM();

  const [sortField, setSortField] = useState<keyof CRMCard>('createdAt');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState<string>('all');

  const userMap = new Map<string, User>(users.map((u) => [u.id, u]));
  const phaseMap = new Map(phases.map((p) => [p.id, p]));

  // Filter
  const filteredCards = cards.filter((card) => {
    if (activeFilterConsultant !== 'all' && card.assignedUserId !== activeFilterConsultant) return false;
    if (activePriorityFilter !== 'all' && card.priority !== activePriorityFilter) return false;
    if (selectedPhaseFilter !== 'all' && card.phaseId !== selectedPhaseFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = card.title.toLowerCase().includes(q);
      const matchCompany = card.companyName.toLowerCase().includes(q);
      const matchContact = card.contactName.toLowerCase().includes(q);
      const matchTags = card.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchCompany && !matchContact && !matchTags) return false;
    }
    return true;
  });

  // Sort
  const sortedCards = [...filteredCards].sort((a, b) => {
    let aVal = a[sortField] ?? '';
    let bVal = b[sortField] ?? '';

    if (typeof aVal === 'string') {
      const cmp = (aVal as string).localeCompare(bVal as string);
      return sortAsc ? cmp : -cmp;
    } else {
      const cmp = (aVal as number) - (bVal as number);
      return sortAsc ? cmp : -cmp;
    }
  });

  const handleSort = (field: keyof CRMCard) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case 'urgente':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">Urgente</span>;
      case 'alta':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">Alta</span>;
      case 'media':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800">Média</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">Baixa</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-7xl mx-auto">
      {/* Table Toolbar */}
      <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Phase Filter */}
          <select
            value={selectedPhaseFilter}
            onChange={(e) => setSelectedPhaseFilter(e.target.value)}
            className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-300 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          >
            <option value="all">📂 Todas as 12 Fases</option>
            {phases.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Consultant Filter */}
          <select
            value={activeFilterConsultant}
            onChange={(e) => setActiveFilterConsultant(e.target.value)}
            className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-300 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          >
            <option value="all">👤 Todos Consultores</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={activePriorityFilter}
            onChange={(e) => setActivePriorityFilter(e.target.value)}
            className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-300 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          >
            <option value="all">⚡ Prioridade: Todas</option>
            <option value="urgente">Urgente</option>
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCardsToCSV(sortedCards, phases, users)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-700 dark:text-neutral-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>Exportar CSV ({sortedCards.length})</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-neutral-50 dark:bg-neutral-950 text-neutral-500 dark:text-neutral-400 font-bold border-b border-neutral-200 dark:border-neutral-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5 cursor-pointer" onClick={() => handleSort('id')}>
                  <div className="flex items-center gap-1">
                    <span>ID</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3.5 cursor-pointer" onClick={() => handleSort('title')}>
                  <div className="flex items-center gap-1">
                    <span>Card / Empresa</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3.5 cursor-pointer" onClick={() => handleSort('phaseId')}>
                  <div className="flex items-center gap-1">
                    <span>Fase do Processo</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3.5 cursor-pointer" onClick={() => handleSort('value')}>
                  <div className="flex items-center gap-1">
                    <span>Valor</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3.5">Contato & WhatsApp</th>
                <th className="p-3.5">Consultor</th>
                <th className="p-3.5 cursor-pointer" onClick={() => handleSort('priority')}>
                  <div className="flex items-center gap-1">
                    <span>Prioridade</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3.5 cursor-pointer" onClick={() => handleSort('createdAt')}>
                  <div className="flex items-center gap-1">
                    <span>Criado em</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300">
              {sortedCards.map((card) => {
                const phase = phaseMap.get(card.phaseId);
                const user = userMap.get(card.assignedUserId);

                return (
                  <tr
                    key={card.id}
                    className="hover:bg-neutral-50/80 dark:hover:bg-neutral-850/60 transition-colors group cursor-pointer"
                    onClick={() => setSelectedCard(card)}
                  >
                    <td className="p-3.5 font-mono font-bold text-neutral-400 dark:text-neutral-500">{card.id}</td>
                    <td className="p-3.5">
                      <p className="font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                        {card.title || card.companyName}
                      </p>
                      {card.title && (
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">{card.companyName}</p>
                      )}
                    </td>
                    <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={card.phaseId}
                        onChange={(e) => requestPhaseTransition(card, e.target.value as PhaseId)}
                        className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-medium text-[11px] rounded-lg border border-neutral-200 dark:border-neutral-700 focus:outline-none cursor-pointer"
                      >
                        {phases.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3.5 font-bold text-rose-600 dark:text-rose-400">
                      {card.value > 0 ? formatCurrency(card.value) : '-'}
                    </td>
                    <td className="p-3.5">
                      <p className="font-semibold text-neutral-800 dark:text-neutral-200">{card.contactName}</p>
                      {card.contactPhone && (
                        <a
                          href={getWhatsAppDirectUrl(card.contactPhone)}
                          target={WHATSAPP_WEB_TARGET}
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-mono"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{card.contactPhone}</span>
                        </a>
                      )}
                    </td>
                    <td className="p-3.5">
                      {user && (
                        <div className="flex items-center gap-1.5">
                          <img src={user.avatar} alt={user.name} className="w-5 h-5 rounded-full object-cover" />
                          <span className="font-medium text-neutral-700 dark:text-neutral-300 truncate max-w-[100px]">{user.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-3.5">{getPriorityBadge(card.priority)}</td>
                    <td className="p-3.5 text-neutral-500 dark:text-neutral-400 text-[11px]">{formatDate(card.createdAt)}</td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCard(card);
                        }}
                        className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors font-semibold cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {sortedCards.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-neutral-400 dark:text-neutral-500">
                    Nenhum card encontrado com os filtros atuais.
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
