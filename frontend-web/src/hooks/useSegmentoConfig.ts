import { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Layers,
  Smartphone,
  Globe,
  Zap,
  Shield,
  Server,
  Monitor,
  Truck,
  Home,
  Briefcase,
  GraduationCap,
  Heart,
  ShoppingCart,
} from 'lucide-react';

// Tipos para configuração de segmentos
export interface CampoPersonalizado {
  id: string;
  nome: string;
  tipo:
    | 'texto'
    | 'numero'
    | 'select'
    | 'checkbox'
    | 'textarea'
    | 'multiselect'
    | 'data'
    | 'email'
    | 'url';
  obrigatorio: boolean;
  opcoes?: string[];
  valor?: any;
  placeholder?: string;
  ajuda?: string;
  validacao?: {
    min?: number;
    max?: number;
    pattern?: string;
    mensagem?: string;
  };
}

export interface ConfiguracaoModulo {
  id: string;
  nome: string;
  incluido: boolean;
  quantidade?: number;
  observacoes?: string;
}

export interface ConfiguracaoLicenca {
  id: string;
  nome: string;
  tipo: 'web' | 'mobile' | 'desktop';
  quantidade: number;
  observacoes?: string;
}

export interface TipoProdutoConfig {
  value: string;
  label: string;
  icon: React.ComponentType<any>;
  descricao: string;
  campos: CampoPersonalizado[];
  modulosDisponiveis?: string[];
  licencasDisponiveis?: string[];
  precificacaoPermitida: string[];
  categoriasPadrao?: string[];
}

export interface SegmentoConfig {
  id: string;
  nome: string;
  descricao: string;
  icone: React.ComponentType<any>;
  tiposProduto: TipoProdutoConfig[];
  categorias: Array<{ value: string; label: string; descricao?: string }>;
  camposPersonalizados: CampoPersonalizado[];
  configuracoesPadrao: {
    moeda: string;
    timezone: string;
    formato_data: string;
    idioma: string;
  };
}

