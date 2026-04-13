import { IsArray, IsNumber, IsOptional, IsString, IsUUID, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PropostaComissaoParticipanteConfigDto {
  @IsUUID()
  usuarioId: string;

  @IsNumber()
  @Min(-1000)
  @Max(1000)
  percentual: number;

  @IsOptional()
  @IsString()
  papel?: string;
}

export class PropostaComissaoConfigDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PropostaComissaoParticipanteConfigDto)
  participantes: PropostaComissaoParticipanteConfigDto[];

  @IsOptional()
  @IsString()
  observacoes?: string;
}

