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
  Req,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Ticket, StatusTicket, OrigemTicket, PrioridadeTicket } from '../entities/ticket.entity';
import { Mensagem } from '../entities/mensagem.entity';
import { AtendimentoGateway } from '../gateways/atendimento.gateway';
import {
  CriarTicketDto,
  AtualizarTicketDto,
  AtribuirTicketDto,
  FiltrarTicketsDto,
} from '../dto';

@Controller('atendimento/tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(
    @InjectRepository(Ticket)
    private ticketRepo: Repository<Ticket>,

    @InjectRepository(Mensagem)
    private mensagemRepo: Repository<Mensagem>,

    private atendimentoGateway: AtendimentoGateway,
  ) { }

  @Get()
  async listar(@Req() req, @Query() filtros: FiltrarTicketsDto) {
    try {
      const empresaId = req.user.empresa_id || req.user.empresaId;

      const where: any = { empresaId };

      if (filtros.status) where.status = filtros.status;
      if (filtros.canalId) where.canalId = filtros.canalId;
      if (filtros.filaId) where.filaId = filtros.filaId;
      if (filtros.atendenteId) where.atendenteId = filtros.atendenteId;
      if (filtros.prioridade) where.prioridade = filtros.prioridade;

      const tickets = await this.ticketRepo.find({
        where,
        order: { createdAt: 'DESC' },
        take: 100,
      });

      return {
        success: true,
        data: tickets,
        total: tickets.length,
      };
    } catch (error) {
      console.error('❌ [TicketsController] Erro ao listar tickets:', error);
      throw error;
    }
  }

  @Get(':id')
  async buscarPorId(@Req() req, @Param('id') id: string) {
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

    // Buscar mensagens do ticket
    const mensagens = await this.mensagemRepo.find({
      where: { ticketId: id },
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
  async criar(@Req() req, @Body() dto: CriarTicketDto) {
    const empresaId = req.user.empresa_id || req.user.empresaId;

    const ticket = this.ticketRepo.create({
      ...dto,
      empresaId,
      status: StatusTicket.ABERTO,
      prioridade: dto.prioridade || PrioridadeTicket.MEDIA,
    });

    await this.ticketRepo.save(ticket);

    // 🔥 EMITIR EVENTO WEBSOCKET - Novo ticket criado
    this.atendimentoGateway.notificarNovoTicket(ticket);

    return {
      success: true,
      message: 'Ticket criado com sucesso',
      data: ticket,
    };
  }

  @Put(':id')
  async atualizar(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: AtualizarTicketDto,
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

    Object.assign(ticket, dto);
    await this.ticketRepo.save(ticket);

    // 🔥 EMITIR EVENTO WEBSOCKET - Status/dados do ticket atualizados
    this.atendimentoGateway.notificarStatusTicket(
      ticket.id,
      ticket.status,
      ticket,
    );

    return {
      success: true,
      message: 'Ticket atualizado com sucesso',
      data: ticket,
    };
  }

  @Post(':id/atribuir')
  async atribuir(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: AtribuirTicketDto,
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

    ticket.atendenteId = dto.atendenteId;
    ticket.status = StatusTicket.EM_ATENDIMENTO;
    await this.ticketRepo.save(ticket);

    // 🔥 EMITIR EVENTO WEBSOCKET - Ticket atribuído a atendente
    this.atendimentoGateway.notificarAtribuicaoTicket(
      ticket.id,
      dto.atendenteId,
      ticket,
    );

    return {
      success: true,
      message: 'Ticket atribuído com sucesso',
      data: ticket,
    };
  }

  @Delete(':id')
  async deletar(@Req() req, @Param('id') id: string) {
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

    await this.ticketRepo.softDelete(id);

    return {
      success: true,
      message: 'Ticket excluído com sucesso',
    };
  }

  @Get('estatisticas/geral')
  async estatisticas(@Req() req) {
    const empresaId = req.user.empresa_id || req.user.empresaId;

    const [
      totalAbertos,
      totalEmAtendimento,
      totalResolvidos,
      totalFechados,
    ] = await Promise.all([
      this.ticketRepo.count({ where: { empresaId, status: StatusTicket.ABERTO } }),
      this.ticketRepo.count({ where: { empresaId, status: StatusTicket.EM_ATENDIMENTO } }),
      this.ticketRepo.count({ where: { empresaId, status: StatusTicket.RESOLVIDO } }),
      this.ticketRepo.count({ where: { empresaId, status: StatusTicket.FECHADO } }),
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
    ticket.status = StatusTicket.AGUARDANDO;
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

    ticket.status = dto.status as StatusTicket || StatusTicket.RESOLVIDO;
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





