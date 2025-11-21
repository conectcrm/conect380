import { IsString, IsBoolean, IsOptional, IsUUID, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para criar nota do cliente
 */
export class CreateNotaClienteDto {
  @ApiPropertyOptional({
    description: 'UUID do cliente (CRM)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @ApiPropertyOptional({
    description: 'UUID do ticket relacionado',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsUUID()
  ticketId?: string;

  @ApiPropertyOptional({
    description: 'Telefone do contato (fallback quando não há clienteId)',
    example: '+5511999999999',
  })
  @IsOptional()
  @IsString()
  contatoTelefone?: string;

  @ApiProperty({
    description: 'Conteúdo da nota',
    example: 'Cliente prefere contato por WhatsApp. Sempre disponível à tarde.',
  })
  @IsString()
  @MinLength(1, { message: 'O conteúdo não pode estar vazio' })
  @MaxLength(5000, { message: 'O conteúdo não pode ter mais de 5000 caracteres' })
  conteudo: string;

  @ApiPropertyOptional({
    description: 'Marca a nota como importante/destacada',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  importante?: boolean;

  @ApiPropertyOptional({
    description: 'UUID da empresa (multi-tenant) - preenchido automaticamente se não fornecido',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsOptional()
  @IsUUID()
  empresaId?: string;
}
