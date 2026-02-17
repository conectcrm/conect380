import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MudarPlanoDto {
  @ApiProperty({
    description: 'Nome do novo plano',
    example: 'Professional',
    enum: ['Starter', 'Professional', 'Enterprise', 'Custom'],
  })
  @IsString()
  plano: string;

  @ApiPropertyOptional({
    description: 'Motivo da mudança de plano',
    example: 'Cliente solicitou upgrade para ter mais usuários',
  })
  @IsOptional()
  @IsString()
  motivo?: string;

  @ApiPropertyOptional({
    description: 'Valor mensal do novo plano',
    example: 297.0,
  })
  @IsOptional()
  @IsNumber()
  valor_mensal?: number;

  @ApiPropertyOptional({
    description: 'ID do usuário que está fazendo a alteração',
    example: 'uuid-do-admin',
  })
  @IsOptional()
  @IsString()
  alterado_por?: string;
}
