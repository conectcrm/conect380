import { PartialType } from '@nestjs/mapped-types';
import { CreateTipoServicoDto } from './create-tipo-servico.dto';

export class UpdateTipoServicoDto extends PartialType(CreateTipoServicoDto) {}
