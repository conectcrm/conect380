// Dados de exemplo para o funil de vendas - substituir por API real

export interface Opportunity {
  id: string;
  title: string;
  client: string;
  value: number;
  probability: number;
  expectedCloseDate: string;
  createdDate: string;
  assignedTo: string;
  stage: string;
  priority: 'low' | 'medium' | 'high';
  source: string;
  tags: string[];
  lastActivity: string;
  activities: Activity[];
  description?: string;
  contact?: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface Activity {
  id?: string;
  date: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'task';
  description: string;
  createdBy?: string;
}

export const mockOpportunities: Opportunity[] = [
  {
    id: '1',
    title: 'Implementação Sistema ERP - Empresa ABC',
    client: 'Empresa ABC Ltda',
    value: 85000,
    probability: 80,
    expectedCloseDate: '2025-08-15',
    createdDate: '2025-07-01',
    assignedTo: 'Ana Silva',
    stage: 'negotiation',
    priority: 'high',
    source: 'Website',
    tags: ['ERP', 'Implementação'],
    lastActivity: '2025-07-20',
    description:
      'Sistema ERP completo para gestão empresarial com módulos financeiro, estoque e vendas.',
    contact: {
      name: 'Carlos Alberto',
      email: 'carlos@empresaabc.com.br',
      phone: '(11) 98765-4321',
    },
    activities: [
      {
        id: '1',
        date: '2025-07-20',
        type: 'call',
        description: 'Ligação de follow-up - cliente interessado em fechar ainda neste mês',
        createdBy: 'Ana Silva',
      },
      {
        id: '2',
        date: '2025-07-18',
        type: 'email',
        description:
          'Proposta comercial enviada com valores atualizados e cronograma de implementação',
        createdBy: 'Ana Silva',
      },
      {
        id: '3',
        date: '2025-07-15',
        type: 'meeting',
        description: 'Reunião presencial para apresentação do sistema e levantamento de requisitos',
        createdBy: 'Ana Silva',
      },
    ],
  },
  {
    id: '2',
    title: 'Consultoria Digital - TechStart',
    client: 'TechStart Inovação',
    value: 45000,
    probability: 60,
    expectedCloseDate: '2025-08-30',
    createdDate: '2025-07-10',
    assignedTo: 'Carlos Vendas',
    stage: 'proposal',
    priority: 'medium',
    source: 'Indicação',
    tags: ['Consultoria', 'Digital'],
    lastActivity: '2025-07-19',
    description:
      'Consultoria para transformação digital da empresa com foco em automação de processos.',
    contact: {
      name: 'Marina Santos',
      email: 'marina@techstart.com.br',
      phone: '(11) 99876-5432',
    },
    activities: [
      {
        id: '4',
        date: '2025-07-19',
        type: 'email',
        description: 'Enviado material complementar sobre metodologias de transformação digital',
        createdBy: 'Carlos Vendas',
      },
      {
        id: '5',
        date: '2025-07-16',
        type: 'meeting',
        description: 'Reunião online para entender necessidades da empresa',
        createdBy: 'Carlos Vendas',
      },
    ],
  },
  {
    id: '3',
    title: 'Sistema de Gestão - Clínica MedCenter',
    client: 'Clínica MedCenter',
    value: 35000,
    probability: 40,
    expectedCloseDate: '2025-09-15',
    createdDate: '2025-07-05',
    assignedTo: 'João Santos',
    stage: 'qualification',
    priority: 'medium',
    source: 'Telefone',
    tags: ['Healthcare', 'Gestão'],
    lastActivity: '2025-07-18',
    description:
      'Sistema especializado para gestão de clínicas médicas com agenda, prontuários e faturamento.',
    contact: {
      name: 'Dr. Roberto Silva',
      email: 'roberto@medcenter.com.br',
      phone: '(11) 97654-3210',
    },
    activities: [
      {
        id: '6',
        date: '2025-07-18',
        type: 'call',
        description: 'Ligação para esclarecer dúvidas sobre funcionalidades do sistema',
        createdBy: 'João Santos',
      },
      {
        id: '7',
        date: '2025-07-12',
        type: 'email',
        description: 'Enviado questionário para levantamento de requisitos específicos',
        createdBy: 'João Santos',
      },
    ],
  },
  {
    id: '4',
    title: 'E-commerce Personalizado - Fashion Style',
    client: 'Fashion Style Boutique',
    value: 55000,
    probability: 70,
    expectedCloseDate: '2025-08-20',
    createdDate: '2025-06-28',
    assignedTo: 'Ana Silva',
    stage: 'closing',
    priority: 'high',
    source: 'Redes Sociais',
    tags: ['E-commerce', 'Fashion'],
    lastActivity: '2025-07-21',
    description:
      'Plataforma de e-commerce personalizada para boutique de moda com integração de pagamentos.',
    contact: {
      name: 'Isabella Costa',
      email: 'isabella@fashionstyle.com.br',
      phone: '(11) 96543-2109',
    },
    activities: [
      {
        id: '8',
        date: '2025-07-21',
        type: 'meeting',
        description: 'Reunião final para fechamento - aguardando aprovação da diretoria',
        createdBy: 'Ana Silva',
      },
      {
        id: '9',
        date: '2025-07-17',
        type: 'email',
        description: 'Enviado contrato final com condições negociadas',
        createdBy: 'Ana Silva',
      },
    ],
  },
  {
    id: '5',
    title: 'App Mobile - Delivery Express',
    client: 'Delivery Express Ltda',
    value: 28000,
    probability: 30,
    expectedCloseDate: '2025-09-30',
    createdDate: '2025-07-12',
    assignedTo: 'Carlos Vendas',
    stage: 'leads',
    priority: 'low',
    source: 'Website',
    tags: ['Mobile', 'Delivery'],
    lastActivity: '2025-07-15',
    description: 'Aplicativo mobile para gestão de entregas com rastreamento em tempo real.',
    contact: {
      name: 'Pedro Oliveira',
      email: 'pedro@deliveryexpress.com.br',
      phone: '(11) 95432-1098',
    },
    activities: [
      {
        id: '10',
        date: '2025-07-15',
        type: 'call',
        description: 'Primeira ligação - cliente ainda avaliando opções no mercado',
        createdBy: 'Carlos Vendas',
      },
    ],
  },
  {
    id: '6',
    title: 'Sistema Educacional - Escola Futuro',
    client: 'Escola Futuro',
    value: 42000,
    probability: 90,
    expectedCloseDate: '2025-07-25',
    createdDate: '2025-06-15',
    assignedTo: 'João Santos',
    stage: 'won',
    priority: 'high',
    source: 'Indicação',
    tags: ['Educação', 'Sistema'],
    lastActivity: '2025-07-22',
    description:
      'Sistema completo para gestão escolar com portal do aluno, professor e responsáveis.',
    contact: {
      name: 'Prof. Maria Helena',
      email: 'maria@escolafuturo.edu.br',
      phone: '(11) 94321-0987',
    },
    activities: [
      {
        id: '11',
        date: '2025-07-22',
        type: 'task',
        description: 'Contrato assinado! Iniciar processo de implementação na próxima semana',
        createdBy: 'João Santos',
      },
      {
        id: '12',
        date: '2025-07-20',
        type: 'meeting',
        description: 'Reunião de fechamento e assinatura do contrato',
        createdBy: 'João Santos',
      },
    ],
  },
  {
    id: '7',
    title: 'Automação Industrial - MetalTech',
    client: 'MetalTech Indústria',
    value: 15000,
    probability: 10,
    expectedCloseDate: '2025-08-10',
    createdDate: '2025-06-20',
    assignedTo: 'Ana Silva',
    stage: 'lost',
    priority: 'medium',
    source: 'Telefone',
    tags: ['Automação', 'Industrial'],
    lastActivity: '2025-07-10',
    description: 'Sistema de automação para linha de produção industrial.',
    contact: {
      name: 'Eng. Ricardo Lima',
      email: 'ricardo@metaltech.com.br',
      phone: '(11) 93210-9876',
    },
    activities: [
      {
        id: '13',
        date: '2025-07-10',
        type: 'note',
        description: 'Cliente optou por solução concorrente devido ao prazo de entrega mais curto',
        createdBy: 'Ana Silva',
      },
      {
        id: '14',
        date: '2025-07-05',
        type: 'call',
        description: 'Última tentativa de negociação - cliente inflexível quanto ao prazo',
        createdBy: 'Ana Silva',
      },
    ],
  },
];

export const stageLabels = {
  leads: 'Leads',
  qualification: 'Qualificação',
  proposal: 'Proposta',
  negotiation: 'Negociação',
  closing: 'Fechamento',
  won: 'Ganho',
  lost: 'Perdido',
};

export const priorityLabels = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
};

export const sourceOptions = [
  'Website',
  'Indicação',
  'Telefone',
  'Email',
  'Redes Sociais',
  'Evento',
  'Parceiro',
  'Campanha',
];

export const vendedorOptions = [
  'Ana Silva',
  'Carlos Vendas',
  'João Santos',
  'Maria Oliveira',
  'Pedro Costa',
];
