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
} from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { PhaseId, CRMCard, Priority, User } from '../types/crm';
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

  return (
    <div className="flex flex-col h-[calc(100vh-95px)] bg-neutral-100/70 dark:bg-neutral-950 overflow-hidden transition-colors duration-200">
      {/* Top Filter & Metric Ribbon */}
      <div className="bg-white dark:bg-neutral-950 px-4 sm:px-6 py-2 border-b border-neutral-200/90 dark:border-neutral-800/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Quick Filter Selectors */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-neutral-400 dark:text-neutral-500 font-medium mr-0.5">
            <Filter className="w-3.5 h-3.5" />
          </div>

          {/* Consultant Filter */}
          <select
            id="filter-consultant-select"
            value={activeFilterConsultant}
            onChange={(e) => setActiveFilterConsultant(e.target.value)}
            className="px-2.5 py-1 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-200 font-medium focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none text-xs"
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
            className="px-2.5 py-1 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-200 font-medium focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none text-xs"
          >
            <option value="all">Todas as Prioridades</option>
            <option value="urgente">Urgente</option>
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>

          {(activeFilterConsultant !== 'all' || activePriorityFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setActiveFilterConsultant('all');
                setActivePriorityFilter('all');
              }}
              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-semibold text-xs ml-1 hover:underline cursor-pointer"
            >
              Limpar filtros
            </button>
          )}
        </div>

        {/* Concise Metrics Summary Ribbon */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-lg">
            <span className="text-neutral-500 dark:text-neutral-400">Pipeline:</span>
            <span className="font-bold text-neutral-900 dark:text-neutral-100">{formatCurrency(totalPipelineValue)}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-900/60 rounded-lg text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Ganhos:</span>
            <span className="font-bold">{formatCurrency(totalWonValue)} ({totalWonCount})</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-400">
            <XCircle className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
            <span>Perdidos:</span>
            <span className="font-bold text-neutral-800 dark:text-neutral-200">{totalLostCount}</span>
          </div>
        </div>
      </div>

      {/* Horizontal Kanban Columns Container */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-3.5 sm:p-4 flex gap-3 items-start">
        {phases.map((phase) => {
          const phaseCards = filteredCards.filter((c) => c.phaseId === phase.id);
          const phaseTotalValue = phaseCards.reduce((acc, c) => acc + (c.value || 0), 0);
          const isOver = dragOverPhaseId === phase.id;

          return (
            <div
              key={phase.id}
              id={`kanban-column-${phase.id}`}
              onDragOver={(e) => handleDragOver(e, phase.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, phase.id)}
              className={`w-[280px] shrink-0 flex flex-col max-h-full rounded-xl border transition-all duration-150 ${
                isOver
                  ? 'border-red-500 bg-red-500/10 ring-2 ring-red-500/40 dark:bg-red-950/40 dark:border-red-600'
                  : 'border-neutral-200/90 dark:border-neutral-800/90 bg-neutral-50/70 dark:bg-neutral-900/60'
              }`}
            >
              {/* Column Header */}
              <div className="p-2.5 border-b border-neutral-200/70 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-t-xl">
                <div className="flex items-center justify-between gap-1.5 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full ${phase.color.replace('text-', 'bg-')}`} />
                    <h3 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 truncate">{phase.name}</h3>
                  </div>

                  <span className="px-1.5 py-0.2 text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-full">
                    {phaseCards.length}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">{formatCurrency(phaseTotalValue)}</span>
                  {phase.slaHours > 0 ? (
                    <span className="flex items-center gap-1 text-[10px] text-neutral-400 dark:text-neutral-500">
                      <Clock className="w-2.5 h-2.5" /> {phase.slaHours}h
                    </span>
                  ) : (
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500">Fim</span>
                  )}
                </div>
              </div>

              {/* Card List in Column */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar min-h-[140px]">
                {phaseCards.map((card) => {
                  const assignedUser = userMap.get(card.assignedUserId);
                  const sla = getSLAStatus(card.enteredCurrentPhaseAt, phase.slaHours);
                  const completedTasks = card.checklist.filter((i) => i.completed).length;
                  const nextPhase = getNextPhase(card.phaseId);

                  const allowedDestinations = ALLOWED_TRANSITIONS[card.phaseId] || [];
                  const mainNextPhaseId = nextPhase || (allowedDestinations.length > 0 ? allowedDestinations[0] : null);
                  const mainNextPhaseObj = phases.find((p) => p.id === mainNextPhaseId);

                  return (
                    <div
                      key={card.id}
                      id={`card-${card.id}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, card.id)}
                      onClick={() => setSelectedCard(card)}
                      className="group p-3 bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 hover:border-red-500 dark:hover:border-red-600/80 rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer relative flex flex-col gap-2"
                    >
                      {/* Top Bar: Title & Priority Indicator */}
                      <div className="flex items-start justify-between gap-1.5">
                        <h4 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 line-clamp-1 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                          {card.title}
                        </h4>
                        <div className="flex items-center gap-1 mt-0.5 shrink-0">
                          {getPriorityIndicator(card.priority)}
                        </div>
                      </div>

                      {/* Company & Contact */}
                      <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                        <Building2 className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 shrink-0" />
                        <span className="font-medium text-neutral-700 dark:text-neutral-300 truncate">{card.companyName}</span>
                        {card.contactName && (
                          <>
                            <span className="text-neutral-300 dark:text-neutral-600">•</span>
                            <span className="text-neutral-500 dark:text-neutral-400 truncate">{card.contactName}</span>
                          </>
                        )}
                      </div>

                      {/* Fast One-Click Phase Transition Action Bar */}
                      <div
                        className="flex items-center justify-between gap-1.5 pt-1.5 pb-0.5 border-t border-neutral-100 dark:border-neutral-800/80"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Primary Fast Transition Button */}
                        {mainNextPhaseObj ? (
                          <button
                            type="button"
                            onClick={() => requestPhaseTransition(card, mainNextPhaseObj.id)}
                            title={`Avançar para ${mainNextPhaseObj.name}`}
                            className="flex-1 flex items-center justify-center gap-1 py-1 px-2 text-[10px] font-bold text-red-700 dark:text-red-300 bg-red-50 hover:bg-red-100 dark:bg-red-950/70 dark:hover:bg-red-900/60 dark:hover:text-red-200 rounded-lg transition-colors border border-red-200/80 dark:border-red-900/60 cursor-pointer"
                          >
                            <span>➔ {mainNextPhaseObj.name.split('. ')[1] || mainNextPhaseObj.name}</span>
                          </button>
                        ) : (
                          <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500">Etapa final</span>
                        )}

                        {/* Quick Destination Select Dropdown */}
                        <div className="relative shrink-0">
                          <select
                            value=""
                            onChange={(e) => {
                              if (e.target.value) {
                                requestPhaseTransition(card, e.target.value as PhaseId);
                              }
                            }}
                            className="text-[10px] font-semibold text-neutral-600 dark:text-neutral-300 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 focus:outline-none cursor-pointer"
                            title="Mover para outra fase..."
                          >
                            <option value="" disabled>
                              Mover...
                            </option>
                            {allowedDestinations.map((destId) => {
                              const destPhase = phases.find((p) => p.id === destId);
                              if (!destPhase) return null;
                              return (
                                <option key={destId} value={destId}>
                                  {destPhase.name}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>

                      {/* Card Bottom: Value, SLA & Assignee */}
                      <div className="pt-1.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px]">
                        <span className="font-bold text-neutral-900 dark:text-neutral-100">
                          {card.value > 0 ? formatCurrency(card.value) : 'A definir'}
                        </span>

                        <div className="flex items-center gap-2">
                          {/* SLA Pill */}
                          {phase.slaHours > 0 && (
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-medium flex items-center gap-0.5 ${
                                sla.isOverdue
                                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-semibold'
                                  : 'text-neutral-400 dark:text-neutral-500'
                              }`}
                            >
                              <Clock className="w-2.5 h-2.5" />
                              {sla.label}
                            </span>
                          )}

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

                          {/* Assignee Avatar */}
                          {assignedUser && (
                            <img
                              src={assignedUser.avatar}
                              alt={assignedUser.name}
                              title={assignedUser.name}
                              className="w-4 h-4 rounded-full object-cover ring-1 ring-neutral-300 dark:ring-neutral-700"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {phaseCards.length === 0 && (
                  <div className="p-4 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl text-center">
                    <p className="text-[11px] text-neutral-400 dark:text-neutral-500">Vazio</p>
                    <button
                      onClick={() => openNewCardModal(phase.id)}
                      className="mt-1 text-[10px] text-red-600 dark:text-red-400 hover:underline font-semibold cursor-pointer"
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
                  className="w-full flex items-center justify-center gap-1 py-1 text-[11px] text-neutral-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/40 rounded-lg transition-colors font-medium cursor-pointer"
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
