import React, { useState } from 'react';
import {
  Zap,
  Plus,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  Power,
  MessageSquare,
  Bell,
  CheckSquare,
  Tag,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { AutomationRule, PhaseId } from '../types/crm';
import { formatDate, formatTimeAgo } from '../utils/formatters';

export const AutomationsView: React.FC = () => {
  const { automations, toggleAutomation, addAutomation, deleteAutomation, phases, currentUser } = useCRM();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [trigger, setTrigger] = useState<AutomationRule['trigger']>('phase_enter');
  const [triggerPhase, setTriggerPhase] = useState<PhaseId>('diagnostica');
  const [actionType, setActionType] = useState<
    'send_whatsapp_template' | 'send_email_template' | 'notify_manager' | 'create_checklist_task' | 'add_tag'
  >('send_whatsapp_template');
  const [actionParamText, setActionParamText] = useState('');

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addAutomation({
      title: title.trim(),
      description:
        description.trim() || `Automação executada quando o gatilho "${trigger}" for disparado.`,
      enabled: true,
      trigger,
      triggerPhase: trigger === 'phase_enter' || trigger === 'sla_breach' ? triggerPhase : undefined,
      actions: [
        {
          type: actionType,
          params: {
            messageText: actionParamText || 'Ação automática executada com sucesso.',
            taskTitle: actionParamText || 'Tarefa gerada por automação',
            tagToAdd: actionParamText || 'Auto-Tag',
            notificationUrgency: 'warning',
          },
        },
      ],
    });

    setIsModalOpen(false);
    setTitle('');
    setDescription('');
    setActionParamText('');
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-red-600 dark:text-red-500" />
            <span>Central de Automações & Regras de Processo</span>
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Configure gatilhos e ações automáticas estilo Pipefy para eliminar trabalhos manuais
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Nova Automação</span>
        </button>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {automations.map((rule) => (
          <div
            key={rule.id}
            className={`p-5 rounded-2xl border transition-all shadow-2xs ${
              rule.enabled
                ? 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-red-500/50'
                : 'bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    rule.enabled
                      ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
                  }`}
                >
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">{rule.title}</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                    Gatilho: {rule.trigger}
                  </span>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                onClick={() => toggleAutomation(rule.id)}
                className={`p-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                  rule.enabled
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900'
                    : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-300 dark:hover:bg-neutral-700'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>{rule.enabled ? 'Ativa' : 'Pausada'}</span>
              </button>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">{rule.description}</p>

            {/* Visual Workflow Flow */}
            <div className="p-3 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-100 dark:border-neutral-800 mb-4 text-xs flex items-center gap-2">
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">Quando:</span>
              <span className="px-2 py-0.5 bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 rounded font-medium text-[11px]">
                {rule.triggerPhase ? `Entrar em ${rule.triggerPhase}` : rule.trigger}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">Então:</span>
              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded font-medium text-[11px]">
                {rule.actions[0]?.type.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Rule Footer */}
            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400 dark:text-neutral-500">
              <span className="flex items-center gap-1">
                <Play className="w-3 h-3 text-red-600 dark:text-red-500" />
                <span>Executada <strong>{rule.executionCount}</strong> vezes</span>
              </span>

              <div className="flex items-center gap-3">
                {rule.lastExecutedAt && (
                  <span>Última: {formatTimeAgo(rule.lastExecutedAt)}</span>
                )}
                <button
                  onClick={() => {
                    if (confirm(`Deseja excluir a regra "${rule.title}"?`)) {
                      deleteAutomation(rule.id);
                    }
                  }}
                  className="text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal to Create New Automation */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-red-600 dark:text-red-500" />
                <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">Configurar Nova Regra Automática</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 text-lg font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">Título da Automação *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Disparar WhatsApp de Boas-Vindas"
                  required
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">Gatilho (Quando acontecer...) *</label>
                <select
                  value={trigger}
                  onChange={(e) => setTrigger(e.target.value as any)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg font-semibold focus:outline-none"
                >
                  <option value="phase_enter">Ao entrar em uma Fase específica</option>
                  <option value="card_created">Ao criar um novo Card</option>
                  <option value="sla_breach">Ao estourar o SLA de tempo limite</option>
                  <option value="card_won">Ao fechar como Ganho (Won)</option>
                  <option value="card_lost">Ao mover para Perdido (Lost)</option>
                </select>
              </div>

              {(trigger === 'phase_enter' || trigger === 'sla_breach') && (
                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">Selecione a Fase</label>
                  <select
                    value={triggerPhase}
                    onChange={(e) => setTriggerPhase(e.target.value as PhaseId)}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg"
                  >
                    {phases.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">Ação (Então faça...) *</label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg font-semibold focus:outline-none"
                >
                  <option value="send_whatsapp_template">Disparar mensagem no WhatsApp do Lead</option>
                  <option value="notify_manager">Enviar notificação em tempo real ao Gerente</option>
                  <option value="create_checklist_task">Adicionar tarefa obrigatória no checklist</option>
                  <option value="add_tag">Adicionar Tag / Etiqueta ao Card</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">Texto da Mensagem / Tarefa</label>
                <textarea
                  value={actionParamText}
                  onChange={(e) => setActionParamText(e.target.value)}
                  placeholder="Olá {{contato}}, confirmamos seu diagnóstico na {{empresa}}..."
                  rows={3}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg focus:outline-none"
                />
                <span className="text-[10px] text-neutral-400">
                  Variáveis disponíveis: {'{{contato}}'}, {'{{empresa}}'}, {'{{valor}}'}, {'{{consultor}}'}
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Salvar Regra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
