import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AgendaService } from './agenda.service';
import {
  AgendaEventoFiltroDto,
  CreateAgendaEventoDto,
  UpdateAgendaEventoRsvpDto,
  UpdateAgendaEventoDto,
} from './dto/agenda-evento.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../common/guards/empresa.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/permissions/permissions.constants';
import { EmpresaId } from '../../common/decorators/empresa.decorator';

@ApiTags('Agenda')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.CRM_AGENDA_READ)
@Controller('agenda-eventos')
export class AgendaController {
  constructor(private readonly agendaService: AgendaService) {}

  @Post()
  @Permissions(Permission.CRM_AGENDA_CREATE)
  async create(@Body() dto: CreateAgendaEventoDto, @EmpresaId() empresaId: string, @Request() req: any) {
    const event = await this.agendaService.create(dto, empresaId, req.user?.email, req.user?.id);
    return this.agendaService.serializeEventoParaUsuarioComCriador(event, req.user?.email);
  }

  @Get()
  findAll(@EmpresaId() empresaId: string, @Query() filtros: AgendaEventoFiltroDto, @Request() req: any) {
    return this.agendaService.findAll(empresaId, filtros, req.user?.email);
  }

  @Get('participants')
  async listParticipants(@EmpresaId() empresaId: string) {
    return {
      success: true,
      data: await this.agendaService.listParticipants(empresaId),
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @EmpresaId() empresaId: string, @Request() req: any) {
    const event = await this.agendaService.findOne(id, empresaId, req.user?.email);
    return this.agendaService.serializeEventoParaUsuarioComCriador(event, req.user?.email);
  }

  @Patch(':id')
  @Permissions(Permission.CRM_AGENDA_UPDATE)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAgendaEventoDto,
    @EmpresaId() empresaId: string,
    @Request() req: any,
  ) {
    const event = await this.agendaService.update(id, dto, empresaId, req.user?.email);
    return this.agendaService.serializeEventoParaUsuarioComCriador(event, req.user?.email);
  }

  @Patch(':id/rsvp')
  async updateRsvp(
    @Param('id') id: string,
    @Body() dto: UpdateAgendaEventoRsvpDto,
    @EmpresaId() empresaId: string,
    @Request() req: any,
  ) {
    const event = await this.agendaService.updateRsvp(id, dto, empresaId, req.user?.email, req.user?.id);
    return this.agendaService.serializeEventoParaUsuarioComCriador(event, req.user?.email);
  }

  @Delete(':id')
  @Permissions(Permission.CRM_AGENDA_DELETE)
  remove(@Param('id') id: string, @EmpresaId() empresaId: string) {
    return this.agendaService.remove(id, empresaId);
  }
}
