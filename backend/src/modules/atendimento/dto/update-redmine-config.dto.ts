import { PartialType } from '@nestjs/mapped-types';
import { CreateRedmineConfigDto } from './create-redmine-config.dto';

export class UpdateRedmineConfigDto extends PartialType(CreateRedmineConfigDto) {}
