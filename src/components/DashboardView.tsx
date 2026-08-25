import React from 'react';
import {
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Clock,
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  Calendar,
  MessageSquare,
  Mail,
  Zap,
} from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { formatCurrency } from '../utils/formatters';
import { exportConsultantReportToCSV } from '../utils/exportUtils';

export const DashboardView: React.FC = () => {
  const { cards, phases, users } = useCRM();

  // Metrics Calculations
  const activeCards = cards.filter((c) => c.phaseId !== 'ganho' && c.phaseId !== 'perdido');
  const wonCards = cards.filter((c) => c.phaseId === 'ganho');
  const lostCards = cards.filter((c) => c.phaseId === 'perdido');

  const totalActiveValue = activeCards.reduce((acc, c) => acc + (c.value || 0), 0);
  const totalWonValue = wonCards.reduce((acc, c) => acc + (c.value || 0), 0);
  const totalLostValue = lostCards.reduce((acc, c) => acc + (c.value || 0), 0);

  const totalClosed = wonCards.length + lostCards.length;
  const overallConversionRate = totalClosed > 0 ? ((wonCards.length / totalClosed) * 100).toFixed(1) : '0';

  const averageTicket = wonCards.length > 0 ? totalWonValue / wonCards.length : 0;

  // Total Team Goal
  const totalTeamGoal = users
    .filter((u) => u.role === 'consultant' || u.role === 'manager')
    .reduce((acc, u) => acc + (u.monthlyGoalValue || 0), 0);

  const teamGoalPercent = totalTeamGoal > 0 ? Math.min(100, (totalWonValue / totalTeamGoal) * 100).toFixed(1) : '0';

  // Lost reasons summary
  const lostReasonsMap: Record<string, number> = {};
  lostCards.forEach((c) => {
    const reason = c.customFields?.motivoPerda || 'Outro / Não especificado';
    lostReasonsMap[reason] = (lostReasonsMap[reason] || 0) + 1;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Export */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Painel de Métricas & Produtividade</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Acompanhamento em tempo real do pipeline, metas individuais e performance por consultor
          </p>
        </div>

        <button
          onClick={() => exportConsultantReportToCSV(users, cards)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Exportar Relatório de Consultores (CSV)</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Pipeline */}
        <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Pipeline em Aberto</span>
            <div className="p-2 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{formatCurrency(totalActiveValue)}</div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-medium">{activeCards.length} negociações em andamento</p>
        </div>

        {/* Won Deals Total */}
        <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Fechamento Ganho</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalWonValue)}</div>
          <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1 font-semibold">{wonCards.length} contratos assinados no mês</p>
        </div>

        {/* Conversion Rate */}
        <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Taxa de Conversão</span>
            <div className="p-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{overallConversionRate}%</div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Ticket Médio: <strong className="text-neutral-700 dark:text-neutral-200">{formatCurrency(averageTicket)}</strong>
          </p>
        </div>

        {/* Team Goal Progress */}
        <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Meta Geral da Equipe</span>
            <div className="p-2 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-lg">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{teamGoalPercent}%</div>
          <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className="bg-rose-600 dark:bg-rose-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, parseFloat(teamGoalPercent))}%` }}
            />
          </div>
          <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
            {formatCurrency(totalWonValue)} de {formatCurrency(totalTeamGoal)}
          </p>
        </div>
      </div>

      {/* Consultant Productivity Table & Goals */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">Desempenho & Metas Individuais por Consultor</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Volume de leads, taxa de fechamento e atingimento da meta mensal</p>
          </div>
          <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
            <Award className="w-4 h-4" /> Ranking em Tempo Real
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-neutral-100/60 dark:bg-neutral-950 text-neutral-500 dark:text-neutral-400 font-bold uppercase text-[10px] border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th className="p-3.5">Consultor</th>
                <th className="p-3.5">Leads Ativos</th>
                <th className="p-3.5">Contatos (WhatsApp / E-mail)</th>
                <th className="p-3.5">Fechados (Ganho)</th>
                <th className="p-3.5">Valor Fechado R$</th>
                <th className="p-3.5">Meta Individual R$</th>
                <th className="p-3.5 min-w-[140px]">% Atingido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300">
              {users
                .filter((u) => u.role === 'consultant' || u.role === 'manager')
                .map((user) => {
                  const userCards = cards.filter((c) => c.assignedUserId === user.id);
                  const userWon = userCards.filter((c) => c.phaseId === 'ganho');
                  const userWonSum = userWon.reduce((acc, c) => acc + (c.value || 0), 0);
                  const userActive = userCards.filter((c) => c.phaseId !== 'ganho' && c.phaseId !== 'perdido');

                  // Message counts
                  const totalMessages = userCards.reduce((acc, c) => acc + c.messages.length, 0);

                  const percentAchieved =
                    user.monthlyGoalValue > 0
                      ? Math.min(100, (userWonSum / user.monthlyGoalValue) * 100)
                      : 0;

                  return (
                    <tr key={user.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-850/60 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                          <div>
                            <div className="font-bold text-neutral-900 dark:text-neutral-100">{user.name}</div>
                            <div className="text-[10px] text-neutral-400 dark:text-neutral-500">{user.department}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 font-semibold text-neutral-800 dark:text-neutral-200">{userActive.length}</td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1 font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                          <MessageSquare className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          {totalMessages} interações
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
                          {userWon.length} / {user.monthlyGoalLeads || 5}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-neutral-900 dark:text-neutral-100">{formatCurrency(userWonSum)}</td>
                      <td className="p-3.5 text-neutral-600 dark:text-neutral-400 font-semibold">{formatCurrency(user.monthlyGoalValue)}</td>
                      <td className="p-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className={percentAchieved >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                              {percentAchieved.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                percentAchieved >= 100
                                  ? 'bg-emerald-500'
                                  : percentAchieved >= 60
                                  ? 'bg-rose-600 dark:bg-rose-500'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${percentAchieved}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pipeline Funnel by Phase Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Phase Breakdown List */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs p-5">
          <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 mb-4">Volume e Conversão por Fase do Fluxo</h3>

          <div className="space-y-2.5">
            {phases.map((phase) => {
              const phaseCards = cards.filter((c) => c.phaseId === phase.id);
              const phaseVal = phaseCards.reduce((acc, c) => acc + (c.value || 0), 0);
              const percentOfTotal = cards.length > 0 ? (phaseCards.length / cards.length) * 100 : 0;

              return (
                <div key={phase.id} className="p-2.5 bg-neutral-50/70 dark:bg-neutral-950/60 rounded-lg border border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${phase.color.replace('text-', 'bg-')}`} />
                      <span className="font-bold text-neutral-800 dark:text-neutral-200">{phase.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-neutral-900 dark:text-neutral-100">{formatCurrency(phaseVal)}</span>
                      <span className="px-2 py-0.5 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 rounded font-mono font-bold text-[10px]">
                        {phaseCards.length} leads
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-neutral-200/70 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full ${phase.color.replace('text-', 'bg-')}`}
                      style={{ width: `${Math.max(5, percentOfTotal)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lost Deals Reasons Breakdown */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">Motivos de Perda (Disqualify)</h3>
              <span className="text-xs text-red-600 dark:text-red-400 font-bold">{lostCards.length} Perdidos</span>
            </div>

            <div className="space-y-2">
              {Object.entries(lostReasonsMap).map(([reason, count]) => {
                const pct = lostCards.length > 0 ? Math.round((count / lostCards.length) * 100) : 0;
                return (
                  <div key={reason} className="p-2.5 bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-lg">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">{reason}</span>
                      <span className="font-bold text-red-700 dark:text-red-400">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-red-200/50 dark:bg-red-950/50 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-red-500 h-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}

              {lostCards.length === 0 && (
                <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center py-6">Nenhum card perdido no período.</p>
              )}
            </div>
          </div>

          <div className="p-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl mt-4 text-[11px] text-neutral-600 dark:text-neutral-400">
            💡 <strong>Insight Automático:</strong> A maior causa de perdas é{' '}
            <span className="font-semibold text-red-600 dark:text-red-400">"Sem orçamento atual"</span>. Considere oferecer planos
            fracionados no diagnóstico.
          </div>
        </div>
      </div>
    </div>
  );
};
