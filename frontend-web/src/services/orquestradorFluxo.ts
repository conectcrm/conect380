/**
 * Orquestrador do Fluxo Completo
 * Integra todos os módulos: Email → Portal → Contratos → Faturamento
 */

import { emailService } from '../services/emailService';
import { portalClienteService } from '../services/portalClienteService';
import { faturamentoService, FormaPagamento } from '../services/faturamentoService';

interface FluxoCompleto {
  propostaId: string;
  etapas: {
    envioEmail: { status: 'pendente' | 'concluido' | 'erro'; timestamp?: Date; erro?: string };
    portalAceite: { status: 'pendente' | 'visualizado' | 'aceito' | 'rejeitado'; timestamp?: Date };
    geracaoContrato: {
      status: 'pendente' | 'gerado' | 'enviado' | 'assinado';
      contratoId?: string;
      timestamp?: Date;
    };
    faturamento: {
      status: 'pendente' | 'configurado' | 'ativo';
      planoId?: string;
      timestamp?: Date;
    };
  };
  statusGeral: 'iniciado' | 'em_andamento' | 'concluido' | 'erro';
  logs: Array<{
    timestamp: Date;
    etapa: string;
    acao: string;
    resultado: 'sucesso' | 'erro';
    detalhes?: string;
  }>;
}

class OrquestradorFluxo {
  /**
   * Inicia o fluxo completo a partir de uma proposta
   */
  async iniciarFluxoCompleto(
    propostaId: string,
    configuracao: {
      enviarEmail: boolean;
      aguardarAceite: boolean;
      gerarContrato: boolean;
      configurarFaturamento: boolean;
      configFaturamento?: {
        tipoPagamento: 'vista' | 'parcelado' | 'recorrente';
        numeroParcelas?: number;
        diaVencimento?: number;
      };
    },
  ): Promise<FluxoCompleto> {
    const fluxo: FluxoCompleto = {
      propostaId,
      etapas: {
        envioEmail: { status: 'pendente' },
        portalAceite: { status: 'pendente' },
        geracaoContrato: { status: 'pendente' },
        faturamento: { status: 'pendente' },
      },
      statusGeral: 'iniciado',
      logs: [],
    };

    try {
      this.adicionarLog(fluxo, 'inicio', 'Fluxo iniciado', 'sucesso');

      // Etapa 1: Envio por Email
      if (configuracao.enviarEmail) {
        await this.executarEnvioEmail(fluxo);
      }

      // Etapa 2: Aguardar aceite (se configurado)
      if (configuracao.aguardarAceite) {
        await this.configurarAcompanhamentoAceite(fluxo);
      } else {
        // Se não aguardar aceite, simula aprovação automática
        await this.simularAceiteAutomatico(fluxo);
      }

      // Etapa 3: Geração de contrato (se aprovado)
      if (configuracao.gerarContrato && fluxo.etapas.portalAceite.status === 'aceito') {
        await this.executarGeracaoContrato(fluxo);
      }

      // Etapa 4: Configurar faturamento (se contrato assinado)
      if (
        configuracao.configurarFaturamento &&
        fluxo.etapas.geracaoContrato.status === 'assinado' &&
        configuracao.configFaturamento
      ) {
        await this.executarConfiguracaoFaturamento(fluxo, configuracao.configFaturamento);
      }

      fluxo.statusGeral = 'concluido';
      this.adicionarLog(fluxo, 'conclusao', 'Fluxo concluído com sucesso', 'sucesso');

      return fluxo;
    } catch (error) {
      fluxo.statusGeral = 'erro';
      this.adicionarLog(fluxo, 'erro', `Erro no fluxo: ${error}`, 'erro');
      throw error;
    }
  }

