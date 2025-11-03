import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  Logger,
  HttpStatus,
  HttpException,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { TicketService } from '../services/ticket.service';
import { MensagemService } from '../services/mensagem.service';
import { StatusTicket, PrioridadeTicket } from '../entities/ticket.entity';

/**
 * Controller REST para gerenciamento de tickets
 * Endpoints para listar, buscar, atualizar status e atribuir tickets
 */
@Controller('api/atendimento/tickets')
export class TicketController {
  private readonly logger = new Logger(TicketController.name);

  constructor(
    private readonly ticketService: TicketService,
    private readonly mensagemService: MensagemService,
  ) { }

  /**
   * GET /api/atendimento/tickets
   * Lista tickets com filtros opcionais
   * 
   * Query params:
   * - empresaId: string (obrigatório)
   * - status: string | string[] (opcional)
   * - canalId: string (opcional)
   * - limite: number (opcional, padrão: 50)
   * - pagina: number (opcional, padrão: 1)
   */
  @Get()
  async listar(
    @Query('empresaId') empresaId: string,
    @Query('status') status?: string | string[],
    @Query('canalId') canalId?: string,
    @Query('limite') limite?: string,
    @Query('pagina') pagina?: string,
  ) {
    this.logger.log(`📋 [GET /tickets] empresaId=${empresaId} status=${status}`);

    if (!empresaId) {
      throw new HttpException(
        'empresaId é obrigatório',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // Normalizar status para array e converter para MAIÚSCULO
      let statusArray: string[] | undefined;
      if (status) {
        const statusRaw = Array.isArray(status) ? status : [status];
        // Converter para maiúsculo para match com enum StatusTicket
        // Garantir que são strings antes de converter
        statusArray = statusRaw
          .filter(s => s && typeof s === 'string')
          .map(s => s.toString().toUpperCase());
      }

      const resultado = await this.ticketService.listar({
        empresaId,
        status: statusArray,
        canalId,
        limite: limite ? parseInt(limite, 10) : undefined,
        pagina: pagina ? parseInt(pagina, 10) : undefined,
      });

      this.logger.log(`✅ Retornando ${resultado.tickets.length} tickets (total: ${resultado.total})`);

      return {
        success: true,
        data: resultado.tickets,
        total: resultado.total,
        pagina: pagina ? parseInt(pagina, 10) : 1,
        limite: limite ? parseInt(limite, 10) : 50,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao listar tickets: ${error.message}`, error.stack);
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao listar tickets',
          erro: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /api/atendimento/tickets/:id
   * Busca um ticket específico por ID
   */
  @Get(':id')
  async buscar(
    @Param('id') id: string,
    @Query('empresaId') empresaId?: string,
  ) {
    this.logger.log(`🔍 [GET /tickets/${id}]`);

    try {
      const ticket = await this.ticketService.buscarPorId(id, empresaId);

      return {
        success: true,
        data: ticket,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar ticket: ${error.message}`);

      if (error.message.includes('não encontrado')) {
        throw new HttpException(
          {
            success: false,
            message: error.message,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      throw new HttpException(
        {
          success: false,
          message: 'Erro ao buscar ticket',
          erro: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * PATCH /api/atendimento/tickets/:id/status
   * Atualiza o status de um ticket
   * 
   * Body: { status: 'ABERTO' | 'EM_ATENDIMENTO' | 'AGUARDANDO_CLIENTE' | 'RESOLVIDO' | 'FECHADO' }
   */
  @Patch(':id/status')
  async atualizarStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    this.logger.log(`🔄 [PATCH /tickets/${id}/status] status=${status}`);

    if (!status) {
      throw new HttpException(
        'status é obrigatório',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validar status
    const statusValidos = Object.values(StatusTicket);
    if (!statusValidos.includes(status as StatusTicket)) {
      throw new HttpException(
        `Status inválido. Valores aceitos: ${statusValidos.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const ticket = await this.ticketService.atualizarStatus(
        id,
        status as StatusTicket,
      );

      this.logger.log(`✅ Status atualizado: ${id} → ${status}`);

      return {
        success: true,
        data: ticket,
        message: 'Status atualizado com sucesso',
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao atualizar status: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao atualizar status',
          erro: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * PATCH /api/atendimento/tickets/:id/atribuir
   * Atribui ticket a um atendente
   * 
   * Body: { atendenteId: string }
   */
  @Patch(':id/atribuir')
  async atribuir(
    @Param('id') id: string,
    @Body('atendenteId') atendenteId: string,
  ) {
    this.logger.log(`👤 [PATCH /tickets/${id}/atribuir] atendenteId=${atendenteId}`);

    if (!atendenteId) {
      throw new HttpException(
        'atendenteId é obrigatório',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const ticket = await this.ticketService.atribuir(id, atendenteId);

      this.logger.log(`✅ Ticket atribuído: ${id} → ${atendenteId}`);

      return {
        success: true,
        data: ticket,
        message: 'Ticket atribuído com sucesso',
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao atribuir ticket: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao atribuir ticket',
          erro: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * PATCH /api/atendimento/tickets/:id/prioridade
   * Atualiza a prioridade de um ticket
   * 
   * Body: { prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE' }
   */
  @Patch(':id/prioridade')
  async atualizarPrioridade(
    @Param('id') id: string,
    @Body('prioridade') prioridade: string,
  ) {
    this.logger.log(`⭐ [PATCH /tickets/${id}/prioridade] prioridade=${prioridade}`);

    if (!prioridade) {
      throw new HttpException(
        'prioridade é obrigatória',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validar prioridade
    const prioridadesValidas = Object.values(PrioridadeTicket);
    if (!prioridadesValidas.includes(prioridade as PrioridadeTicket)) {
      throw new HttpException(
        `Prioridade inválida. Valores aceitos: ${prioridadesValidas.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const ticket = await this.ticketService.atualizarPrioridade(
        id,
        prioridade as PrioridadeTicket,
      );

      this.logger.log(`✅ Prioridade atualizada: ${id} → ${prioridade}`);

      return {
        success: true,
        data: ticket,
        message: 'Prioridade atualizada com sucesso',
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao atualizar prioridade: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao atualizar prioridade',
          erro: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST /api/atendimento/tickets
   * Cria um novo ticket
   * 
   * Body: CriarTicketDto
   */
  @Post()
  async criar(@Body() dadosTicket: any) {
    this.logger.log(`📝 [POST /tickets] Criando novo ticket`);

    try {
      const ticket = await this.ticketService.criar(dadosTicket);

      this.logger.log(`✅ Ticket criado: ${ticket.id}`);

      return {
        success: true,
        data: ticket,
        message: 'Ticket criado com sucesso',
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao criar ticket: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao criar ticket',
          erro: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST /api/atendimento/tickets/:id/transferir
   * Transfere ticket para outro atendente
   * 
   * Body: TransferirTicketDto
   */
  @Post(':id/transferir')
  async transferir(
    @Param('id') id: string,
    @Body() dados: any,
  ) {
    this.logger.log(`🔄 [POST /tickets/${id}/transferir] → ${dados.atendenteId}`);

    try {
      const ticket = await this.ticketService.transferir(id, dados);

      this.logger.log(`✅ Ticket transferido com sucesso`);

      return {
        success: true,
        data: ticket,
        notificado: dados.notificarAgente !== false,
        message: 'Ticket transferido com sucesso',
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao transferir ticket: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao transferir ticket',
          erro: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST /api/atendimento/tickets/:id/encerrar
   * Encerra um ticket
   * 
   * Body: EncerrarTicketDto
   */
  @Post(':id/encerrar')
  async encerrar(
    @Param('id') id: string,
    @Body() dados: any,
  ) {
    this.logger.log(`🏁 [POST /tickets/${id}/encerrar] motivo=${dados.motivo}`);

    try {
      const resultado = await this.ticketService.encerrar(id, dados);

      this.logger.log(`✅ Ticket encerrado com sucesso`);

      return {
        success: true,
        data: resultado.ticket,
        followUp: resultado.followUp,
        csatEnviado: resultado.csatEnviado,
        message: 'Ticket encerrado com sucesso',
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao encerrar ticket: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao encerrar ticket',
          erro: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST /api/atendimento/tickets/:id/reabrir
   * Reabre um ticket encerrado
   */
  @Post(':id/reabrir')
  async reabrir(@Param('id') id: string) {
    this.logger.log(`🔓 [POST /tickets/${id}/reabrir]`);

    try {
      const ticket = await this.ticketService.reabrir(id);

      this.logger.log(`✅ Ticket reaberto com sucesso`);

      return {
        success: true,
        data: ticket,
        message: 'Ticket reaberto com sucesso',
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao reabrir ticket: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao reabrir ticket',
          erro: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST /api/atendimento/tickets/:id/mensagens
   * Envia mensagem para um ticket (rota nested para compatibilidade com frontend)
   */
  @Post(':id/mensagens')
  @UseInterceptors(FilesInterceptor('anexos', 5))
  async enviarMensagem(
    @Param('id') ticketId: string,
    @Body() dados: any,
    @UploadedFiles() arquivos?: Express.Multer.File[],
  ) {
    this.logger.log(`📤 [POST /tickets/${ticketId}/mensagens]`);
    this.logger.debug(`📋 Body recebido: ${JSON.stringify(dados)}`);
    this.logger.debug(`📎 Arquivos: ${arquivos?.length || 0}`);

    try {
      // ✅ Garantir que conteudo existe (pode vir no body ou como string direta)
      let conteudo = dados.conteudo;

      // Se dados é uma string, significa que o FormData não foi parseado corretamente
      if (typeof dados === 'string') {
        try {
          const parsed = JSON.parse(dados);
          conteudo = parsed.conteudo;
        } catch {
          // Se não é JSON, assume que é o próprio conteúdo
          conteudo = dados;
        }
      }

      // Adicionar ticketId do parâmetro da URL
      const dadosCompletos = {
        ...dados,
        ticketId,
        conteudo // Garante que conteudo está presente
      };

      const mensagem = await this.mensagemService.enviar(dadosCompletos, arquivos);
      this.logger.log(`✅ Mensagem enviada para ticket ${ticketId}`);

      return {
        success: true,
        data: mensagem,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao enviar mensagem: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao enviar mensagem',
          erro: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
