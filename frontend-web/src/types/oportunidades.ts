export type EstagioOportunidade = 
  | 'prospeccao'
  | 'qualificacao'
  | 'proposta'
  | 'negociacao'
  | 'fechamento'
  | 'perdida'
  | 'ganha';

export type PrioridadeOportunidade = 
  | 'baixa'
  | 'media'
  | 'alta'
  | 'urgente';

export type OrigemOportunidade = 
  | 'site'
  | 'telefone'
  | 'email'
  | 'redes-sociais'
  | 'indicacao'
  | 'evento'
  | 'parceiro'
  | 'outros';

export interface Oportunidade {
  id: number; // Backend retorna número
  titulo: string;
  descricao?: string;
  valor: string; // Backend retorna como string (decimal)
  probabilidade: number;
  estagio: EstagioOportunidade;
  prioridade: PrioridadeOportunidade;
  origem: OrigemOportunidade;
  tags?: string[] | null;
  dataFechamentoEsperado?: string;
  dataFechamentoReal?: string;
  responsavel_id: string;
  cliente_id?: number | null;
  nomeContato?: string;
  emailContato?: string;
  telefoneContato?: string;
  empresaContato?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relacionamentos carregados
  responsavel?: {
    id: string;
    nome: string;
    email: string;
    avatar_url?: string;
  };
  cliente?: {
    id: number;
    nome: string;
    email?: string;
    telefone?: string;
    empresa?: string;
  } | null;
  atividades?: any[];
}

export interface NovaOportunidade {
  titulo: string;
  descricao: string;
  valor: number;
  clienteNome: string;
  clienteEmail: string;
  clienteTelefone: string;
  clienteEmpresa: string;
  estagio: EstagioOportunidade;
  prioridade: PrioridadeOportunidade;
  dataFechamentoPrevista: string;
  responsavel: string;
  observacoes: string;
}

export interface FiltroOportunidades {
  estagio?: EstagioOportunidade;
  prioridade?: PrioridadeOportunidade;
  responsavel?: string;
  dataInicio?: string;
  dataFim?: string;
  valorMinimo?: number;
  valorMaximo?: number;
  termo?: string;
}

// Alias para compatibilidade
export interface FiltrosOportunidade extends FiltroOportunidades {}

export interface AtualizarOportunidade {
  id: string;
  titulo?: string;
  descricao?: string;
  valor?: number;
  clienteNome?: string;
  clienteEmail?: string;
  clienteTelefone?: string;
  clienteEmpresa?: string;
  estagio?: EstagioOportunidade;
  prioridade?: PrioridadeOportunidade;
  dataFechamentoPrevista?: string;
  responsavel?: string;
  observacoes?: string;
}

export interface DadosKanban {
  [key: string]: Oportunidade[];
}

export interface EstatisticasOportunidades {
  total: number;
  totalValor: number;
  porEstagio: Record<EstagioOportunidade, number>;
  porPrioridade: Record<PrioridadeOportunidade, number>;
  taxaConversao: number;
  valorMedio: number;
}

export interface Atividade {
  id: string;
  oportunidadeId: string;
  tipo: string;
  titulo: string;
  descricao: string;
  dataHora: string;
  responsavel: string;
  concluida: boolean;
}

export interface NovaAtividade {
  oportunidadeId: string;
  tipo: string;
  titulo: string;
  descricao: string;
  dataHora: string;
  responsavel: string;
}
