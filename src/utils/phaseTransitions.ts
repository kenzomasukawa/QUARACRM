import { PhaseId, CRMCard, PhaseFieldDefinition } from '../types/crm';

export interface TransitionRuleCheck {
  allowed: boolean;
  reason?: string;
  allowedDestinations?: PhaseId[];
}

export interface TransitionFieldConfig {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'currency' | 'date' | 'select';
  required: boolean;
  options?: string[];
  placeholder?: string;
  helpText?: string;
  defaultValue?: any;
}

// Allowed destination matrix based on user's exact specification
export const ALLOWED_TRANSITIONS: Record<PhaseId, PhaseId[]> = {
  mapeados: ['prospeccao', 'perdido'],
  prospeccao: ['diagnostica', 'followup_1', 'followup_2', 'followup_3', 'followup_4', 'followup_5', 'perdido'],
  diagnostica: ['prospeccao', 'proposta', 'perdido', 'followup_1', 'followup_2', 'followup_3', 'followup_4', 'followup_5'],
  proposta: ['negociacao', 'perdido', 'followup_1', 'followup_2', 'followup_3', 'followup_4', 'followup_5'],
  negociacao: ['ganho', 'perdido', 'proposta', 'followup_1', 'followup_2', 'followup_3', 'followup_4', 'followup_5'],
  followup_1: ['followup_2', 'followup_3', 'followup_4', 'followup_5', 'diagnostica', 'negociacao', 'perdido'],
  followup_2: ['followup_1', 'followup_3', 'followup_4', 'followup_5', 'diagnostica', 'negociacao', 'perdido'],
  followup_3: ['followup_1', 'followup_2', 'followup_4', 'followup_5', 'diagnostica', 'negociacao', 'perdido'],
  followup_4: ['followup_1', 'followup_2', 'followup_3', 'followup_5', 'diagnostica', 'negociacao', 'perdido'],
  followup_5: ['followup_1', 'followup_2', 'followup_3', 'followup_4', 'diagnostica', 'negociacao', 'perdido'],
  ganho: ['negociacao', 'perdido'],
  perdido: ['mapeados', 'prospeccao', 'diagnostica', 'proposta', 'negociacao'],
};

export const isFollowupPhase = (phaseId: PhaseId): boolean => {
  return (
    phaseId === 'followup_1' ||
    phaseId === 'followup_2' ||
    phaseId === 'followup_3' ||
    phaseId === 'followup_4' ||
    phaseId === 'followup_5'
  );
};

export const checkTransitionAllowed = (fromPhase: PhaseId, toPhase: PhaseId): TransitionRuleCheck => {
  if (fromPhase === toPhase) {
    return { allowed: true };
  }

  const allowedList = ALLOWED_TRANSITIONS[fromPhase] || [];
  if (allowedList.includes(toPhase)) {
    return { allowed: true, allowedDestinations: allowedList };
  }

  // Generate clear descriptive reason
  let reason = `Não é permitido mover diretamente desta fase para a fase de destino.`;
  if (fromPhase === 'mapeados') {
    reason = `De Mapeados, os cards só podem avançar para "2. Prospecção" ou ir para "12. Perdido".`;
  } else if (fromPhase === 'prospeccao') {
    reason = `De Prospecção, os destinos permitidos são "3. Diagnóstica", Follow-ups (1 a 5) ou "12. Perdido".`;
  } else if (fromPhase === 'diagnostica') {
    reason = `De Diagnóstica, os destinos permitidos são "2. Prospecção (retornar)", "4. Proposta" ou "12. Perdido".`;
  } else if (fromPhase === 'proposta') {
    reason = `De Proposta, os destinos permitidos são "5. Negociação" ou "12. Perdido".`;
  } else if (isFollowupPhase(fromPhase)) {
    reason = `Dos Follow-ups, os destinos permitidos são entre os próprios Follow-ups, "3. Diagnóstica", "5. Negociação" ou "12. Perdido".`;
  }

  return {
    allowed: false,
    reason,
    allowedDestinations: allowedList,
  };
};

