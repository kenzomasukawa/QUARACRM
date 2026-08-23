import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Calendar,
  DollarSign,
  Briefcase,
  Layers,
  HelpCircle,
  Building2,
  FileText,
  Clock,
} from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { PhaseId, CRMCard } from '../types/crm';
import {
  checkTransitionAllowed,
  getTransitionRequiredFields,
  TransitionFieldConfig,
  ALLOWED_TRANSITIONS,
} from '../utils/phaseTransitions';

export const PhaseTransitionModal: React.FC = () => {
  const {
    phases,
    pendingTransition,
    cancelPhaseTransition,
    moveCardPhase,
    updateCard,
  } = useCRM();

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const card = pendingTransition?.card;
  const targetPhaseId = pendingTransition?.targetPhaseId;

  const fromPhase = card ? phases.find((p) => p.id === card.phaseId) : null;
  const toPhase = targetPhaseId ? phases.find((p) => p.id === targetPhaseId) : null;

  // Check rule validation
  const ruleCheck =
    card && targetPhaseId
      ? checkTransitionAllowed(card.phaseId, targetPhaseId)
      : { allowed: true };

  const requiredFields: TransitionFieldConfig[] =
    card && targetPhaseId && ruleCheck.allowed
      ? getTransitionRequiredFields(card.phaseId, targetPhaseId, card)
      : [];

  // Reset form when pending transition changes
  useEffect(() => {
    if (card && targetPhaseId && ruleCheck.allowed) {
      const initial: Record<string, any> = {};
      const fields = getTransitionRequiredFields(card.phaseId, targetPhaseId, card);
      fields.forEach((f) => {
        initial[f.id] = f.defaultValue !== undefined ? f.defaultValue : '';
      });
      setFormData(initial);
      setErrorMessage(null);
    }
  }, [card?.id, targetPhaseId, ruleCheck.allowed]);

  if (!pendingTransition || !card || !targetPhaseId || !fromPhase || !toPhase) {
    return null;
  }

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    if (errorMessage) setErrorMessage(null);
  };

  const handleQuickDate = (fieldId: string, daysToAdd: number) => {
    const d = new Date(Date.now() + daysToAdd * 86400000);
    handleFieldChange(fieldId, d.toISOString().slice(0, 10));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    for (const f of requiredFields) {
      if (f.required) {
        const val = formData[f.id];
        if (val === undefined || val === null || val === '' || (typeof val === 'string' && !val.trim())) {
          setErrorMessage(`Por favor, preencha o campo obrigatório "${f.label}".`);
          return;
        }
      }
    }

    // If proposing a value in proposal or won phase, update card value
    if (formData.valorInicialProposta && Number(formData.valorInicialProposta) > 0) {
      updateCard(card.id, { value: Number(formData.valorInicialProposta) });
    } else if (formData.valorFechadoFinal && Number(formData.valorFechadoFinal) > 0) {
      updateCard(card.id, { value: Number(formData.valorFechadoFinal) });
    }

    // Execute the move
    const success = await moveCardPhase(card.id, targetPhaseId, formData);
    if (success) {
      if (pendingTransition.onSuccess) {
        pendingTransition.onSuccess();
      }
      cancelPhaseTransition();
    }
  };

  // Alternative allowed phases if blocked
  const allowedPhasesList = (ruleCheck.allowedDestinations || [])
    .map((pId) => phases.find((p) => p.id === pId))
    .filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-xl rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with Visual Phase Transfer */}
        <div className="bg-neutral-950 text-white px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Validação de Fluxo do Funil
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-neutral-900 text-neutral-300 border border-neutral-700">
                {fromPhase.name}
              </span>
              <ArrowRight className="w-4 h-4 text-red-500 shrink-0" />
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-600 text-white shadow-xs">
                {toPhase.name}
              </span>
            </div>
          </div>
          <button
            onClick={cancelPhaseTransition}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-850 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lead Context Summary Pill */}
        <div className="px-6 py-2.5 bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
          <div className="flex items-center gap-2 truncate">
            <Building2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
            <span className="font-bold text-neutral-800 dark:text-neutral-200 truncate">{card.companyName}</span>
            <span className="text-neutral-400 dark:text-neutral-600">•</span>
            <span className="text-neutral-600 dark:text-neutral-400 truncate">{card.title}</span>
          </div>
          <span className="text-[11px] font-mono bg-white dark:bg-neutral-900 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 shrink-0">
            {card.id}
          </span>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* BLOCKED TRANSITION WARNING */}
          {!ruleCheck.allowed ? (
            <div className="space-y-4">
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-rose-900 dark:text-rose-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-rose-700 dark:text-rose-400">
                  <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                  Transição de Fase Bloqueada
                </div>
                <p className="text-xs leading-relaxed text-rose-800 dark:text-rose-300">
                  {ruleCheck.reason}
                </p>
              </div>

              {allowedPhasesList.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                    Destinos permitidos a partir de "{fromPhase.name}":
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {allowedPhasesList.map((phase) => (
                      <button
                        key={phase!.id}
                        type="button"
                        onClick={() => {
                          // Change target to an allowed phase
                          pendingTransition.targetPhaseId = phase!.id;
                          setFormData({});
                          setErrorMessage(null);
                        }}
                        className="p-3 text-left bg-neutral-50 dark:bg-neutral-950 hover:bg-red-50 dark:hover:bg-red-950/40 border border-neutral-200 dark:border-neutral-800 hover:border-red-300 dark:hover:border-red-800 rounded-xl text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:text-red-900 dark:hover:text-red-300 transition flex items-center justify-between group cursor-pointer"
                      >
                        <span>{phase!.name}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={cancelPhaseTransition}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Fechar / Cancelar
                </button>
              </div>
            </div>
          ) : (
            /* ALLOWED TRANSITION - FORM WITH REQUIRED FIELDS */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 bg-red-50/70 dark:bg-red-950/30 border border-red-200/80 dark:border-red-900/60 rounded-xl text-red-950 dark:text-red-200 text-xs flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                <span>
                  Para mover para <strong>{toPhase.name}</strong>, preencha os dados obrigatórios do processo:
                </span>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  {errorMessage}
                </div>
              )}

              {/* Dynamic Field Inputs */}
              <div className="space-y-4">
                {requiredFields.map((field) => {
                  const val = formData[field.id] ?? '';

                  return (
                    <div key={field.id} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                          {field.label} {field.required && <span className="text-rose-500">*</span>}
                        </label>
                        {field.type === 'date' && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleQuickDate(field.id, 0)}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 hover:bg-red-100 hover:text-red-700 dark:bg-neutral-800 dark:hover:bg-red-950/60 dark:hover:text-red-300 text-neutral-600 dark:text-neutral-300 transition cursor-pointer"
                            >
                              Hoje
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickDate(field.id, 2)}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 hover:bg-red-100 hover:text-red-700 dark:bg-neutral-800 dark:hover:bg-red-950/60 dark:hover:text-red-300 text-neutral-600 dark:text-neutral-300 transition cursor-pointer"
                            >
                              +2d
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickDate(field.id, 7)}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 hover:bg-red-100 hover:text-red-700 dark:bg-neutral-800 dark:hover:bg-red-950/60 dark:hover:text-red-300 text-neutral-600 dark:text-neutral-300 transition cursor-pointer"
                            >
                              +7d
                            </button>
                          </div>
                        )}
                      </div>

                      {field.type === 'select' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {field.options?.map((opt) => {
                            const isSelected = val === opt;
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => handleFieldChange(field.id, opt)}
                                className={`py-2 px-3 rounded-xl border text-xs font-semibold text-left transition flex items-center justify-between cursor-pointer ${
                                  isSelected
                                    ? 'bg-red-600 text-white border-red-600 shadow-sm'
                                    : 'bg-neutral-50 dark:bg-neutral-950 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800'
                                }`}
                              >
                                <span>{opt}</span>
                                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                              </button>
                            );
                          })}
                        </div>
                      ) : field.type === 'textarea' ? (
                        <textarea
                          rows={3}
                          value={val}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          placeholder={field.placeholder || `Descreva ${field.label.toLowerCase()}...`}
                          required={field.required}
                          className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-neutral-100 focus:bg-white dark:focus:bg-neutral-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none transition leading-relaxed"
                        />
                      ) : field.type === 'currency' || field.type === 'number' ? (
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-xs text-neutral-400 font-bold">R$</span>
                          <input
                            type="number"
                            step="any"
                            value={val}
                            onChange={(e) => handleFieldChange(field.id, parseFloat(e.target.value) || 0)}
                            placeholder="0,00"
                            required={field.required}
                            className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-neutral-100 font-bold focus:bg-white dark:focus:bg-neutral-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none transition"
                          />
                        </div>
                      ) : (
                        <input
                          type={field.type === 'date' ? 'date' : 'text'}
                          value={val}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          placeholder={field.placeholder || `Informe ${field.label.toLowerCase()}...`}
                          required={field.required}
                          className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-neutral-100 focus:bg-white dark:focus:bg-neutral-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none transition"
                        />
                      )}

                      {field.helpText && (
                        <p className="text-[11px] text-neutral-400 italic">
                          {field.helpText}
                        </p>
                      )}
                    </div>
                  );
                })}

                {requiredFields.length === 0 && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 py-2">
                    Nenhum campo adicional obrigatório para esta transição. Clique em confirmar para mover o card.
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={cancelPhaseTransition}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Salvar e Mover para {toPhase.name}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
