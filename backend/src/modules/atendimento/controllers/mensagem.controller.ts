import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  Logger,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
  Res,
  Req,
  HttpException,
  UseGuards,
} from '@nestjs/common';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import type { Request, Response } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { MensagemService } from '../services/mensagem.service';
import { TicketService } from '../services/ticket.service';
import { OnlineStatusService } from '../services/online-status.service';
import { AtendimentoGateway } from '../gateways/atendimento.gateway';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../../common/guards/empresa.guard';
import { EmpresaId } from '../../../common/decorators/empresa.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Permission } from '../../../common/permissions/permissions.constants';

/**
 * Controller REST para gerenciamento de mensagens
 * Endpoints para listar mensagens de tickets
 */
@Controller('api/atendimento/mensagens')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.ATENDIMENTO_CHATS_READ)
export class MensagemController {
  private readonly logger = new Logger(MensagemController.name);

  constructor(
    private readonly mensagemService: MensagemService,
    private readonly ticketService: TicketService,
    private readonly onlineStatusService: OnlineStatusService,
    private readonly atendimentoGateway: AtendimentoGateway,
  ) {}

  /**
   * GET /api/atendimento/mensagens
   * Lista mensagens de um ticket específico
   *
   * Query params:
   * - ticketId: string (obrigatório)
   * - limite: number (opcional, padrão: 100)
   */
  @Get()
  async listar(
    @EmpresaId() empresaId: string,
    @Query('ticketId') ticketId: string,
    @Query('limite') limite?: string,
  ) {
    this.logger.log(`💬 [GET /mensagens] ticketId=${ticketId}`);

    if (!ticketId) {
      throw new HttpException('ticketId é obrigatório', HttpStatus.BAD_REQUEST);
    }

    try {
      const limiteNum = limite ? parseInt(limite, 10) : 100;
      const [mensagens, ticket] = await Promise.all([
        this.mensagemService.buscarPorTicket(ticketId, limiteNum, empresaId),
        this.ticketService.buscarPorId(ticketId, empresaId).catch(() => null),
      ]);

      const fotoContato = ticket?.contatoFoto || null;

      const mensagensFormatadas = mensagens.map((mensagem) =>
        this.mensagemService.formatarMensagemParaFrontend(mensagem, {
          fotoContato,
          status: 'lido',
          atendenteId: ticket?.atendenteId || null,
        }),
      );

      this.logger.log(`✅ Retornando ${mensagensFormatadas.length} mensagens`);

      return {
        success: true,
        data: mensagensFormatadas,
        total: mensagensFormatadas.length,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao listar mensagens: ${error.message}`, error.stack);
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao listar mensagens',
          erro: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /api/atendimento/mensagens/:id
   * Busca uma mensagem específica por ID
   */
  @Get(':id')
  async buscar(@EmpresaId() empresaId: string, @Param('id') id: string) {
    this.logger.log(`🔍 [GET /mensagens/${id}]`);

    try {
      const mensagem = await this.mensagemService.buscarPorId(id, empresaId);

      return {
        success: true,
        data: mensagem,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar mensagem: ${error.message}`);

      if (error.message.includes('não encontrada')) {
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
          message: 'Erro ao buscar mensagem',
          erro: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/anexo')
  async baixarAnexo(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    this.logger.log(`⬇️ [GET /mensagens/${id}/anexo] - Versão corrigida v2`);

    try {
      const midia = await this.mensagemService.obterMidiaParaDownload(id, empresaId);

      this.logger.log(`📦 Mídia obtida:`, {
        remoto: midia.remoto,
        hasUrl: !!midia.url,
        hasCaminho: !!midia.caminho,
        isLookaside: midia.url?.includes('lookaside.fbsbx.com'),
      });

      // 🚨 NUNCA redirecionar URLs do WhatsApp (lookaside.fbsbx.com) - elas expiram!
      // O método obterMidiaParaDownload já tenta baixar automaticamente
      if (midia.remoto && midia.url && !midia.url.includes('lookaside.fbsbx.com')) {
        this.logger.log(`🔗 Redirecionando para URL remota: ${midia.url}`);
        return res.redirect(midia.url);
      }

      if (!midia.caminho) {
        this.logger.warn(`⚠️ Arquivo não encontrado localmente para mensagem ${id}`);
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: 'Arquivo não encontrado ou URL expirada',
        });
      }

      const filePath = midia.caminho;
      const estatisticasArquivo = await stat(filePath);
      const tamanhoTotal = estatisticasArquivo.size;
      const rangeHeader = req.headers.range;

      const enviarStream = (
        stream: ReturnType<typeof createReadStream>,
        status: number,
        headers: Record<string, string>,
      ) => {
        Object.entries(headers).forEach(([chave, valor]) => res.setHeader(chave, valor));
        res.status(status);

        stream.on('error', (erro) => {
          this.logger.error(`❌ Falha ao transmitir anexo ${id}: ${erro.message}`);
          if (!res.headersSent) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
              success: false,
              message: 'Erro ao carregar anexo',
            });
          } else {
            res.end();
          }
        });

        stream.pipe(res);
      };

