export interface Oportunidade {
  id: number;
  titulo: string;
  descricao?: string;
  valor: number;
  probabilidade: number;
  estagio: EstagioOportunidade;
  prioridade: PrioridadeOportunidade;
  origem: OrigemOportunidade;
  tags: string[];
  dataFechamentoEsperado?: Date | string | null;
  dataFechamentoReal?: Date | string | null;

  // Responsável
  responsavel: {
    id: string;
    nome: string;
    email: string;
    avatar?: string;
  };

  // Cliente (opcional)
  cliente?: {
    id: number;
    nome: string;
    email?: string;
    telefone?: string;
    empresa?: string;
  };

  // Informações de contato direto (quando não há cliente)
  nomeContato?: string;
  emailContato?: string;
  telefoneContato?: string;
  empresaContato?: string;
  observacoes?: string;
  criadoEm?: Date | string;
  atualizadoEm?: Date | string;

  // Atividades
  atividades: Atividade[];

  // Metadados
  createdAt: Date;
  updatedAt: Date;

  // Campos calculados
  valorFormatado: string;
  diasNoEstagio: number;
  ultimaAtividade?: Date;
  tempoNoEstagio: string;
  probabilidadeVisual: 'baixa' | 'media' | 'alta';
}

export enum EstagioOportunidade {
  LEADS = 'leads',
  QUALIFICACAO = 'qualification',
  PROPOSTA = 'proposal',
  NEGOCIACAO = 'negotiation',
  FECHAMENTO = 'closing',
  GANHO = 'won',
  PERDIDO = 'lost'
}

export enum PrioridadeOportunidade {
  BAIXA = 'low',
  MEDIA = 'medium',
  ALTA = 'high'
}

export enum OrigemOportunidade {
  WEBSITE = 'website',
  INDICACAO = 'indicacao',
  TELEFONE = 'telefone',
  EMAIL = 'email',
  REDES_SOCIAIS = 'redes_sociais',
  EVENTO = 'evento',
  PARCEIRO = 'parceiro',
  CAMPANHA = 'campanha'
}

export interface Atividade {
  id: number;
  tipo: TipoAtividade;
  descricao: string;
  dataAtividade: Date;
  oportunidadeId: number;
  criadoPor: {
    id: string;
    nome: string;
    avatar?: string;
  };
  createdAt: Date;
}

export enum TipoAtividade {
  LIGACAO = 'call',
  EMAIL = 'email',
  REUNIAO = 'meeting',
  NOTA = 'note',
  TAREFA = 'task'
}

export interface FiltrosOportunidade {
  busca: string;
  estagio: EstagioOportunidade | '';
  prioridade: PrioridadeOportunidade | '';
  origem: OrigemOportunidade | '';
  responsavel: string;
  valorMin: number;
  valorMax: number;
  dataInicio?: Date;
  dataFim?: Date;
  tags: string[];
  ordenacao: 'titulo' | 'valor' | 'probabilidade' | 'createdAt' | 'updatedAt';
  direcao: 'asc' | 'desc';
}

export interface EstatisticasOportunidades {
  totalOportunidades: number;
  valorTotalPipeline: number;
  valorGanho: number;
  taxaConversao: number;
  valorMedio: number;
  distribuicaoPorEstagio: Record<string, { quantidade: number; valor: number }>;
}

export interface NovaOportunidade {
  titulo: string;
  descricao?: string;
  valor: number;
  probabilidade: number;
  estagio: EstagioOportunidade;
  prioridade: PrioridadeOportunidade;
  origem: OrigemOportunidade;
  tags: string[];
  dataFechamentoEsperado?: Date | string | null;
  responsavelId: string;
  clienteId?: string; // Alterado de number para string (UUID)
  nomeContato?: string;
  emailContato?: string;
  telefoneContato?: string;
  empresaContato?: string;
  observacoes?: string;
}

export interface AtualizarOportunidade extends Partial<NovaOportunidade> {
  id: number;
}

export interface NovaAtividade {
  tipo: TipoAtividade;
  descricao: string;
  dataAtividade?: Date;
  oportunidadeId: number;
}

// Configurações do Pipeline
export interface ConfiguracaoPipeline {
  estagios: EstagioConfig[];
  cores: Record<EstagioOportunidade, string>;
  automacoes: AutomacaoPipeline[];
}

export interface EstagioConfig {
  estagio: EstagioOportunidade;
  nome: string;
  descricao: string;
  cor: string;
  ordem: number;
  probabilidadePadrao: number;
  tempoMedioEstagio: number;
  ativo: boolean;
}

export interface AutomacaoPipeline {
  id: string;
  nome: string;
  gatilho: 'mudanca_estagio' | 'tempo_estagio' | 'valor_atingido';
  condicoes: any[];
  acoes: any[];
  ativo: boolean;
}

// Views e relatórios
export type VisualizacaoOportunidades = 'kanban' | 'lista' | 'calendario' | 'grafico';

export interface DadosKanban {
  estagios: EstagioKanban[];
  totalValor: number;
  totalOportunidades: number;
}

export interface EstagioKanban {
  estagio: EstagioOportunidade;
  nome: string;
  cor: string;
  oportunidades: Oportunidade[];
  valor: number;
  quantidade: number;
}
