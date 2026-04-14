import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';

export class UpdateEmpresaConfigDto {
  // Geral
  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsUrl()
  site?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  corPrimaria?: string;

  @IsOptional()
  @IsString()
  corSecundaria?: string;

  // Seguranca
  @IsOptional()
  @IsBoolean()
  autenticacao2FA?: boolean;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(480)
  sessaoExpiracaoMinutos?: number;

  @IsOptional()
  @IsEnum(['baixa', 'media', 'alta'])
  senhaComplexidade?: 'baixa' | 'media' | 'alta';

  @IsOptional()
  @IsBoolean()
  auditoria?: boolean;

  @IsOptional()
  @IsBoolean()
  forceSsl?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ipWhitelist?: string[];

  // Usuarios
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  limiteUsuarios?: number;

  @IsOptional()
  @IsBoolean()
  aprovacaoNovoUsuario?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(720)
  conviteExpiracaoHoras?: number;

  // Financeiro
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  alcadaAprovacaoFinanceira?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  comercialLimiteDescontoPercentual?: number;

  @IsOptional()
  @IsBoolean()
  comercialAprovacaoInternaHabilitada?: boolean;

  // Email/SMTP
  @IsOptional()
  @IsBoolean()
  emailsHabilitados?: boolean;

  @IsOptional()
  @IsString()
  servidorSMTP?: string;

  @IsOptional()
  @IsInt()
  portaSMTP?: number;

  @IsOptional()
  @IsString()
  smtpUsuario?: string;

  @IsOptional()
  @IsString()
  smtpSenha?: string;

  // Comunicacao
  @IsOptional()
  @IsBoolean()
  whatsappHabilitado?: boolean;

  @IsOptional()
  @IsString()
  whatsappNumero?: string;

  @IsOptional()
  @IsString()
  whatsappApiToken?: string;

  @IsOptional()
  @IsBoolean()
  smsHabilitado?: boolean;

  @IsOptional()
  @IsEnum(['twilio', 'nexmo', 'sinch'])
  smsProvider?: 'twilio' | 'nexmo' | 'sinch';

  @IsOptional()
  @IsString()
  smsApiKey?: string;

  @IsOptional()
  @IsBoolean()
  pushHabilitado?: boolean;

  @IsOptional()
  @IsEnum(['fcm', 'apns', 'onesignal'])
  pushProvider?: 'fcm' | 'apns' | 'onesignal';

  @IsOptional()
  @IsString()
  pushApiKey?: string;

  // Integracoes
  @IsOptional()
  @IsBoolean()
  apiHabilitada?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  webhooksAtivos?: number;

  @IsOptional()
  @IsIn(['mercadopago', 'mercado_pago', 'mercado-pago'])
  gatewayPagamentoProvider?: string;

  @IsOptional()
  @IsString()
  gatewayPagamentoAccessToken?: string;

  @IsOptional()
  @IsString()
  gatewayPagamentoWebhookSecret?: string;

  @IsOptional()
  @IsBoolean()
  inadimplenciaAutomacaoAtiva?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(90)
  inadimplenciaDiasAviso?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(365)
  inadimplenciaDiasAcao?: number;

  @IsOptional()
  @IsIn(['nenhuma', 'marcar_em_risco', 'bloquear_operacao', 'suspender_acesso'])
  inadimplenciaAcao?: 'nenhuma' | 'marcar_em_risco' | 'bloquear_operacao' | 'suspender_acesso';

  @IsOptional()
  @IsIn(['automatico', 'manual_com_sugestao'])
  inadimplenciaModoExecucao?: 'automatico' | 'manual_com_sugestao';

  @IsOptional()
  @IsIn(['cliente', 'servico', 'contrato', 'recorrencia'])
  inadimplenciaEscopo?: 'cliente' | 'servico' | 'contrato' | 'recorrencia';

  @IsOptional()
  @IsBoolean()
  inadimplenciaDesbloqueioAutomaticoNaBaixa?: boolean;

  // Integracoes fiscais (multi-CNPJ)
  @IsOptional()
  @IsString()
  fiscalProvider?: string;

  @IsOptional()
  @IsBoolean()
  fiscalOfficialHttpEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  fiscalRequireOfficialProvider?: boolean;

  @IsOptional()
  @IsString()
  fiscalOfficialBaseUrl?: string;

  @IsOptional()
  @IsBoolean()
  fiscalOfficialStrictResponse?: boolean;

  @IsOptional()
  @IsBoolean()
  fiscalOfficialWebhookAllowInsecure?: boolean;

  @IsOptional()
  @IsString()
  fiscalOfficialCorrelationHeader?: string;

  @IsOptional()
  @IsString()
  fiscalOfficialApiToken?: string;

  @IsOptional()
  @IsString()
  fiscalOfficialWebhookSecret?: string;

  // Backup
  @IsOptional()
  @IsBoolean()
  backupAutomatico?: boolean;

  @IsOptional()
  @IsEnum(['diario', 'semanal', 'mensal'])
  backupFrequencia?: 'diario' | 'semanal' | 'mensal';

  @IsOptional()
  @IsInt()
  @Min(7)
  @Max(365)
  backupRetencaoDias?: number;
}
