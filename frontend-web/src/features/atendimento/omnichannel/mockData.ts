// Dados mock para desenvolvimento e testes do chat omnichannel
import { Ticket, Mensagem, HistoricoAtendimento, Demanda, Contato, NotaCliente } from './types';

export const mockContatos: Contato[] = [
  {
    id: '1',
    nome: 'João Silva',
    telefone: '+55 11 98765-4321',
    email: 'joao.silva@email.com',
    foto: 'https://i.pravatar.cc/150?img=12',
    online: true,
    clienteVinculado: {
      id: 'c1',
      nome: 'Empresa ABC Ltda'
    }
  },
  {
    id: '2',
    nome: 'Maria Santos',
    telefone: '+55 11 98765-1234',
    email: 'maria.santos@email.com',
    foto: 'https://i.pravatar.cc/150?img=45',
    online: false
  },
  {
    id: '3',
    nome: 'Carlos Oliveira',
    telefone: '+55 11 98765-5678',
    email: 'carlos.oliveira@email.com',
    foto: 'https://i.pravatar.cc/150?img=33',
    online: true,
    clienteVinculado: {
      id: 'c2',
      nome: 'Tech Solutions Inc'
    }
  }
];

export const mockTickets: Ticket[] = [
  {
    id: 't1',
    numero: '#12345',
    contatoId: '1',
    contato: mockContatos[0],
    canal: 'whatsapp',
    status: 'aberto',
    ultimaMensagem: 'Olá, preciso de ajuda com meu pedido',
    tempoUltimaMensagem: new Date(Date.now() - 5 * 60 * 1000), // 5 min atrás
    tempoAtendimento: 300, // 5 minutos em segundos
    atendente: {
      id: 'a1',
      nome: 'Ana Costa',
      foto: 'https://i.pravatar.cc/150?img=47'
    },
    tags: ['urgente', 'pedido']
  },
  {
    id: 't2',
    numero: '#12344',
    contatoId: '2',
    contato: mockContatos[1],
    canal: 'telegram',
    status: 'aberto',
    ultimaMensagem: 'Quando será entregue?',
    tempoUltimaMensagem: new Date(Date.now() - 15 * 60 * 1000), // 15 min atrás
    tempoAtendimento: 900,
    atendente: {
      id: 'a1',
      nome: 'Ana Costa',
      foto: 'https://i.pravatar.cc/150?img=47'
    }
  },
  {
    id: 't3',
    numero: '#12343',
    contatoId: '3',
    contato: mockContatos[2],
    canal: 'email',
    status: 'resolvido',
    ultimaMensagem: 'Muito obrigado pelo suporte!',
    tempoUltimaMensagem: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h atrás
    tempoAtendimento: 3600,
    atendente: {
      id: 'a2',
      nome: 'Pedro Souza',
      foto: 'https://i.pravatar.cc/150?img=51'
    }
  }
];

