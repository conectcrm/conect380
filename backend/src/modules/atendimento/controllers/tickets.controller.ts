import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../../common/guards/empresa.guard';
import { EmpresaId } from '../../../common/decorators/empresa.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Permission } from '../../../common/permissions/permissions.constants';
import { Ticket, StatusTicket, PrioridadeTicket } from '../entities/ticket.entity';
import { Mensagem } from '../entities/mensagem.entity';
import { Tag } from '../entities/tag.entity';
import { AtendimentoGateway } from '../gateways/atendimento.gateway';
import { OnlineStatusService } from '../services/online-status.service';
import { CriarTicketDto, AtualizarTicketDto, AtribuirTicketDto, FiltrarTicketsDto } from '../dto';

@Controller('atendimento/tickets')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.ATENDIMENTO_TICKETS_READ)
export class TicketsController {
  constructor(
    @InjectRepository(Ticket)
    private ticketRepo: Repository<Ticket>,

    @InjectRepository(Mensagem)
    private mensagemRepo: Repository<Mensagem>,

    @InjectRepository(Tag)
    private tagRepo: Repository<Tag>,

    private atendimentoGateway: AtendimentoGateway,
    private onlineStatusService: OnlineStatusService,
  ) {}

  @Get()
  async listar(@EmpresaId() empresaId: string, @Query() filtros: FiltrarTicketsDto) {
    try {
      const where: Record<string, unknown> = { empresaId };

      if (filtros.status) {
        const statusFiltro = filtros.status.toString().toLowerCase();

        switch (statusFiltro) {
          case 'aberto':
            where.status = In([StatusTicket.FILA, StatusTicket.EM_ATENDIMENTO]);
            break;
          case 'em_atendimento':
            where.status = StatusTicket.EM_ATENDIMENTO;
            break;
          case 'retorno':
          case 'aguardando':
          case 'aguardando_cliente':
          case 'aguardando_cliente_bot':
          case 'pendente':
          case 'follow_up':
            where.status = StatusTicket.AGUARDANDO_CLIENTE;
            break;
          case 'resolvido':
            where.status = In([StatusTicket.CONCLUIDO, StatusTicket.ENCERRADO]);
            break;
          case 'fechado':
            where.status = StatusTicket.ENCERRADO;
            break;
          default:
            where.status = statusFiltro.toUpperCase();
            break;
        }
      }
      if (filtros.canalId) where.canalId = filtros.canalId;
      if (filtros.filaId) where.filaId = filtros.filaId;
      if (filtros.atendenteId) where.atendenteId = filtros.atendenteId;
      if (filtros.prioridade) where.prioridade = filtros.prioridade;

      const tickets = await this.ticketRepo.find({
        where,
        order: { createdAt: 'DESC' },
        take: 100,
      });

      // 🟢 Enriquecer tickets com status online dos contatos
      const ticketsEnriquecidos = await Promise.all(
        tickets.map(async (ticket) => {
          let contatoOnline = false;

          // Calcular status online baseado na última atividade
          if (ticket.contatoTelefone) {
            // Buscar última atividade do contato por telefone
            const lastActivity = await this.ticketRepo.query(
              `
              SELECT MAX(contato_last_activity) as last_activity
              FROM atendimento_tickets
              WHERE contato_telefone = $1
                AND empresa_id = $2
                AND contato_last_activity IS NOT NULL
            `,
              [ticket.contatoTelefone, empresaId],
            );

            if (lastActivity.length > 0 && lastActivity[0].last_activity) {
              contatoOnline = this.onlineStatusService.calculateOnlineStatus(
                new Date(lastActivity[0].last_activity),
              );
            }
          }

          return {
            ...ticket,
            contato: {
              id: ticket.contatoTelefone || ticket.id,
              nome: ticket.contatoNome || 'Sem nome',
              telefone: ticket.contatoTelefone || '',
              email: '', // Campo não está na entidade atual
              online: contatoOnline,
            },
          };
        }),
      );

      return {
        success: true,
        data: ticketsEnriquecidos,
        total: ticketsEnriquecidos.length,
      };
    } catch (error) {
      console.error('❌ [TicketsController] Erro ao listar tickets:', error);
      throw error;
    }
  }

  @Get(':id')
  async buscarPorId(@EmpresaId() empresaId: string, @Param('id') id: string) {
    const ticket = await this.ticketRepo.findOne({
      where: { id, empresaId },
    });

    if (!ticket) {
      return {
        success: false,
        message: 'Ticket não encontrado',
      };
    }

    // Buscar mensagens do ticket
    const mensagens = await this.mensagemRepo.find({
      where: { ticketId: id, empresaId },
      order: { createdAt: 'ASC' },
    });

    return {
      success: true,
      data: {
        ticket,
        mensagens,
      },
    };
  }

