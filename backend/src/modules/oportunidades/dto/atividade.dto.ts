import { IsString, IsEnum, IsNumber, IsOptional, IsDateString } from 'class-validator';
import { TipoAtividade } from '../atividade.entity';

export class CreateAtividadeDto {
  @IsEnum(TipoAtividade)
  tipo: TipoAtividade;

  @IsString()
  descricao: string;

  @IsOptional()
  @IsDateString()
  dataAtividade?: string;

  @IsNumber()
  oportunidade_id: number;
}
