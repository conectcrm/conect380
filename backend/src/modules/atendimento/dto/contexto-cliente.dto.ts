import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * DTO para resposta do contexto completo do cliente
 */
export class ContextoClienteResponseDto {
  cliente: {
    id: string;
    nome: string;
    email: string;
    telefone: string;
    documento?: string;
    empresa?: string;
    cargo?: string;
    segmento: 'VIP' | 'Regular' | 'Novo';
    primeiroContato: Date;
    ultimoContato: Date;
    tags?: string[];
  };

  estatisticas: {
    valorTotalGasto: number;
    totalTickets: number;
    ticketsResolvidos: number;
    ticketsAbertos: number;
    avaliacaoMedia: number;
    tempoMedioResposta: string;
  };

  historico: {
    propostas: any[];
    faturas: any[];
    tickets: any[];
  };
}

/**
 * DTO para query params do contexto
 */
export class ContextoClienteQueryDto {
  @IsOptional()
  @IsString()
  empresaId?: string;

  @IsOptional()
  incluirHistorico?: boolean = true;

  @IsOptional()
  incluirEstatisticas?: boolean = true;
}
