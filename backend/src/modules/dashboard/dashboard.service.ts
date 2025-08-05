import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Proposta as PropostaEntity } from '../propostas/proposta.entity';
import { User, UserRole } from '../users/user.entity';
import { Cliente } from '../clientes/cliente.entity';
import { Evento } from '../eventos/evento.entity';
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

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(PropostaEntity)
    private propostaRepository: Repository<PropostaEntity>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
    private metasService: MetasService,
    private eventosService: EventosService,
  ) { }

  /**
   * Obter KPIs principais do dashboard
   */
  async getKPIs(periodo: string = 'mensal', vendedorId?: string, regiao?: string, empresaId?: number): Promise<DashboardKPIs> {
    const { dataInicio, dataFim } = this.getDateRange(periodo);
    const periodoAnterior = this.getDateRange(this.getPeriodoAnterior(periodo));

    // Buscar meta atual para o vendedor/região específica
    const metaAtual = await this.metasService.getMetaAtual(
      vendedorId ? parseInt(vendedorId) : undefined,
      regiao
    );
    const valorMeta = metaAtual?.valor || 450000; // Meta padrão se não encontrar

    // Faturamento Total
    const faturamentoAtual = await this.calculateFaturamento(dataInicio, dataFim, vendedorId, regiao);
    const faturamentoAnterior = await this.calculateFaturamento(periodoAnterior.dataInicio, periodoAnterior.dataFim, vendedorId, regiao);
    const variacaoFaturamento = faturamentoAnterior > 0 ? ((faturamentoAtual - faturamentoAnterior) / faturamentoAnterior) * 100 : 0;

    // Ticket Médio
    const ticketMedioAtual = await this.calculateTicketMedio(dataInicio, dataFim, vendedorId, regiao);
    const ticketMedioAnterior = await this.calculateTicketMedio(periodoAnterior.dataInicio, periodoAnterior.dataFim, vendedorId, regiao);
    const variacaoTicketMedio = ticketMedioAnterior > 0 ? ((ticketMedioAtual - ticketMedioAnterior) / ticketMedioAnterior) * 100 : 0;

    // Vendas Fechadas
    const vendasFechadasAtual = await this.calculateVendasFechadas(dataInicio, dataFim, vendedorId, regiao);
    const vendasFechadasAnterior = await this.calculateVendasFechadas(periodoAnterior.dataInicio, periodoAnterior.dataFim, vendedorId, regiao);
    const variacaoVendasFechadas = vendasFechadasAnterior > 0 ? ((vendasFechadasAtual - vendasFechadasAnterior) / vendasFechadasAnterior) * 100 : 0;

    // Em Negociação
    const emNegociacao = await this.calculateEmNegociacao(vendedorId, regiao);

    // Novos Clientes
    const novosClientesAtual = await this.calculateNovosClientes(dataInicio, dataFim, regiao);
    const novosClientesAnterior = await this.calculateNovosClientes(periodoAnterior.dataInicio, periodoAnterior.dataFim, regiao);
    const variacaoNovosClientes = novosClientesAnterior > 0 ? ((novosClientesAtual - novosClientesAnterior) / novosClientesAnterior) * 100 : 0;

    // Leads Qualificados (propostas enviadas)
    const leadsAtual = await this.calculateLeadsQualificados(dataInicio, dataFim, vendedorId, regiao);
    const leadsAnterior = await this.calculateLeadsQualificados(periodoAnterior.dataInicio, periodoAnterior.dataFim, vendedorId, regiao);
    const variacaoLeads = leadsAnterior > 0 ? ((leadsAtual - leadsAnterior) / leadsAnterior) * 100 : 0;

    // Propostas Enviadas (valor)
    const propostasEnviadasAtual = await this.calculatePropostasEnviadas(dataInicio, dataFim, vendedorId, regiao);
    const propostasEnviadasAnterior = await this.calculatePropostasEnviadas(periodoAnterior.dataInicio, periodoAnterior.dataFim, vendedorId, regiao);
    const variacaoPropostasEnviadas = propostasEnviadasAnterior > 0 ? ((propostasEnviadasAtual - propostasEnviadasAnterior) / propostasEnviadasAnterior) * 100 : 0;

    // Taxa de Sucesso
    const taxaSucessoAtual = await this.calculateTaxaSucesso(dataInicio, dataFim, vendedorId, regiao);
    const taxaSucessoAnterior = await this.calculateTaxaSucesso(periodoAnterior.dataInicio, periodoAnterior.dataFim, vendedorId, regiao);
    const variacaoTaxaSucesso = taxaSucessoAnterior > 0 ? taxaSucessoAtual - taxaSucessoAnterior : 0;

    // Estatísticas da Agenda - filtrar por empresa do usuário logado
    // empresaId deve ser string UUID, não number
    const empresaIdString = empresaId ? empresaId.toString() : undefined;
    const eventStats = await this.eventosService.getEventStatsByPeriod(
      dataInicio.toISOString().split('T')[0],
      dataFim.toISOString().split('T')[0],
      vendedorId,
      empresaIdString
    );

    return {
      faturamentoTotal: {
        valor: faturamentoAtual,
        meta: valorMeta, // Usando a meta obtida dinamicamente
        variacao: Number(variacaoFaturamento.toFixed(1)),
        periodo: this.getPeriodoLabel(periodo)
      },
      ticketMedio: {
        valor: ticketMedioAtual,
        variacao: Number(variacaoTicketMedio.toFixed(1)),
        periodo: this.getPeriodoLabel(periodo)
      },
      vendasFechadas: {
        quantidade: vendasFechadasAtual,
        variacao: Number(variacaoVendasFechadas.toFixed(1)),
        periodo: this.getPeriodoLabel(periodo)
      },
      emNegociacao: {
        valor: emNegociacao.valor,
        quantidade: emNegociacao.quantidade,
        propostas: emNegociacao.propostas
      },
      novosClientesMes: {
        quantidade: novosClientesAtual,
        variacao: Number(variacaoNovosClientes.toFixed(1))
      },
      leadsQualificados: {
        quantidade: leadsAtual,
        variacao: Number(variacaoLeads.toFixed(1))
      },
      propostasEnviadas: {
        valor: propostasEnviadasAtual,
        variacao: Number(variacaoPropostasEnviadas.toFixed(1))
      },
      taxaSucessoGeral: {
        percentual: Number(taxaSucessoAtual.toFixed(1)),
        variacao: Number(variacaoTaxaSucesso.toFixed(1))
      },
      agenda: {
        totalEventos: eventStats.totalEventos,
        eventosConcluidos: eventStats.eventosConcluidos,
        proximosEventos: eventStats.proximosEventos,
        eventosHoje: eventStats.eventosHoje,
        estatisticasPorTipo: eventStats.estatisticasPorTipo,
        produtividade: eventStats.produtividade
      }
    };
  }

  /**
   * Obter ranking de vendedores
   */
  async getVendedoresRanking(periodo: string = 'mensal'): Promise<VendedorRanking[]> {
    const { dataInicio, dataFim } = this.getDateRange(periodo);
    const periodoAnterior = this.getDateRange(this.getPeriodoAnterior(periodo));
    const dataInicioAnterior = periodoAnterior.dataInicio;
    const dataFimAnterior = periodoAnterior.dataFim;

    // Buscar todos os vendedores
    const vendedores = await this.userRepository.find({
      where: { role: UserRole.VENDEDOR, ativo: true }
    });

    const ranking: VendedorRanking[] = [];

    for (const vendedor of vendedores) {
      // Vendas do período
      const vendasAtual = await this.calculateFaturamento(dataInicio, dataFim, vendedor.id);
      const vendasAnterior = await this.calculateFaturamento(dataInicioAnterior, dataFimAnterior, vendedor.id);
      const variacao = vendasAnterior > 0 ? ((vendasAtual - vendasAnterior) / vendasAnterior) * 100 : 0;

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
        cor: cor
      });
    }

    // Ordenar por vendas e definir posições
    ranking.sort((a, b) => b.vendas - a.vendas);
    ranking.forEach((vendedor, index) => {
      vendedor.posicao = index + 1;
    });

    return ranking;
  }

  /**
   * Obter alertas inteligentes
   */
  async getAlertasInteligentes(): Promise<AlertaInteligente[]> {
    const alertas: AlertaInteligente[] = [];
    const agora = new Date();

    // Verificar metas em risco
    const ranking = await this.getVendedoresRanking('mensal');
    const vendedoresEmRisco = ranking.filter(v => (v.vendas / v.meta) < 0.7);

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
          url: `/vendedores/${vendedor.id}`
        },
        timestamp: agora,
        lido: false
      });
    }

    // Verificar propostas próximas do vencimento
    const propostas = await this.propostaRepository.find({
      where: {
        status: 'enviada',
        dataVencimento: Between(
          agora,
          new Date(agora.getTime() + 3 * 24 * 60 * 60 * 1000)
        )
      },
      relations: ['vendedor']
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
          url: `/propostas/${proposta.id}`
        },
        timestamp: agora,
        lido: false
      });
    }

    // Verificar conquistas
    const kpis = await this.getKPIs('mensal');
    if (kpis.faturamentoTotal.valor >= kpis.faturamentoTotal.meta) {
      alertas.push({
        id: 'meta-superada',
        tipo: 'conquista',
        severidade: 'baixa',
        titulo: 'Meta Superada! 🎉',
        descricao: `Parabéns! A meta mensal de ${kpis.faturamentoTotal.meta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} foi superada!`,
        valor: kpis.faturamentoTotal.valor,
        timestamp: agora,
        lido: false
      });
    }

    return alertas.sort((a, b) => {
      const severidadeOrder = { critica: 4, alta: 3, media: 2, baixa: 1 };
      return severidadeOrder[b.severidade] - severidadeOrder[a.severidade];
    });
  }

  // Métodos auxiliares privados
  private getDateRange(periodo: string): { dataInicio: Date; dataFim: Date } {
    const agora = new Date();
    let dataInicio: Date;
    let dataFim: Date = new Date(agora);

    switch (periodo) {
      case 'mensal':
        dataInicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
        break;
      case 'trimestral':
        const trimestre = Math.floor(agora.getMonth() / 3);
        dataInicio = new Date(agora.getFullYear(), trimestre * 3, 1);
        break;
      case 'semestral':
        const semestre = Math.floor(agora.getMonth() / 6);
        dataInicio = new Date(agora.getFullYear(), semestre * 6, 1);
        break;
      case 'anual':
        dataInicio = new Date(agora.getFullYear(), 0, 1);
        break;
      default:
        dataInicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
    }

    return { dataInicio, dataFim };
  }

  private getPeriodoAnterior(periodo: string): string {
    switch (periodo) {
      case 'mensal':
        return 'mensal_anterior';
      case 'trimestral':
        return 'trimestral_anterior';
      case 'semestral':
        return 'semestral_anterior';
      case 'anual':
        return 'anual_anterior';
      default:
        return 'mensal_anterior';
    }
  }

  private getPeriodoLabel(periodo: string): string {
    switch (periodo) {
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

  private async calculateFaturamento(dataInicio: Date, dataFim: Date, vendedorId?: string, regiao?: string): Promise<number> {
    const whereConditions: any = {
      status: 'aprovada',
      criadaEm: Between(dataInicio.toISOString(), dataFim.toISOString())
    };

    if (vendedorId) {
      whereConditions.vendedor_id = vendedorId;
    }

    const result = await this.propostaRepository
      .createQueryBuilder('proposta')
      .select('SUM(proposta.total)', 'total')
      .where(whereConditions)
      .getRawOne();

    return Number(result?.total || 0);
  }

  private async calculateTicketMedio(dataInicio: Date, dataFim: Date, vendedorId?: string, regiao?: string): Promise<number> {
    const whereConditions: any = {
      status: 'aprovada',
      criadaEm: Between(dataInicio.toISOString(), dataFim.toISOString())
    };

    if (vendedorId) {
      whereConditions.vendedor_id = vendedorId;
    }

    const result = await this.propostaRepository
      .createQueryBuilder('proposta')
      .select('AVG(proposta.total)', 'media')
      .where(whereConditions)
      .getRawOne();

    return Number(result?.media || 0);
  }

  private async calculateVendasFechadas(dataInicio: Date, dataFim: Date, vendedorId?: string, regiao?: string): Promise<number> {
    const whereConditions: any = {
      status: 'aprovada',
      criadaEm: Between(dataInicio.toISOString(), dataFim.toISOString())
    };

    if (vendedorId) {
      whereConditions.vendedor_id = vendedorId;
    }

    return await this.propostaRepository.count({ where: whereConditions });
  }

  private async calculateEmNegociacao(vendedorId?: string, regiao?: string): Promise<{ valor: number; quantidade: number; propostas: string[] }> {
    const whereConditions: any = {
      status: 'enviada'
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
    const propostasIds = propostas.slice(0, 5).map(p => p.numero);

    return { valor, quantidade, propostas: propostasIds };
  }

  private async calculateNovosClientes(dataInicio: Date, dataFim: Date, regiao?: string): Promise<number> {
    const whereConditions: any = {
      created_at: Between(dataInicio.toISOString(), dataFim.toISOString())
    };

    return await this.clienteRepository.count({ where: whereConditions });
  }

  private async calculateLeadsQualificados(dataInicio: Date, dataFim: Date, vendedorId?: string, regiao?: string): Promise<number> {
    const whereConditions: any = {
      status: 'enviada',
      criadaEm: Between(dataInicio.toISOString(), dataFim.toISOString())
    };

    if (vendedorId) {
      whereConditions.vendedor_id = vendedorId;
    }

    return await this.propostaRepository.count({ where: whereConditions });
  }

  private async calculatePropostasEnviadas(dataInicio: Date, dataFim: Date, vendedorId?: string, regiao?: string): Promise<number> {
    const whereConditions: any = {
      status: 'enviada',
      criadaEm: Between(dataInicio.toISOString(), dataFim.toISOString())
    };

    if (vendedorId) {
      whereConditions.vendedor_id = vendedorId;
    }

    const result = await this.propostaRepository
      .createQueryBuilder('proposta')
      .select('SUM(proposta.total)', 'total')
      .where(whereConditions)
      .getRawOne();

    return Number(result?.total || 0);
  }

  private async calculateTaxaSucesso(dataInicio: Date, dataFim: Date, vendedorId?: string, regiao?: string): Promise<number> {
    const whereConditionsTotal: any = {
      criadaEm: Between(dataInicio.toISOString(), dataFim.toISOString())
    };

    const whereConditionsAprovadas: any = {
      status: 'aprovada',
      criadaEm: Between(dataInicio.toISOString(), dataFim.toISOString())
    };

    if (vendedorId) {
      whereConditionsTotal.vendedorId = vendedorId;
      whereConditionsAprovadas.vendedorId = vendedorId;
    }

    const total = await this.propostaRepository.count({ where: whereConditionsTotal });
    const aprovadas = await this.propostaRepository.count({ where: whereConditionsAprovadas });

    return total > 0 ? (aprovadas / total) * 100 : 0;
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
    if (progressoMeta >= 90) return '#3B82F6';  // Azul
    if (progressoMeta >= 70) return '#F59E0B';  // Amarelo
    return '#EF4444'; // Vermelho
  }
}
