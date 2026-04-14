import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  Max,
  MaxLength,
  IsNumber,
  NotEquals,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CriarPlanoDto {
  @IsString()
  nome: string;

  @IsString()
  codigo: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsNumber()
  @Min(0)
  preco: number;

  @IsOptional()
  @IsIn(['mensal', 'anual'], {
    message: 'periodicidadeCobranca invalida. Use mensal ou anual.',
  })
  periodicidadeCobranca?: 'mensal' | 'anual';

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(365)
  diasTrial?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  gatewayPriceId?: string;

  @IsOptional()
  @IsBoolean()
  publicadoCheckout?: boolean;

  @IsNumber()
  @Min(-1) // -1 representa ilimitado
  @NotEquals(0, {
    message: 'limiteUsuarios nao pode ser 0. Use -1 para ilimitado ou inteiro >= 1.',
  })
  limiteUsuarios: number;

  @IsNumber()
  @Min(-1) // -1 representa ilimitado
  @NotEquals(0, {
    message: 'limiteClientes nao pode ser 0. Use -1 para ilimitado ou inteiro >= 1.',
  })
  limiteClientes: number;

  @IsNumber()
  @Min(-1) // -1 representa ilimitado
  @NotEquals(0, {
    message: 'limiteStorage nao pode ser 0. Use -1 para ilimitado ou inteiro >= 1.',
  })
  limiteStorage: number;

  @IsNumber()
  @Min(-1) // -1 representa ilimitado
  @NotEquals(0, {
    message: 'limiteApiCalls nao pode ser 0. Use -1 para ilimitado ou inteiro >= 1.',
  })
  limiteApiCalls: number;

  @IsOptional()
  @IsBoolean()
  whiteLabel?: boolean;

  @IsOptional()
  @IsBoolean()
  suportePrioritario?: boolean;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsNumber()
  ordem?: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  modulosInclusos: string[]; // IDs dos modulos
}
