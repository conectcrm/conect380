import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateDemandaDto } from './create-demanda.dto';

/**
 * DTO para atualização de demanda
 *
 * Permite atualizar:
 * - titulo, descricao
 * - tipo, prioridade, status
 * - dataVencimento, responsavelId
 *
 * Campos imutáveis (não podem ser atualizados):
 * - clienteId, ticketId, contatoTelefone
 * - empresaId (definido na criação)
 */
export class UpdateDemandaDto extends PartialType(
  OmitType(CreateDemandaDto, ['clienteId', 'ticketId', 'contatoTelefone', 'empresaId'] as const),
) {}
