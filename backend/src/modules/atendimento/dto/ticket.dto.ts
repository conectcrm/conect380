import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsArray,
  IsInt,
  Min,
  IsDateString,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  StatusTicket,
  PrioridadeTicket,
  SeveridadeTicket,
  NivelAtendimentoTicket,
  TipoTicket,
} from "../entities/ticket.entity";

export { StatusTicket, PrioridadeTicket, SeveridadeTicket, NivelAtendimentoTicket, TipoTicket };

export class CriarTicketDto {
  @ApiProperty({ description: "ID do contato/cliente" })
  @IsNotEmpty()
  @IsUUID()
  contatoId: string;

  @ApiProperty({ description: "ID do canal de comunicação" })
  @IsNotEmpty()
  @IsUUID()
  canalId: string;

  @ApiPropertyOptional({ description: "Assunto do ticket" })
  @IsOptional()
  @IsString()
  assunto?: string;

  @ApiPropertyOptional({ description: "Prioridade do ticket", enum: PrioridadeTicket })
  @IsOptional()
  @IsEnum(PrioridadeTicket)
  prioridade?: PrioridadeTicket;

  @ApiPropertyOptional({ description: "Severidade do ticket", enum: SeveridadeTicket })
  @IsOptional()
  @IsEnum(SeveridadeTicket)
  severity?: SeveridadeTicket;

  @ApiPropertyOptional({
    description: "Nível inicial atribuído (N1/N2/N3)",
    enum: NivelAtendimentoTicket,
    default: NivelAtendimentoTicket.N1,
  })
  @IsOptional()
  @IsEnum(NivelAtendimentoTicket)
  assignedLevel?: NivelAtendimentoTicket;

  @ApiPropertyOptional({ description: "Meta de SLA em minutos" })
  @IsOptional()
  @IsInt()
  @Min(1)
  slaTargetMinutes?: number;

  @ApiPropertyOptional({ description: "ID da fila para atribuição automática" })
  @IsOptional()
  @IsUUID()
  filaId?: string;

  // Novos campos (Sprint 1 - Unificação Ticket + Demanda)
  @ApiPropertyOptional({ description: "ID do cliente vinculado" })
  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @ApiPropertyOptional({ description: "Título do ticket/demanda" })
  @IsOptional()
  @IsString()
  titulo?: string;

  @ApiPropertyOptional({ description: "Descrição detalhada" })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiPropertyOptional({ description: "Tipo do ticket", enum: TipoTicket })
  @IsOptional()
  @IsEnum(TipoTicket)
  tipo?: TipoTicket;

  @ApiPropertyOptional({ description: "Data de vencimento" })
  @IsOptional()
  @IsDateString()
  dataVencimento?: Date;

  @ApiPropertyOptional({ description: "ID do responsável" })
  @IsOptional()
  @IsUUID()
  responsavelId?: string;

  @ApiPropertyOptional({ description: "ID do autor (quem criou)" })
  @IsOptional()
  @IsUUID()
  autorId?: string;

