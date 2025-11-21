import { IsString, IsOptional, IsEnum, IsBoolean, IsObject } from 'class-validator';

export class ConfigurarIntegracaoDto {
  @IsEnum([
    'whatsapp_business',
    'telegram',
    'twilio',
    'sendgrid',
    'ses',
    'smtp',
    'openai',
    'anthropic',
  ])
  provider: string;

  @IsObject()
  credenciais: Record<string, any>;

  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @IsOptional()
  @IsObject()
  configuracoes?: Record<string, any>;
}

export class AtualizarIntegracaoDto {
  @IsOptional()
  @IsObject()
  credenciais?: Record<string, any>;

  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsObject()
  configuracoes?: Record<string, any>;
}

export class TestarIntegracaoDto {
  @IsString()
  integracaoId: string;
}
