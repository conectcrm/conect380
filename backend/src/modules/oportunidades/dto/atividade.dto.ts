import { IsString, IsEnum, IsOptional, IsDateString, IsInt } from 'class-validator';
import { TipoAtividade } from '../atividade.entity';

export class CreateAtividadeDto {
  @IsEnum(TipoAtividade)
  tipo: TipoAtividade;

  @IsOptional()
  @IsString()
  titulo?: string;

  @IsString()
  descricao: string;

  @IsOptional()
  @IsDateString()
  dataAtividade?: string;

  @IsOptional()
  @IsInt()
  oportunidade_id?: number;
}
