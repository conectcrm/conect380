import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { Proposta } from '../propostas/proposta.entity';
import { Contrato, StatusContrato } from '../contratos/entities/contrato.entity';
import { Fatura, StatusFatura } from '../faturamento/entities/fatura.entity';
import { User, UserRole } from '../users/user.entity';
import { EstagioOportunidade, Oportunidade } from '../oportunidades/oportunidade.entity';
import { Lead, StatusLead } from '../leads/lead.entity';

type Periodo = '7d' | '30d' | '90d' | '1y';
type StatusProposta = 'rascunho' | 'enviada' | 'visualizada' | 'aprovada' | 'rejeitada' | 'expirada';

export interface AnalyticsQueryParams {
  empresaId: string;
  periodo?: Periodo;
  vendedor?: string;
  status?: string[];
  categoria?: string;
}

export interface DashboardData {
  vendas: {
    total_periodo: number;
    meta_periodo: number;
    crescimento_percentual: number;
    ticket_medio: number;
    conversao_geral: number;
  };
  funil: {
    propostas_criadas: number;
    propostas_enviadas: number;
    propostas_aprovadas: number;
    contratos_assinados: number;
    faturas_pagas: number;
    conversao_por_etapa: {
      criada_para_enviada: number;
      enviada_para_aprovada: number;
      aprovada_para_assinada: number;
      assinada_para_paga: number;
    };
  };
  tempo_medio: {
    proposta_para_envio: number;
    envio_para_aprovacao: number;
    aprovacao_para_assinatura: number;
    assinatura_para_pagamento: number;
    ciclo_completo: number;
  };
  vendedores: Array<{
    id: string;
    nome: string;
    propostas_criadas: number;
    propostas_fechadas: number;
    valor_vendido: number;
    ticket_medio: number;
    tempo_medio_fechamento: number;
    conversao: number;
  }>;
  evolucao_temporal: Array<{
    periodo: string;
    propostas: number;
    vendas: number;
    valor: number;
    conversao: number;
  }>;
  distribuicao_valores: Array<{
    faixa: string;
    quantidade: number;
    valor_total: number;
    percentual: number;
  }>;
  status_atual: Array<{
    status: string;
    quantidade: number;
    valor_total: number;
    tempo_medio_status: number;
  }>;
}

