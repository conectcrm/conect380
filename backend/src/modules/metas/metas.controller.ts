import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { MetasService, CreateMetaDto, UpdateMetaDto } from './metas.service';

@Controller('metas')
export class MetasController {
  constructor(private readonly metasService: MetasService) { }

  @Post()
  create(@Body() createMetaDto: CreateMetaDto) {
    return this.metasService.create(createMetaDto);
  }

  @Get()
  findAll(
    @Query('tipo') tipo?: string,
    @Query('periodo') periodo?: string,
    @Query('vendedorId') vendedorId?: string,
    @Query('regiao') regiao?: string,
  ) {
    // Se filtros específicos forem fornecidos
    if (tipo && periodo) {
      return this.metasService.findByPeriodo(tipo, periodo);
    }

    if (vendedorId) {
      return this.metasService.findByVendedor(parseInt(vendedorId));
    }

    // Retorna todas as metas
    return this.metasService.findAll();
  }

  @Get('atual')
  getMetaAtual(
    @Query('vendedorId') vendedorId?: string,
    @Query('regiao') regiao?: string,
  ) {
    const vendedorIdNumber = vendedorId ? parseInt(vendedorId) : undefined;
    return this.metasService.getMetaAtual(vendedorIdNumber, regiao);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.metasService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateMetaDto: UpdateMetaDto,
  ) {
    return this.metasService.update(id, updateMetaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.metasService.remove(id);
  }
}
