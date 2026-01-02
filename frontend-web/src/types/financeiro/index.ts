/**
 * Tipos para o módulo financeiro do Conect CRM
 * Inspirado nos melhores ERPs do mercado (Omie, Conta Azul, Nibo)
 */

// Enums para status e categorias
export enum StatusContaPagar {
  EM_ABERTO = 'em_aberto',
  PAGO = 'pago',
  VENCIDO = 'vencido',
  AGENDADO = 'agendado',
  CANCELADO = 'cancelado',
}

export enum FormaPagamento {
  PIX = 'pix',
  BOLETO = 'boleto',
  TRANSFERENCIA = 'transferencia',
  CARTAO_CREDITO = 'cartao_credito',
  CARTAO_DEBITO = 'cartao_debito',
  DINHEIRO = 'dinheiro',
  CHEQUE = 'cheque',
}

export enum CategoriaContaPagar {
  FORNECEDORES = 'fornecedores',
  SALARIOS = 'salarios',
  IMPOSTOS = 'impostos',
  UTILIDADES = 'utilidades',
  MARKETING = 'marketing',
  TECNOLOGIA = 'tecnologia',
  ESCRITORIO = 'escritorio',
  JURIDICO = 'juridico',
  CONTABILIDADE = 'contabilidade',
  VIAGEM = 'viagem',
  OUTROS = 'outros',
}

export enum PrioridadePagamento {
  BAIXA = 'baixa',
  MEDIA = 'media',
  ALTA = 'alta',
  URGENTE = 'urgente',
}

export interface Fornecedor {
  id: string;
  nome: string;
  cnpjCpf: string;
  email?: string;
  telefone?: string;
  endereco?: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
  };
  dadosBancarios?: {
    banco: string;
    agencia: string;
    conta: string;
    tipoConta: 'corrente' | 'poupanca';
    chavePix?: string;
  };
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface ContaPagar {
  id: string;
  numero: string;
  fornecedorId: string;
  fornecedor: Fornecedor;
  descricao: string;
  numeroDocumento?: string; // Número da nota fiscal, fatura, etc.

  // Datas
  dataEmissao: string;
  dataVencimento: string;
  dataPagamento?: string;
  dataAgendamento?: string;

  // Valores
  valorOriginal: number;
  valorDesconto: number;
  valorMulta: number;
  valorJuros: number;
  valorTotal: number;
  valorPago: number;
  valorRestante: number;

  // Status e categoria
  status: StatusContaPagar;
  categoria: CategoriaContaPagar;
  prioridade: PrioridadePagamento;

  // Pagamento
  tipoPagamento?: FormaPagamento;
  contaBancariaId?: string;
  contaBancaria?: ContaBancaria;
  comprovantePagamento?: string;

  // Recorrência
  recorrente: boolean;
  frequenciaRecorrencia?: 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual';
  proximoVencimento?: string;

  // Aprovação
  necessitaAprovacao: boolean;
  aprovadoPor?: string;
  dataAprovacao?: string;

  // Anexos e observações
  anexos: Anexo[];
  observacoes?: string;
  observacoesInternas?: string;

  // Auditoria
  criadoPor: string;
  criadoEm: string;
  atualizadoPor?: string;
  atualizadoEm: string;

  // Tags personalizadas
  tags: string[];
}

