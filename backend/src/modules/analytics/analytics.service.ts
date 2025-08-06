import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import * as ExcelJS from 'exceljs';

interface AnalyticsQueryParams {
  periodo?: '7d' | '30d' | '90d' | '1y';
  vendedor?: string;
  status?: string[];
  categoria?: string;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    // Injete aqui os repositórios necessários quando tiver as entidades criadas
    // @InjectRepository(Proposta) private propostaRepo: Repository<Proposta>,
    // @InjectRepository(Contrato) private contratoRepo: Repository<Contrato>,
    // @InjectRepository(Fatura) private faturaRepo: Repository<Fatura>,
  ) { }

  async getDashboardData(params: AnalyticsQueryParams) {
    try {
      this.logger.log('Gerando dados do dashboard analytics');

      const { startDate, endDate } = this.getDateRange(params.periodo || '30d');

      // Por enquanto, retornando dados mockados
      // Substituir por consultas reais ao banco quando as entidades estiverem prontas

      const data = {
        vendas: {
          total_periodo: 450000,
          meta_periodo: 500000,
          crescimento_percentual: 15.3,
          ticket_medio: 25000,
          conversao_geral: 23.5
        },
        funil: {
          propostas_criadas: 120,
          propostas_enviadas: 95,
          propostas_aprovadas: 45,
          contratos_assinados: 38,
          faturas_pagas: 32,
          conversao_por_etapa: {
            criada_para_enviada: 79.2,
            enviada_para_aprovada: 47.4,
            aprovada_para_assinada: 84.4,
            assinada_para_paga: 84.2
          }
        },
        tempo_medio: {
          proposta_para_envio: 0.5,
          envio_para_aprovacao: 3.2,
          aprovacao_para_assinatura: 1.8,
          assinatura_para_pagamento: 2.1,
          ciclo_completo: 7.6
        },
        vendedores: [
          {
            id: '1',
            nome: 'Ana Silva',
            propostas_criadas: 45,
            propostas_fechadas: 12,
            valor_vendido: 180000,
            ticket_medio: 15000,
            tempo_medio_fechamento: 6.5,
            conversao: 26.7
          },
          {
            id: '2',
            nome: 'Carlos Santos',
            propostas_criadas: 38,
            propostas_fechadas: 9,
            valor_vendido: 135000,
            ticket_medio: 15000,
            tempo_medio_fechamento: 8.2,
            conversao: 23.7
          },
          {
            id: '3',
            nome: 'Mariana Costa',
            propostas_criadas: 37,
            propostas_fechadas: 11,
            valor_vendido: 165000,
            ticket_medio: 15000,
            tempo_medio_fechamento: 7.1,
            conversao: 29.7
          }
        ],
        evolucao_temporal: [
          { periodo: 'Sem 1', propostas: 28, vendas: 6, valor: 90000, conversao: 21.4 },
          { periodo: 'Sem 2', propostas: 32, vendas: 8, valor: 120000, conversao: 25.0 },
          { periodo: 'Sem 3', propostas: 25, vendas: 7, valor: 105000, conversao: 28.0 },
          { periodo: 'Sem 4', propostas: 35, vendas: 11, valor: 165000, conversao: 31.4 }
        ],
        distribuicao_valores: [
          { faixa: 'Até R$ 10k', quantidade: 45, valor_total: 285000, percentual: 37.5 },
          { faixa: 'R$ 10k - 25k', quantidade: 35, valor_total: 525000, percentual: 29.2 },
          { faixa: 'R$ 25k - 50k', quantidade: 25, valor_total: 875000, percentual: 20.8 },
          { faixa: 'Acima R$ 50k', quantidade: 15, valor_total: 1200000, percentual: 12.5 }
        ],
        status_atual: [
          { status: 'Rascunho', quantidade: 15, valor_total: 225000, tempo_medio_status: 0.8 },
          { status: 'Enviada', quantidade: 28, valor_total: 420000, tempo_medio_status: 2.1 },
          { status: 'Em Análise', quantidade: 18, valor_total: 315000, tempo_medio_status: 1.5 },
          { status: 'Aprovada', quantidade: 12, valor_total: 240000, tempo_medio_status: 0.9 },
          { status: 'Contrato', quantidade: 8, valor_total: 160000, tempo_medio_status: 1.2 },
          { status: 'Paga', quantidade: 32, valor_total: 640000, tempo_medio_status: 0.0 }
        ]
      };

      // Filtrar por vendedor se especificado
      if (params.vendedor && params.vendedor !== 'todos') {
        const vendedorSelecionado = data.vendedores.find(v => v.id === params.vendedor);
        if (vendedorSelecionado) {
          // Ajustar dados baseado no vendedor selecionado
          data.vendedores = [vendedorSelecionado];
          // Recalcular métricas baseadas no vendedor específico
        }
      }

      return data;
    } catch (error) {
      this.logger.error('Erro ao gerar dados do dashboard:', error);
      throw error;
    }
  }

  async getFunilConversao(params: AnalyticsQueryParams) {
    try {
      // Implementar consulta específica do funil
      return {
        etapas: [
          { nome: 'Propostas Criadas', quantidade: 120, percentual: 100 },
          { nome: 'Propostas Enviadas', quantidade: 95, percentual: 79.2 },
          { nome: 'Propostas Aprovadas', quantidade: 45, percentual: 47.4 },
          { nome: 'Contratos Assinados', quantidade: 38, percentual: 84.4 },
          { nome: 'Faturas Pagas', quantidade: 32, percentual: 84.2 }
        ],
        gargalos: [
          { etapa: 'Envio → Aprovação', taxa_conversao: 47.4, melhoria_sugerida: 'Melhorar qualificação inicial' },
          { etapa: 'Aprovação → Assinatura', taxa_conversao: 84.4, melhoria_sugerida: 'Agilizar processo de contrato' }
        ]
      };
    } catch (error) {
      this.logger.error('Erro ao buscar funil de conversão:', error);
      throw error;
    }
  }

  async getPerformanceVendedores(params: AnalyticsQueryParams) {
    try {
      // Implementar consulta de performance detalhada
      return {
        vendedores: [
          {
            id: '1',
            nome: 'Ana Silva',
            metricas: {
              propostas_criadas: 45,
              propostas_fechadas: 12,
              valor_vendido: 180000,
              ticket_medio: 15000,
              tempo_medio_fechamento: 6.5,
              conversao: 26.7
            },
            evolucao_mensal: [
              { mes: 'Jan', vendas: 2, valor: 30000 },
              { mes: 'Fev', vendas: 3, valor: 45000 },
              { mes: 'Mar', vendas: 4, valor: 60000 },
              { mes: 'Abr', vendas: 3, valor: 45000 }
            ],
            ranking: 1
          }
          // Adicionar outros vendedores
        ]
      };
    } catch (error) {
      this.logger.error('Erro ao buscar performance de vendedores:', error);
      throw error;
    }
  }

  async getEvolucaoTemporal(params: AnalyticsQueryParams) {
    try {
      const { startDate, endDate } = this.getDateRange(params.periodo || '30d');

      // Implementar consulta temporal baseada no período
      return {
        dados: [
          { data: '2024-01-01', propostas: 8, vendas: 2, valor: 30000 },
          { data: '2024-01-08', propostas: 12, vendas: 3, valor: 45000 },
          { data: '2024-01-15', propostas: 10, vendas: 4, valor: 60000 },
          { data: '2024-01-22', propostas: 15, vendas: 3, valor: 45000 }
        ],
        tendencias: {
          propostas: 'crescendo',
          vendas: 'estavel',
          ticket_medio: 'crescendo'
        }
      };
    } catch (error) {
      this.logger.error('Erro ao buscar evolução temporal:', error);
      throw error;
    }
  }

  async getTempoMedioEtapas(params: AnalyticsQueryParams) {
    try {
      return {
        etapas: [
          { nome: 'Proposta → Envio', tempo_medio: 0.5, benchmark: 0.3, status: 'atencao' },
          { nome: 'Envio → Aprovação', tempo_medio: 3.2, benchmark: 2.5, status: 'critico' },
          { nome: 'Aprovação → Assinatura', tempo_medio: 1.8, benchmark: 1.5, status: 'atencao' },
          { nome: 'Assinatura → Pagamento', tempo_medio: 2.1, benchmark: 2.0, status: 'bom' }
        ],
        sugestoes: [
          'Automatizar envio de propostas para reduzir tempo inicial',
          'Implementar follow-up automático após 24h sem resposta',
          'Agilizar processo de geração de contratos'
        ]
      };
    } catch (error) {
      this.logger.error('Erro ao buscar tempo médio das etapas:', error);
      throw error;
    }
  }

  async getDistribuicaoValores(params: AnalyticsQueryParams) {
    try {
      return {
        faixas: [
          { faixa: 'Até R$ 5k', quantidade: 25, valor_total: 87500, percentual: 20.8 },
          { faixa: 'R$ 5k - 15k', quantidade: 35, valor_total: 350000, percentual: 29.2 },
          { faixa: 'R$ 15k - 30k', quantidade: 28, valor_total: 630000, percentual: 23.3 },
          { faixa: 'R$ 30k - 50k', quantidade: 20, valor_total: 800000, percentual: 16.7 },
          { faixa: 'Acima R$ 50k', quantidade: 12, valor_total: 900000, percentual: 10.0 }
        ],
        insights: [
          'Foco em propostas de R$ 5k-15k gera maior volume',
          'Propostas acima de R$ 50k têm maior taxa de conversão',
          'Ticket médio cresceu 12% no período'
        ]
      };
    } catch (error) {
      this.logger.error('Erro ao buscar distribuição de valores:', error);
      throw error;
    }
  }

  async getPrevisaoFechamento(params: AnalyticsQueryParams) {
    try {
      return {
        previsao_mensal: {
          valor_previsto: 520000,
          confianca: 85,
          base_calculo: 'histórico + pipeline atual'
        },
        propostas_quentes: [
          {
            id: '1',
            cliente: 'Empresa ABC',
            valor: 45000,
            probabilidade: 85,
            dias_para_fechar: 3,
            vendedor: 'Ana Silva'
          },
          {
            id: '2',
            cliente: 'Startup XYZ',
            valor: 25000,
            probabilidade: 70,
            dias_para_fechar: 7,
            vendedor: 'Carlos Santos'
          }
        ],
        alertas: [
          'Proposta Empresa ABC precisa de follow-up urgente',
          '3 propostas vencendo nos próximos 5 dias'
        ]
      };
    } catch (error) {
      this.logger.error('Erro ao buscar previsão de fechamento:', error);
      throw error;
    }
  }

  async getAlertasGestao(params: AnalyticsQueryParams) {
    try {
      return {
        alertas_criticos: [
          {
            tipo: 'prazo_vencido',
            quantidade: 5,
            descricao: 'Propostas com prazo vencido precisam de ação',
            acao_sugerida: 'Reenviar ou renegociar prazos'
          },
          {
            tipo: 'baixa_conversao',
            quantidade: 2,
            descricao: 'Vendedores com conversão abaixo de 15%',
            acao_sugerida: 'Treinamento ou mentoria'
          }
        ],
        alertas_atencao: [
          {
            tipo: 'tempo_resposta',
            quantidade: 8,
            descricao: 'Propostas há mais de 3 dias sem resposta',
            acao_sugerida: 'Follow-up ativo'
          }
        ],
        oportunidades: [
          {
            tipo: 'upsell',
            quantidade: 12,
            descricao: 'Clientes elegíveis para upgrade',
            potencial_receita: 180000
          }
        ]
      };
    } catch (error) {
      this.logger.error('Erro ao buscar alertas de gestão:', error);
      throw error;
    }
  }

  async exportarRelatorio(params: AnalyticsQueryParams): Promise<Buffer> {
    try {
      this.logger.log('Gerando relatório Excel');

      const workbook = new ExcelJS.Workbook();
      const data = await this.getDashboardData(params);

      // Aba 1: Resumo Executivo
      const resumoSheet = workbook.addWorksheet('Resumo Executivo');
      resumoSheet.addRow(['RELATÓRIO DE VENDAS - RESUMO EXECUTIVO']);
      resumoSheet.addRow([]);
      resumoSheet.addRow(['Período:', params.periodo || '30d']);
      resumoSheet.addRow(['Vendedor:', params.vendedor || 'Todos']);
      resumoSheet.addRow(['Gerado em:', new Date().toLocaleString('pt-BR')]);
      resumoSheet.addRow([]);

      resumoSheet.addRow(['PRINCIPAIS MÉTRICAS']);
      resumoSheet.addRow(['Total de Vendas:', data.vendas.total_periodo]);
      resumoSheet.addRow(['Taxa de Conversão:', `${data.vendas.conversao_geral}%`]);
      resumoSheet.addRow(['Ticket Médio:', data.vendas.ticket_medio]);
      resumoSheet.addRow(['Ciclo Médio:', `${data.tempo_medio.ciclo_completo} dias`]);

      // Aba 2: Performance por Vendedor
      const vendedoresSheet = workbook.addWorksheet('Performance Vendedores');
      vendedoresSheet.addRow(['Nome', 'Propostas Criadas', 'Propostas Fechadas', 'Conversão (%)', 'Valor Vendido', 'Ticket Médio']);

      data.vendedores.forEach(vendedor => {
        vendedoresSheet.addRow([
          vendedor.nome,
          vendedor.propostas_criadas,
          vendedor.propostas_fechadas,
          vendedor.conversao,
          vendedor.valor_vendido,
          vendedor.ticket_medio
        ]);
      });

      // Aba 3: Funil de Vendas
      const funilSheet = workbook.addWorksheet('Funil de Vendas');
      funilSheet.addRow(['Etapa', 'Quantidade', 'Taxa de Conversão (%)']);
      funilSheet.addRow(['Propostas Criadas', data.funil.propostas_criadas, '100%']);
      funilSheet.addRow(['Propostas Enviadas', data.funil.propostas_enviadas, `${data.funil.conversao_por_etapa.criada_para_enviada}%`]);
      funilSheet.addRow(['Propostas Aprovadas', data.funil.propostas_aprovadas, `${data.funil.conversao_por_etapa.enviada_para_aprovada}%`]);
      funilSheet.addRow(['Contratos Assinados', data.funil.contratos_assinados, `${data.funil.conversao_por_etapa.aprovada_para_assinada}%`]);
      funilSheet.addRow(['Faturas Pagas', data.funil.faturas_pagas, `${data.funil.conversao_por_etapa.assinada_para_paga}%`]);

      // Formatação
      [resumoSheet, vendedoresSheet, funilSheet].forEach(sheet => {
        sheet.getRow(1).font = { bold: true, size: 14 };
        sheet.columns.forEach(column => {
          column.width = 20;
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    } catch (error) {
      this.logger.error('Erro ao gerar relatório Excel:', error);
      throw error;
    }
  }

  async getKpisTempoReal() {
    try {
      return {
        vendas_hoje: 15000,
        propostas_enviadas_hoje: 5,
        taxa_resposta_24h: 78.5,
        pipeline_valor: 850000,
        meta_mensal_progresso: 68.5,
        vendedores_ativos: 8,
        ultima_atualizacao: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Erro ao buscar KPIs em tempo real:', error);
      throw error;
    }
  }

  async getMetasProgresso(params: AnalyticsQueryParams) {
    try {
      return {
        metas: [
          {
            nome: 'Vendas Mensais',
            valor_atual: 450000,
            valor_meta: 500000,
            progresso: 90,
            status: 'no_prazo'
          },
          {
            nome: 'Conversão',
            valor_atual: 23.5,
            valor_meta: 25,
            progresso: 94,
            status: 'atencao'
          },
          {
            nome: 'Ticket Médio',
            valor_atual: 25000,
            valor_meta: 22000,
            progresso: 113.6,
            status: 'superado'
          }
        ],
        previsao_cumprimento: 85
      };
    } catch (error) {
      this.logger.error('Erro ao buscar progresso das metas:', error);
      throw error;
    }
  }

  private getDateRange(periodo: string) {
    const endDate = new Date();
    const startDate = new Date();

    switch (periodo) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    return { startDate, endDate };
  }
}