  @ApiPropertyOptional({ description: "Tags do ticket" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class AtualizarTicketDto {
  @ApiPropertyOptional({ description: "Status do ticket", enum: StatusTicket })
  @IsOptional()
  @IsEnum(StatusTicket)
  status?: StatusTicket;

  @ApiPropertyOptional({ description: "Prioridade do ticket", enum: PrioridadeTicket })
  @IsOptional()
  @IsEnum(PrioridadeTicket)
  prioridade?: PrioridadeTicket;

  @ApiPropertyOptional({ description: "Severidade do ticket", enum: SeveridadeTicket })
  @IsOptional()
  @IsEnum(SeveridadeTicket)
  severity?: SeveridadeTicket;

  @ApiPropertyOptional({ description: "Nível de atendimento (N1/N2/N3)", enum: NivelAtendimentoTicket })
  @IsOptional()
  @IsEnum(NivelAtendimentoTicket)
  assignedLevel?: NivelAtendimentoTicket;

  @ApiPropertyOptional({ description: "Motivo do escalonamento" })
  @IsOptional()
  @IsString()
  escalationReason?: string;

  @ApiPropertyOptional({ description: "Data/hora de escalonamento" })
  @IsOptional()
  @IsDateString()
  escalationAt?: Date;

  @ApiPropertyOptional({ description: "Meta de SLA em minutos" })
  @IsOptional()
  @IsInt()
  @Min(1)
  slaTargetMinutes?: number;

  @ApiPropertyOptional({ description: "Expiração do SLA" })
  @IsOptional()
  @IsDateString()
  slaExpiresAt?: Date;

  @ApiPropertyOptional({ description: "Assunto do ticket" })
  @IsOptional()
  @IsString()
  assunto?: string;

  @ApiPropertyOptional({ description: "ID do atendente" })
  @IsOptional()
  @IsUUID()
  atendenteId?: string;

  @ApiPropertyOptional({ description: "ID da fila" })
  @IsOptional()
  @IsUUID()
  filaId?: string;

  // Novos campos (Sprint 1 - Unificação Ticket + Demanda)
  @ApiPropertyOptional({ description: "ID do cliente vinculado" })
  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @ApiPropertyOptional({ description: "Título do ticket/demanda" })
  @IsOptional()
  @IsString()
  titulo?: string;

  @ApiPropertyOptional({ description: "Descrição detalhada" })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiPropertyOptional({ description: "Tipo do ticket", enum: TipoTicket })
  @IsOptional()
  @IsEnum(TipoTicket)
  tipo?: TipoTicket;

  @ApiPropertyOptional({ description: "Data de vencimento" })
  @IsOptional()
  @IsDateString()
  dataVencimento?: Date;

  @ApiPropertyOptional({ description: "ID do responsável" })
  @IsOptional()
  @IsUUID()
  responsavelId?: string;

  @ApiPropertyOptional({ description: "ID do autor (quem criou)" })
  @IsOptional()
  @IsUUID()
  autorId?: string;

  @ApiPropertyOptional({ description: "Tags do ticket" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class AtribuirTicketDto {
  @ApiProperty({ description: "ID do atendente" })
  @IsNotEmpty()
  @IsUUID()
  atendenteId: string;
}

export class FiltrarTicketsDto {
  @ApiPropertyOptional({ description: "Filtrar por status", enum: StatusTicket })
  @IsOptional()
  @IsEnum(StatusTicket)
  status?: StatusTicket;

  @ApiPropertyOptional({ description: "Filtrar por prioridade", enum: PrioridadeTicket })
  @IsOptional()
  @IsEnum(PrioridadeTicket)
  prioridade?: PrioridadeTicket;

  @ApiPropertyOptional({ description: "Filtrar por severidade", enum: SeveridadeTicket })
  @IsOptional()
  @IsEnum(SeveridadeTicket)
  severity?: SeveridadeTicket;

  @ApiPropertyOptional({ description: "Filtrar por nível", enum: NivelAtendimentoTicket })
  @IsOptional()
  @IsEnum(NivelAtendimentoTicket)
  assignedLevel?: NivelAtendimentoTicket;

  @ApiPropertyOptional({ description: "Filtrar por canal" })
  @IsOptional()
  @IsUUID()
  canalId?: string;

  @ApiPropertyOptional({ description: "Filtrar por fila" })
  @IsOptional()
  @IsUUID()
  filaId?: string;

  @ApiPropertyOptional({ description: "Filtrar por atendente" })
  @IsOptional()
  @IsUUID()
  atendenteId?: string;

  @ApiPropertyOptional({ description: "Filtrar por contato" })
  @IsOptional()
  @IsUUID()
  contatoId?: string;

  @ApiPropertyOptional({ description: "Buscar por texto" })
  @IsOptional()
  @IsString()
  busca?: string;
}

export class TransferirTicketDto {
  @ApiProperty({ description: "ID do atendente destino" })
  @IsNotEmpty()
  @IsUUID()
  atendenteId: string;

  @ApiProperty({ description: "Motivo da transferência" })
  @IsNotEmpty()
  @IsString()
  motivo: string;

  @ApiPropertyOptional({ description: "Nota interna" })
  @IsOptional()
  @IsString()
  notaInterna?: string;

  @ApiPropertyOptional({ description: "Notificar o atendente", default: true })
  @IsOptional()
  notificarAgente?: boolean;
}

export class EscalarTicketDto {
  @ApiProperty({ description: "Nível de atendimento destino", enum: NivelAtendimentoTicket })
  @IsNotEmpty()
  @IsEnum(NivelAtendimentoTicket)
  level: NivelAtendimentoTicket;

  @ApiProperty({ description: "Motivo do escalonamento" })
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: "Meta de SLA (minutos) para o nível escalonado" })
  @IsOptional()
  @IsInt()
  @Min(1)
  slaTargetMinutes?: number;

  @ApiPropertyOptional({ description: "Data/hora de expiração de SLA (ISO)" })
  @IsOptional()
  @IsDateString()
  slaExpiresAt?: Date;
}

export class DesescalarTicketDto {
  @ApiPropertyOptional({ description: "Motivo da desescalada" })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ReatribuirTicketDto {
  @ApiPropertyOptional({ description: "ID da fila destino" })
  @IsOptional()
  @IsUUID()
  filaId?: string;

  @ApiPropertyOptional({ description: "ID do atendente destino" })
  @IsOptional()
  @IsUUID()
  atendenteId?: string;

  @ApiPropertyOptional({ description: "Atualizar nível de atendimento", enum: NivelAtendimentoTicket })
  @IsOptional()
  @IsEnum(NivelAtendimentoTicket)
  assignedLevel?: NivelAtendimentoTicket;

  @ApiPropertyOptional({ description: "Atualizar severidade", enum: SeveridadeTicket })
  @IsOptional()
  @IsEnum(SeveridadeTicket)
  severity?: SeveridadeTicket;
}

export class EncerrarTicketDto {
  @ApiProperty({
    description: "Motivo do encerramento",
    enum: ["resolvido", "cancelado", "sem_resposta", "duplicado", "spam", "outro"],
  })
  @IsNotEmpty()
  @IsString()
  motivo: string;

  @ApiPropertyOptional({ description: "Observações do encerramento" })
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiPropertyOptional({ description: "Criar follow-up", default: false })
  @IsOptional()
  criarFollowUp?: boolean;

  @ApiPropertyOptional({ description: "Data do follow-up" })
  @IsOptional()
  dataFollowUp?: Date;

  @ApiPropertyOptional({ description: "Solicitar avaliação CSAT", default: false })
  @IsOptional()
  solicitarAvaliacao?: boolean;
}
