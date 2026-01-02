import { PartialType } from '@nestjs/mapped-types';
import { CreateStatusCustomizadoDto } from './create-status-customizado.dto';

export class UpdateStatusCustomizadoDto extends PartialType(CreateStatusCustomizadoDto) { }
