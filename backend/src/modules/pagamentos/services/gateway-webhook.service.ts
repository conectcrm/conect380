import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, createHmac, timingSafeEqual } from 'crypto';
import { Repository } from 'typeorm';
import {
  ConfiguracaoGateway,
  GatewayProvider,
  GatewayStatus,
} from '../entities/configuracao-gateway.entity';
import {
  GatewayMetodoPagamento,
  GatewayOperacao,
  GatewayTransacaoStatus,
  TransacaoGateway,
} from '../entities/transacao-gateway.entity';
import {
  GatewayWebhookEvento,
  GatewayWebhookEventoStatus,
} from '../entities/gateway-webhook-evento.entity';
import { PagamentoService } from '../../faturamento/services/pagamento.service';
import { StatusPagamento } from '../../faturamento/entities/pagamento.entity';

type WebhookHeaders = {
  signature?: string;
  requestId?: string;
  idempotencyKey?: string;
  eventId?: string;
};

type ProcessarWebhookInput = {
  gatewayParam: string;
  empresaId: string;
  payload: Record<string, unknown>;
  headers: WebhookHeaders;
};

type NormalizedEvent = {
  referenciaGateway: string;
  eventId?: string;
  statusExterno: string;
  statusMapeado: GatewayTransacaoStatus;
  metodoMapeado: GatewayMetodoPagamento;
  valorBruto: number;
  taxa: number;
  valorLiquido: number;
};

@Injectable()
export class GatewayWebhookService {
  private readonly logger = new Logger(GatewayWebhookService.name);

  constructor(
    @InjectRepository(ConfiguracaoGateway)
    private readonly configuracaoRepository: Repository<ConfiguracaoGateway>,
    @InjectRepository(TransacaoGateway)
    private readonly transacaoRepository: Repository<TransacaoGateway>,
    @InjectRepository(GatewayWebhookEvento)
    private readonly webhookEventoRepository: Repository<GatewayWebhookEvento>,
    private readonly pagamentoService: PagamentoService,
  ) {}

  async processarWebhook(input: ProcessarWebhookInput) {
    const gateway = this.parseGateway(input.gatewayParam);
    const configuracao = await this.getConfiguracaoAtiva(input.empresaId, gateway);
    const signature = input.headers.signature || '';

    if (!this.validarAssinatura(input.payload, signature, configuracao.webhookSecret || '')) {
      throw new UnauthorizedException('Assinatura invalida');
    }

    const idempotencyKey = this.resolveIdempotencyKey(
      input.empresaId,
      gateway,
      input.payload,
      input.headers,
    );

    const eventoExistente = await this.webhookEventoRepository.findOne({
      where: { empresaId: input.empresaId, gateway, idempotencyKey },
    });

    if (eventoExistente) {
      this.logger.warn(
        `Webhook duplicado detectado gateway=${gateway} empresa=${input.empresaId} key=${idempotencyKey}`,
      );
      return {
        success: true,
        accepted: true,
        duplicate: true,
        eventId: eventoExistente.eventId || null,
        idempotencyKey,
      };
    }

    const evento = this.webhookEventoRepository.create({
      empresaId: input.empresaId,
      gateway,
      idempotencyKey,
      eventId: this.resolveEventId(input.payload, input.headers),
      requestId: input.headers.requestId,
      status: GatewayWebhookEventoStatus.PROCESSANDO,
      tentativas: 1,
      payloadRaw: input.payload,
    });
    await this.webhookEventoRepository.save(evento);

    try {
      const normalized = this.normalizeEvent(input.payload, input.headers);
      evento.referenciaGateway = normalized.referenciaGateway;
      await this.upsertTransacao(configuracao.id, input.empresaId, normalized, input.payload);
      await this.sincronizarPagamento(input.empresaId, normalized, input.payload);

      evento.status = GatewayWebhookEventoStatus.PROCESSADO;
      evento.processadoEm = new Date();
      evento.erro = null;
      await this.webhookEventoRepository.save(evento);

      return {
        success: true,
        accepted: true,
        duplicate: false,
        eventId: evento.eventId || normalized.eventId || null,
        idempotencyKey,
      };
    } catch (error: unknown) {
      const mensagem = error instanceof Error ? error.message : 'Erro ao processar webhook';
      evento.status = GatewayWebhookEventoStatus.FALHA;
      evento.erro = mensagem;
      await this.webhookEventoRepository.save(evento);

      this.logger.error(
        `Falha ao processar webhook gateway=${gateway} empresa=${input.empresaId} key=${idempotencyKey}: ${mensagem}`,
      );

      throw new InternalServerErrorException(mensagem);
    }
  }

