import { PartialType } from '@nestjs/mapped-types';
import { CreateDistribuicaoConfigDto } from './create-distribuicao-config.dto';

export class UpdateDistribuicaoConfigDto extends PartialType(CreateDistribuicaoConfigDto) { }
