import { NotImplementedException } from '@nestjs/common';
import { PagamentosGatewayService } from './pagamentos.service';
import { GatewayProvider } from '../entities/configuracao-gateway.entity';

describe('PagamentosGatewayService - gateway feature gate', () => {
  let service: PagamentosGatewayService;

  const transacaoRepository = {
    findOne: jest.fn(),
    create: jest.fn((payload) => payload),
    save: jest.fn(async (payload) => ({ id: 'trx-1', ...payload })),
  };
  const configuracaoRepository = {
    findOne: jest.fn(),
  };
  const faturaRepository = {
    findOne: jest.fn(),
  };
  const pagamentoRepository = {
    findOne: jest.fn(),
  };

  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    service = new PagamentosGatewayService(
      transacaoRepository as any,
      configuracaoRepository as any,
      faturaRepository as any,
      pagamentoRepository as any,
    );
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('retorna bloqueio quando tenta registrar transacao de provider nao habilitado em producao', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS;
    delete process.env.PAGAMENTOS_GATEWAY_ALLOW_UNIMPLEMENTED;

    transacaoRepository.findOne.mockResolvedValueOnce(null); // ensureUniqueReferencia
    configuracaoRepository.findOne.mockResolvedValueOnce({
      id: 'cfg-stripe',
      empresa_id: 'empresa-1',
      gateway: GatewayProvider.STRIPE,
    });

    await expect(
      service.registrarTransacao(
        {
          configuracaoId: 'cfg-stripe',
          referenciaGateway: 'ref-001',
        } as any,
        'empresa-1',
      ),
    ).rejects.toBeInstanceOf(NotImplementedException);

    expect(transacaoRepository.create).not.toHaveBeenCalled();
    expect(transacaoRepository.save).not.toHaveBeenCalled();
  });

  it('permite registrar transacao quando provider esta habilitado por env', async () => {
    process.env.NODE_ENV = 'production';
    process.env.PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS = 'stripe';

    transacaoRepository.findOne.mockResolvedValueOnce(null); // ensureUniqueReferencia
    configuracaoRepository.findOne.mockResolvedValueOnce({
      id: 'cfg-stripe',
      empresa_id: 'empresa-1',
      gateway: GatewayProvider.STRIPE,
    });

    const result = await service.registrarTransacao(
      {
        configuracaoId: 'cfg-stripe',
        referenciaGateway: 'ref-002',
        valorBruto: 100,
      } as any,
      'empresa-1',
    );

    expect(transacaoRepository.create).toHaveBeenCalled();
    expect(transacaoRepository.save).toHaveBeenCalled();
    expect(result).toEqual(expect.objectContaining({ id: 'trx-1', empresa_id: 'empresa-1' }));
  });
});
