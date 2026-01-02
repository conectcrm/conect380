// Importar e re-exportar enums do arquivo enums.ts
import {
  EstagioOportunidade,
  PrioridadeOportunidade,
  OrigemOportunidade,
  TipoAtividade,
  MotivoPerda,
} from './enums';
export {
  EstagioOportunidade,
  PrioridadeOportunidade,
  OrigemOportunidade,
  TipoAtividade,
  MotivoPerda,
};

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
    id: string;
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

  // Novos campos: Motivo de Perda, SLA e Auto-Probability
  motivoPerda?: MotivoPerda;
  motivoPerdaDetalhes?: string;
  concorrenteNome?: string;
  dataRevisao?: Date | string;
  dataUltimaMudancaEstagio?: Date | string;
  diasNoEstagioAtual?: number;
  precisaAtencao?: boolean;
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
  tags?: string[]; // ✅ Opcional - não enviar array vazio
  dataFechamentoEsperado?: Date | string | null;
  responsavel_id: string; // ✅ Corrigido - alinhado com backend (snake_case)
  cliente_id?: string; // ✅ Corrigido - alinhado com backend (snake_case)
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
