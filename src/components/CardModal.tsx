import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  User as UserIcon,
  Phone,
  Mail,
  DollarSign,
  Calendar,
  Clock,
  Tag,
  CheckSquare,
  MessageSquare,
  Send,
  Sparkles,
  ArrowRight,
  Shield,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Plus,
  Paperclip,
  Share2,
  Database,
  RefreshCw,
  FileText,
  Bot,
  Zap,
  TrendingUp,
  Brain,
  MessageCircle,
  FileSpreadsheet,
  Mic,
} from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { PhaseId, Priority, CardCustomData, CardMessage, LeadInteraction } from '../types/crm';
import {
  formatCurrency,
  formatDate,
  formatTimeAgo,
  getSLAStatus,
  getWhatsAppDirectUrl,
  cleanPhoneForWhatsApp,
  WHATSAPP_WEB_TARGET,
} from '../utils/formatters';
import {
  generateSalesCopy,
  analyzeDealHealth,
  extractMeetingInsights,
  chatWithSalesCopilot,
} from '../services/geminiService';
import { sendWhatsAppViaApi, sendEmailViaApi } from '../services/apiIntegrationsService';

export const CardModal: React.FC = () => {
  const {
    selectedCard,
    setSelectedCard,
    phases,
    users,
    currentUser,
    updateCard,
    moveCardPhase,
    requestPhaseTransition,
    deleteCard,
    sendCardMessage,
    toggleChecklistItem,
    addChecklistItem,
    currentLeadInteractions,
    isLoadingInteractions,
    loadLeadInteractions,
    addLeadInteraction,
    isSupabaseActive,
    setIsIntegrationsModalOpen,
  } = useCRM();

  const [activeTab, setActiveTab] = useState<'fields' | 'interactions' | 'whatsapp' | 'email' | 'checklist' | 'ai' | 'history'>('fields');
  const [newChecklistText, setNewChecklistText] = useState('');
  const [whatsappInput, setWhatsappInput] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [internalNoteText, setInternalNoteText] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isSuggestingWhatsapp, setIsSuggestingWhatsapp] = useState(false);
  const [aiGeneratedText, setAiGeneratedText] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleText, setEditTitleText] = useState('');
  const [valueInput, setValueInput] = useState('0');

  useEffect(() => {
    if (selectedCard) setValueInput(String(selectedCard.value ?? 0));
  }, [selectedCard?.id]);

  // AI Suite Tabs & Data
  const [aiSubTab, setAiSubTab] = useState<'copywriter' | 'deal_health' | 'meeting' | 'copilot'>('copywriter');
  const [aiCustomPrompt, setAiCustomPrompt] = useState('');
  const [dealHealthData, setDealHealthData] = useState<any | null>(null);
  const [isLoadingDealHealth, setIsLoadingDealHealth] = useState(false);
  const [meetingNotesInput, setMeetingNotesInput] = useState('');
  const [isExtractingMeeting, setIsExtractingMeeting] = useState(false);
  const [meetingInsights, setMeetingInsights] = useState<any | null>(null);
  const [copilotMessages, setCopilotMessages] = useState<{ sender: 'user' | 'assistant'; text: string }[]>([]);
  const [copilotInput, setCopilotInput] = useState('');
  const [isCopilotThinking, setIsCopilotThinking] = useState(false);

  if (!selectedCard) return null;

  const currentPhase = phases.find((p) => p.id === selectedCard.phaseId) || phases[0];
  const assignedUser = users.find((u) => u.id === selectedCard.assignedUserId);
  const sla = getSLAStatus(selectedCard.enteredCurrentPhaseAt, currentPhase.slaHours);

  // Field change handler
  const handleCustomFieldChange = (key: string, value: any) => {
    const updatedCustom = {
      ...selectedCard.customFields,
      [key]: value,
    };
    updateCard(
      selectedCard.id,
      { customFields: updatedCustom },
      `Campo "${key}" atualizado para "${value}"`
    );
  };

  const handleSendWhatsApp = async (text?: string) => {
    const msgToSend = text || whatsappInput;
    if (!msgToSend.trim()) return;

    sendCardMessage(selectedCard.id, {
      channel: 'whatsapp',
      sender: 'consultant',
      senderName: currentUser.name,
      content: msgToSend.trim(),
      status: 'sent',
    });

    const phone = selectedCard.contactWhatsapp || selectedCard.contactPhone;
    if (phone) {
      await sendWhatsAppViaApi(phone, msgToSend.trim());
    }

    setWhatsappInput('');
  };

  // Fills the WhatsApp composer with an AI-suggested follow-up message.
  // getWhatsAppDirectUrl() below reads whatsappInput, so the wa.me link
  // updates automatically with the suggested text.
  const handleSuggestWhatsappFollowup = async () => {
    setIsSuggestingWhatsapp(true);
    try {
      const text = await generateSalesCopy(selectedCard, 'followup', currentUser);
      setWhatsappInput(text);
    } catch (err: any) {
      alert('Erro ao gerar sugestão da IA: ' + err.message);
    } finally {
      setIsSuggestingWhatsapp(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailBody.trim()) return;
    const subject = emailSubject || 'Contato Comercial — QuaraCRM';
    sendCardMessage(selectedCard.id, {
      channel: 'email',
      sender: 'consultant',
      senderName: currentUser.name,
      subject,
      content: emailBody.trim(),
      status: 'sent',
    });

    if (selectedCard.contactEmail) {
      await sendEmailViaApi(selectedCard.contactEmail, subject, emailBody.trim());
    }

    setEmailBody('');
    setEmailSubject('');
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!internalNoteText.trim()) return;

    await addLeadInteraction(selectedCard.id, {
      type: 'note',
      channel: 'internal',
      sender: 'user',
      userId: currentUser.id,
      userName: currentUser.name,
      content: internalNoteText.trim(),
    });

    setInternalNoteText('');
  };

  const handleAddChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    addChecklistItem(selectedCard.id, newChecklistText);
    setNewChecklistText('');
  };

  const handleSaveTitle = () => {
    if (editTitleText.trim() && editTitleText !== selectedCard.title) {
      updateCard(selectedCard.id, { title: editTitleText.trim() }, `Título alterado para "${editTitleText}"`);
    }
    setIsEditingTitle(false);
  };

  // 1. Copywriting Generator
  const handleGenerateAiResponse = async (type: 'followup' | 'objection' | 'proposal' | 'cold_call' | 'reactivation' | 'custom') => {
    setIsAiGenerating(true);
    try {
      const text = await generateSalesCopy(selectedCard, type, currentUser, aiCustomPrompt);
      setAiGeneratedText(text);

      await addLeadInteraction(selectedCard.id, {
        type: 'ai_prompt',
        channel: 'ai_assistant',
        sender: 'system',
        userId: currentUser.id,
        userName: 'Google Gemini IA',
        content: `[IA Copy ${type.toUpperCase()}]: ${text}`,
      });
    } catch (err: any) {
      alert('Erro ao gerar copy: ' + err.message);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // 2. Deal Health & Win Prediction
  const handleAnalyzeDealHealth = async () => {
    setIsLoadingDealHealth(true);
    try {
      const data = await analyzeDealHealth(selectedCard);
      setDealHealthData(data);
    } catch (err: any) {
      console.error('Erro na análise de saúde:', err);
    } finally {
      setIsLoadingDealHealth(false);
    }
  };

  // 3. Meeting Transcript & Insights Extraction
  const handleExtractMeeting = async () => {
    if (!meetingNotesInput.trim()) return;
    setIsExtractingMeeting(true);
    try {
      const insights = await extractMeetingInsights(selectedCard, meetingNotesInput);
      setMeetingInsights(insights);
    } catch (err: any) {
      alert('Erro ao processar reunião: ' + err.message);
    } finally {
      setIsExtractingMeeting(false);
    }
  };

  const handleApplyMeetingInsights = () => {
    if (!meetingInsights) return;
    const updates: any = {};
    if (meetingInsights.suggestedFields) {
      updates.customFields = {
        ...(selectedCard.customFields || {}),
        necessidadeCliente: meetingInsights.suggestedFields.necessidadeCliente || selectedCard.customFields?.necessidadeCliente,
        servicosAdquiridos: meetingInsights.suggestedFields.servicosAdquiridos || selectedCard.customFields?.servicosAdquiridos,
      };
    }
    updateCard(selectedCard.id, updates, 'Anotações da reunião processadas e salvas pela IA');
    alert('Informações extraídas pela IA aplicadas com sucesso aos campos do card!');
  };

  // 4. Chat Copilot
  const handleSendCopilotMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!copilotInput.trim() || isCopilotThinking) return;
    const userMsg = copilotInput.trim();
    setCopilotInput('');

    const newHistory = [...copilotMessages, { sender: 'user' as const, text: userMsg }];
    setCopilotMessages(newHistory);
    setIsCopilotThinking(true);

    try {
      const reply = await chatWithSalesCopilot(selectedCard, newHistory, userMsg);
      setCopilotMessages([...newHistory, { sender: 'assistant' as const, text: reply }]);
    } catch (err: any) {
      setCopilotMessages([
        ...newHistory,
        { sender: 'assistant' as const, text: 'Erro ao consultar IA: ' + err.message },
      ]);
    } finally {
      setIsCopilotThinking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-5xl h-[94vh] rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="px-6 py-4 bg-neutral-950 dark:bg-black text-white flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">{selectedCard.companyName}</h3>
                <span className="text-[11px] font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                  {selectedCard.id}
                </span>
                {isSupabaseActive && (
                  <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <Database className="w-2.5 h-2.5" />
                    Supabase Nuvem
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-neutral-400">
                {isEditingTitle ? (
                  <input
                    type="text"
                    value={editTitleText}
                    onChange={(e) => setEditTitleText(e.target.value)}
                    onBlur={handleSaveTitle}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                    autoFocus
                    placeholder="Título opcional do card"
                    className="text-xs bg-neutral-900 text-white px-2 py-0.5 rounded border border-red-500 focus:outline-none"
                  />
                ) : (
                  <span
                    onClick={() => {
                      setEditTitleText(selectedCard.title);
                      setIsEditingTitle(true);
                    }}
                    className="hover:text-red-400 cursor-pointer"
                    title="Clique para editar título (opcional)"
                  >
                    {selectedCard.title || '+ Adicionar título (opcional)'}
                  </span>
                )}
                <span>• Contato: {selectedCard.contactName} ({selectedCard.contactRole})</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (window.confirm(`Deseja realmente excluir a oportunidade "${selectedCard.title || selectedCard.companyName}"?`)) {
                  deleteCard(selectedCard.id);
                }
              }}
              className="p-2 text-neutral-400 hover:text-red-400 hover:bg-neutral-900 rounded-lg transition cursor-pointer"
              title="Excluir Oportunidade"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedCard(null)}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Interactive Pipeline Stepper / Fast Phase Transition */}
        <div className="bg-neutral-950 dark:bg-black px-6 py-2.5 border-b border-neutral-800 flex items-center justify-between text-xs overflow-x-auto gap-4">
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            <span className="text-[11px] font-bold text-neutral-400 mr-2 uppercase tracking-wider shrink-0">
              Pipeline:
            </span>
            {phases.map((phase, idx) => {
              const isCurrent = selectedCard.phaseId === phase.id;
              const isWin = phase.id === 'ganho';
              const isLoss = phase.id === 'perdido';

              return (
                <button
                  key={phase.id}
                  onClick={() => requestPhaseTransition(selectedCard, phase.id)}
                  title={`Mover para ${phase.name}`}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    isCurrent
                      ? isWin
                        ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-400'
                        : isLoss
                        ? 'bg-red-800 text-white shadow-xs ring-2 ring-red-500'
                        : 'bg-red-600 text-white shadow-xs ring-2 ring-red-400'
                      : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800 hover:text-white border border-neutral-800'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isCurrent ? 'bg-white' : phase.color.replace('text-', 'bg-')
                    }`}
                  />
                  <span>{phase.name}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5 text-neutral-300">
              <UserIcon className="w-3.5 h-3.5 text-red-400" />
              <span className="text-[11px]">Consultor:</span>
              <select
                value={selectedCard.assignedUserId}
                onChange={(e) => updateCard(selectedCard.id, { assignedUserId: e.target.value })}
                className="bg-neutral-900 text-white px-2 py-0.5 rounded border border-neutral-800 text-xs focus:outline-none"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedCard.customFields?.canalProspeccao && (
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                title="Canal de Prospecção Utilizado"
              >
                {selectedCard.customFields.canalProspeccao}
              </span>
            )}

            <div className="flex items-center gap-1.5 text-neutral-300">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px]">Valor:</span>
              <input
                type="number"
                value={valueInput}
                onChange={(e) => setValueInput(e.target.value)}
                onBlur={() => updateCard(selectedCard.id, { value: parseFloat(valueInput) || 0 })}
                className="w-24 bg-neutral-900 text-white px-2 py-0.5 rounded border border-neutral-800 text-xs font-semibold focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1 text-[11px]">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              <span className={`px-2 py-0.5 rounded font-bold ${sla.isOverdue ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                {sla.hoursElapsed}h / {currentPhase.slaHours}h
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-6 pt-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('fields')}
            className={`pb-2.5 px-4 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'fields'
                ? 'border-red-600 text-red-600 dark:text-red-400 bg-white dark:bg-neutral-900 rounded-t-lg'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Dados da Oportunidade
          </button>
          <button
            onClick={() => setActiveTab('interactions')}
            className={`pb-2.5 px-4 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'interactions'
                ? 'border-red-600 text-red-600 dark:text-red-400 bg-white dark:bg-neutral-900 rounded-t-lg'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Interações & Conversas ({currentLeadInteractions.length})
          </button>
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`pb-2.5 px-4 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'whatsapp'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-neutral-900 rounded-t-lg'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            WhatsApp ({selectedCard.messages.filter((m) => m.channel === 'whatsapp').length})
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`pb-2.5 px-4 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'email'
                ? 'border-red-600 text-red-600 dark:text-red-400 bg-white dark:bg-neutral-900 rounded-t-lg'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            E-mail Direto
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={`pb-2.5 px-4 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'checklist'
                ? 'border-red-600 text-red-600 dark:text-red-400 bg-white dark:bg-neutral-900 rounded-t-lg'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            Checklist ({selectedCard.checklist.filter((c) => c.completed).length}/{selectedCard.checklist.length})
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`pb-2.5 px-4 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'ai'
                ? 'border-red-600 text-red-600 dark:text-red-400 bg-white dark:bg-neutral-900 rounded-t-lg'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-red-500" />
            Assistente IA
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 px-4 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'history'
                ? 'border-red-600 text-red-600 dark:text-red-400 bg-white dark:bg-neutral-900 rounded-t-lg'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Auditoria ({selectedCard.history.length})
          </button>
        </div>

        {/* Modal Main Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-neutral-50/50 dark:bg-neutral-950/50">
          {/* TAB 1: FORMULÁRIO E DADOS CADASTRAIS */}
          {activeTab === 'fields' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Contact Info Card */}
              <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-4">
                <h4 className="font-bold text-xs text-neutral-700 dark:text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-red-600 dark:text-red-500" />
                  Dados do Lead & Contato
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Empresa</label>
                    <input
                      type="text"
                      value={selectedCard.companyName}
                      onChange={(e) => updateCard(selectedCard.id, { companyName: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 font-medium focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Nome do Contato</label>
                    <input
                      type="text"
                      value={selectedCard.contactName}
                      onChange={(e) => updateCard(selectedCard.id, { contactName: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 font-medium focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Cargo</label>
                      <input
                        type="text"
                        value={selectedCard.contactRole || ''}
                        onChange={(e) => updateCard(selectedCard.id, { contactRole: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Prioridade</label>
                      <select
                        value={selectedCard.priority}
                        onChange={(e) => updateCard(selectedCard.id, { priority: e.target.value as Priority })}
                        className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 font-semibold focus:outline-none"
                      >
                        <option value="baixa">Baixa</option>
                        <option value="media">Média</option>
                        <option value="alta">Alta</option>
                        <option value="urgente">Urgente</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">WhatsApp / Telefone</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={selectedCard.contactWhatsapp || selectedCard.contactPhone || ''}
                        onChange={(e) => updateCard(selectedCard.id, { contactWhatsapp: e.target.value, contactPhone: e.target.value })}
                        className="flex-1 px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 font-mono focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                      <a
                        href={getWhatsAppDirectUrl(selectedCard.contactWhatsapp || selectedCard.contactPhone || '', `Olá ${selectedCard.contactName}, tudo bem?`)}
                        target={WHATSAPP_WEB_TARGET}
                        rel="noreferrer"
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Abrir Zap
                      </a>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">E-mail</label>
                    <input
                      type="email"
                      value={selectedCard.contactEmail || ''}
                      onChange={(e) => updateCard(selectedCard.id, { contactEmail: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* Commercial & Deal Information */}
              <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-neutral-700 dark:text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                    Dados Comerciais & Negociação
                  </h4>
                  <span className="text-[10px] font-semibold text-neutral-400">
                    Fase: {currentPhase.name}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Origem / Canal</label>
                      <select
                        value={selectedCard.customFields?.canalIndicacao || selectedCard.customFields?.canalProspeccao || ''}
                        onChange={(e) => handleCustomFieldChange('canalIndicacao', e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 font-medium focus:outline-none"
                      >
                        <option value="">Selecione...</option>
                        <option value="Passivo">Passivo</option>
                        <option value="Ativo Apollo">Ativo Apollo</option>
                        <option value="Indicação">Indicação</option>
                        <option value="LinkedIn Sales Nav">LinkedIn</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Porte da Empresa</label>
                      <select
                        value={selectedCard.customFields?.tamanhoEmpresa || ''}
                        onChange={(e) => handleCustomFieldChange('tamanhoEmpresa', e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 font-medium focus:outline-none"
                      >
                        <option value="">Selecione...</option>
                        <option value="Pequena">Pequena</option>
                        <option value="Média">Média</option>
                        <option value="Grande">Grande</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Necessidade do Cliente / Dores</label>
                    <textarea
                      value={selectedCard.customFields?.necessidadeCliente || selectedCard.customFields?.doresIdentificadas || ''}
                      onChange={(e) => handleCustomFieldChange('necessidadeCliente', e.target.value)}
                      rows={2}
                      placeholder="Descreva a principal necessidade, dor ou gargalo do cliente..."
                      className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Serviços Contratados / Escopo</label>
                    <input
                      type="text"
                      value={selectedCard.customFields?.servicosAdquiridos || ''}
                      onChange={(e) => handleCustomFieldChange('servicosAdquiridos', e.target.value)}
                      placeholder="Ex: Consultoria Comercial, Licenças Enterprise, Treinamento..."
                      className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Validade Proposta / Follow</label>
                      <input
                        type="date"
                        value={selectedCard.customFields?.validadeProposta || selectedCard.customFields?.dataProximoFollowup || selectedCard.customFields?.dataProximaAtividade || ''}
                        onChange={(e) => handleCustomFieldChange('validadeProposta', e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Previsão Fechamento</label>
                      <input
                        type="date"
                        value={selectedCard.customFields?.previsaoFechamento || ''}
                        onChange={(e) => handleCustomFieldChange('previsaoFechamento', e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none"
                      />
                    </div>
                  </div>

                  {selectedCard.customFields?.motivoPerda && (
                    <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-lg text-red-800 dark:text-red-300 text-xs">
                      <strong>Motivo de Perda Registrado:</strong> {selectedCard.customFields.motivoPerda}
                      {selectedCard.customFields.detalhesPerda && (
                        <p className="mt-1 text-red-700 dark:text-red-400 text-[11px]">{selectedCard.customFields.detalhesPerda}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INTERAÇÕES ON-DEMAND (TABELA LEAD_INTERACTIONS DO SUPABASE) */}
          {activeTab === 'interactions' && (
            <div className="max-w-3xl mx-auto space-y-4">
              {/* Info banner about on-demand query */}
              <div className="bg-red-50 dark:bg-neutral-900 border border-red-200 dark:border-neutral-800 rounded-xl p-3.5 text-xs text-neutral-800 dark:text-neutral-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-red-600 dark:text-red-500 shrink-0" />
                  <span>
                    Consultando <strong>interações deste lead</strong> via tabela <code className="bg-neutral-200 dark:bg-neutral-800 px-1 py-0.5 rounded font-mono font-semibold">lead_interactions</code>.
                  </span>
                </div>
                <button
                  onClick={() => loadLeadInteractions(selectedCard.id)}
                  disabled={isLoadingInteractions}
                  className="px-2.5 py-1 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingInteractions ? 'animate-spin' : ''}`} />
                  Recarregar
                </button>
              </div>

              {/* Add Quick Internal Note */}
              <form onSubmit={handleAddNote} className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-3">
                <h4 className="font-bold text-xs text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-red-600 dark:text-red-500" />
                  Adicionar Anotação ou Registro de Contato
                </h4>
                <textarea
                  value={internalNoteText}
                  onChange={(e) => setInternalNoteText(e.target.value)}
                  placeholder="Ex: Reunião com CFO realizada. Ficou acordado apresentar proposta na quinta..."
                  rows={3}
                  className="w-full text-xs p-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:outline-none text-neutral-800 dark:text-neutral-200"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Salvar Interação
                  </button>
                </div>
              </form>

              {/* Timeline list of lead interactions */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                  Linha do Tempo de Interações ({currentLeadInteractions.length})
                </h4>

                {isLoadingInteractions ? (
                  <div className="p-8 text-center bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
                    <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Buscando interações indexadas no Supabase...</p>
                  </div>
                ) : currentLeadInteractions.length === 0 ? (
                  <div className="p-8 text-center bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-400 text-xs">
                    Nenhuma interação registrada ainda para este lead.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentLeadInteractions.map((item) => {
                      const isZap = item.type === 'whatsapp' || item.channel === 'whatsapp';
                      const isMail = item.type === 'email' || item.channel === 'email';
                      const isAi = item.type === 'ai_prompt' || item.channel === 'ai_assistant';
                      const isHistory = item.type === 'history';

                      return (
                        <div
                          key={item.id}
                          className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              {isZap ? (
                                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold rounded text-[10px] flex items-center gap-1">
                                  <Phone className="w-2.5 h-2.5" />
                                  WhatsApp
                                </span>
                              ) : isMail ? (
                                <span className="px-2 py-0.5 bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 font-bold rounded text-[10px] flex items-center gap-1">
                                  <Mail className="w-2.5 h-2.5" />
                                  E-mail
                                </span>
                              ) : isAi ? (
                                <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-red-600 dark:text-red-400 font-bold rounded text-[10px] flex items-center gap-1">
                                  <Bot className="w-2.5 h-2.5" />
                                  IA Gemini
                                </span>
                              ) : isHistory ? (
                                <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded text-[10px] flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" />
                                  Transição de Fase
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold rounded text-[10px] flex items-center gap-1">
                                  <FileText className="w-2.5 h-2.5" />
                                  Anotação Interna
                                </span>
                              )}

                              <span className="font-bold text-neutral-800 dark:text-neutral-200">{item.userName || 'Sistema'}</span>
                            </div>
                            <span className="text-[10px] text-neutral-400">{formatDate(item.createdAt)}</span>
                          </div>

                          <p className="text-xs text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed pl-1">
                            {item.content}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: WHATSAPP INTEGRADO */}
          {activeTab === 'whatsapp' && (
            <div className="max-w-2xl mx-auto h-full flex flex-col bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-2xs">
              <div className="p-3.5 bg-emerald-700 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-emerald-300 rounded-full animate-pulse" />
                  <span className="font-bold text-xs">Chat WhatsApp com {selectedCard.contactName}</span>
                </div>
                <a
                  href={getWhatsAppDirectUrl(selectedCard.contactWhatsapp || selectedCard.contactPhone || '', whatsappInput || 'Olá!')}
                  target={WHATSAPP_WEB_TARGET}
                  rel="noreferrer"
                  className="text-[11px] bg-emerald-800 hover:bg-emerald-900 text-emerald-100 px-2.5 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" />
                  Abrir Web WhatsApp
                </a>
              </div>

              <div className="flex-1 p-4 bg-neutral-100 dark:bg-neutral-950 overflow-y-auto space-y-3 min-h-[300px]">
                {selectedCard.messages
                  .filter((m) => m.channel === 'whatsapp')
                  .map((msg) => {
                    const isMe = msg.sender === 'consultant';
                    const isSystem = msg.sender === 'system';

                    if (isSystem) {
                      return (
                        <div key={msg.id} className="text-center my-2">
                          <span className="px-2.5 py-1 bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-full text-[10px] font-medium">
                            {msg.content} • {formatTimeAgo(msg.timestamp)}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[75%] p-3 rounded-2xl text-xs shadow-xs relative ${
                            isMe
                              ? 'bg-emerald-600 text-white rounded-tr-none'
                              : 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 rounded-tl-none border border-neutral-200 dark:border-neutral-800'
                          }`}
                        >
                          <p className={`text-[10px] font-bold mb-0.5 ${isMe ? 'text-emerald-100' : 'text-neutral-500 dark:text-neutral-400'}`}>{msg.senderName}</p>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          <div className={`text-[9px] text-right mt-1 ${isMe ? 'text-emerald-200' : 'text-neutral-400'}`}>
                            {formatDate(msg.timestamp)}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                {selectedCard.messages.filter((m) => m.channel === 'whatsapp').length === 0 && (
                  <div className="h-full flex items-center justify-center text-neutral-400 text-xs py-10">
                    Nenhuma mensagem no histórico. Digite abaixo para enviar ou simular contato.
                  </div>
                )}
              </div>

              {/* Message Composer */}
              <div className="p-3 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
                <button
                  type="button"
                  onClick={handleSuggestWhatsappFollowup}
                  disabled={isSuggestingWhatsapp}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/70 text-red-700 dark:text-red-300 text-[11px] font-semibold rounded-lg border border-red-200 dark:border-red-900/60 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSuggestingWhatsapp ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  Sugerir follow-up com IA
                </button>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={whatsappInput}
                    onChange={(e) => setWhatsappInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendWhatsApp()}
                    placeholder="Escreva uma mensagem no WhatsApp..."
                    className="flex-1 px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                  <button
                    onClick={() => handleSendWhatsApp()}
                    className="p-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: E-MAIL INTEGRADO */}
          {activeTab === 'email' && (
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs">
                <h4 className="font-bold text-xs text-neutral-800 dark:text-neutral-200 mb-3 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-red-600 dark:text-red-500" />
                  <span>Enviar E-mail Direto</span>
                </h4>

                <div className="space-y-3">
                  <div>
                    <input
                      type="text"
                      value={`Para: ${selectedCard.contactEmail || 'lead@empresa.com.br'}`}
                      disabled
                      className="w-full text-xs px-3 py-1.5 bg-neutral-50 dark:bg-neutral-950 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 rounded-lg"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Assunto do e-mail..."
                      className="w-full text-xs px-3 py-1.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg font-medium focus:ring-2 focus:ring-red-500/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <textarea
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      placeholder="Escreva o corpo do e-mail para o cliente..."
                      rows={4}
                      className="w-full text-xs p-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        setEmailBody(
                          `Prezado(a) ${selectedCard.contactName},\n\nConforme conversamos, estamos enviando o material detalhado sobre os processos de transformação na ${selectedCard.companyName}.\n\nAtenciosamente,\n${currentUser.name}`
                        )
                      }
                      className="text-xs text-red-600 dark:text-red-400 hover:underline font-medium cursor-pointer"
                    >
                      Inserir Modelo Padrão
                    </button>

                    <button
                      onClick={handleSendEmail}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Enviar E-mail</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Email History Threads */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                  Histórico de E-mails ({selectedCard.messages.filter((m) => m.channel === 'email').length})
                </h4>

                {selectedCard.messages
                  .filter((m) => m.channel === 'email')
                  .map((msg) => (
                    <div key={msg.id} className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 flex items-center justify-center font-bold text-xs">
                            @
                          </span>
                          <span className="font-bold text-xs text-neutral-800 dark:text-neutral-200">{msg.subject || 'Sem Assunto'}</span>
                        </div>
                        <span className="text-[10px] text-neutral-400">{formatDate(msg.timestamp)}</span>
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap pl-8">{msg.content}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 5: CHECKLIST & TAREFAS */}
          {activeTab === 'checklist' && (
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs">
                <h4 className="font-bold text-xs text-neutral-800 dark:text-neutral-200 mb-3 flex items-center justify-between">
                  <span>Itens de Verificação e Próximos Passos</span>
                  <span className="text-red-600 dark:text-red-400 text-xs font-semibold">
                    {selectedCard.checklist.filter((i) => i.completed).length} de {selectedCard.checklist.length} concluídos
                  </span>
                </h4>

                <div className="space-y-2 mb-4">
                  {selectedCard.checklist.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => toggleChecklistItem(selectedCard.id, item.id)}
                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer ${
                        item.completed
                          ? 'bg-neutral-100 dark:bg-neutral-950/60 border-neutral-200 dark:border-neutral-800 text-neutral-400'
                          : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-red-500/50 text-neutral-800 dark:text-neutral-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => {}}
                        className="mt-0.5 rounded text-red-600 focus:ring-red-500 accent-red-600"
                      />
                      <span className={`text-xs flex-1 ${item.completed ? 'line-through opacity-70' : 'font-medium'}`}>
                        {item.text}
                      </span>
                    </div>
                  ))}

                  {selectedCard.checklist.length === 0 && (
                    <p className="text-xs text-neutral-400 text-center py-4">Nenhuma tarefa no checklist.</p>
                  )}
                </div>

                <form onSubmit={handleAddChecklist} className="flex gap-2">
                  <input
                    type="text"
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                    placeholder="Adicionar nova tarefa ao checklist..."
                    className="flex-1 text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 6: GOOGLE AI SUITE (GEMINI 2.5 FLASH / PRO) */}
          {activeTab === 'ai' && (
            <div className="max-w-3xl mx-auto space-y-4">
              {/* Google AI Studio Status Banner */}
              <div className="p-3.5 bg-red-50 dark:bg-neutral-900 rounded-xl border border-red-200 dark:border-neutral-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-red-600/20 text-red-500 rounded-lg">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-neutral-900 dark:text-neutral-100">
                      Inteligência Comercial QuaraCRM • Google Gemini
                    </span>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Respostas via Google AI Studio quando configurado no servidor, com fallback inteligente local.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsIntegrationsModalOpen(true)}
                  className="px-2.5 py-1 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  <Zap className="w-3 h-3 text-red-500" />
                  Configurar Chave
                </button>
              </div>

              {/* Sub Navigation for AI Tools */}
              <div className="flex bg-neutral-100 dark:bg-neutral-950 p-1 rounded-xl gap-1 text-xs">
                <button
                  onClick={() => setAiSubTab('copywriter')}
                  className={`flex-1 py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    aiSubTab === 'copywriter'
                      ? 'bg-white dark:bg-neutral-800 text-red-600 dark:text-red-400 shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Gerador de Copy</span>
                </button>

                <button
                  onClick={() => {
                    setAiSubTab('deal_health');
                    if (!dealHealthData) handleAnalyzeDealHealth();
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    aiSubTab === 'deal_health'
                      ? 'bg-white dark:bg-neutral-800 text-red-600 dark:text-red-400 shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Saúde do Deal (% Win)</span>
                </button>

                <button
                  onClick={() => setAiSubTab('meeting')}
                  className={`flex-1 py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    aiSubTab === 'meeting'
                      ? 'bg-white dark:bg-neutral-800 text-red-600 dark:text-red-400 shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Ata de Reunião</span>
                </button>

                <button
                  onClick={() => setAiSubTab('copilot')}
                  className={`flex-1 py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    aiSubTab === 'copilot'
                      ? 'bg-white dark:bg-neutral-800 text-red-600 dark:text-red-400 shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Copilot de Vendas</span>
                </button>
              </div>

              {/* SUB-TAB 1: COPYWRITER */}
              {aiSubTab === 'copywriter' && (
                <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-4">
                  <div>
                    <h4 className="font-bold text-xs text-neutral-800 dark:text-neutral-200 mb-1">
                      Gerador de Comunicação & Argumentação Comercial
                    </h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Selecione o objetivo da mensagem adaptada aos dados de <strong>{selectedCard.companyName}</strong>:
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleGenerateAiResponse('followup')}
                      disabled={isAiGenerating}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      💬 Follow-up de Etapa ({currentPhase.name})
                    </button>
                    <button
                      onClick={() => handleGenerateAiResponse('objection')}
                      disabled={isAiGenerating}
                      className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      🛡️ Quebra de Objeção de Preço
                    </button>
                    <button
                      onClick={() => handleGenerateAiResponse('proposal')}
                      disabled={isAiGenerating}
                      className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      📄 Resumo Executivo da Proposta
                    </button>
                    <button
                      onClick={() => handleGenerateAiResponse('cold_call')}
                      disabled={isAiGenerating}
                      className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      📞 Script de Ligação (Cold Call)
                    </button>
                    <button
                      onClick={() => handleGenerateAiResponse('reactivation')}
                      disabled={isAiGenerating}
                      className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      🔥 Reativação de Lead Esfriado
                    </button>
                  </div>

                  {/* Custom Prompt Input */}
                  <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex gap-2">
                    <input
                      type="text"
                      placeholder="Ou digite instruções extras (ex: Tom mais formal, focar em ROI trimestral...)"
                      value={aiCustomPrompt}
                      onChange={(e) => setAiCustomPrompt(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                    <button
                      onClick={() => handleGenerateAiResponse('custom')}
                      disabled={isAiGenerating}
                      className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
                    >
                      Gerar Personalizado
                    </button>
                  </div>

                  {isAiGenerating ? (
                    <div className="p-8 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 text-center">
                      <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                        Google Gemini analisando a oportunidade e criando a copy...
                      </p>
                    </div>
                  ) : aiGeneratedText ? (
                    <div className="p-4 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-red-600 dark:text-red-400 tracking-wider">
                          Sugestão do Gemini:
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(aiGeneratedText);
                            alert('Texto copiado para a área de transferência!');
                          }}
                          className="text-xs text-red-600 dark:text-red-400 hover:underline font-semibold cursor-pointer"
                        >
                          Copiar Texto
                        </button>
                      </div>

                      <p className="text-xs text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed bg-white dark:bg-neutral-900 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 font-sans">
                        {aiGeneratedText}
                      </p>

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => {
                            setWhatsappInput(aiGeneratedText);
                            setActiveTab('whatsapp');
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Usar no WhatsApp
                        </button>
                        <button
                          onClick={() => {
                            setEmailBody(aiGeneratedText);
                            setActiveTab('email');
                          }}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Usar no E-mail
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* SUB-TAB 2: DEAL HEALTH */}
              {aiSubTab === 'deal_health' && (
                <div className="p-5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-neutral-800 dark:text-neutral-200">
                        Diagnóstico Preditivo de Fechamento (Deal Health)
                      </h4>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Cálculo probabilístico com base na fase ({currentPhase.name}), valor e histórico.
                      </p>
                    </div>
                    <button
                      onClick={handleAnalyzeDealHealth}
                      disabled={isLoadingDealHealth}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingDealHealth ? 'animate-spin' : ''}`} />
                      Recalcular
                    </button>
                  </div>

                  {isLoadingDealHealth ? (
                    <div className="p-8 text-center bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800">
                      <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-xs text-neutral-500">Calculando probabilidade e gargalos com IA...</p>
                    </div>
                  ) : dealHealthData ? (
                    <div className="space-y-4">
                      {/* Score Bar */}
                      <div className="p-4 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center gap-4">
                        <div className="text-center shrink-0 w-24">
                          <span className="text-3xl font-black text-red-600 dark:text-red-500">
                            {dealHealthData.winProbability}%
                          </span>
                          <span className="block text-[10px] uppercase font-bold text-neutral-400">Chance de Win</span>
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span>Status da Negociação:</span>
                            <span className="uppercase text-red-600 dark:text-red-400">
                              {dealHealthData.healthStatus}
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-red-600 rounded-full transition-all duration-500"
                              style={{ width: `${dealHealthData.winProbability}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Strengths & Risks */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl space-y-1.5">
                          <strong className="text-emerald-800 dark:text-emerald-300 block font-bold">
                            ✓ Pontos Fortes Mapeados
                          </strong>
                          <ul className="space-y-1 text-emerald-900 dark:text-emerald-200 text-[11px]">
                            {dealHealthData.strengths?.map((s: string, idx: number) => (
                              <li key={idx}>• {s}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl space-y-1.5">
                          <strong className="text-red-800 dark:text-red-300 block font-bold">
                            ⚠ Riscos & Pontos de Atenção
                          </strong>
                          <ul className="space-y-1 text-red-900 dark:text-red-200 text-[11px]">
                            {dealHealthData.risks?.map((r: string, idx: number) => (
                              <li key={idx}>• {r}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Strategy */}
                      <div className="p-3.5 bg-neutral-100 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs">
                        <strong className="text-neutral-800 dark:text-neutral-200 block mb-1">
                          🎯 Estratégia Recomendada pelo Gemini:
                        </strong>
                        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                          {dealHealthData.recommendedStrategy}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* SUB-TAB 3: MEETING TRANSCRIPT */}
              {aiSubTab === 'meeting' && (
                <div className="p-5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-4">
                  <div>
                    <h4 className="font-bold text-xs text-neutral-800 dark:text-neutral-200 mb-1">
                      Processamento Inteligente de Reuniões & Calls
                    </h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Cole anotações soltas, transcrição de áudio ou pontos da reunião. O Gemini estruturará as dores, decisores e próximos passos.
                    </p>
                  </div>

                  <textarea
                    rows={4}
                    value={meetingNotesInput}
                    onChange={(e) => setMeetingNotesInput(e.target.value)}
                    placeholder="Ex: Reunião com Marcelo da Diretoria. Falaram que o maior gargalo hoje é a perda de leads no WhatsApp. Orçamento aprovado de até 30 mil..."
                    className="w-full p-3 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-neutral-100 focus:ring-1 focus:ring-red-500 focus:outline-none"
                  />

                  <div className="flex justify-end">
                    <button
                      onClick={handleExtractMeeting}
                      disabled={isExtractingMeeting || !meetingNotesInput.trim()}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                    >
                      {isExtractingMeeting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Processando com IA...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          Extrair Insights & Dores
                        </>
                      )}
                    </button>
                  </div>

                  {meetingInsights && (
                    <div className="p-4 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-3 text-xs">
                      <div>
                        <strong className="text-neutral-800 dark:text-neutral-200 block mb-0.5 font-bold">
                          Resumo da Reunião:
                        </strong>
                        <p className="text-neutral-600 dark:text-neutral-400">{meetingInsights.summary}</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                        <div>
                          <strong className="text-neutral-700 dark:text-neutral-300 block">Dores Identificadas:</strong>
                          <p className="text-neutral-600 dark:text-neutral-400">{meetingInsights.identifiedPains}</p>
                        </div>
                        <div>
                          <strong className="text-neutral-700 dark:text-neutral-300 block">Próximos Passos Acordados:</strong>
                          <p className="text-neutral-600 dark:text-neutral-400">{meetingInsights.nextSteps}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
                        <button
                          onClick={handleApplyMeetingInsights}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Aplicar Insights nos Campos do Card
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SUB-TAB 4: COPILOT DE VENDAS */}
              {aiSubTab === 'copilot' && (
                <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
                    <Bot className="w-4 h-4 text-red-600 dark:text-red-500" />
                    <h4 className="font-bold text-xs text-neutral-800 dark:text-neutral-200">
                      Copilot Consultivo de Vendas — {selectedCard.companyName}
                    </h4>
                  </div>

                  {/* Chat Messages */}
                  <div className="space-y-2.5 max-h-72 overflow-y-auto p-2 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 min-h-[160px]">
                    {copilotMessages.length === 0 && (
                      <p className="text-xs text-neutral-400 text-center py-6">
                        Faça perguntas estratégicas sobre este cliente (ex: "Qual melhor abordagem para contornar a objeção de prazo?", "Como conduzir o fechamento nesta fase?").
                      </p>
                    )}

                    {copilotMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-xl text-xs ${
                          msg.sender === 'user'
                            ? 'bg-neutral-800 text-white ml-8 rounded-tr-none'
                            : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 mr-8 rounded-tl-none leading-relaxed'
                        }`}
                      >
                        <strong className="block text-[10px] opacity-70 mb-1">
                          {msg.sender === 'user' ? currentUser.name : 'Gemini Copilot'}
                        </strong>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    ))}

                    {isCopilotThinking && (
                      <div className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs mr-8 flex items-center gap-2">
                        <div className="w-3.5 h-3.5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-neutral-500">Copilot formulando estratégia...</span>
                      </div>
                    )}
                  </div>

                  {/* Chat Input */}
                  <form onSubmit={handleSendCopilotMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={copilotInput}
                      onChange={(e) => setCopilotInput(e.target.value)}
                      placeholder="Pergunte ao Copilot sobre como avançar nesta oportunidade..."
                      className="flex-1 px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                    <button
                      type="submit"
                      disabled={isCopilotThinking || !copilotInput.trim()}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Perguntar</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: HISTÓRICO & AUDITORIA */}
          {activeTab === 'history' && (
            <div className="max-w-2xl mx-auto space-y-3">
              <h4 className="font-bold text-xs text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
                Trilha de Auditoria do Card ({selectedCard.history.length})
              </h4>

              <div className="relative border-l-2 border-red-200 dark:border-red-950 ml-4 space-y-4 pl-4 py-1">
                {selectedCard.history.map((hist) => (
                  <div key={hist.id} className="relative group">
                    <div className="absolute -left-[23px] top-1 w-3 h-3 bg-red-600 rounded-full border-2 border-white dark:border-neutral-900" />
                    <div className="p-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-neutral-800 dark:text-neutral-200">{hist.userName}</span>
                        <span className="text-[10px] text-neutral-400">{formatDate(hist.timestamp)}</span>
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">{hist.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
