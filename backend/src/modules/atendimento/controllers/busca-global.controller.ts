import { Controller, Post, Body, UseGuards, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { BuscaGlobalService } from '../services/busca-global.service';
import { BuscaGlobalRequestDto, BuscaGlobalResponseDto } from '../dto/busca-global.dto';

@Controller('api/atendimento/busca-global')
@UseGuards(JwtAuthGuard)
export class BuscaGlobalController {
  private readonly logger = new Logger(BuscaGlobalController.name);

  constructor(private readonly buscaGlobalService: BuscaGlobalService) {}

  /**
   * POST /api/atendimento/busca-global
   * Realizar busca global em múltiplas entidades
   */
  @Post()
  async buscar(@Body() dto: BuscaGlobalRequestDto): Promise<BuscaGlobalResponseDto> {
    this.logger.log(`🔍 POST /api/atendimento/busca-global: query="${dto.query}"`);

    return this.buscaGlobalService.buscar(dto);
  }
}