  /**
   * Executa etapa de envio por email
   */
  private async executarEnvioEmail(fluxo: FluxoCompleto): Promise<void> {
    try {
      this.adicionarLog(fluxo, 'email', 'Iniciando envio por email', 'sucesso');

      // Gerar token público para a proposta
      const token = await portalClienteService.gerarTokenPublico(fluxo.propostaId);

      // Enviar email simples
      await emailService.enviarEmail({
        para: ['cliente@exemplo.com'],
        assunto: 'Nova Proposta Comercial',
        corpo: `Olá!\n\nVocê tem uma nova proposta aguardando aprovação. Acesse: ${portalClienteService.gerarURLPublica(token)}\n\nEquipe ConectCRM.`,
      });

      fluxo.etapas.envioEmail = {
        status: 'concluido',
        timestamp: new Date(),
      };

      this.adicionarLog(fluxo, 'email', 'Email enviado com sucesso', 'sucesso');
    } catch (error) {
      fluxo.etapas.envioEmail = {
        status: 'erro',
        timestamp: new Date(),
        erro: String(error),
      };

      this.adicionarLog(fluxo, 'email', `Erro ao enviar email: ${error}`, 'erro');
      throw error;
    }
  }

  /**
   * Configura acompanhamento do aceite no portal
   */
  private async configurarAcompanhamentoAceite(fluxo: FluxoCompleto): Promise<void> {
    try {
      this.adicionarLog(fluxo, 'portal', 'Configurando acompanhamento de aceite', 'sucesso');

      // Configurar webhook ou polling para verificar status
      // Por enquanto, simula que está aguardando
      fluxo.etapas.portalAceite = {
        status: 'visualizado',
        timestamp: new Date(),
      };

      this.adicionarLog(fluxo, 'portal', 'Aguardando aceite do cliente', 'sucesso');
    } catch (error) {
      this.adicionarLog(fluxo, 'portal', `Erro ao configurar aceite: ${error}`, 'erro');
      throw error;
    }
  }

  /**
   * Simula aceite automático (para testes)
   */
  private async simularAceiteAutomatico(fluxo: FluxoCompleto): Promise<void> {
    console.log('Simulando aceite automático para teste...');

    fluxo.etapas.portalAceite = {
      status: 'aceito',
      timestamp: new Date(),
    };

    this.adicionarLog(fluxo, 'portal', 'Aceite automático simulado', 'sucesso');
  }

  /**
   * Executa geração de contrato
   */
  private async executarGeracaoContrato(fluxo: FluxoCompleto): Promise<void> {
    try {
      this.adicionarLog(fluxo, 'contrato', 'Iniciando geração de contrato', 'sucesso');

      fluxo.etapas.geracaoContrato = {
        status: 'enviado',
        contratoId: `CONTR-${Date.now()}`,
        timestamp: new Date(),
      };

      this.adicionarLog(fluxo, 'contrato', 'Contrato gerado e enviado', 'sucesso');

      // Para fins de demonstração, simula assinatura
      await this.simularAssinaturaContrato(fluxo, fluxo.etapas.geracaoContrato.contratoId!);
    } catch (error) {
      this.adicionarLog(fluxo, 'contrato', `Erro ao gerar contrato: ${error}`, 'erro');
      throw error;
    }
  }

  /**
   * Simula assinatura do contrato (para demonstração)
   */
  private async simularAssinaturaContrato(fluxo: FluxoCompleto, contratoId: string): Promise<void> {
    try {
      // Simular assinatura do contratante
      fluxo.etapas.geracaoContrato.status = 'assinado';
      this.adicionarLog(fluxo, 'contrato', 'Contrato assinado pelas partes', 'sucesso');
    } catch (error) {
      this.adicionarLog(fluxo, 'contrato', `Erro na assinatura: ${error}`, 'erro');
      throw error;
    }
  }

