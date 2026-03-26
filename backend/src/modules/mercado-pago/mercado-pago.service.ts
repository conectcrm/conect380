import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { MercadoPagoConfig, Customer, Preference, Payment } from 'mercadopago';
import * as crypto from 'crypto';
import { Repository } from 'typeorm';
import {
  AssinaturaEmpresa,
  CanonicalAssinaturaStatus,
  toCanonicalAssinaturaStatus,
} from '../planos/entities/assinatura-empresa.entity';
import { canTransitionSubscriptionStatus } from '../planos/subscription-state-machine';
import { runWithTenant } from '../../common/tenant/tenant-context';
import { BillingEvent } from '../faturamento/entities/billing-event.entity';
import { Fatura, FormaPagamento } from '../faturamento/entities/fatura.entity';
import { Pagamento, StatusPagamento, TipoPagamento } from '../faturamento/entities/pagamento.entity';
import { PagamentoService } from '../faturamento/services/pagamento.service';

type ReconciliationSource = 'manual' | 'batch' | 'webhook_duplicate';
type ReconciliationAction = 'updated' | 'aligned' | 'skipped' | 'error';
type ExternalReferenceResolution =
  | { kind: 'assinatura'; empresaId: string; assinaturaId: string }
  | { kind: 'fatura'; empresaId: string; faturaId: number; referenciaGateway: string };