  private parseGateway(value: string): GatewayProvider {
    const normalized = String(value || '')
      .trim()
      .toLowerCase();

    if (normalized === GatewayProvider.MERCADO_PAGO) return GatewayProvider.MERCADO_PAGO;
    if (normalized === GatewayProvider.STRIPE) return GatewayProvider.STRIPE;
    if (normalized === GatewayProvider.PAGSEGURO) return GatewayProvider.PAGSEGURO;

    throw new BadRequestException('Gateway invalido');
  }

  private async getConfiguracaoAtiva(
    empresaId: string,
    gateway: GatewayProvider,
  ): Promise<ConfiguracaoGateway> {
    const configuracao = await this.configuracaoRepository.findOne({
      where: {
        empresa_id: empresaId,
        gateway,
        status: GatewayStatus.ATIVO,
      },
    });

    if (!configuracao) {
      throw new NotFoundException('Configuracao ativa de gateway nao encontrada para a empresa');
    }

    return configuracao;
  }

  private validarAssinatura(
    payload: Record<string, unknown>,
    signatureHeader: string,
    secret: string,
  ): boolean {
    if (!secret?.trim() || !signatureHeader?.trim()) return false;

    const payloadRaw = JSON.stringify(payload || {});
    const expectedHash = createHmac('sha256', secret).update(payloadRaw).digest('hex');
    const candidates = this.extractSignatureCandidates(signatureHeader);

    return candidates.some((candidate) => this.safeCompare(candidate, expectedHash));
  }

  private extractSignatureCandidates(signatureHeader: string): string[] {
    const trimmed = signatureHeader.trim();
    const candidates: string[] = [];

    if (trimmed.includes(',')) {
      const parts = trimmed.split(',').map((part) => part.trim());
      const v1 = parts.find((part) => part.startsWith('v1='))?.slice(3);
      if (v1) candidates.push(v1);
    }

    if (trimmed.startsWith('sha256=')) {
      candidates.push(trimmed.slice(7));
    } else {
      candidates.push(trimmed);
    }

    return candidates.filter((item) => item && /^[a-fA-F0-9]+$/.test(item));
  }

  private safeCompare(received: string, expected: string): boolean {
    const receivedBuffer = Buffer.from(received, 'utf8');
    const expectedBuffer = Buffer.from(expected, 'utf8');

    if (receivedBuffer.length !== expectedBuffer.length) return false;
    return timingSafeEqual(receivedBuffer, expectedBuffer);
  }

  private resolveIdempotencyKey(
    empresaId: string,
    gateway: GatewayProvider,
    payload: Record<string, unknown>,
    headers: WebhookHeaders,
  ): string {
    const rawCandidate =
      headers.idempotencyKey ||
      headers.eventId ||
      this.resolveString(
        payload['eventId'],
        payload['event_id'],
        payload['id'],
        (payload['data'] as Record<string, unknown> | undefined)?.['id'],
      );

    if (rawCandidate) {
      return rawCandidate.slice(0, 180);
    }

    const payloadHash = createHash('sha256')
      .update(`${gateway}:${empresaId}:${JSON.stringify(payload || {})}`)
      .digest('hex');
    return payloadHash;
  }

