import { ModuloEnum } from '../services/modulosService';

/**
 * Configuração centralizada de informações dos módulos para licenciamento
 * Usado pelo RouteGuard para exibir informações corretas na tela de bloqueio
 */

export interface ModuloInfo {
  id: ModuloEnum;
  nome: string;
  descricao: string;
  preco: string;
  recursos: string[];
}

export const MODULOS_INFO: Record<ModuloEnum, ModuloInfo> = {
  [ModuloEnum.ATENDIMENTO]: {
    id: ModuloEnum.ATENDIMENTO,
    nome: 'Atendimento',
    descricao:
      'Gestão completa de atendimento ao cliente com chat, tickets, triagem automática, equipes, fluxos conversacionais e integração WhatsApp.',
    preco: 'R$ 199',
    recursos: [
      'Chat em tempo real com clientes',
      'Sistema de tickets e gestão de chamados',
      'Triagem automática com IA',
      'Gestão de equipes e departamentos',
      'Fluxos conversacionais personalizados',
      'Integração WhatsApp Business',
      'Histórico completo de atendimentos',
      'Relatórios e métricas de performance',
    ],
  },

  [ModuloEnum.CRM]: {
    id: ModuloEnum.CRM,
    nome: 'CRM',
    descricao:
      'Gestão completa de relacionamento com clientes. Base de dados centralizada, histórico de interações, segmentação e análise de comportamento.',
    preco: 'R$ 299',
    recursos: [
      'Base de clientes ilimitada',
      'Gestão de contatos e empresas',
      'Histórico completo de interações',
      'Segmentação avançada de clientes',
      'Tags e categorização',
      'Pipeline de relacionamento',
      'Análise de comportamento',
      'Integração com outros módulos',
    ],
  },

  [ModuloEnum.VENDAS]: {
    id: ModuloEnum.VENDAS,
    nome: 'Vendas',
    descricao:
      'Gestão completa do ciclo de vendas. Propostas, cotações, produtos, combos, funil de vendas e acompanhamento de oportunidades.',
    preco: 'R$ 349',
    recursos: [
      'Gestão de propostas comerciais',
      'Sistema de cotações',
      'Catálogo de produtos e serviços',
      'Criação de combos e pacotes',
      'Funil de vendas visual',
      'Acompanhamento de oportunidades',
      'Previsão de receita',
      'Relatórios de performance de vendas',
    ],
  },

  [ModuloEnum.FINANCEIRO]: {
    id: ModuloEnum.FINANCEIRO,
    nome: 'Financeiro',
    descricao:
      'Controle financeiro completo. Contas a pagar e receber, fluxo de caixa, gestão de fornecedores e relatórios financeiros.',
    preco: 'R$ 249',
    recursos: [
      'Contas a pagar e receber',
      'Fluxo de caixa em tempo real',
      'Gestão de fornecedores',
      'Controle de inadimplência',
      'Conciliação bancária',
      'Relatórios financeiros',
      'Previsão de caixa',
      'Alertas de vencimento',
    ],
  },

  [ModuloEnum.BILLING]: {
    id: ModuloEnum.BILLING,
    nome: 'Billing',
    descricao:
      'Gestão de assinaturas e pagamentos recorrentes. Planos, faturas automáticas, controle de cobranças e integração com gateways de pagamento.',
    preco: 'R$ 199',
    recursos: [
      'Gestão de assinaturas',
      'Planos e preços flexíveis',
      'Faturas automáticas',
      'Pagamentos recorrentes',
      'Integração com gateways',
      'Controle de inadimplência',
      'Relatórios de MRR/ARR',
      'Gestão de upgrades/downgrades',
    ],
  },

  [ModuloEnum.ADMINISTRACAO]: {
    id: ModuloEnum.ADMINISTRACAO,
    nome: 'Administração',
    descricao:
      'Módulo de gestão empresarial multi-tenant. Controle de empresas, usuários, permissões avançadas e auditoria completa. Exclusivo para plano Enterprise.',
    preco: 'R$ 999',
    recursos: [
      'Gestão multi-tenant',
      'Controle de múltiplas empresas',
      'Gestão centralizada de usuários',
      'Permissões avançadas por empresa',
      'Auditoria completa de ações',
      'Dashboard administrativo',
      'Relatórios consolidados',
      'Suporte prioritário',
    ],
  },
};

/**
 * Helper para obter informações de um módulo
 */
export const getModuloInfo = (modulo: ModuloEnum): ModuloInfo => {
  return MODULOS_INFO[modulo];
};

/**
 * Helper para verificar se módulo é Enterprise-only
 */
export const isModuloEnterpriseOnly = (modulo: ModuloEnum): boolean => {
  return modulo === ModuloEnum.ADMINISTRACAO;
};
