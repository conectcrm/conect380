import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateMetaDto } from './create-meta.dto';

export class UpdateMetaDto extends PartialType(CreateMetaDto) {
  @IsBoolean()
  @IsOptional()
  ativa?: boolean;
}