export interface ContaBancaria {
  id: string;
  nome: string;
  banco: string;
  agencia: string;
  conta: string;
  tipoConta: 'corrente' | 'poupanca';
  saldo: number;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface Anexo {
  id: string;
  nome: string;
  tipo: string;
  tamanho: number;
  url: string;
  criadoEm: string;
}

export interface CentroCusto {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  pai?: string; // ID do centro de custo pai (hierarquia)
  criadoEm: string;
  atualizadoEm: string;
}

// Interfaces para filtros e buscas
export interface FiltrosContasPagar {
  dataInicio?: string;
  dataFim?: string;
  status?: StatusContaPagar[];
  categoria?: CategoriaContaPagar[];
  fornecedorId?: string;
  formaPagamento?: FormaPagamento[];
  contaBancariaId?: string;
  centroCustoId?: string;
  prioridade?: PrioridadePagamento[];
  valorMinimo?: number;
  valorMaximo?: number;
  termo?: string; // Busca por texto livre
}

export interface ResumoFinanceiro {
  totalVencendoHoje: number;
  quantidadeVencendoHoje: number;
  totalMes: number;
  quantidadeMes: number;
  totalAtrasado: number;
  quantidadeAtrasado: number;
  totalPagoMes: number;
  quantidadePagoMes: number;
  proximosVencimentos: ContaPagar[];
}

// Interfaces para formulários
export interface NovaContaPagar {
  fornecedorId: string;
  descricao: string;
  numeroDocumento?: string;
  dataEmissao: string;
  dataVencimento: string;
  valorOriginal: number;
  valorDesconto?: number;
  categoria: CategoriaContaPagar;
  centroCustoId?: string;
  tipoPagamento?: FormaPagamento;
  contaBancariaId?: string;
  observacoes?: string;
  anexos?: File[];
  tags?: string[];
  recorrente?: boolean;
  frequenciaRecorrencia?: 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual';
  numeroParcelas?: number;
  prioridade?: PrioridadePagamento;
}

export interface AtualizarContaPagar extends Partial<NovaContaPagar> {
  id: string;
}

export interface RegistrarPagamento {
  contaId: string;
  valorPago: number;
  dataPagamento: string;
  tipoPagamento: FormaPagamento;
  contaBancariaId?: string;
  comprovante?: File;
  observacoes?: string;
}

// Interface para ações em massa
export interface AcaoMassa {
  contasIds: string[];
  acao: 'marcar_pago' | 'excluir' | 'alterar_status' | 'alterar_categoria';
  parametros?: {
    status?: StatusContaPagar;
    categoria?: CategoriaContaPagar;
    dataPagamento?: string;
    valorPago?: number;
    tipoPagamento?: FormaPagamento;
    contaBancariaId?: string;
  };
}

// Labels para exibição
export const STATUS_LABELS = {
  [StatusContaPagar.EM_ABERTO]: 'Em Aberto',
  [StatusContaPagar.PAGO]: 'Pago',
  [StatusContaPagar.VENCIDO]: 'Vencido',
  [StatusContaPagar.AGENDADO]: 'Agendado',
  [StatusContaPagar.CANCELADO]: 'Cancelado',
};

export const FORMA_PAGAMENTO_LABELS = {
  [FormaPagamento.PIX]: 'PIX',
  [FormaPagamento.BOLETO]: 'Boleto',
  [FormaPagamento.TRANSFERENCIA]: 'Transferência',
  [FormaPagamento.CARTAO_CREDITO]: 'Cartão de Crédito',
  [FormaPagamento.CARTAO_DEBITO]: 'Cartão de Débito',
  [FormaPagamento.DINHEIRO]: 'Dinheiro',
  [FormaPagamento.CHEQUE]: 'Cheque',
};

export const CATEGORIA_LABELS = {
  [CategoriaContaPagar.FORNECEDORES]: 'Fornecedores',
  [CategoriaContaPagar.SALARIOS]: 'Salários',
  [CategoriaContaPagar.IMPOSTOS]: 'Impostos',
  [CategoriaContaPagar.UTILIDADES]: 'Utilidades',
  [CategoriaContaPagar.MARKETING]: 'Marketing',
  [CategoriaContaPagar.TECNOLOGIA]: 'Tecnologia',
  [CategoriaContaPagar.ESCRITORIO]: 'Escritório',
  [CategoriaContaPagar.JURIDICO]: 'Jurídico',
  [CategoriaContaPagar.CONTABILIDADE]: 'Contabilidade',
  [CategoriaContaPagar.VIAGEM]: 'Viagem',
  [CategoriaContaPagar.OUTROS]: 'Outros',
};

export const PRIORIDADE_LABELS = {
  [PrioridadePagamento.BAIXA]: 'Baixa',
  [PrioridadePagamento.MEDIA]: 'Média',
  [PrioridadePagamento.ALTA]: 'Alta',
  [PrioridadePagamento.URGENTE]: 'Urgente',
};
