import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsNumber,
  IsObject,
  IsBoolean,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateEmpresaAdminDto, StatusEmpresa } from './create-empresa-admin.dto';

export class UpdateEmpresaAdminDto extends PartialType(CreateEmpresaAdminDto) {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsOptional()
  @IsString()
  endereco?: string;

  @IsOptional()
  @IsString()
  cidade?: string;

  @IsOptional()
  @IsString()
  estado?: string;

  @IsOptional()
  @IsString()
  cep?: string;

  @IsOptional()
  @IsString()
  plano?: string;

  @IsOptional()
  @IsEnum(StatusEmpresa)
  status?: StatusEmpresa;

  @IsOptional()
  @IsNumber()
  valor_mensal?: number;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

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

  @IsOptional()
  @IsString()
  logo_url?: string;

  @IsOptional()
  @IsString()
  stripe_customer_id?: string;

  @IsOptional()
  @IsString()
  stripe_subscription_id?: string;
}
