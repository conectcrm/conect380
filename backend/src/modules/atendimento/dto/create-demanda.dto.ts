import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDemandaDto {
  @ApiPropertyOptional({ description: 'ID do cliente (UUID)' })
  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @ApiPropertyOptional({ description: 'ID do ticket relacionado (UUID)' })
  @IsOptional()
  @IsUUID()
  ticketId?: string;

  @ApiPropertyOptional({ description: 'Telefone do contato (fallback quando não há cliente)' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  contatoTelefone?: string;

  @ApiPropertyOptional({
    description: 'ID da empresa (UUID) - preenchido automaticamente se não fornecido',
  })
  @IsOptional()
  @IsUUID()
  empresaId?: string;

  @ApiProperty({ description: 'Título resumido da demanda (máx 200 caracteres)' })
  @IsString()
  @MinLength(3, { message: 'Título deve ter no mínimo 3 caracteres' })
  @MaxLength(200, { message: 'Título deve ter no máximo 200 caracteres' })
  titulo: string;

  @ApiPropertyOptional({ description: 'Descrição detalhada da demanda' })
  @IsOptional()
  @IsString()
  @MaxLength(5000, { message: 'Descrição deve ter no máximo 5000 caracteres' })
  descricao?: string;

  @ApiPropertyOptional({
    description: 'Tipo da demanda',
    enum: ['tecnica', 'comercial', 'financeira', 'suporte', 'reclamacao', 'solicitacao', 'outros'],
    default: 'outros',
  })
  @IsOptional()
  @IsEnum(['tecnica', 'comercial', 'financeira', 'suporte', 'reclamacao', 'solicitacao', 'outros'])
  tipo?:
    | 'tecnica'
    | 'comercial'
    | 'financeira'
    | 'suporte'
    | 'reclamacao'
    | 'solicitacao'
    | 'outros';

  @ApiPropertyOptional({
    description: 'Prioridade da demanda',
    enum: ['baixa', 'media', 'alta', 'urgente'],
    default: 'media',
  })
  @IsOptional()
  @IsEnum(['baixa', 'media', 'alta', 'urgente'])
  prioridade?: 'baixa' | 'media' | 'alta' | 'urgente';

  @ApiPropertyOptional({
    description: 'Status da demanda',
    enum: ['aberta', 'em_andamento', 'aguardando', 'concluida', 'cancelada'],
    default: 'aberta',
  })
  @IsOptional()
  @IsEnum(['aberta', 'em_andamento', 'aguardando', 'concluida', 'cancelada'])
  status?: 'aberta' | 'em_andamento' | 'aguardando' | 'concluida' | 'cancelada';

  @ApiPropertyOptional({ description: 'Data de vencimento (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dataVencimento?: string;

  @ApiPropertyOptional({ description: 'ID do responsável pela demanda (UUID)' })
  @IsOptional()
  @IsUUID()
  responsavelId?: string;
}
