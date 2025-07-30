import { Controller, Put, Param, Body, HttpStatus, HttpException, Get, Post, Delete } from '@nestjs/common';
import { PropostasService, Proposta } from './propostas.service';
import { AtualizarStatusDto, PropostaResponseDto, CriarPropostaDto, PropostaDto } from './dto/proposta.dto';

@Controller('propostas')
export class PropostasController {
  constructor(private readonly propostasService: PropostasService) { }

  // Helper para converter Proposta para PropostaDto
  private toPropostaDto(proposta: Proposta): PropostaDto {
    return {
      id: proposta.id,
      numero: proposta.numero,
      titulo: proposta.titulo,
      status: proposta.status,
      cliente: typeof proposta.cliente === 'object' && proposta.cliente?.nome
        ? proposta.cliente.nome
        : (typeof proposta.cliente === 'string' ? proposta.cliente : 'Cliente não informado'),
      valor: proposta.valor,
      createdAt: proposta.createdAt,
      updatedAt: proposta.updatedAt,
      source: proposta.source,
      observacoes: proposta.observacoes,
      vendedor: proposta.vendedor,
      formaPagamento: proposta.formaPagamento,
      validadeDias: proposta.validadeDias
    };
  }

  /**
   * Lista todas as propostas
   */
  @Get()
  async listarPropostas(): Promise<any> {
    try {
      const propostas = await this.propostasService.listarPropostas();

      return {
        success: true,
        propostas,
        total: propostas.length
      };

    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao listar propostas',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Atualiza o status de uma proposta
   */
  @Put(':id/status')
  async atualizarStatus(
    @Param('id') propostaId: string,
    @Body() updateData: AtualizarStatusDto
  ): Promise<PropostaResponseDto> {
    try {
      console.log(`📝 Atualizando status da proposta ${propostaId} para: ${updateData.status}`);

      const resultado = await this.propostasService.atualizarStatus(
        propostaId,
        updateData.status,
        updateData.source || 'api',
        updateData.observacoes
      );

      console.log('✅ Status atualizado com sucesso');

      return {
        success: true,
        message: 'Status atualizado com sucesso',
        proposta: this.toPropostaDto(resultado),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);

      throw new HttpException(
        {
          success: false,
          message: 'Erro ao atualizar status da proposta',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Obtém uma proposta por ID
   */
  @Get(':id')
  async obterProposta(@Param('id') propostaId: string): Promise<PropostaResponseDto> {
    try {
      const proposta = await this.propostasService.obterProposta(propostaId);

      if (!proposta) {
        throw new HttpException(
          {
            success: false,
            message: 'Proposta não encontrada'
          },
          HttpStatus.NOT_FOUND
        );
      }

      return {
        success: true,
        proposta: this.toPropostaDto(proposta)
      };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Erro ao buscar proposta',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Cria uma nova proposta
   */
  @Post()
  async criarProposta(@Body() dadosProposta: any): Promise<PropostaResponseDto> {
    try {
      console.log('📝 Criando nova proposta:', JSON.stringify(dadosProposta, null, 2));

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
        vendedor: dadosProposta.vendedor
      };

      const proposta = await this.propostasService.criarProposta(propostaParaCriar);

      return {
        success: true,
        message: 'Proposta criada com sucesso',
        proposta: this.toPropostaDto(proposta),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Erro ao criar proposta:', error);

      throw new HttpException(
        {
          success: false,
          message: 'Erro ao criar proposta',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Remove uma proposta
   */
  @Delete(':id')
  async removerProposta(@Param('id') propostaId: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🗑️ Removendo proposta: ${propostaId}`);

      await this.propostasService.removerProposta(propostaId);

      return {
        success: true,
        message: 'Proposta removida com sucesso'
      };

    } catch (error) {
      console.error('❌ Erro ao remover proposta:', error);

      throw new HttpException(
        {
          success: false,
          message: 'Erro ao remover proposta',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
