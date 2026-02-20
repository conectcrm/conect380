import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EmpresaId } from '../../../common/decorators/empresa.decorator';
import { EmpresaGuard } from '../../../common/guards/empresa.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permission } from '../../../common/permissions/permissions.constants';
import { JwtAuthGuard } from '../../../modules/auth/jwt-auth.guard';
import {
  CreateDepartamentoDto,
  FilterDepartamentoDto,
  UpdateDepartamentoDto,
} from '../dto/departamento.dto';
import { DepartamentoService } from '../services/departamento.service';

@Controller('departamentos')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.CONFIG_AUTOMACOES_MANAGE)
export class DepartamentoController {
  constructor(private readonly departamentoService: DepartamentoService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@EmpresaId() empresaId: string, @Body() createDto: CreateDepartamentoDto) {
    return this.departamentoService.create(empresaId, createDto);
  }

  @Get()
  async findAll(@EmpresaId() empresaId: string, @Query() filters: FilterDepartamentoDto) {
    return this.departamentoService.findAll(empresaId, filters);
  }

  @Get('nucleo/:nucleoId')
  async findByNucleo(@EmpresaId() empresaId: string, @Param('nucleoId') nucleoId: string) {
    return this.departamentoService.findByNucleo(empresaId, nucleoId);
  }

  @Get(':id')
  async findOne(@EmpresaId() empresaId: string, @Param('id') id: string) {
    return this.departamentoService.findOne(empresaId, id);
  }

  @Get(':id/estatisticas')
  async getEstatisticas(@EmpresaId() empresaId: string, @Param('id') id: string) {
    return this.departamentoService.getEstatisticas(empresaId, id);
  }

  @Put(':id')
  async update(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateDepartamentoDto,
  ) {
    return this.departamentoService.update(empresaId, id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@EmpresaId() empresaId: string, @Param('id') id: string) {
    await this.departamentoService.remove(empresaId, id);
  }

  @Post(':id/atendentes/:atendenteId')
  async adicionarAtendente(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Param('atendenteId') atendenteId: string,
  ) {
    return this.departamentoService.adicionarAtendente(empresaId, id, atendenteId);
  }

  @Delete(':id/atendentes/:atendenteId')
  async removerAtendente(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Param('atendenteId') atendenteId: string,
  ) {
    return this.departamentoService.removerAtendente(empresaId, id, atendenteId);
  }

  @Post('reordenar')
  @HttpCode(HttpStatus.OK)
  async reordenar(
    @EmpresaId() empresaId: string,
    @Body() body: { nucleoId: string; ordenacao: { id: string; ordem: number }[] },
  ) {
    await this.departamentoService.reordenar(empresaId, body.nucleoId, body.ordenacao);
    return { message: 'Departamentos reordenados com sucesso' };
  }
}
