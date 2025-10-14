import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  Logger,
  HttpStatus,
  HttpException,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { MensagemService } from '../services/mensagem.service';

/**
 * Controller REST para gerenciamento de mensagens
 * Endpoints para listar mensagens de tickets
 */
@Controller('api/atendimento/mensagens')
export class MensagemController {
  private readonly logger = new Logger(MensagemController.name);

  constructor(private readonly mensagemService: MensagemService) { }

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
    @Query('ticketId') ticketId: string,
    @Query('limite') limite?: string,
  ) {
    this.logger.log(`💬 [GET /mensagens] ticketId=${ticketId}`);

    if (!ticketId) {
      throw new HttpException(
        'ticketId é obrigatório',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const limiteNum = limite ? parseInt(limite, 10) : 100;
      const mensagens = await this.mensagemService.buscarPorTicket(ticketId, limiteNum);

      this.logger.log(`✅ Retornando ${mensagens.length} mensagens`);

      return {
        success: true,
        data: mensagens,
        total: mensagens.length,
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
  async buscar(@Param('id') id: string) {
    this.logger.log(`🔍 [GET /mensagens/${id}]`);

    try {
      const mensagem = await this.mensagemService.buscarPorId(id);

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

  @Post()
  @UseInterceptors(FilesInterceptor('anexos', 5))
  async enviar(
    @Body() dados: any,
    @UploadedFiles() arquivos?: Express.Multer.File[],
  ) {
    this.logger.log(`📤 [POST /mensagens] ticketId=${dados.ticketId}`);

    try {
      const mensagem = await this.mensagemService.enviar(dados, arquivos);
      this.logger.log(`✅ Mensagem enviada: ${mensagem.id}`);

      return {
        success: true,
        data: mensagem,
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
  async marcarLidas(@Body() dados: { mensagemIds: string[] }) {
    this.logger.log(`✔️ [POST /mensagens/marcar-lidas] ${dados.mensagemIds.length} mensagens`);

    try {
      await this.mensagemService.marcarLidas(dados.mensagemIds);

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
