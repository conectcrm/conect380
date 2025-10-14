import { IsString, IsOptional, IsEnum, IsUUID, IsObject, IsArray, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoMensagem, RemetenteMensagem } from '../entities/mensagem.entity';

export class CriarMensagemDto {
  @IsUUID()
  ticketId: string;

  @IsEnum(TipoMensagem)
  tipo: TipoMensagem;

  @IsString()
  conteudo: string;

  @IsEnum(RemetenteMensagem)
  remetente: RemetenteMensagem;

  @IsOptional()
  @IsObject()
  midia?: any;
}

export class BuscarMensagensDto {
  @IsUUID()
  ticketId: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsString()
  offset?: string;
}

export class EnviarMensagemDto {
  @ApiProperty({ description: 'ID do ticket' })
  @IsUUID()
  ticketId: string;

  @ApiProperty({ description: 'Conteúdo da mensagem' })
  @IsString()
  conteudo: string;

  @ApiPropertyOptional({ description: 'Tipo de remetente', enum: RemetenteMensagem })
  @IsOptional()
  @IsEnum(RemetenteMensagem)
  tipoRemetente?: RemetenteMensagem;

  @ApiPropertyOptional({ description: 'ID do remetente' })
  @IsOptional()
  @IsUUID()
  remetenteId?: string;

  @ApiPropertyOptional({ description: 'Duração do áudio em segundos' })
  @IsOptional()
  @IsNumber()
  duracaoAudio?: number;
}

export class MarcarLidasDto {
  @ApiProperty({ description: 'IDs das mensagens', type: [String] })
  @IsArray()
  @IsString({ each: true })
  mensagemIds: string[];
}
