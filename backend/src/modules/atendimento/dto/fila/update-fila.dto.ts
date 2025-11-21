import { PartialType } from '@nestjs/mapped-types';
import { CreateFilaDto } from './create-fila.dto';

/**
 * DTO para atualização de uma fila existente
 * Todos os campos são opcionais (semântica PATCH)
 */
export class UpdateFilaDto extends PartialType(CreateFilaDto) { }