interface VendorAccumulator {
  id: string;
  nome: string;
  propostas: number;
  fechadas: number;
  valor: number;
  amostras: number[];
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(Proposta) private readonly propostaRepo: Repository<Proposta>,
    @InjectRepository(Contrato) private readonly contratoRepo: Repository<Contrato>,
    @InjectRepository(Fatura) private readonly faturaRepo: Repository<Fatura>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Oportunidade) private readonly oportunidadeRepo: Repository<Oportunidade>,
    @InjectRepository(Lead) private readonly leadRepo: Repository<Lead>,
  ) {}

  async getDashboardData(params: AnalyticsQueryParams): Promise<DashboardData> {
    try {
      if (!params.empresaId) throw new Error('empresaId obrigatorio');

      const periodo = params.periodo ?? '30d';
      const vendedorId = this.normalizeVendedor(params.vendedor);
      const { startDate, endDate } = this.getDateRange(periodo);
      const { startDate: prevStart, endDate: prevEnd } = this.getPreviousRange(startDate, endDate);

      const [propostas, propostasPrev, faturas, faturasPrev, contratos, vendedoresAtivos] = await Promise.all([
        this.queryPropostas(params.empresaId, startDate, endDate, vendedorId, params.status),
        this.queryPropostas(params.empresaId, prevStart, prevEnd, vendedorId, params.status),
        this.queryFaturasPagas(params.empresaId, startDate, endDate, vendedorId),
        this.queryFaturasPagas(params.empresaId, prevStart, prevEnd, vendedorId),
        this.queryContratosAssinados(params.empresaId, startDate, endDate, vendedorId),
        this.queryVendedoresAtivos(params.empresaId),
      ]);

      const propostasCriadas = propostas.length;
      const propostasEnviadas = propostas.filter((p) => p.status !== 'rascunho').length;
      const propostasAprovadas = propostas.filter((p) => p.status === 'aprovada').length;
      const contratosAssinados = contratos.length;
      const faturasPagas = faturas.length;

      const totalAtual = this.sum(faturas.map((f) => this.num(f.valorTotal)));
      const totalPrev = this.sum(faturasPrev.map((f) => this.num(f.valorTotal)));
      const crescimento = this.variation(totalAtual, totalPrev);

      const ticketFallback = this.avg(
        propostas
          .filter((p) => p.status === 'aprovada')
          .map((p) => this.num(p.total ?? p.valor ?? 0)),
      );
      const ticket = faturasPagas > 0 ? totalAtual / faturasPagas : ticketFallback;

      const propostaEnvio = this.avg(
        propostas
          .filter((p) => p.status !== 'rascunho')
          .map((p) => this.days(p.criadaEm, p.atualizadaEm)),
      );
      const envioAprovacao = this.avg(
        propostas
          .filter((p) => p.status === 'aprovada')
          .map((p) => this.days(p.criadaEm, p.atualizadaEm)),
      );
      const aprovacaoAssinatura = this.avg(
        contratos.map((c) => this.days(c.createdAt, c.dataAssinatura ?? c.updatedAt)),
      );
      const assinaturaPagamento = this.avg(
        faturas.map((f) => this.days(f.dataEmissao ?? f.createdAt, f.dataPagamento ?? f.createdAt)),
      );

      return {
        vendas: {
          total_periodo: Number(totalAtual.toFixed(2)),
          meta_periodo: this.getMetaConversao(),
          crescimento_percentual: Number(crescimento.toFixed(1)),
          ticket_medio: Number(ticket.toFixed(2)),
          conversao_geral: Number((this.ratio(faturasPagas, propostasCriadas) * 100).toFixed(1)),
        },
        funil: {
          propostas_criadas: propostasCriadas,
          propostas_enviadas: propostasEnviadas,
          propostas_aprovadas: propostasAprovadas,
          contratos_assinados: contratosAssinados,
          faturas_pagas: faturasPagas,
          conversao_por_etapa: {
            criada_para_enviada: Number((this.ratio(propostasEnviadas, propostasCriadas) * 100).toFixed(1)),
            enviada_para_aprovada: Number((this.ratio(propostasAprovadas, propostasEnviadas) * 100).toFixed(1)),
            aprovada_para_assinada: Number((this.ratio(contratosAssinados, propostasAprovadas) * 100).toFixed(1)),
            assinada_para_paga: Number((this.ratio(faturasPagas, contratosAssinados) * 100).toFixed(1)),
          },
        },
        tempo_medio: {
          proposta_para_envio: propostaEnvio,
          envio_para_aprovacao: envioAprovacao,
          aprovacao_para_assinatura: aprovacaoAssinatura,
          assinatura_para_pagamento: assinaturaPagamento,
          ciclo_completo: Number((propostaEnvio + envioAprovacao + aprovacaoAssinatura + assinaturaPagamento).toFixed(1)),
        },
        vendedores: this.buildVendedores(propostas, vendedoresAtivos, vendedorId),
        evolucao_temporal: this.buildEvolucao(propostas, periodo, startDate, endDate),
        distribuicao_valores: this.buildDistribuicao(propostas),
        status_atual: this.buildStatusAtual(propostas),
      };
    } catch (error) {
      this.logger.error('Erro ao gerar dashboard analytics', error);
      throw error;
    }
  }

  async getFunilConversao(params: AnalyticsQueryParams) {
    const data = await this.getDashboardData(params);
    const gargalos = [
      {
        etapa: 'Criada -> Enviada',
        taxa_conversao: data.funil.conversao_por_etapa.criada_para_enviada,
        melhoria_sugerida: 'Definir SLA de envio em ate 24h.',
      },
      {
        etapa: 'Enviada -> Aprovada',
        taxa_conversao: data.funil.conversao_por_etapa.enviada_para_aprovada,
        melhoria_sugerida: 'Reforcar follow-up comercial nas 48h iniciais.',
      },
      {
        etapa: 'Aprovada -> Assinada',
        taxa_conversao: data.funil.conversao_por_etapa.aprovada_para_assinada,
        melhoria_sugerida: 'Padronizar checklist de assinatura.',
      },
      {
        etapa: 'Assinada -> Paga',
        taxa_conversao: data.funil.conversao_por_etapa.assinada_para_paga,
        melhoria_sugerida: 'Automatizar lembretes de pagamento.',
      },
    ]
      .sort((a, b) => a.taxa_conversao - b.taxa_conversao)
      .slice(0, 2);

    return {
      etapas: [
        { nome: 'Propostas Criadas', quantidade: data.funil.propostas_criadas, percentual: 100 },
        {
          nome: 'Propostas Enviadas',
          quantidade: data.funil.propostas_enviadas,
          percentual: data.funil.conversao_por_etapa.criada_para_enviada,
        },
        {
          nome: 'Propostas Aprovadas',
          quantidade: data.funil.propostas_aprovadas,
          percentual: data.funil.conversao_por_etapa.enviada_para_aprovada,
        },
        {
          nome: 'Contratos Assinados',
          quantidade: data.funil.contratos_assinados,
          percentual: data.funil.conversao_por_etapa.aprovada_para_assinada,
        },
        {
          nome: 'Faturas Pagas',
          quantidade: data.funil.faturas_pagas,
          percentual: data.funil.conversao_por_etapa.assinada_para_paga,
        },
      ],
      gargalos,
    };
  }

  async getPerformanceVendedores(params: AnalyticsQueryParams) {
    const data = await this.getDashboardData(params);
    const base = [...data.vendedores].sort((a, b) => b.valor_vendido - a.valor_vendido);
    const total = this.sum(base.map((v) => v.valor_vendido));

    return {
      vendedores: base.map((vendedor, index) => {
        const p = this.ratio(vendedor.valor_vendido, total);
        return {
          id: vendedor.id,
          nome: vendedor.nome,
          metricas: {
            propostas_criadas: vendedor.propostas_criadas,
            propostas_fechadas: vendedor.propostas_fechadas,
            valor_vendido: vendedor.valor_vendido,
            ticket_medio: vendedor.ticket_medio,
            tempo_medio_fechamento: vendedor.tempo_medio_fechamento,
            conversao: vendedor.conversao,
          },
          evolucao_mensal: data.evolucao_temporal.slice(-4).map((e) => ({
            mes: e.periodo,
            vendas: Math.round(e.vendas * p),
            valor: Number((e.valor * p).toFixed(2)),
          })),
          ranking: index + 1,
        };
      }),
    };
  }

  async getEvolucaoTemporal(params: AnalyticsQueryParams) {
    const data = await this.getDashboardData(params);
    const primeira = data.evolucao_temporal[0];
    const ultima = data.evolucao_temporal[data.evolucao_temporal.length - 1];
    const ticketPrimeira = this.ratio(primeira?.valor ?? 0, primeira?.vendas ?? 0);
    const ticketUltima = this.ratio(ultima?.valor ?? 0, ultima?.vendas ?? 0);

    return {
      dados: data.evolucao_temporal.map((e) => ({
        data: e.periodo,
        propostas: e.propostas,
        vendas: e.vendas,
        valor: e.valor,
      })),
      tendencias: {
        propostas: this.trend(ultima?.propostas ?? 0, primeira?.propostas ?? 0),
        vendas: this.trend(ultima?.vendas ?? 0, primeira?.vendas ?? 0),
        ticket_medio: this.trend(ticketUltima, ticketPrimeira),
      },
    };
  }

  async getTempoMedioEtapas(params: AnalyticsQueryParams) {
    const data = await this.getDashboardData(params);
    const etapas = [
      { nome: 'Proposta -> Envio', tempo_medio: data.tempo_medio.proposta_para_envio, benchmark: 0.5 },
      { nome: 'Envio -> Aprovacao', tempo_medio: data.tempo_medio.envio_para_aprovacao, benchmark: 2.5 },
      { nome: 'Aprovacao -> Assinatura', tempo_medio: data.tempo_medio.aprovacao_para_assinatura, benchmark: 1.5 },
      { nome: 'Assinatura -> Pagamento', tempo_medio: data.tempo_medio.assinatura_para_pagamento, benchmark: 2.0 },
    ].map((item) => ({ ...item, status: this.benchmarkStatus(item.tempo_medio, item.benchmark) }));

    return {
      etapas,
      sugestoes: etapas
        .filter((e) => e.status !== 'bom')
        .map((e) => `Revisar etapa "${e.nome}" para reduzir tempo de ciclo.`),
    };
  }

  async getDistribuicaoValores(params: AnalyticsQueryParams) {
    const data = await this.getDashboardData(params);
    const topQuantidade = [...data.distribuicao_valores].sort((a, b) => b.quantidade - a.quantidade)[0];
    const topValor = [...data.distribuicao_valores].sort((a, b) => b.valor_total - a.valor_total)[0];

    return {
      faixas: data.distribuicao_valores,
      insights: [
        topQuantidade
          ? `Maior volume na faixa "${topQuantidade.faixa}" com ${topQuantidade.quantidade} propostas.`
          : 'Sem dados suficientes no periodo.',
        topValor
          ? `Maior valor acumulado na faixa "${topValor.faixa}".`
          : 'Sem concentracao relevante de valor.',
      ],
    };
  }

  async getPrevisaoFechamento(params: AnalyticsQueryParams) {
    const vendedorId = this.normalizeVendedor(params.vendedor);
    const oportunidadesQuery = this.oportunidadeRepo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.responsavel', 'responsavel')
      .where('o.empresa_id = :empresaId', { empresaId: params.empresaId })
      .andWhere('o.estagio IN (:...estagios)', {
        estagios: [
          EstagioOportunidade.PROPOSTA,
          EstagioOportunidade.NEGOCIACAO,
          EstagioOportunidade.FECHAMENTO,
          EstagioOportunidade.GANHO,
        ],
      });

    if (vendedorId) oportunidadesQuery.andWhere('o.responsavel_id = :vendedorId', { vendedorId });
    const oportunidades = await oportunidadesQuery.getMany();

    const agora = new Date();
    const previsao = this.sum(
      oportunidades.map((o) => this.num(o.valor) * this.ratio(this.num(o.probabilidade), 100)),
    );
    const confianca = this.avg(oportunidades.map((o) => this.num(o.probabilidade)));

    const propostasQuentes = [...oportunidades]
      .sort((a, b) => b.probabilidade - a.probabilidade || this.num(b.valor) - this.num(a.valor))
      .slice(0, 5)
      .map((o) => ({
        id: String(o.id),
        cliente: o.empresaContato || o.nomeContato || o.titulo || 'Oportunidade',
        valor: Number(this.num(o.valor).toFixed(2)),
        probabilidade: Number(this.num(o.probabilidade).toFixed(1)),
        dias_para_fechar: o.dataFechamentoEsperado ? this.days(agora, o.dataFechamentoEsperado) : 0,
        vendedor: o.responsavel?.nome || 'Sem responsavel',
      }));

    return {
      previsao_mensal: {
        valor_previsto: Number(previsao.toFixed(2)),
        confianca: Number(confianca.toFixed(1)),
        base_calculo: 'pipeline ponderado por probabilidade',
      },
      propostas_quentes: propostasQuentes,
      alertas: propostasQuentes
        .filter((p) => p.dias_para_fechar > 0 && p.dias_para_fechar <= 5)
        .map((p) => `Oportunidade "${p.cliente}" prevista para fechar em ${p.dias_para_fechar} dia(s).`),
    };
  }

  async getAlertasGestao(params: AnalyticsQueryParams) {
    const dashboard = await this.getDashboardData(params);
    const leadsQualificados = await this.leadRepo.count({
      where: {
        empresaId: params.empresaId,
        status: In([StatusLead.QUALIFICADO, StatusLead.CONTATADO]),
      },
    });

    const baixaConversao = dashboard.vendedores.filter(
      (v) => v.propostas_criadas >= 5 && v.conversao < 15,
    ).length;
    const propostasParadas = dashboard.status_atual
      .filter((s) => s.status === 'Enviada' || s.status === 'Visualizada')
      .reduce((acc, item) => acc + item.quantidade, 0);

    return {
      alertas_criticos: [
        ...(propostasParadas > 0
          ? [
              {
                tipo: 'prazo_vencido',
                quantidade: propostasParadas,
                descricao: 'Propostas enviadas/visualizadas sem avancar no funil.',
                acao_sugerida: 'Executar follow-up com prioridade.',
              },
            ]
          : []),
        ...(baixaConversao > 0
          ? [
              {
                tipo: 'baixa_conversao',
                quantidade: baixaConversao,
                descricao: 'Vendedores abaixo da conversao minima.',
                acao_sugerida: 'Revisar abordagem comercial e rotina de contatos.',
              },
            ]
          : []),
      ],
      alertas_atencao: [],
      oportunidades: [
        {
          tipo: 'conversao_leads',
          quantidade: leadsQualificados,
          descricao: 'Leads qualificados aptos para virar oportunidade.',
          potencial_receita: Number((leadsQualificados * this.getLeadPotential()).toFixed(2)),
        },
      ],
    };
  }

  async exportarRelatorio(params: AnalyticsQueryParams): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const data = await this.getDashboardData(params);

    const resumoSheet = workbook.addWorksheet('Resumo Executivo');
    resumoSheet.addRow(['RELATORIO DE VENDAS - RESUMO EXECUTIVO']);
    resumoSheet.addRow([]);
    resumoSheet.addRow(['Periodo:', params.periodo || '30d']);
    resumoSheet.addRow(['Vendedor:', params.vendedor || 'Todos']);
    resumoSheet.addRow(['Gerado em:', new Date().toLocaleString('pt-BR')]);
    resumoSheet.addRow([]);
    resumoSheet.addRow(['Total de Vendas:', data.vendas.total_periodo]);
    resumoSheet.addRow(['Taxa de Conversao:', `${data.vendas.conversao_geral}%`]);
    resumoSheet.addRow(['Ticket Medio:', data.vendas.ticket_medio]);
    resumoSheet.addRow(['Ciclo Medio:', `${data.tempo_medio.ciclo_completo} dias`]);

    const vendedoresSheet = workbook.addWorksheet('Performance Vendedores');
    vendedoresSheet.addRow([
      'Nome',
      'Propostas Criadas',
      'Propostas Fechadas',
      'Conversao (%)',
      'Valor Vendido',
      'Ticket Medio',
    ]);
    data.vendedores.forEach((vendedor) => {
      vendedoresSheet.addRow([
        vendedor.nome,
        vendedor.propostas_criadas,
        vendedor.propostas_fechadas,
        vendedor.conversao,
        vendedor.valor_vendido,
        vendedor.ticket_medio,
      ]);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async getKpisTempoReal(empresaId: string) {
    const agora = new Date();
    const inicioHoje = new Date(agora);
    inicioHoje.setHours(0, 0, 0, 0);
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

    const [propostasHoje, propostas24h, faturasHoje, faturasMes, vendedoresAtivos, pipeline] = await Promise.all([
      this.queryPropostas(empresaId, inicioHoje, agora),
      this.queryPropostas(empresaId, new Date(agora.getTime() - 24 * 60 * 60 * 1000), agora),
      this.queryFaturasPagas(empresaId, inicioHoje, agora),
      this.queryFaturasPagas(empresaId, inicioMes, agora),
      this.queryVendedoresAtivos(empresaId),
      this.oportunidadeRepo.find({
        where: {
          empresa_id: empresaId,
          estagio: In([
            EstagioOportunidade.LEADS,
            EstagioOportunidade.QUALIFICACAO,
            EstagioOportunidade.PROPOSTA,
            EstagioOportunidade.NEGOCIACAO,
            EstagioOportunidade.FECHAMENTO,
          ]),
        },
      }),
    ]);

    const propostasRespondidas24h = propostas24h.filter((p) =>
      ['visualizada', 'aprovada', 'rejeitada'].includes(p.status),
    ).length;

    return {
      vendas_hoje: Number(this.sum(faturasHoje.map((f) => this.num(f.valorTotal))).toFixed(2)),
      propostas_enviadas_hoje: propostasHoje.filter((p) => p.status !== 'rascunho').length,
      taxa_resposta_24h: Number((this.ratio(propostasRespondidas24h, propostas24h.length) * 100).toFixed(1)),
      pipeline_valor: Number(this.sum(pipeline.map((p) => this.num(p.valor))).toFixed(2)),
      meta_mensal_progresso: Number(
        ((this.sum(faturasMes.map((f) => this.num(f.valorTotal))) / this.getMetaFaturamento()) * 100).toFixed(1),
      ),
      vendedores_ativos: vendedoresAtivos.length,
      ultima_atualizacao: agora.toISOString(),
    };
  }

  async getMetasProgresso(params: AnalyticsQueryParams) {
    const data = await this.getDashboardData(params);
    const metas = [
      {
        nome: 'Vendas Mensais',
        valor_atual: data.vendas.total_periodo,
        valor_meta: this.getMetaFaturamento(),
      },
      {
        nome: 'Conversao',
        valor_atual: data.vendas.conversao_geral,
        valor_meta: this.getMetaConversao(),
      },
      {
        nome: 'Ticket Medio',
        valor_atual: data.vendas.ticket_medio,
        valor_meta: this.getMetaTicket(),
      },
    ].map((meta) => {
      const progresso = Number((this.ratio(meta.valor_atual, meta.valor_meta) * 100).toFixed(1));
      return { ...meta, progresso, status: this.metaStatus(progresso) };
    });

    return {
      metas,
      previsao_cumprimento: Number(this.avg(metas.map((m) => m.progresso)).toFixed(1)),
    };
  }

  private async queryPropostas(
    empresaId: string,
    startDate: Date,
    endDate: Date,
    vendedorId?: string,
    status?: string[],
  ) {
    const startDateOnly = startDate.toISOString().slice(0, 10);
    const endDateOnly = endDate.toISOString().slice(0, 10);
    const query = this.propostaRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.vendedor', 'vendedor')
      .where('p.empresaId = :empresaId', { empresaId })
      .andWhere('DATE(p.criadaEm) BETWEEN :startDateOnly AND :endDateOnly', {
        startDateOnly,
        endDateOnly,
      });

    if (vendedorId) query.andWhere('p.vendedor_id = :vendedorId', { vendedorId });
    if (status && status.length > 0) query.andWhere('p.status IN (:...status)', { status });
    return query.getMany();
  }

  private async queryFaturasPagas(
    empresaId: string,
    startDate: Date,
    endDate: Date,
    vendedorId?: string,
  ) {
    const startDateOnly = startDate.toISOString().slice(0, 10);
    const endDateOnly = endDate.toISOString().slice(0, 10);
    const query = this.faturaRepo
      .createQueryBuilder('f')
      .where('f.empresaId = :empresaId', { empresaId })
      .andWhere('f.status = :status', { status: StatusFatura.PAGA })
      .andWhere(
        `(
          (f.dataPagamento IS NOT NULL AND f.dataPagamento BETWEEN :startDateOnly AND :endDateOnly)
          OR
          (f.dataPagamento IS NULL AND DATE(f.createdAt) BETWEEN :startDateOnly AND :endDateOnly)
        )`,
        {
          startDateOnly,
          endDateOnly,
        },
      );

    if (vendedorId) query.andWhere('f.usuarioResponsavelId = :vendedorId', { vendedorId });
    return query.getMany();
  }

  private async queryContratosAssinados(
    empresaId: string,
    startDate: Date,
    endDate: Date,
    vendedorId?: string,
  ) {
    const startDateOnly = startDate.toISOString().slice(0, 10);
    const endDateOnly = endDate.toISOString().slice(0, 10);
    const query = this.contratoRepo
      .createQueryBuilder('c')
      .where('c.empresa_id = :empresaId', { empresaId })
      .andWhere('c.status = :status', { status: StatusContrato.ASSINADO })
      .andWhere(
        `(
          (c.dataAssinatura IS NOT NULL AND c.dataAssinatura BETWEEN :startDateOnly AND :endDateOnly)
          OR
          (c.dataAssinatura IS NULL AND DATE(c.createdAt) BETWEEN :startDateOnly AND :endDateOnly)
        )`,
        {
          startDateOnly,
          endDateOnly,
        },
      );

    if (vendedorId) query.andWhere('c.usuarioResponsavelId = :vendedorId', { vendedorId });
    return query.getMany();
  }

  private async queryVendedoresAtivos(empresaId: string) {
    return this.userRepo.find({
      where: {
        empresa_id: empresaId,
        ativo: true,
        role: In([UserRole.ADMIN, UserRole.MANAGER, UserRole.VENDEDOR]),
      },
    });
  }

  private buildVendedores(propostas: Proposta[], usuarios: User[], vendedorSelecionado?: string) {
    const map = new Map<string, VendorAccumulator>();

    usuarios.forEach((u) => {
      if (vendedorSelecionado && u.id !== vendedorSelecionado) return;
      map.set(u.id, {
        id: u.id,
        nome: u.nome,
        propostas: 0,
        fechadas: 0,
        valor: 0,
        amostras: [],
      });
    });

    propostas.forEach((p) => {
      if (!p.vendedor_id) return;
      if (vendedorSelecionado && p.vendedor_id !== vendedorSelecionado) return;

      const cur =
        map.get(p.vendedor_id) ||
        ({
          id: p.vendedor_id,
          nome: p.vendedor?.nome || 'Vendedor',
          propostas: 0,
          fechadas: 0,
          valor: 0,
          amostras: [],
        } as VendorAccumulator);

      cur.propostas += 1;
      if (p.status === 'aprovada') {
        cur.fechadas += 1;
        cur.valor += this.num(p.total ?? p.valor ?? 0);
        cur.amostras.push(this.days(p.criadaEm, p.atualizadaEm));
      }
      map.set(p.vendedor_id, cur);
    });

    if (vendedorSelecionado && !map.has(vendedorSelecionado)) {
      map.set(vendedorSelecionado, {
        id: vendedorSelecionado,
        nome: 'Vendedor',
        propostas: 0,
        fechadas: 0,
        valor: 0,
        amostras: [],
      });
    }

    return Array.from(map.values())
      .map((v) => ({
        id: v.id,
        nome: v.nome,
        propostas_criadas: v.propostas,
        propostas_fechadas: v.fechadas,
        valor_vendido: Number(v.valor.toFixed(2)),
        ticket_medio: Number(this.ratio(v.valor, v.fechadas).toFixed(2)),
        tempo_medio_fechamento: Number(this.avg(v.amostras).toFixed(1)),
        conversao: Number((this.ratio(v.fechadas, v.propostas) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.valor_vendido - a.valor_vendido);
  }

  private buildEvolucao(propostas: Proposta[], periodo: Periodo, startDate: Date, endDate: Date) {
    const bucketsCount = periodo === '7d' ? 7 : periodo === '1y' ? 12 : periodo === '90d' ? 3 : 4;
    const startMs = startDate.getTime();
    const endMs = endDate.getTime();
    const totalMs = Math.max(1, endMs - startMs + 1);
    const buckets = Array.from({ length: bucketsCount }, (_, i) => {
      const bStart = startMs + Math.floor((totalMs * i) / bucketsCount);
      const bEnd = i === bucketsCount - 1 ? endMs : startMs + Math.floor((totalMs * (i + 1)) / bucketsCount) - 1;
      const label =
        periodo === '7d'
          ? new Date(bStart).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
          : periodo === '1y'
            ? new Date(bStart).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '')
            : periodo === '90d'
              ? `Mes ${i + 1}`
              : `Sem ${i + 1}`;

      return { label, bStart, bEnd, propostas: 0, vendas: 0, valor: 0 };
    });

    propostas.forEach((p) => {
      const t = new Date(p.criadaEm).getTime();
      const bucket = buckets.find((b) => t >= b.bStart && t <= b.bEnd);
      if (!bucket) return;
      bucket.propostas += 1;
      if (p.status === 'aprovada') {
        bucket.vendas += 1;
        bucket.valor += this.num(p.total ?? p.valor ?? 0);
      }
    });

    return buckets.map((b) => ({
      periodo: b.label,
      propostas: b.propostas,
      vendas: b.vendas,
      valor: Number(b.valor.toFixed(2)),
      conversao: Number((this.ratio(b.vendas, b.propostas) * 100).toFixed(1)),
    }));
  }

  private buildDistribuicao(propostas: Proposta[]) {
    const faixas = [
      { faixa: 'Ate R$ 10k', min: 0, max: 10000, quantidade: 0, valor_total: 0 },
      { faixa: 'R$ 10k - 25k', min: 10000, max: 25000, quantidade: 0, valor_total: 0 },
      { faixa: 'R$ 25k - 50k', min: 25000, max: 50000, quantidade: 0, valor_total: 0 },
      { faixa: 'Acima R$ 50k', min: 50000, max: Number.POSITIVE_INFINITY, quantidade: 0, valor_total: 0 },
    ];

    propostas.forEach((p) => {
      const valor = this.num(p.total ?? p.valor ?? 0);
      const faixa = faixas.find((f) => valor > f.min && valor <= f.max) ?? faixas[0];
      faixa.quantidade += 1;
      faixa.valor_total += valor;
    });

    return faixas.map((f) => ({
      faixa: f.faixa,
      quantidade: f.quantidade,
      valor_total: Number(f.valor_total.toFixed(2)),
      percentual: Number((this.ratio(f.quantidade, propostas.length) * 100).toFixed(1)),
    }));
  }

  private buildStatusAtual(propostas: Proposta[]) {
    const labels: Array<{ key: StatusProposta; label: string }> = [
      { key: 'rascunho', label: 'Rascunho' },
      { key: 'enviada', label: 'Enviada' },
      { key: 'visualizada', label: 'Visualizada' },
      { key: 'aprovada', label: 'Aprovada' },
      { key: 'rejeitada', label: 'Rejeitada' },
      { key: 'expirada', label: 'Expirada' },
    ];
    const agora = new Date();

    return labels.map((item) => {
      const arr = propostas.filter((p) => p.status === item.key);
      return {
        status: item.label,
        quantidade: arr.length,
        valor_total: Number(this.sum(arr.map((p) => this.num(p.total ?? p.valor ?? 0))).toFixed(2)),
        tempo_medio_status: Number(this.avg(arr.map((p) => this.days(p.criadaEm, agora))).toFixed(1)),
      };
    });
  }

  private getDateRange(periodo: Periodo) {
    const endDate = new Date();
    const startDate = new Date(endDate);
    if (periodo === '7d') startDate.setDate(endDate.getDate() - 7);
    else if (periodo === '30d') startDate.setDate(endDate.getDate() - 30);
    else if (periodo === '90d') startDate.setDate(endDate.getDate() - 90);
    else startDate.setFullYear(endDate.getFullYear() - 1);
    return { startDate, endDate };
  }

  private getPreviousRange(currentStart: Date, currentEnd: Date) {
    const delta = Math.max(1, currentEnd.getTime() - currentStart.getTime() + 1);
    const endDate = new Date(currentStart.getTime() - 1);
    const startDate = new Date(endDate.getTime() - delta + 1);
    return { startDate, endDate };
  }

  private normalizeVendedor(vendedor?: string) {
    if (!vendedor || vendedor === 'todos') return undefined;
    return vendedor;
  }

  private num(value: unknown) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  private sum(values: number[]) {
    return values.reduce((acc, v) => acc + this.num(v), 0);
  }

  private avg(values: number[]) {
    const valid = values.filter((v) => Number.isFinite(v) && v >= 0);
    if (valid.length === 0) return 0;
    return this.sum(valid) / valid.length;
  }

  private ratio(num: number, den: number) {
    if (!den || den <= 0) return 0;
    return num / den;
  }

  private variation(current: number, prev: number) {
    if (prev <= 0) return current > 0 ? 100 : 0;
    return ((current - prev) / prev) * 100;
  }

  private days(start: Date | string | null | undefined, end: Date | string | null | undefined) {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 0;
    return Math.max(0, (e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
  }

  private trend(current: number, base: number): 'crescendo' | 'caindo' | 'estavel' {
    if (current > base) return 'crescendo';
    if (current < base) return 'caindo';
    return 'estavel';
  }

  private benchmarkStatus(value: number, benchmark: number): 'bom' | 'atencao' | 'critico' {
    if (value <= benchmark * 1.1) return 'bom';
    if (value <= benchmark * 1.5) return 'atencao';
    return 'critico';
  }

  private metaStatus(progress: number): 'superado' | 'no_prazo' | 'atencao' {
    if (progress >= 100) return 'superado';
    if (progress >= 80) return 'no_prazo';
    return 'atencao';
  }

  private getMetaFaturamento() {
    return this.num(process.env.ANALYTICS_META_FATURAMENTO_MENSAL || 100000);
  }

  private getMetaConversao() {
    return this.num(process.env.ANALYTICS_META_CONVERSAO || 25);
  }

  private getMetaTicket() {
    return this.num(process.env.ANALYTICS_META_TICKET_MEDIO || 15000);
  }

  private getLeadPotential() {
    return this.num(process.env.ANALYTICS_LEAD_POTENTIAL_AVG || 2500);
  }
}
