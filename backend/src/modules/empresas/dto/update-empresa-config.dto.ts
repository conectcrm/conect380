import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUrl, Max, Min } from 'class-validator';

export class UpdateEmpresaConfigDto {
  // Geral
  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsUrl()
  site?: string;

  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  corPrimaria?: string;

  @IsOptional()
  @IsString()
  corSecundaria?: string;

  // Segurança
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

  // Usuários
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  limiteUsuarios?: number;

  @IsOptional()
  @IsBoolean()
  aprovacaoNovoUsuario?: boolean;

  // Notificações
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

  // Integrações
  @IsOptional()
  @IsBoolean()
  apiHabilitada?: boolean;

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
