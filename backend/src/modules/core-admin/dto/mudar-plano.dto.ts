import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MudarPlanoDto {
  @ApiProperty({
    description:
      'Identificador do plano no catalogo de assinaturas (codigo ou alias comum). Ex.: starter, business, enterprise.',
    example: 'business',
    enum: ['starter', 'business', 'enterprise', 'custom'],
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
    description:
      'Campo legado. Quando informado, eh ignorado e o valor aplicado sera sempre o preco do catalogo de planos.',
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