  @Post()
  @Permissions(Permission.ATENDIMENTO_TICKETS_CREATE)
  async criar(@EmpresaId() empresaId: string, @Body() dto: CriarTicketDto) {
    // Separar tags do DTO (não pode ir direto no create)
    const { tags: tagIds, ...ticketData } = dto;

    const ticket = this.ticketRepo.create({
      ...ticketData,
      empresaId,
      status: StatusTicket.FILA,
      prioridade: dto.prioridade || PrioridadeTicket.MEDIA,
    });

    await this.ticketRepo.save(ticket);

    // Se tags foram fornecidas, carregar e associar
    if (tagIds && tagIds.length > 0) {
      const tags = await this.tagRepo.find({
        where: {
          id: In(tagIds),
          empresaId,
        },
      });
      ticket.tags = tags;
      await this.ticketRepo.save(ticket);
    }

    // 🔥 EMITIR EVENTO WEBSOCKET - Novo ticket criado
    this.atendimentoGateway.notificarNovoTicket(ticket);

    return {
      success: true,
      message: 'Ticket criado com sucesso',
      data: ticket,
    };
  }

  @Put(':id')
  @Permissions(Permission.ATENDIMENTO_TICKETS_UPDATE)
  async atualizar(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Body() dto: AtualizarTicketDto,
  ) {
    const ticket = await this.ticketRepo.findOne({
      where: { id, empresaId },
    });

    if (!ticket) {
      return {
        success: false,
        message: 'Ticket não encontrado',
      };
    }

    Object.assign(ticket, dto);
    await this.ticketRepo.save(ticket);

    // 🔥 EMITIR EVENTO WEBSOCKET - Status/dados do ticket atualizados
    this.atendimentoGateway.notificarStatusTicket(ticket.id, ticket.status, ticket);

    return {
      success: true,
      message: 'Ticket atualizado com sucesso',
      data: ticket,
    };
  }

  @Post(':id/atribuir')
  @Permissions(Permission.ATENDIMENTO_TICKETS_ASSIGN)
  async atribuir(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Body() dto: AtribuirTicketDto,
  ) {
    const ticket = await this.ticketRepo.findOne({
      where: { id, empresaId },
    });

    if (!ticket) {
      return {
        success: false,
        message: 'Ticket não encontrado',
      };
    }

    ticket.atendenteId = dto.atendenteId;
    ticket.status = StatusTicket.EM_ATENDIMENTO;
    await this.ticketRepo.save(ticket);

    // 🔥 EMITIR EVENTO WEBSOCKET - Ticket atribuído a atendente
    this.atendimentoGateway.notificarAtribuicaoTicket(ticket.id, dto.atendenteId, ticket);

    return {
      success: true,
      message: 'Ticket atribuído com sucesso',
      data: ticket,
    };
  }

  @Delete(':id')
  @Permissions(Permission.ATENDIMENTO_TICKETS_CLOSE)
  async deletar(@EmpresaId() empresaId: string, @Param('id') id: string) {
    const ticket = await this.ticketRepo.findOne({
      where: { id, empresaId },
    });

    if (!ticket) {
      return {
        success: false,
        message: 'Ticket não encontrado',
      };
    }

    await this.ticketRepo.softDelete(id);

    return {
      success: true,
      message: 'Ticket excluído com sucesso',
    };
  }

  @Get('estatisticas/geral')
  async estatisticas(@EmpresaId() empresaId: string) {
    const [totalAbertos, totalEmAtendimento, totalResolvidos, totalFechados] = await Promise.all([
      this.ticketRepo.count({ where: { empresaId, status: StatusTicket.FILA } }),
      this.ticketRepo.count({ where: { empresaId, status: StatusTicket.EM_ATENDIMENTO } }),
      this.ticketRepo.count({ where: { empresaId, status: StatusTicket.CONCLUIDO } }),
      this.ticketRepo.count({ where: { empresaId, status: StatusTicket.ENCERRADO } }),
    ]);

    return {
      success: true,
      data: {
        totalAbertos,
        totalEmAtendimento,
        totalResolvidos,
        totalFechados,
        total: totalAbertos + totalEmAtendimento + totalResolvidos + totalFechados,
      },
    };
  }

  /* ENDPOINTS COMENTADOS - Requerem Historico e OrquestradorService

  @Post(':id/transferir')
  async transferir(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: TransferirTicketDto,
  ) {
    const empresaId = req.user.empresa_id || req.user.empresaId;

    const ticket = await this.ticketRepo.findOne({
      where: { id, empresaId },
    });

    if (!ticket) {
      return {
        success: false,
        message: 'Ticket não encontrado',
      };
    }

    const filaAnterior = ticket.filaId;

    ticket.filaId = dto.filaId;
    ticket.atendenteId = null;
    ticket.status = StatusTicket.AGUARDANDO_CLIENTE;
    await this.ticketRepo.save(ticket);

    await this.orquestradorService.distribuirTicketAutomaticamente(ticket);

    return {
      success: true,
      message: 'Ticket transferido com sucesso',
      data: ticket,
    };
  }

  @Post(':id/fechar')
  async fechar(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: FecharTicketDto,
  ) {
    const empresaId = req.user.empresa_id || req.user.empresaId;

    const ticket = await this.ticketRepo.findOne({
      where: { id, empresaId },
    });

    if (!ticket) {
      return {
        success: false,
        message: 'Ticket não encontrado',
      };
    }

    ticket.status = dto.status as StatusTicket || StatusTicket.CONCLUIDO;
    ticket.closedAt = new Date();
    await this.ticketRepo.save(ticket);

    return {
      success: true,
      message: 'Ticket fechado com sucesso',
      data: ticket,
    };
  }
  */
}
