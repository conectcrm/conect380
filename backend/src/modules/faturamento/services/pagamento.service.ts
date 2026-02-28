import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Pagamento, StatusPagamento, TipoPagamento } from '../entities/pagamento.entity';
import { Fatura, StatusFatura } from '../entities/fatura.entity';
import {
  CreatePagamentoDto,
  UpdatePagamentoDto,
  ProcessarPagamentoDto,
} from '../dto/pagamento.dto';
import { FaturamentoService } from './faturamento.service';

@Injectable()
export class PagamentoService {
  private readonly logger = new Logger(PagamentoService.name);

  constructor(
    @InjectRepository(Pagamento)
    private pagamentoRepository: Repository<Pagamento>,
    @InjectRepository(Fatura)
    private faturaRepository: Repository<Fatura>,
    private faturamentoService: FaturamentoService,
    private readonly dataSource: DataSource,
  ) {}

  private logEvento(evento: string, payload: Record<string, unknown>): void {
    this.logger.log(
      `[${evento}] ${JSON.stringify({
        service: PagamentoService.name,
        ...payload,
      })}`,
    );
  }

  private normalizeTraceId(value: unknown): string | undefined {
    const normalized = String(value || '').trim();
    return normalized ? normalized.slice(0, 180) : undefined;
  }

  async criarPagamento(
    createPagamentoDto: CreatePagamentoDto,
    empresaId: string,
  ): Promise<Pagamento> {
    try {
      // Verificar se a fatura existe
      const fatura = await this.faturaRepository.findOne({
        where: { id: createPagamentoDto.faturaId, empresaId },
      });

      if (!fatura) {
        throw new NotFoundException('Fatura no encontrada');
      }

      // Verificao direta do status em vez de usar o mtodo isPaga()
      if (fatura.status === StatusFatura.PAGA) {
        throw new BadRequestException('Fatura j est paga');
      }

      // Verificar se j existe pagamento com o mesmo transacaoId
      const pagamentoExistente = await this.pagamentoRepository.findOne({
        where: {
          transacaoId: createPagamentoDto.transacaoId,
          empresaId,
        },
      });

      if (pagamentoExistente) {
        throw new BadRequestException('J existe um pagamento com este ID de transao');
      }

      // Calcular valor lquido
      const taxa = createPagamentoDto.taxa || 0;
      const valorLiquido = createPagamentoDto.valor - taxa;

      const pagamento = this.pagamentoRepository.create({
        ...createPagamentoDto,
        valorLiquido,
        status: StatusPagamento.PENDENTE,
        empresaId,
      });

      const pagamentoSalvo = await this.pagamentoRepository.save(pagamento);

      this.logger.log(
        `Pagamento criado: ${pagamentoSalvo.transacaoId} para fatura ${fatura.numero}`,
      );

      return pagamentoSalvo;
    } catch (error) {
      this.logger.error(`Erro ao criar pagamento: ${error.message}`);
      throw error;
    }
  }