  /**
   * Executa configuração do faturamento
   */
  private async executarConfiguracaoFaturamento(
    fluxo: FluxoCompleto,
    config: {
      tipoPagamento: 'vista' | 'parcelado' | 'recorrente';
      numeroParcelas?: number;
      diaVencimento?: number;
    },
  ): Promise<void> {
    try {
      this.adicionarLog(fluxo, 'faturamento', 'Configurando plano de faturamento', 'sucesso');

      if (!fluxo.etapas.geracaoContrato.contratoId) {
        throw new Error('ID do contrato não encontrado');
      }

      // Criar plano de cobrança
      const tipoPlano =
        config.tipoPagamento === 'recorrente'
          ? 'mensal'
          : config.tipoPagamento === 'parcelado'
            ? 'personalizado'
            : 'unico';

      const plano = await faturamentoService.criarPlanoCobranca({
        nome: `Plano contrato ${fluxo.etapas.geracaoContrato.contratoId}`,
        descricao: 'Plano gerado automaticamente pelo orquestrador',
        valor: 0,
        tipo: tipoPlano,
        diasVencimento: config.diaVencimento || 10,
        formaPagamento: FormaPagamento.BOLETO,
        dataInicio: new Date().toISOString(),
        observacoes: 'Plano configurado automaticamente',
      });

      fluxo.etapas.faturamento = {
        status: 'configurado',
        planoId: String(plano.id),
        timestamp: new Date(),
      };

      this.adicionarLog(fluxo, 'faturamento', 'Plano de faturamento criado', 'sucesso');

      // Ativar cobrança
      await this.ativarCobranca(fluxo, String(plano.id));
    } catch (error) {
      this.adicionarLog(fluxo, 'faturamento', `Erro no faturamento: ${error}`, 'erro');
      throw error;
    }
  }

  /**
   * Ativa a cobrança automática
   */
  private async ativarCobranca(fluxo: FluxoCompleto, planoId: string): Promise<void> {
    try {
      // Simular ativação de cobrança
      console.log('Ativando cobrança automática para plano:', planoId);

      fluxo.etapas.faturamento.status = 'ativo';
      this.adicionarLog(fluxo, 'faturamento', 'Cobrança automática ativada', 'sucesso');
    } catch (error) {
      this.adicionarLog(fluxo, 'faturamento', `Erro ao ativar cobrança: ${error}`, 'erro');
      throw error;
    }
  }

  /**
   * Monitora o status do fluxo
   */
  async monitorarFluxo(propostaId: string): Promise<FluxoCompleto | null> {
    try {
      // Implementar busca do fluxo no banco de dados
      console.log('Monitorando fluxo para proposta:', propostaId);
      return null; // Retornar fluxo real
    } catch (error) {
      console.error('Erro ao monitorar fluxo:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas dos fluxos
   */
  async obterEstatisticas(): Promise<{
    totalFluxos: number;
    fluxosConcluidos: number;
    fluxosEmAndamento: number;
    fluxosComErro: number;
    tempoMedioFluxo: number; // em horas
    taxaConversao: number; // percentual
  }> {
    try {
      // Mock de estatísticas
      return {
        totalFluxos: 150,
        fluxosConcluidos: 120,
        fluxosEmAndamento: 25,
        fluxosComErro: 5,
        tempoMedioFluxo: 48, // 48 horas
        taxaConversao: 80, // 80%
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw error;
    }
  }

  // Métodos auxiliares

  private adicionarLog(
    fluxo: FluxoCompleto,
    etapa: string,
    acao: string,
    resultado: 'sucesso' | 'erro',
    detalhes?: string,
  ): void {
    fluxo.logs.push({
      timestamp: new Date(),
      etapa,
      acao,
      resultado,
      detalhes,
    });
  }

  /**
   * Método público para testar o fluxo completo
   */
  async testarFluxoCompleto(): Promise<FluxoCompleto> {
    console.log('🚀 Iniciando teste do fluxo completo...');

    const resultado = await this.iniciarFluxoCompleto('PROP-123', {
      enviarEmail: true,
      aguardarAceite: false, // Aceite automático para teste
      gerarContrato: true,
      configurarFaturamento: true,
      configFaturamento: {
        tipoPagamento: 'parcelado',
        numeroParcelas: 3,
        diaVencimento: 10,
      },
    });

    console.log('✅ Fluxo completo testado com sucesso!');
    console.log('📊 Resumo do fluxo:', {
      propostaId: resultado.propostaId,
      statusGeral: resultado.statusGeral,
      etapas: Object.keys(resultado.etapas).map((key) => ({
        etapa: key,
        status: resultado.etapas[key as keyof typeof resultado.etapas].status,
      })),
    });

    return resultado;
  }
}

export const orquestradorFluxo = new OrquestradorFluxo();
