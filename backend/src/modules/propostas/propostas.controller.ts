import { Logger,
  Controller,
  Put,
  Param,
  Body,
  HttpStatus,
  HttpException,
  Get,
  Post,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { PropostasService, Proposta } from './propostas.service';
import {
  AtualizarStatusDto,
  PropostaResponseDto,
  CriarPropostaDto,
  PropostaDto,
} from './dto/proposta.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../common/guards/empresa.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/permissions/permissions.constants';
import { EmpresaId } from '../../common/decorators/empresa.decorator';

@Controller('propostas')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.COMERCIAL_PROPOSTAS_READ)
export class PropostasController {
  private readonly logger = new Logger(PropostasController.name);
  constructor(private readonly propostasService: PropostasService) {}

  // Helper para converter Proposta para PropostaDto
  private toPropostaDto(proposta: Proposta): PropostaDto {
    return {
      id: proposta.id,
      numero: proposta.numero,
      titulo: proposta.titulo,
      status: proposta.status,
      cliente:
        typeof proposta.cliente === 'object' && proposta.cliente?.nome
          ? proposta.cliente.nome
          : typeof proposta.cliente === 'string'
            ? proposta.cliente
            : 'Cliente nao informado',
      valor: proposta.valor,
      createdAt: proposta.createdAt,
      updatedAt: proposta.updatedAt,
      source: proposta.source,
      observacoes: proposta.observacoes,
      vendedor: proposta.vendedor,
      formaPagamento: proposta.formaPagamento,
      validadeDias: proposta.validadeDias,
    };
  }

  /**
   * Lista todas as propostas
   */
  @Get()
  async listarPropostas(@EmpresaId() empresaId: string): Promise<any> {
    try {
      const propostas = await this.propostasService.listarPropostas(empresaId);

      return {
        success: true,
        propostas,
        total: propostas.length,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao listar propostas',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Atualiza o status de uma proposta
   */
  @Put(':id/status')
  @Permissions(Permission.COMERCIAL_PROPOSTAS_UPDATE)
  async atualizarStatus(
    @EmpresaId() empresaId: string,
    @Param('id') propostaId: string,
    @Body() updateData: AtualizarStatusDto,
  ): Promise<PropostaResponseDto> {
    try {
      this.logger.log(`[PROPOSTAS] Atualizando status da proposta ${propostaId} para: ${updateData.status}`);

      const resultado = await this.propostasService.atualizarStatus(
        propostaId,
        updateData.status,
        updateData.source || 'api',
        updateData.observacoes,
        empresaId,
      );

      this.logger.log('[PROPOSTAS] Status atualizado com sucesso');

      return {
        success: true,
        message: 'Status atualizado com sucesso',
        proposta: this.toPropostaDto(resultado),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('[PROPOSTAS] Erro ao atualizar status:', error);

      throw new HttpException(
        {
          success: false,
          message: 'Erro ao atualizar status da proposta',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtem uma proposta por ID
   */
  @Get(':id')
  async obterProposta(
    @EmpresaId() empresaId: string,
    @Param('id') propostaId: string,
  ): Promise<PropostaResponseDto> {
    try {
      const proposta = await this.propostasService.obterProposta(propostaId, empresaId);

      if (!proposta) {
        throw new HttpException(
          {
            success: false,
            message: 'Proposta nao encontrada',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        proposta: this.toPropostaDto(proposta),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Erro ao buscar proposta',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Cria uma nova proposta
   */
  @Post()
  @Permissions(Permission.COMERCIAL_PROPOSTAS_CREATE)
  async criarProposta(
    @EmpresaId() empresaId: string,
    @Body() dadosProposta: any,
  ): Promise<PropostaResponseDto> {
    try {
      this.logger.log('[PROPOSTAS] Criando nova proposta:', JSON.stringify(dadosProposta, null, 2));

      // Converter dados do frontend para formato interno
      const propostaParaCriar: Partial<Proposta> = {
        titulo: dadosProposta.titulo || `Proposta ${Date.now()}`,
        cliente: dadosProposta.cliente,
        produtos: dadosProposta.produtos || [],
        subtotal: dadosProposta.subtotal || 0,
        descontoGlobal: dadosProposta.descontoGlobal || 0,
        impostos: dadosProposta.impostos || 0,
        total: dadosProposta.total || dadosProposta.valor || 0,
        valor: dadosProposta.valor || dadosProposta.total || 0,
        formaPagamento: dadosProposta.formaPagamento || 'avista',
        validadeDias: dadosProposta.validadeDias || 30,
        observacoes: dadosProposta.observacoes,
        incluirImpostosPDF: dadosProposta.incluirImpostosPDF || false,
        vendedor: dadosProposta.vendedor,
      };

      const proposta = await this.propostasService.criarProposta(propostaParaCriar, empresaId);

      return {
        success: true,
        message: 'Proposta criada com sucesso',
        proposta: this.toPropostaDto(proposta),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('[PROPOSTAS] Erro ao criar proposta:', error);

      throw new HttpException(
        {
          success: false,
          message: 'Erro ao criar proposta',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Remove uma proposta
   */
  @Delete(':id')
  @Permissions(Permission.COMERCIAL_PROPOSTAS_DELETE)
  async removerProposta(
    @EmpresaId() empresaId: string,
    @Param('id') propostaId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log(`[PROPOSTAS] Removendo proposta: ${propostaId}`);

      await this.propostasService.removerProposta(propostaId, empresaId);

      return {
        success: true,
        message: 'Proposta removida com sucesso',
      };
    } catch (error) {
      this.logger.error('[PROPOSTAS] Erro ao remover proposta:', error);

      throw new HttpException(
        {
          success: false,
          message: 'Erro ao remover proposta',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
