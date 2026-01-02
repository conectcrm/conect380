import { IsString, IsEmail, IsOptional, IsEnum, IsNumber, IsObject, IsBoolean, MinLength } from 'class-validator';

export enum StatusEmpresa {
  TRIAL = 'trial',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled',
  PAST_DUE = 'past_due',
}

export class CreateEmpresaAdminDto {
  @IsString()
  @MinLength(3)
  nome: string;

  @IsString()
  @MinLength(14)
  cnpj: string; // 00.000.000/0000-00

  @IsEmail()
  email: string;

  @IsString()
  telefone: string;

  @IsOptional()
  @IsString()
  endereco?: string;

  @IsOptional()
  @IsString()
  cidade?: string;

  @IsOptional()
  @IsString()
  estado?: string; // 2 letras (UF)

  @IsOptional()
  @IsString()
  cep?: string;

  @IsString()
  plano: string; // starter, business, enterprise

  @IsOptional()
  @IsEnum(StatusEmpresa)
  status?: StatusEmpresa; // default: trial

  @IsOptional()
  @IsNumber()
  valor_mensal?: number;

  @IsOptional()
  @IsString()
  trial_days?: number; // Dias de trial (default: 7)

  @IsOptional()
  @IsObject()
  limites?: {
    usuarios?: number;
    clientes?: number;
    armazenamento?: string;
  };

  @IsOptional()
  @IsString()
  account_manager_id?: string;

  @IsOptional()
  @IsString()
  notas_internas?: string;

  // Dados do usuário admin da empresa
  @IsString()
  @MinLength(3)
  admin_nome: string;

  @IsEmail()
  admin_email: string;

  @IsString()
  @MinLength(6)
  admin_senha: string;
}
