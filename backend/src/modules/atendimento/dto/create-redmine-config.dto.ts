import { IsString, IsInt, IsBoolean, IsOptional, IsUrl, IsObject } from 'class-validator';

export class CreateRedmineConfigDto {
  @IsUrl()
  redmineUrl: string;

  @IsString()
  redmineApiKey: string;

  @IsInt()
  redmineProjectId: number;

  @IsInt()
  @IsOptional()
  redmineCustomFieldId?: number;

  @IsObject()
  @IsOptional()
  mapeamentoTrackers?: {
    TECNICA?: number;
    COMERCIAL?: number;
    FINANCEIRA?: number;
    SUPORTE?: number;
    RECLAMACAO?: number;
    SOLICITACAO?: number;
    OUTROS?: number;
  };

  @IsObject()
  @IsOptional()
  mapeamentoStatus?: {
    ABERTA?: number;
    EM_ANDAMENTO?: number;
    AGUARDANDO?: number;
    CONCLUIDA?: number;
    CANCELADA?: number;
  };

  @IsObject()
  @IsOptional()
  mapeamentoPrioridade?: {
    BAIXA?: number;
    MEDIA?: number;
    ALTA?: number;
    URGENTE?: number;
  };

  @IsBoolean()
  @IsOptional()
  sincronizacaoAutomatica?: boolean;

  @IsBoolean()
  @IsOptional()
  sincronizacaoBidirecional?: boolean;

  @IsInt()
  @IsOptional()
  intervaloPolling?: number;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
