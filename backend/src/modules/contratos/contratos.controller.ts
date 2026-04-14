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
  HttpException,
  InternalServerErrorException,
  ParseIntPipe,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import * as path from 'path';
import { ContratosService } from './services/contratos.service';
import { AssinaturaDigitalService } from './services/assinatura-digital.service';
import { PdfContratoService } from './services/pdf-contrato.service';
import {
  ConfirmarAssinaturaExternaDto,
  CreateContratoDto,
  UpdateContratoDto,
} from './dto/contrato.dto';
import {
  CreateAssinaturaDto,
  ProcessarAssinaturaDto,
  RejeitarAssinaturaDto,
} from './dto/assinatura.dto';
import { StatusContrato } from './entities/contrato.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { EmpresaGuard } from '../../common/guards/empresa.guard';
import { EmpresaId, SkipEmpresaValidation } from '../../common/decorators/empresa.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permission } from '../../common/permissions/permissions.constants';

@Controller('contratos')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
export class ContratosController {
  private readonly logger = new Logger(ContratosController.name);

  constructor(
    private readonly contratosService: ContratosService,
    private readonly assinaturaService: AssinaturaDigitalService,
    private readonly pdfService: PdfContratoService,
  ) {}

  private resolveErrorMessage(error: unknown, fallbackMessage: string): string {
    if (error instanceof HttpException) {
      const response = error.getResponse();

      if (typeof response === 'string' && response.trim()) {
        return response;
      }

      if (response && typeof response === 'object') {
        const responseRecord = response as Record<string, unknown>;
        const responseMessage = responseRecord.message;

        if (Array.isArray(responseMessage)) {
          const joined = responseMessage
            .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
            .join('. ');

          if (joined) {
            return joined;
          }
        }

        if (typeof responseMessage === 'string' && responseMessage.trim()) {
          return responseMessage;
        }
      }
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message?: unknown }).message === 'string'
    ) {
      const message = (error as { message: string }).message.trim();
      if (message) {
        return message;
      }
    }

    return fallbackMessage;
  }

  private rethrowPublicSignatureError(error: any, contexto: string): never {
    this.logger.error(`Erro em ${contexto}: ${error?.message || error}`);

    if (error instanceof HttpException) {
      throw error;
    }

    throw new InternalServerErrorException('Erro interno ao processar assinatura');
  }

  /**
   * Criar novo contrato
   */
  @Post()
  @Permissions(Permission.COMERCIAL_PROPOSTAS_CREATE)
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
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao criar contrato: ${this.resolveErrorMessage(error, 'Falha ao criar contrato')}`,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro interno ao criar contrato');
    }
  }

  /**
   * Listar contratos
   */
  @Get()
  @Permissions(Permission.COMERCIAL_PROPOSTAS_READ)
  async listarContratos(
    @EmpresaId() empresaId: string,
    @Query('status') status?: StatusContrato,
    @Query('clienteId') clienteId?: string,
    @Query('propostaId') propostaId?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    try {
      const filtros = {
        status,
        clienteId: clienteId ? parseInt(clienteId, 10) : undefined,
        propostaId: propostaId?.trim() || undefined,
        dataInicio: dataInicio ? new Date(dataInicio) : undefined,
        dataFim: dataFim ? new Date(dataFim) : undefined,
      };

      const contratos = await this.contratosService.buscarContratos(empresaId, filtros);

      return {
        success: true,
        message: 'Contratos listados com sucesso',
        data: contratos,
      };
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao listar contratos: ${this.resolveErrorMessage(error, 'Falha ao listar contratos')}`,
      );
      return {
        success: false,
        message: this.resolveErrorMessage(error, 'Falha ao listar contratos'),
        data: [],
      };
    }
  }

  /**
   * Buscar contrato por ID
   */
  @Get(':id')
  @Permissions(Permission.COMERCIAL_PROPOSTAS_READ)
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
  @Permissions(Permission.COMERCIAL_PROPOSTAS_READ)
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
  @Permissions(Permission.COMERCIAL_PROPOSTAS_UPDATE)
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
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao atualizar contrato: ${this.resolveErrorMessage(error, 'Falha ao atualizar contrato')}`,
      );
      return {
        success: false,
        message: this.resolveErrorMessage(error, 'Falha ao atualizar contrato'),
        data: null,
      };
    }
  }

  /**
   * Cancelar contrato
   */
  @Delete(':id')
  @Permissions(Permission.COMERCIAL_PROPOSTAS_DELETE)
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
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao cancelar contrato: ${this.resolveErrorMessage(error, 'Falha ao cancelar contrato')}`,
      );
      return {
        success: false,
        message: this.resolveErrorMessage(error, 'Falha ao cancelar contrato'),
        data: null,
      };
    }
  }

  /**
   * Confirmar assinatura externa do contrato
   */
  @Post(':id/confirmar-assinatura-externa')
  @Permissions(Permission.COMERCIAL_PROPOSTAS_UPDATE)
  async confirmarAssinaturaExterna(
    @Param('id', ParseIntPipe) id: number,
    @Body() confirmarAssinaturaExternaDto: ConfirmarAssinaturaExternaDto,
    @EmpresaId() empresaId: string,
    @CurrentUser() user: { id?: string; sub?: string },
  ) {
    try {
      const usuarioConfirmacaoId = String(user?.id || user?.sub || '').trim() || undefined;

      const contrato = await this.contratosService.confirmarAssinaturaExterna(
        id,
        empresaId,
        usuarioConfirmacaoId,
        confirmarAssinaturaExternaDto,
      );

      return {
        success: true,
        message: 'Assinatura externa registrada com sucesso',
        data: contrato,
      };
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao confirmar assinatura externa: ${this.resolveErrorMessage(error, 'Falha ao confirmar assinatura externa')}`,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro interno ao confirmar assinatura externa');
    }
  }

  /**
   * Download do PDF do contrato
   */
  @Get(':id/pdf')
  @Permissions(Permission.COMERCIAL_PROPOSTAS_SEND)
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
          message: 'PDF do contrato nao encontrado',
        });
      }

      const arquivo = await this.pdfService.obterArquivoPDF(contrato.caminhoArquivoPDF);

      const ext = path.extname(contrato.caminhoArquivoPDF || '').toLowerCase();
      const isPdf = ext === '.pdf';
      const nomeArquivo = `contrato-${contrato.numero}.${isPdf ? 'pdf' : 'html'}`;

      res.setHeader('Content-Type', isPdf ? 'application/pdf' : 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=\"${nomeArquivo}\"`);

      return res.send(arquivo);
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao baixar PDF: ${this.resolveErrorMessage(error, 'Falha ao baixar PDF do contrato')}`,
      );
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: this.resolveErrorMessage(error, 'Falha ao baixar PDF do contrato'),
      });
    }
  }

  // ROTAS DE ASSINATURA DIGITAL

  /**
   * Criar solicitação de assinatura
   */
  @Post(':id/assinaturas')
  @Permissions(Permission.COMERCIAL_PROPOSTAS_SEND)
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
        message: 'Solicitacao de assinatura criada com sucesso',
        data: assinatura,
      };
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao criar assinatura: ${this.resolveErrorMessage(error, 'Falha ao criar assinatura')}`,
      );
      return {
        success: false,
        message: this.resolveErrorMessage(error, 'Falha ao criar assinatura'),
        data: null,
      };
    }
  }

  /**
   * Listar assinaturas do contrato
   */
  @Get(':id/assinaturas')
  @Permissions(Permission.COMERCIAL_PROPOSTAS_READ)
  async listarAssinaturas(@Param('id', ParseIntPipe) contratoId: number) {
    try {
      const assinaturas = await this.assinaturaService.buscarAssinaturasPorContrato(contratoId);

      return {
        success: true,
        message: 'Assinaturas listadas com sucesso',
        data: assinaturas,
      };
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao listar assinaturas: ${this.resolveErrorMessage(error, 'Falha ao listar assinaturas')}`,
      );
      return {
        success: false,
        message: this.resolveErrorMessage(error, 'Falha ao listar assinaturas'),
        data: [],
      };
    }
  }

  /**
   * Página de assinatura (sem autenticação JWT)
   */
  @Get('assinar/:token')
  @Public()
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
      this.rethrowPublicSignatureError(error, 'carregar pagina de assinatura');
    }
  }

  /**
   * Processar assinatura digital (sem autenticação JWT)
   */
  @Post('assinar/processar')
  @Public()
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
      this.rethrowPublicSignatureError(error, 'processar assinatura');
    }
  }

  /**
   * Rejeitar assinatura (sem autenticação JWT)
   */
  @Post('assinar/rejeitar')
  @Public()
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
      this.rethrowPublicSignatureError(error, 'rejeitar assinatura');
    }
  }
}
