import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class TestSmtpDto {
  @IsOptional()
  @IsString()
  servidorSMTP?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  portaSMTP?: number;

  @IsOptional()
  @IsString()
  smtpUsuario?: string;

  @IsOptional()
  @IsString()
  smtpSenha?: string;
}
