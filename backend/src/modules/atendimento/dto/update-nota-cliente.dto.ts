import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateNotaClienteDto } from './create-nota-cliente.dto';

/**
 * DTO para atualizar nota do cliente
 * Permite atualizar apenas conteúdo e flag importante
 * Não permite alterar clienteId, ticketId ou empresaId após criação
 */
export class UpdateNotaClienteDto extends PartialType(
  OmitType(CreateNotaClienteDto, ['clienteId', 'ticketId', 'contatoTelefone', 'empresaId'] as const)
) { }
