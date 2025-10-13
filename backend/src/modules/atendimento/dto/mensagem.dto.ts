import { IsString, IsOptional, IsEnum, IsUUID, IsObject } from 'class-validator';
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
