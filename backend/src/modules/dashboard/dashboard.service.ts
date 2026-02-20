import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Proposta as PropostaEntity } from '../propostas/proposta.entity';
import { User, UserRole } from '../users/user.entity';
import { Cliente } from '../clientes/cliente.entity';
import { MetasService } from '../metas/metas.service';
import { EventosService } from '../eventos/eventos.service';

export interface DashboardKPIs {
  faturamentoTotal: {
    valor: number;
    meta: number;
    variacao: number;
    periodo: string;
  };
  ticketMedio: {
    valor: number;
    variacao: number;
    periodo: string;
  };
  vendasFechadas: {
    quantidade: number;
    variacao: number;
    periodo: string;
  };
  emNegociacao: {
    valor: number;
    quantidade: number;
    propostas: string[];
  };
  novosClientesMes: {
    quantidade: number;
    variacao: number;
  };
  leadsQualificados: {
    quantidade: number;
    variacao: number;
  };
  propostasEnviadas: {
    valor: number;
    variacao: number;
  };
  cicloMedio: {
    dias: number;
    variacao: number;
  };
  tempoEtapa: {
    dias: number;
    variacao: number;
  };
  followUpsPendentes: {
    quantidade: number;
    variacao: number;
  };
  taxaSucessoGeral: {
    percentual: number;
    variacao: number;
  };
  agenda: {
    totalEventos: number;
    eventosConcluidos: number;
    proximosEventos: number;
    eventosHoje: number;
    estatisticasPorTipo: {
      reuniao: number;
      ligacao: number;
      apresentacao: number;
      visita: number;
      'follow-up': number;
      outro: number;
    };
    produtividade: number;
  };
}

export interface VendedorRanking {
  id: string;
  nome: string;
  vendas: number;
  meta: number;
  variacao: number;
  posicao: number;
  badges: string[];
  cor: string;
}

export interface AlertaInteligente {
  id: string;
  tipo: 'meta' | 'prazo' | 'tendencia' | 'oportunidade' | 'conquista';
  severidade: 'baixa' | 'media' | 'alta' | 'critica';
  titulo: string;
  descricao: string;
  valor?: number;
  dataLimite?: string;
  acao?: {
    texto: string;
    url: string;
  };
  timestamp: Date;
  lido: boolean;
}

export interface DashboardChartsData {
  vendasMensais: Array<{ mes: string; valor: number; meta: number }>;
  propostasPorStatus: Array<{ status: string; valor: number; color: string }>;
  atividadesTimeline: Array<{ mes: string; reunioes: number; ligacoes: number; emails: number }>;
  funilVendas: Array<{ etapa: string; quantidade: number; valor: number }>;
}

@Injectable()
export class DashboardService {
  private readonly statusAprovadaAliases = ['aprovada', 'aceita'];
  private readonly statusEmNegociacaoAliases = ['enviada', 'visualizada'];

  constructor(
    @InjectRepository(PropostaEntity)
    private propostaRepository: Repository<PropostaEntity>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
    private metasService: MetasService,
    private eventosService: EventosService,
  ) {}

  private isStatusAprovada(status?: string): boolean {
    return !!status && this.statusAprovadaAliases.includes(status);
  }

