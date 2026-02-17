import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

export enum EstrategiaDistribuicao {
  ROUND_ROBIN = 'ROUND_ROBIN',
  MENOR_CARGA = 'MENOR_CARGA',
  PRIORIDADE = 'PRIORIDADE',
}

export enum PrioridadePadrao {
  BAIXA = 'BAIXA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
  URGENTE = 'URGENTE',
}

/**
 * DTO para criação de uma nova fila
 */
export class CreateFilaDto {
  /**
   * Nome da fila (ex: "Suporte Técnico", "Vendas", "Financeiro")
   * Mín: 3 caracteres, Máx: 100 caracteres
   */
  @IsString()
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  nome: string;

  /**
   * Descrição opcional da fila
   * Máx: 500 caracteres
   */
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Descrição deve ter no máximo 500 caracteres' })
  descricao?: string;

  /**
   * Estratégia de distribuição de tickets
   * - ROUND_ROBIN: Rotação circular entre atendentes
   * - MENOR_CARGA: Atribui para quem tem menos tickets
   * - PRIORIDADE: Atribui baseado na prioridade configurada
   *
   * Padrão: ROUND_ROBIN
   */
  @IsOptional()
  @IsEnum(EstrategiaDistribuicao, {
    message: 'Estratégia deve ser ROUND_ROBIN, MENOR_CARGA ou PRIORIDADE',
  })
  estrategiaDistribuicao?: EstrategiaDistribuicao;

  /**
   * Capacidade máxima de tickets por atendente nesta fila
   * Mín: 1, Máx: 100
   * Padrão: 10
   */
  @IsOptional()
  @IsInt({ message: 'Capacidade máxima deve ser um número inteiro' })
  @Min(1, { message: 'Capacidade máxima deve ser no mínimo 1' })
  @Max(100, { message: 'Capacidade máxima deve ser no máximo 100' })
  capacidadeMaxima?: number;

  /**
   * Se true, tickets são distribuídos automaticamente ao entrar na fila
   * Se false, tickets aguardam atribuição manual
   * Padrão: false
   */
  @IsOptional()
  @IsBoolean({ message: 'Distribuição automática deve ser true ou false' })
  distribuicaoAutomatica?: boolean;

  /**
   * Ordem de exibição da fila (para ordenação)
   * Menor número = aparece primeiro
   * Padrão: 0
   */
  @IsOptional()
  @IsInt({ message: 'Ordem deve ser um número inteiro' })
  @Min(0, { message: 'Ordem deve ser no mínimo 0' })
  ordem?: number;

  /**
   * Se a fila está ativa
   * Filas inativas não recebem novos tickets
   * Padrão: true
   */
  @IsOptional()
  @IsBoolean({ message: 'Ativo deve ser true ou false' })
  ativo?: boolean;

  /**
   * Configurações adicionais da fila
   */
  @IsOptional()
  @IsObject({ message: 'Configurações devem ser um objeto' })
  configuracoes?: {
    /**
     * Tempo máximo de espera antes de notificar supervisor (em minutos)
     */
    tempoMaximoEspera?: number;

    /**
     * Prioridade padrão para tickets que entram nesta fila
     */
    prioridadePadrao?: PrioridadePadrao;

    /**
     * Notificar após X minutos sem atribuição
     */
    notificarAposMinutos?: number;
  };

  /**
   * Horário de atendimento da fila (JSONB)
   * Formato: { segunda: { inicio: '08:00', fim: '18:00' }, ... }
   */
  @IsOptional()
  @IsObject({ message: 'Horário de atendimento deve ser um objeto' })
  horarioAtendimento?: any;
}
