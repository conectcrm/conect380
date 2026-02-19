import { IsString, IsEnum, IsOptional, IsDateString, IsUUID } from 'class-validator';
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
  @IsUUID('4')
  oportunidade_id?: string;
}
