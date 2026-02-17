import { PartialType } from '@nestjs/mapped-types';
import { CreateTemplateMensagemDto } from './create-template-mensagem.dto';

export class UpdateTemplateMensagemDto extends PartialType(CreateTemplateMensagemDto) {}
