/**
 * Serviço de Faturamento e Cobrança
 * Integra com contratos assinados para gerar faturas e controlar pagamentos
 */

export interface Fatura {
  id: string;
  numero: string;
  contratoId: string;
  tipo: 'entrada' | 'parcela' | 'recorrente' | 'avulsa';
  status: 'pendente' | 'enviada' | 'paga' | 'vencida' | 'cancelada';
  valorOriginal: number;
  valorComJuros: number;
  dataVencimento: Date;
  dataPagamento?: Date;
  dataEmissao: Date;

  cliente: {
    nome: string;
    documento: string;
    email: string;
    endereco: string;
  };

  empresa: {
    nome: string;
    documento: string;
    email: string;
  };

  itens: Array<{
    descricao: string;
    quantidade: number;
    valorUnitario: number;
    valorTotal: number;
  }>;

  cobranca: {
    metodo: 'boleto' | 'cartao' | 'pix' | 'transferencia';
    dadosCobranca?: any;
    tentativasEnvio: number;
    proximaCobranca?: Date;
  };

  pagamento?: {
    dataPagamento: Date;
    valorPago: number;
    metodo: string;
    comprovante?: string;
    referencia?: string;
  };
}

interface PlanoCobranca {
  id: string;
  contratoId: string;
  tipo: 'parcelado' | 'recorrente';
  parcelas: Array<{
    numero: number;
    valor: number;
    vencimento: Date;
    faturaId?: string;
    status: 'pendente' | 'gerada' | 'paga';
  }>;
  configuracao: {
    frequencia?: 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual';
    diaVencimento: number;
    jurosAtraso: number;
    multaAtraso: number;
    enviarLembrete: boolean;
    diasLembrete: number[];
  };
}

class FaturamentoService {

  /**
   * Cria plano de cobrança a partir de um contrato assinado
   */
  async criarPlanoCobranca(contratoId: string, configuracao: {
    tipoPagamento: 'vista' | 'parcelado' | 'recorrente';
    numeroParcelas?: number;
    diaVencimento?: number;
    frequencia?: PlanoCobranca['configuracao']['frequencia'];
    valorEntrada?: number;
  }): Promise<PlanoCobranca> {

    try {
      console.log('Criando plano de cobrança para contrato:', contratoId);

      // Mock do contrato
      const contrato = {
        id: contratoId,
        valorTotal: 15000,
        dataAssinatura: new Date(),
        condicoes: {
          formaPagamento: 'Parcelado em 3x sem juros',
        }
      };

      const plano: PlanoCobranca = {
        id: this.gerarIdPlano(),
        contratoId,
        tipo: configuracao.tipoPagamento === 'vista' ? 'parcelado' : configuracao.tipoPagamento as any,
        parcelas: [],
        configuracao: {
          frequencia: configuracao.frequencia || 'mensal',
          diaVencimento: configuracao.diaVencimento || 10,
          jurosAtraso: 1, // 1% ao mês
          multaAtraso: 2, // 2%
          enviarLembrete: true,
          diasLembrete: [7, 3, 1], // 7, 3 e 1 dia antes do vencimento
        }
      };

      // Gerar parcelas
      if (configuracao.tipoPagamento === 'vista') {
        plano.parcelas = [{
          numero: 1,
          valor: contrato.valorTotal,
          vencimento: this.calcularProximoVencimento(new Date(), plano.configuracao.diaVencimento),
          status: 'pendente'
        }];
      } else if (configuracao.tipoPagamento === 'parcelado') {
        const numeroParcelas = configuracao.numeroParcelas || 1;
        const valorParcela = contrato.valorTotal / numeroParcelas;

        for (let i = 1; i <= numeroParcelas; i++) {
          const dataVencimento = this.calcularVencimentoParcela(
            new Date(),
            i,
            plano.configuracao.diaVencimento
          );

          plano.parcelas.push({
            numero: i,
            valor: valorParcela,
            vencimento: dataVencimento,
            status: 'pendente'
          });
        }
      }

      // Salvar plano
      await this.salvarPlanoCobranca(plano);

      // Gerar primeira fatura
      if (plano.parcelas.length > 0) {
        await this.gerarFaturaParaParcela(plano, plano.parcelas[0]);
      }

      return plano;

    } catch (error) {
      console.error('Erro ao criar plano de cobrança:', error);
      throw error;
    }
  }

