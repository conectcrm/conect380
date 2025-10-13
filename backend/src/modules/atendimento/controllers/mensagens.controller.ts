import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Mensagem, TipoMensagem, StatusMensagem } from '../entities/mensagem.entity';
import { Ticket } from '../entities/ticket.entity';
import { AtendimentoGateway } from '../gateways/atendimento.gateway';
import {
  CriarMensagemDto,
  BuscarMensagensDto,
} from '../dto';

@Controller('atendimento/mensagens')
@UseGuards(JwtAuthGuard)
export class MensagensController {
  constructor(
    @InjectRepository(Mensagem)
    private mensagemRepo: Repository<Mensagem>,

    @InjectRepository(Ticket)
    private ticketRepo: Repository<Ticket>,

    private atendimentoGateway: AtendimentoGateway,
  ) { }

  @Get()
  async listar(@Req() req, @Query() query: BuscarMensagensDto) {
    const empresaId = req.user.empresa_id || req.user.empresaId;
    const limit = parseInt(query.limit || '50');
    const offset = parseInt(query.offset || '0');

    // Verificar se o ticket pertence à empresa
    const ticket = await this.ticketRepo.findOne({
      where: { id: query.ticketId, empresaId },
    });

    if (!ticket) {
      return {
        success: false,
        message: 'Ticket não encontrado',
      };
    }

    const [mensagens, total] = await this.mensagemRepo.findAndCount({
      where: { ticketId: query.ticketId },
      order: { createdAt: 'ASC' },
      take: limit,
      skip: offset,
    });

    return {
      success: true,
      data: mensagens,
      total,
      limit,
      offset,
    };
  }

  @Post()
  async criar(@Req() req, @Body() dto: CriarMensagemDto) {
    const empresaId = req.user.empresa_id || req.user.empresaId;

    // Buscar ticket
    const ticket = await this.ticketRepo.findOne({
      where: { id: dto.ticketId, empresaId },
    });

    if (!ticket) {
      return {
        success: false,
        message: 'Ticket não encontrado',
      };
    }

    // Criar mensagem
    const mensagem = this.mensagemRepo.create({
      ticketId: dto.ticketId,
      tipo: dto.tipo,
      conteudo: dto.conteudo,
      remetente: dto.remetente,
      // status: StatusMensagem.ENVIADA, // Coluna não existe no banco
      midia: dto.midia || null,
    });

    await this.mensagemRepo.save(mensagem);

    // Atualizar última mensagem do ticket
    ticket.ultima_mensagem_em = new Date();
    await this.ticketRepo.save(ticket);

    // 🔥 EMITIR EVENTO WEBSOCKET - Nova mensagem em tempo real
    this.atendimentoGateway.notificarNovaMensagem({
      ...mensagem,
      ticketNumero: ticket.numero,
      atendenteId: ticket.atendenteId,
    });

    return {
      success: true,
      message: 'Mensagem criada com sucesso',
      data: mensagem,
    };
  }
}
