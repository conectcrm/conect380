import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
  HttpException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { ChatwootService, PropostaChatwootData } from './chatwoot.service';

class EnviarPropostaDto {
  clienteNome: string;
  clienteWhatsApp: string;
  clienteEmail?: string;
  propostaNumero: string;
  valorTotal: number;
  empresaNome: string;
  mensagemPersonalizada?: string;
}

class EnviarMensagemDto {
  content: string;
  message_type?: 'incoming' | 'outgoing' = 'outgoing';
  private?: boolean = false;
}

class AtribuirConversaDto {
  agentId: number;
}

class CriarContatoDto {
  name: string;
  email?: string;
  phone_number?: string;
  identifier?: string;
  custom_attributes?: Record<string, any>;
}

class ValidarNumeroDto {
  phoneNumber: string;
}

@ApiTags('Chatwoot')
@Controller('chatwoot')
export class ChatwootController {
  constructor(private readonly chatwootService: ChatwootService) { }

  @Get('status')
  @ApiOperation({ summary: 'Verificar status da conexão com Chatwoot' })
  @ApiResponse({ status: 200, description: 'Status da conexão retornado com sucesso' })
  async getStatus() {
    try {
      const isConnected = await this.chatwootService.testConnection();

      return {
        success: true,
        status: isConnected ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
        service: 'Chatwoot',
        message: isConnected ? 'Conectado ao Chatwoot' : 'Falha na conexão com Chatwoot'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          status: 'error',
          message: 'Erro ao verificar conexão com Chatwoot',
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('test-connection')
  @ApiOperation({ summary: 'Testar conexão com Chatwoot' })
  @ApiResponse({ status: 200, description: 'Teste de conexão realizado' })
  async testConnection() {
    try {
      const isConnected = await this.chatwootService.testConnection();

      if (isConnected) {
        return {
          success: true,
          message: '✅ Conexão com Chatwoot estabelecida com sucesso!',
          timestamp: new Date().toISOString()
        };
      } else {
        throw new HttpException(
          {
            success: false,
            message: '❌ Falha na conexão com Chatwoot. Verifique as configurações.',
            timestamp: new Date().toISOString()
          },
          HttpStatus.BAD_REQUEST
        );
      }
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Erro interno no teste de conexão',
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('send-proposal')
  @UseInterceptors(FileInterceptor('pdf'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Enviar proposta via Chatwoot' })
  @ApiResponse({ status: 200, description: 'Proposta enviada com sucesso' })
  async sendProposal(
    @Body() body: EnviarPropostaDto,
    @UploadedFile() file?: Express.Multer.File
  ) {
    try {
      const {
        clienteNome,
        clienteWhatsApp,
        clienteEmail,
        propostaNumero,
        valorTotal,
        empresaNome,
        mensagemPersonalizada
      } = body;

      if (!clienteNome || !clienteWhatsApp || !propostaNumero || !valorTotal || !empresaNome) {
        throw new HttpException(
          {
            success: false,
            message: 'Dados obrigatórios: clienteNome, clienteWhatsApp, propostaNumero, valorTotal, empresaNome'
          },
          HttpStatus.BAD_REQUEST
        );
      }

      const dadosProposta: PropostaChatwootData = {
        clienteNome,
        clienteWhatsApp,
        clienteEmail,
        propostaNumero,
        valorTotal: parseFloat(valorTotal.toString()),
        empresaNome,
        mensagemPersonalizada,
        pdfBuffer: file?.buffer
      };

      await this.chatwootService.enviarProposta(dadosProposta);

      return {
        success: true,
        message: `✅ Proposta ${propostaNumero} enviada via Chatwoot para ${clienteNome}`,
        data: {
          cliente: clienteNome,
          whatsapp: clienteWhatsApp,
          proposta: propostaNumero,
          valor: valorTotal,
          temAnexo: !!file,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Erro ao enviar proposta via Chatwoot',
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Buscar conversas' })
  @ApiResponse({ status: 200, description: 'Conversas retornadas com sucesso' })
  async getConversations(
    @Query('status') status?: 'open' | 'resolved' | 'pending',
    @Query('assignee_id') assignee_id?: string,
    @Query('labels') labels?: string | string[],
    @Query('page') page?: string
  ) {
    try {
      const params: any = {};
      if (status) params.status = status;
      if (assignee_id) params.assignee_id = Number(assignee_id);
      if (labels) params.labels = Array.isArray(labels) ? labels : [labels];
      if (page) params.page = Number(page);

      const conversations = await this.chatwootService.getConversations(params);

      return {
        success: true,
        data: conversations,
        count: conversations.length,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao buscar conversas',
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Buscar mensagens de uma conversa' })
  @ApiResponse({ status: 200, description: 'Mensagens retornadas com sucesso' })
  async getMessages(@Param('id') id: string) {
    try {
      const conversationId = Number(id);

      if (isNaN(conversationId)) {
        throw new HttpException(
          {
            success: false,
            message: 'ID da conversa deve ser um número'
          },
          HttpStatus.BAD_REQUEST
        );
      }

      const messages = await this.chatwootService.getMessages(conversationId);

      return {
        success: true,
        data: messages,
        count: messages.length,
        conversationId: conversationId,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Erro ao buscar mensagens da conversa',
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('conversations/:id/resolve')
  @ApiOperation({ summary: 'Resolver conversa' })
  @ApiResponse({ status: 200, description: 'Conversa resolvida com sucesso' })
  async resolveConversation(@Param('id') id: string) {
    try {
      const conversationId = Number(id);

      if (isNaN(conversationId)) {
        throw new HttpException(
          {
            success: false,
            message: 'ID da conversa deve ser um número'
          },
          HttpStatus.BAD_REQUEST
        );
      }

      await this.chatwootService.resolveConversation(conversationId);

      return {
        success: true,
        message: `✅ Conversa ${conversationId} resolvida com sucesso`,
        conversationId: conversationId,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Erro ao resolver conversa',
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('conversations/:id/assign')
  @ApiOperation({ summary: 'Atribuir conversa a agente' })
  @ApiResponse({ status: 200, description: 'Conversa atribuída com sucesso' })
  async assignConversation(@Param('id') id: string, @Body() body: AtribuirConversaDto) {
    try {
      const conversationId = Number(id);
      const { agentId } = body;

      if (isNaN(conversationId) || !agentId) {
        throw new HttpException(
          {
            success: false,
            message: 'ID da conversa e agentId são obrigatórios'
          },
          HttpStatus.BAD_REQUEST
        );
      }

      await this.chatwootService.assignConversation(conversationId, Number(agentId));

      return {
        success: true,
        message: `✅ Conversa ${conversationId} atribuída ao agente ${agentId}`,
        conversationId: conversationId,
        agentId: Number(agentId),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Erro ao atribuir conversa',
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Enviar mensagem para conversa' })
  @ApiResponse({ status: 200, description: 'Mensagem enviada com sucesso' })
  async sendMessage(@Param('id') id: string, @Body() body: EnviarMensagemDto) {
    try {
      const conversationId = Number(id);
      const { content, message_type, private: isPrivate } = body;

      if (isNaN(conversationId) || !content) {
        throw new HttpException(
          {
            success: false,
            message: 'ID da conversa e conteúdo da mensagem são obrigatórios'
          },
          HttpStatus.BAD_REQUEST
        );
      }

      const message = await this.chatwootService.sendMessage(conversationId, {
        content,
        message_type: message_type || 'outgoing',
        private: isPrivate || false
      });

      return {
        success: true,
        message: '✅ Mensagem enviada com sucesso',
        data: message,
        conversationId: conversationId,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Erro ao enviar mensagem',
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('contacts')
  @ApiOperation({ summary: 'Criar contato' })
  @ApiResponse({ status: 201, description: 'Contato criado com sucesso' })
  async createContact(@Body() body: CriarContatoDto) {
    try {
      const { name, email, phone_number, identifier, custom_attributes } = body;

      if (!name) {
        throw new HttpException(
          {
            success: false,
            message: 'Nome do contato é obrigatório'
          },
          HttpStatus.BAD_REQUEST
        );
      }

      const contact = await this.chatwootService.findOrCreateContact({
        name,
        email,
        phone_number,
        identifier,
        custom_attributes
      });

      return {
        success: true,
        message: '✅ Contato criado/encontrado com sucesso',
        data: contact,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Erro ao criar contato',
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('validate-number')
  @ApiOperation({ summary: 'Validar número de WhatsApp' })
  @ApiResponse({ status: 200, description: 'Número validado' })
  async validateNumber(@Body() body: ValidarNumeroDto) {
    try {
      const { phoneNumber } = body;

      if (!phoneNumber) {
        throw new HttpException(
          {
            success: false,
            message: 'Número de telefone é obrigatório'
          },
          HttpStatus.BAD_REQUEST
        );
      }

      const cleaned = phoneNumber.replace(/\D/g, '');
      const isValid = cleaned.length >= 10 && cleaned.length <= 15;

      return {
        success: true,
        data: {
          original: phoneNumber,
          cleaned: cleaned,
          formatted: isValid ? `+55${cleaned.slice(-11)}` : '',
          isValid: isValid
        },
        message: isValid ? '✅ Número válido' : '❌ Número inválido'
      };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Erro ao validar número de telefone',
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estatísticas do Chatwoot' })
  @ApiResponse({ status: 200, description: 'Estatísticas retornadas com sucesso' })
  async getStats() {
    try {
      const openConversations = await this.chatwootService.getConversations({ status: 'open' });
      const resolvedConversations = await this.chatwootService.getConversations({ status: 'resolved' });
      const pendingConversations = await this.chatwootService.getConversations({ status: 'pending' });

      return {
        success: true,
        data: {
          conversations: {
            open: openConversations.length,
            resolved: resolvedConversations.length,
            pending: pendingConversations.length,
            total: openConversations.length + resolvedConversations.length + pendingConversations.length
          },
          service: 'Chatwoot',
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao buscar estatísticas',
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