export const mockMensagens: Mensagem[] = [
  {
    id: 'm1',
    ticketId: 't1',
    remetente: {
      id: '1',
      nome: 'João Silva',
      foto: 'https://i.pravatar.cc/150?img=12',
      tipo: 'cliente'
    },
    conteudo: 'Olá, boa tarde!',
    timestamp: new Date(Date.now() - 10 * 60 * 1000),
    status: 'lido'
  },
  {
    id: 'm2',
    ticketId: 't1',
    remetente: {
      id: 'a1',
      nome: 'Ana Costa',
      foto: 'https://i.pravatar.cc/150?img=47',
      tipo: 'atendente'
    },
    conteudo: 'Olá João! Tudo bem? Como posso ajudá-lo?',
    timestamp: new Date(Date.now() - 9 * 60 * 1000),
    status: 'lido'
  },
  {
    id: 'm3',
    ticketId: 't1',
    remetente: {
      id: '1',
      nome: 'João Silva',
      foto: 'https://i.pravatar.cc/150?img=12',
      tipo: 'cliente'
    },
    conteudo: 'Preciso de ajuda com meu pedido #9876. Ele não chegou ainda e já se passaram 5 dias.',
    timestamp: new Date(Date.now() - 7 * 60 * 1000),
    status: 'lido'
  },
  {
    id: 'm4',
    ticketId: 't1',
    remetente: {
      id: 'a1',
      nome: 'Ana Costa',
      foto: 'https://i.pravatar.cc/150?img=47',
      tipo: 'atendente'
    },
    conteudo: 'Entendo sua preocupação. Deixe-me verificar o status do seu pedido.',
    timestamp: new Date(Date.now() - 6 * 60 * 1000),
    status: 'lido'
  },
  {
    id: 'm5',
    ticketId: 't1',
    remetente: {
      id: 'a1',
      nome: 'Ana Costa',
      foto: 'https://i.pravatar.cc/150?img=47',
      tipo: 'atendente'
    },
    conteudo: 'João, consultei aqui e seu pedido está em transporte. A previsão de entrega é para amanhã. Você receberá uma notificação assim que sair para entrega.',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    status: 'lido'
  },
  {
    id: 'm6',
    ticketId: 't1',
    remetente: {
      id: '1',
      nome: 'João Silva',
      foto: 'https://i.pravatar.cc/150?img=12',
      tipo: 'cliente'
    },
    conteudo: 'Perfeito! Muito obrigado pela ajuda.',
    timestamp: new Date(Date.now() - 3 * 60 * 1000),
    status: 'lido'
  },
  {
    id: 'm7',
    ticketId: 't1',
    remetente: {
      id: 'a1',
      nome: 'Ana Costa',
      foto: 'https://i.pravatar.cc/150?img=47',
      tipo: 'atendente'
    },
    conteudo: 'Por nada! Estamos à disposição. Há mais alguma coisa em que posso ajudar?',
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    status: 'entregue'
  }
];

export const mockHistorico: HistoricoAtendimento[] = [
  {
    id: 'h1',
    numero: '#12340',
    dataAbertura: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    dataFechamento: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
    canal: 'whatsapp',
    atendente: 'Ana Costa',
    resumo: 'Dúvida sobre produto - Resolvido'
  },
  {
    id: 'h2',
    numero: '#12320',
    dataAbertura: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    dataFechamento: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
    canal: 'email',
    atendente: 'Pedro Souza',
    resumo: 'Solicitação de troca - Processado'
  },
  {
    id: 'h3',
    numero: '#12300',
    dataAbertura: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    dataFechamento: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000),
    canal: 'chat',
    atendente: 'Ana Costa',
    resumo: 'Informações de garantia - Esclarecido'
  }
];

export const mockDemandas: Demanda[] = [
  {
    id: 'd1',
    tipo: 'Suporte Técnico',
    descricao: 'Problema com login no sistema',
    status: 'em_andamento',
    dataAbertura: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  },
  {
    id: 'd2',
    tipo: 'Financeiro',
    descricao: 'Ajuste de fatura - valor incorreto',
    status: 'concluida',
    dataAbertura: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    dataConclusao: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  }
];

export const mockNotas: NotaCliente[] = [
  {
    id: 'n1',
    conteudo: 'Cliente VIP - sempre priorizar atendimento. Responsável por contrato de R$ 50k/mês.',
    autor: {
      id: 'a1',
      nome: 'Ana Costa',
      foto: 'https://i.pravatar.cc/150?img=47'
    },
    dataCriacao: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    importante: true
  },
  {
    id: 'n2',
    conteudo: 'Prefere contato por WhatsApp. Evitar ligações antes das 10h.',
    autor: {
      id: 'a2',
      nome: 'Pedro Souza',
      foto: 'https://i.pravatar.cc/150?img=51'
    },
    dataCriacao: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    importante: false
  },
  {
    id: 'n3',
    conteudo: 'Teve problema com entrega em setembro/2024. Compensado com desconto de 15% na renovação.',
    autor: {
      id: 'a1',
      nome: 'Ana Costa',
      foto: 'https://i.pravatar.cc/150?img=47'
    },
    dataCriacao: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    dataEdicao: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    importante: false
  }
];
