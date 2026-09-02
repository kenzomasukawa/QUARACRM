import React, { useState } from 'react';
import {
  Plus,
  Clock,
  CheckSquare,
  MessageSquare,
  ChevronRight,
  Phone,
  Filter,
  CheckCircle2,
  XCircle,
  Building2,
  ArrowRight,
  Sparkles,
  Paperclip,
  RotateCw,
  User as UserIcon,
  Tag,
} from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { PhaseId, CRMCard, Priority, User, PhaseConfig } from '../types/crm';
import { formatCurrency, getSLAStatus, getWhatsAppDirectUrl, WHATSAPP_WEB_TARGET } from '../utils/formatters';
import { ALLOWED_TRANSITIONS } from '../utils/phaseTransitions';

export const KanbanBoard: React.FC = () => {
  const {
    phases,
    cards,
    users,
    setSelectedCard,
    openNewCardModal,
    moveCardPhase,
    requestPhaseTransition,
    activeFilterConsultant,
    setActiveFilterConsultant,
    activePriorityFilter,
    setActivePriorityFilter,
    searchQuery,
  } = useCRM();

  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragOverPhaseId, setDragOverPhaseId] = useState<PhaseId | null>(null);

  // User Map for quick lookup
  const userMap = new Map<string, User>(users.map((u) => [u.id, u]));

  // Filter cards
  const filteredCards = cards.filter((card) => {
    // Consultant filter
    if (activeFilterConsultant !== 'all' && card.assignedUserId !== activeFilterConsultant) {
      return false;
    }
    // Priority filter
    if (activePriorityFilter !== 'all' && card.priority !== activePriorityFilter) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = card.title.toLowerCase().includes(q);
      const matchCompany = card.companyName.toLowerCase().includes(q);
      const matchContact = card.contactName.toLowerCase().includes(q);
      const matchTags = card.tags.some((t) => t.toLowerCase().includes(q));
      const matchValue = card.value.toString().includes(q);
      if (!matchTitle && !matchCompany && !matchContact && !matchTags && !matchValue) {
        return false;
      }
    }
    return true;
  });

  // Calculate Pipeline Metrics Summary
  const totalPipelineValue = filteredCards
    .filter((c) => c.phaseId !== 'ganho' && c.phaseId !== 'perdido')
    .reduce((sum, c) => sum + (c.value || 0), 0);

  const totalWonValue = filteredCards
    .filter((c) => c.phaseId === 'ganho')
    .reduce((sum, c) => sum + (c.value || 0), 0);

  const totalWonCount = filteredCards.filter((c) => c.phaseId === 'ganho').length;
  const totalLostCount = filteredCards.filter((c) => c.phaseId === 'perdido').length;

  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    e.dataTransfer.setData('text/plain', cardId);
    setDraggedCardId(cardId);
  };

  const handleDragOver = (e: React.DragEvent, phaseId: PhaseId) => {
    e.preventDefault();
    setDragOverPhaseId(phaseId);
  };

  const handleDragLeave = () => {
    setDragOverPhaseId(null);
  };

  const handleDrop = (e: React.DragEvent, targetPhaseId: PhaseId) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('text/plain') || draggedCardId;
    if (cardId) {
      const card = cards.find((c) => c.id === cardId);
      if (card) {
        requestPhaseTransition(card, targetPhaseId);
      }
    }
    setDraggedCardId(null);
    setDragOverPhaseId(null);
  };

  const getPriorityIndicator = (priority: Priority) => {
    switch (priority) {
      case 'urgente':
        return <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" title="Prioridade Urgente" />;
      case 'alta':
        return <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="Prioridade Alta" />;
      case 'media':
        return <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" title="Prioridade Média" />;
      default:
        return <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" title="Prioridade Baixa" />;
    }
  };

  const getNextPhase = (currentPhaseId: PhaseId): PhaseId | null => {
    const idx = phases.findIndex((p) => p.id === currentPhaseId);
    if (idx >= 0 && idx < phases.length - 2) {
      return phases[idx + 1].id;
    }
    return null;
  };

  // Helper for Pipefy Top Border Color per Phase
  const getPhaseTopBorderClass = (phaseId: string, idx: number) => {
    switch (phaseId) {
      case 'mapeados':
        return 'border-t-4 border-t-neutral-400';
      case 'prospeccao':
        return 'border-t-4 border-t-amber-500';
      case 'diagnostica':
        return 'border-t-4 border-t-teal-500';
      case 'elaboracao':
        return 'border-t-4 border-t-cyan-500';
      case 'apresentacao':
        return 'border-t-4 border-t-blue-500';
      case 'negociacao':
        return 'border-t-4 border-t-rose-500'; // Light Red highlight
      case 'formalizacao':
        return 'border-t-4 border-t-purple-500';
      case 'contrato':
        return 'border-t-4 border-t-indigo-500';
      case 'fechamento':
        return 'border-t-4 border-t-pink-500';
      case 'onboarding':
        return 'border-t-4 border-t-sky-500';
      case 'ganho':
        return 'border-t-4 border-t-emerald-500';
      case 'perdido':
        return 'border-t-4 border-t-rose-600';
      default:
        const colors = [
          'border-t-neutral-400',
          'border-t-amber-500',
          'border-t-teal-500',
          'border-t-cyan-500',
          'border-t-blue-500',
          'border-t-rose-500',
          'border-t-purple-500',
          'border-t-emerald-500',
        ];
        return `border-t-4 ${colors[idx % colors.length]}`;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-88px)] bg-[#f4f6f8] dark:bg-neutral-950 overflow-hidden transition-colors duration-200">
      {/* Top Filter & Metric Ribbon */}
      <div className="bg-white dark:bg-neutral-950 px-4 sm:px-6 py-2 border-b border-neutral-200/80 dark:border-neutral-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Quick Filter Selectors */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-neutral-400 dark:text-neutral-500 font-medium mr-0.5">
            <Filter className="w-3.5 h-3.5 text-rose-500" />
            <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Filtrar:</span>
          </div>

          {/* Consultant Filter */}
          <select
            id="filter-consultant-select"
            value={activeFilterConsultant}
            onChange={(e) => setActiveFilterConsultant(e.target.value)}
            className="px-2.5 py-1 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-200 font-medium focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:outline-none text-xs cursor-pointer"
          >
            <option value="all">Todos os Consultores</option>
            {users
              .filter((u) => u.role === 'consultant' || u.role === 'manager')
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role === 'manager' ? 'Gerente' : 'Consultor'})
                </option>
              ))}
          </select>

          {/* Priority Filter */}
          <select
            id="filter-priority-select"
            value={activePriorityFilter}
            onChange={(e) => setActivePriorityFilter(e.target.value)}
            className="px-2.5 py-1 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-200 font-medium focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:outline-none text-xs cursor-pointer"
          >
            <option value="all">Todas as Prioridades</option>
            <option value="urgente">🔴 Urgente</option>
            <option value="alta">🟠 Alta</option>
            <option value="media">🔵 Média</option>
            <option value="baixa">⚪ Baixa</option>
          </select>
        </div>

        {/* Pipeline Totals Summary Pill */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 px-3 py-1 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200/90 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300">
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400">Em Aberto:</span>
            <span className="font-bold text-neutral-900 dark:text-neutral-100">{formatCurrency(totalPipelineValue)}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300">
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">Ganhos:</span>
            <span className="font-bold">{formatCurrency(totalWonValue)}</span>
            <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-300 px-1.5 py-0.2 rounded-full">
              {totalWonCount}
            </span>
          </div>
        </div>
      </div>

      {/* Horizontal Pipefy Kanban Columns Container */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 flex gap-3.5 items-start">
        {phases.map((phase, idx) => {
          const phaseCards = filteredCards.filter((c) => c.phaseId === phase.id);
          const phaseTotalValue = phaseCards.reduce((acc, c) => acc + (c.value || 0), 0);
          const isOver = dragOverPhaseId === phase.id;
          const topBorderClass = getPhaseTopBorderClass(phase.id, idx);

          return (
            <div
              key={phase.id}
              id={`kanban-column-${phase.id}`}
              onDragOver={(e) => handleDragOver(e, phase.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, phase.id)}
              className={`w-[290px] shrink-0 flex flex-col max-h-full rounded-xl bg-[#ebedf0]/70 dark:bg-neutral-900/80 border transition-all duration-150 shadow-2xs ${topBorderClass} ${
                isOver
                  ? 'border-rose-500 bg-rose-50/40 ring-2 ring-rose-500/40 dark:bg-rose-950/40 dark:border-rose-600'
                  : 'border-neutral-200/90 dark:border-neutral-800/90'
              }`}
            >
              {/* Column Header (Pipefy Style) */}
              <div className="p-3 bg-white dark:bg-neutral-900 border-b border-neutral-200/80 dark:border-neutral-800 rounded-t-lg">
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 truncate tracking-tight">
                      {phase.name.replace(/^\d+\.\s*/, '')}
                    </h3>
                    <span className="px-2 py-0.5 text-[11px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-md">
                      {phaseCards.length}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => openNewCardModal(phase.id)}
                    title={`Adicionar card em ${phase.name}`}
                    className="p-1 rounded-md text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">{formatCurrency(phaseTotalValue)}</span>
                  {phase.slaHours > 0 ? (
                    <span className="flex items-center gap-1 text-[10px] text-neutral-400 dark:text-neutral-500 font-medium">
                      <Clock className="w-2.5 h-2.5 text-amber-500" /> SLA {phase.slaHours}h
                    </span>
                  ) : (
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500">Etapa final</span>
                  )}
                </div>
              </div>

              {/* Column 1 Action Button: '+ Nova oportunidade' (Pipefy Style in Light Red) */}
              {idx === 0 && (
                <div className="p-2 bg-white/80 dark:bg-neutral-900/80 border-b border-neutral-200/60 dark:border-neutral-800">
                  <button
                    id="btn-new-opportunity-column"
                    type="button"
                    onClick={() => openNewCardModal('mapeados')}
                    className="w-full py-2 px-3 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Nova oportunidade</span>
                  </button>
                </div>
              )}

              {/* Card List in Column (Signature Pipefy Card Style) */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2.5 custom-scrollbar min-h-[140px]">
                {phaseCards.map((card) => {
                  const assignedUser = userMap.get(card.assignedUserId);
                  const sla = getSLAStatus(card.enteredCurrentPhaseAt, phase.slaHours);
                  const completedTasks = card.checklist.filter((i) => i.completed).length;
                  const nextPhase = getNextPhase(card.phaseId);

                  const allowedDestinations = ALLOWED_TRANSITIONS[card.phaseId] || [];
                  const mainNextPhaseId = nextPhase || (allowedDestinations.length > 0 ? allowedDestinations[0] : null);
                  const mainNextPhaseObj = phases.find((p) => p.id === mainNextPhaseId);

                  // Calculate days in current phase (for Pipefy '38d 26d' badge)
                  const enteredAt = card.enteredCurrentPhaseAt ? new Date(card.enteredCurrentPhaseAt) : new Date(card.createdAt);
                  const daysInPhase = Math.max(1, Math.floor((Date.now() - enteredAt.getTime()) / (1000 * 60 * 60 * 24)));
                  const totalDays = Math.max(1, Math.floor((Date.now() - new Date(card.createdAt).getTime()) / (1000 * 60 * 60 * 24)));

                  return (
                    <div
                      key={card.id}
                      id={`card-${card.id}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, card.id)}
                      onClick={() => setSelectedCard(card)}
                      className="group p-3 bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 hover:border-rose-400 dark:hover:border-rose-500/80 rounded-xl shadow-2xs hover:shadow-md transition-all cursor-pointer relative flex flex-col gap-2"
                    >
                      {/* Top Bar: Company Name & Priority */}
                      <div className="flex items-start justify-between gap-1.5">
                        <h4 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 uppercase tracking-tight line-clamp-1 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                          {card.companyName || card.title}
                        </h4>
                        <div className="flex items-center gap-1 mt-0.5 shrink-0">
                          {getPriorityIndicator(card.priority)}
                        </div>
                      </div>

                      {/* Consultor Responsável & Canal de Prospecção — the fields that identify who owns this lead and how it came in */}
                      {(assignedUser || card.customFields?.canalProspeccao) && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {assignedUser && (
                            <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                              <img
                                src={assignedUser.avatar}
                                alt={assignedUser.name}
                                className="w-3.5 h-3.5 rounded-full object-cover ring-1 ring-neutral-300 dark:ring-neutral-700"
                              />
                              {assignedUser.name}
                            </span>
                          )}
                          {card.customFields?.canalProspeccao && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-900/50 truncate max-w-[140px]">
                              {card.customFields.canalProspeccao}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Pipefy Label Row: [A] NOME DO CONTATO */}
                      {card.contactName && (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-[9px] font-bold text-neutral-400 dark:text-neutral-500 tracking-wider uppercase">
                            <span className="w-3.5 h-3.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 flex items-center justify-center text-[8px] font-bold">
                              A
                            </span>
                            <span>NOME DO CONTATO</span>
                          </div>
                          <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate capitalize pl-4.5">
                            {card.contactName}
                          </p>
                        </div>
                      )}

                      {/* Tags or Deal Value Badge */}
                      {card.value > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/70 dark:border-rose-900/50">
                            {formatCurrency(card.value)}
                          </span>
                          {card.tags.slice(0, 1).map((t, tidx) => (
                            <span key={tidx} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 truncate max-w-[100px]">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Fast One-Click Phase Advance Action */}
                      {mainNextPhaseObj && (
                        <div
                          className="pt-1 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => requestPhaseTransition(card, mainNextPhaseObj.id)}
                            title={`Avançar para ${mainNextPhaseObj.name}`}
                            className="w-full flex items-center justify-center gap-1 py-1 px-2 text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/70 dark:hover:bg-rose-900/60 rounded-lg transition-colors border border-rose-200/80 dark:border-rose-900/60 cursor-pointer"
                          >
                            <span>➔ {mainNextPhaseObj.name.replace(/^\d+\.\s*/, '')}</span>
                          </button>
                        </div>
                      )}

                      {/* Pipefy Card Bottom: SLA indicators (38d, 26d), Attachment & Assignee Avatar */}
                      <div className="pt-1.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[10px] text-neutral-400 dark:text-neutral-500">
                        <div className="flex items-center gap-2">
                          {/* Attachments / Checklist count */}
                          {card.checklist.length > 0 && (
                            <span className="flex items-center gap-0.5 text-neutral-500 dark:text-neutral-400 font-medium">
                              <Paperclip className="w-3 h-3 text-neutral-400" />
                              <span>{completedTasks}/{card.checklist.length}</span>
                            </span>
                          )}

                          {/* Pipefy Days in Phase & Total Days: 🕒 38d 🕒 26d 🔄 26d */}
                          <div className="flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
                            <span className="flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5 text-amber-500" />
                              <span>{daysInPhase}d</span>
                            </span>
                            <span className="flex items-center gap-0.5 text-neutral-400 dark:text-neutral-500">
                              <RotateCw className="w-2.5 h-2.5" />
                              <span>{totalDays}d</span>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Quick WhatsApp Action */}
                          {card.contactPhone && (
                            <a
                              href={getWhatsAppDirectUrl(card.contactPhone, `Olá ${card.contactName}, tudo bem? Sou da equipe QuaraCRM.`)}
                              target={WHATSAPP_WEB_TARGET}
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              title="Abrir WhatsApp"
                              className="text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors p-0.5"
                            >
                              <Phone className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {phaseCards.length === 0 && (
                  <div className="p-4 border border-dashed border-neutral-300/80 dark:border-neutral-800 rounded-xl text-center">
                    <p className="text-[11px] text-neutral-400 dark:text-neutral-500">Sem cards nesta etapa</p>
                    <button
                      onClick={() => openNewCardModal(phase.id)}
                      className="mt-1 text-[10px] text-rose-600 dark:text-rose-400 hover:underline font-semibold cursor-pointer"
                    >
                      + Criar Card
                    </button>
                  </div>
                )}
              </div>

              {/* Column Footer: Quick Add Button */}
              <div className="p-1.5 border-t border-neutral-200/50 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 rounded-b-xl">
                <button
                  id={`btn-add-card-phase-${phase.id}`}
                  onClick={() => openNewCardModal(phase.id)}
                  className="w-full flex items-center justify-center gap-1 py-1 text-[11px] text-neutral-500 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/40 rounded-lg transition-colors font-medium cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Novo Card</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