  async processarPagamento(
    processarPagamentoDto: ProcessarPagamentoDto,
    empresaId: string,
  ): Promise<Pagamento> {
    try {
      // Buscar pagamento pelo ID da transao do gateway
      const pagamento = await this.pagamentoRepository.findOne({
        where: {
          gatewayTransacaoId: processarPagamentoDto.gatewayTransacaoId,
          empresaId,
        },
        relations: ['fatura'],
      });

      if (!pagamento) {
        throw new NotFoundException('Pagamento no encontrado');
      }

      // Atualizar status do pagamento
      const statusAnteriorPagamento = pagamento.status;
      pagamento.status = processarPagamentoDto.novoStatus;
      pagamento.dataProcessamento = new Date();

      if (processarPagamentoDto.motivoRejeicao) {
        pagamento.motivoRejeicao = processarPagamentoDto.motivoRejeicao;
      }

      const correlationId = this.normalizeTraceId(processarPagamentoDto.correlationId);
      const origemId = this.normalizeTraceId(processarPagamentoDto.origemId);

      if (processarPagamentoDto.webhookData) {
        pagamento.dadosCompletos = {
          ...pagamento.dadosCompletos,
          webhookData: {
            ...(processarPagamentoDto.webhookData || {}),
            ...(correlationId ? { correlationId } : {}),
            ...(origemId ? { origemId } : {}),
          },
        };
      }
      if (correlationId || origemId) {
        pagamento.dadosCompletos = {
          ...(pagamento.dadosCompletos || {}),
          ...(correlationId ? { correlationId } : {}),
          ...(origemId ? { origemId } : {}),
        };
      }

      // Mantem data de aprovacao consistente com o status atual.
      if (processarPagamentoDto.novoStatus === StatusPagamento.APROVADO) {
        pagamento.dataAprovacao = new Date();
      } else if (statusAnteriorPagamento === StatusPagamento.APROVADO) {
        pagamento.dataAprovacao = null;
      }

      const pagamentoAtualizado = await this.pagamentoRepository.save(pagamento);

      const deveRecalcularFatura =
        statusAnteriorPagamento === StatusPagamento.APROVADO ||
        processarPagamentoDto.novoStatus === StatusPagamento.APROVADO;

      if (deveRecalcularFatura) {
        // Persistir primeiro para que o recalculo da fatura use o estado mais recente do pagamento.
        await this.atualizarStatusFatura(pagamento.faturaId, pagamento.valor, empresaId, {
          correlationId,
          origemId,
          source: processarPagamentoDto.webhookData ? 'pagamento.webhook' : 'pagamento.processar',
        });
      }

      this.logEvento('PAGAMENTO_STATUS_CHANGE', {
        empresaId,
        pagamentoId: pagamentoAtualizado.id,
        faturaId: pagamentoAtualizado.faturaId,
        gatewayTransacaoId: pagamentoAtualizado.gatewayTransacaoId,
        statusAnterior: statusAnteriorPagamento,
        statusNovo: processarPagamentoDto.novoStatus,
        correlationId: correlationId || null,
        origemId: origemId || null,
      });

      this.logger.log(
        `Pagamento processado: ${pagamentoAtualizado.transacaoId} - Status: ${processarPagamentoDto.novoStatus}`,
      );

      return pagamentoAtualizado;
    } catch (error) {
      this.logger.error(`Erro ao processar pagamento: ${error.message}`);
      throw error;
    }
  }

  async buscarPagamentos(
    filtros: {
      faturaId?: number;
      status?: StatusPagamento;
      metodoPagamento?: string;
      gateway?: string;
      dataInicio?: Date;
      dataFim?: Date;
    } = {},
    empresaId: string,
  ): Promise<Pagamento[]> {
    const query = this.pagamentoRepository
      .createQueryBuilder('pagamento')
      .leftJoinAndSelect('pagamento.fatura', 'fatura')
      .where('pagamento.empresa_id = :empresaId', { empresaId })
      .orderBy('pagamento.createdAt', 'DESC');

    if (filtros?.faturaId) {
      query.andWhere('pagamento.faturaId = :faturaId', { faturaId: filtros.faturaId });
    }

    if (filtros?.status) {
      query.andWhere('pagamento.status = :status', { status: filtros.status });
    }

    if (filtros?.metodoPagamento) {
      query.andWhere('pagamento.metodoPagamento = :metodoPagamento', {
        metodoPagamento: filtros.metodoPagamento,
      });
    }

    if (filtros?.gateway) {
      query.andWhere('pagamento.gateway = :gateway', { gateway: filtros.gateway });
    }

    if (filtros?.dataInicio) {
      query.andWhere('pagamento.createdAt >= :dataInicio', { dataInicio: filtros.dataInicio });
    }

    if (filtros?.dataFim) {
      query.andWhere('pagamento.createdAt <= :dataFim', { dataFim: filtros.dataFim });
    }

    return query.getMany();
  }

  async buscarPagamentoPorId(id: number, empresaId: string): Promise<Pagamento> {
    const pagamento = await this.pagamentoRepository.findOne({
      where: { id, empresaId },
      relations: ['fatura', 'fatura.contrato'],
    });

    if (!pagamento) {
      throw new NotFoundException('Pagamento no encontrado');
    }

    return pagamento;
  }

  async buscarPagamentoPorTransacao(transacaoId: string, empresaId: string): Promise<Pagamento> {
    const pagamento = await this.pagamentoRepository.findOne({
      where: { transacaoId, empresaId },
      relations: ['fatura', 'fatura.contrato'],
    });

    if (!pagamento) {
      throw new NotFoundException('Pagamento no encontrado');
    }

    return pagamento;
  }

