import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { EventosService } from './eventos.service';
import { CreateEventoDto, UpdateEventoDto } from './dto/evento.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('eventos')
@UseGuards(JwtAuthGuard)
export class EventosController {
  constructor(private readonly eventosService: EventosService) {}

  @Post()
  async create(@Body() createEventoDto: CreateEventoDto, @Request() req) {
    return await this.eventosService.create(createEventoDto);
  }

  @Get()
  async findAll(@Request() req, @Query() query) {
    const { startDate, endDate, tipo } = query;

    // Debug: verificar se req.user existe
    if (!req.user) {
      throw new BadRequestException('Usuário não autenticado');
    }

    const userId = req.user.id;
    // Verificar se a estrutura tem empresa.id ou empresaId
    const empresaId = req.user.empresa?.id || req.user.empresaId;

    if (!empresaId) {
      throw new BadRequestException('ID da empresa não encontrado');
    }

    // Se foi fornecido um período específico
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new BadRequestException('Datas inválidas fornecidas');
      }

      return await this.eventosService.findByPeriod(userId, empresaId, start, end);
    }

    // Filtrar por tipo
    if (tipo) {
      return await this.eventosService.getEventsByTipo(userId, empresaId, tipo);
    }

    // Retornar todos os eventos do usuário
    return await this.eventosService.findAll(userId, empresaId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    if (!req.user) {
      throw new BadRequestException('Usuário não autenticado');
    }

    const empresaId = req.user.empresa?.id || req.user.empresaId;
    return await this.eventosService.findOne(id, req.user.id, empresaId);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEventoDto: UpdateEventoDto,
    @Request() req,
  ) {
    if (!req.user) {
      throw new BadRequestException('Usuário não autenticado');
    }

    const empresaId = req.user.empresa?.id || req.user.empresaId;
    return await this.eventosService.update(id, updateEventoDto, req.user.id, empresaId);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    if (!req.user) {
      throw new BadRequestException('Usuário não autenticado');
    }

    const empresaId = req.user.empresa?.id || req.user.empresaId;
    await this.eventosService.remove(id, req.user.id, empresaId);
    return { message: 'Evento excluído com sucesso' };
  }

  @Get(':id/conflicts')
  async checkConflicts(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('start') start: string,
    @Query('end') end: string,
    @Request() req,
  ) {
    if (!req.user) {
      throw new BadRequestException('Usuário não autenticado');
    }

    if (!start || !end) {
      throw new BadRequestException('Parâmetros start e end são obrigatórios');
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Datas inválidas fornecidas');
    }

    const empresaId = req.user.empresa?.id || req.user.empresaId;
    return await this.eventosService.findConflicts(req.user.id, empresaId, startDate, endDate, id);
  }

  @Post('check-conflicts')
  async checkNewEventConflicts(
    @Body() body: { dataInicio: string; dataFim: string },
    @Request() req,
  ) {
    if (!req.user) {
      throw new BadRequestException('Usuário não autenticado');
    }

    const { dataInicio, dataFim } = body;

    if (!dataInicio || !dataFim) {
      throw new BadRequestException('Parâmetros dataInicio e dataFim são obrigatórios');
    }

    const startDate = new Date(dataInicio);
    const endDate = new Date(dataFim);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Datas inválidas fornecidas');
    }

    const empresaId = req.user.empresa?.id || req.user.empresaId;
    return await this.eventosService.findConflicts(req.user.id, empresaId, startDate, endDate);
  }
}
