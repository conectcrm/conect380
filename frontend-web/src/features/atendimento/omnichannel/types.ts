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
  statusOriginal?: string;
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
  tipo?: string;
  remetente: {
    id: string;
    nome: string;
    foto?: string;
    tipo: 'cliente' | 'atendente';
  };
  conteudo: string;
  timestamp: Date | string;
  status: StatusMensagem;
  anexos?: {
    nome: string;
    url?: string | null;
    downloadUrl?: string | null;
    originalUrl?: string | null;
    tipo?: string | null;
    tamanho?: number | null;
    duracao?: number | null;
  }[];
  audio?: {
    url: string;
    downloadUrl?: string | null;
    tipo?: string | null;
    duracao?: number | null;
    nome?: string | null;
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

// ✅ Interfaces atualizadas para espelhar backend
export interface Demanda {
  id: string;
  clienteId?: string;
  ticketId?: string;
  contatoTelefone?: string;
  empresaId: string;
  titulo: string;
  descricao?: string;
  tipo: 'tecnica' | 'comercial' | 'financeira' | 'suporte' | 'reclamacao' | 'solicitacao' | 'outros';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  status: 'aberta' | 'em_andamento' | 'aguardando' | 'concluida' | 'cancelada';
  dataVencimento?: string;
  dataConclusao?: string;
  responsavelId?: string;
  responsavel?: {
    id: string;
    username: string;
    nome?: string;
  };
  autorId: string;
  autor?: {
    id: string;
    username: string;
    nome?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface NotaCliente {
  id: string;
  clienteId?: string;
  ticketId?: string;
  contatoTelefone?: string;
  empresaId: string;
  conteudo: string;
  importante: boolean;
  autorId: string;
  autor?: {
    id: string;
    username: string;
    nome?: string;
  };
  createdAt: string;
  updatedAt: string;
}