  private resolveEventId(
    payload: Record<string, unknown>,
    headers: WebhookHeaders,
  ): string | undefined {
    return this.resolveString(
      headers.eventId,
      payload['eventId'],
      payload['event_id'],
      payload['id'],
      (payload['data'] as Record<string, unknown> | undefined)?.['id'],
    )?.slice(0, 180);
  }

  private normalizeEvent(
    payload: Record<string, unknown>,
    headers: WebhookHeaders,
  ): NormalizedEvent {
    const data = (payload['data'] as Record<string, unknown>) || {};

    const referenciaGateway = this.resolveString(
      payload['referenciaGateway'],
      payload['referencia_gateway'],
      payload['reference'],
      payload['external_reference'],
      data['referenciaGateway'],
      data['referencia_gateway'],
      data['reference'],
      data['external_reference'],
      data['id'],
      payload['id'],
    );

    if (!referenciaGateway) {
      throw new BadRequestException('Payload sem referencia de transacao');
    }

    const statusExterno =
      this.resolveString(
        payload['status'],
        payload['payment_status'],
        data['status'],
        payload['action'],
      ) || 'pending';

    const metodoRaw =
      this.resolveString(
        payload['metodo'],
        payload['method'],
        payload['payment_method'],
        data['metodo'],
        data['method'],
        data['payment_method'],
      ) || 'pix';

    const valorBruto = this.toNumber(
      payload['valorBruto'],
      payload['valor_bruto'],
      payload['amount'],
      data['valorBruto'],
      data['valor_bruto'],
      data['amount'],
      data['transaction_amount'],
    );
    const taxa = this.toNumber(payload['taxa'], data['taxa'], payload['fee'], data['fee']);
    const valorLiquido = this.toNumber(
      payload['valorLiquido'],
      payload['valor_liquido'],
      data['valorLiquido'],
      data['valor_liquido'],
    );

    return {
      referenciaGateway,
      eventId: this.resolveEventId(payload, headers),
      statusExterno,
      statusMapeado: this.mapStatus(statusExterno),
      metodoMapeado: this.mapMetodo(metodoRaw),
      valorBruto,
      taxa,
      valorLiquido: valorLiquido > 0 ? valorLiquido : Math.max(valorBruto - taxa, 0),
    };
  }

  private async upsertTransacao(
    configuracaoId: string,
    empresaId: string,
    normalized: NormalizedEvent,
    payloadRaw: Record<string, unknown>,
  ): Promise<void> {
    const existente = await this.transacaoRepository.findOne({
      where: {
        empresa_id: empresaId,
        referenciaGateway: normalized.referenciaGateway,
      },
    });

    if (existente) {
      existente.status = normalized.statusMapeado;
      existente.tipoOperacao = GatewayOperacao.WEBHOOK;
      existente.metodo = normalized.metodoMapeado;
      existente.origem = 'webhook';
      existente.valorBruto = normalized.valorBruto;
      existente.taxa = normalized.taxa;
      existente.valorLiquido = normalized.valorLiquido;
      existente.payloadResposta = {
        ...(existente.payloadResposta || {}),
        webhook: payloadRaw,
      };
      existente.processadoEm = new Date();
      existente.mensagemErro =
        normalized.statusMapeado === GatewayTransacaoStatus.ERRO
          ? normalized.statusExterno
          : undefined;

      await this.transacaoRepository.save(existente);
      return;
    }

    const nova = this.transacaoRepository.create({
      empresa_id: empresaId,
      configuracaoId,
      referenciaGateway: normalized.referenciaGateway,
      status: normalized.statusMapeado,
      tipoOperacao: GatewayOperacao.WEBHOOK,
      metodo: normalized.metodoMapeado,
      origem: 'webhook',
      valorBruto: normalized.valorBruto,
      taxa: normalized.taxa,
      valorLiquido: normalized.valorLiquido,
      payloadEnvio: {},
      payloadResposta: {
        webhook: payloadRaw,
      },
      mensagemErro:
        normalized.statusMapeado === GatewayTransacaoStatus.ERRO
          ? normalized.statusExterno
          : undefined,
      processadoEm: new Date(),
    });

    await this.transacaoRepository.save(nova);
  }