export type PaymentReconciliationResult = {
  paymentId: string;
  source: ReconciliationSource;
  action: ReconciliationAction;
  paymentStatus?: string;
  empresaId?: string;
  assinaturaId?: string;
  fromStatus?: CanonicalAssinaturaStatus;
  toStatus?: CanonicalAssinaturaStatus;
  reason?: string;
};

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private mercadoPago: MercadoPagoConfig;
  private customerApi: Customer;
  private preferenceApi: Preference;
  private paymentApi: Payment;

  constructor(
    private configService: ConfigService,
    @InjectRepository(AssinaturaEmpresa)
    private readonly assinaturaRepository: Repository<AssinaturaEmpresa>,
    @InjectRepository(BillingEvent)
    private readonly billingEventRepository: Repository<BillingEvent>,
    @InjectRepository(Fatura)
    private readonly faturaRepository: Repository<Fatura>,
    @InjectRepository(Pagamento)
    private readonly pagamentoRepository: Repository<Pagamento>,
    @Inject(forwardRef(() => PagamentoService))
    private readonly pagamentoService: PagamentoService,
  ) {
    this.initializeMercadoPago();
  }

  private parseExternalReference(externalReference?: string):
    | { empresaId: string; assinaturaId: string }
    | null {
    if (!externalReference || typeof externalReference !== 'string') {
      return null;
    }

    const match =
      /^conectcrm:empresa:([0-9a-f-]{36}):assinatura:([0-9a-f-]{36})$/i.exec(externalReference);

    if (!match) {
      return null;
    }

    return { empresaId: match[1], assinaturaId: match[2] };
  }

  private parseFaturaExternalReference(
    externalReference?: string,
  ): { empresaId: string; faturaId: number; referenciaGateway: string } | null {
    if (!externalReference || typeof externalReference !== 'string') {
      return null;
    }

    const valorNormalizado = externalReference.trim();
    const match = /^fatura:([0-9a-f-]{36}):(\d+)$/i.exec(valorNormalizado);

    if (!match) {
      return null;
    }

    const faturaId = Number.parseInt(match[2], 10);
    if (!Number.isInteger(faturaId) || faturaId <= 0) {
      return null;
    }

    return {
      empresaId: match[1],
      faturaId,
      referenciaGateway: valorNormalizado,
    };
  }

  private resolveExternalReference(externalReference?: string): ExternalReferenceResolution | null {
    const assinatura = this.parseExternalReference(externalReference);
    if (assinatura) {
      return { kind: 'assinatura', ...assinatura };
    }

    const fatura = this.parseFaturaExternalReference(externalReference);
    if (fatura) {
      return { kind: 'fatura', ...fatura };
    }

    return null;
  }

  private resolveWebhookResourceId(webhookData: any): string | undefined {
    const directId = webhookData?.data?.id ?? webhookData?.id;
    if (directId !== undefined && directId !== null) {
      return String(directId);
    }

    const resource = webhookData?.resource;
    if (typeof resource !== 'string' || !resource.trim()) {
      return undefined;
    }

    const candidate = resource
      .trim()
      .split('?')[0]
      .split('/')
      .filter(Boolean)
      .pop();

    if (!candidate) {
      return undefined;
    }

    try {
      return decodeURIComponent(candidate);
    } catch {
      return candidate;
    }
  }

  private async registerPaymentWebhookEvent(
    payment: any,
    action: string,
    resolvedReference?: ExternalReferenceResolution | null,
  ): Promise<boolean> {
    const resolved =
      resolvedReference || this.resolveExternalReference(payment?.external_reference);
    if (!resolved) {
      return false;
    }

    const paymentStatus = String(payment?.status || 'unknown')
      .trim()
      .toLowerCase();
    const paymentAction = String(action || 'updated')
      .trim()
      .toLowerCase();

    const aggregateId = `${payment?.id || 'unknown'}:${paymentStatus}:${paymentAction}`.slice(0, 120);
    const correlationId = `mp:${payment?.id || 'unknown'}:${paymentAction}`.slice(0, 120);

    try {
      await this.billingEventRepository.insert({
        empresaId: resolved.empresaId,
        aggregateType: 'mercadopago.payment.webhook',
        aggregateId,
        eventType: 'received',
        source: 'mercadopago',
        status: 'processed',
        payload: {
          paymentId: payment?.id || null,
          paymentStatus,
          action: paymentAction,
          referenciaTipo: resolved.kind,
          assinaturaId: resolved.kind === 'assinatura' ? resolved.assinaturaId : null,
          faturaId: resolved.kind === 'fatura' ? resolved.faturaId : null,
        },
        correlationId,
      });

      return false;
    } catch (error) {
      if ((error as any)?.code === '23505') {
        this.logger.warn(
          `Webhook duplicado ignorado payment=${payment?.id} status=${paymentStatus} action=${paymentAction}`,
        );
        return true;
      }

      throw error;
    }
  }

  private toBoundedInteger(value: unknown, fallback: number, min: number, max: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    const rounded = Math.floor(parsed);
    return Math.min(Math.max(rounded, min), max);
  }

  private mapPaymentStatusToSubscriptionStatus(
    paymentStatusRaw: unknown,
  ): CanonicalAssinaturaStatus | undefined {
    const paymentStatus = String(paymentStatusRaw || '')
      .trim()
      .toLowerCase();

    if (!paymentStatus) {
      return undefined;
    }

    if (
      [
        'approved',
        'authorized',
        'paid',
        'succeeded',
        'success',
      ].includes(paymentStatus)
    ) {
      return 'active';
    }

    if (
      ['rejected', 'refused', 'denied', 'cancelled', 'canceled'].includes(
        paymentStatus,
      )
    ) {
      return 'past_due';
    }

    if (['refunded', 'charged_back', 'chargeback'].includes(paymentStatus)) {
      return 'suspended';
    }

    return undefined;
  }

  private mapPaymentStatusToInvoicePaymentStatus(
    paymentStatusRaw: unknown,
  ): StatusPagamento | undefined {
    const paymentStatus = String(paymentStatusRaw || '')
      .trim()
      .toLowerCase();

    if (!paymentStatus) {
      return undefined;
    }

    if (['approved', 'authorized', 'paid', 'succeeded', 'success'].includes(paymentStatus)) {
      return StatusPagamento.APROVADO;
    }

    if (['pending'].includes(paymentStatus)) {
      return StatusPagamento.PENDENTE;
    }

    if (['in_process', 'in_mediation', 'processing', 'under_review'].includes(paymentStatus)) {
      return StatusPagamento.PROCESSANDO;
    }

    if (['rejected', 'refused', 'denied'].includes(paymentStatus)) {
      return StatusPagamento.REJEITADO;
    }

    if (['cancelled', 'canceled'].includes(paymentStatus)) {
      return StatusPagamento.CANCELADO;
    }

    if (['refunded', 'charged_back', 'chargeback'].includes(paymentStatus)) {
      return StatusPagamento.ESTORNADO;
    }

    return undefined;
  }

  private extractPaymentAmount(payment: any): number {
    const candidates = [
      payment?.transaction_amount,
      payment?.transaction_details?.total_paid_amount,
      payment?.transaction_details?.net_received_amount,
    ];

    for (const candidate of candidates) {
      const parsed = Number(candidate);
      if (Number.isFinite(parsed) && parsed > 0) {
        return Number(parsed.toFixed(2));
      }
    }

    return 0;
  }

  private isPagamentoNotFoundError(error: unknown): boolean {
    if (error instanceof NotFoundException) {
      return true;
    }
    const mensagem = String((error as any)?.message || '').toLowerCase();
    return mensagem.includes('pagamento') && mensagem.includes('encontr');
  }

  private gerarTransacaoPagamentoWebhook(paymentId: string): string {
    const normalizado = String(paymentId || 'mp')
      .replace(/[^a-z0-9_-]/gi, '')
      .slice(0, 32)
      .toUpperCase();
    const sufixo = Date.now().toString(36).toUpperCase();
    return `MP-${normalizado || 'WEBHOOK'}-${sufixo}`;
  }

  private async garantirPagamentoPendenteFatura(params: {
    empresaId: string;
    faturaId: number;
    referenciaGateway: string;
    payment: any;
  }): Promise<void> {
    const { empresaId, faturaId, referenciaGateway, payment } = params;
    const existente = await this.pagamentoRepository.findOne({
      where: { empresaId, faturaId, gatewayTransacaoId: referenciaGateway },
    });
    if (existente) {
      return;
    }

    const fatura = await this.faturaRepository.findOne({
      where: { id: faturaId, empresaId },
    });
    if (!fatura) {
      throw new NotFoundException(`Fatura ${faturaId} nao encontrada para empresa ${empresaId}`);
    }

    const valorRestante = Number(
      Math.max(Number(fatura.valorTotal || 0) - Number(fatura.valorPago || 0), 0).toFixed(2),
    );
    const valorGateway = this.extractPaymentAmount(payment);
    const valorPagamento = valorGateway > 0 ? valorGateway : valorRestante || Number(fatura.valorTotal || 0);

    const pagamento = this.pagamentoRepository.create({
      empresaId,
      faturaId,
      transacaoId: this.gerarTransacaoPagamentoWebhook(payment?.id),
      tipo: TipoPagamento.PAGAMENTO,
      status: StatusPagamento.PENDENTE,
      valor: Number(valorPagamento.toFixed(2)),
      taxa: 0,
      valorLiquido: Number(valorPagamento.toFixed(2)),
      metodoPagamento: String(fatura.formaPagamentoPreferida || FormaPagamento.A_COMBINAR),
      gateway: 'mercadopago',
      gatewayTransacaoId: referenciaGateway,
      gatewayStatusRaw: String(payment?.status || 'pending'),
      dadosCompletos: {
        externalReference: referenciaGateway,
        mercadoPagoPaymentId: String(payment?.id || ''),
        origem: 'mercadopago.webhook',
      } as any,
      observacoes: `Pagamento criado automaticamente via webhook Mercado Pago (${payment?.id || 'n/a'}).`,
      dataProcessamento: new Date(),
    });

    await this.pagamentoRepository.save(pagamento);
  }

  private async reconcileInvoiceFromPayment(
    payment: any,
    action: string,
    resolvedReference: Extract<ExternalReferenceResolution, { kind: 'fatura' }>,
  ): Promise<void> {
    const novoStatus = this.mapPaymentStatusToInvoicePaymentStatus(payment?.status);
    if (!novoStatus) {
      this.logger.log(
        `Webhook Mercado Pago payment=${payment?.id} com status nao mapeado para faturamento (${payment?.status || 'unknown'})`,
      );
      return;
    }

    const paymentId = String(payment?.id || '').trim() || 'unknown';
    const correlationId = `mp:${paymentId}:${String(action || 'updated').trim().toLowerCase()}`.slice(
      0,
      180,
    );
    const origemId = `mercadopago:webhook:${paymentId}`.slice(0, 180);

    const dto = {
      gatewayTransacaoId: resolvedReference.referenciaGateway,
      novoStatus,
      motivoRejeicao:
        novoStatus === StatusPagamento.REJEITADO
          ? String(payment?.status_detail || payment?.status || 'rejeitado')
          : undefined,
      webhookData: payment,
      correlationId,
      origemId,
    };

    await runWithTenant(resolvedReference.empresaId, async () => {
      try {
        await this.pagamentoService.processarPagamento(dto as any, resolvedReference.empresaId);
      } catch (error) {
        if (!this.isPagamentoNotFoundError(error)) {
          throw error;
        }

        await this.garantirPagamentoPendenteFatura({
          empresaId: resolvedReference.empresaId,
          faturaId: resolvedReference.faturaId,
          referenciaGateway: resolvedReference.referenciaGateway,
          payment,
        });

        await this.pagamentoService.processarPagamento(dto as any, resolvedReference.empresaId);
      }
    });
  }

  private async appendReconciliationBillingEvent(
    result: PaymentReconciliationResult,
  ): Promise<void> {
    if (!result.empresaId) {
      return;
    }

    const aggregateId = `${result.assinaturaId || 'unknown'}:${result.paymentId}:${result.action}`.slice(
      0,
      120,
    );

    await this.billingEventRepository.insert({
      empresaId: result.empresaId,
      aggregateType: 'mercadopago.payment.reconciliation',
      aggregateId,
      eventType: result.action,
      source: 'mercadopago.reconcile',
      status: result.action === 'error' ? 'failed' : 'processed',
      payload: {
        paymentId: result.paymentId,
        paymentStatus: result.paymentStatus || null,
        assinaturaId: result.assinaturaId || null,
        fromStatus: result.fromStatus || null,
        toStatus: result.toStatus || null,
        reason: result.reason || null,
        trigger: result.source,
      },
      correlationId: `mp-reconcile:${result.paymentId}`.slice(0, 120),
    });
  }

  private async reconcileSubscriptionFromPayment(
    payment: any,
    source: ReconciliationSource,
  ): Promise<PaymentReconciliationResult> {
    const paymentId = String(payment?.id || '').trim();
    const paymentStatus = String(payment?.status || '')
      .trim()
      .toLowerCase();
    const resolved = this.parseExternalReference(payment?.external_reference);

    if (!paymentId) {
      return {
        paymentId: 'unknown',
        source,
        action: 'skipped',
        paymentStatus,
        reason: 'payment_without_id',
      };
    }

    if (!resolved) {
      return {
        paymentId,
        source,
        action: 'skipped',
        paymentStatus,
        reason: 'external_reference_unrecognized',
      };
    }

    const { empresaId, assinaturaId } = resolved;
    const targetStatus = this.mapPaymentStatusToSubscriptionStatus(paymentStatus);

    if (!targetStatus) {
      const unsupportedResult: PaymentReconciliationResult = {
        paymentId,
        source,
        action: 'skipped',
        paymentStatus,
        empresaId,
        assinaturaId,
        reason: 'payment_status_without_subscription_mapping',
      };

      await this.appendReconciliationBillingEvent(unsupportedResult);
      return unsupportedResult;
    }

    let result: PaymentReconciliationResult = {
      paymentId,
      source,
      action: 'skipped',
      paymentStatus,
      empresaId,
      assinaturaId,
      toStatus: targetStatus,
      reason: 'subscription_not_found',
    };

    await runWithTenant(empresaId, async () => {
      const assinatura = await this.assinaturaRepository.findOne({
        where: { id: assinaturaId },
      });

      if (!assinatura) {
        result = {
          paymentId,
          source,
          action: 'skipped',
          paymentStatus,
          empresaId,
          assinaturaId,
          toStatus: targetStatus,
          reason: 'subscription_not_found',
        };
        return;
      }

      const currentStatus = toCanonicalAssinaturaStatus(assinatura.status);

      if (currentStatus === targetStatus) {
        result = {
          paymentId,
          source,
          action: 'aligned',
          paymentStatus,
          empresaId,
          assinaturaId,
          fromStatus: currentStatus,
          toStatus: targetStatus,
          reason: 'already_aligned',
        };
        return;
      }

      if (!canTransitionSubscriptionStatus(currentStatus, targetStatus)) {
        result = {
          paymentId,
          source,
          action: 'skipped',
          paymentStatus,
          empresaId,
          assinaturaId,
          fromStatus: currentStatus,
          toStatus: targetStatus,
          reason: 'invalid_transition',
        };
        return;
      }

      const now = new Date();
      if (targetStatus === 'active') {
        const proximoVencimento = new Date(now);
        proximoVencimento.setMonth(proximoVencimento.getMonth() + 1);

        assinatura.dataInicio = now;
        assinatura.dataFim = null;
        assinatura.proximoVencimento = proximoVencimento;
        assinatura.renovacaoAutomatica = true;
      }

      assinatura.status = targetStatus;

      const observacao = `Reconciliada via ${source} (MP payment ${paymentId}) ${currentStatus} -> ${targetStatus} em ${now.toISOString()}`;
      assinatura.observacoes = assinatura.observacoes
        ? `${assinatura.observacoes}\n${observacao}`
        : observacao;

      await this.assinaturaRepository.save(assinatura);

      result = {
        paymentId,
        source,
        action: 'updated',
        paymentStatus,
        empresaId,
        assinaturaId,
        fromStatus: currentStatus,
        toStatus: targetStatus,
      };
    });

    await this.appendReconciliationBillingEvent(result);
    return result;
  }

  async reconcilePaymentById(
    paymentIdRaw: string,
    source: ReconciliationSource = 'manual',
  ): Promise<PaymentReconciliationResult> {
    const paymentId = String(paymentIdRaw || '').trim();
    if (!paymentId) {
      return {
        paymentId: 'unknown',
        source,
        action: 'skipped',
        reason: 'missing_payment_id',
      };
    }

    try {
      const payment = await this.getPayment(paymentId);
      return await this.reconcileSubscriptionFromPayment(payment, source);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'failed_to_fetch_payment_from_provider';
      this.logger.warn(`Reconciliacao falhou para payment ${paymentId}: ${message}`);
      return {
        paymentId,
        source,
        action: 'error',
        reason: message,
      };
    }
  }

  async reconcileRecentPayments(options?: { lookbackHours?: number; limit?: number }) {
    const lookbackHours = this.toBoundedInteger(options?.lookbackHours, 72, 1, 24 * 30);
    const limit = this.toBoundedInteger(options?.limit, 100, 1, 500);

    const rows = await this.billingEventRepository.manager.query(
      `
        WITH candidates AS (
          SELECT
            payload->>'paymentId' AS payment_id,
            MAX(created_at) AS last_seen_at
          FROM billing_events
          WHERE aggregate_type = $1
            AND event_type = $2
            AND created_at >= NOW() - ($3::int * INTERVAL '1 hour')
          GROUP BY payload->>'paymentId'
        )
        SELECT payment_id
        FROM candidates
        WHERE payment_id IS NOT NULL
          AND payment_id <> ''
        ORDER BY last_seen_at DESC
        LIMIT $4
      `,
      ['mercadopago.payment.webhook', 'received', lookbackHours, limit],
    );

    const paymentIds = Array.from(
      new Set(
        (Array.isArray(rows) ? rows : [])
          .map((item: any) => String(item?.payment_id || '').trim())
          .filter(Boolean),
      ),
    );

    const results: PaymentReconciliationResult[] = [];
    let updated = 0;
    let aligned = 0;
    let skipped = 0;
    let errors = 0;

    for (const paymentId of paymentIds) {
      const result = await this.reconcilePaymentById(paymentId, 'batch');
      results.push(result);

      if (result.action === 'updated') {
        updated += 1;
      } else if (result.action === 'aligned') {
        aligned += 1;
      } else if (result.action === 'error') {
        errors += 1;
      } else {
        skipped += 1;
      }
    }

    return {
      lookbackHours,
      limit,
      candidates: paymentIds.length,
      processed: results.length,
      updated,
      aligned,
      skipped,
      errors,
      results,
    };
  }

  private initializeMercadoPago() {
    const accessToken = this.configService.get<string>('MERCADO_PAGO_ACCESS_TOKEN');

    if (!accessToken) {
      this.logger.warn('Access Token do Mercado Pago não configurado');
      return;
    }

    try {
      this.mercadoPago = new MercadoPagoConfig({
        accessToken,
        options: {
          timeout: 5000,
          idempotencyKey: 'DEV',
        },
      });

      this.customerApi = new Customer(this.mercadoPago);
      this.preferenceApi = new Preference(this.mercadoPago);
      this.paymentApi = new Payment(this.mercadoPago);

      this.logger.log('Mercado Pago inicializado com sucesso');
    } catch (error) {
      this.logger.error('Erro ao inicializar Mercado Pago:', error);
    }
  }

  private isMockMode(): boolean {
    const raw = this.configService.get<string>('MERCADO_PAGO_MOCK');
    return raw === 'true' || raw === '1';
  }

  private isProductionEnvironment(): boolean {
    const nodeEnv = String(this.configService.get<string>('NODE_ENV') || '')
      .trim()
      .toLowerCase();
    const appEnv = String(this.configService.get<string>('APP_ENV') || '')
      .trim()
      .toLowerCase();

    return nodeEnv === 'production' || appEnv === 'production';
  }

  public assertCheckoutReady(): void {
    if (this.preferenceApi || this.isMockMode()) {
      return;
    }

    throw new ServiceUnavailableException(
      'Checkout Mercado Pago indisponivel. Configure MERCADO_PAGO_ACCESS_TOKEN ou habilite MERCADO_PAGO_MOCK em desenvolvimento.',
    );
  }

  private buildMockPreference() {
    const id = `mock_pref_${crypto.randomBytes(8).toString('hex')}`;
    const initPoint = `https://mercadopago.mock/checkout/${id}`;

    return {
      id,
      init_point: initPoint,
      sandbox_init_point: initPoint,
    };
  }

  private buildMockPayment(paymentId: string) {
    const prefix = 'mock:';
    if (typeof paymentId !== 'string' || !paymentId.startsWith(prefix)) {
      return null;
    }

    const encodedExternalReference = paymentId.slice(prefix.length);

    let externalReference: string;
    try {
      externalReference = decodeURIComponent(encodedExternalReference);
    } catch {
      externalReference = encodedExternalReference;
    }

    return {
      id: paymentId,
      status: 'approved',
      external_reference: externalReference,
    };
  }

  private buildMockSubscriptionPreapproval(subscriptionId: string) {
    const prefix = 'mock-sub:';
    if (typeof subscriptionId !== 'string' || !subscriptionId.startsWith(prefix)) {
      return null;
    }

    const rawPayload = subscriptionId.slice(prefix.length);
    let status = 'authorized';
    let encodedExternalReference = rawPayload;

    const separatorIndex = rawPayload.indexOf(':');
    if (separatorIndex > 0) {
      status = rawPayload.slice(0, separatorIndex).trim().toLowerCase() || 'authorized';
      encodedExternalReference = rawPayload.slice(separatorIndex + 1);
    }

    let externalReference: string;
    try {
      externalReference = decodeURIComponent(encodedExternalReference);
    } catch {
      externalReference = encodedExternalReference;
    }

    return {
      id: subscriptionId,
      status,
      external_reference: externalReference,
    };
  }

  private mapSubscriptionWebhookStatusToCanonical(
    providerStatusRaw: unknown,
  ): CanonicalAssinaturaStatus | undefined {
    const providerStatus = String(providerStatusRaw || '')
      .trim()
      .toLowerCase();

    if (!providerStatus) {
      return undefined;
    }

    if (['authorized', 'active'].includes(providerStatus)) {
      return 'active';
    }

    if (['pending', 'in_process'].includes(providerStatus)) {
      return 'trial';
    }

    if (['paused'].includes(providerStatus)) {
      return 'suspended';
    }

    if (['cancelled', 'canceled'].includes(providerStatus)) {
      return 'canceled';
    }

    if (['rejected', 'failed'].includes(providerStatus)) {
      return 'past_due';
    }

    return undefined;
  }

  private async getSubscriptionPreapproval(subscriptionId: string) {
    if (!subscriptionId) {
      throw new Error('Identificador da assinatura nao informado para webhook de preapproval.');
    }

    if (this.isMockMode()) {
      const mockSubscription = this.buildMockSubscriptionPreapproval(subscriptionId);
      if (mockSubscription) {
        this.logger.warn(
          `Mercado Pago em modo MOCK: retornando assinatura simulada para id=${subscriptionId}`,
        );
        return mockSubscription;
      }
    }

    const accessToken = this.configService.get<string>('MERCADO_PAGO_ACCESS_TOKEN');
    if (!accessToken) {
      throw new ServiceUnavailableException(
        'Mercado Pago nao inicializado. Configure MERCADO_PAGO_ACCESS_TOKEN.',
      );
    }

    const response = await fetch(
      `https://api.mercadopago.com/preapproval/${encodeURIComponent(subscriptionId)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      const errorPayload = await response.text();
      throw new Error(
        `Falha ao consultar assinatura ${subscriptionId} no Mercado Pago (${response.status}): ${errorPayload.slice(
          0,
          240,
        )}`,
      );
    }

    return response.json();
  }

  async createCustomer(customerData: any) {
    try {
      const customer = await this.customerApi.create({
        body: {
          email: customerData.email,
          first_name: customerData.first_name,
          last_name: customerData.last_name,
          phone: customerData.phone,
          identification: customerData.identification,
          address: customerData.address,
          date_registered: new Date().toISOString(),
          description: `Cliente ConectCRM - ${customerData.email}`,
          default_address: customerData.address ? customerData.address.street_name : undefined,
          default_card: undefined,
        },
      });

      this.logger.log(`Cliente criado: ${customer.id}`);
      return customer;
    } catch (error) {
      this.logger.error('Erro ao criar cliente:', error);
      throw error;
    }
  }

  async getCustomer(customerId: string) {
    try {
      const customer = await this.customerApi.get({ customerId });
      return customer;
    } catch (error) {
      this.logger.error('Erro ao buscar cliente:', error);
      throw error;
    }
  }

  async createPreference(preferenceData: any) {
    try {
      this.assertCheckoutReady();

      if (!this.preferenceApi) {
        if (this.isMockMode()) {
          this.logger.warn(
            'Mercado Pago em modo MOCK: criando preferência fake (sem chamada externa)',
          );
          return this.buildMockPreference();
        }

        throw new Error(
          'Mercado Pago não inicializado. Configure MERCADO_PAGO_ACCESS_TOKEN ou habilite MERCADO_PAGO_MOCK=true para desenvolvimento.',
        );
      }

      const preference = await this.preferenceApi.create({
        body: {
          items: preferenceData.items,
          payer: {
            name: preferenceData.payer.name,
            surname: preferenceData.payer.surname,
            email: preferenceData.payer.email,
            phone: preferenceData.payer.phone,
            identification: preferenceData.payer.identification,
            address: preferenceData.payer.address,
          },
          back_urls: preferenceData.back_urls,
          auto_return: preferenceData.auto_return,
          payment_methods: preferenceData.payment_methods,
          notification_url: preferenceData.notification_url,
          statement_descriptor: preferenceData.statement_descriptor,
          external_reference: preferenceData.external_reference,
          expires: preferenceData.expires,
          expiration_date_from: preferenceData.expiration_date_from,
          expiration_date_to: preferenceData.expiration_date_to,
          date_of_expiration: preferenceData.expiration_date_to,
          metadata: {
            origem: 'ConectCRM',
            timestamp: new Date().toISOString(),
          },
        },
      });

      this.logger.log(`Preferência criada: ${preference.id}`);
      return preference;
    } catch (error) {
      this.logger.error('Erro ao criar preferência:', error);
      throw error;
    }
  }

  async createPixPayment(paymentData: any) {
    try {
      const payment = await this.paymentApi.create({
        body: {
          transaction_amount: paymentData.transaction_amount,
          description: paymentData.description,
          payment_method_id: 'pix',
          payer: {
            email: paymentData.payer.email,
            first_name: paymentData.payer.first_name,
            last_name: paymentData.payer.last_name,
            identification: paymentData.payer.identification,
          },
          external_reference: paymentData.external_reference,
          notification_url: paymentData.notification_url,
          date_of_expiration: paymentData.date_of_expiration,
          metadata: {
            origem: 'ConectCRM',
            tipo: 'PIX',
            timestamp: new Date().toISOString(),
          },
        },
      });

      this.logger.log(`Pagamento PIX criado: ${payment.id}`);
      return payment;
    } catch (error) {
      this.logger.error('Erro ao criar pagamento PIX:', error);
      throw error;
    }
  }

  async createCardPayment(paymentData: any) {
    try {
      const payment = await this.paymentApi.create({
        body: {
          transaction_amount: paymentData.transaction_amount,
          token: paymentData.token,
          description: paymentData.description,
          installments: paymentData.installments,
          payment_method_id: paymentData.payment_method_id,
          issuer_id: paymentData.issuer_id,
          payer: {
            email: paymentData.payer.email,
            identification: paymentData.payer.identification,
          },
          external_reference: paymentData.external_reference,
          notification_url: paymentData.notification_url,
          statement_descriptor: 'ConectCRM',
          metadata: {
            origem: 'ConectCRM',
            tipo: 'Cartão',
            parcelas: paymentData.installments,
            timestamp: new Date().toISOString(),
          },
        },
      });

      this.logger.log(`Pagamento com cartão criado: ${payment.id}`);
      return payment;
    } catch (error) {
      this.logger.error('Erro ao criar pagamento com cartão:', error);
      throw error;
    }
  }

  async getPayment(paymentId: string) {
    try {
      if (!this.paymentApi) {
        if (this.isMockMode()) {
          const mockPayment = this.buildMockPayment(paymentId);

          if (!mockPayment) {
            throw new Error(
              'Mercado Pago em modo MOCK: para simular webhook use data.id no formato mock:<external_reference_urlencoded>.',
            );
          }

          this.logger.warn(
            `Mercado Pago em modo MOCK: retornando pagamento aprovado para id=${paymentId}`,
          );
          return mockPayment;
        }

        throw new ServiceUnavailableException(
          'Mercado Pago nao inicializado. Configure MERCADO_PAGO_ACCESS_TOKEN.',
        );
      }

      const payment = await this.paymentApi.get({ id: paymentId });
      return payment;
    } catch (error) {
      this.logger.error('Erro ao buscar pagamento:', error);
      throw error;
    }
  }

  async refundPayment(paymentId: string, amount?: number) {
    try {
      // Usar a nova API do Mercado Pago
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}/refunds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          amount: amount,
          metadata: {
            origem: 'ConectCRM',
            timestamp: new Date().toISOString(),
          },
        }),
      });

      const refund = await response.json();
      this.logger.log(
        `Estorno criado para pagamento ${paymentId}: ${refund.id || 'ID não disponível'}`,
      );
      return refund;
    } catch (error) {
      this.logger.error('Erro ao estornar pagamento:', error);
      throw error;
    }
  }

  async validateWebhookSignature(
    body: any,
    signature: string,
    requestId: string,
  ): Promise<boolean> {
    try {
      const webhookSecret = this.configService.get<string>('MERCADO_PAGO_WEBHOOK_SECRET');

      if (!webhookSecret) {
        if (this.isProductionEnvironment()) {
          this.logger.error(
            'MERCADO_PAGO_WEBHOOK_SECRET nao configurado em producao. Webhook rejeitado por seguranca.',
          );
          return false;
        }

        this.logger.warn(
          'Webhook secret nao configurado, pulando validacao (ambiente nao producao)',
        );
        return true;
      }

      // Extrair timestamp e hash da assinatura
      const signatureParts = signature.split(',');
      const timestamp = signatureParts.find((part) => part.startsWith('ts='))?.split('=')[1];
      const hash = signatureParts.find((part) => part.startsWith('v1='))?.split('=')[1];

      if (!timestamp || !hash) {
        return false;
      }

      // Construir string para validação
      const dataString = `id:${body.data?.id};request-id:${requestId};ts:${timestamp};`;

      // Calcular HMAC
      const hmac = crypto.createHmac('sha256', webhookSecret);
      hmac.update(dataString);
      const expectedHash = hmac.digest('hex');

      return expectedHash === hash;
    } catch (error) {
      this.logger.error('Erro ao validar assinatura do webhook:', error);
      return false;
    }
  }

  async processWebhook(webhookData: any) {
    try {
      const typeRaw = String(webhookData?.type || webhookData?.topic || '')
        .trim()
        .toLowerCase();
      const action = String(webhookData?.action || 'updated');
      const resourceId = this.resolveWebhookResourceId(webhookData);

      this.logger.log(`Processando webhook: ${typeRaw || 'unknown'} - ${action}`);

      switch (typeRaw) {
        case 'payment':
          await this.handlePaymentWebhook(resourceId || '', action);
          break;

        case 'plan':
          await this.handlePlanWebhook(resourceId || '', action);
          break;

        case 'subscription':
        case 'subscription_preapproval':
        case 'preapproval':
          await this.handleSubscriptionWebhook(resourceId || '', action);
          break;

        case 'invoice':
          await this.handleInvoiceWebhook(resourceId || '', action);
          break;

        default:
          this.logger.log(`Tipo de webhook nao tratado: ${typeRaw || 'unknown'}`);
      }
    } catch (error) {
      this.logger.error('Erro ao processar webhook:', error);
      throw error;
    }
  }

  private async handlePaymentWebhook(paymentId: string, action: string) {
    try {
      if (!paymentId) {
        this.logger.warn(`Webhook de pagamento sem identificador (action=${action})`);
        return;
      }

      const payment = await this.getPayment(paymentId);
      const resolvedReference = this.resolveExternalReference(payment?.external_reference);
      const duplicateWebhook = await this.registerPaymentWebhookEvent(
        payment,
        action,
        resolvedReference,
      );
      if (duplicateWebhook) {
        if (resolvedReference?.kind === 'assinatura') {
          await this.reconcileSubscriptionFromPayment(payment, 'webhook_duplicate');
        } else if (resolvedReference?.kind === 'fatura') {
          this.logger.log(
            `Webhook duplicado de faturamento ignorado payment=${payment?.id} fatura=${resolvedReference.faturaId}`,
          );
        }
        return;
      }

      if (resolvedReference?.kind === 'fatura') {
        await this.reconcileInvoiceFromPayment(payment, action, resolvedReference);
        return;
      }

      this.logger.log(`Webhook pagamento ${paymentId}: ${payment.status} - ${action}`);

      // Aqui você pode implementar lógica específica para cada status
      switch (payment.status) {
        case 'approved':
          await this.handleApprovedPayment(payment);
          break;

        case 'rejected':
          await this.handleRejectedPayment(payment);
          break;

        case 'pending':
          await this.handlePendingPayment(payment);
          break;

        case 'in_process':
          await this.handleProcessingPayment(payment);
          break;

        case 'cancelled':
          await this.handleCancelledPayment(payment);
          break;

        case 'refunded':
          await this.handleRefundedPayment(payment);
          break;
      }
    } catch (error) {
      this.logger.error('Erro ao processar webhook de pagamento:', error);
    }
  }

  private async handleApprovedPayment(payment: any) {
    this.logger.log(`Pagamento aprovado: ${payment.id}`);

    const resolved = this.parseExternalReference(payment?.external_reference);
    if (!resolved) {
      this.logger.warn(
        `Pagamento ${payment.id} aprovado sem external_reference reconhecida: ${payment?.external_reference}`,
      );
      return;
    }

    const { empresaId, assinaturaId } = resolved;

    await runWithTenant(empresaId, async () => {
      const assinatura = await this.assinaturaRepository.findOne({
        where: { id: assinaturaId },
        relations: ['plano'],
      });

      if (!assinatura) {
        this.logger.warn(
          `Assinatura ${assinaturaId} não encontrada para empresa ${empresaId} (RLS pode ter bloqueado)`,
        );
        return;
      }

      const currentStatus = toCanonicalAssinaturaStatus(assinatura.status);

      if (currentStatus === 'active') {
        this.logger.log(`Assinatura ${assinatura.id} já está ativa (idempotente)`);
        return;
      }

      if (!canTransitionSubscriptionStatus(currentStatus, 'active')) {
        this.logger.warn(
          `Transicao invalida de assinatura ${assinatura.id}: ${currentStatus} -> active`,
        );
        return;
      }

      const hoje = new Date();
      const proximoVencimento = new Date(hoje);
      proximoVencimento.setMonth(proximoVencimento.getMonth() + 1);

      assinatura.status = 'active';
      assinatura.dataInicio = hoje;
      assinatura.proximoVencimento = proximoVencimento;
      assinatura.renovacaoAutomatica = true;

      const linha = `Ativada via Mercado Pago payment ${payment.id} em ${new Date().toISOString()}`;
      assinatura.observacoes = assinatura.observacoes
        ? `${assinatura.observacoes}\n${linha}`
        : linha;

      await this.assinaturaRepository.save(assinatura);
      this.logger.log(`✅ Assinatura ${assinatura.id} ativada com sucesso`);
    });
  }

  private async handleRejectedPayment(payment: any) {
    this.logger.log(`Pagamento rejeitado: ${payment.id}`);

    const resolved = this.parseExternalReference(payment?.external_reference);
    if (!resolved) {
      return;
    }

    const { empresaId, assinaturaId } = resolved;
    await runWithTenant(empresaId, async () => {
      const assinatura = await this.assinaturaRepository.findOne({ where: { id: assinaturaId } });
      if (!assinatura) {
        return;
      }

      const linha = `Pagamento rejeitado (MP ${payment.id}) em ${new Date().toISOString()}`;
      assinatura.observacoes = assinatura.observacoes
        ? `${assinatura.observacoes}\n${linha}`
        : linha;
      await this.assinaturaRepository.save(assinatura);
    });
  }

  private async handlePendingPayment(payment: any) {
    this.logger.log(`Pagamento pendente: ${payment.id}`);

    const resolved = this.parseExternalReference(payment?.external_reference);
    if (!resolved) {
      return;
    }

    const { empresaId, assinaturaId } = resolved;
    await runWithTenant(empresaId, async () => {
      const assinatura = await this.assinaturaRepository.findOne({ where: { id: assinaturaId } });
      if (!assinatura) {
        return;
      }

      const linha = `Pagamento pendente (MP ${payment.id}) em ${new Date().toISOString()}`;
      assinatura.observacoes = assinatura.observacoes
        ? `${assinatura.observacoes}\n${linha}`
        : linha;
      await this.assinaturaRepository.save(assinatura);
    });
  }

  private async handleProcessingPayment(payment: any) {
    this.logger.log(`Pagamento em processamento: ${payment.id}`);

    // Implementar lógica para pagamento em processamento
    // - Aguardar confirmação bancária
  }

  private async handleCancelledPayment(payment: any) {
    this.logger.log(`Pagamento cancelado: ${payment.id}`);

    const resolved = this.parseExternalReference(payment?.external_reference);
    if (!resolved) {
      return;
    }

    const { empresaId, assinaturaId } = resolved;
    await runWithTenant(empresaId, async () => {
      const assinatura = await this.assinaturaRepository.findOne({ where: { id: assinaturaId } });
      if (!assinatura) {
        return;
      }

      const linha = `Pagamento cancelado (MP ${payment.id}) em ${new Date().toISOString()}`;
      assinatura.observacoes = assinatura.observacoes
        ? `${assinatura.observacoes}\n${linha}`
        : linha;
      await this.assinaturaRepository.save(assinatura);
    });
  }

  private async handleRefundedPayment(payment: any) {
    this.logger.log(`Pagamento estornado: ${payment.id}`);

    const resolved = this.parseExternalReference(payment?.external_reference);
    if (!resolved) {
      return;
    }

    const { empresaId, assinaturaId } = resolved;
    await runWithTenant(empresaId, async () => {
      const assinatura = await this.assinaturaRepository.findOne({
        where: { id: assinaturaId },
        relations: ['plano'],
      });

      if (!assinatura) {
        return;
      }

      const currentStatus = toCanonicalAssinaturaStatus(assinatura.status);

      if (currentStatus !== 'active') {
        const linha = `Estorno recebido (MP ${payment.id}) com assinatura não-ativa em ${new Date().toISOString()}`;
        assinatura.observacoes = assinatura.observacoes
          ? `${assinatura.observacoes}\n${linha}`
          : linha;
        await this.assinaturaRepository.save(assinatura);
        return;
      }

      if (!canTransitionSubscriptionStatus(currentStatus, 'suspended')) {
        this.logger.warn(
          `Transicao invalida de assinatura ${assinatura.id}: ${currentStatus} -> suspended`,
        );
        return;
      }

      assinatura.status = 'suspended';
      const linha = `Assinatura suspensa por estorno (MP ${payment.id}) em ${new Date().toISOString()}`;
      assinatura.observacoes = assinatura.observacoes
        ? `${assinatura.observacoes}\n${linha}`
        : linha;

      await this.assinaturaRepository.save(assinatura);
      this.logger.log(`⚠️ Assinatura ${assinatura.id} suspensa por estorno`);
    });
  }

  private async handlePlanWebhook(planId: string, action: string) {
    this.logger.log(`Webhook plano ${planId}: ${action}`);
    // Implementar lógica para planos de assinatura
  }

  private async handleSubscriptionWebhook(subscriptionId: string, action: string) {
    try {
      if (!subscriptionId) {
        this.logger.warn(`Webhook de assinatura sem identificador (action=${action})`);
        return;
      }

      const preapproval = await this.getSubscriptionPreapproval(subscriptionId);
      const providerStatus = String(preapproval?.status || '')
        .trim()
        .toLowerCase();
      const targetStatus = this.mapSubscriptionWebhookStatusToCanonical(providerStatus);

      this.logger.log(`Webhook assinatura ${subscriptionId}: ${providerStatus || 'unknown'} - ${action}`);

      if (!targetStatus) {
        this.logger.log(
          `Status de assinatura nao mapeado para reconciliacao (${providerStatus || 'unknown'})`,
        );
        return;
      }

      const resolved = this.parseExternalReference(preapproval?.external_reference);
      if (!resolved) {
        this.logger.warn(
          `Assinatura Mercado Pago ${subscriptionId} sem external_reference reconhecida: ${preapproval?.external_reference}`,
        );
        return;
      }

      const { empresaId, assinaturaId } = resolved;
      await runWithTenant(empresaId, async () => {
        const assinatura = await this.assinaturaRepository.findOne({
          where: { id: assinaturaId },
        });

        if (!assinatura) {
          this.logger.warn(
            `Assinatura ${assinaturaId} nao encontrada para empresa ${empresaId} (webhook ${subscriptionId})`,
          );
          return;
        }

        const currentStatus = toCanonicalAssinaturaStatus(assinatura.status);
        if (currentStatus === targetStatus) {
          this.logger.log(`Assinatura ${assinatura.id} ja alinhada em ${targetStatus}`);
          return;
        }

        if (!canTransitionSubscriptionStatus(currentStatus, targetStatus)) {
          this.logger.warn(
            `Transicao invalida de assinatura ${assinatura.id}: ${currentStatus} -> ${targetStatus}`,
          );
          return;
        }

        const now = new Date();
        if (targetStatus === 'active') {
          const proximoVencimento = new Date(now);
          proximoVencimento.setMonth(proximoVencimento.getMonth() + 1);
          assinatura.dataInicio = now;
          assinatura.dataFim = null;
          assinatura.proximoVencimento = proximoVencimento;
          assinatura.renovacaoAutomatica = true;
        }

        if (targetStatus === 'suspended') {
          assinatura.renovacaoAutomatica = false;
        }

        if (targetStatus === 'canceled') {
          assinatura.dataFim = now;
          assinatura.renovacaoAutomatica = false;
        }

        assinatura.status = targetStatus;

        const linha = `Atualizada via Mercado Pago preapproval ${subscriptionId} (${providerStatus || 'unknown'}) ${currentStatus} -> ${targetStatus} em ${now.toISOString()}`;
        assinatura.observacoes = assinatura.observacoes
          ? `${assinatura.observacoes}\n${linha}`
          : linha;

        await this.assinaturaRepository.save(assinatura);
      });
    } catch (error) {
      this.logger.error('Erro ao processar webhook de assinatura:', error);
    }
  }

  private async handleInvoiceWebhook(invoiceId: string, action: string) {
    this.logger.log(`Webhook fatura ${invoiceId}: ${action}`);
    // Implementar lógica para faturas
  }

  async getPaymentMethods() {
    try {
      // Implementar busca de métodos de pagamento
      // Por enquanto, retorna métodos padrão do Brasil
      return {
        payment_methods: [
          {
            id: 'pix',
            name: 'PIX',
            payment_type_id: 'bank_transfer',
            status: 'active',
            secure_thumbnail: 'https://img.icons8.com/color/96/000000/pix.png',
          },
          {
            id: 'visa',
            name: 'Visa',
            payment_type_id: 'credit_card',
            status: 'active',
            secure_thumbnail: 'https://img.icons8.com/color/96/000000/visa.png',
          },
          {
            id: 'master',
            name: 'Mastercard',
            payment_type_id: 'credit_card',
            status: 'active',
            secure_thumbnail: 'https://img.icons8.com/color/96/000000/mastercard.png',
          },
          {
            id: 'bolbradesco',
            name: 'Boleto Bancário',
            payment_type_id: 'ticket',
            status: 'active',
            secure_thumbnail: 'https://img.icons8.com/color/96/000000/bank.png',
          },
        ],
      };
    } catch (error) {
      this.logger.error('Erro ao buscar métodos de pagamento:', error);
      throw error;
    }
  }

  async getInstallments(amount: number, paymentMethodId: string) {
    try {
      // Implementar busca de parcelas
      // Por enquanto, retorna parcelas padrão
      const maxInstallments = paymentMethodId === 'pix' ? 1 : 12;
      const installments = [];

      for (let i = 1; i <= maxInstallments; i++) {
        const installmentAmount = amount / i;
        const totalAmount = amount * (i > 6 ? 1 + (i - 6) * 0.02 : 1); // Juros após 6x

        installments.push({
          installments: i,
          installment_rate: i > 6 ? (i - 6) * 2 : 0,
          discount_rate: 0,
          reimbursement_rate: null,
          labels: i === 1 ? ['CFT_ZERO'] : [],
          min_allowed_amount: 5,
          max_allowed_amount: 30000,
          recommended_message: `${i}x de R$ ${installmentAmount.toFixed(2)}${i > 6 ? ` (com juros)` : ` sem juros`}`,
          installment_amount: installmentAmount,
          total_amount: totalAmount,
          payment_method_option_id: paymentMethodId,
        });
      }

      return { installments };
    } catch (error) {
      this.logger.error('Erro ao buscar parcelas:', error);
      throw error;
    }
  }
}
