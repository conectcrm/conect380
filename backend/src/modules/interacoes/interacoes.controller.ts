import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { InteracoesService } from './interacoes.service';
import { CreateInteracaoDto, UpdateInteracaoDto, InteracaoFiltroDto } from './dto/interacao.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../common/guards/empresa.guard';
import { EmpresaId } from '../../common/decorators/empresa.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Interações')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, EmpresaGuard)
@Controller('interacoes')
export class InteracoesController {
  constructor(private readonly interacoesService: InteracoesService) { }

  @Post()
  create(@Body() dto: CreateInteracaoDto, @EmpresaId() empresaId: string) {
    return this.interacoesService.create(dto, empresaId);
  }

  @Get()
  findAll(@EmpresaId() empresaId: string, @Query() filtros: InteracaoFiltroDto) {
    return this.interacoesService.findAll(empresaId, filtros);
  }

  @Get('estatisticas')
  getEstatisticas(@EmpresaId() empresaId: string) {
    return this.interacoesService.getEstatisticas(empresaId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @EmpresaId() empresaId: string) {
    return this.interacoesService.findOne(id, empresaId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateInteracaoDto,
    @EmpresaId() empresaId: string,
  ) {
    return this.interacoesService.update(id, dto, empresaId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @EmpresaId() empresaId: string) {
    return this.interacoesService.remove(id, empresaId);
  }
}

