import { NotImplementedException } from '@nestjs/common';
import { ConfiguracaoGatewayService } from './configuracao-gateway.service';
import { GatewayMode, GatewayProvider } from '../entities/configuracao-gateway.entity';

describe('ConfiguracaoGatewayService - gateway feature gate', () => {
  let service: ConfiguracaoGatewayService;

  const repo = {
    findOne: jest.fn(),
    create: jest.fn((payload) => payload),
    save: jest.fn(async (payload) => ({ id: 'cfg-1', ...payload })),
  };

  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    service = new ConfiguracaoGatewayService(repo as any);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('bloqueia criacao de configuracao em producao sem provider habilitado', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS;
    delete process.env.PAGAMENTOS_GATEWAY_ALLOW_UNIMPLEMENTED;

    await expect(
      service.create(
        {
          nome: 'Gateway Stripe',
          gateway: GatewayProvider.STRIPE,
          modoOperacao: GatewayMode.SANDBOX,
        } as any,
        'empresa-1',
      ),
    ).rejects.toBeInstanceOf(NotImplementedException);

    expect(repo.findOne).not.toHaveBeenCalled();
    expect(repo.create).not.toHaveBeenCalled();
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('permite criacao quando provider esta habilitado por env', async () => {
    process.env.NODE_ENV = 'production';
    process.env.PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS = 'stripe';
    repo.findOne.mockResolvedValueOnce(null);

    const result = await service.create(
      {
        nome: 'Gateway Stripe',
        gateway: GatewayProvider.STRIPE,
        modoOperacao: GatewayMode.SANDBOX,
      } as any,
      'empresa-1',
    );

    expect(repo.findOne).toHaveBeenCalled();
    expect(repo.create).toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalled();
    expect(result).toEqual(expect.objectContaining({ id: 'cfg-1', empresa_id: 'empresa-1' }));
  });
});