  /**
   * Obter KPIs principais do dashboard
   */
  async getKPIs(
    periodo: string = 'mensal',
    vendedorId?: string,
    regiao?: string,
    empresaId?: string,
  ): Promise<DashboardKPIs> {
    const { dataInicio, dataFim } = this.getDateRange(periodo);
    const periodoAnterior = this.getPreviousDateRange(periodo, { dataInicio, dataFim });

    // Buscar meta atual para o vendedor/região específica
    const metaAtual = await this.metasService.getMetaAtual(vendedorId, regiao, empresaId);
    const valorMeta = metaAtual?.valor || 450000; // Meta padrão se não encontrar

    // Faturamento Total
    const faturamentoAtual = await this.calculateFaturamento(
      dataInicio,
      dataFim,
      vendedorId,
      regiao,
      empresaId,
    );
    const faturamentoAnterior = await this.calculateFaturamento(
      periodoAnterior.dataInicio,
      periodoAnterior.dataFim,
      vendedorId,
      regiao,
      empresaId,
    );
    const variacaoFaturamento =
      faturamentoAnterior > 0
        ? ((faturamentoAtual - faturamentoAnterior) / faturamentoAnterior) * 100
        : 0;

    // Ticket Médio
    const ticketMedioAtual = await this.calculateTicketMedio(
      dataInicio,
      dataFim,
      vendedorId,
      regiao,
      empresaId,
    );
    const ticketMedioAnterior = await this.calculateTicketMedio(
      periodoAnterior.dataInicio,
      periodoAnterior.dataFim,
      vendedorId,
      regiao,
      empresaId,
    );
    const variacaoTicketMedio =
      ticketMedioAnterior > 0
        ? ((ticketMedioAtual - ticketMedioAnterior) / ticketMedioAnterior) * 100
        : 0;

    // Vendas Fechadas
    const vendasFechadasAtual = await this.calculateVendasFechadas(
      dataInicio,
      dataFim,
      vendedorId,
      regiao,
      empresaId,
    );
    const vendasFechadasAnterior = await this.calculateVendasFechadas(
      periodoAnterior.dataInicio,
      periodoAnterior.dataFim,
      vendedorId,
      regiao,
      empresaId,
    );
    const variacaoVendasFechadas =
      vendasFechadasAnterior > 0
        ? ((vendasFechadasAtual - vendasFechadasAnterior) / vendasFechadasAnterior) * 100
        : 0;

    // Em Negociação
    const emNegociacao = await this.calculateEmNegociacao(vendedorId, regiao, empresaId);

    // Novos Clientes
    const novosClientesAtual = await this.calculateNovosClientes(
      dataInicio,
      dataFim,
      regiao,
      empresaId,
    );
    const novosClientesAnterior = await this.calculateNovosClientes(
      periodoAnterior.dataInicio,
      periodoAnterior.dataFim,
      regiao,
      empresaId,
    );
    const variacaoNovosClientes =
      novosClientesAnterior > 0
        ? ((novosClientesAtual - novosClientesAnterior) / novosClientesAnterior) * 100
        : 0;

    // Leads Qualificados (propostas enviadas)
    const leadsAtual = await this.calculateLeadsQualificados(
      dataInicio,
      dataFim,
      vendedorId,
      regiao,
      empresaId,
    );
    const leadsAnterior = await this.calculateLeadsQualificados(
      periodoAnterior.dataInicio,
      periodoAnterior.dataFim,
      vendedorId,
      regiao,
      empresaId,
    );
    const variacaoLeads =
      leadsAnterior > 0 ? ((leadsAtual - leadsAnterior) / leadsAnterior) * 100 : 0;

    // Propostas Enviadas (valor)
    const propostasEnviadasAtual = await this.calculatePropostasEnviadas(
      dataInicio,
      dataFim,
      vendedorId,
      regiao,
      empresaId,
    );
    const propostasEnviadasAnterior = await this.calculatePropostasEnviadas(
      periodoAnterior.dataInicio,
      periodoAnterior.dataFim,
      vendedorId,
      regiao,
      empresaId,
    );
    const variacaoPropostasEnviadas =
      propostasEnviadasAnterior > 0
        ? ((propostasEnviadasAtual - propostasEnviadasAnterior) / propostasEnviadasAnterior) * 100
        : 0;

    // Ciclo Médio de venda (dias)
    const cicloMedioAtual = await this.calculateCicloMedio(
      dataInicio,
      dataFim,
      vendedorId,
      regiao,
      empresaId,
    );
    const cicloMedioAnterior = await this.calculateCicloMedio(
      periodoAnterior.dataInicio,
      periodoAnterior.dataFim,
      vendedorId,
      regiao,
      empresaId,
    );
    const variacaoCicloMedio = cicloMedioAnterior > 0 ? cicloMedioAtual - cicloMedioAnterior : 0;

    // Tempo médio por etapa ativa (dias)
    const tempoEtapaAtual = await this.calculateTempoEtapa(
      dataInicio,
      dataFim,
      vendedorId,
      regiao,
      empresaId,
    );
    const tempoEtapaAnterior = await this.calculateTempoEtapa(
      periodoAnterior.dataInicio,
      periodoAnterior.dataFim,
      vendedorId,
      regiao,
      empresaId,
    );
    const variacaoTempoEtapa = tempoEtapaAnterior > 0 ? tempoEtapaAtual - tempoEtapaAnterior : 0;

    // Follow-ups pendentes
    const followUpsPendentesAtual = await this.calculateFollowUpsPendentes(
      dataInicio,
      dataFim,
      vendedorId,
      regiao,
      empresaId,
    );
    const followUpsPendentesAnterior = await this.calculateFollowUpsPendentes(
      periodoAnterior.dataInicio,
      periodoAnterior.dataFim,
      vendedorId,
      regiao,
      empresaId,
    );
    const variacaoFollowUpsPendentes =
      followUpsPendentesAnterior > 0
        ? ((followUpsPendentesAtual - followUpsPendentesAnterior) / followUpsPendentesAnterior) *
          100
        : 0;

    // Taxa de Sucesso
    const taxaSucessoAtual = await this.calculateTaxaSucesso(
      dataInicio,
      dataFim,
      vendedorId,
      regiao,
      empresaId,
    );
    const taxaSucessoAnterior = await this.calculateTaxaSucesso(
      periodoAnterior.dataInicio,
      periodoAnterior.dataFim,
      vendedorId,
      regiao,
      empresaId,
    );
    const variacaoTaxaSucesso =
      taxaSucessoAnterior > 0 ? taxaSucessoAtual - taxaSucessoAnterior : 0;

    // Estatísticas da Agenda - filtrar por empresa do usuário logado
    const eventStats = await this.eventosService.getEventStatsByPeriod(
      dataInicio.toISOString().split('T')[0],
      dataFim.toISOString().split('T')[0],
      vendedorId,
      empresaId,
    );

    return {
      faturamentoTotal: {
        valor: faturamentoAtual,
        meta: valorMeta, // Usando a meta obtida dinamicamente
        variacao: Number(variacaoFaturamento.toFixed(1)),
        periodo: this.getPeriodoLabel(periodo),
      },
      ticketMedio: {
        valor: ticketMedioAtual,
        variacao: Number(variacaoTicketMedio.toFixed(1)),
        periodo: this.getPeriodoLabel(periodo),
      },
      vendasFechadas: {
        quantidade: vendasFechadasAtual,
        variacao: Number(variacaoVendasFechadas.toFixed(1)),
        periodo: this.getPeriodoLabel(periodo),
      },
      emNegociacao: {
        valor: emNegociacao.valor,
        quantidade: emNegociacao.quantidade,
        propostas: emNegociacao.propostas,
      },
      novosClientesMes: {
        quantidade: novosClientesAtual,
        variacao: Number(variacaoNovosClientes.toFixed(1)),
      },
      leadsQualificados: {
        quantidade: leadsAtual,
        variacao: Number(variacaoLeads.toFixed(1)),
      },
      propostasEnviadas: {
        valor: propostasEnviadasAtual,
        variacao: Number(variacaoPropostasEnviadas.toFixed(1)),
      },
      cicloMedio: {
        dias: Number(cicloMedioAtual.toFixed(1)),
        variacao: Number(variacaoCicloMedio.toFixed(1)),
      },
      tempoEtapa: {
        dias: Number(tempoEtapaAtual.toFixed(1)),
        variacao: Number(variacaoTempoEtapa.toFixed(1)),
      },
      followUpsPendentes: {
        quantidade: followUpsPendentesAtual,
        variacao: Number(variacaoFollowUpsPendentes.toFixed(1)),
      },
      taxaSucessoGeral: {
        percentual: Number(taxaSucessoAtual.toFixed(1)),
        variacao: Number(variacaoTaxaSucesso.toFixed(1)),
      },
      agenda: {
        totalEventos: eventStats.totalEventos,
        eventosConcluidos: eventStats.eventosConcluidos,
        proximosEventos: eventStats.proximosEventos,
        eventosHoje: eventStats.eventosHoje,
        estatisticasPorTipo: eventStats.estatisticasPorTipo,
        produtividade: eventStats.produtividade,
      },
    };
  }

