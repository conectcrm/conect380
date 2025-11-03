import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class PublicarFluxoDto {
  @IsBoolean()
  @IsOptional()
  ativo?: boolean;

  @IsString()
  @IsOptional()
  motivoPublicacao?: string;

  @IsBoolean()
  @IsOptional()
  criarNovaVersao?: boolean;
}
