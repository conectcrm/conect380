// Tipos e interfaces para o chat omnichannel

export type CanalTipo = 'whatsapp' | 'telegram' | 'email' | 'chat' | 'telefone';

// ✅ MELHORADO: Enum alinhado 1:1 com backend (StatusTicket)
// Mapeamento direto: frontend (minúsculo) ↔ backend (MAIÚSCULO)
export enum StatusAtendimento {
  FILA = 'fila',
  EM_ATENDIMENTO = 'em_atendimento',
  ENVIO_ATIVO = 'envio_ativo',
  ENCERRADO = 'encerrado',
}

// Type helper para compatibilidade
export type StatusAtendimentoType =
  | 'fila'
  | 'em_atendimento'
  | 'envio_ativo'
  | 'encerrado';

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
  status: StatusAtendimentoType; // ✅ Usar type ao invés de enum direto
  statusOriginal?: string;
  ultimaMensagem: string;
  tempoUltimaMensagem: Date;
  tempoAtendimento: number; // em segundos
  filaId?: string | null; // 🆕 Sistema de Filas
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
  tipo:
  | 'tecnica'
  | 'comercial'
  | 'financeira'
  | 'suporte'
  | 'reclamacao'
  | 'solicitacao'
  | 'outros';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  status: 'aberta' | 'em_andamento' | 'aguardando' | 'concluida' | 'cancelada';
  dataAbertura?: string;
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
    foto?: string;
    avatarUrl?: string;
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
    foto?: string;
    avatarUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
  dataCriacao?: string;
  dataEdicao?: string;
}