  /**
   * Obter ranking de vendedores
   */
  async getVendedoresRanking(
    periodo: string = 'mensal',
    empresaId?: string,
    vendedorIdFiltro?: string,
  ): Promise<VendedorRanking[]> {
    const { dataInicio, dataFim } = this.getDateRange(periodo);
    const periodoAnterior = this.getPreviousDateRange(periodo, { dataInicio, dataFim });
    const dataInicioAnterior = periodoAnterior.dataInicio;
    const dataFimAnterior = periodoAnterior.dataFim;

    // Buscar todos os vendedores
    const vendedores = await this.userRepository.find({
      where: empresaId
        ? { role: UserRole.VENDEDOR, ativo: true, empresa_id: empresaId }
        : { role: UserRole.VENDEDOR, ativo: true },
    });

    const ranking: VendedorRanking[] = [];

    for (const vendedor of vendedores) {
      // Vendas do período
      const vendasAtual = await this.calculateFaturamento(
        dataInicio,
        dataFim,
        vendedor.id,
        undefined,
        empresaId,
      );
      const vendasAnterior = await this.calculateFaturamento(
        dataInicioAnterior,
        dataFimAnterior,
        vendedor.id,
        undefined,
        empresaId,
      );
      const variacao =
        vendasAnterior > 0 ? ((vendasAtual - vendasAnterior) / vendasAnterior) * 100 : 0;

      // Meta do vendedor (exemplo: 20% da meta total)
      const meta = this.getMeta(periodo) * 0.2;

      // Badges baseados na performance
      const badges = this.calculateBadges(vendasAtual, meta, variacao);

      // Cor baseada na performance
      const progressoMeta = (vendasAtual / meta) * 100;
      const cor = this.getVendedorCor(progressoMeta);

      ranking.push({
        id: vendedor.id,
        nome: vendedor.nome,
        vendas: vendasAtual,
        meta: meta,
        variacao: Number(variacao.toFixed(1)),
        posicao: 0, // Será definido após ordenação
        badges: badges,
        cor: cor,
      });
    }

    // Ordenar por vendas e definir posições
    ranking.sort((a, b) => b.vendas - a.vendas);
    ranking.forEach((vendedor, index) => {
      vendedor.posicao = index + 1;
    });

    if (vendedorIdFiltro) {
      return ranking.filter((vendedor) => vendedor.id === vendedorIdFiltro);
    }

    return ranking;
  }

