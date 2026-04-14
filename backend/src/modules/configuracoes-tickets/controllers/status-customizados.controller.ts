import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EmpresaGuard } from '../../../common/guards/empresa.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permission } from '../../../common/permissions/permissions.constants';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { StatusCustomizadosService } from '../services/status-customizados.service';
import { CreateStatusCustomizadoDto } from '../dto/create-status-customizado.dto';
import { UpdateStatusCustomizadoDto } from '../dto/update-status-customizado.dto';

@Controller('configuracoes-tickets/status-customizados')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.ATENDIMENTO_SLA_MANAGE)
export class StatusCustomizadosController {
  constructor(private readonly statusService: StatusCustomizadosService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async listarTodos() {
    return await this.statusService.listarTodos();
  }

  @Get('ativos')
  @HttpCode(HttpStatus.OK)
  async listarAtivos() {
    return await this.statusService.listarAtivos();
  }

  @Get('nivel/:nivelId')
  @HttpCode(HttpStatus.OK)
  async listarPorNivel(@Param('nivelId') nivelId: string) {
    return await this.statusService.listarPorNivel(nivelId);
  }

  @Get('nivel/:nivelId/ativos')
  @HttpCode(HttpStatus.OK)
  async listarAtivosPorNivel(@Param('nivelId') nivelId: string) {
    return await this.statusService.listarAtivosPorNivel(nivelId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async buscarPorId(@Param('id') id: string) {
    return await this.statusService.buscarPorId(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async criar(@Body() dto: CreateStatusCustomizadoDto) {
    return await this.statusService.criar(dto);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async atualizar(@Param('id') id: string, @Body() dto: UpdateStatusCustomizadoDto) {
    return await this.statusService.atualizar(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletar(@Param('id') id: string) {
    await this.statusService.deletar(id);
  }

  @Patch(':id/inativar')
  @HttpCode(HttpStatus.OK)
  async inativar(@Param('id') id: string) {
    return await this.statusService.inativar(id);
  }

  @Patch(':id/ativar')
  @HttpCode(HttpStatus.OK)
  async ativar(@Param('id') id: string) {
    return await this.statusService.ativar(id);
  }
}
