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
import { MetasService, CreateMetaDto, UpdateMetaDto } from './metas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../common/guards/empresa.guard';
import { EmpresaId } from '../../common/decorators/empresa.decorator';

@Controller('metas')
@UseGuards(JwtAuthGuard, EmpresaGuard)
export class MetasController {
  constructor(private readonly metasService: MetasService) {}

  @Post()
  create(@EmpresaId() empresaId: string, @Body() createMetaDto: CreateMetaDto) {
    return this.metasService.create(createMetaDto, empresaId);
  }

  @Get()
  findAll(
    @EmpresaId() empresaId: string,
    @Query('tipo') tipo?: string,
    @Query('periodo') periodo?: string,
    @Query('vendedorId') vendedorId?: string,
    @Query('regiao') regiao?: string,
  ) {
    if (tipo && periodo) {
      return this.metasService.findByPeriodo(tipo, periodo, empresaId);
    }

    if (vendedorId) {
      return this.metasService.findByVendedor(vendedorId, empresaId);
    }

    if (regiao) {
      return this.metasService
        .getMetaAtual(undefined, regiao, empresaId)
        .then((meta) => (meta ? [meta] : []));
    }

    return this.metasService.findAll(empresaId);
  }

  @Get('atual')
  getMetaAtual(
    @EmpresaId() empresaId: string,
    @Query('vendedorId') vendedorId?: string,
    @Query('regiao') regiao?: string,
  ) {
    return this.metasService.getMetaAtual(vendedorId, regiao, empresaId);
  }

  @Get(':id')
  findOne(@EmpresaId() empresaId: string, @Param('id') id: string) {
    return this.metasService.findOne(id, empresaId);
  }

  @Patch(':id')
  update(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Body() updateMetaDto: UpdateMetaDto,
  ) {
    return this.metasService.update(id, updateMetaDto, empresaId);
  }

  @Delete(':id')
  remove(@EmpresaId() empresaId: string, @Param('id') id: string) {
    return this.metasService.remove(id, empresaId);
  }
}