  /**
   * Obter alertas inteligentes
   */
  async getAlertasInteligentes(
    periodo: string = 'mensal',
    empresaId?: string,
    precomputed?: {
      ranking?: VendedorRanking[];
      kpis?: DashboardKPIs;
    },
    vendedorId?: string,
  ): Promise<AlertaInteligente[]> {
    const alertas: AlertaInteligente[] = [];
    const agora = new Date();

    // Verificar metas em risco
    const ranking =
      precomputed?.ranking ??
      (await this.getVendedoresRanking(periodo, empresaId, vendedorId));
    const vendedoresEmRisco = ranking.filter((v) => v.vendas / v.meta < 0.7);

    for (const vendedor of vendedoresEmRisco) {
      alertas.push({
        id: `meta-risco-${vendedor.id}`,
        tipo: 'meta',
        severidade: 'alta',
        titulo: 'Meta em Risco!',
        descricao: `${vendedor.nome} está ${Math.round(100 - (vendedor.vendas / vendedor.meta) * 100)}% abaixo da meta mensal.`,
        valor: vendedor.meta - vendedor.vendas,
        acao: {
          texto: 'Ver Vendedor',
          url: `/vendedores/${vendedor.id}`,
        },
        timestamp: agora,
        lido: false,
      });
    }

    // Verificar propostas próximas do vencimento
    const propostas = await this.propostaRepository.find({
      where: {
        ...(empresaId ? { empresaId } : {}),
        ...(vendedorId ? { vendedor_id: vendedorId } : {}),
        status: 'enviada',
        dataVencimento: Between(agora, new Date(agora.getTime() + 3 * 24 * 60 * 60 * 1000)),
      },
      relations: ['vendedor'],
    });

    for (const proposta of propostas) {
      alertas.push({
        id: `prazo-${proposta.id}`,
        tipo: 'prazo',
        severidade: 'media',
        titulo: 'Proposta Vencendo!',
        descricao: `Proposta ${proposta.numero} para ${proposta.cliente?.nome} vence em breve.`,
        valor: proposta.total,
        dataLimite: proposta.dataVencimento?.toISOString().split('T')[0],
        acao: {
          texto: 'Ver Proposta',
          url: `/propostas/${proposta.id}`,
        },
        timestamp: agora,
        lido: false,
      });
    }

    // Verificar conquistas
    const kpis =
      precomputed?.kpis ?? (await this.getKPIs(periodo, vendedorId, undefined, empresaId));
    if (kpis.faturamentoTotal.valor >= kpis.faturamentoTotal.meta) {
      alertas.push({
        id: 'meta-superada',
        tipo: 'conquista',
        severidade: 'baixa',
        titulo: 'Meta Superada! 🎉',
        descricao: `Parabéns! A meta mensal de ${kpis.faturamentoTotal.meta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} foi superada!`,
        valor: kpis.faturamentoTotal.valor,
        timestamp: agora,
        lido: false,
      });
    }

    return alertas.sort((a, b) => {
      const severidadeOrder = { critica: 4, alta: 3, media: 2, baixa: 1 };
      return severidadeOrder[b.severidade] - severidadeOrder[a.severidade];
    });
  }

  // Métodos auxiliares privados
  private getDateRange(periodo: string): { dataInicio: Date; dataFim: Date } {
    const dataFim = new Date();
    const dataInicio = this.getRangeStart(periodo, dataFim);
    return { dataInicio, dataFim };
  }