  async buscarPagamentoPorGatewayTransacao(
    gatewayTransacaoId: string,
    empresaId: string,
  ): Promise<Pagamento> {
    const pagamento = await this.pagamentoRepository.findOne({
      where: { gatewayTransacaoId, empresaId },
      relations: ['fatura', 'fatura.contrato'],
    });

    if (!pagamento) {
      throw new NotFoundException('Pagamento no encontrado para esta transao do gateway');
    }

    return pagamento;
  }

  async atualizarPagamento(
    id: number,
    updatePagamentoDto: UpdatePagamentoDto,
    empresaId: string,
  ): Promise<Pagamento> {
    const pagamento = await this.buscarPagamentoPorId(id, empresaId);

    if (pagamento.isAprovado()) {
      throw new BadRequestException('No  possvel alterar pagamento j aprovado');
    }

    Object.assign(pagamento, updatePagamentoDto);

    const pagamentoAtualizado = await this.pagamentoRepository.save(pagamento);
    this.logger.log(`Pagamento atualizado: ${pagamentoAtualizado.transacaoId}`);

    return pagamentoAtualizado;
  }

  async estornarPagamento(id: number, motivo: string, empresaId: string): Promise<Pagamento> {
    const pagamento = await this.buscarPagamentoPorId(id, empresaId);

    if (!pagamento.isAprovado()) {
      await this.registrarAlertaEstornoFalha({
        empresaId,
        pagamentoId: pagamento.id,
        faturaId: pagamento.faturaId,
        transacaoId: pagamento.transacaoId,
        gatewayTransacaoId: pagamento.gatewayTransacaoId || null,
        motivo: motivo || null,
        erro: 'Somente pagamentos aprovados podem ser estornados.',
      });
      throw new BadRequestException('S  possvel estornar pagamentos aprovados');
    }

    // Criar registro de estorno
    const estorno = this.pagamentoRepository.create({
      faturaId: pagamento.faturaId,
      transacaoId: `EST-${pagamento.transacaoId}-${Date.now()}`,
      tipo: TipoPagamento.ESTORNO,
      status: StatusPagamento.APROVADO,
      valor: -pagamento.valor, // Valor negativo para estorno
      taxa: 0,
      valorLiquido: -pagamento.valorLiquido,
      metodoPagamento: pagamento.metodoPagamento,
      gateway: pagamento.gateway,
      observacoes: `Estorno do pagamento ${pagamento.transacaoId}: ${motivo}`,
      dataProcessamento: new Date(),
      dataAprovacao: new Date(),
      empresaId,
    });

    const estornoSalvo = await this.pagamentoRepository.save(estorno);

    // Atualizar status da fatura
    await this.atualizarStatusFatura(pagamento.faturaId, -pagamento.valor, empresaId, {
      correlationId: `estorno-${pagamento.id}-${Date.now()}`,
      origemId: `pagamento:${pagamento.id}`,
      source: 'pagamento.estorno',
    });

    this.logger.log(
      `Estorno criado: ${estornoSalvo.transacaoId} para pagamento ${pagamento.transacaoId}`,
    );

    return estornoSalvo;
  }

  async obterEstatisticasPagamentos(
    filtros: {
      dataInicio?: Date;
      dataFim?: Date;
      gateway?: string;
    } = {},
    empresaId: string,
  ): Promise<{
    totalPagamentos: number;
    valorTotal: number;
    valorLiquido: number;
    taxasTotal: number;
    porMetodo: Record<string, { quantidade: number; valor: number }>;
    porStatus: Record<string, { quantidade: number; valor: number }>;
  }> {
    const query = this.pagamentoRepository
      .createQueryBuilder('pagamento')
      .where('pagamento.tipo = :tipo', { tipo: TipoPagamento.PAGAMENTO })
      .andWhere('pagamento.empresa_id = :empresaId', { empresaId });

    if (filtros?.dataInicio) {
      query.andWhere('pagamento.createdAt >= :dataInicio', { dataInicio: filtros.dataInicio });
    }

    if (filtros?.dataFim) {
      query.andWhere('pagamento.createdAt <= :dataFim', { dataFim: filtros.dataFim });
    }

    if (filtros?.gateway) {
      query.andWhere('pagamento.gateway = :gateway', { gateway: filtros.gateway });
    }

    const pagamentos = await query.getMany();

    const estatisticas = {
      totalPagamentos: pagamentos.length,
      valorTotal: 0,
      valorLiquido: 0,
      taxasTotal: 0,
      porMetodo: {} as Record<string, { quantidade: number; valor: number }>,
      porStatus: {} as Record<string, { quantidade: number; valor: number }>,
    };

    pagamentos.forEach((pagamento) => {
      estatisticas.valorTotal += pagamento.valor;
      estatisticas.valorLiquido += pagamento.valorLiquido;
      estatisticas.taxasTotal += pagamento.taxa;

      // Por mtodo
      if (!estatisticas.porMetodo[pagamento.metodoPagamento]) {
        estatisticas.porMetodo[pagamento.metodoPagamento] = { quantidade: 0, valor: 0 };
      }
      estatisticas.porMetodo[pagamento.metodoPagamento].quantidade++;
      estatisticas.porMetodo[pagamento.metodoPagamento].valor += pagamento.valor;

      // Por status
      if (!estatisticas.porStatus[pagamento.status]) {
        estatisticas.porStatus[pagamento.status] = { quantidade: 0, valor: 0 };
      }
      estatisticas.porStatus[pagamento.status].quantidade++;
      estatisticas.porStatus[pagamento.status].valor += pagamento.valor;
    });

    return estatisticas;
  }

