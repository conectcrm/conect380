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
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { OportunidadesService } from './oportunidades.service';
import {
  CreateOportunidadeDto,
  UpdateOportunidadeDto,
  UpdateEstagioDto,
  MetricasQueryDto,
} from './dto/oportunidade.dto';
import { CreateAtividadeDto } from './dto/atividade.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../common/guards/empresa.guard';
import { EmpresaId } from '../../common/decorators/empresa.decorator';
import { EstagioOportunidade } from './oportunidade.entity';

@Controller('oportunidades')
@UseGuards(JwtAuthGuard, EmpresaGuard)
export class OportunidadesController {
  constructor(private readonly oportunidadesService: OportunidadesService) {}

  @Post()
  create(@Body() createOportunidadeDto: CreateOportunidadeDto, @EmpresaId() empresaId: string) {
    return this.oportunidadesService.create(createOportunidadeDto, empresaId);
  }

  @Get()
  findAll(
    @EmpresaId() empresaId: string,
    @Query('estagio') estagio?: EstagioOportunidade,
    @Query('responsavel_id') responsavel_id?: string,
    @Query('cliente_id') cliente_id?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    const filters = {
      estagio,
      responsavel_id: responsavel_id || undefined,
      cliente_id: cliente_id || undefined,
      dataInicio,
      dataFim,
    };

    return this.oportunidadesService.findAll(empresaId, filters);
  }

  @Get('pipeline')
  getPipelineData(@EmpresaId() empresaId: string) {
    return this.oportunidadesService.getPipelineData(empresaId);
  }

  @Get('metricas')
  getMetricas(@EmpresaId() empresaId: string, @Query() queryDto?: MetricasQueryDto) {
    return this.oportunidadesService.getMetricas(empresaId, queryDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @EmpresaId() empresaId: string) {
    return this.oportunidadesService.findOne(id, empresaId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOportunidadeDto: UpdateOportunidadeDto,
    @EmpresaId() empresaId: string,
  ) {
    return this.oportunidadesService.update(id, updateOportunidadeDto, empresaId);
  }

  @Patch(':id/estagio')
  updateEstagio(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEstagioDto: UpdateEstagioDto,
    @EmpresaId() empresaId: string,
  ) {
    return this.oportunidadesService.updateEstagio(id, updateEstagioDto, empresaId);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @EmpresaId() empresaId: string) {
    return this.oportunidadesService.remove(id, empresaId);
  }

  @Get(':id/atividades')
  listarAtividades(@Param('id', ParseIntPipe) id: number, @EmpresaId() empresaId: string) {
    return this.oportunidadesService.listarAtividades(id, empresaId);
  }

  @Post(':id/atividades')
  createAtividade(
    @Param('id', ParseIntPipe) id: number,
    @Body() createAtividadeDto: CreateAtividadeDto,
    @EmpresaId() empresaId: string,
    @Request() req,
  ) {
    createAtividadeDto.oportunidade_id = id;
    return this.oportunidadesService.createAtividade(createAtividadeDto, {
      userId: req.user?.id,
      empresaId,
    });
  }
}
