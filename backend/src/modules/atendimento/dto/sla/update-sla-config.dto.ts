import { PartialType } from '@nestjs/mapped-types';
import { CreateSlaConfigDto } from './create-sla-config.dto';

export class UpdateSlaConfigDto extends PartialType(CreateSlaConfigDto) { }