  /**
   * Gera fatura para uma parcela específica
   */
  async gerarFaturaParaParcela(plano: PlanoCobranca, parcela: PlanoCobranca['parcelas'][0]): Promise<Fatura> {
    try {
      console.log('Gerando fatura para parcela:', parcela.numero);

      // Mock dos dados do contrato
      const dadosContrato = {
        cliente: {
          nome: 'João Silva',
          documento: '123.456.789-00',
          email: 'joao@email.com',
          endereco: 'Rua das Flores, 123'
        },
        empresa: {
          nome: 'ConectCRM Soluções',
          documento: '12.345.678/0001-90',
          email: 'financeiro@conectcrm.com.br'
        },
        objeto: {
          descricao: 'Sistema CRM Premium',
          produtos: [{
            nome: 'Sistema CRM Premium',
            descricao: 'Sistema completo de gestão',
            quantidade: 1,
            valorUnitario: parcela.valor,
            valorTotal: parcela.valor
          }]
        }
      };

      const fatura: Fatura = {
        id: this.gerarIdFatura(),
        numero: await this.gerarNumeroFatura(),
        contratoId: plano.contratoId,
        tipo: plano.parcelas.length === 1 ? 'entrada' : 'parcela',
        status: 'pendente',
        valorOriginal: parcela.valor,
        valorComJuros: parcela.valor,
        dataVencimento: parcela.vencimento,
        dataEmissao: new Date(),

        cliente: dadosContrato.cliente,
        empresa: dadosContrato.empresa,

        itens: dadosContrato.objeto.produtos.map(produto => ({
          descricao: `${produto.nome} - Parcela ${parcela.numero}/${plano.parcelas.length}`,
          quantidade: produto.quantidade,
          valorUnitario: produto.valorUnitario,
          valorTotal: produto.valorTotal
        })),

        cobranca: {
          metodo: 'boleto', // Padrão
          tentativasEnvio: 0,
          proximaCobranca: parcela.vencimento
        }
      };

      // Salvar fatura
      await this.salvarFatura(fatura);

      // Atualizar parcela com ID da fatura
      parcela.faturaId = fatura.id;
      parcela.status = 'gerada';
      await this.salvarPlanoCobranca(plano);

      // Gerar documento de cobrança
      await this.gerarDocumentoCobranca(fatura);

      return fatura;

    } catch (error) {
      console.error('Erro ao gerar fatura:', error);
      throw error;
    }
  }

  /**
   * Envia fatura por email para o cliente
   */
  async enviarFaturaPorEmail(faturaId: string): Promise<void> {
    try {
      const fatura = await this.obterFatura(faturaId);
      if (!fatura) {
        throw new Error('Fatura não encontrada');
      }

      console.log('Enviando fatura por email para:', fatura.cliente.email);

      // Dados para o template de email
      const dadosEmail = {
        nomeCliente: fatura.cliente.nome,
        numeroFatura: fatura.numero,
        valorFatura: new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(fatura.valorOriginal),
        dataVencimento: fatura.dataVencimento.toLocaleDateString('pt-BR'),
        linkPagamento: await this.gerarLinkPagamento(faturaId),
      };

      // Simular envio de email
      console.log('Dados do email:', dadosEmail);

      // Atualizar status e tentativas
      fatura.status = 'enviada';
      fatura.cobranca.tentativasEnvio++;
      await this.salvarFatura(fatura);

    } catch (error) {
      console.error('Erro ao enviar fatura:', error);
      throw error;
    }
  }

  /**
   * Processa pagamento de uma fatura
   */
  async processarPagamento(faturaId: string, dadosPagamento: {
    valor: number;
    metodo: string;
    comprovante?: string;
    referencia?: string;
  }): Promise<void> {
    try {
      const fatura = await this.obterFatura(faturaId);
      if (!fatura) {
        throw new Error('Fatura não encontrada');
      }

      console.log('Processando pagamento para fatura:', fatura.numero);

      // Registrar pagamento
      fatura.pagamento = {
        dataPagamento: new Date(),
        valorPago: dadosPagamento.valor,
        metodo: dadosPagamento.metodo,
        comprovante: dadosPagamento.comprovante,
        referencia: dadosPagamento.referencia,
      };

      fatura.status = 'paga';
      fatura.dataPagamento = new Date();

      await this.salvarFatura(fatura);

      // Notificar pagamento
      await this.notificarPagamento(fatura);

      // Verificar se pode gerar próxima fatura
      await this.verificarProximaFatura(fatura.contratoId);

    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      throw error;
    }
  }

  /**
   * Verifica faturas vencidas e aplica juros/multa
   */
  async processarFaturasVencidas(): Promise<void> {
    try {
      console.log('Processando faturas vencidas...');

      const hoje = new Date();
      const faturasPendentes = await this.obterFaturasPendentes();

      for (const fatura of faturasPendentes) {
        const diasAtraso = Math.floor((hoje.getTime() - fatura.dataVencimento.getTime()) / (1000 * 60 * 60 * 24));

        if (diasAtraso > 0) {
          // Aplicar juros e multa
          const plano = await this.obterPlanoCobranca(fatura.contratoId);
          if (plano) {
            const multa = fatura.valorOriginal * (plano.configuracao.multaAtraso / 100);
            const juros = fatura.valorOriginal * (plano.configuracao.jurosAtraso / 100) * diasAtraso;

            fatura.valorComJuros = fatura.valorOriginal + multa + juros;
            fatura.status = 'vencida';

            await this.salvarFatura(fatura);

            // Enviar notificação de vencimento
            await this.notificarVencimento(fatura);
          }
        }
      }

    } catch (error) {
      console.error('Erro ao processar faturas vencidas:', error);
      throw error;
    }
  }

