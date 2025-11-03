import { PartialType } from '@nestjs/mapped-types';
import { CreateNucleoDto } from './create-nucleo.dto';

export class UpdateNucleoDto extends PartialType(CreateNucleoDto) {
  // Todos os campos do CreateNucleoDto são opcionais aqui
  // PartialType do NestJS faz isso automaticamente
}