// Configurações detalhadas por segmento
export const SEGMENTOS_CONFIGURACAO: Record<string, SegmentoConfig> = {
  agropecuario: {
    id: 'agropecuario',
    nome: 'Agropecuário',
    descricao: 'Sistemas para gestão de fazendas, criação de gado, agricultura e agronegócio',
    icone: Truck,
    tiposProduto: [
      {
        value: 'plano_sistema',
        label: 'Plano de Sistema Completo',
        icon: Layers,
        descricao: 'Plano com múltiplos módulos para gestão completa da propriedade rural',
        precificacaoPermitida: ['fixo', 'variavel', 'por_modulo', 'customizado'],
        campos: [
          {
            id: 'periodo_contrato',
            nome: 'Período do Contrato',
            tipo: 'select',
            obrigatorio: true,
            opcoes: ['Mensal', 'Trimestral', 'Semestral', 'Anual', 'Bienal', 'Trienal'],
            placeholder: 'Selecione o período de cobrança',
            ajuda: 'Determina a frequência de cobrança e renovação',
          },
          {
            id: 'numero_usuarios',
            nome: 'Usuários Inclusos',
            tipo: 'numero',
            obrigatorio: true,
            placeholder: 'Ex: 5',
            ajuda: 'Número de usuários que podem acessar o sistema',
            validacao: { min: 1, max: 1000 },
          },
          {
            id: 'numero_propriedades',
            nome: 'Propriedades Incluídas',
            tipo: 'numero',
            obrigatorio: true,
            placeholder: 'Ex: 1',
            ajuda: 'Quantidade de propriedades rurais que podem ser gerenciadas',
            validacao: { min: 1, max: 100 },
          },
          {
            id: 'limite_animais',
            nome: 'Limite de Animais',
            tipo: 'numero',
            obrigatorio: false,
            placeholder: 'Ex: 10000',
            ajuda: 'Número máximo de animais que podem ser cadastrados',
            validacao: { min: 0 },
          },
          {
            id: 'suporte_incluso',
            nome: 'Tipo de Suporte Incluso',
            tipo: 'select',
            obrigatorio: true,
            opcoes: ['Email', 'Chat', 'Telefone', 'WhatsApp', 'Visita Técnica'],
            ajuda: 'Canal de suporte disponível para o cliente',
          },
        ],
        modulosDisponiveis: [
          'Gestão de Gado',
          'Confinamento',
          'Reprodução',
          'Sanidade Animal',
          'Agricultura',
          'Financeiro Rural',
          'Estoque e Insumos',
          'Relatórios Técnicos',
          'Integração Balanças',
          'Rastreabilidade',
          'Meteorologia',
          'Controle Sanitário',
        ],
        licencasDisponiveis: [
          'MB Task (Aplicativo de Campo)',
          'MB Curral (Manejo de Gado)',
          'Portal Web Completo',
          'App Mobile Proprietário',
          'App Mobile Funcionário',
          'Dashboard Executivo',
          'Relatórios Avançados',
        ],
      },
      {
        value: 'modulo_individual',
        label: 'Módulo Individual',
        icon: Package,
        descricao: 'Módulo específico para funcionalidade especializada',
        precificacaoPermitida: ['fixo', 'variavel'],
        campos: [
          {
            id: 'compatibilidade_planos',
            nome: 'Compatível com Planos',
            tipo: 'multiselect',
            obrigatorio: true,
            opcoes: ['Básico', 'Profissional', 'Enterprise', 'Premium', 'Todos'],
            ajuda: 'Quais planos podem adicionar este módulo',
          },
          {
            id: 'requisitos_minimos',
            nome: 'Requisitos Mínimos',
            tipo: 'textarea',
            obrigatorio: false,
            placeholder: 'Descreva os requisitos técnicos ou de plano...',
            ajuda: 'Requisitos necessários para usar este módulo',
          },
        ],
      },
      {
        value: 'licenca_app',
        label: 'Licença de Aplicativo',
        icon: Smartphone,
        descricao: 'Licenças para aplicativos móveis ou web específicos',
        precificacaoPermitida: ['fixo', 'por_licenca'],
        campos: [
          {
            id: 'plataforma',
            nome: 'Plataforma',
            tipo: 'select',
            obrigatorio: true,
            opcoes: ['Web', 'Android', 'iOS', 'Desktop Windows', 'Desktop Mac', 'Multiplataforma'],
            ajuda: 'Plataforma onde o aplicativo será utilizado',
          },
          {
            id: 'quantidade_minima',
            nome: 'Quantidade Mínima',
            tipo: 'numero',
            obrigatorio: true,
            placeholder: 'Ex: 1',
            ajuda: 'Quantidade mínima que pode ser contratada',
            validacao: { min: 1 },
          },
          {
            id: 'quantidade_maxima',
            nome: 'Quantidade Máxima',
            tipo: 'numero',
            obrigatorio: false,
            placeholder: 'Ex: 100',
            ajuda: 'Quantidade máxima permitida (deixe vazio para ilimitado)',
            validacao: { min: 1 },
          },
        ],
      },
      {
        value: 'servico_consultoria',
        label: 'Serviço de Consultoria',
        icon: Briefcase,
        descricao: 'Serviços de consultoria, treinamento e implementação',
        precificacaoPermitida: ['fixo', 'variavel', 'customizado'],
        campos: [
          {
            id: 'tipo_servico',
            nome: 'Tipo de Serviço',
            tipo: 'select',
            obrigatorio: true,
            opcoes: [
              'Implementação',
              'Treinamento',
              'Consultoria Técnica',
              'Suporte Premium',
              'Customização',
            ],
            ajuda: 'Categoria do serviço oferecido',
          },
          {
            id: 'duracao_estimada',
            nome: 'Duração Estimada (horas)',
            tipo: 'numero',
            obrigatorio: false,
            placeholder: 'Ex: 40',
            ajuda: 'Tempo estimado para conclusão do serviço',
          },
        ],
      },
    ],
    categorias: [
      {
        value: 'gestao_pecuaria',
        label: 'Gestão Pecuária',
        descricao: 'Sistemas para manejo de gado',
      },
      {
        value: 'gestao_agricola',
        label: 'Gestão Agrícola',
        descricao: 'Sistemas para agricultura e plantio',
      },
      {
        value: 'aplicativos_campo',
        label: 'Aplicativos de Campo',
        descricao: 'Apps móveis para uso no campo',
      },
      {
        value: 'integracao_equipamentos',
        label: 'Integração com Equipamentos',
        descricao: 'Conexão com balanças, sensores, etc.',
      },
      {
        value: 'financeiro_rural',
        label: 'Financeiro Rural',
        descricao: 'Gestão financeira específica do agro',
      },
      {
        value: 'consultoria_tecnica',
        label: 'Consultoria Técnica',
        descricao: 'Serviços de consultoria especializada',
      },
    ],
    camposPersonalizados: [
      {
        id: 'certificacoes_suportadas',
        nome: 'Certificações Suportadas',
        tipo: 'multiselect',
        obrigatorio: false,
        opcoes: [
          'SISBOV',
          'Rainforest Alliance',
          'BPA (Boas Práticas Agropecuárias)',
          'Orgânico',
          'UTZ',
          'Fair Trade',
        ],
        ajuda: 'Certificações que o produto suporta ou facilita a obtenção',
      },
      {
        id: 'especies_suportadas',
        nome: 'Espécies Animais Suportadas',
        tipo: 'multiselect',
        obrigatorio: false,
        opcoes: ['Bovinos', 'Suínos', 'Ovinos', 'Caprinos', 'Aves', 'Peixes', 'Equinos', 'Búfalos'],
        ajuda: 'Tipos de animais que o sistema pode gerenciar',
      },
    ],
    configuracoesPadrao: {
      moeda: 'BRL',
      timezone: 'America/Sao_Paulo',
      formato_data: 'DD/MM/YYYY',
      idioma: 'pt-BR',
    },
  },

  software_saas: {
    id: 'software_saas',
    nome: 'Software/SaaS',
    descricao: 'Soluções de software como serviço para diversos segmentos de negócio',
    icone: Globe,
    tiposProduto: [
      {
        value: 'plano_saas',
        label: 'Plano SaaS',
        icon: Globe,
        descricao: 'Plano de software como serviço com recursos escalonáveis',
        precificacaoPermitida: ['fixo', 'variavel', 'por_usuario'],
        campos: [
          {
            id: 'limite_usuarios',
            nome: 'Limite de Usuários',
            tipo: 'numero',
            obrigatorio: true,
            placeholder: 'Ex: 10',
            ajuda: 'Número máximo de usuários simultâneos',
            validacao: { min: 1, max: 10000 },
          },
          {
            id: 'armazenamento_gb',
            nome: 'Armazenamento (GB)',
            tipo: 'numero',
            obrigatorio: true,
            placeholder: 'Ex: 100',
            ajuda: 'Espaço de armazenamento em gigabytes',
            validacao: { min: 1 },
          },
          {
            id: 'api_calls_mes',
            nome: 'Chamadas de API/mês',
            tipo: 'numero',
            obrigatorio: false,
            placeholder: 'Ex: 10000',
            ajuda: 'Limite de chamadas de API por mês',
            validacao: { min: 0 },
          },
          {
            id: 'backup_incluido',
            nome: 'Backup Automático',
            tipo: 'checkbox',
            obrigatorio: false,
            ajuda: 'Se o plano inclui backup automático dos dados',
          },
        ],
      },
      {
        value: 'addon_plugin',
        label: 'Add-on/Plugin',
        icon: Zap,
        descricao: 'Extensões e plugins para funcionalidades adicionais',
        precificacaoPermitida: ['fixo', 'variavel'],
        campos: [
          {
            id: 'versao_minima_requerida',
            nome: 'Versão Mínima Requerida',
            tipo: 'texto',
            obrigatorio: true,
            placeholder: 'Ex: 2.1.0',
            ajuda: 'Versão mínima do software principal necessária',
          },
          {
            id: 'dependencias',
            nome: 'Dependências',
            tipo: 'textarea',
            obrigatorio: false,
            placeholder: 'Liste outros add-ons ou requisitos...',
            ajuda: 'Outros add-ons ou componentes necessários',
          },
        ],
      },
      {
        value: 'licenca_enterprise',
        label: 'Licença Enterprise',
        icon: Shield,
        descricao: 'Licenças corporativas com recursos avançados',
        precificacaoPermitida: ['fixo', 'customizado'],
        campos: [
          {
            id: 'usuarios_ilimitados',
            nome: 'Usuários Ilimitados',
            tipo: 'checkbox',
            obrigatorio: false,
            ajuda: 'Se a licença permite usuários ilimitados',
          },
          {
            id: 'sla_garantido',
            nome: 'SLA Garantido (%)',
            tipo: 'numero',
            obrigatorio: true,
            placeholder: 'Ex: 99.9',
            ajuda: 'Nível de serviço garantido em porcentagem',
            validacao: { min: 90, max: 100 },
          },
        ],
      },
    ],
    categorias: [
      { value: 'crm', label: 'CRM', descricao: 'Customer Relationship Management' },
      { value: 'erp', label: 'ERP', descricao: 'Enterprise Resource Planning' },
      { value: 'marketing', label: 'Marketing', descricao: 'Ferramentas de marketing digital' },
      { value: 'vendas', label: 'Vendas', descricao: 'Automação e gestão de vendas' },
      { value: 'financeiro', label: 'Financeiro', descricao: 'Gestão financeira e contábil' },
      { value: 'recursos_humanos', label: 'Recursos Humanos', descricao: 'Gestão de pessoas e RH' },
    ],
    camposPersonalizados: [
      {
        id: 'integracoes_disponiveis',
        nome: 'Integrações Disponíveis',
        tipo: 'multiselect',
        obrigatorio: false,
        opcoes: [
          'Salesforce',
          'HubSpot',
          'Zapier',
          'Slack',
          'Microsoft Teams',
          'Google Workspace',
          'API REST',
        ],
        ajuda: 'Integrações nativas disponíveis',
      },
    ],
    configuracoesPadrao: {
      moeda: 'BRL',
      timezone: 'America/Sao_Paulo',
      formato_data: 'DD/MM/YYYY',
      idioma: 'pt-BR',
    },
  },

  ecommerce: {
    id: 'ecommerce',
    nome: 'E-commerce',
    descricao: 'Produtos e serviços para lojas virtuais e comércio eletrônico',
    icone: ShoppingCart,
    tiposProduto: [
      {
        value: 'produto_fisico',
        label: 'Produto Físico',
        icon: Package,
        descricao: 'Produtos físicos com estoque e logística',
        precificacaoPermitida: ['fixo', 'variavel'],
        campos: [
          {
            id: 'peso_produto',
            nome: 'Peso (kg)',
            tipo: 'numero',
            obrigatorio: true,
            placeholder: 'Ex: 0.5',
            ajuda: 'Peso do produto para cálculo de frete',
            validacao: { min: 0.001 },
          },
          {
            id: 'dimensoes',
            nome: 'Dimensões (cm)',
            tipo: 'texto',
            obrigatorio: true,
            placeholder: 'Ex: 20x15x10',
            ajuda: 'Dimensões no formato LxAxP para cálculo de frete',
          },
          {
            id: 'estoque_minimo',
            nome: 'Estoque Mínimo',
            tipo: 'numero',
            obrigatorio: true,
            placeholder: 'Ex: 5',
            ajuda: 'Quantidade mínima em estoque',
            validacao: { min: 0 },
          },
        ],
      },
      {
        value: 'produto_digital',
        label: 'Produto Digital',
        icon: Monitor,
        descricao: 'E-books, cursos, softwares e outros produtos digitais',
        precificacaoPermitida: ['fixo', 'variavel'],
        campos: [
          {
            id: 'tipo_arquivo',
            nome: 'Tipo de Arquivo',
            tipo: 'select',
            obrigatorio: true,
            opcoes: ['PDF', 'Vídeo MP4', 'Software', 'E-book', 'Áudio', 'Imagem', 'Curso Online'],
            ajuda: 'Tipo do produto digital',
          },
          {
            id: 'tamanho_arquivo',
            nome: 'Tamanho do Arquivo (MB)',
            tipo: 'numero',
            obrigatorio: false,
            placeholder: 'Ex: 250',
            ajuda: 'Tamanho do arquivo em megabytes',
          },
        ],
      },
    ],
    categorias: [
      { value: 'eletronicos', label: 'Eletrônicos', descricao: 'Smartphones, computadores, etc.' },
      { value: 'roupas', label: 'Roupas e Acessórios', descricao: 'Vestuário e moda' },
      {
        value: 'casa_jardim',
        label: 'Casa e Jardim',
        descricao: 'Decoração e utilidades domésticas',
      },
      { value: 'livros', label: 'Livros', descricao: 'Livros físicos e digitais' },
      { value: 'cursos', label: 'Cursos Online', descricao: 'Educação e treinamento' },
      { value: 'esportes', label: 'Esportes', descricao: 'Equipamentos e roupas esportivas' },
    ],
    camposPersonalizados: [
      {
        id: 'categorias_marketplace',
        nome: 'Categorias de Marketplace',
        tipo: 'multiselect',
        obrigatorio: false,
        opcoes: ['Mercado Livre', 'Amazon', 'Magazine Luiza', 'Shopee', 'AliExpress'],
        ajuda: 'Marketplaces onde o produto será vendido',
      },
    ],
    configuracoesPadrao: {
      moeda: 'BRL',
      timezone: 'America/Sao_Paulo',
      formato_data: 'DD/MM/YYYY',
      idioma: 'pt-BR',
    },
  },

  servicos_profissionais: {
    id: 'servicos_profissionais',
    nome: 'Serviços Profissionais',
    descricao: 'Consultoria, serviços técnicos e profissionais especializados',
    icone: Briefcase,
    tiposProduto: [
      {
        value: 'consultoria',
        label: 'Consultoria',
        icon: Briefcase,
        descricao: 'Serviços de consultoria especializada',
        precificacaoPermitida: ['fixo', 'variavel', 'por_hora', 'customizado'],
        campos: [
          {
            id: 'area_especialidade',
            nome: 'Área de Especialidade',
            tipo: 'select',
            obrigatorio: true,
            opcoes: [
              'Estratégia',
              'Tecnologia',
              'Financeiro',
              'Marketing',
              'Operações',
              'Recursos Humanos',
            ],
            ajuda: 'Área principal de atuação da consultoria',
          },
          {
            id: 'duracao_estimada_horas',
            nome: 'Duração Estimada (horas)',
            tipo: 'numero',
            obrigatorio: false,
            placeholder: 'Ex: 40',
            ajuda: 'Tempo estimado para conclusão do projeto',
          },
        ],
      },
      {
        value: 'treinamento',
        label: 'Treinamento',
        icon: GraduationCap,
        descricao: 'Cursos e treinamentos corporativos',
        precificacaoPermitida: ['fixo', 'por_participante'],
        campos: [
          {
            id: 'modalidade',
            nome: 'Modalidade',
            tipo: 'select',
            obrigatorio: true,
            opcoes: ['Presencial', 'Online', 'Híbrido'],
            ajuda: 'Como o treinamento será ministrado',
          },
          {
            id: 'numero_participantes',
            nome: 'Número de Participantes',
            tipo: 'numero',
            obrigatorio: true,
            placeholder: 'Ex: 20',
            ajuda: 'Número máximo de participantes',
            validacao: { min: 1, max: 1000 },
          },
        ],
      },
    ],
    categorias: [
      {
        value: 'consultoria_estrategica',
        label: 'Consultoria Estratégica',
        descricao: 'Planejamento e estratégia empresarial',
      },
      {
        value: 'consultoria_tecnologia',
        label: 'Consultoria em TI',
        descricao: 'Tecnologia da informação',
      },
      {
        value: 'treinamento_corporativo',
        label: 'Treinamento Corporativo',
        descricao: 'Capacitação empresarial',
      },
      { value: 'auditoria', label: 'Auditoria', descricao: 'Serviços de auditoria e compliance' },
    ],
    camposPersonalizados: [],
    configuracoesPadrao: {
      moeda: 'BRL',
      timezone: 'America/Sao_Paulo',
      formato_data: 'DD/MM/YYYY',
      idioma: 'pt-BR',
    },
  },
};

