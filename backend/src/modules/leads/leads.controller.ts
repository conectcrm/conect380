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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { LeadsService } from './leads.service';
import {
  CreateLeadDto,
  UpdateLeadDto,
  ConvertLeadDto,
  CaptureLeadDto,
  LeadFiltros,
} from './dto/lead.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../common/guards/empresa.guard';
import { EmpresaId, SkipEmpresaValidation } from '../../common/decorators/empresa.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { StatusLead, OrigemLead } from './lead.entity';

@Controller('leads')
@UseGuards(JwtAuthGuard, EmpresaGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) { }

  /**
   * Capturar lead de formulário público (SEM autenticação)
   */
  @Post('capture')
  @SkipEmpresaValidation()
  capturePublic(@Body() dto: CaptureLeadDto) {
    return this.leadsService.captureFromPublic(dto);
  }

  /**
   * Criar novo lead (COM autenticação)
   */
  @Post()
  create(@Body() createLeadDto: CreateLeadDto, @EmpresaId() empresaId: string) {
    return this.leadsService.create(createLeadDto, empresaId);
  }

  /**
   * Listar todos os leads com filtros
   */
  @Get()
  findAll(
    @EmpresaId() empresaId: string,
    @Query() pagination: PaginationDto,
    @Query('status') status?: StatusLead,
    @Query('origem') origem?: OrigemLead,
    @Query('responsavel_id') responsavel_id?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
    @Query('busca') busca?: string,
  ) {
    const filtros: LeadFiltros = {
      status,
      origem,
      responsavel_id,
      dataInicio,
      dataFim,
      busca,
      page: pagination.page,
      limit: pagination.limit,
    };

    return this.leadsService.findAll(empresaId, filtros);
  }

  /**
   * Obter estatísticas de leads
   */
  @Get('estatisticas')
  getEstatisticas(@EmpresaId() empresaId: string) {
    return this.leadsService.getEstatisticas(empresaId);
  }

  /**
   * Buscar lead por ID
   */
  @Get(':id')
  findOne(@Param('id') id: string, @EmpresaId() empresaId: string) {
    return this.leadsService.findOne(id, empresaId);
  }

  /**
   * Atualizar lead
   */
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateLeadDto: UpdateLeadDto,
    @EmpresaId() empresaId: string,
  ) {
    return this.leadsService.update(id, updateLeadDto, empresaId);
  }

  /**
   * Deletar lead
   */
  @Delete(':id')
  remove(@Param('id') id: string, @EmpresaId() empresaId: string) {
    return this.leadsService.remove(id, empresaId);
  }

  /**
   * Converter lead em oportunidade
   */
  @Post(':id/converter')
  converter(
    @Param('id') id: string,
    @Body() convertLeadDto: ConvertLeadDto,
    @EmpresaId() empresaId: string,
  ) {
    return this.leadsService.converterParaOportunidade(id, convertLeadDto, empresaId);
  }

  /**
   * Importar leads de arquivo CSV
   */
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(
    @UploadedFile() file: Express.Multer.File,
    @EmpresaId() empresaId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo CSV não fornecido');
    }

    // Verificar se é CSV
    const isCSV =
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.originalname.endsWith('.csv');

    if (!isCSV) {
      throw new BadRequestException('Arquivo deve ser CSV');
    }

    // Converter buffer para string
    const csvContent = file.buffer.toString('utf-8');

    return this.leadsService.importFromCsv(csvContent, empresaId);
  }
}
