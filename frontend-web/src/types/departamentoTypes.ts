export interface HorarioFuncionamento {
  seg?: { inicio: string; fim: string };
  ter?: { inicio: string; fim: string };
  qua?: { inicio: string; fim: string };
  qui?: { inicio: string; fim: string };
  sex?: { inicio: string; fim: string };
  sab?: { inicio: string; fim: string };
  dom?: { inicio: string; fim: string };
}

export type TipoDistribuicao = 'round_robin' | 'load_balancing' | 'skill_based' | 'manual';

export interface Departamento {
  id: string;
  empresaId: string;
  nucleoId: string;

  // Identificação
  nome: string;
  descricao?: string;
  codigo?: string;
  cor: string;
  icone: string;

  // Status
  ativo: boolean;
  visivelNoBot: boolean;
  ordem: number;

  // Equipe
  atendentesIds: string[];
  supervisorId?: string;
  supervisor?: {
    id: string;
    nome: string;
    email: string;
  };

  // Horário (opcional - herda do núcleo se null)
  horarioFuncionamento?: HorarioFuncionamento;

  // SLA (opcional - herda do núcleo se null)
  slaRespostaMinutos?: number;
  slaResolucaoHoras?: number;

  // Mensagens Personalizadas
  mensagemBoasVindas?: string;
  mensagemTransferencia?: string;

  // Roteamento
  tipoDistribuicao: TipoDistribuicao;
  capacidadeMaximaTickets: number;

  // Skills para roteamento inteligente
  skills?: string[];

  // Relação com núcleo
  nucleo?: {
    id: string;
    nome: string;
    cor: string;
    icone: string;
  };

  // Auditoria
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface CreateDepartamentoDto {
  nucleoId: string;
  nome: string;
  descricao?: string;
  codigo?: string;
  cor?: string;
  icone?: string;
  ativo?: boolean;
  visivelNoBot?: boolean;
  ordem?: number;
  atendentesIds?: string[];
  supervisorId?: string;
  horarioFuncionamento?: HorarioFuncionamento;
  slaRespostaMinutos?: number;
  slaResolucaoHoras?: number;
  mensagemBoasVindas?: string;
  mensagemTransferencia?: string;
  tipoDistribuicao?: TipoDistribuicao;
  capacidadeMaximaTickets?: number;
  skills?: string[];
}

export interface UpdateDepartamentoDto {
  nucleoId?: string;
  nome?: string;
  descricao?: string;
  codigo?: string;
  cor?: string;
  icone?: string;
  ativo?: boolean;
  visivelNoBot?: boolean;
  ordem?: number;
  atendentesIds?: string[];
  supervisorId?: string;
  horarioFuncionamento?: HorarioFuncionamento;
  slaRespostaMinutos?: number;
  slaResolucaoHoras?: number;
  mensagemBoasVindas?: string;
  mensagemTransferencia?: string;
  tipoDistribuicao?: TipoDistribuicao;
  capacidadeMaximaTickets?: number;
  skills?: string[];
}

export interface FilterDepartamentoDto {
  nucleoId?: string;
  ativo?: boolean;
  nome?: string;
  busca?: string;
  tipoDistribuicao?: TipoDistribuicao;
  supervisorId?: string;
}

export interface EstatisticasDepartamento {
  id: string;
  nome: string;
  totalAtendentes: number;
  ativo: boolean;
  capacidadeMaxima: number;
  tipoDistribuicao: TipoDistribuicao;
  slaResposta?: number;
  slaResolucao?: number;
  // Métricas futuras:
  ticketsAbertos?: number;
  ticketsResolvidos?: number;
  tempoMedioResposta?: number;
  tempoMedioResolucao?: number;
  taxaSatisfacao?: number;
}

// Constantes
export const TIPOS_DISTRIBUICAO = [
  {
    value: 'round_robin',
    label: 'Round Robin',
    description: 'Distribuição circular entre atendentes',
  },
  {
    value: 'load_balancing',
    label: 'Balanceamento de Carga',
    description: 'Prioriza atendentes com menos tickets',
  },
  {
    value: 'skill_based',
    label: 'Baseado em Skills',
    description: 'Distribui baseado nas competências',
  },
  { value: 'manual', label: 'Manual', description: 'Supervisor atribui manualmente' },
] as const;

export const ICONES_DEPARTAMENTO = [
  'briefcase',
  'headset',
  'phone',
  'users',
  'shoppingCart',
  'package',
  'creditCard',
  'dollarSign',
  'tool',
  'settings',
  'zap',
  'trendingUp',
  'target',
  'award',
  'shield',
  'heart',
  'star',
  'flag',
] as const;

export const CORES_DEPARTAMENTO = [
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#10B981', // Green
  '#3B82F6', // Blue
  '#06B6D4', // Cyan
  '#6B7280', // Gray
  '#F97316', // Orange
] as const;
