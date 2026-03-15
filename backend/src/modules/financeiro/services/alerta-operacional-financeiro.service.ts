import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  AlertaOperacionalFinanceiro,
  AlertaOperacionalFinanceiroSeveridade,
  AlertaOperacionalFinanceiroStatus,
  AlertaOperacionalFinanceiroTipo,
} from '../entities/alerta-operacional-financeiro.entity';
import {
  AtualizarStatusAlertaOperacionalFinanceiroDto,
  QueryAlertasOperacionaisFinanceiroDto,
  ReprocessarAlertaOperacionalFinanceiroDto,
} from '../dto/alerta-operacional-financeiro.dto';
import { ContaPagar } from '../entities/conta-pagar.entity';
import { ExtratoBancarioItem } from '../entities/extrato-bancario-item.entity';
import {
  GatewayWebhookEvento,
  GatewayWebhookEventoStatus,
} from '../../pagamentos/entities/gateway-webhook-evento.entity';
import {
  ContaPagarExportacao,
  ContaPagarExportacaoStatus,
} from '../entities/conta-pagar-exportacao.entity';
import { FaturamentoService } from '../../faturamento/services/faturamento.service';
import { PagamentoService } from '../../faturamento/services/pagamento.service';
import { StatusPagamento } from '../../faturamento/entities/pagamento.entity';

type AlertaOperacionalFinanceiroResponse = {
  id: string;
  tipo: string;
  severidade: string;
  status: string;
  titulo: string;
  descricao?: string;
  referencia?: string;
  payload: Record<string, unknown>;
  auditoria: Array<Record<string, unknown>>;
  acknowledgedPor?: string;
  acknowledgedEm?: string;
  resolvidoPor?: string;
  resolvidoEm?: string;
  createdAt: string;
  updatedAt: string;
};

@Injectable()
export class AlertaOperacionalFinanceiroService {
  private readonly logger = new Logger(AlertaOperacionalFinanceiroService.name);

  constructor(
    @InjectRepository(AlertaOperacionalFinanceiro)
    private readonly alertaRepository: Repository<AlertaOperacionalFinanceiro>,
    @InjectRepository(ContaPagar)
    private readonly contaPagarRepository: Repository<ContaPagar>,
    @InjectRepository(ExtratoBancarioItem)
    private readonly extratoItemRepository: Repository<ExtratoBancarioItem>,
    @InjectRepository(GatewayWebhookEvento)
    private readonly webhookEventoRepository: Repository<GatewayWebhookEvento>,
    @InjectRepository(ContaPagarExportacao)
    private readonly exportacaoRepository: Repository<ContaPagarExportacao>,
    private readonly faturamentoService: FaturamentoService,
    private readonly pagamentoService: PagamentoService,
  ) {}

  async listar(
    empresaId: string,
    filtros: QueryAlertasOperacionaisFinanceiroDto = {},
  ): Promise<AlertaOperacionalFinanceiroResponse[]> {
    const qb = this.alertaRepository
      .createQueryBuilder('alerta')
      .where('alerta.empresaId = :empresaId', { empresaId })
      .orderBy('alerta.createdAt', 'DESC');

    if (filtros.status) {
      qb.andWhere('alerta.status = :status', { status: filtros.status });
    }

    if (filtros.severidade) {
      qb.andWhere('alerta.severidade = :severidade', { severidade: filtros.severidade });
    }

    if (filtros.tipo) {
      qb.andWhere('alerta.tipo = :tipo', { tipo: filtros.tipo });
    }

    qb.limit(Math.max(1, Number(filtros.limite || 50)));

    const alertas = await qb.getMany();
    return alertas.map((alerta) => this.mapResponse(alerta));
  }

