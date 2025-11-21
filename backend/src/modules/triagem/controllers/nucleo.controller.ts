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
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../modules/auth/jwt-auth.guard';
import { NucleoService } from '../services/nucleo.service';
import { CreateNucleoDto, UpdateNucleoDto, FilterNucleoDto } from '../dto';

@Controller('nucleos')
@UseGuards(JwtAuthGuard)
export class NucleoController {
  constructor(private readonly nucleoService: NucleoService) {}

  /**
   * POST /nucleos
   * Cria um novo núcleo de atendimento
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Request() req, @Body() createNucleoDto: CreateNucleoDto) {
    const empresaId = req.user.empresa_id;
    return this.nucleoService.create(empresaId, createNucleoDto);
  }

  /**
   * GET /nucleos
   * Lista todos os núcleos com filtros opcionais
   */
  @Get()
  async findAll(@Request() req, @Query() filters: FilterNucleoDto) {
    const empresaId = req.user.empresa_id;
    return this.nucleoService.findAll(empresaId, filters);
  }

  /**
   * GET /nucleos/canal/:canal
   * Lista núcleos ativos por canal
   */
  @Get('canal/:canal')
  async findByCanal(@Request() req, @Param('canal') canal: string) {
    const empresaId = req.user.empresa_id;
    return this.nucleoService.findByCanal(empresaId, canal);
  }

  /**
   * GET /nucleos/:id
   * Busca um núcleo específico
   */
  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    const empresaId = req.user.empresa_id;
    return this.nucleoService.findOne(empresaId, id);
  }

  /**
   * PUT /nucleos/:id
   * Atualiza um núcleo
   */
  @Put(':id')
  async update(@Request() req, @Param('id') id: string, @Body() updateNucleoDto: UpdateNucleoDto) {
    const empresaId = req.user.empresa_id;
    return this.nucleoService.update(empresaId, id, updateNucleoDto);
  }

  /**
   * DELETE /nucleos/:id
   * Remove um núcleo
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Request() req, @Param('id') id: string) {
    const empresaId = req.user.empresa_id;
    await this.nucleoService.remove(empresaId, id);
  }

  /**
   * POST /nucleos/:id/incrementar-tickets
   * Incrementa contador de tickets
   */
  @Post(':id/incrementar-tickets')
  async incrementarTickets(@Param('id') id: string) {
    await this.nucleoService.incrementarTicketsAbertos(id);
    return { message: 'Contador incrementado' };
  }

  /**
   * POST /nucleos/:id/decrementar-tickets
   * Decrementa contador de tickets
   */
  @Post(':id/decrementar-tickets')
  async decrementarTickets(@Param('id') id: string) {
    await this.nucleoService.decrementarTicketsAbertos(id);
    return { message: 'Contador decrementado' };
  }

  /**
   * GET /nucleos/disponivel/:canal
   * Busca núcleo disponível com menor carga
   */
  @Get('disponivel/:canal')
  async findDisponivel(@Request() req, @Param('canal') canal: string) {
    const empresaId = req.user.empresa_id;
    const nucleo = await this.nucleoService.findNucleoComMenorCarga(empresaId, canal);

    if (!nucleo) {
      return {
        message: 'Nenhum núcleo disponível no momento',
        disponivel: false,
      };
    }

    return {
      disponivel: true,
      nucleo,
    };
  }

  /**
   * GET /nucleos/bot/opcoes
   * Retorna núcleos e departamentos visíveis para o bot
   */
  @Get('bot/opcoes')
  async getBotOptions(@Request() req) {
    const empresaId = req.user.empresa_id;
    return this.nucleoService.findOpcoesParaBot(empresaId);
  }
}