  async obterTrilhaPorCorrelacao(correlationId: string, empresaId: string): Promise<{
    correlationId: string;
    resumo: {
      pagamentos: number;
      faturas: number;
      webhooks: number;
      totalEventos: number;
    };
    pagamentos: Array<Record<string, unknown>>;
    faturas: Array<Record<string, unknown>>;
    webhooks: Array<Record<string, unknown>>;
    geradoEm: string;
  }> {
    const correlationIdNormalizado = this.normalizeTraceId(correlationId);
    if (!correlationIdNormalizado) {
      throw new BadRequestException('correlationId e obrigatorio');
    }

    const pagamentos = await this.pagamentoRepository.find({
      where: { empresaId },
      order: { createdAt: 'DESC' },
    });

    const pagamentosFiltrados = pagamentos
      .filter((pagamento) => {
        const dados = (pagamento.dadosCompletos || {}) as Record<string, unknown>;
        const webhookData =
          dados.webhookData && typeof dados.webhookData === 'object'
            ? (dados.webhookData as Record<string, unknown>)
            : {};

        return (
          this.normalizeTraceId(dados.correlationId) === correlationIdNormalizado ||
          this.normalizeTraceId(webhookData.correlationId) === correlationIdNormalizado
        );
      })
      .map((pagamento) => {
        const dados = (pagamento.dadosCompletos || {}) as Record<string, unknown>;
        const webhookData =
          dados.webhookData && typeof dados.webhookData === 'object'
            ? (dados.webhookData as Record<string, unknown>)
            : {};

        return {
          id: pagamento.id,
          faturaId: pagamento.faturaId,
          transacaoId: pagamento.transacaoId,
          gatewayTransacaoId: pagamento.gatewayTransacaoId,
          status: pagamento.status,
          tipo: pagamento.tipo,
          valor: Number(pagamento.valor || 0),
          criadoEm: pagamento.createdAt,
          processadoEm: pagamento.dataProcessamento,
          correlationId:
            this.normalizeTraceId(dados.correlationId) ||
            this.normalizeTraceId(webhookData.correlationId) ||
            null,
          origemId:
            this.normalizeTraceId(dados.origemId) || this.normalizeTraceId(webhookData.origemId) || null,
        };
      });

    const faturas = await this.faturaRepository.find({
      where: { empresaId },
      order: { createdAt: 'DESC' },
    });

    const faturasFiltradas = faturas
      .map((fatura) => {
        const metadados =
          fatura.metadados && typeof fatura.metadados === 'object'
            ? (fatura.metadados as Record<string, unknown>)
            : {};
        const historico = Array.isArray(metadados.baixasFinanceiras)
          ? (metadados.baixasFinanceiras as Array<Record<string, unknown>>)
          : [];
        const eventosCorrelacionados = historico.filter(
          (evento) => this.normalizeTraceId(evento?.correlationId) === correlationIdNormalizado,
        );

        if (eventosCorrelacionados.length === 0) {
          return null;
        }

        return {
          id: fatura.id,
          numero: fatura.numero,
          status: fatura.status,
          valorTotal: Number(fatura.valorTotal || 0),
          valorPago: Number(fatura.valorPago || 0),
          dataPagamento: fatura.dataPagamento || null,
          eventos: eventosCorrelacionados.map((evento) => ({
            timestamp: evento.timestamp || null,
            origem: evento.origem || null,
            origemId: evento.origemId || null,
            statusAnterior: evento.statusAnterior || null,
            statusNovo: evento.statusNovo || null,
            valorMovimento: Number(evento.valorMovimento || 0),
            correlationId: this.normalizeTraceId(evento.correlationId) || null,
          })),
        };
      })
      .filter(Boolean) as Array<Record<string, unknown>>;

    const webhooks = await this.dataSource.query(
      `
        SELECT
          id,
          gateway,
          idempotency_key,
          event_id,
          request_id,
          referencia_gateway,
          status,
          erro,
          processado_em,
          created_at,
          COALESCE(payload_raw->'_trace'->>'correlationId', payload_raw->>'correlationId') AS correlation_id,
          COALESCE(payload_raw->'_trace'->>'origemId', payload_raw->>'origemId') AS origem_id
        FROM webhooks_gateway_eventos
        WHERE empresa_id = $1
          AND (
            COALESCE(payload_raw->'_trace'->>'correlationId', payload_raw->>'correlationId') = $2
            OR event_id = $2
            OR idempotency_key = $2
          )
        ORDER BY created_at DESC
      `,
      [empresaId, correlationIdNormalizado],
    );

    return {
      correlationId: correlationIdNormalizado,
      resumo: {
        pagamentos: pagamentosFiltrados.length,
        faturas: faturasFiltradas.length,
        webhooks: Array.isArray(webhooks) ? webhooks.length : 0,
        totalEventos:
          pagamentosFiltrados.length + faturasFiltradas.length + (Array.isArray(webhooks) ? webhooks.length : 0),
      },
      pagamentos: pagamentosFiltrados,
      faturas: faturasFiltradas,
      webhooks: Array.isArray(webhooks) ? webhooks : [],
      geradoEm: new Date().toISOString(),
    };
  }

