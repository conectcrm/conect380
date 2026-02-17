import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsNumber,
  IsEnum,
  Min,
  Max,
} from 'class-validator';

/**
 * Tipos de recursos que podem ser buscados
 */
export enum TipoRecursoBusca {
  PROPOSTA = 'PROPOSTA',
  FATURA = 'FATURA',
  CLIENTE = 'CLIENTE',
  PEDIDO = 'PEDIDO',
  TICKET = 'TICKET',
}

/**
 * DTO para requisição de busca global
 */
export class BuscaGlobalRequestDto {
  @IsString()
  @IsNotEmpty()
  query: string;

  @IsOptional()
  @IsArray()
  @IsEnum(TipoRecursoBusca, { each: true })
  tipos?: TipoRecursoBusca[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limite?: number = 10;
}

/**
 * DTO para um resultado individual de busca
 */
export class ResultadoBuscaDto {
  tipo: TipoRecursoBusca;
  id: string;
  titulo: string;
  subtitulo: string;
  status: string;
  valor?: number;
  data: Date;
  relevancia: number; // 0-1
  highlight?: string; // Termo que foi encontrado

  // Dados completos do recurso
  dados: any;
}

/**
 * DTO para resposta da busca global
 */
export class BuscaGlobalResponseDto {
  resultados: ResultadoBuscaDto[];
  totalResultados: number;
  tempoMs: number;

  // Contadores por tipo
  contadores: {
    propostas: number;
    faturas: number;
    clientes: number;
    pedidos: number;
    tickets: number;
  };
}
