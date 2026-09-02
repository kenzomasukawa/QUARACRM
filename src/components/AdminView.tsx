import React, { useState } from 'react';
import {
  Shield,
  Users,
  Target,
  Settings,
  Plus,
  Edit2,
  Check,
  Lock,
  Unlock,
  DollarSign,
  UserCheck,
  FileSpreadsheet,
  Zap,
} from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { User, UserRole, PhaseId } from '../types/crm';
import { formatCurrency } from '../utils/formatters';

export const AdminView: React.FC = () => {
  const {
    users,
    currentUser,
    updateUserGoal,
    updateUserPermissions,
    addUser,
    phases,
    updatePhaseConfig,
    addPhaseField,
  } = useCRM();

  const [activeAdminSubTab, setActiveAdminSubTab] = useState<'goals' | 'permissions' | 'phases'>('goals');

  // Goals State Editor
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [goalValueInput, setGoalValueInput] = useState<number>(0);
  const [goalLeadsInput, setGoalLeadsInput] = useState<number>(0);

  // SLA (hours) inputs, keyed by phase id — holds the raw text being typed so
  // the field doesn't get committed (and re-rendered from context) on every
  // keystroke, which was jumping the cursor and scrambling the digits.
  const [slaInputs, setSlaInputs] = useState<Record<string, string>>({});

  // New Phase Field Editor
  const [selectedPhaseForField, setSelectedPhaseForField] = useState<PhaseId>('mapeados');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'textarea' | 'number' | 'currency' | 'date' | 'select'>('text');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldOptions, setNewFieldOptions] = useState('');

  // Add User State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('consultant');
  const [newUserDept, setNewUserDept] = useState('Consultoria Comercial');
  const [newUserGoalVal, setNewUserGoalVal] = useState<number>(80000);
  const [newUserGoalLeads, setNewUserGoalLeads] = useState<number>(4);

  const handleStartEditGoal = (u: User) => {
    setEditingUserId(u.id);
    setGoalValueInput(u.monthlyGoalValue);
    setGoalLeadsInput(u.monthlyGoalLeads);
  };

  const handleSaveGoal = (userId: string) => {
    updateUserGoal(userId, Number(goalValueInput) || 0, Number(goalLeadsInput) || 0);
    setEditingUserId(null);
  };

  const handleAddFieldSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldLabel.trim()) return;

    const options = newFieldType === 'select' ? newFieldOptions.split(',').map((o) => o.trim()).filter(Boolean) : undefined;

    addPhaseField(selectedPhaseForField, {
      id: 'custom_' + Date.now(),
      label: newFieldLabel.trim(),
      type: newFieldType,
      required: newFieldRequired,
      options,
    });

    setNewFieldLabel('');
    setNewFieldOptions('');
    setNewFieldRequired(false);
    alert('Campo adicionado com sucesso à fase selecionada!');
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    addUser({
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      phone: '(11) 99999-0000',
      active: true,
      department: newUserDept,
      monthlyGoalValue: Number(newUserGoalVal) || 0,
      monthlyGoalLeads: Number(newUserGoalLeads) || 0,
      currentMonthWonValue: 0,
      currentMonthWonCount: 0,
      permissions: {
        canExport: newUserRole === 'admin' || newUserRole === 'manager',
        canEditAutomations: newUserRole === 'admin' || newUserRole === 'manager',
        canViewAllLeads: true,
        canEditPhaseFields: newUserRole === 'admin',
        canManageUsers: newUserRole === 'admin',
        canDeleteCards: newUserRole === 'admin' || newUserRole === 'manager',
      },
    });

    setIsAddUserOpen(false);
    setNewUserName('');
    setNewUserEmail('');
  };

  // RBAC Access Guard
  if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 bg-white dark:bg-neutral-900 border border-red-200 dark:border-red-900/40 rounded-2xl shadow-xl text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Acesso Restrito ao Painel Administrativo</h2>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-md mx-auto">
          Seu perfil atual (<span className="font-semibold capitalize text-neutral-900 dark:text-neutral-200">{currentUser.role}</span>) não possui permissão para acessar o gerenciamento de colaboradores, metas e regras de acesso RBAC. Entre em contato com um Administrador do sistema caso necessite de elevação de privilégios.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-600 dark:text-red-500" />
            <span>Painel Administrativo & Controle de Metas</span>
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Gerencie colaboradores, metas individuais, níveis de acesso RBAC e campos personalizados de fases
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddUserOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Colaborador</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveAdminSubTab('goals')}
          className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeAdminSubTab === 'goals'
              ? 'border-red-600 text-red-600 dark:border-red-500 dark:text-red-400'
              : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
          }`}
        >
          🎯 Metas Individuais dos Consultores
        </button>

        <button
          onClick={() => setActiveAdminSubTab('permissions')}
          className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeAdminSubTab === 'permissions'
              ? 'border-red-600 text-red-600 dark:border-red-500 dark:text-red-400'
              : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
          }`}
        >
          🛡️ Permissões & Níveis de Acesso (RBAC)
        </button>

        <button
          onClick={() => setActiveAdminSubTab('phases')}
          className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeAdminSubTab === 'phases'
              ? 'border-red-600 text-red-600 dark:border-red-500 dark:text-red-400'
              : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
          }`}
        >
          📝 Personalizar Perguntas & SLA das Fases
        </button>
      </div>

      {/* SUB-TAB 1: INDIVIDUAL GOALS */}
      {activeAdminSubTab === 'goals' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs overflow-hidden">
            <div className="p-4 bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">Ajuste de Metas Mensais Individuais</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Configure os valores em R$ e quantidade de leads a serem fechados por cada consultor
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-neutral-100 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">Colaborador</th>
                    <th className="p-3.5">Cargo / Departamento</th>
                    <th className="p-3.5">Meta R$ (Mensal)</th>
                    <th className="p-3.5">Meta Qtd Fechamentos</th>
                    <th className="p-3.5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {users.map((u) => {
                    const isEditing = editingUserId === u.id;

                    return (
                      <tr key={u.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-850/60 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                            <div>
                              <div className="font-bold text-neutral-900 dark:text-neutral-100">{u.name}</div>
                              <div className="text-[10px] text-neutral-400 dark:text-neutral-500">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="font-medium text-neutral-700 dark:text-neutral-300">{u.department}</span>
                          <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3.5">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <span className="text-neutral-400">R$</span>
                              <input
                                type="number"
                                value={goalValueInput}
                                onChange={(e) => setGoalValueInput(parseFloat(e.target.value) || 0)}
                                className="w-28 px-2 py-1 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-red-500 rounded font-bold text-xs"
                              />
                            </div>
                          ) : (
                            <span className="font-bold text-neutral-900 dark:text-neutral-100">{formatCurrency(u.monthlyGoalValue)}</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          {isEditing ? (
                            <input
                              type="number"
                              value={goalLeadsInput}
                              onChange={(e) => setGoalLeadsInput(parseInt(e.target.value, 10) || 0)}
                              className="w-16 px-2 py-1 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-red-500 rounded font-bold text-xs"
                            />
                          ) : (
                            <span className="font-semibold text-neutral-700 dark:text-neutral-300">{u.monthlyGoalLeads} contratos</span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          {isEditing ? (
                            <button
                              onClick={() => handleSaveGoal(u.id)}
                              className="px-3 py-1 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 text-xs flex items-center gap-1 ml-auto cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Salvar</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStartEditGoal(u)}
                              className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors font-medium text-xs flex items-center gap-1 ml-auto cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Editar</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: RBAC PERMISSIONS */}
      {activeAdminSubTab === 'permissions' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs overflow-hidden">
            <div className="p-4 bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">Matriz de Permissões Granulares por Colaborador</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Ative ou desative permissões de exportação, edição de regras de automação e exclusão
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-neutral-100 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">Colaborador</th>
                    <th className="p-3.5">Nível</th>
                    <th className="p-3.5 text-center">Exportar Dados</th>
                    <th className="p-3.5 text-center">Editar Automações</th>
                    <th className="p-3.5 text-center">Campos de Fases</th>
                    <th className="p-3.5 text-center">Excluir Cards</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {users.map((u) => {
                    const perms = u.permissions || {
                      canExport: false,
                      canEditAutomations: false,
                      canViewAllLeads: true,
                      canEditPhaseFields: false,
                      canManageUsers: false,
                      canDeleteCards: false,
                    };

                    return (
                      <tr key={u.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-850/60">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <img src={u.avatar} alt={u.name} className="w-7 h-7 rounded-full object-cover" />
                            <span className="font-bold text-neutral-800 dark:text-neutral-200">{u.name}</span>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={perms.canExport}
                            onChange={(e) =>
                              updateUserPermissions(u.id, { canExport: e.target.checked })
                            }
                            className="rounded text-red-600 focus:ring-red-500 cursor-pointer accent-red-600"
                          />
                        </td>
                        <td className="p-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={perms.canEditAutomations}
                            onChange={(e) =>
                              updateUserPermissions(u.id, { canEditAutomations: e.target.checked })
                            }
                            className="rounded text-red-600 focus:ring-red-500 cursor-pointer accent-red-600"
                          />
                        </td>
                        <td className="p-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={perms.canEditPhaseFields}
                            onChange={(e) =>
                              updateUserPermissions(u.id, { canEditPhaseFields: e.target.checked })
                            }
                            className="rounded text-red-600 focus:ring-red-500 cursor-pointer accent-red-600"
                          />
                        </td>
                        <td className="p-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={perms.canDeleteCards}
                            onChange={(e) =>
                              updateUserPermissions(u.id, { canDeleteCards: e.target.checked })
                            }
                            className="rounded text-red-600 focus:ring-red-500 cursor-pointer accent-red-600"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: PHASES & CUSTOM QUESTIONS BUILDER */}
      {activeAdminSubTab === 'phases' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Phase Configuration List */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-200">Perguntas Ativas em Cada Fase</h3>

            {phases.map((phase) => (
              <div key={phase.id} className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${phase.color.replace('text-', 'bg-')}`} />
                    <h4 className="font-bold text-xs text-neutral-900 dark:text-neutral-100">{phase.name}</h4>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-neutral-400">SLA:</span>
                    <input
                      type="number"
                      value={slaInputs[phase.id] ?? String(phase.slaHours)}
                      onChange={(e) =>
                        setSlaInputs((prev) => ({ ...prev, [phase.id]: e.target.value }))
                      }
                      onBlur={() => {
                        const raw = slaInputs[phase.id];
                        if (raw !== undefined) {
                          updatePhaseConfig(phase.id, { slaHours: parseInt(raw, 10) || 0 });
                        }
                        setSlaInputs((prev) => {
                          const next = { ...prev };
                          delete next[phase.id];
                          return next;
                        });
                      }}
                      className="w-16 px-1.5 py-0.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded text-center font-bold text-xs"
                    />
                    <span className="text-neutral-400">horas</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {phase.requiredFields.map((field) => (
                    <div
                      key={field.id}
                      className="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-950 rounded-lg text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">{field.label}</span>
                        {field.required && <span className="text-[10px] text-red-500 font-bold">*Obrigatório</span>}
                      </div>
                      <span className="px-2 py-0.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded text-[10px] text-neutral-600 dark:text-neutral-400 font-mono">
                        Tipo: {field.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Add New Custom Field Form */}
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs h-fit sticky top-20">
            <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 mb-2">Adicionar Pergunta a uma Fase</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
              Crie perguntas personalizadas para os consultores preencherem durante o processo
            </p>

            <form onSubmit={handleAddFieldSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">Selecione a Fase</label>
                <select
                  value={selectedPhaseForField}
                  onChange={(e) => setSelectedPhaseForField(e.target.value as PhaseId)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-lg focus:outline-none"
                >
                  {phases.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">Rótulo da Pergunta / Campo *</label>
                <input
                  type="text"
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  placeholder="Ex: Canal de Aquisição ou Decisor"
                  required
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">Tipo de Campo</label>
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-lg focus:outline-none"
                >
                  <option value="text">Texto Curto</option>
                  <option value="textarea">Texto Longo (Parágrafo)</option>
                  <option value="number">Número</option>
                  <option value="currency">Moeda (R$)</option>
                  <option value="date">Data</option>
                  <option value="select">Lista de Seleção (Dropdown)</option>
                </select>
              </div>

              {newFieldType === 'select' && (
                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">Opções (separadas por vírgula)</label>
                  <input
                    type="text"
                    value={newFieldOptions}
                    onChange={(e) => setNewFieldOptions(e.target.value)}
                    placeholder="Opção A, Opção B, Opção C"
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-lg focus:outline-none"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-field-req"
                  checked={newFieldRequired}
                  onChange={(e) => setNewFieldRequired(e.target.checked)}
                  className="rounded text-red-600 accent-red-600 cursor-pointer"
                />
                <label htmlFor="chk-field-req" className="font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer">
                  Campo Obrigatório nesta fase
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-lg font-bold shadow-xs transition-colors mt-2 cursor-pointer"
              >
                + Adicionar Campo à Fase
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal to Add Colaborador */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">Novo Colaborador</h3>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 font-bold text-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="mx-6 mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-lg text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
              <strong>Este cadastro é só local</strong> (exibição de metas/relatórios) — não cria login nem permite que a
              pessoa seja atribuída como responsável real de um lead. Para isso, crie a conta em{' '}
              <strong>Supabase Auth → Authentication → Users</strong> e depois rode o <code>INSERT INTO user_roles</code>{' '}
              (veja o CLAUDE.md do projeto). Assim que a conta existir de verdade, ela aparece automaticamente nos
              dropdowns de &quot;Consultor Responsável&quot;.
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Ex: Gabriel Santos"
                  required
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">E-mail Profissional *</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="gabriel.santos@empresa.com.br"
                  required
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">Nível de Acesso (Role)</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg font-semibold"
                  >
                    <option value="consultant">Consultor / Vendedor</option>
                    <option value="manager">Gerente Comercial</option>
                    <option value="admin">Administrador Geral</option>
                    <option value="viewer">Visualizador</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">Departamento</label>
                  <input
                    type="text"
                    value={newUserDept}
                    onChange={(e) => setNewUserDept(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">Meta Mensal R$</label>
                  <input
                    type="number"
                    value={newUserGoalVal}
                    onChange={(e) => setNewUserGoalVal(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">Meta Qtd Fechamentos</label>
                  <input
                    type="number"
                    value={newUserGoalLeads}
                    onChange={(e) => setNewUserGoalLeads(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Criar Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
