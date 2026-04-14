import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { EmpresaId } from '../../common/decorators/empresa.decorator';
import { EmpresaGuard } from '../../common/guards/empresa.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permission } from '../../common/permissions/permissions.constants';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateEventoDto, UpdateEventoDto } from './dto/evento.dto';
import { EventosService } from './eventos.service';

@Controller('eventos')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.CRM_AGENDA_READ)
export class EventosController {
  constructor(private readonly eventosService: EventosService) {}

  @Post()
  @Permissions(Permission.CRM_AGENDA_CREATE)
  async create(
    @Body() createEventoDto: CreateEventoDto,
    @Request() req: any,
    @EmpresaId() empresaId: string,
  ) {
    return this.eventosService.create({
      ...createEventoDto,
      usuarioId: req.user.id,
      empresaId,
    });
  }

  @Get()
  async findAll(
    @Request() req: any,
    @EmpresaId() empresaId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('tipo') tipo?: string,
  ) {
    const userId = req.user.id;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new BadRequestException('Datas invalidas fornecidas');
      }

      return this.eventosService.findByPeriod(userId, empresaId, start, end);
    }

    if (tipo) {
      return this.eventosService.getEventsByTipo(userId, empresaId, tipo);
    }

    return this.eventosService.findAll(userId, empresaId);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
    @EmpresaId() empresaId: string,
  ) {
    return this.eventosService.findOne(id, req.user.id, empresaId);
  }

  @Patch(':id')
  @Permissions(Permission.CRM_AGENDA_UPDATE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEventoDto: UpdateEventoDto,
    @Request() req: any,
    @EmpresaId() empresaId: string,
  ) {
    return this.eventosService.update(id, updateEventoDto, req.user.id, empresaId);
  }

  @Delete(':id')
  @Permissions(Permission.CRM_AGENDA_DELETE)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
    @EmpresaId() empresaId: string,
  ) {
    await this.eventosService.remove(id, req.user.id, empresaId);
    return { message: 'Evento excluido com sucesso' };
  }

  @Get(':id/conflicts')
  async checkConflicts(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('start') start: string,
    @Query('end') end: string,
    @Request() req: any,
    @EmpresaId() empresaId: string,
  ) {
    if (!start || !end) {
      throw new BadRequestException('Parametros start e end sao obrigatorios');
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Datas invalidas fornecidas');
    }

    return this.eventosService.findConflicts(req.user.id, empresaId, startDate, endDate, id);
  }

  @Post('check-conflicts')
  async checkNewEventConflicts(
    @Body() body: { dataInicio: string; dataFim: string },
    @Request() req: any,
    @EmpresaId() empresaId: string,
  ) {
    const { dataInicio, dataFim } = body;

    if (!dataInicio || !dataFim) {
      throw new BadRequestException('Parametros dataInicio e dataFim sao obrigatorios');
    }

    const startDate = new Date(dataInicio);
    const endDate = new Date(dataFim);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Datas invalidas fornecidas');
    }

    return this.eventosService.findConflicts(req.user.id, empresaId, startDate, endDate);
  }
}
