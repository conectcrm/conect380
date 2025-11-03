import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum TipoFluxo {
  MENU_OPCOES = 'menu_opcoes',
  MENU_SIMPLES = 'menu_simples',
  ARVORE_DECISAO = 'arvore_decisao',
  KEYWORD_MATCH = 'keyword_match',
  COLETA_DADOS = 'coleta_dados',
  CONDICIONAL = 'condicional',
}

export enum TipoAcao {
  CRIAR_TICKET = 'criar_ticket',
  TRANSFERIR_HUMANO = 'transferir_humano',
  ENVIAR_MENSAGEM = 'enviar_mensagem',
  COLETAR_INFO = 'coletar_info',
  FINALIZAR = 'finalizar',
  PROXIMO_PASSO = 'proximo_passo',
  TRANSFERIR_NUCLEO = 'transferir_nucleo',
  TRANSFERIR_ATENDENTE = 'transferir_atendente',
  COLETAR_DADO = 'coletar_dado',
}

export class OpcaoMenuDto {
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  numero?: number;

  @IsString()
  @IsOptional()
  valor?: string;

  @IsString()
  @IsNotEmpty()
  texto: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsEnum(TipoAcao)
  @IsOptional()
  acao?: TipoAcao;

  @IsString()
  @IsOptional()
  proximaEtapa?: string;

  @IsString()
  @IsOptional()
  nucleoId?: string;

  @IsString()
  @IsOptional()
  atendenteId?: string;

  @IsString()
  @IsOptional()
  variavel?: string;

  @IsString()
  @IsOptional()
  mensagem?: string;

  @IsString()
  @IsOptional()
  icone?: string;

  @IsOptional()
  @IsIn(['baixa', 'media', 'alta', 'urgente'])
  prioridade?: 'baixa' | 'media' | 'alta' | 'urgente';

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class CondicaoDto {
  @IsString()
  @IsNotEmpty()
  variavel: string;

  @IsIn(['igual', 'diferente', 'contem', 'maior', 'menor'])
  @IsNotEmpty()
  operador: string;

  @IsString()
  @IsNotEmpty()
  valor: string;

  @IsString()
  @IsNotEmpty()
  proximaEtapa: string;
}

export class EtapaDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  mensagem: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OpcaoMenuDto)
  @IsOptional()
  opcoes?: OpcaoMenuDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CondicaoDto)
  @IsOptional()
  condicoes?: CondicaoDto[];

  @IsString()
  @IsOptional()
  proximaEtapa?: string;

  @IsBoolean()
  @IsOptional()
  aguardarResposta?: boolean;

  @IsString()
  @IsOptional()
  tipo?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  timeout?: number;

  @IsObject()
  @IsOptional()
  validacao?: Record<string, any>;
}

export class EstruturaFluxoDto {
  @IsString()
  @IsNotEmpty()
  etapaInicial: string;

  @IsString()
  @IsOptional()
  versao?: string;

  @IsObject()
  @IsNotEmpty()
  etapas: Record<string, EtapaDto>;

  @IsObject()
  @IsOptional()
  variaveis?: Record<string, any>;
}

export class CreateFluxoDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome do fluxo é obrigatório' })
  nome: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsString()
  @IsOptional()
  codigo?: string;

  @IsEnum(TipoFluxo)
  @IsNotEmpty({ message: 'O tipo do fluxo é obrigatório' })
  tipo: TipoFluxo;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  canais?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  palavrasGatilho?: string[];

  @IsObject()
  @IsOptional()
  horarioAtivo?: Record<string, any>;

  @IsNumber()
  @IsOptional()
  prioridade?: number;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;

  @IsObject()
  @ValidateNested()
  @Type(() => EstruturaFluxoDto)
  @IsNotEmpty({ message: 'A estrutura do fluxo é obrigatória' })
  estrutura: EstruturaFluxoDto;

  @IsBoolean()
  @IsOptional()
  permiteVoltar?: boolean;

  @IsBoolean()
  @IsOptional()
  permiteSair?: boolean;

  @IsBoolean()
  @IsOptional()
  salvarHistorico?: boolean;

  @IsBoolean()
  @IsOptional()
  tentarEntenderTextoLivre?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsNumber()
  @IsOptional()
  versao?: number;

  @IsObject()
  @IsOptional()
  configuracoes?: Record<string, any>;
}
