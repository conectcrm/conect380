export type DefaultModuloSeed = {
  nome: string;
  codigo: string;
  descricao: string;
  icone?: string;
  cor?: string;
  essencial?: boolean;
  ordem: number;
};

export type DefaultPlanoSeed = {
  nome: string;
  codigo: string;
  descricao: string;
  preco: number;
  limiteUsuarios: number;
  limiteClientes: number;
  limiteStorage: number;
  limiteApiCalls: number;
  whiteLabel: boolean;
  suportePrioritario: boolean;
  ordem: number;
  modulosCodigos: string[];
};

const ONE_GB_BYTES = 1024 * 1024 * 1024;

export const DEFAULT_MODULOS_SISTEMA: DefaultModuloSeed[] = [
  {
    nome: 'CRM',
    codigo: 'CRM',
    descricao: 'Gestao de clientes, oportunidades e relacionamento comercial.',
    icone: 'Users',
    cor: '#159A9C',
    essencial: true,
    ordem: 1,
  },
  {
    nome: 'Atendimento',
    codigo: 'ATENDIMENTO',
    descricao: 'Atendimento omnichannel com filas, tickets e SLA.',
    icone: 'MessageSquare',
    cor: '#0F7B7D',
    ordem: 2,
  },
  {
    nome: 'Vendas',
    codigo: 'VENDAS',
    descricao: 'Pipeline, propostas e previsibilidade comercial.',
    icone: 'TrendingUp',
    cor: '#0B6B8A',
    ordem: 3,
  },
  {
    nome: 'Financeiro',
    codigo: 'FINANCEIRO',
    descricao: 'Faturamento, contas a pagar/receber e conciliacao.',
    icone: 'DollarSign',
    cor: '#2E7D32',
    ordem: 4,
  },
  {
    nome: 'Compras',
    codigo: 'COMPRAS',
    descricao: 'Cotacoes, orcamentos e aprovacoes de compras.',
    icone: 'Calculator',
    cor: '#C77900',
    ordem: 5,
  },
  {
    nome: 'Billing',
    codigo: 'BILLING',
    descricao: 'Assinaturas, cobrancas recorrentes e self-service.',
    icone: 'CreditCard',
    cor: '#6D4C41',
    ordem: 6,
  },
  {
    nome: 'Administracao',
    codigo: 'ADMINISTRACAO',
    descricao: 'Governanca, seguranca e administracao corporativa.',
    icone: 'ShieldCheck',
    cor: '#5E35B1',
    ordem: 7,
  },
];

export const DEFAULT_ESSENTIAL_MODULE_CODES: string[] = DEFAULT_MODULOS_SISTEMA
  .filter((modulo) => Boolean(modulo.essencial))
  .map((modulo) => modulo.codigo);

export const DEFAULT_PLANOS_SISTEMA: DefaultPlanoSeed[] = [
  {
    nome: 'Starter',
    codigo: 'starter',
    descricao: 'Ideal para pequenas empresas em fase inicial.',
    preco: 149,
    limiteUsuarios: 3,
    limiteClientes: 1000,
    limiteStorage: 5 * ONE_GB_BYTES,
    limiteApiCalls: 5000,
    whiteLabel: false,
    suportePrioritario: false,
    ordem: 1,
    modulosCodigos: ['CRM', 'ATENDIMENTO'],
  },
  {
    nome: 'Business',
    codigo: 'business',
    descricao: 'Para empresas em crescimento com operacao comercial ativa.',
    preco: 549,
    limiteUsuarios: 10,
    limiteClientes: 10000,
    limiteStorage: 50 * ONE_GB_BYTES,
    limiteApiCalls: 50000,
    whiteLabel: true,
    suportePrioritario: true,
    ordem: 2,
    modulosCodigos: ['CRM', 'ATENDIMENTO', 'VENDAS', 'COMPRAS', 'FINANCEIRO'],
  },
  {
    nome: 'Enterprise',
    codigo: 'enterprise',
    descricao: 'Para operacoes de alta escala com governanca avancada.',
    preco: 1790,
    limiteUsuarios: -1,
    limiteClientes: -1,
    limiteStorage: 500 * ONE_GB_BYTES,
    limiteApiCalls: 500000,
    whiteLabel: true,
    suportePrioritario: true,
    ordem: 3,
    modulosCodigos: [
      'CRM',
      'ATENDIMENTO',
      'VENDAS',
      'COMPRAS',
      'FINANCEIRO',
      'BILLING',
      'ADMINISTRACAO',
    ],
  },
];
