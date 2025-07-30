export interface PropostaDto {
  id: string;
  numero: string;
  titulo?: string;
  status: string;
  cliente: string;
  valor: number;
  createdAt: string;
  updatedAt: string;
  source?: string;
  observacoes?: string;
  vendedor?: string | {
    id: string;
    nome: string;
    email: string;
    tipo: string;
    ativo: boolean;
  };
  formaPagamento?: string;
  validadeDias?: number;
}

export interface CriarPropostaDto {
  titulo: string;
  cliente: string;
  valor: number;
  observacoes?: string;
  vendedor?: string | {
    id: string;
    nome: string;
    email: string;
    tipo: string;
    ativo: boolean;
  };
  formaPagamento?: string;
  validadeDias?: number;
}

export interface AtualizarStatusDto {
  status: string;
  updatedAt?: string;
  source?: string;
  observacoes?: string;
}

export interface PropostaResponseDto {
  success: boolean;
  message?: string;
  proposta?: PropostaDto;
  timestamp?: string;
  error?: string;
}