  private mapStatusFaturaParaStatusRecebivel(status: StatusFatura): 'aberto' | 'parcial' | 'baixado' {
    switch (status) {
      case StatusFatura.PAGA:
        return 'baixado';
      case StatusFatura.PARCIALMENTE_PAGA:
        return 'parcial';
      default:
        return 'aberto';
    }
  }

  private appendBaixaFinanceiraMetadados(
    metadadosAtual: unknown,
    payload: {
      statusAnterior: StatusFatura;
      statusNovo: StatusFatura;
      valorTotal: number;
      valorPago: number;
      valorMovimento: number;
      pagamentoCount: number;
      correlationId?: string;
      origemId?: string;
      source?: string;
    },
  ): Record<string, unknown> {
    const metadadosBase =
      metadadosAtual && typeof metadadosAtual === 'object' && !Array.isArray(metadadosAtual)
        ? { ...(metadadosAtual as Record<string, unknown>) }
        : {};

    const historicoAtual = Array.isArray(metadadosBase.baixasFinanceiras)
      ? [...(metadadosBase.baixasFinanceiras as Array<Record<string, unknown>>)]
      : [];

    historicoAtual.push({
      timestamp: new Date().toISOString(),
      origem: payload.source || 'faturamento.pagamento',
      correlationId: payload.correlationId || null,
      origemId: payload.origemId || null,
      statusAnterior: payload.statusAnterior,
      statusNovo: payload.statusNovo,
      valorTotal: payload.valorTotal,
      valorPago: payload.valorPago,
      valorMovimento: payload.valorMovimento,
      quantidadePagamentosAprovados: payload.pagamentoCount,
    });

    const valorEmAberto = Math.max(payload.valorTotal - payload.valorPago, 0);

    metadadosBase.baixasFinanceiras = historicoAtual.slice(-100);
    metadadosBase.recebivel = {
      status: this.mapStatusFaturaParaStatusRecebivel(payload.statusNovo),
      valorTotal: payload.valorTotal,
      valorPago: payload.valorPago,
      valorEmAberto,
      atualizadoEm: new Date().toISOString(),
    };

    return metadadosBase;
  }