  async ack(
    id: string,
    empresaId: string,
    usuarioId: string,
    dto: AtualizarStatusAlertaOperacionalFinanceiroDto,
  ): Promise<AlertaOperacionalFinanceiroResponse> {
    const alerta = await this.findById(id, empresaId);

    if (alerta.status === AlertaOperacionalFinanceiroStatus.RESOLVIDO) {
      throw new BadRequestException('Nao e possivel reconhecer alerta ja resolvido');
    }

    const statusAnterior = alerta.status;
    alerta.status = AlertaOperacionalFinanceiroStatus.ACKNOWLEDGED;
    alerta.acknowledgedPor = usuarioId;
    alerta.acknowledgedEm = new Date();
    alerta.auditoria = this.appendAuditoria(alerta.auditoria, {
      acao: 'ack',
      usuarioId,
      observacao: dto.observacao,
      statusAnterior,
      statusNovo: alerta.status,
    });

    const atualizado = await this.alertaRepository.save(alerta);
    this.logStructured('financeiro.alertas_operacionais.transicao', {
      acao: 'ack',
      empresaId,
      alertaId: atualizado.id,
      tipo: atualizado.tipo,
      referencia: atualizado.referencia || null,
      statusAnterior,
      statusNovo: atualizado.status,
      usuarioId,
    });
    return this.mapResponse(atualizado);
  }

  async resolver(
    id: string,
    empresaId: string,
    usuarioId: string,
    dto: AtualizarStatusAlertaOperacionalFinanceiroDto,
  ): Promise<AlertaOperacionalFinanceiroResponse> {
    const alerta = await this.findById(id, empresaId);

    if (alerta.status === AlertaOperacionalFinanceiroStatus.RESOLVIDO) {
      return this.mapResponse(alerta);
    }

    const statusAnterior = alerta.status;
    alerta.status = AlertaOperacionalFinanceiroStatus.RESOLVIDO;
    alerta.resolvidoPor = usuarioId;
    alerta.resolvidoEm = new Date();
    if (!alerta.acknowledgedPor) {
      alerta.acknowledgedPor = usuarioId;
      alerta.acknowledgedEm = new Date();
    }
    alerta.auditoria = this.appendAuditoria(alerta.auditoria, {
      acao: 'resolver',
      usuarioId,
      observacao: dto.observacao,
      statusAnterior,
      statusNovo: alerta.status,
    });

    const atualizado = await this.alertaRepository.save(alerta);
    this.logStructured('financeiro.alertas_operacionais.transicao', {
      acao: 'resolver',
      empresaId,
      alertaId: atualizado.id,
      tipo: atualizado.tipo,
      referencia: atualizado.referencia || null,
      statusAnterior,
      statusNovo: atualizado.status,
      usuarioId,
    });
    return this.mapResponse(atualizado);
  }

  async reprocessar(
    id: string,
    empresaId: string,
    usuarioId: string,
    dto: ReprocessarAlertaOperacionalFinanceiroDto = {},
  ): Promise<{
    sucesso: boolean;
    mensagem: string;
    alerta: AlertaOperacionalFinanceiroResponse;
    detalhes?: Record<string, unknown>;
  }> {
    const alerta = await this.findById(id, empresaId);
    const statusAnterior = alerta.status;

    try {
      const resultado = await this.executarReprocessamento(alerta, empresaId, dto);

      alerta.status = AlertaOperacionalFinanceiroStatus.RESOLVIDO;
      alerta.resolvidoPor = usuarioId;
      alerta.resolvidoEm = new Date();
      if (!alerta.acknowledgedPor) {
        alerta.acknowledgedPor = usuarioId;
        alerta.acknowledgedEm = new Date();
      }
      alerta.auditoria = this.appendAuditoria(alerta.auditoria, {
        acao: 'reprocessar',
        usuarioId,
        observacao: dto.observacao,
        statusAnterior,
        statusNovo: alerta.status,
        sucesso: true,
        detalhes: resultado,
      });

      const atualizado = await this.alertaRepository.save(alerta);
      this.logStructured('financeiro.alertas_operacionais.reprocessamento', {
        empresaId,
        alertaId: atualizado.id,
        tipo: atualizado.tipo,
        referencia: atualizado.referencia || null,
        sucesso: true,
        usuarioId,
      });

      return {
        sucesso: true,
        mensagem: 'Reprocessamento executado com sucesso',
        alerta: this.mapResponse(atualizado),
        detalhes: resultado,
      };
    } catch (error) {
      const mensagem = String(error?.message || error || 'Falha ao reprocessar alerta');
      alerta.auditoria = this.appendAuditoria(alerta.auditoria, {
        acao: 'reprocessar',
        usuarioId,
        observacao: dto.observacao,
        statusAnterior,
        statusNovo: alerta.status,
        sucesso: false,
        erro: mensagem,
      });
      const atualizado = await this.alertaRepository.save(alerta);

      this.logStructured('financeiro.alertas_operacionais.reprocessamento', {
        empresaId,
        alertaId: atualizado.id,
        tipo: atualizado.tipo,
        referencia: atualizado.referencia || null,
        sucesso: false,
        erro: mensagem,
        usuarioId,
      });

      return {
        sucesso: false,
        mensagem,
        alerta: this.mapResponse(atualizado),
      };
    }
  }

