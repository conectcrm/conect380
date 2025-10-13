import { Controller, Post, Body, Get, UseGuards, Logger } from '@nestjs/common';
import { IAService, ContextoConversa } from './ia.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

class GerarRespostaDto {
  ticketId: string;
  clienteNome?: string;
  empresaNome?: string;
  historico: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  metadata?: Record<string, any>;
}

@Controller('ia')
@UseGuards(JwtAuthGuard)
export class IAController {
  private readonly logger = new Logger(IAController.name);

  constructor(private readonly iaService: IAService) { }

  /**
   * POST /ia/resposta
   * Gera resposta automática usando IA
   */
  @Post('resposta')
  async gerarResposta(@Body() dto: GerarRespostaDto) {
    this.logger.log(`Gerando resposta IA para ticket ${dto.ticketId}`);

    const contexto: ContextoConversa = {
      ticketId: dto.ticketId,
      clienteNome: dto.clienteNome,
      empresaNome: dto.empresaNome,
      historico: dto.historico || [],
      metadata: dto.metadata,
    };

    return this.iaService.gerarResposta(contexto);
  }

  /**
   * GET /ia/stats
   * Retorna estatísticas do serviço de IA
   */
  @Get('stats')
  getStats() {
    return this.iaService.getStats();
  }
}
