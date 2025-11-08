import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsIn,
  IsObject,
} from 'class-validator';

export class CreateSlaConfigDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  nome: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsString()
  @IsIn(['baixa', 'normal', 'alta', 'urgente'], {
    message: 'Prioridade deve ser: baixa, normal, alta ou urgente',
  })
  prioridade: string;

  @IsString()
  @IsOptional()
  canal?: string;

  @IsInt({ message: 'Tempo de resposta deve ser um número inteiro' })
  @Min(1, { message: 'Tempo de resposta deve ser no mínimo 1 minuto' })
  tempoRespostaMinutos: number;

  @IsInt({ message: 'Tempo de resolução deve ser um número inteiro' })
  @Min(1, { message: 'Tempo de resolução deve ser no mínimo 1 minuto' })
  tempoResolucaoMinutos: number;

  @IsObject()
  @IsOptional()
  horariosFuncionamento?: any;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  alertaPercentual?: number;

  @IsBoolean()
  @IsOptional()
  notificarEmail?: boolean;

  @IsBoolean()
  @IsOptional()
  notificarSistema?: boolean;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
