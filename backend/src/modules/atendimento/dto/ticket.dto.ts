import { IsNotEmpty, IsString, IsOptional, IsEnum, IsUUID, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum StatusTicket {
  ABERTO = 'aberto',
  EM_ATENDIMENTO = 'em_atendimento',
  AGUARDANDO_CLIENTE = 'aguardando_cliente',
  RESOLVIDO = 'resolvido',
  FECHADO = 'fechado'
}

export enum PrioridadeTicket {
  BAIXA = 'baixa',
  MEDIA = 'media',
  ALTA = 'alta',
  URGENTE = 'urgente'
}

export class CriarTicketDto {
  @ApiProperty({ description: 'ID do contato/cliente' })
  @IsNotEmpty()
  @IsUUID()
  contatoId: string;

  @ApiProperty({ description: 'ID do canal de comunicação' })
  @IsNotEmpty()
  @IsUUID()
  canalId: string;

  @ApiPropertyOptional({ description: 'Assunto do ticket' })
  @IsOptional()
  @IsString()
  assunto?: string;

  @ApiPropertyOptional({ description: 'Prioridade do ticket', enum: PrioridadeTicket })
  @IsOptional()
  @IsEnum(PrioridadeTicket)
  prioridade?: PrioridadeTicket;

  @ApiPropertyOptional({ description: 'Tags do ticket' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class AtualizarTicketDto {
  @ApiPropertyOptional({ description: 'Status do ticket', enum: StatusTicket })
  @IsOptional()
  @IsEnum(StatusTicket)
  status?: StatusTicket;

  @ApiPropertyOptional({ description: 'Prioridade do ticket', enum: PrioridadeTicket })
  @IsOptional()
  @IsEnum(PrioridadeTicket)
  prioridade?: PrioridadeTicket;

  @ApiPropertyOptional({ description: 'Assunto do ticket' })
  @IsOptional()
  @IsString()
  assunto?: string;

  @ApiPropertyOptional({ description: 'ID do atendente' })
  @IsOptional()
  @IsUUID()
  atendenteId?: string;

  @ApiPropertyOptional({ description: 'Tags do ticket' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class AtribuirTicketDto {
  @ApiProperty({ description: 'ID do atendente' })
  @IsNotEmpty()
  @IsUUID()
  atendenteId: string;
}

export class FiltrarTicketsDto {
  @ApiPropertyOptional({ description: 'Filtrar por status', enum: StatusTicket })
  @IsOptional()
  @IsEnum(StatusTicket)
  status?: StatusTicket;

  @ApiPropertyOptional({ description: 'Filtrar por prioridade', enum: PrioridadeTicket })
  @IsOptional()
  @IsEnum(PrioridadeTicket)
  prioridade?: PrioridadeTicket;

  @ApiPropertyOptional({ description: 'Filtrar por canal' })
  @IsOptional()
  @IsUUID()
  canalId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por fila' })
  @IsOptional()
  @IsUUID()
  filaId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por atendente' })
  @IsOptional()
  @IsUUID()
  atendenteId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por contato' })
  @IsOptional()
  @IsUUID()
  contatoId?: string;

  @ApiPropertyOptional({ description: 'Buscar por texto' })
  @IsOptional()
  @IsString()
  busca?: string;
}