/**
 * Hook para gerenciar configurações de segmento de produtos
 */
export const useSegmentoConfig = (segmentoInicial?: string) => {
  const [segmentoAtivo, setSegmentoAtivo] = useState(segmentoInicial || 'agropecuario');
  const [configuracaoPersonalizada, setConfiguracaoPersonalizada] = useState<SegmentoConfig | null>(
    null,
  );

  // Configuração ativa (personalizada ou padrão)
  const configuracaoAtiva = useMemo(() => {
    return configuracaoPersonalizada || SEGMENTOS_CONFIGURACAO[segmentoAtivo];
  }, [segmentoAtivo, configuracaoPersonalizada]);

  // Lista de todos os segmentos disponíveis
  const segmentosDisponiveis = useMemo(() => {
    return Object.values(SEGMENTOS_CONFIGURACAO).map((segmento) => ({
      value: segmento.id,
      label: segmento.nome,
      descricao: segmento.descricao,
      icone: segmento.icone,
    }));
  }, []);

  // Obter configuração de um tipo de produto específico
  const obterConfigTipoProduto = (tipoProduto: string): TipoProdutoConfig | undefined => {
    return configuracaoAtiva?.tiposProduto.find((tipo) => tipo.value === tipoProduto);
  };

  // Adicionar campo personalizado
  const adicionarCampoPersonalizado = (campo: CampoPersonalizado) => {
    if (configuracaoPersonalizada) {
      setConfiguracaoPersonalizada({
        ...configuracaoPersonalizada,
        camposPersonalizados: [...configuracaoPersonalizada.camposPersonalizados, campo],
      });
    }
  };

  // Remover campo personalizado
  const removerCampoPersonalizado = (campoId: string) => {
    if (configuracaoPersonalizada) {
      setConfiguracaoPersonalizada({
        ...configuracaoPersonalizada,
        camposPersonalizados: configuracaoPersonalizada.camposPersonalizados.filter(
          (campo) => campo.id !== campoId,
        ),
      });
    }
  };

  // Criar configuração personalizada baseada na atual
  const criarConfiguracaoPersonalizada = (novaConfig: Partial<SegmentoConfig>) => {
    const configBase = SEGMENTOS_CONFIGURACAO[segmentoAtivo];
    setConfiguracaoPersonalizada({
      ...configBase,
      ...novaConfig,
      id: novaConfig.id || `${configBase.id}_personalizado`,
    });
  };

  // Resetar para configuração padrão
  const resetarParaPadrao = () => {
    setConfiguracaoPersonalizada(null);
  };

  // Salvar configuração personalizada (simulação - integrar com backend)
  const salvarConfiguracao = async () => {
    if (configuracaoPersonalizada) {
      // Aqui você integraria com seu backend para salvar a configuração
      console.log('Salvando configuração personalizada:', configuracaoPersonalizada);
      return true;
    }
    return false;
  };

  return {
    // Estado
    segmentoAtivo,
    configuracaoAtiva,
    configuracaoPersonalizada,
    segmentosDisponiveis,

    // Ações
    setSegmentoAtivo,
    obterConfigTipoProduto,
    adicionarCampoPersonalizado,
    removerCampoPersonalizado,
    criarConfiguracaoPersonalizada,
    resetarParaPadrao,
    salvarConfiguracao,

    // Configurações padrão disponíveis
    configuracoesPadrao: SEGMENTOS_CONFIGURACAO,
  };
};

export default useSegmentoConfig;
