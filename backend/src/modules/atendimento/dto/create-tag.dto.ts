import { IsString, IsOptional, IsBoolean, IsHexColor, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTagDto {
  @ApiProperty({
    description: 'Nome da tag',
    example: 'Urgente',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  nome: string;

  @ApiProperty({
    description: 'Cor da tag em hexadecimal',
    example: '#EF4444',
  })
  @IsHexColor()
  cor: string;

  @ApiPropertyOptional({
    description: 'Descrição da tag',
    example: 'Tickets que requerem atenção imediata',
  })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiPropertyOptional({
    description: 'Se a tag está ativa',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
