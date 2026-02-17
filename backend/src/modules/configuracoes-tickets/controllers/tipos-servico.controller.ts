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
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { TiposServicoService } from '../services/tipos-servico.service';
import { CreateTipoServicoDto } from '../dto/create-tipo-servico.dto';
import { UpdateTipoServicoDto } from '../dto/update-tipo-servico.dto';

@Controller('configuracoes-tickets/tipos-servico')
@UseGuards(JwtAuthGuard, EmpresaGuard)
export class TiposServicoController {
  constructor(private readonly tiposService: TiposServicoService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async listarTodos() {
    return await this.tiposService.listarTodos();
  }

  @Get('ativos')
  @HttpCode(HttpStatus.OK)
  async listarAtivos() {
    return await this.tiposService.listarAtivos();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async buscarPorId(@Param('id') id: string) {
    return await this.tiposService.buscarPorId(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async criar(@Body() dto: CreateTipoServicoDto) {
    return await this.tiposService.criar(dto);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async atualizar(@Param('id') id: string, @Body() dto: UpdateTipoServicoDto) {
    return await this.tiposService.atualizar(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletar(@Param('id') id: string) {
    await this.tiposService.deletar(id);
  }

  @Patch(':id/inativar')
  @HttpCode(HttpStatus.OK)
  async inativar(@Param('id') id: string) {
    return await this.tiposService.inativar(id);
  }

  @Patch(':id/ativar')
  @HttpCode(HttpStatus.OK)
  async ativar(@Param('id') id: string) {
    return await this.tiposService.ativar(id);
  }
}
