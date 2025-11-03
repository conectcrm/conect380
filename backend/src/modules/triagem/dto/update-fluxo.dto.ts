import { PartialType } from '@nestjs/mapped-types';
import { CreateFluxoDto } from './create-fluxo.dto';

export class UpdateFluxoDto extends PartialType(CreateFluxoDto) {
  // Todos os campos do CreateFluxoDto são opcionais aqui
}
