import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AgendaService } from './agenda.service';
import {
  AgendaEventoFiltroDto,
  CreateAgendaEventoDto,
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
  create(@Body() dto: CreateAgendaEventoDto, @EmpresaId() empresaId: string) {
    return this.agendaService.create(dto, empresaId);
  }

  @Get()
  findAll(@EmpresaId() empresaId: string, @Query() filtros: AgendaEventoFiltroDto) {
    return this.agendaService.findAll(empresaId, filtros);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @EmpresaId() empresaId: string) {
    return this.agendaService.findOne(id, empresaId);
  }

  @Patch(':id')
  @Permissions(Permission.CRM_AGENDA_UPDATE)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAgendaEventoDto,
    @EmpresaId() empresaId: string,
  ) {
    return this.agendaService.update(id, dto, empresaId);
  }

  @Delete(':id')
  @Permissions(Permission.CRM_AGENDA_DELETE)
  remove(@Param('id') id: string, @EmpresaId() empresaId: string) {
    return this.agendaService.remove(id, empresaId);
  }
}
