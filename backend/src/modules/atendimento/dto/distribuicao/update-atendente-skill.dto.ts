import { PartialType } from '@nestjs/mapped-types';
import { CreateAtendenteSkillDto } from './create-atendente-skill.dto';

export class UpdateAtendenteSkillDto extends PartialType(CreateAtendenteSkillDto) {}