  async recalcularAlertas(
    empresaId: string,
    usuarioId: string,
  ): Promise<{ gerados: number; resolvidos: number; ativos: number }> {
    this.logStructured('financeiro.alertas_operacionais.recalculo.inicio', {
      empresaId,
      usuarioId,
    });

    const referenciasAtivas = new Map<AlertaOperacionalFinanceiroTipo, Set<string>>();
    let gerados = 0;
    let resolvidos = 0;

    const registrarReferencia = (tipo: AlertaOperacionalFinanceiroTipo, referencia: string) => {
      if (!referenciasAtivas.has(tipo)) {
        referenciasAtivas.set(tipo, new Set<string>());
      }
      referenciasAtivas.get(tipo)?.add(referencia);
    };

    const hoje = new Date();
    const hojeDate = hoje.toISOString().slice(0, 10);
    const limiteVencimento = new Date(hoje);
    limiteVencimento.setDate(limiteVencimento.getDate() + 3);
    const limiteVencimentoDate = limiteVencimento.toISOString().slice(0, 10);

    const contasVencendo = await this.contaPagarRepository
      .createQueryBuilder('conta')
      .select(['conta.id', 'conta.numero', 'conta.dataVencimento', 'conta.valorTotal'])
      .where('conta.empresaId = :empresaId', { empresaId })
      .andWhere('conta.status IN (:...status)', { status: ['pendente', 'vencida'] })
      .andWhere('conta.dataVencimento >= :hoje', { hoje: hojeDate })
      .andWhere('conta.dataVencimento <= :limite', { limite: limiteVencimentoDate })
      .getMany();

    for (const conta of contasVencendo) {
      const referencia = `conta:${conta.id}:vence_3_dias`;
      registrarReferencia(AlertaOperacionalFinanceiroTipo.CONTA_VENCE_EM_3_DIAS, referencia);
      const foiCriado = await this.upsertAlertaAutomatico(
        empresaId,
        {
          tipo: AlertaOperacionalFinanceiroTipo.CONTA_VENCE_EM_3_DIAS,
          referencia,
          severidade: AlertaOperacionalFinanceiroSeveridade.WARNING,
          titulo: 'Conta proxima do vencimento',
          descricao: `Conta ${conta.numero || conta.id} vence em ate 3 dias`,
          payload: {
            contaId: conta.id,
            contaNumero: conta.numero,
            dataVencimento: this.toDateOnly(conta.dataVencimento),
            valorTotal: Number(conta.valorTotal || 0),
          },
        },
        usuarioId,
      );
      if (foiCriado) gerados += 1;
    }

    const contasVencidas = await this.contaPagarRepository
      .createQueryBuilder('conta')
      .select(['conta.id', 'conta.numero', 'conta.dataVencimento', 'conta.valorTotal'])
      .where('conta.empresaId = :empresaId', { empresaId })
      .andWhere('conta.status IN (:...status)', { status: ['pendente', 'vencida'] })
      .andWhere('conta.dataVencimento < :hoje', { hoje: hojeDate })
      .getMany();

    for (const conta of contasVencidas) {
      const referencia = `conta:${conta.id}:vencida`;
      registrarReferencia(AlertaOperacionalFinanceiroTipo.CONTA_VENCIDA, referencia);
      const foiCriado = await this.upsertAlertaAutomatico(
        empresaId,
        {
          tipo: AlertaOperacionalFinanceiroTipo.CONTA_VENCIDA,
          referencia,
          severidade: AlertaOperacionalFinanceiroSeveridade.CRITICAL,
          titulo: 'Conta vencida',
          descricao: `Conta ${conta.numero || conta.id} esta vencida`,
          payload: {
            contaId: conta.id,
            contaNumero: conta.numero,
            dataVencimento: this.toDateOnly(conta.dataVencimento),
            valorTotal: Number(conta.valorTotal || 0),
          },
        },
        usuarioId,
      );
      if (foiCriado) gerados += 1;
    }

    const limiteConciliacao = new Date(hoje);
    limiteConciliacao.setDate(limiteConciliacao.getDate() - 5);
    const totalConciliacaoPendenteCritica = await this.extratoItemRepository
      .createQueryBuilder('item')
      .where('item.empresaId = :empresaId', { empresaId })
      .andWhere('item.conciliado = false')
      .andWhere('item.dataLancamento <= :limite', {
        limite: limiteConciliacao.toISOString().slice(0, 10),
      })
      .getCount();

    if (totalConciliacaoPendenteCritica > 0) {
      const referencia = 'conciliacao:pendente_critica';
      registrarReferencia(AlertaOperacionalFinanceiroTipo.CONCILIACAO_PENDENTE_CRITICA, referencia);
      const foiCriado = await this.upsertAlertaAutomatico(
        empresaId,
        {
          tipo: AlertaOperacionalFinanceiroTipo.CONCILIACAO_PENDENTE_CRITICA,
          referencia,
          severidade: AlertaOperacionalFinanceiroSeveridade.WARNING,
          titulo: 'Conciliacao com pendencias criticas',
          descricao: 'Existem lancamentos de extrato sem conciliacao no prazo critico',
          payload: {
            totalPendenciasCriticas: totalConciliacaoPendenteCritica,
          },
        },
        usuarioId,
      );
      if (foiCriado) gerados += 1;
    }

    const totalWebhooksFalha = await this.webhookEventoRepository
      .createQueryBuilder('webhook')
      .where('webhook.empresaId = :empresaId', { empresaId })
      .andWhere('webhook.status = :status', { status: GatewayWebhookEventoStatus.FALHA })
      .andWhere('webhook.createdAt >= :inicio', {
        inicio: new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000),
      })
      .getCount();

