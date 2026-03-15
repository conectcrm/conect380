import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
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
