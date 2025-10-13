// Tipos e interfaces para o chat omnichannel

export type CanalTipo = 'whatsapp' | 'telegram' | 'email' | 'chat' | 'telefone';
export type StatusAtendimento = 'aberto' | 'resolvido' | 'retorno';
export type StatusMensagem = 'enviando' | 'enviado' | 'entregue' | 'lido';

export interface Contato {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  foto?: string;
  online: boolean;
  clienteVinculado?: {
    id: string;
    nome: string;
  };
}

export interface Ticket {
  id: string;
  numero: string;
  contatoId: string;
  contato: Contato;
  canal: CanalTipo;
  status: StatusAtendimento;
  ultimaMensagem: string;
  tempoUltimaMensagem: Date;
  tempoAtendimento: number; // em segundos
  atendente?: {
    id: string;
    nome: string;
    foto?: string;
  };
  tags?: string[];
}

export interface Mensagem {
  id: string;
  ticketId: string;
  remetente: {
    id: string;
    nome: string;
    foto?: string;
    tipo: 'cliente' | 'atendente';
  };
  conteudo: string;
  timestamp: Date;
  status: StatusMensagem;
  anexos?: {
    nome: string;
    url: string;
    tipo: string;
  }[];
  audio?: {
    url: string;
    duracao: number;
  };
}

export interface HistoricoAtendimento {
  id: string;
  numero: string;
  dataAbertura: Date;
  dataFechamento: Date;
  canal: CanalTipo;
  atendente: string;
  resumo: string;
}

export interface Demanda {
  id: string;
  tipo: string;
  descricao: string;
  status: 'aberta' | 'em_andamento' | 'concluida';
  dataAbertura: Date;
  dataConclusao?: Date;
}

export interface NotaCliente {
  id: string;
  conteudo: string;
  autor: {
    id: string;
    nome: string;
    foto?: string;
  };
  dataCriacao: Date;
  dataEdicao?: Date;
  importante?: boolean;
}
