import { PartialType } from '@nestjs/mapped-types';
import { CreateNivelAtendimentoDto } from './create-nivel-atendimento.dto';

export class UpdateNivelAtendimentoDto extends PartialType(CreateNivelAtendimentoDto) {}
