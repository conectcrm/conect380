import { IsString, IsEmail, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { StatusLead, OrigemLead } from '../lead.entity';

export class CreateLeadDto {
  @IsString()
  nome: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  telefone?: string;

  @IsString()
  @IsOptional()
  empresa_nome?: string;

  @IsEnum(StatusLead)
  @IsOptional()
  status?: StatusLead;

  @IsEnum(OrigemLead)
  @IsOptional()
  origem?: OrigemLead;

  @IsString()
  @IsOptional()
  observacoes?: string;

  @IsString()
  @IsOptional()
  responsavel_id?: string;

  @IsOptional()
  campos_customizados?: any;
}

export class UpdateLeadDto {
  @IsString()
  @IsOptional()
  nome?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  telefone?: string;

  @IsString()
  @IsOptional()
  empresa_nome?: string;

  @IsEnum(StatusLead)
  @IsOptional()
  status?: StatusLead;

  @IsEnum(OrigemLead)
  @IsOptional()
  origem?: OrigemLead;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  score?: number;

  @IsString()
  @IsOptional()
  observacoes?: string;

  @IsString()
  @IsOptional()
  responsavel_id?: string;

  @IsOptional()
  campos_customizados?: any;
}

export class ConvertLeadDto {
  @IsString()
  @IsOptional()
  estagio?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  valor?: number;

  @IsString()
  @IsOptional()
  descricao?: string;
}

export class CaptureLeadDto {
  @IsString()
  nome: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  telefone?: string;

  @IsString()
  @IsOptional()
  empresa_nome?: string;

  @IsString()
  @IsOptional()
  mensagem?: string;

  @IsString()
  @IsOptional()
  origem_url?: string; // URL de onde veio o lead (rastreamento)
}

export interface LeadFiltros {
  status?: StatusLead;
  origem?: OrigemLead;
  responsavel_id?: string;
  dataInicio?: string;
  dataFim?: string;
  busca?: string; // Busca em nome, email, empresa
  page?: number;
  limit?: number;
}

export interface PaginatedLeads {
  data: any[]; // Lead[]
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LeadEstatisticas {
  total: number;
  novos: number;
  contatados: number;
  qualificados: number;
  desqualificados: number;
  convertidos: number;
  taxaConversao: number;
  scoreMedio: number;
  porOrigem: {
    origem: string;
    quantidade: number;
  }[];
  porResponsavel: {
    responsavel_id: string;
    responsavel_nome: string;
    quantidade: number;
  }[];
}

export interface ImportLeadRow {
  nome: string;
  email?: string;
  telefone?: string;
  empresa_nome?: string;
  origem?: string;
  observacoes?: string;
  responsavel_email?: string; // Para mapear responsável por email
}

export interface ImportLeadResult {
  total: number;
  importados: number;
  erros: number;
  detalhes: {
    linha: number;
    erro: string;
    dados?: any;
  }[];
}