  private async atualizarStatusFatura(
    faturaId: number,
    valorPagamento: number,
    empresaId: string,
    contexto?: {
      correlationId?: string;
      origemId?: string;
      source?: string;
    },
  ): Promise<void> {
    const fatura = await this.faturaRepository.findOne({
      where: { id: faturaId, empresaId },
      relations: ['pagamentos'],
    });

    if (!fatura) return;
    const statusAnterior = fatura.status;

    // Calcular total pago (somando apenas pagamentos aprovados)
    const pagamentosAprovados = fatura.pagamentos.filter((p) => p.isAprovado());
    const totalPago = Number(
      pagamentosAprovados
        .reduce((total, p) => total + Number(p.valor || 0), 0)
        .toFixed(2),
    );
    const valorTotalFatura = Number(fatura.valorTotal || 0);

    fatura.valorPago = totalPago;

    // Determinar status baseado no valor pago
    if (totalPago >= valorTotalFatura) {
      fatura.status = StatusFatura.PAGA;
      fatura.dataPagamento = new Date();
    } else if (totalPago > 0) {
      fatura.status = StatusFatura.PARCIALMENTE_PAGA;
    } else {
      fatura.status = StatusFatura.PENDENTE;
      fatura.dataPagamento = null;
    }

    fatura.metadados = this.appendBaixaFinanceiraMetadados(fatura.metadados, {
      statusAnterior,
      statusNovo: fatura.status,
      valorTotal: valorTotalFatura,
      valorPago: totalPago,
      valorMovimento: Number(valorPagamento || 0),
      pagamentoCount: pagamentosAprovados.length,
      correlationId: contexto?.correlationId,
      origemId: contexto?.origemId,
      source: contexto?.source,
    }) as any;

    await this.faturaRepository.save(fatura);
    await this.faturamentoService.sincronizarStatusPropostaPorFaturaId(fatura.id, empresaId, {
      correlationId: contexto?.correlationId,
      origemId: contexto?.origemId,
    });

    this.logEvento('FATURA_STATUS_RECALCULADO', {
      empresaId,
      faturaId: fatura.id,
      numero: fatura.numero,
      statusAnterior,
      statusNovo: fatura.status,
      valorTotal: valorTotalFatura,
      valorPago: totalPago,
      qtdPagamentosAprovados: pagamentosAprovados.length,
      correlationId: contexto?.correlationId || null,
      origemId: contexto?.origemId || null,
    });

    this.logger.log(`Status da fatura ${fatura.numero} atualizado para: ${fatura.status}`);
  }

  private async registrarAlertaEstornoFalha(payload: {
    empresaId: string;
    pagamentoId: number;
    faturaId?: number;
    transacaoId?: string | null;
    gatewayTransacaoId?: string | null;
    motivo?: string | null;
    erro: string;
  }): Promise<void> {
    try {
      const referencia = `estorno:pagamento:${payload.pagamentoId}`;
      const auditoria = [
        {
          acao: 'gerado_automaticamente',
          origem: 'pagamento.estorno',
          erro: payload.erro,
          timestamp: new Date().toISOString(),
        },
      ];

      await this.pagamentoRepository.manager.query(
        `
          INSERT INTO alertas_operacionais_financeiro (
            empresa_id,
            tipo,
            severidade,
            titulo,
            descricao,
            referencia,
            status,
            payload,
            auditoria,
            created_at,
            updated_at
          )
          VALUES (
            $1,
            $2::alertas_operacionais_financeiro_tipo_enum,
            $3::alertas_operacionais_financeiro_severidade_enum,
            $4,
            $5,
            $6,
            'ativo'::alertas_operacionais_financeiro_status_enum,
            $7::jsonb,
            $8::jsonb,
            NOW(),
            NOW()
          )
        `,
        [
          payload.empresaId,
          'estorno_falha',
          'critical',
          'Falha ao processar estorno',
          `Nao foi possivel processar estorno para o pagamento ${payload.transacaoId || payload.pagamentoId}.`,
          referencia,
          JSON.stringify({
            pagamentoId: payload.pagamentoId,
            faturaId: payload.faturaId || null,
            transacaoId: payload.transacaoId || null,
            gatewayTransacaoId: payload.gatewayTransacaoId || null,
            motivo: payload.motivo || null,
            erro: payload.erro,
          }),
          JSON.stringify(auditoria),
        ],
      );
    } catch (error) {
      this.logger.warn(
        `Falha ao registrar alerta de estorno (pagamento=${payload.pagamentoId}): ${
          error?.message || error
        }`,
      );
    }
  }
}