      if (rangeHeader) {
        const [intervaloInicial, intervaloFinal] = rangeHeader.replace(/bytes=/, '').split('-');
        const inicio = Number.parseInt(intervaloInicial, 10);
        const fim = intervaloFinal ? Number.parseInt(intervaloFinal, 10) : tamanhoTotal - 1;

        if (
          Number.isNaN(inicio) ||
          inicio >= tamanhoTotal ||
          Number.isNaN(fim) ||
          fim >= tamanhoTotal
        ) {
          this.logger.warn(`⚠️ Range inválido solicitado para mensagem ${id}: ${rangeHeader}`);
          res.status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE);
          res.setHeader('Content-Range', `bytes */${tamanhoTotal}`);
          return res.end();
        }

        const tamanhoChunk = fim - inicio + 1;
        this.logger.log(`📻 Enviando chunk de áudio (bytes ${inicio}-${fim}/${tamanhoTotal})`);

        const stream = createReadStream(filePath, { start: inicio, end: fim });

        enviarStream(stream, HttpStatus.PARTIAL_CONTENT, {
          'Content-Range': `bytes ${inicio}-${fim}/${tamanhoTotal}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(tamanhoChunk),
          'Content-Type': midia.tipo || 'application/octet-stream',
          'Content-Disposition': `inline; filename="${encodeURIComponent(midia.nome)}"`,
        });

        return;
      }

      this.logger.log(`📻 Enviando áudio completo (${tamanhoTotal} bytes) para mensagem ${id}`);
      const stream = createReadStream(filePath);

      enviarStream(stream, HttpStatus.OK, {
        'Accept-Ranges': 'bytes',
        'Content-Length': String(tamanhoTotal),
        'Content-Type': midia.tipo || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${encodeURIComponent(midia.nome)}"`,
      });
    } catch (error) {
      this.logger.error(
        `❌ Erro ao baixar anexo: ${error instanceof Error ? error.message : error}`,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Erro ao baixar anexo',
          erro: error instanceof Error ? error.message : String(error),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  @Permissions(Permission.ATENDIMENTO_CHATS_REPLY)
  @UseInterceptors(FilesInterceptor('anexos', 5))
  async enviar(
    @EmpresaId() empresaId: string,
    @Body() dados: any,
    @UploadedFiles() arquivos?: Express.Multer.File[],
  ) {
    this.logger.log(`📤 [POST /mensagens] ticketId=${dados.ticketId}`);

    try {
      const ticket = await this.ticketService.buscarPorId(dados.ticketId, empresaId);
      const mensagem = await this.mensagemService.enviar(dados, arquivos, empresaId);
      this.logger.log(`✅ Mensagem enviada: ${mensagem.id}`);

      // 📱 Atualizar atividade do contato quando mensagem é enviada/recebida
      if (ticket && ticket.contatoTelefone) {
        // Se mensagem é do cliente, atualizar sua atividade
        if (mensagem.remetente === 'CLIENTE') {
          await this.onlineStatusService.updateActivityFromMessage(
            ticket.contatoTelefone,
            ticket.empresaId,
            mensagem.createdAt,
          );
          this.logger.log(`🟢 Atividade atualizada para contato: ${ticket.contatoTelefone}`);

          // 🔔 Notificar via WebSocket sobre mudança de atividade
          // Buscar ID do contato pelo telefone
          try {
            const contato = await this.onlineStatusService.findContactByPhone(
              ticket.contatoTelefone,
              ticket.empresaId,
            );
            if (contato) {
              await this.atendimentoGateway.atualizarAtividadeContato(
                contato.id,
                ticket.empresaId,
                'mensagem',
              );
            }
          } catch (error) {
            this.logger.warn(
              `⚠️ Erro ao notificar mudança de status via WebSocket: ${error.message}`,
            );
          }
        }
      }

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
        { success: false, message: 'Erro ao enviar mensagem', erro: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('marcar-lidas')
  @Permissions(Permission.ATENDIMENTO_CHATS_REPLY)
  async marcarLidas(
    @EmpresaId() empresaId: string,
    @Body() dados: { mensagemIds: string[] },
  ) {
    this.logger.log(`✔️ [POST /mensagens/marcar-lidas] ${dados.mensagemIds.length} mensagens`);

    try {
      await this.mensagemService.marcarLidas(dados.mensagemIds, empresaId);

      return {
        success: true,
        message: 'Mensagens marcadas como lidas',
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao marcar mensagens: ${error.message}`);
      throw new HttpException(
        { success: false, message: 'Erro ao marcar mensagens', erro: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