  private getPreviousDateRange(
    periodo: string,
    currentRange: { dataInicio: Date; dataFim: Date },
  ): { dataInicio: Date; dataFim: Date } {
    const currentStart = currentRange.dataInicio;
    const previousEnd = new Date(currentStart.getTime() - 1);
    let previousStart: Date;

    switch (periodo) {
      case 'semanal':
        previousStart = new Date(previousEnd);
        previousStart.setDate(previousStart.getDate() - 6);
        previousStart.setHours(0, 0, 0, 0);
        break;
      case 'mensal':
        previousStart = new Date(currentStart);
        previousStart.setMonth(previousStart.getMonth() - 1);
        break;
      case 'trimestral':
        previousStart = new Date(currentStart);
        previousStart.setMonth(previousStart.getMonth() - 3);
        break;
      case 'semestral':
        previousStart = new Date(currentStart);
        previousStart.setMonth(previousStart.getMonth() - 6);
        break;
      case 'anual':
        previousStart = new Date(currentStart);
        previousStart.setFullYear(previousStart.getFullYear() - 1);
        break;
      default:
        previousStart = new Date(currentStart);
        previousStart.setMonth(previousStart.getMonth() - 1);
    }

    return { dataInicio: previousStart, dataFim: previousEnd };
  }

  private getRangeStart(periodo: string, referenceDate: Date): Date {
    switch (periodo) {
      case 'semanal': {
        const start = new Date(referenceDate);
        start.setDate(start.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        return start;
      }
      case 'mensal':
        return new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
      case 'trimestral': {
        const trimestre = Math.floor(referenceDate.getMonth() / 3);
        return new Date(referenceDate.getFullYear(), trimestre * 3, 1);
      }
      case 'semestral': {
        const semestre = Math.floor(referenceDate.getMonth() / 6);
        return new Date(referenceDate.getFullYear(), semestre * 6, 1);
      }
      case 'anual':
        return new Date(referenceDate.getFullYear(), 0, 1);
      default:
        return new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
    }
  }

  private getPeriodoLabel(periodo: string): string {
    switch (periodo) {
      case 'semanal':
        return 'vs semana anterior';
      case 'mensal':
        return 'vs mês anterior';
      case 'trimestral':
        return 'vs trimestre anterior';
      case 'semestral':
        return 'vs semestre anterior';
      case 'anual':
        return 'vs ano anterior';
      default:
        return 'vs período anterior';
    }
  }

  private getMeta(periodo: string): number {
    // Metas exemplo - em produção, viriam do banco
    switch (periodo) {
      case 'semanal':
        return 112500;
      case 'mensal':
        return 450000;
      case 'trimestral':
        return 1350000;
      case 'semestral':
        return 2700000;
      case 'anual':
        return 5400000;
      default:
        return 450000;
    }
  }

  private async calculateFaturamento(
    dataInicio: Date,
    dataFim: Date,
    vendedorId?: string,
    regiao?: string,
    empresaId?: string,
  ): Promise<number> {
    const query = this.propostaRepository
      .createQueryBuilder('proposta')
      .select('SUM(proposta.total)', 'total')
      .where('proposta.status::text IN (:...statusAprovada)', {
        statusAprovada: this.statusAprovadaAliases,
      })
      .andWhere('proposta.criadaEm BETWEEN :dataInicio AND :dataFim', { dataInicio, dataFim });

    if (empresaId) {
      query.andWhere('proposta.empresaId = :empresaId', { empresaId });
    }

    if (vendedorId) {
      query.andWhere('proposta.vendedor_id = :vendedorId', { vendedorId });
    }

    const result = await query.getRawOne();

    return Number(result?.total || 0);
  }

  private async calculateTicketMedio(
    dataInicio: Date,
    dataFim: Date,
    vendedorId?: string,
    regiao?: string,
    empresaId?: string,
  ): Promise<number> {
    const query = this.propostaRepository
      .createQueryBuilder('proposta')
      .select('AVG(proposta.total)', 'media')
      .where('proposta.status::text IN (:...statusAprovada)', {
        statusAprovada: this.statusAprovadaAliases,
      })
      .andWhere('proposta.criadaEm BETWEEN :dataInicio AND :dataFim', { dataInicio, dataFim });

    if (empresaId) {
      query.andWhere('proposta.empresaId = :empresaId', { empresaId });
    }

    if (vendedorId) {
      query.andWhere('proposta.vendedor_id = :vendedorId', { vendedorId });
    }

    const result = await query.getRawOne();

    return Number(result?.media || 0);
  }

  private async calculateVendasFechadas(
    dataInicio: Date,
    dataFim: Date,
    vendedorId?: string,
    regiao?: string,
    empresaId?: string,
  ): Promise<number> {
    const query = this.propostaRepository
      .createQueryBuilder('proposta')
      .where('proposta.criadaEm BETWEEN :dataInicio AND :dataFim', { dataInicio, dataFim })
      .andWhere('proposta.status::text IN (:...statusAprovada)', {
        statusAprovada: this.statusAprovadaAliases,
      });

    if (empresaId) {
      query.andWhere('proposta.empresaId = :empresaId', { empresaId });
    }

    if (vendedorId) {
      query.andWhere('proposta.vendedor_id = :vendedorId', { vendedorId });
    }

    return await query.getCount();
  }

  private async calculateEmNegociacao(
    vendedorId?: string,
    regiao?: string,
    empresaId?: string,
  ): Promise<{ valor: number; quantidade: number; propostas: string[] }> {
    const whereConditions: any = {
      status: 'enviada',
      ...(empresaId ? { empresaId } : {}),
    };

    if (vendedorId) {
      whereConditions.vendedor_id = vendedorId;
    }

    const propostas = await this.propostaRepository.find({ where: whereConditions });

    // Correção: validar e converter total para number, evitando valores quebrados
    const valor = propostas.reduce((acc, p) => {
      const total = parseFloat(p.total?.toString() || '0') || 0;
      return acc + total;
    }, 0);

    const quantidade = propostas.length;
    const propostasIds = propostas.slice(0, 5).map((p) => p.numero);

    return { valor, quantidade, propostas: propostasIds };
  }

  private async calculateNovosClientes(
    dataInicio: Date,
    dataFim: Date,
    regiao?: string,
    empresaId?: string,
  ): Promise<number> {
    const whereConditions: any = {
      created_at: Between(dataInicio, dataFim),
      ...(empresaId ? { empresaId } : {}),
    };

    return await this.clienteRepository.count({ where: whereConditions });
  }

  private async calculateLeadsQualificados(
    dataInicio: Date,
    dataFim: Date,
    vendedorId?: string,
    regiao?: string,
    empresaId?: string,
  ): Promise<number> {
    const whereConditions: any = {
      status: 'enviada',
      criadaEm: Between(dataInicio, dataFim),
      ...(empresaId ? { empresaId } : {}),
    };

    if (vendedorId) {
      whereConditions.vendedor_id = vendedorId;
    }

    return await this.propostaRepository.count({ where: whereConditions });
  }

  private async calculatePropostasEnviadas(
    dataInicio: Date,
    dataFim: Date,
    vendedorId?: string,
    regiao?: string,
    empresaId?: string,
  ): Promise<number> {
    const query = this.propostaRepository
      .createQueryBuilder('proposta')
      .select('SUM(proposta.total)', 'total')
      .where('proposta.status = :status', { status: 'enviada' })
      .andWhere('proposta.criadaEm BETWEEN :dataInicio AND :dataFim', { dataInicio, dataFim });

    if (empresaId) {
      query.andWhere('proposta.empresaId = :empresaId', { empresaId });
    }

    if (vendedorId) {
      query.andWhere('proposta.vendedor_id = :vendedorId', { vendedorId });
    }

    const result = await query.getRawOne();

    return Number(result?.total || 0);
  }

  private async calculateTaxaSucesso(
    dataInicio: Date,
    dataFim: Date,
    vendedorId?: string,
    regiao?: string,
    empresaId?: string,
  ): Promise<number> {
    const totalQuery = this.propostaRepository
      .createQueryBuilder('proposta')
      .where('proposta.criadaEm BETWEEN :dataInicio AND :dataFim', { dataInicio, dataFim });

    if (empresaId) {
      totalQuery.andWhere('proposta.empresaId = :empresaId', { empresaId });
    }

    if (vendedorId) {
      totalQuery.andWhere('proposta.vendedor_id = :vendedorId', { vendedorId });
    }

    const total = await totalQuery.getCount();
    const aprovadas = await totalQuery
      .clone()
      .andWhere('proposta.status::text IN (:...statusAprovada)', {
        statusAprovada: this.statusAprovadaAliases,
      })
      .getCount();

    return total > 0 ? (aprovadas / total) * 100 : 0;
  }

  private async calculateCicloMedio(
    dataInicio: Date,
    dataFim: Date,
    vendedorId?: string,
    regiao?: string,
    empresaId?: string,
  ): Promise<number> {
    const statusFinalizadas = [...this.statusAprovadaAliases, 'rejeitada', 'expirada'];
    const query = this.propostaRepository
      .createQueryBuilder('proposta')
      .select(
        'AVG(EXTRACT(EPOCH FROM (COALESCE(proposta.atualizadaEm, proposta.criadaEm) - proposta.criadaEm)) / 86400)',
        'dias',
      )
      .where('proposta.criadaEm BETWEEN :dataInicio AND :dataFim', { dataInicio, dataFim })
      .andWhere('proposta.status::text IN (:...statusFinalizadas)', {
        statusFinalizadas,
      });

    if (empresaId) {
      query.andWhere('proposta.empresaId = :empresaId', { empresaId });
    }

    if (vendedorId) {
      query.andWhere('proposta.vendedor_id = :vendedorId', { vendedorId });
    }

    const result = await query.getRawOne();
    return Number(result?.dias || 0);
  }

  private async calculateTempoEtapa(
    dataInicio: Date,
    dataFim: Date,
    vendedorId?: string,
    regiao?: string,
    empresaId?: string,
  ): Promise<number> {
    const query = this.propostaRepository
      .createQueryBuilder('proposta')
      .select('AVG(EXTRACT(EPOCH FROM (:dataFim - proposta.criadaEm)) / 86400)', 'dias')
      .where('proposta.criadaEm BETWEEN :dataInicio AND :dataFim', { dataInicio, dataFim })
      .andWhere('proposta.status::text IN (:...statusEmNegociacao)', {
        statusEmNegociacao: this.statusEmNegociacaoAliases,
      });

    if (empresaId) {
      query.andWhere('proposta.empresaId = :empresaId', { empresaId });
    }

    if (vendedorId) {
      query.andWhere('proposta.vendedor_id = :vendedorId', { vendedorId });
    }

    const result = await query.getRawOne();
    return Number(result?.dias || 0);
  }

  private async calculateFollowUpsPendentes(
    dataInicio: Date,
    dataFim: Date,
    vendedorId?: string,
    regiao?: string,
    empresaId?: string,
  ): Promise<number> {
    const whereConditions: any = {
      criadaEm: Between(dataInicio, dataFim),
      status: 'enviada',
      ...(empresaId ? { empresaId } : {}),
    };

    if (vendedorId) {
      whereConditions.vendedor_id = vendedorId;
    }

    return await this.propostaRepository.count({ where: whereConditions });
  }

  private calculateBadges(vendas: number, meta: number, variacao: number): string[] {
    const badges: string[] = [];
    const progressoMeta = (vendas / meta) * 100;

    if (progressoMeta >= 110) badges.push('top_performer');
    if (progressoMeta >= 100) badges.push('goal_crusher');
    if (variacao >= 50) badges.push('rising_star');
    if (variacao >= 0 && variacao <= 10) badges.push('consistent');

    return badges;
  }

  private getVendedorCor(progressoMeta: number): string {
    if (progressoMeta >= 100) return '#10B981'; // Verde
    if (progressoMeta >= 90) return '#3B82F6'; // Azul
    if (progressoMeta >= 70) return '#F59E0B'; // Amarelo
    return '#EF4444'; // Vermelho
  }

  async getChartsData(
    periodo: string = 'mensal',
    vendedorId?: string,
    regiao?: string,
    empresaId?: string,
  ): Promise<DashboardChartsData> {
    const { dataInicio, dataFim } = this.getDateRange(periodo);

    const whereConditions: any = {
      criadaEm: Between(dataInicio, dataFim),
      ...(empresaId ? { empresaId } : {}),
    };

    if (vendedorId) {
      whereConditions.vendedor_id = vendedorId;
    }

    const propostas = await this.propostaRepository.find({
      where: whereConditions,
      select: ['status', 'total', 'criadaEm'],
    });

    const metaAtual = await this.metasService.getMetaAtual(vendedorId, regiao, empresaId);
    const metaMensal = Number(metaAtual?.valor || this.getMeta('mensal'));

    const vendasMensais = this.buildVendasMensais(propostas, dataInicio, dataFim, metaMensal);
    const propostasPorStatus = this.buildPropostasPorStatus(propostas);
    const funilVendas = this.buildFunilVendas(propostas);

    let atividadesTimeline: DashboardChartsData['atividadesTimeline'] = [];
    try {
      atividadesTimeline = await this.buildAtividadesTimeline(
        dataInicio,
        dataFim,
        vendedorId,
        empresaId,
      );
    } catch {
      atividadesTimeline = [];
    }

    return {
      vendasMensais,
      propostasPorStatus,
      atividadesTimeline,
      funilVendas,
    };
  }

  private buildVendasMensais(
    propostas: Pick<PropostaEntity, 'status' | 'total' | 'criadaEm'>[],
    dataInicio: Date,
    dataFim: Date,
    metaMensal: number,
  ): DashboardChartsData['vendasMensais'] {
    const monthKeys = this.getMonthKeys(dataInicio, dataFim);
    const totals = new Map<string, number>(monthKeys.map((key) => [key, 0]));

    propostas.forEach((proposta) => {
      if (!this.isStatusAprovada(proposta.status)) return;
      const key = this.toMonthKey(proposta.criadaEm);
      const total = Number(proposta.total || 0);
      totals.set(key, (totals.get(key) || 0) + total);
    });

    return monthKeys.map((key) => ({
      mes: this.getMonthLabel(key),
      valor: Number((totals.get(key) || 0).toFixed(2)),
      meta: Number(metaMensal.toFixed(2)),
    }));
  }

  private buildPropostasPorStatus(
    propostas: Pick<PropostaEntity, 'status'>[],
  ): DashboardChartsData['propostasPorStatus'] {
    const statusConfig: Array<{ statuses: string[]; label: string; color: string }> = [
      { statuses: ['rascunho'], label: 'Rascunho', color: '#6B7280' },
      { statuses: ['enviada'], label: 'Enviada', color: '#3B82F6' },
      { statuses: ['visualizada'], label: 'Visualizada', color: '#06B6D4' },
      { statuses: this.statusAprovadaAliases, label: 'Aprovada', color: '#10B981' },
      { statuses: ['rejeitada'], label: 'Rejeitada', color: '#F59E0B' },
      { statuses: ['expirada'], label: 'Expirada', color: '#EF4444' },
    ];

    if (propostas.length === 0) {
      return [];
    }

    const counts = new Map<string, number>();
    propostas.forEach((proposta) => {
      counts.set(proposta.status, (counts.get(proposta.status) || 0) + 1);
    });

    const total = propostas.length;
    return statusConfig
      .map((config) => {
        const quantidade = config.statuses.reduce(
          (acc, status) => acc + (counts.get(status) || 0),
          0,
        );
        const percentual = total > 0 ? (quantidade / total) * 100 : 0;
        return {
          status: config.label,
          valor: Number(percentual.toFixed(1)),
          color: config.color,
        };
      })
      .filter((item) => item.valor > 0);
  }

  private buildFunilVendas(
    propostas: Pick<PropostaEntity, 'status' | 'total'>[],
  ): DashboardChartsData['funilVendas'] {
    const etapas: Array<{ etapa: string; statuses: string[] }> = [
      { etapa: 'Rascunho', statuses: ['rascunho'] },
      { etapa: 'Enviadas', statuses: this.statusEmNegociacaoAliases },
      { etapa: 'Aprovadas', statuses: this.statusAprovadaAliases },
      { etapa: 'Perdidas', statuses: ['rejeitada', 'expirada'] },
    ];

    return etapas
      .map(({ etapa, statuses }) => {
        const propostasEtapa = propostas.filter((proposta) => statuses.includes(proposta.status));
        const valor = propostasEtapa.reduce(
          (acc, proposta) => acc + Number(proposta.total || 0),
          0,
        );

        return {
          etapa,
          quantidade: propostasEtapa.length,
          valor: Number(valor.toFixed(2)),
        };
      })
      .filter((item) => item.quantidade > 0);
  }

  private async buildAtividadesTimeline(
    dataInicio: Date,
    dataFim: Date,
    vendedorId?: string,
    empresaId?: string,
  ): Promise<DashboardChartsData['atividadesTimeline']> {
    const monthKeys = this.getMonthKeys(dataInicio, dataFim);

    const timeline = await Promise.all(
      monthKeys.map(async (monthKey) => {
        const [year, month] = monthKey.split('-').map(Number);
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const stats = await this.eventosService.getEventStatsByPeriod(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0],
          vendedorId,
          empresaId,
        );

        const reunioes = Number(stats?.estatisticasPorTipo?.reuniao || 0);
        const ligacoes = Number(stats?.estatisticasPorTipo?.ligacao || 0);
        const followUps = Number(stats?.estatisticasPorTipo?.['follow-up'] || 0);
        const outros = Number(stats?.estatisticasPorTipo?.outro || 0);

        return {
          mes: this.getMonthLabel(monthKey),
          reunioes,
          ligacoes,
          emails: followUps + outros,
        };
      }),
    );

    return timeline;
  }

  private getMonthKeys(dataInicio: Date, dataFim: Date): string[] {
    const keys: string[] = [];
    const cursor = new Date(dataInicio.getFullYear(), dataInicio.getMonth(), 1);
    const end = new Date(dataFim.getFullYear(), dataFim.getMonth(), 1);

    while (cursor <= end) {
      keys.push(this.toMonthKey(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return keys;
  }

  private toMonthKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private getMonthLabel(monthKey: string): string {
    const monthNames = [
      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez',
    ];
    const [year, month] = monthKey.split('-').map(Number);
    const monthName = monthNames[Math.max(0, Math.min(11, month - 1))];
    return `${monthName}/${String(year).slice(-2)}`;
  }

  getPeriodosDisponiveis(): string[] {
    return ['semanal', 'mensal', 'trimestral', 'semestral', 'anual'];
  }

  getRegioesDisponiveis(): string[] {
    return ['Todas', 'Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'];
  }
}
