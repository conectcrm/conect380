import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SlaConfig } from '../entities/sla-config.entity';
import { SlaEventLog } from '../entities/sla-event-log.entity';
import { CreateSlaConfigDto } from '../dto/sla/create-sla-config.dto';
import { UpdateSlaConfigDto } from '../dto/sla/update-sla-config.dto';
import { SlaMetricasFilterDto } from '../dto/sla/sla-metricas-filter.dto';

export interface SlaCalculoResult {
  ticketId: string;
  prioridade: string;
  canal: string;
  slaConfigId: string;
  tempoDecorridoMinutos: number;
  tempoLimiteMinutos: number;
  percentualUsado: number;
  status: 'cumprido' | 'em_risco' | 'violado';
  tempoRestanteMinutos: number;
  dataLimite: Date;
}

export interface SlaMetricas {
  totalTickets: number;
  ticketsCumpridos: number;
  ticketsEmRisco: number;
  ticketsViolados: number;
  percentualCumprimento: number;
  tempoMedioResposta: number;
  tempoMedioResolucao: number;
  violacoesPorPrioridade: {
    baixa: number;
    normal: number;
    alta: number;
    urgente: number;
  };
  violacoesPorCanal: Record<string, number>;
}

@Injectable()
export class SlaService {
  constructor(
    @InjectRepository(SlaConfig)
    private readonly slaConfigRepository: Repository<SlaConfig>,
    @InjectRepository(SlaEventLog)
    private readonly slaEventLogRepository: Repository<SlaEventLog>,
  ) {}

  private ensureEmpresaId(empresaId?: string): string {
    const normalized = typeof empresaId === 'string' ? empresaId.trim() : '';
    if (!normalized) {
      throw new BadRequestException('empresaId é obrigatório para operações de SLA');
    }
    return normalized;
  }

  // ==================== CRUD DE CONFIGURAÇÕES ====================

  async criar(dto: CreateSlaConfigDto, empresaId: string): Promise<SlaConfig> {
    try {
      const tenantId = this.ensureEmpresaId(empresaId);

      // Validar que tempo de resposta < tempo de resolução
      if (dto.tempoRespostaMinutos >= dto.tempoResolucaoMinutos) {
        throw new BadRequestException('Tempo de resposta deve ser menor que tempo de resolução');
      }

      // Verificar se já existe config para essa prioridade + canal
      const existe = await this.slaConfigRepository.findOne({
        where: {
          empresaId: tenantId,
          prioridade: dto.prioridade,
          canal: dto.canal || null,
          ativo: true,
        },
      });

      if (existe) {
        throw new BadRequestException(
          `Já existe uma configuração ativa para prioridade "${dto.prioridade}" e canal "${dto.canal || 'todos'}"`,
        );
      }

      const config = this.slaConfigRepository.create({
        ...dto,
        empresaId: tenantId,
      });

      const saved = await this.slaConfigRepository.save(config);
      return saved;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao criar configuração de SLA', error.message);
    }
  }

