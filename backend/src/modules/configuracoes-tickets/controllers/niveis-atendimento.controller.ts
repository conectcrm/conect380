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
import { NiveisAtendimentoService } from '../services/niveis-atendimento.service';
import { CreateNivelAtendimentoDto } from '../dto/create-nivel-atendimento.dto';
import { UpdateNivelAtendimentoDto } from '../dto/update-nivel-atendimento.dto';

@Controller('configuracoes-tickets/niveis-atendimento')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.ATENDIMENTO_SLA_MANAGE)
export class NiveisAtendimentoController {
  constructor(private readonly niveisService: NiveisAtendimentoService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async listarTodos() {
    return await this.niveisService.listarTodos();
  }

  @Get('ativos')
  @HttpCode(HttpStatus.OK)
  async listarAtivos() {
    return await this.niveisService.listarAtivos();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async buscarPorId(@Param('id') id: string) {
    return await this.niveisService.buscarPorId(id);
  }

  @Get('codigo/:codigo')
  @HttpCode(HttpStatus.OK)
  async buscarPorCodigo(@Param('codigo') codigo: string) {
    return await this.niveisService.buscarPorCodigo(codigo);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async criar(@Body() dto: CreateNivelAtendimentoDto) {
    return await this.niveisService.criar(dto);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async atualizar(@Param('id') id: string, @Body() dto: UpdateNivelAtendimentoDto) {
    return await this.niveisService.atualizar(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletar(@Param('id') id: string) {
    await this.niveisService.deletar(id);
  }

  @Patch(':id/inativar')
  @HttpCode(HttpStatus.OK)
  async inativar(@Param('id') id: string) {
    return await this.niveisService.inativar(id);
  }

  @Patch(':id/ativar')
  @HttpCode(HttpStatus.OK)
  async ativar(@Param('id') id: string) {
    return await this.niveisService.ativar(id);
  }
}
