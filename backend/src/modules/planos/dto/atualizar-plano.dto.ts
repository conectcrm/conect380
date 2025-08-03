import { PartialType } from '@nestjs/mapped-types';
import { CriarPlanoDto } from './criar-plano.dto';

export class AtualizarPlanoDto extends PartialType(CriarPlanoDto) { }