  async listar(empresaId: string, apenasAtivas: boolean = true): Promise<SlaConfig[]> {
    try {
      const tenantId = this.ensureEmpresaId(empresaId);
      const where: any = { empresaId: tenantId };
      if (apenasAtivas) {
        where.ativo = true;
      }

      return await this.slaConfigRepository.find({
        where,
        order: {
          prioridade: 'ASC',
          tempoRespostaMinutos: 'ASC',
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Erro ao listar configurações de SLA', error.message);
    }
  }

  async buscarPorId(id: string, empresaId: string): Promise<SlaConfig> {
    try {
      const tenantId = this.ensureEmpresaId(empresaId);
      const config = await this.slaConfigRepository.findOne({
        where: { id, empresaId: tenantId },
      });

      if (!config) {
        throw new NotFoundException('Configuração de SLA não encontrada');
      }

      return config;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao buscar configuração de SLA', error.message);
    }
  }

  async atualizar(id: string, dto: UpdateSlaConfigDto, empresaId: string): Promise<SlaConfig> {
    try {
      const tenantId = this.ensureEmpresaId(empresaId);
      const config = await this.buscarPorId(id, tenantId);

      // Validar tempos se ambos fornecidos
      if (dto.tempoRespostaMinutos && dto.tempoResolucaoMinutos) {
        if (dto.tempoRespostaMinutos >= dto.tempoResolucaoMinutos) {
          throw new BadRequestException('Tempo de resposta deve ser menor que tempo de resolução');
        }
      }

      Object.assign(config, dto);
      return await this.slaConfigRepository.save(config);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Erro ao atualizar configuração de SLA',
        error.message,
      );
    }
  }

  async deletar(id: string, empresaId: string): Promise<void> {
    try {
      const tenantId = this.ensureEmpresaId(empresaId);
      const config = await this.buscarPorId(id, tenantId);
      await this.slaConfigRepository.remove(config);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao deletar configuração de SLA', error.message);
    }
  }

  // ==================== CÁLCULO DE SLA ====================

  async calcularSlaTicket(
    ticketId: string,
    prioridade: string,
    canal: string,
    ticketCriadoEm: Date,
    empresaId: string,
  ): Promise<SlaCalculoResult> {
    try {
      const tenantId = this.ensureEmpresaId(empresaId);
      // Buscar configuração SLA apropriada
      const config = await this.buscarConfigParaTicket(prioridade, canal, tenantId);

      if (!config) {
        throw new NotFoundException(
          `Nenhuma configuração de SLA encontrada para prioridade "${prioridade}" e canal "${canal}"`,
        );
      }

      // Calcular tempo decorrido
      const agora = new Date();
      const tempoDecorridoMs = agora.getTime() - ticketCriadoEm.getTime();
      const tempoDecorridoMinutos = Math.floor(tempoDecorridoMs / (1000 * 60));

      // Calcular percentual usado
      const percentualUsado = Math.floor(
        (tempoDecorridoMinutos / config.tempoRespostaMinutos) * 100,
      );

      // Determinar status
      let status: 'cumprido' | 'em_risco' | 'violado';
      if (percentualUsado >= 100) {
        status = 'violado';
      } else if (percentualUsado >= config.alertaPercentual) {
        status = 'em_risco';
      } else {
        status = 'cumprido';
      }

      // Calcular tempo restante
      const tempoRestanteMinutos = Math.max(0, config.tempoRespostaMinutos - tempoDecorridoMinutos);

      // Calcular data limite
      const dataLimite = new Date(
        ticketCriadoEm.getTime() + config.tempoRespostaMinutos * 60 * 1000,
      );

      return {
        ticketId,
        prioridade,
        canal,
        slaConfigId: config.id,
        tempoDecorridoMinutos,
        tempoLimiteMinutos: config.tempoRespostaMinutos,
        percentualUsado,
        status,
        tempoRestanteMinutos,
        dataLimite,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao calcular SLA do ticket', error.message);
    }
  }

  private async buscarConfigParaTicket(
    prioridade: string,
    canal: string,
    empresaId: string,
  ): Promise<SlaConfig | null> {
    const tenantId = this.ensureEmpresaId(empresaId);
    // Tentar buscar config específica para canal
    let config = await this.slaConfigRepository.findOne({
      where: {
        empresaId: tenantId,
        prioridade,
        canal,
        ativo: true,
      },
    });

    // Se não encontrou, buscar config genérica (todos os canais)
    if (!config) {
      config = await this.slaConfigRepository.findOne({
        where: {
          empresaId: tenantId,
          prioridade,
          canal: null,
          ativo: true,
        },
      });
    }

    return config;
  }

  // ==================== VERIFICAÇÃO E ALERTAS ====================

  async verificarViolacoes(empresaId: string): Promise<SlaEventLog[]> {
    try {
      const tenantId = this.ensureEmpresaId(empresaId);
      // Buscar eventos de violação recentes (últimas 24h)
      const dataLimite = new Date();
      dataLimite.setHours(dataLimite.getHours() - 24);

      return await this.slaEventLogRepository.find({
        where: {
          empresaId: tenantId,
          status: 'violado',
        },
        order: { createdAt: 'DESC' },
        take: 50,
      });
    } catch (error) {
      throw new InternalServerErrorException('Erro ao verificar violações de SLA', error.message);
    }
  }

  async gerarAlerta(
    ticketId: string,
    slaConfigId: string,
    percentualUsado: number,
    tempoRespostaMinutos: number,
    tempoLimiteMinutos: number,
    empresaId: string,
  ): Promise<SlaEventLog> {
    try {
      const tenantId = this.ensureEmpresaId(empresaId);
      const alerta = this.slaEventLogRepository.create({
        ticketId,
        slaConfigId,
        tipoEvento: 'alerta',
        status: 'em_risco',
        tempoRespostaMinutos,
        tempoLimiteMinutos,
        percentualUsado,
        detalhes: `Ticket atingiu ${percentualUsado}% do tempo limite de resposta`,
        empresaId: tenantId,
      });

      return await this.slaEventLogRepository.save(alerta);
    } catch (error) {
      throw new InternalServerErrorException('Erro ao gerar alerta de SLA', error.message);
    }
  }

  async registrarViolacao(
    ticketId: string,
    slaConfigId: string,
    tempoRespostaMinutos: number,
    tempoLimiteMinutos: number,
    empresaId: string,
  ): Promise<SlaEventLog> {
    try {
      const tenantId = this.ensureEmpresaId(empresaId);
      const percentualUsado = Math.floor((tempoRespostaMinutos / tempoLimiteMinutos) * 100);

      const violacao = this.slaEventLogRepository.create({
        ticketId,
        slaConfigId,
        tipoEvento: 'violacao',
        status: 'violado',
        tempoRespostaMinutos,
        tempoLimiteMinutos,
        percentualUsado,
        detalhes: `SLA violado - Tempo limite excedido em ${tempoRespostaMinutos - tempoLimiteMinutos} minutos`,
        empresaId: tenantId,
      });

      return await this.slaEventLogRepository.save(violacao);
    } catch (error) {
      throw new InternalServerErrorException('Erro ao registrar violação de SLA', error.message);
    }
  }

  async buscarAlertas(empresaId: string): Promise<SlaEventLog[]> {
    try {
      const tenantId = this.ensureEmpresaId(empresaId);
      return await this.slaEventLogRepository.find({
        where: {
          empresaId: tenantId,
          status: 'em_risco',
        },
        order: { createdAt: 'DESC' },
        take: 50,
      });
    } catch (error) {
      throw new InternalServerErrorException('Erro ao buscar alertas de SLA', error.message);
    }
  }

  // ==================== MÉTRICAS E RELATÓRIOS ====================

  async buscarMetricas(empresaId: string, filtros?: SlaMetricasFilterDto): Promise<SlaMetricas> {
    try {
      const tenantId = this.ensureEmpresaId(empresaId);
      // Query builder para métricas
      const query = this.slaEventLogRepository
        .createQueryBuilder('log')
        .where('log.empresaId = :empresaId', { empresaId: tenantId });

      // Aplicar filtros
      if (filtros?.dataInicio) {
        query.andWhere('log.createdAt >= :dataInicio', {
          dataInicio: filtros.dataInicio,
        });
      }
      if (filtros?.dataFim) {
        query.andWhere('log.createdAt <= :dataFim', {
          dataFim: filtros.dataFim,
        });
      }

      const logs = await query.getMany();

      // Calcular métricas
      const totalTickets = logs.length;
      const ticketsCumpridos = logs.filter((l) => l.status === 'cumprido').length;
      const ticketsEmRisco = logs.filter((l) => l.status === 'em_risco').length;
      const ticketsViolados = logs.filter((l) => l.status === 'violado').length;

      const percentualCumprimento =
        totalTickets > 0 ? Math.round((ticketsCumpridos / totalTickets) * 100) : 0;

      // Tempo médio de resposta
      const temposResposta = logs
        .filter((l) => l.tempoRespostaMinutos)
        .map((l) => l.tempoRespostaMinutos);
      const tempoMedioResposta =
        temposResposta.length > 0
          ? Math.round(temposResposta.reduce((a, b) => a + b, 0) / temposResposta.length)
          : 0;

      // Tempo médio de resolução
      const temposResolucao = logs
        .filter((l) => l.tempoResolucaoMinutos)
        .map((l) => l.tempoResolucaoMinutos);
      const tempoMedioResolucao =
        temposResolucao.length > 0
          ? Math.round(temposResolucao.reduce((a, b) => a + b, 0) / temposResolucao.length)
          : 0;

      // Violações por prioridade (buscar da config)
      const violacoesPorPrioridade = {
        baixa: 0,
        normal: 0,
        alta: 0,
        urgente: 0,
      };

      // Violações por canal
      const violacoesPorCanal: Record<string, number> = {};

      return {
        totalTickets,
        ticketsCumpridos,
        ticketsEmRisco,
        ticketsViolados,
        percentualCumprimento,
        tempoMedioResposta,
        tempoMedioResolucao,
        violacoesPorPrioridade,
        violacoesPorCanal,
      };
    } catch (error) {
      throw new InternalServerErrorException('Erro ao buscar métricas de SLA', error.message);
    }
  }

  async buscarHistorico(ticketId: string, empresaId: string): Promise<SlaEventLog[]> {
    try {
      const tenantId = this.ensureEmpresaId(empresaId);
      return await this.slaEventLogRepository.find({
        where: {
          ticketId,
          empresaId: tenantId,
        },
        order: { createdAt: 'ASC' },
      });
    } catch (error) {
      throw new InternalServerErrorException('Erro ao buscar histórico de SLA', error.message);
    }
  }
}
