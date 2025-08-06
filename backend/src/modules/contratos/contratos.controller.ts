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
import { CreateAssinaturaDto, ProcessarAssinaturaDto, RejeitarAssinaturaDto } from './dto/assinatura.dto';
import { StatusContrato } from './entities/contrato.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('contratos')
@UseGuards(JwtAuthGuard)
export class ContratosController {
  private readonly logger = new Logger(ContratosController.name);

  constructor(
    private readonly contratosService: ContratosService,
    private readonly assinaturaService: AssinaturaDigitalService,
    private readonly pdfService: PdfContratoService,
  ) { }

  /**
   * Criar novo contrato
   */
  @Post()
  async criarContrato(@Body() createContratoDto: CreateContratoDto) {
    try {
      const contrato = await this.contratosService.criarContrato(createContratoDto);

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
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Query('status') status?: StatusContrato,
    @Query('clienteId', ParseIntPipe) clienteId?: number,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    try {
      const filtros = {
        status,
        clienteId,
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
  async buscarContrato(@Param('id', ParseIntPipe) id: number) {
    try {
      const contrato = await this.contratosService.buscarContratoPorId(id);

      return {
        success: true,
        message: 'Contrato encontrado',
        data: contrato,
      };
    } catch (error) {
      this.logger.error(`Erro ao buscar contrato: ${error.message}`);
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  /**
   * Buscar contrato por número
   */
  @Get('numero/:numero')
  async buscarContratoPorNumero(@Param('numero') numero: string) {
    try {
      const contrato = await this.contratosService.buscarContratoPorNumero(numero);

      return {
        success: true,
        message: 'Contrato encontrado',
        data: contrato,
      };
    } catch (error) {
      this.logger.error(`Erro ao buscar contrato: ${error.message}`);
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  /**
   * Atualizar contrato
   */
  @Put(':id')
  async atualizarContrato(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateContratoDto: UpdateContratoDto,
  ) {
    try {
      const contrato = await this.contratosService.atualizarContrato(id, updateContratoDto);

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
    @Body('motivo') motivo?: string,
  ) {
    try {
      const contrato = await this.contratosService.cancelarContrato(id, motivo);

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
    @Res() res: Response,
  ) {
    try {
      const contrato = await this.contratosService.buscarContratoPorId(id);

      if (!contrato.caminhoArquivoPDF) {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: 'PDF do contrato não encontrado',
        });
      }

      const arquivo = await this.pdfService.obterArquivoPDF(contrato.caminhoArquivoPDF);

      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="contrato-${contrato.numero}.html"`);

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