export const getTransitionRequiredFields = (
  fromPhase: PhaseId,
  toPhase: PhaseId,
  card?: CRMCard
): TransitionFieldConfig[] => {
  const today = new Date().toISOString().slice(0, 10);
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  // 1. Mapeado -> Prospecção
  if (toPhase === 'prospeccao' && fromPhase === 'mapeados') {
    return [
      {
        id: 'dataProspeccao',
        label: 'Data da Prospecção / Contato',
        type: 'date',
        required: true,
        defaultValue: card?.customFields?.dataProspeccao || card?.customFields?.dataMapeamento || today,
        helpText: 'Data em que a abordagem de prospecção foi/será realizada',
      },
      {
        id: 'canalIndicacao',
        label: 'Canal de Indicação / Origem',
        type: 'select',
        required: true,
        options: ['Passivo', 'Ativo Apollo', 'Indicação'],
        defaultValue: card?.customFields?.canalIndicacao || 'Ativo Apollo',
        helpText: 'Origem do lead: Passivo, Ativo Apollo ou Indicação',
      },
    ];
  }

  // 2. Prospecção -> Diagnóstica (or any transition to Diagnóstica)
  if (toPhase === 'diagnostica') {
    return [
      {
        id: 'tamanhoEmpresa',
        label: 'Tamanho da Empresa',
        type: 'select',
        required: true,
        options: ['Pequena', 'Média', 'Grande'],
        defaultValue: card?.customFields?.tamanhoEmpresa || 'Média',
        helpText: 'Porte qualificado da empresa para alinhamento do escopo',
      },
      {
        id: 'dataProximaAtividade',
        label: 'Data da Próxima Atividade / Reunião',
        type: 'date',
        required: true,
        defaultValue: card?.customFields?.dataProximaAtividade || card?.customFields?.dataReuniaoDiagnostico || today,
        helpText: 'Data agendada para a reunião diagnóstica ou próximo passo',
      },
    ];
  }

  // 3. Diagnóstica -> Proposta (or any transition to Proposta)
  if (toPhase === 'proposta') {
    return [
      {
        id: 'necessidadeCliente',
        label: 'Necessidade do Cliente',
        type: 'textarea',
        required: true,
        defaultValue: card?.customFields?.necessidadeCliente || card?.customFields?.doresIdentificadas || '',
        placeholder: 'Descreva detalhadamente a dor, o desafio ou a necessidade levantada no diagnóstico...',
        helpText: 'O que o cliente precisa resolver com a nossa proposta?',
      },
    ];
  }

  // 4. Proposta -> Negociação (or any transition to Negociação)
  if (toPhase === 'negociacao') {
    return [
      {
        id: 'servicosAdquiridos',
        label: 'Quais serviços ele está adquirindo?',
        type: 'textarea',
        required: true,
        defaultValue: card?.customFields?.servicosAdquiridos || card?.customFields?.escopoResumido || '',
        placeholder: 'Ex: Consultoria Estratégica, Licenciamento Enterprise, Treinamento da Equipe...',
        helpText: 'Serviços e módulos incluídos no escopo da proposta comercial',
      },
      {
        id: 'validadeProposta',
        label: 'Validade da Proposta',
        type: 'date',
        required: true,
        defaultValue: card?.customFields?.validadeProposta || card?.customFields?.prazoValidadeProposta || nextWeek,
        helpText: 'Data limite para aceite das condições e valores apresentados',
      },
      {
        id: 'valorInicialProposta',
        label: 'Valor Inicial da Proposta (R$)',
        type: 'currency',
        required: true,
        defaultValue: card?.customFields?.valorInicialProposta || card?.customFields?.valorProposta || card?.value || 0,
        helpText: 'Valor financeiro total inicial apresentado na proposta',
      },
    ];
  }

  // 5. Follow-ups (Transição para qualquer um dos 5 follow ups)
  if (isFollowupPhase(toPhase)) {
    return [
      {
        id: 'dataProximoFollowup',
        label: 'Data do Próximo Follow-up',
        type: 'date',
        required: true,
        defaultValue: card?.customFields?.dataProximoFollowup || today,
        helpText: 'Data combinada ou estipulada para a próxima tentativa de contato',
      },
    ];
  }

  // 6. Perdido (Lost)
  if (toPhase === 'perdido') {
    return [
      {
        id: 'motivoPerda',
        label: 'Motivo da Perda',
        type: 'select',
        required: true,
        options: [
          'Preço muito alto',
          'Escolheu concorrente',
          'Sem orçamento atual',
          'Desistiu do projeto',
          'Lead sumiu (Ghosting)',
          'Fora do Perfil (ICP)',
          'Outro',
        ],
        defaultValue: card?.customFields?.motivoPerda || 'Lead sumiu (Ghosting)',
      },
      {
        id: 'detalhesPerda',
        label: 'Observações / Justificativa',
        type: 'textarea',
        required: false,
        defaultValue: card?.customFields?.detalhesPerda || '',
        placeholder: 'Detalhes adicionais sobre o encerramento da oportunidade...',
      },
    ];
  }

  // 7. Ganho (Won)
  if (toPhase === 'ganho') {
    return [
      {
        id: 'valorFechadoFinal',
        label: 'Valor Fechado Final (R$)',
        type: 'currency',
        required: true,
        defaultValue: card?.customFields?.valorFechadoFinal || card?.value || 0,
      },
      {
        id: 'dataFechamento',
        label: 'Data de Assinatura / Fechamento',
        type: 'date',
        required: true,
        defaultValue: card?.customFields?.dataFechamento || today,
      },
      {
        id: 'formaPagamentoFinal',
        label: 'Condição / Forma de Pagamento',
        type: 'text',
        required: false,
        defaultValue: card?.customFields?.formaPagamentoFinal || 'À vista via Pix / Boleto 30 dias',
      },
    ];
  }

  return [];
};
