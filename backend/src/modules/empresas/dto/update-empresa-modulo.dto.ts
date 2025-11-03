import { PartialType } from '@nestjs/mapped-types';
import { CreateEmpresaModuloDto } from './create-empresa-modulo.dto';

export class UpdateEmpresaModuloDto extends PartialType(CreateEmpresaModuloDto) {}
