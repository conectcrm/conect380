import { PartialType } from '@nestjs/mapped-types';
import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';
import { CriarPlanoDto } from './criar-plano.dto';

export class AtualizarPlanoDto extends PartialType(CriarPlanoDto) {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  modulosInclusos: string[];
}
