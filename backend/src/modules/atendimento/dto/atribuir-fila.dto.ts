import { IsUUID, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para atribuir núcleo a uma fila
 */
export class AtribuirNucleoDto {
  @ApiProperty({
    description: 'ID do núcleo de atendimento',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'nucleoId deve ser um UUID válido' })
  @IsNotEmpty({ message: 'nucleoId é obrigatório' })
  nucleoId: string;
}

/**
 * DTO para atribuir departamento a uma fila
 */
export class AtribuirDepartamentoDto {
  @ApiProperty({
    description: 'ID do departamento',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID('4', { message: 'departamentoId deve ser um UUID válido' })
  @IsNotEmpty({ message: 'departamentoId é obrigatório' })
  departamentoId: string;
}

/**
 * DTO para atribuir núcleo E departamento simultaneamente
 */
export class AtribuirNucleoEDepartamentoDto {
  @ApiPropertyOptional({
    description: 'ID do núcleo de atendimento (opcional)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'nucleoId deve ser um UUID válido' })
  nucleoId?: string;

  @ApiPropertyOptional({
    description: 'ID do departamento (opcional)',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsUUID('4', { message: 'departamentoId deve ser um UUID válido' })
  departamentoId?: string;
}
