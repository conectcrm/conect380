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
import { EmpresaId } from '../../common/decorators/empresa.decorator';

@ApiTags('Agenda')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, EmpresaGuard)
@Controller('agenda-eventos')
export class AgendaController {
  constructor(private readonly agendaService: AgendaService) {}

  @Post()
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
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAgendaEventoDto,
    @EmpresaId() empresaId: string,
  ) {
    return this.agendaService.update(id, dto, empresaId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @EmpresaId() empresaId: string) {
    return this.agendaService.remove(id, empresaId);
  }
}
