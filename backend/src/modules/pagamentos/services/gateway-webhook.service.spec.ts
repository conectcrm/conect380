import {
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac } from 'crypto';
import { GatewayProvider, GatewayStatus } from '../entities/configuracao-gateway.entity';
import { GatewayWebhookEventoStatus } from '../entities/gateway-webhook-evento.entity';
import { StatusPagamento } from '../../faturamento/entities/pagamento.entity';
import { GatewayWebhookService } from './gateway-webhook.service';

describe('GatewayWebhookService', () => {
  const configuracaoRepository = {
    findOne: jest.fn(),
  };
  const transacaoRepository = {
    findOne: jest.fn(),
    create: jest.fn((payload) => payload),
    save: jest.fn(async (payload) => ({ id: 'trx-1', ...payload })),
  };
  const webhookEventoRepository = {
    findOne: jest.fn(),
    create: jest.fn((payload) => payload),
    save: jest.fn(async (payload) => ({ id: payload.id || 'whk-1', ...payload })),
  };
  const pagamentoService = {
    processarPagamento: jest.fn(),
  };

  let service: GatewayWebhookService;

  beforeEach(() => {
    jest.clearAllMocks();
    pagamentoService.processarPagamento.mockResolvedValue(undefined);
    service = new GatewayWebhookService(
      configuracaoRepository as any,
      transacaoRepository as any,
      webhookEventoRepository as any,
      pagamentoService as any,
    );
  });

  it('bloqueia webhook com assinatura invalida', async () => {
    configuracaoRepository.findOne.mockResolvedValueOnce({
      id: 'cfg-1',
      empresa_id: 'empresa-1',
      gateway: GatewayProvider.MERCADO_PAGO,
      status: GatewayStatus.ATIVO,
      webhookSecret: 'secret-123',
    });

    await expect(
      service.processarWebhook({
        gatewayParam: 'mercado_pago',
        empresaId: '11111111-1111-1111-1111-111111111111',
        payload: { referenciaGateway: 'ref-1', status: 'approved' },
        headers: { signature: 'invalid-signature' },
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('retorna duplicate=true quando idempotency key ja foi processada', async () => {
    configuracaoRepository.findOne.mockResolvedValueOnce({
      id: 'cfg-1',
      empresa_id: 'empresa-1',
      gateway: GatewayProvider.MERCADO_PAGO,
      status: GatewayStatus.ATIVO,
      webhookSecret: 'secret-123',
    });
    webhookEventoRepository.findOne.mockResolvedValueOnce({
      id: 'whk-duplicado',
      eventId: 'evt-dup',
      status: GatewayWebhookEventoStatus.PROCESSADO,
      idempotencyKey: 'evt-dup',
    });

    const payload = { eventId: 'evt-dup', referenciaGateway: 'ref-dup', status: 'approved' };
    const signature =
      'sha256=' + createHmac('sha256', 'secret-123').update(JSON.stringify(payload)).digest('hex');

    const result = await service.processarWebhook({
      gatewayParam: 'mercado_pago',
      empresaId: '11111111-1111-1111-1111-111111111111',
      payload,
      headers: { signature },
    });

    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        accepted: true,
        duplicate: true,
      }),
    );
    expect(transacaoRepository.save).not.toHaveBeenCalled();
  });

  it('processa evento novo e atualiza transacao por webhook', async () => {
    configuracaoRepository.findOne.mockResolvedValueOnce({
      id: 'cfg-1',
      empresa_id: 'empresa-1',
      gateway: GatewayProvider.MERCADO_PAGO,
      status: GatewayStatus.ATIVO,
      webhookSecret: 'secret-123',
    });
    webhookEventoRepository.findOne.mockResolvedValueOnce(null);
    transacaoRepository.findOne.mockResolvedValueOnce(null);

    const payload = {
      eventId: 'evt-1',
      referenciaGateway: 'ref-1',
      status: 'approved',
      amount: 100,
      fee: 2,
      method: 'pix',
    };
    const signature =
      'sha256=' + createHmac('sha256', 'secret-123').update(JSON.stringify(payload)).digest('hex');

    const result = await service.processarWebhook({
      gatewayParam: 'mercado_pago',
      empresaId: '11111111-1111-1111-1111-111111111111',
      payload,
      headers: { signature },
    });

    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        accepted: true,
        duplicate: false,
      }),
    );
    expect(transacaoRepository.create).toHaveBeenCalled();
    expect(transacaoRepository.save).toHaveBeenCalled();
    expect(webhookEventoRepository.save).toHaveBeenCalledTimes(2);
    expect(pagamentoService.processarPagamento).toHaveBeenCalledWith(
      expect.objectContaining({
        gatewayTransacaoId: 'ref-1',
        novoStatus: StatusPagamento.APROVADO,
      }),
      '11111111-1111-1111-1111-111111111111',
    );
  });

  it('mapeia status recusado para pagamento rejeitado', async () => {
    configuracaoRepository.findOne.mockResolvedValueOnce({
      id: 'cfg-1',
      empresa_id: 'empresa-1',
      gateway: GatewayProvider.MERCADO_PAGO,
      status: GatewayStatus.ATIVO,
      webhookSecret: 'secret-123',
    });
    webhookEventoRepository.findOne.mockResolvedValueOnce(null);
    transacaoRepository.findOne.mockResolvedValueOnce(null);

    const payload = {
      eventId: 'evt-2',
      referenciaGateway: 'ref-2',
      status: 'rejected',
      amount: 100,
      fee: 2,
      method: 'pix',
    };
    const signature =
      'sha256=' + createHmac('sha256', 'secret-123').update(JSON.stringify(payload)).digest('hex');

    await service.processarWebhook({
      gatewayParam: 'mercado_pago',
      empresaId: '11111111-1111-1111-1111-111111111111',
      payload,
      headers: { signature },
    });

    expect(pagamentoService.processarPagamento).toHaveBeenCalledWith(
      expect.objectContaining({
        gatewayTransacaoId: 'ref-2',
        novoStatus: StatusPagamento.REJEITADO,
        motivoRejeicao: 'rejected',
      }),
      '11111111-1111-1111-1111-111111111111',
    );
  });

  it('nao falha quando nao existe pagamento vinculado', async () => {
    configuracaoRepository.findOne.mockResolvedValueOnce({
      id: 'cfg-1',
      empresa_id: 'empresa-1',
      gateway: GatewayProvider.MERCADO_PAGO,
      status: GatewayStatus.ATIVO,
      webhookSecret: 'secret-123',
    });
    webhookEventoRepository.findOne.mockResolvedValueOnce(null);
    transacaoRepository.findOne.mockResolvedValueOnce(null);
    pagamentoService.processarPagamento.mockRejectedValueOnce(
      new NotFoundException('Pagamento nao encontrado'),
    );

    const payload = {
      eventId: 'evt-3',
      referenciaGateway: 'ref-sem-pagamento',
      status: 'approved',
      amount: 45,
      fee: 0,
    };
    const signature =
      'sha256=' + createHmac('sha256', 'secret-123').update(JSON.stringify(payload)).digest('hex');

    const result = await service.processarWebhook({
      gatewayParam: 'mercado_pago',
      empresaId: '11111111-1111-1111-1111-111111111111',
      payload,
      headers: { signature },
    });

    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        duplicate: false,
      }),
    );
  });

  it('atualiza transacao existente sem criar novo registro', async () => {
    configuracaoRepository.findOne.mockResolvedValueOnce({
      id: 'cfg-1',
      empresa_id: 'empresa-1',
      gateway: GatewayProvider.MERCADO_PAGO,
      status: GatewayStatus.ATIVO,
      webhookSecret: 'secret-123',
    });
    webhookEventoRepository.findOne.mockResolvedValueOnce(null);

    const transacaoExistente = {
      id: 'trx-existente',
      empresa_id: '11111111-1111-1111-1111-111111111111',
      referenciaGateway: 'ref-existente',
      status: 'pendente',
      payloadResposta: { inicial: true },
    };
    transacaoRepository.findOne.mockResolvedValueOnce(transacaoExistente);

    const payload = {
      eventId: 'evt-4',
      referenciaGateway: 'ref-existente',
      status: 'approved',
      amount: 210.5,
      fee: 1.5,
      method: 'pix',
    };
    const signature =
      'sha256=' + createHmac('sha256', 'secret-123').update(JSON.stringify(payload)).digest('hex');

    await service.processarWebhook({
      gatewayParam: 'mercado_pago',
      empresaId: '11111111-1111-1111-1111-111111111111',
      payload,
      headers: { signature },
    });

    expect(transacaoRepository.create).not.toHaveBeenCalled();
    expect(transacaoRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'trx-existente',
        referenciaGateway: 'ref-existente',
      }),
    );
  });

  it('marca evento como falha quando ocorre erro interno no processamento', async () => {
    configuracaoRepository.findOne.mockResolvedValueOnce({
      id: 'cfg-1',
      empresa_id: 'empresa-1',
      gateway: GatewayProvider.MERCADO_PAGO,
      status: GatewayStatus.ATIVO,
      webhookSecret: 'secret-123',
    });
    webhookEventoRepository.findOne.mockResolvedValueOnce(null);
    transacaoRepository.findOne.mockResolvedValueOnce(null);
    pagamentoService.processarPagamento.mockRejectedValueOnce(new Error('erro-interno'));

    const payload = {
      eventId: 'evt-5',
      referenciaGateway: 'ref-erro',
      status: 'approved',
      amount: 80,
      fee: 0,
      method: 'pix',
    };
    const signature =
      'sha256=' + createHmac('sha256', 'secret-123').update(JSON.stringify(payload)).digest('hex');

    await expect(
      service.processarWebhook({
        gatewayParam: 'mercado_pago',
        empresaId: '11111111-1111-1111-1111-111111111111',
        payload,
        headers: { signature },
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);

    expect(webhookEventoRepository.save).toHaveBeenCalledTimes(2);
    expect(webhookEventoRepository.save).toHaveBeenLastCalledWith(
      expect.objectContaining({
        status: GatewayWebhookEventoStatus.FALHA,
        erro: 'erro-interno',
      }),
    );
  });
});
