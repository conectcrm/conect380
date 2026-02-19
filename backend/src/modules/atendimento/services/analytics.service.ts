import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Ticket, StatusTicket } from '../entities/ticket.entity';
import { Mensagem } from '../entities/mensagem.entity';
import { User } from '../../users/user.entity';
import { Canal } from '../entities/canal.entity';

export interface DashboardMetricsDto {
  empresaId: string;
  periodo: string;
  dataInicio?: Date;
  dataFim?: Date;
}

export interface DesempenhoAtendentesDto {
  empresaId: string;
  periodo: string;
  limite: number;
}

export interface EstatisticasCanaisDto {
  empresaId: string;
  periodo: string;
}

export interface TendenciasDto {
  empresaId: string;
  metrica: string;
  periodo: string;
  granularidade: string;
}

interface DailyMetricsAccumulator {
  data: string;
  tickets: number;
  respostaTotalMinutos: number;
  respostaCount: number;
  resolvidosTotal: number;
  resolvidosSla: number;
}

/**
 * Service para Analytics e Dashboard de Atendimento
 * Calcula métricas agregadas, estatísticas e tendências
 *
 * @author ConectCRM
 * @date 2025-11-18
 */
@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(Mensagem)
    private readonly mensagemRepository: Repository<Mensagem>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Canal)
    private readonly canalRepository: Repository<Canal>,
  ) {}

  /**
   * Calcula período de datas baseado no filtro
   */
  private calcularPeriodo(periodo: string): { dataInicio: Date; dataFim: Date } {
    const dataFim = new Date();
    const dataInicio = new Date();

    switch (periodo) {
      case '7d':
        dataInicio.setDate(dataInicio.getDate() - 7);
        break;
      case '30d':
        dataInicio.setDate(dataInicio.getDate() - 30);
        break;
      case '90d':
        dataInicio.setDate(dataInicio.getDate() - 90);
        break;
      default:
        dataInicio.setDate(dataInicio.getDate() - 7);
    }

    return { dataInicio, dataFim };
  }

  private toDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  /**
   * Proxy deterministico de satisfacao (1..5) enquanto nao existe tabela de avaliacao.
   * Baseado em tempo de resposta (40%) e SLA (60%).
   */
  private calcularSatisfacaoProxy(
    tempoMedioRespostaMinutos: number,
    slaAtingidoPercentual: number,
  ): number {
    const respostaNormalizada = this.clamp(1 - tempoMedioRespostaMinutos / 120, 0, 1);
    const slaNormalizado = this.clamp(slaAtingidoPercentual / 100, 0, 1);

    const score = 1 + (respostaNormalizada * 0.4 + slaNormalizado * 0.6) * 4;
    return parseFloat(score.toFixed(1));
  }

  private construirAcumuladoresDiarios(
    dataInicio: Date,
    dataFim: Date,
  ): Map<string, DailyMetricsAccumulator> {
    const buckets = new Map<string, DailyMetricsAccumulator>();

    const cursor = new Date(dataInicio);
    cursor.setHours(0, 0, 0, 0);

    const fim = new Date(dataFim);
    fim.setHours(23, 59, 59, 999);

    while (cursor <= fim) {
      const key = this.toDateKey(cursor);
      buckets.set(key, {
        data: key,
        tickets: 0,
        respostaTotalMinutos: 0,
        respostaCount: 0,
        resolvidosTotal: 0,
        resolvidosSla: 0,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    return buckets;
  }

  /**
   * Retorna métricas principais do dashboard
   */
  async getDashboardMetrics(params: DashboardMetricsDto) {
    this.logger.log(`📊 Calculando dashboard metrics para empresa ${params.empresaId}`);

    const { dataInicio, dataFim } =
      params.periodo === 'custom' && params.dataInicio && params.dataFim
        ? { dataInicio: params.dataInicio, dataFim: params.dataFim }
        : this.calcularPeriodo(params.periodo);

    try {
      // Buscar tickets do período
      const tickets = await this.ticketRepository.find({
        where: {
          empresaId: params.empresaId,
          createdAt: Between(dataInicio, dataFim),
        },
      });

      // Métricas básicas
      const ticketsAbertos = tickets.filter((t) =>
        [
          StatusTicket.FILA,
          StatusTicket.AGUARDANDO_CLIENTE,
          StatusTicket.AGUARDANDO_INTERNO,
          StatusTicket.EM_ATENDIMENTO,
        ].includes(t.status as StatusTicket),
      ).length;

      const ticketsResolvidos = tickets.filter(
        (t) => t.status === StatusTicket.CONCLUIDO || t.status === StatusTicket.ENCERRADO,
      ).length;

      const ticketsPendentes = tickets.filter(
        (t) => t.status === StatusTicket.AGUARDANDO_CLIENTE,
      ).length;

      // Tempo médio de primeira resposta (em minutos)
      let tempoMedioResposta = 0;
      const ticketsComResposta = tickets.filter(
        (t) => t.data_primeira_resposta !== null && t.data_primeira_resposta !== undefined,
      );

      if (ticketsComResposta.length > 0) {
        const temposResposta = ticketsComResposta
          .map((ticket) => {
            if (ticket.data_abertura && ticket.data_primeira_resposta) {
              const diff = ticket.data_primeira_resposta.getTime() - ticket.data_abertura.getTime();
              return diff / (1000 * 60); // Converter para minutos
            }
            return 0;
          })
          .filter((t) => t > 0);

        tempoMedioResposta =
          temposResposta.length > 0
            ? temposResposta.reduce((acc, val) => acc + val, 0) / temposResposta.length
            : 0;
      }

      // Tempo médio de resolução (em horas)
      let tempoMedioResolucao = 0;
      const ticketsResolvidosComTempo = tickets.filter(
        (t) =>
          (t.status === StatusTicket.CONCLUIDO || t.status === StatusTicket.ENCERRADO) &&
          t.data_fechamento,
      );

      if (ticketsResolvidosComTempo.length > 0) {
        const temposResolucao = ticketsResolvidosComTempo.map((ticket) => {
          const diff = ticket.data_fechamento!.getTime() - ticket.createdAt.getTime();
          return diff / (1000 * 60 * 60); // Converter para horas
        });

        tempoMedioResolucao =
          temposResolucao.reduce((acc, val) => acc + val, 0) / temposResolucao.length;
      }

      // SLA atingido (percentual) - simplificado: tickets resolvidos dentro de 24h
      let slaAtingido = 0;
      if (ticketsResolvidosComTempo.length > 0) {
        const ticketsDentroSLA = ticketsResolvidosComTempo.filter((ticket) => {
          const diff = ticket.data_fechamento!.getTime() - ticket.createdAt.getTime();
          const horas = diff / (1000 * 60 * 60);
          return horas <= 24; // SLA padrão: 24 horas
        });

        slaAtingido = (ticketsDentroSLA.length / ticketsResolvidosComTempo.length) * 100;
      }

      // Proxy determinístico de satisfação enquanto não há tabela de avaliação.
      const satisfacaoCliente = this.calcularSatisfacaoProxy(tempoMedioResposta, slaAtingido);

      // Tendências - dados diários para gráficos
      const tendenciaTickets = await this.calcularTendenciaDiaria(
        params.empresaId,
        dataInicio,
        dataFim,
      );

      this.logger.log(`✅ Dashboard metrics calculadas: ${tickets.length} tickets analisados`);

      return {
        ticketsAbertos,
        ticketsResolvidos,
        ticketsPendentes,
        ticketsTotal: tickets.length,
        tempoMedioResposta: Math.round(tempoMedioResposta),
        tempoMedioResolucao: parseFloat(tempoMedioResolucao.toFixed(1)),
        slaAtingido: parseFloat(slaAtingido.toFixed(1)),
        satisfacaoCliente,
        tendencia: {
          tickets: tendenciaTickets,
        },
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao calcular dashboard metrics: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Calcula tendência diária de tickets
   */
  private async calcularTendenciaDiaria(empresaId: string, dataInicio: Date, dataFim: Date) {
    const tickets = await this.ticketRepository.find({
      where: {
        empresaId,
        createdAt: Between(dataInicio, dataFim),
      },
      select: ['createdAt'],
    });

    // Agrupar por dia
    const ticketsPorDia = new Map<string, number>();

    tickets.forEach((ticket) => {
      const dia = ticket.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
      ticketsPorDia.set(dia, (ticketsPorDia.get(dia) || 0) + 1);
    });

    // Converter para array ordenado
    return Array.from(ticketsPorDia.entries())
      .map(([data, valor]) => ({ data, valor }))
      .sort((a, b) => a.data.localeCompare(b.data));
  }

  /**
   * Retorna desempenho por atendente
   */
  async getDesempenhoAtendentes(params: DesempenhoAtendentesDto) {
    this.logger.log(`Calculando desempenho de atendentes para empresa ${params.empresaId}`);

    const { dataInicio, dataFim } = this.calcularPeriodo(params.periodo);

    try {
      const tickets = await this.ticketRepository.find({
        where: {
          empresaId: params.empresaId,
          createdAt: Between(dataInicio, dataFim),
        },
      });

      const atendenteIds = Array.from(
        new Set(
          tickets
            .map((ticket) => ticket.atendenteId)
            .filter((atendenteId): atendenteId is string => Boolean(atendenteId)),
        ),
      );

      const atendentes = atendenteIds.length
        ? await this.userRepository.find({
            where: {
              empresa_id: params.empresaId,
              id: In(atendenteIds),
            },
            select: ['id', 'nome'],
          })
        : [];

      const nomesAtendentes = new Map(
        atendentes.map((atendente) => [atendente.id, atendente.nome]),
      );

      const desempenhoPorAtendente = new Map<
        string,
        {
          atendenteId: string;
          nome: string;
          ticketsAtendidos: number;
          temposResposta: number[];
          ticketsResolvidosSLA: number;
          ticketsResolvidosTotal: number;
        }
      >();

      tickets.forEach((ticket) => {
        if (!ticket.atendenteId) return;

        const atendenteId = ticket.atendenteId;
        if (!desempenhoPorAtendente.has(atendenteId)) {
          desempenhoPorAtendente.set(atendenteId, {
            atendenteId,
            nome: nomesAtendentes.get(atendenteId) || `Atendente ${atendenteId.substring(0, 8)}`,
            ticketsAtendidos: 0,
            temposResposta: [],
            ticketsResolvidosSLA: 0,
            ticketsResolvidosTotal: 0,
          });
        }

        const desempenho = desempenhoPorAtendente.get(atendenteId)!;
        desempenho.ticketsAtendidos++;

        if (ticket.data_primeira_resposta && ticket.data_abertura) {
          const diff = ticket.data_primeira_resposta.getTime() - ticket.data_abertura.getTime();
          desempenho.temposResposta.push(diff / (1000 * 60));
        }

        if (ticket.status === StatusTicket.CONCLUIDO || ticket.status === StatusTicket.ENCERRADO) {
          desempenho.ticketsResolvidosTotal++;

          if (ticket.data_fechamento) {
            const diff = ticket.data_fechamento.getTime() - ticket.createdAt.getTime();
            const horas = diff / (1000 * 60 * 60);
            if (horas <= 24) {
              desempenho.ticketsResolvidosSLA++;
            }
          }
        }
      });

      const resultado = Array.from(desempenhoPorAtendente.values())
        .map((desempenho) => {
          const tempoMedioResposta =
            desempenho.temposResposta.length > 0
              ? Math.round(
                  desempenho.temposResposta.reduce((a, b) => a + b, 0) /
                    desempenho.temposResposta.length,
                )
              : 0;

          const slaAtingido =
            desempenho.ticketsResolvidosTotal > 0
              ? parseFloat(
                  (
                    (desempenho.ticketsResolvidosSLA / desempenho.ticketsResolvidosTotal) *
                    100
                  ).toFixed(1),
                )
              : 0;

          return {
            atendenteId: desempenho.atendenteId,
            nome: desempenho.nome,
            ticketsAtendidos: desempenho.ticketsAtendidos,
            tempoMedioResposta,
            satisfacaoMedia: this.calcularSatisfacaoProxy(tempoMedioResposta, slaAtingido),
            slaAtingido,
          };
        })
        .sort((a, b) => b.ticketsAtendidos - a.ticketsAtendidos)
        .slice(0, params.limite);

      this.logger.log(`Desempenho de ${resultado.length} atendentes calculado`);
      return resultado;
    } catch (error) {
      this.logger.error(`Erro ao calcular desempenho de atendentes: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Retorna estatisticas por canal
   */
  async getEstatisticasCanais(params: EstatisticasCanaisDto) {
    this.logger.log(`📱 Calculando estatísticas de canais para empresa ${params.empresaId}`);

    const { dataInicio, dataFim } = this.calcularPeriodo(params.periodo);

    try {
      // Buscar canais da empresa
      const canais = await this.canalRepository.find({
        where: { empresaId: params.empresaId },
      });

      const estatisticas = await Promise.all(
        canais.map(async (canal) => {
          const tickets = await this.ticketRepository.find({
            where: {
              empresaId: params.empresaId,
              canalId: canal.id,
              createdAt: Between(dataInicio, dataFim),
            },
          });

          const ticketsAbertos = tickets.filter((t) =>
            [
              StatusTicket.FILA,
              StatusTicket.AGUARDANDO_CLIENTE,
              StatusTicket.AGUARDANDO_INTERNO,
              StatusTicket.EM_ATENDIMENTO,
            ].includes(t.status as StatusTicket),
          ).length;

          const ticketsResolvidos = tickets.filter(
            (t) => t.status === StatusTicket.CONCLUIDO || t.status === StatusTicket.ENCERRADO,
          ).length;

          // Tempo médio de resposta (usando data_primeira_resposta)
          const ticketsComResposta = tickets.filter(
            (t) => t.data_primeira_resposta && t.data_abertura,
          );
          let tempoMedioResposta = 0;

          if (ticketsComResposta.length > 0) {
            const temposResposta = ticketsComResposta
              .map((ticket) => {
                if (ticket.data_primeira_resposta && ticket.data_abertura) {
                  const diff =
                    ticket.data_primeira_resposta.getTime() - ticket.data_abertura.getTime();
                  return diff / (1000 * 60); // Minutos
                }
                return 0;
              })
              .filter((t) => t > 0);

            if (temposResposta.length > 0) {
              tempoMedioResposta =
                temposResposta.reduce((acc, val) => acc + val, 0) / temposResposta.length;
            }
          }

          return {
            canalId: canal.id,
            nome: canal.nome,
            tipo: canal.tipo,
            ticketsTotal: tickets.length,
            ticketsAbertos,
            ticketsResolvidos,
            tempoMedioResposta: Math.round(tempoMedioResposta),
          };
        }),
      );

      this.logger.log(`✅ Estatísticas de ${estatisticas.length} canais calculadas`);
      return estatisticas;
    } catch (error) {
      this.logger.error(
        `❌ Erro ao calcular estatísticas de canais: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Retorna tendências ao longo do tempo
   */
  async getTendencias(params: TendenciasDto) {
    this.logger.log(`Calculando tendencias de ${params.metrica} para empresa ${params.empresaId}`);

    const { dataInicio, dataFim } = this.calcularPeriodo(params.periodo);

    try {
      const tickets = await this.ticketRepository.find({
        where: {
          empresaId: params.empresaId,
          createdAt: Between(dataInicio, dataFim),
        },
        select: [
          'createdAt',
          'data_abertura',
          'data_primeira_resposta',
          'data_fechamento',
          'status',
        ],
      });

      const buckets = this.construirAcumuladoresDiarios(dataInicio, dataFim);

      tickets.forEach((ticket) => {
        const key = this.toDateKey(ticket.createdAt);
        const bucket = buckets.get(key);
        if (!bucket) return;

        bucket.tickets += 1;

        if (ticket.data_primeira_resposta && ticket.data_abertura) {
          const diff = ticket.data_primeira_resposta.getTime() - ticket.data_abertura.getTime();
          if (diff > 0) {
            bucket.respostaTotalMinutos += diff / (1000 * 60);
            bucket.respostaCount += 1;
          }
        }

        if (ticket.status === StatusTicket.CONCLUIDO || ticket.status === StatusTicket.ENCERRADO) {
          bucket.resolvidosTotal += 1;

          if (ticket.data_fechamento) {
            const diff = ticket.data_fechamento.getTime() - ticket.createdAt.getTime();
            const horas = diff / (1000 * 60 * 60);
            if (horas <= 24) {
              bucket.resolvidosSla += 1;
            }
          }
        }
      });

      return Array.from(buckets.values()).map((bucket) => {
        const tempoMedioResposta =
          bucket.respostaCount > 0 ? bucket.respostaTotalMinutos / bucket.respostaCount : 0;

        const slaAtingido =
          bucket.resolvidosTotal > 0 ? (bucket.resolvidosSla / bucket.resolvidosTotal) * 100 : 0;

        let valor = 0;
        switch (params.metrica) {
          case 'tickets':
            valor = bucket.tickets;
            break;
          case 'tempo_resposta':
            valor = tempoMedioResposta;
            break;
          case 'sla':
            valor = slaAtingido;
            break;
          case 'satisfacao':
            valor = this.calcularSatisfacaoProxy(tempoMedioResposta, slaAtingido);
            break;
          default:
            valor = 0;
            break;
        }

        return {
          data: bucket.data,
          valor: parseFloat(valor.toFixed(1)),
        };
      });
    } catch (error) {
      this.logger.error(`Erro ao calcular tendencias: ${error.message}`, error.stack);
      throw error;
    }
  }
}
