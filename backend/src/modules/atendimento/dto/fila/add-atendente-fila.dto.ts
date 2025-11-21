import { IsUUID, IsOptional, IsInt, Min, Max } from 'class-validator';

/**
 * DTO para adicionar um atendente a uma fila
 */
export class AddAtendenteFilaDto {
  /**
   * ID do atendente (User)
   */
  @IsUUID('4', { message: 'ID do atendente deve ser um UUID válido' })
  atendenteId: string;

  /**
   * Capacidade do atendente nesta fila específica
   * Número de tickets simultâneos que pode atender nesta fila
   * Mín: 1, Máx: 50
   * Padrão: 10
   */
  @IsOptional()
  @IsInt({ message: 'Capacidade deve ser um número inteiro' })
  @Min(1, { message: 'Capacidade deve ser no mínimo 1' })
  @Max(50, { message: 'Capacidade deve ser no máximo 50' })
  capacidade?: number;

  /**
   * Prioridade do atendente nesta fila
   * Usado na estratégia PRIORIDADE
   * 1 = Alta prioridade (recebe primeiro)
   * 10 = Baixa prioridade (recebe por último)
   * Padrão: 5 (média)
   */
  @IsOptional()
  @IsInt({ message: 'Prioridade deve ser um número inteiro' })
  @Min(1, { message: 'Prioridade deve ser no mínimo 1 (alta)' })
  @Max(10, { message: 'Prioridade deve ser no máximo 10 (baixa)' })
  prioridade?: number;
}