  /**
   * Agenda lembretes de vencimento
   */
  async agendarLembretes(): Promise<void> {
    try {
      console.log('Agendando lembretes de vencimento...');

      const hoje = new Date();
      const faturasPendentes = await this.obterFaturasPendentes();

      for (const fatura of faturasPendentes) {
        const plano = await this.obterPlanoCobranca(fatura.contratoId);
        if (!plano?.configuracao.enviarLembrete) continue;

        const diasParaVencimento = Math.floor((fatura.dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

        if (plano.configuracao.diasLembrete.includes(diasParaVencimento)) {
          await this.enviarLembreteVencimento(fatura);
        }
      }

    } catch (error) {
      console.error('Erro ao agendar lembretes:', error);
      throw error;
    }
  }

  /**
   * Gera relatório financeiro
   */
  async gerarRelatorioFinanceiro(periodo: {
    dataInicio: Date;
    dataFim: Date;
  }): Promise<{
    totalFaturado: number;
    totalRecebido: number;
    totalPendente: number;
    totalVencido: number;
    faturasPorStatus: Record<string, number>;
    recebimentosPorMes: Array<{ mes: string; valor: number }>;
  }> {
    try {
      console.log('Gerando relatório financeiro...');

      // Mock de dados para exemplo
      return {
        totalFaturado: 45000,
        totalRecebido: 30000,
        totalPendente: 12000,
        totalVencido: 3000,
        faturasPorStatus: {
          'pendente': 8,
          'enviada': 5,
          'paga': 15,
          'vencida': 2,
          'cancelada': 1
        },
        recebimentosPorMes: [
          { mes: 'Janeiro', valor: 15000 },
          { mes: 'Fevereiro', valor: 18000 },
          { mes: 'Março', valor: 12000 }
        ]
      };

    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      throw error;
    }
  }

  // Métodos auxiliares privados

  private gerarIdPlano(): string {
    return `PLANO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private gerarIdFatura(): string {
    return `FAT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async gerarNumeroFatura(): Promise<string> {
    const ano = new Date().getFullYear();
    const mes = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const proximoNumero = 1; // Implementar busca do último número
    return `${ano}${mes}${proximoNumero.toString().padStart(6, '0')}`;
  }

  private calcularProximoVencimento(dataBase: Date, diaVencimento: number): Date {
    const proximoMes = new Date(dataBase);
    proximoMes.setMonth(proximoMes.getMonth() + 1);
    proximoMes.setDate(diaVencimento);
    return proximoMes;
  }

  private calcularVencimentoParcela(dataBase: Date, numeroParcela: number, diaVencimento: number): Date {
    const vencimento = new Date(dataBase);
    vencimento.setMonth(vencimento.getMonth() + numeroParcela);
    vencimento.setDate(diaVencimento);
    return vencimento;
  }

  private async salvarPlanoCobranca(plano: PlanoCobranca): Promise<void> {
    console.log('Salvando plano de cobrança:', plano.id);
  }

  private async salvarFatura(fatura: Fatura): Promise<void> {
    console.log('Salvando fatura:', fatura.id);
  }

  private async obterFatura(faturaId: string): Promise<Fatura | null> {
    console.log('Obtendo fatura:', faturaId);
    return null; // Implementar busca real
  }

  private async obterPlanoCobranca(contratoId: string): Promise<PlanoCobranca | null> {
    console.log('Obtendo plano de cobrança para contrato:', contratoId);
    return null; // Implementar busca real
  }

  private async obterFaturasPendentes(): Promise<Fatura[]> {
    console.log('Obtendo faturas pendentes...');
    return []; // Implementar busca real
  }

  private async gerarDocumentoCobranca(fatura: Fatura): Promise<void> {
    console.log('Gerando documento de cobrança para fatura:', fatura.numero);
  }

  private async gerarLinkPagamento(faturaId: string): Promise<string> {
    return `${window.location.origin}/pagamento/fatura/${faturaId}`;
  }

  private async notificarPagamento(fatura: Fatura): Promise<void> {
    console.log('Notificando pagamento da fatura:', fatura.numero);
  }

  private async verificarProximaFatura(contratoId: string): Promise<void> {
    console.log('Verificando próxima fatura para contrato:', contratoId);
  }

  private async notificarVencimento(fatura: Fatura): Promise<void> {
    console.log('Notificando vencimento da fatura:', fatura.numero);
  }

  private async enviarLembreteVencimento(fatura: Fatura): Promise<void> {
    console.log('Enviando lembrete de vencimento para fatura:', fatura.numero);
  }
}

export const faturamentoService = new FaturamentoService();
