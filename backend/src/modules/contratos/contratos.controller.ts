import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
  HttpStatus,
  ParseIntPipe,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ContratosService } from './services/contratos.service';
import { AssinaturaDigitalService } from './services/assinatura-digital.service';
import { PdfContratoService } from './services/pdf-contrato.service';
import { CreateContratoDto, UpdateContratoDto } from './dto/contrato.dto';
import {
  CreateAssinaturaDto,
  ProcessarAssinaturaDto,
  RejeitarAssinaturaDto,
} from './dto/assinatura.dto';
import { StatusContrato } from './entities/contrato.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../common/guards/empresa.guard';
import { EmpresaId, SkipEmpresaValidation } from '../../common/decorators/empresa.decorator';

@Controller('contratos')
@UseGuards(JwtAuthGuard, EmpresaGuard)
export class ContratosController {
  private readonly logger = new Logger(ContratosController.name);

  constructor(
    private readonly contratosService: ContratosService,
    private readonly assinaturaService: AssinaturaDigitalService,
    private readonly pdfService: PdfContratoService,
  ) {}

  /**
   * Criar novo contrato
   */
  @Post()
  async criarContrato(
    @Body() createContratoDto: CreateContratoDto,
    @EmpresaId() empresaId: string,
  ) {
    try {
      const contrato = await this.contratosService.criarContrato(createContratoDto, empresaId);

      this.logger.log(`Contrato criado: ${contrato.numero}`);

      return {
        success: true,
        message: 'Contrato criado com sucesso',
        data: contrato,
      };
    } catch (error) {
      this.logger.error(`Erro ao criar contrato: ${error.message}`);
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  /**
   * Listar contratos
   */
  @Get()
  async listarContratos(
    @EmpresaId() empresaId: string,
    @Query('status') status?: StatusContrato,
    @Query('clienteId') clienteId?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    try {
      const filtros = {
        status,
        clienteId: clienteId ? parseInt(clienteId) : undefined,
        dataInicio: dataInicio ? new Date(dataInicio) : undefined,
        dataFim: dataFim ? new Date(dataFim) : undefined,
      };

      const contratos = await this.contratosService.buscarContratos(empresaId, filtros);

      return {
        success: true,
        message: 'Contratos listados com sucesso',
        data: contratos,
      };
    } catch (error) {
      this.logger.error(`Erro ao listar contratos: ${error.message}`);
      return {
        success: false,
        message: error.message,
        data: [],
      };
    }
  }

  /**
   * Buscar contrato por ID
   */
  @Get(':id')
  async buscarContrato(@Param('id', ParseIntPipe) id: number, @EmpresaId() empresaId: string) {
    // 🔒 MULTI-TENANCY: Passar empresa_id para validar isolamento
    const contrato = await this.contratosService.buscarContratoPorId(id, empresaId);
    // Se não encontrar, buscarContratoPorId lança NotFoundException automaticamente

    return {
      success: true,
      message: 'Contrato encontrado',
      data: contrato,
    };
  }

  /**
   * Buscar contrato por número
   */
  @Get('numero/:numero')
  async buscarContratoPorNumero(@Param('numero') numero: string, @EmpresaId() empresaId: string) {
    // 🔒 MULTI-TENANCY: Passar empresa_id para validar isolamento
    const contrato = await this.contratosService.buscarContratoPorNumero(numero, empresaId);

    return {
      success: true,
      message: 'Contrato encontrado',
      data: contrato,
    };
  }

  /**
   * Atualizar contrato
   */
  @Put(':id')
  async atualizarContrato(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateContratoDto: UpdateContratoDto,
    @EmpresaId() empresaId: string,
  ) {
    try {
      // 🔒 MULTI-TENANCY: Passar empresa_id
      const contrato = await this.contratosService.atualizarContrato(
        id,
        updateContratoDto,
        empresaId,
      );

      this.logger.log(`Contrato atualizado: ${contrato.numero}`);

      return {
        success: true,
        message: 'Contrato atualizado com sucesso',
        data: contrato,
      };
    } catch (error) {
      this.logger.error(`Erro ao atualizar contrato: ${error.message}`);
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  /**
   * Cancelar contrato
   */
  @Delete(':id')
  async cancelarContrato(
    @Param('id', ParseIntPipe) id: number,
    @Body('motivo') motivo: string | undefined,
    @EmpresaId() empresaId: string,
  ) {
    try {
      // 🔒 MULTI-TENANCY: Passar empresa_id
      const contrato = await this.contratosService.cancelarContrato(id, empresaId, motivo);

      this.logger.log(`Contrato cancelado: ${contrato.numero}`);

      return {
        success: true,
        message: 'Contrato cancelado com sucesso',
        data: contrato,
      };
    } catch (error) {
      this.logger.error(`Erro ao cancelar contrato: ${error.message}`);
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  /**
   * Download do PDF do contrato
   */
  @Get(':id/pdf')
  async downloadPDF(
    @Param('id', ParseIntPipe) id: number,
    @EmpresaId() empresaId: string,
    @Res() res: Response,
  ) {
    try {
      // 🔒 MULTI-TENANCY: Validar empresa_id
      const contrato = await this.contratosService.buscarContratoPorId(id, empresaId);

      if (!contrato.caminhoArquivoPDF) {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: 'PDF do contrato não encontrado',
        });
      }

      const arquivo = await this.pdfService.obterArquivoPDF(contrato.caminhoArquivoPDF);

      res.setHeader('Content-Type', 'text/html');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="contrato-${contrato.numero}.html"`,
      );

      return res.send(arquivo);
    } catch (error) {
      this.logger.error(`Erro ao baixar PDF: ${error.message}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ROTAS DE ASSINATURA DIGITAL

  /**
   * Criar solicitação de assinatura
   */
  @Post(':id/assinaturas')
  async criarAssinatura(
    @Param('id', ParseIntPipe) contratoId: number,
    @Body() createAssinaturaDto: CreateAssinaturaDto,
  ) {
    try {
      createAssinaturaDto.contratoId = contratoId;

      const assinatura = await this.assinaturaService.criarAssinatura(createAssinaturaDto);

      this.logger.log(`Assinatura criada para contrato ${contratoId}`);

      return {
        success: true,
        message: 'Solicitação de assinatura criada com sucesso',
        data: assinatura,
      };
    } catch (error) {
      this.logger.error(`Erro ao criar assinatura: ${error.message}`);
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  /**
   * Listar assinaturas do contrato
   */
  @Get(':id/assinaturas')
  async listarAssinaturas(@Param('id', ParseIntPipe) contratoId: number) {
    try {
      const assinaturas = await this.assinaturaService.buscarAssinaturasPorContrato(contratoId);

      return {
        success: true,
        message: 'Assinaturas listadas com sucesso',
        data: assinaturas,
      };
    } catch (error) {
      this.logger.error(`Erro ao listar assinaturas: ${error.message}`);
      return {
        success: false,
        message: error.message,
        data: [],
      };
    }
  }

  /**
   * Página de assinatura (sem autenticação JWT)
   */
  @Get('assinar/:token')
  @SkipEmpresaValidation()
  async paginaAssinatura(@Param('token') token: string) {
    try {
      const assinatura = await this.assinaturaService.buscarAssinaturaPorToken(token);

      return {
        success: true,
        message: 'Dados da assinatura carregados',
        data: assinatura,
      };
    } catch (error) {
      this.logger.error(`Erro ao carregar página de assinatura: ${error.message}`);
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  /**
   * Processar assinatura digital (sem autenticação JWT)
   */
  @Post('assinar/processar')
  @SkipEmpresaValidation()
  async processarAssinatura(@Body() processarAssinaturaDto: ProcessarAssinaturaDto) {
    try {
      const assinatura = await this.assinaturaService.processarAssinatura(processarAssinaturaDto);

      this.logger.log(`Assinatura processada: ${assinatura.id}`);

      return {
        success: true,
        message: 'Contrato assinado com sucesso',
        data: assinatura,
      };
    } catch (error) {
      this.logger.error(`Erro ao processar assinatura: ${error.message}`);
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  /**
   * Rejeitar assinatura (sem autenticação JWT)
   */
  @Post('assinar/rejeitar')
  @SkipEmpresaValidation()
  async rejeitarAssinatura(@Body() rejeitarAssinaturaDto: RejeitarAssinaturaDto) {
    try {
      const assinatura = await this.assinaturaService.rejeitarAssinatura(rejeitarAssinaturaDto);

      this.logger.log(`Assinatura rejeitada: ${assinatura.id}`);

      return {
        success: true,
        message: 'Assinatura rejeitada',
        data: assinatura,
      };
    } catch (error) {
      this.logger.error(`Erro ao rejeitar assinatura: ${error.message}`);
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }
}