    if (totalWebhooksFalha > 0) {
      const referencia = 'webhook:pagamento_falha';
      registrarReferencia(AlertaOperacionalFinanceiroTipo.WEBHOOK_PAGAMENTO_FALHA, referencia);
      const foiCriado = await this.upsertAlertaAutomatico(
        empresaId,
        {
          tipo: AlertaOperacionalFinanceiroTipo.WEBHOOK_PAGAMENTO_FALHA,
          referencia,
          severidade: AlertaOperacionalFinanceiroSeveridade.CRITICAL,
          titulo: 'Falhas em webhook de pagamento',
          descricao: 'Foram identificadas falhas recentes no processamento de webhooks',
          payload: {
            totalFalhas: totalWebhooksFalha,
          },
        },
        usuarioId,
      );
      if (foiCriado) gerados += 1;
    }

    const totalExportacoesFalha = await this.exportacaoRepository
      .createQueryBuilder('exportacao')
      .where('exportacao.empresaId = :empresaId', { empresaId })
      .andWhere('exportacao.status = :status', { status: ContaPagarExportacaoStatus.FALHA })
      .andWhere('exportacao.createdAt >= :inicio', {
        inicio: new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000),
      })
      .getCount();

    if (totalExportacoesFalha > 0) {
      const referencia = 'exportacao:contabil_falha';
      registrarReferencia(AlertaOperacionalFinanceiroTipo.EXPORTACAO_CONTABIL_FALHA, referencia);
      const foiCriado = await this.upsertAlertaAutomatico(
        empresaId,
        {
          tipo: AlertaOperacionalFinanceiroTipo.EXPORTACAO_CONTABIL_FALHA,
          referencia,
          severidade: AlertaOperacionalFinanceiroSeveridade.WARNING,
          titulo: 'Falhas na exportacao contabil',
          descricao: 'Exportacoes contabeis recentes falharam e exigem revisao',
          payload: {
            totalFalhas: totalExportacoesFalha,
          },
        },
        usuarioId,
      );
      if (foiCriado) gerados += 1;
    }

    const tiposComMonitoramentoAutomatico: AlertaOperacionalFinanceiroTipo[] = [
      AlertaOperacionalFinanceiroTipo.CONTA_VENCE_EM_3_DIAS,
      AlertaOperacionalFinanceiroTipo.CONTA_VENCIDA,
      AlertaOperacionalFinanceiroTipo.CONCILIACAO_PENDENTE_CRITICA,
      AlertaOperacionalFinanceiroTipo.WEBHOOK_PAGAMENTO_FALHA,
      AlertaOperacionalFinanceiroTipo.EXPORTACAO_CONTABIL_FALHA,
    ];

    for (const tipo of tiposComMonitoramentoAutomatico) {
      const referencias = referenciasAtivas.get(tipo) || new Set<string>();
      resolvidos += await this.resolverAlertasAusentes(empresaId, tipo, referencias, usuarioId);
    }

    const ativos = await this.alertaRepository.count({
      where: {
        empresaId,
        status: In([
          AlertaOperacionalFinanceiroStatus.ATIVO,
          AlertaOperacionalFinanceiroStatus.ACKNOWLEDGED,
        ]),
      },
    });

    this.logStructured('financeiro.alertas_operacionais.recalculo.fim', {
      empresaId,
      usuarioId,
      gerados,
      resolvidos,
      ativos,
    });

    return {
      gerados,
      resolvidos,
      ativos,
    };
  }

  private async executarReprocessamento(
    alerta: AlertaOperacionalFinanceiro,
    empresaId: string,
    dto: ReprocessarAlertaOperacionalFinanceiroDto,
  ): Promise<Record<string, unknown>> {
    const payload = alerta.payload && typeof alerta.payload === 'object' ? alerta.payload : {};

    if (alerta.tipo === AlertaOperacionalFinanceiroTipo.STATUS_SINCRONIZACAO_DIVERGENTE) {
      const faturaId = this.toPositiveInt((payload as any).faturaId);
      if (!faturaId) {
        throw new BadRequestException(
          'Reprocessamento indisponivel: alerta sem faturaId para sincronizacao de status.',
        );
      }

      const correlationId = this.toOptionalString((payload as any).correlationId) || `alerta:${alerta.id}`;
      await this.faturamentoService.sincronizarStatusPropostaPorFaturaId(
        faturaId,
        empresaId,
        {
          correlationId,
          origemId: `alerta:${alerta.id}:reprocessar`,
          strict: true,
        },
      );

      return {
        tipo: alerta.tipo,
        faturaId,
        correlationId,
      };
    }

    if (alerta.tipo === AlertaOperacionalFinanceiroTipo.ESTORNO_FALHA) {
      const pagamentoId =
        this.toPositiveInt(dto.pagamentoId) || this.toPositiveInt((payload as any).pagamentoId);
      if (!pagamentoId) {
        throw new BadRequestException(
          'Reprocessamento indisponivel: informe pagamentoId para tentar novamente o estorno.',
        );
      }

      const motivo =
        this.toOptionalString(dto.observacao) ||
        this.toOptionalString((payload as any).motivo) ||
        'Reprocessamento de alerta operacional de estorno falho.';
      const estorno = await this.pagamentoService.estornarPagamento(pagamentoId, motivo, empresaId);

      return {
        tipo: alerta.tipo,
        pagamentoId,
        estornoId: estorno.id,
      };
    }

    if (alerta.tipo === AlertaOperacionalFinanceiroTipo.REFERENCIA_INTEGRACAO_INVALIDA) {
      const gatewayTransacaoId =
        this.toOptionalString(dto.gatewayTransacaoId) ||
        this.toOptionalString((payload as any).gatewayTransacaoId) ||
        this.toOptionalString((payload as any).referenciaGateway);

      if (!gatewayTransacaoId) {
        throw new BadRequestException(
          'Reprocessamento requer gatewayTransacaoId para vincular o pagamento manualmente.',
        );
      }

      const statusRaw =
        this.toOptionalString(dto.novoStatus) ||
        this.toOptionalString((payload as any).novoStatus) ||
        this.toOptionalString((payload as any).statusMapeado) ||
        'rejeitado';
      const novoStatus = this.normalizarStatusPagamento(statusRaw);

      await this.pagamentoService.processarPagamento(
        {
          gatewayTransacaoId,
          novoStatus,
          motivoRejeicao:
            dto.motivoRejeicao || this.toOptionalString((payload as any).motivoRejeicao) || undefined,
          webhookData: {
            origem: 'alerta_operacional_reprocessamento',
            alertaId: alerta.id,
          },
          correlationId: this.toOptionalString((payload as any).correlationId) || `alerta:${alerta.id}`,
          origemId: `alerta:${alerta.id}:reprocessar`,
        },
        empresaId,
      );

      return {
        tipo: alerta.tipo,
        gatewayTransacaoId,
        novoStatus,
      };
    }

    throw new BadRequestException(
      `Tipo de alerta ${alerta.tipo} nao suporta reprocessamento automatico.`,
    );
  }

  private async findById(id: string, empresaId: string): Promise<AlertaOperacionalFinanceiro> {
    const alerta = await this.alertaRepository.findOne({
      where: {
        id,
        empresaId,
      },
    });

    if (!alerta) {
      throw new NotFoundException('Alerta operacional financeiro nao encontrado');
    }

    return alerta;
  }

  private async upsertAlertaAutomatico(
    empresaId: string,
    params: {
      tipo: AlertaOperacionalFinanceiroTipo;
      referencia: string;
      severidade: AlertaOperacionalFinanceiroSeveridade;
      titulo: string;
      descricao?: string;
      payload: Record<string, unknown>;
    },
    usuarioId: string,
  ): Promise<boolean> {
    const existente = await this.alertaRepository.findOne({
      where: {
        empresaId,
        tipo: params.tipo,
        referencia: params.referencia,
        status: In([
          AlertaOperacionalFinanceiroStatus.ATIVO,
          AlertaOperacionalFinanceiroStatus.ACKNOWLEDGED,
        ]),
      },
    });

    if (existente) {
      existente.severidade = params.severidade;
      existente.titulo = params.titulo;
      existente.descricao = params.descricao;
      existente.payload = params.payload;
      existente.auditoria = this.appendAuditoria(existente.auditoria, {
        acao: 'atualizacao_automatica',
        usuarioId,
        statusAnterior: existente.status,
        statusNovo: existente.status,
      });
      await this.alertaRepository.save(existente);
      this.logStructured('financeiro.alertas_operacionais.geracao', {
        acao: 'atualizacao_automatica',
        empresaId,
        alertaId: existente.id,
        tipo: existente.tipo,
        referencia: existente.referencia || null,
        status: existente.status,
        usuarioId,
      });
      return false;
    }

    const novo = this.alertaRepository.create({
      empresaId,
      tipo: params.tipo,
      referencia: params.referencia,
      severidade: params.severidade,
      titulo: params.titulo,
      descricao: params.descricao,
      payload: params.payload,
      status: AlertaOperacionalFinanceiroStatus.ATIVO,
      auditoria: this.appendAuditoria([], {
        acao: 'gerado_automaticamente',
        usuarioId,
        statusAnterior: null,
        statusNovo: AlertaOperacionalFinanceiroStatus.ATIVO,
      }),
    });
    await this.alertaRepository.save(novo);
    this.logStructured('financeiro.alertas_operacionais.geracao', {
      acao: 'gerado_automaticamente',
      empresaId,
      alertaId: novo.id || null,
      tipo: novo.tipo,
      referencia: novo.referencia || null,
      status: novo.status,
      usuarioId,
    });
    return true;
  }

  private async resolverAlertasAusentes(
    empresaId: string,
    tipo: AlertaOperacionalFinanceiroTipo,
    referenciasAtivas: Set<string>,
    usuarioId: string,
  ): Promise<number> {
    const qb = this.alertaRepository
      .createQueryBuilder('alerta')
      .where('alerta.empresaId = :empresaId', { empresaId })
      .andWhere('alerta.tipo = :tipo', { tipo })
      .andWhere('alerta.status IN (:...status)', {
        status: [
          AlertaOperacionalFinanceiroStatus.ATIVO,
          AlertaOperacionalFinanceiroStatus.ACKNOWLEDGED,
        ],
      });

    if (referenciasAtivas.size > 0) {
      qb.andWhere('alerta.referencia NOT IN (:...referencias)', {
        referencias: Array.from(referenciasAtivas),
      });
    }

    const paraResolver = await qb.getMany();
    if (paraResolver.length === 0) return 0;

    for (const alerta of paraResolver) {
      const statusAnterior = alerta.status;
      alerta.status = AlertaOperacionalFinanceiroStatus.RESOLVIDO;
      alerta.resolvidoPor = usuarioId;
      alerta.resolvidoEm = new Date();
      alerta.auditoria = this.appendAuditoria(alerta.auditoria, {
        acao: 'auto_resolver',
        usuarioId,
        statusAnterior,
        statusNovo: AlertaOperacionalFinanceiroStatus.RESOLVIDO,
      });
      await this.alertaRepository.save(alerta);
      this.logStructured('financeiro.alertas_operacionais.transicao', {
        acao: 'auto_resolver',
        empresaId,
        alertaId: alerta.id,
        tipo: alerta.tipo,
        referencia: alerta.referencia || null,
        statusAnterior,
        statusNovo: alerta.status,
        usuarioId,
      });
    }

    return paraResolver.length;
  }

  private appendAuditoria(
    auditoriaAtual: unknown,
    evento: Record<string, unknown>,
  ): Array<Record<string, unknown>> {
    const historico = Array.isArray(auditoriaAtual)
      ? [...(auditoriaAtual as Array<Record<string, unknown>>)]
      : [];

    historico.push({
      ...evento,
      timestamp: new Date().toISOString(),
    });

    return historico.slice(-100);
  }

  private toPositiveInt(value: unknown): number | undefined {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) return undefined;
    return parsed;
  }

  private toOptionalString(value: unknown): string | undefined {
    const normalized = String(value || '').trim();
    return normalized || undefined;
  }

  private normalizarStatusPagamento(value: string): StatusPagamento {
    const normalized = value.trim().toLowerCase();
    switch (normalized) {
      case StatusPagamento.APROVADO:
      case 'approved':
      case 'paid':
      case 'pago':
        return StatusPagamento.APROVADO;
      case StatusPagamento.PROCESSANDO:
      case 'processing':
      case 'processando':
        return StatusPagamento.PROCESSANDO;
      case StatusPagamento.CANCELADO:
      case 'cancelado':
      case 'cancelled':
        return StatusPagamento.CANCELADO;
      case StatusPagamento.PENDENTE:
      case 'pending':
      case 'pendente':
        return StatusPagamento.PENDENTE;
      case StatusPagamento.REJEITADO:
      case 'rejeitado':
      case 'rejected':
      case 'failed':
      default:
        return StatusPagamento.REJEITADO;
    }
  }

  private mapResponse(alerta: AlertaOperacionalFinanceiro): AlertaOperacionalFinanceiroResponse {
    return {
      id: alerta.id,
      tipo: alerta.tipo,
      severidade: alerta.severidade,
      status: alerta.status,
      titulo: alerta.titulo,
      descricao: alerta.descricao || undefined,
      referencia: alerta.referencia || undefined,
      payload: alerta.payload || {},
      auditoria: Array.isArray(alerta.auditoria) ? alerta.auditoria : [],
      acknowledgedPor: alerta.acknowledgedPor || undefined,
      acknowledgedEm: alerta.acknowledgedEm ? alerta.acknowledgedEm.toISOString() : undefined,
      resolvidoPor: alerta.resolvidoPor || undefined,
      resolvidoEm: alerta.resolvidoEm ? alerta.resolvidoEm.toISOString() : undefined,
      createdAt: alerta.createdAt.toISOString(),
      updatedAt: alerta.updatedAt.toISOString(),
    };
  }

  private toDateOnly(value?: Date | string | null): string {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
  }

  private logStructured(event: string, payload: Record<string, unknown>): void {
    this.logger.log(
      JSON.stringify({
        event,
        ...payload,
      }),
    );
  }
}
