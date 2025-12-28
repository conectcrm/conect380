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
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FilesInterceptor } from '@nestjs/platform-express';
import { TicketService } from '../services/ticket.service';
import { MensagemService } from '../services/mensagem.service';
import { StatusTicket, PrioridadeTicket, TipoTicket } from '../entities/ticket.entity';
import { EscalarTicketDto, DesescalarTicketDto, ReatribuirTicketDto } from '../dto/ticket.dto';

/**
 * Controller REST para gerenciamento de tickets
 * Endpoints para listar, buscar, atualizar status e atribuir tickets
 * 🔐 SEGURANÇA: Todos os endpoints protegidos com JWT - empresa_id extraído do token
 */
@Controller('api/atendimento/tickets')
@UseGuards(AuthGuard('jwt')) // 🔐 Proteção global - requer autenticação JWT
export class TicketController {
  private readonly logger = new Logger(TicketController.name);

  constructor(
    private readonly ticketService: TicketService,
    private readonly mensagemService: MensagemService,
  ) { }

  /**
   * GET /api/atendimento/tickets
   * Lista tickets com filtros opcionais
   * 🔐 SEGURANÇA: empresa_id extraído do JWT (não do query param)
   * 🆕 UNIFICAÇÃO: Suporta filtro por tipo (demanda, problema, solicitacao, etc)
   *
   * Query params:
   * - status: string | string[] (opcional)
   * - canalId: string (opcional)
   * - atendenteId: string (opcional) - filtra tickets de um atendente específico
   * - tipo: TipoTicket (opcional) - filtra por tipo (demanda, problema, solicitacao, etc)
   * - limite: number (opcional, padrão: 50)
   * - pagina: number (opcional, padrão: 1)
   */
  @Get()
  async listar(
    @Request() req,
    @Query('status') status?: string | string[],
    @Query('canalId') canalId?: string,
    @Query('atendenteId') atendenteId?: string,
    @Query('tipo') tipo?: TipoTicket,
    @Query('limite') limite?: string,
    @Query('pagina') pagina?: string,
  ) {
    // 🔐 SEGURANÇA: empresa_id vem do JWT, não pode ser manipulado
    const empresaId = req.user.empresa_id;

    this.logger.log(`📋 [GET /tickets] empresaId=${empresaId} user=${req.user.email} status=${status} tipo=${tipo || 'todos'}`);

    if (!empresaId) {
      throw new HttpException('Usuário não possui empresa associada', HttpStatus.FORBIDDEN);
    }

    try {
      // Normalizar status para array e converter para MAIÚSCULO
      let statusArray: string[] | undefined;
      if (status) {
        const statusRaw = Array.isArray(status) ? status : [status];
        // Converter para maiúsculo para match com enum StatusTicket
        // Garantir que são strings antes de converter
        statusArray = statusRaw
          .filter((s) => s && typeof s === 'string')
          .map((s) => s.toString().toUpperCase());
      }

      const resultado = await this.ticketService.listar({
        empresaId,
        status: statusArray,
        canalId,
        atendenteId,
        tipo, // 🆕 Passar filtro de tipo para o service
        limite: limite ? parseInt(limite, 10) : undefined,
        pagina: pagina ? parseInt(pagina, 10) : undefined,
      });

      this.logger.log(
        `✅ Retornando ${resultado.tickets.length} tickets (total: ${resultado.total})`,
      );

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
   * 🔐 SEGURANÇA: Valida se ticket pertence à empresa do usuário
   */
  @Get(':id')
  async buscar(@Request() req, @Param('id') id: string) {
    // 🔐 SEGURANÇA: empresa_id vem do JWT
    const empresaId = req.user.empresa_id;

    this.logger.log(`🔍 [GET /tickets/${id}] empresaId=${empresaId} user=${req.user.email}`);

    try {
      const ticket = await this.ticketService.buscarPorId(id, empresaId);

      // 🔐 SEGURANÇA: Verificação adicional de propriedade
      if (ticket.empresaId !== empresaId) {
        throw new ForbiddenException('Este ticket não pertence à sua empresa');
      }

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
  async atualizarStatus(@Param('id') id: string, @Body('status') status: string) {
    this.logger.log(`🔄 [PATCH /tickets/${id}/status] status=${status}`);

    if (!status) {
      throw new HttpException('status é obrigatório', HttpStatus.BAD_REQUEST);
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
      const ticket = await this.ticketService.atualizarStatus(id, status as StatusTicket);

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
   * PUT /api/atendimento/tickets/:id
   * Atualiza campos gerais do ticket (atendenteId, filaId, etc)
   * 🆕 Suporta campos da unificação Tickets+Demandas
   *
   * Body: {
   *   atendenteId?: string,
   *   filaId?: string,
   *   cliente_id?: string,
   *   titulo?: string,
   *   descricao?: string,
   *   tipo?: TipoTicket,
   *   data_vencimento?: string,
   *   responsavel_id?: string,
   *   autor_id?: string
   * }
   */
  @Patch(':id')
  async atualizarTicket(
    @Request() req,
    @Param('id') id: string,
    @Body() dados: Partial<{
      atendenteId?: string;
      filaId?: string;
      cliente_id?: string;
      titulo?: string;
      descricao?: string;
      tipo?: TipoTicket;
      data_vencimento?: string;
      responsavel_id?: string;
      autor_id?: string;
      [key: string]: any;
    }>,
  ) {
    const empresaId = req.user.empresa_id;

    this.logger.log(
      `📝 [PATCH /tickets/${id}] empresaId=${empresaId} dados=${JSON.stringify(dados)}`,
    );

    try {
      const ticket = await this.ticketService.atualizar(id, empresaId, dados);

      this.logger.log(`✅ Ticket atualizado: ${id}`);

      return {
        success: true,
        data: ticket,
        message: 'Ticket atualizado com sucesso',
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao atualizar ticket: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao atualizar ticket',
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
  async atribuir(@Param('id') id: string, @Body('atendenteId') atendenteId: string) {
    this.logger.log(`👤 [PATCH /tickets/${id}/atribuir] atendenteId=${atendenteId}`);

    if (!atendenteId) {
      throw new HttpException('atendenteId é obrigatório', HttpStatus.BAD_REQUEST);
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
  async atualizarPrioridade(@Param('id') id: string, @Body('prioridade') prioridade: string) {
    this.logger.log(`⭐ [PATCH /tickets/${id}/prioridade] prioridade=${prioridade}`);

    if (!prioridade) {
      throw new HttpException('prioridade é obrigatória', HttpStatus.BAD_REQUEST);
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
   * POST /api/atendimento/tickets/:id/escalar
   * Escalona ticket para nível N1/N2/N3
   */
  @Post(':id/escalar')
  async escalar(@Param('id') id: string, @Body() dados: EscalarTicketDto) {
    this.logger.log(`⬆️ [POST /tickets/${id}/escalar] level=${dados?.level} reason=${dados?.reason}`);

    try {
      const ticket = await this.ticketService.escalar(id, dados);

      return {
        success: true,
        data: ticket,
        message: 'Ticket escalonado com sucesso',
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao escalonar ticket: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao escalonar ticket',
          erro: error.message,
        },
        error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST /api/atendimento/tickets/:id/desescalar
   * Remove escalonamento (retorna para N1)
   */
  @Post(':id/desescalar')
  async desescalar(@Param('id') id: string, @Body() dados: DesescalarTicketDto) {
    this.logger.log(`⬇️ [POST /tickets/${id}/desescalar]`);

    try {
      const ticket = await this.ticketService.desescalar(id, dados);

      return {
        success: true,
        data: ticket,
        message: 'Ticket desescalonado com sucesso',
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao desescalonar ticket: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao desescalonar ticket',
          erro: error.message,
        },
        error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * PATCH /api/atendimento/tickets/:id/reatribuir
   * Reatribui ticket para fila/atendente e/ou ajusta nível/severidade
   */
  @Patch(':id/reatribuir')
  async reatribuir(@Param('id') id: string, @Body() dados: ReatribuirTicketDto) {
    this.logger.log(
      `📌 [PATCH /tickets/${id}/reatribuir] fila=${dados?.filaId || '-'} atendente=${dados?.atendenteId || '-'}`,
    );

    try {
      const ticket = await this.ticketService.reatribuir(id, dados);

      return {
        success: true,
        data: ticket,
        message: 'Ticket reatribuído com sucesso',
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao reatribuir ticket: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao reatribuir ticket',
          erro: error.message,
        },
        error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR,
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
  async transferir(@Param('id') id: string, @Body() dados: any) {
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
  async encerrar(@Param('id') id: string, @Body() dados: any) {
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
        conteudo, // Garante que conteudo está presente
      };

      const mensagem = await this.mensagemService.enviar(dadosCompletos, arquivos);
      this.logger.log(`✅ Mensagem enviada para ticket ${ticketId}`);

      // Formatar resposta para o frontend de chat (remetente/anexos/audio normalizados)
      const ticket = await this.ticketService.buscarPorId(ticketId).catch(() => null);
      const mensagemFormatada = this.mensagemService.formatarMensagemParaFrontend(mensagem, {
        fotoContato: ticket?.contatoFoto || null,
        status: 'enviado',
        atendenteId: ticket?.atendenteId || null,
      });

      return {
        success: true,
        data: mensagemFormatada,
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