  private mapStatus(statusRaw: string): GatewayTransacaoStatus {
    const value = String(statusRaw || '')
      .trim()
      .toLowerCase();

    if (['approved', 'paid', 'succeeded', 'success'].includes(value)) {
      return GatewayTransacaoStatus.APROVADO;
    }
    if (['pending', 'in_process', 'processing', 'processando'].includes(value)) {
      return GatewayTransacaoStatus.PROCESSANDO;
    }
    if (['rejected', 'declined', 'failed', 'denied', 'refused'].includes(value)) {
      return GatewayTransacaoStatus.RECUSADO;
    }
    if (['cancelled', 'canceled', 'refunded', 'chargeback'].includes(value)) {
      return GatewayTransacaoStatus.CANCELADO;
    }
    if (['error', 'erro', 'invalid'].includes(value)) {
      return GatewayTransacaoStatus.ERRO;
    }
    return GatewayTransacaoStatus.PENDENTE;
  }

  private mapMetodo(value: string): GatewayMetodoPagamento {
    const normalized = String(value || '')
      .trim()
      .toLowerCase();

    if (['pix'].includes(normalized)) return GatewayMetodoPagamento.PIX;
    if (['credit_card', 'cartao_credito', 'card'].includes(normalized)) {
      return GatewayMetodoPagamento.CARTAO_CREDITO;
    }
    if (['debit_card', 'cartao_debito'].includes(normalized)) {
      return GatewayMetodoPagamento.CARTAO_DEBITO;
    }
    if (['boleto', 'ticket'].includes(normalized)) return GatewayMetodoPagamento.BOLETO;
    if (['link_pagamento', 'payment_link'].includes(normalized)) {
      return GatewayMetodoPagamento.LINK_PAGAMENTO;
    }
    if (['transfer', 'transferencia', 'bank_transfer'].includes(normalized)) {
      return GatewayMetodoPagamento.TRANSFERENCIA;
    }
    return GatewayMetodoPagamento.PIX;
  }

  private mapStatusPagamento(status: GatewayTransacaoStatus): StatusPagamento {
    switch (status) {
      case GatewayTransacaoStatus.APROVADO:
        return StatusPagamento.APROVADO;
      case GatewayTransacaoStatus.PROCESSANDO:
        return StatusPagamento.PROCESSANDO;
      case GatewayTransacaoStatus.CANCELADO:
        return StatusPagamento.CANCELADO;
      case GatewayTransacaoStatus.RECUSADO:
      case GatewayTransacaoStatus.ERRO:
        return StatusPagamento.REJEITADO;
      case GatewayTransacaoStatus.PENDENTE:
      default:
        return StatusPagamento.PENDENTE;
    }
  }

  private async sincronizarPagamento(
    empresaId: string,
    normalized: NormalizedEvent,
    payloadRaw: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.pagamentoService.processarPagamento(
        {
          gatewayTransacaoId: normalized.referenciaGateway,
          novoStatus: this.mapStatusPagamento(normalized.statusMapeado),
          motivoRejeicao:
            normalized.statusMapeado === GatewayTransacaoStatus.RECUSADO ||
            normalized.statusMapeado === GatewayTransacaoStatus.ERRO
              ? normalized.statusExterno
              : undefined,
          webhookData: payloadRaw,
        },
        empresaId,
      );
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        this.logger.log(
          `Nenhum pagamento vinculado para referencia=${normalized.referenciaGateway} empresa=${empresaId}`,
        );
        return;
      }

      throw error;
    }
  }

  private resolveString(...values: unknown[]): string | undefined {
    for (const item of values) {
      if (typeof item === 'string' && item.trim()) {
        return item.trim();
      }
      if (typeof item === 'number' && Number.isFinite(item)) {
        return String(item);
      }
    }
    return undefined;
  }

  private toNumber(...values: unknown[]): number {
    for (const item of values) {
      const parsed = Number(item);
      if (Number.isFinite(parsed)) return parsed;
    }
    return 0;
  }
}
