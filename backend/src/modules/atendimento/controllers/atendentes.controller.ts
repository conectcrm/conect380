import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Atendente, StatusAtendente } from '../entities/atendente.entity';
import { Ticket, StatusTicket } from '../entities/ticket.entity';
import {
  CriarAtendenteDto,
  AtualizarAtendenteDto,
  AtualizarStatusAtendenteDto,
} from '../dto';

@Controller('atendimento/atendentes')
@UseGuards(JwtAuthGuard)
export class AtendentesController {
  constructor(
    @InjectRepository(Atendente)
    private atendenteRepo: Repository<Atendente>,

    // @InjectRepository(Ticket)
    // private ticketRepo: Repository<Ticket>,
  ) {
    console.log('✅ AtendentesController inicializado');
  }

  @Get()
  async listar(@Req() req) {
    const empresaId = req.user.empresa_id || req.user.empresaId;

    const atendentes = await this.atendenteRepo.find({
      where: { empresaId },
      // relations: ['filas'], // TODO: adicionar quando AtendenteFila estiver disponível

    });

    return {
      success: true,
      data: atendentes,
      total: atendentes.length,
    };
  }

  @Get(':id')
  async buscarPorId(@Req() req, @Param('id') id: string) {
    const empresaId = req.user.empresa_id || req.user.empresaId;

    const atendente = await this.atendenteRepo.findOne({
      where: { id, empresaId },
      relations: ['filas'],
    });

    if (!atendente) {
      return {
        success: false,
        message: 'Atendente não encontrado',
      };
    }

    // TODO: Adicionar estatísticas quando Ticket estiver disponível
    // const [ticketsAtivos, ticketsResolvidos] = await Promise.all([
    //   this.ticketRepo.count({ where: { atendenteId: id, status: StatusTicket.EM_ATENDIMENTO } }),
    //   this.ticketRepo.count({ where: { atendenteId: id, status: StatusTicket.RESOLVIDO } }),
    // ]);

    return {
      success: true,
      data: {
        ...atendente,
        // estatisticas: { ticketsAtivos, ticketsResolvidos },
      },
    };
  }

  @Post()
  async criar(@Req() req, @Body() dto: CriarAtendenteDto) {
    const empresaId = req.user.empresa_id || req.user.empresaId;

    const atendente = this.atendenteRepo.create({
      ...dto,
      empresaId,
      status: StatusAtendente.OFFLINE,
    });

    await this.atendenteRepo.save(atendente);

    return {
      success: true,
      message: 'Atendente criado com sucesso',
      data: atendente,
    };
  }

  @Put(':id')
  async atualizar(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: AtualizarAtendenteDto,
  ) {
    const empresaId = req.user.empresa_id || req.user.empresaId;

    const atendente = await this.atendenteRepo.findOne({
      where: { id, empresaId },
    });

    if (!atendente) {
      return {
        success: false,
        message: 'Atendente não encontrado',
      };
    }

    Object.assign(atendente, dto);
    await this.atendenteRepo.save(atendente);

    return {
      success: true,
      message: 'Atendente atualizado com sucesso',
      data: atendente,
    };
  }

  @Delete(':id')
  async deletar(@Req() req, @Param('id') id: string) {
    const empresaId = req.user.empresa_id || req.user.empresaId;

    const atendente = await this.atendenteRepo.findOne({
      where: { id, empresaId },
    });

    if (!atendente) {
      return {
        success: false,
        message: 'Atendente não encontrado',
      };
    }

    await this.atendenteRepo.softDelete(id);

    return {
      success: true,
      message: 'Atendente excluído com sucesso',
    };
  }

  @Put(':id/status')
  async atualizarStatus(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: AtualizarStatusAtendenteDto,
  ) {
    const empresaId = req.user.empresa_id || req.user.empresaId;

    const atendente = await this.atendenteRepo.findOne({
      where: { id, empresaId },
    });

    if (!atendente) {
      return {
        success: false,
        message: 'Atendente não encontrado',
      };
    }

    atendente.status = dto.status as any;
    await this.atendenteRepo.save(atendente);

    return {
      success: true,
      message: 'Status atualizado com sucesso',
      data: atendente,
    };
  }

  // TODO: Reabilitar quando Ticket estiver disponível
  /*
  @Get(':id/tickets')
  async listarTickets(@Req() req, @Param('id') id: string) {
    const empresaId = req.user.empresa_id || req.user.empresaId;

    const tickets = await this.ticketRepo.find({
      where: {
        atendenteId: id,
        empresaId,
      },
      relations: ['canal', 'fila'],
      order: { createdAt: 'DESC' },
      take: 50,
    });

    return {
      success: true,
      data: tickets,
      total: tickets.length,
    };
  }
  */
}

