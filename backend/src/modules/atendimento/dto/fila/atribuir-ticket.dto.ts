import { IsUUID, IsBoolean, IsOptional, ValidateIf } from 'class-validator';

/**
 * DTO para atribuir um ticket a uma fila
 */
export class AtribuirTicketDto {
  /**
   * ID do ticket
   */
  @IsUUID('4', { message: 'ID do ticket deve ser um UUID válido' })
  ticketId: string;

  /**
   * ID da fila
   */
  @IsUUID('4', { message: 'ID da fila deve ser um UUID válido' })
  filaId: string;

  /**
   * Se true, usa a estratégia de distribuição configurada na fila
   * Se false, atribui manualmente para o atendenteId especificado
   * Padrão: true
   */
  @IsOptional()
  @IsBoolean({ message: 'Distribuição automática deve ser true ou false' })
  distribuicaoAutomatica?: boolean;

  /**
   * ID do atendente (obrigatório se distribuicaoAutomatica = false)
   * Ignorado se distribuicaoAutomatica = true
   */
  @ValidateIf((o) => o.distribuicaoAutomatica === false)
  @IsUUID('4', {
    message:
      'ID do atendente deve ser um UUID válido e é obrigatório quando distribuição automática é desativada',
  })
  atendenteId?: string;
}
