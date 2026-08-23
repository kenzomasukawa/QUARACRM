import React, { useState } from 'react';
import { X, Building2, User as UserIcon, Phone, Mail, DollarSign, Tag, Plus, Check } from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { PhaseId, Priority, ProspectingChannel } from '../types/crm';

export const NewCardModal: React.FC = () => {
  const {
    isNewCardModalOpen,
    setIsNewCardModalOpen,
    newCardDefaultPhase,
    phases,
    users,
    currentUser,
    createCard,
    setSelectedCard,
  } = useCRM();

  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [phaseId, setPhaseId] = useState<PhaseId>(newCardDefaultPhase || 'mapeados');
  const [value, setValue] = useState<number>(0);
  const [priority, setPriority] = useState<Priority>('media');
  const [assignedUserId, setAssignedUserId] = useState<string>(currentUser.id);
  const [canalProspeccao, setCanalProspeccao] = useState<ProspectingChannel>('LinkedIn Sales Nav');
  const [perfilICP, setPerfilICP] = useState('');
  const [tagsInput, setTagsInput] = useState('Outbound, B2B');

  if (!isNewCardModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !companyName.trim()) {
      alert('Por favor, informe ao menos o Título e a Empresa.');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const newCard = createCard({
      title: title.trim(),
      companyName: companyName.trim(),
      contactName: contactName.trim() || 'Contato Principal',
      contactPhone: contactPhone.trim(),
      contactWhatsapp: contactPhone.trim(),
      contactEmail: contactEmail.trim(),
      contactRole: contactRole.trim() || 'Decisor',
      phaseId,
      value: Number(value) || 0,
      priority,
      assignedUserId,
      tags,
      customFields: {
        dataMapeamento: new Date().toISOString().slice(0, 10),
        canalProspeccao,
        perfilICP: perfilICP.trim(),
      },
    });

    setIsNewCardModalOpen(false);
    setSelectedCard(newCard);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-600 dark:bg-red-700 text-white flex items-center justify-center font-bold">
              +
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 dark:text-neutral-100 text-sm">Criar Novo Card / Oportunidade</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Mapeie um novo lead ou processo no fluxo</p>
            </div>
          </div>
          <button
            onClick={() => setIsNewCardModalOpen(false)}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Card Title & Company */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Título do Card / Projeto <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Consultoria de Processos CRM"
                required
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 focus:bg-white dark:focus:bg-neutral-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Nome da Empresa <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ex: Acme Logística S/A"
                required
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 focus:bg-white dark:focus:bg-neutral-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Nome do Contato</label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Ex: Roberto Prado"
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 focus:bg-white dark:focus:bg-neutral-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">WhatsApp / Telefone</label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="(11) 98765-4321"
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 focus:bg-white dark:focus:bg-neutral-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">E-mail Comercial</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="roberto@empresa.com"
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 focus:bg-white dark:focus:bg-neutral-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Value, Priority, Initial Phase */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">Fase Inicial</label>
              <select
                value={phaseId}
                onChange={(e) => setPhaseId(e.target.value as PhaseId)}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 focus:bg-white dark:focus:bg-neutral-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
              >
                {phases.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">Valor Estimado (R$)</label>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                placeholder="Ex: 35000"
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:bg-white dark:focus:bg-neutral-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none font-bold text-red-600 dark:text-red-400"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">Prioridade</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 focus:bg-white dark:focus:bg-neutral-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="urgente">🔥 Urgente</option>
              </select>
            </div>
          </div>

          {/* Initial Prospecting Details */}
          <div className="p-3 bg-red-50/50 dark:bg-red-950/30 rounded-xl border border-red-200/80 dark:border-red-900/60 space-y-3">
            <span className="text-[10px] font-bold uppercase text-red-700 dark:text-red-300 tracking-wider block">
              Origem & Perfil de Prospecção
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-neutral-800 dark:text-neutral-200 mb-1">Canal de Prospecção Utilizado *</label>
                <select
                  value={canalProspeccao}
                  onChange={(e) => setCanalProspeccao(e.target.value as ProspectingChannel)}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border border-red-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:outline-none"
                >
                  <option value="LinkedIn Sales Nav">LinkedIn Sales Nav</option>
                  <option value="Cold Call">Cold Call</option>
                  <option value="Outbound E-mail">Outbound E-mail</option>
                  <option value="Indicação / Parceiro">Indicação / Parceiro</option>
                  <option value="Evento / Feira">Evento / Feira</option>
                  <option value="Inbound Marketing">Inbound Marketing</option>
                  <option value="WhatsApp / Instagram">WhatsApp / Instagram</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-800 dark:text-neutral-200 mb-1">Perfil / Segmento (ICP)</label>
                <input
                  type="text"
                  value={perfilICP}
                  onChange={(e) => setPerfilICP(e.target.value)}
                  placeholder="Ex: SaaS B2B, Logística, Varejo"
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border border-red-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Assigned Consultant & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Consultor Responsável</label>
              <select
                value={assignedUserId}
                onChange={(e) => setAssignedUserId(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 focus:bg-white dark:focus:bg-neutral-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Tags (separadas por vírgula)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Enterprise, Outbound, High-Ticket"
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 focus:bg-white dark:focus:bg-neutral-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => setIsNewCardModalOpen(false)}
              className="px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white rounded-lg font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Salvar e Criar Card</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
