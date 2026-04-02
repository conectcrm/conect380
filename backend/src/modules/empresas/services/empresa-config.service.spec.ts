import { BadRequestException } from '@nestjs/common';
import { EmpresaConfigService } from './empresa-config.service';

describe('EmpresaConfigService - gateway provider', () => {
  const repository = {
    findOne: jest.fn(),
    create: jest.fn((payload) => ({ id: 'cfg-1', ...payload })),
    save: jest.fn(async (payload) => payload),
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(async () => null),
    })),
  };

  let service: EmpresaConfigService;
  let originalEncryptionKey: string | undefined;

  beforeAll(() => {
    originalEncryptionKey = process.env.ENCRYPTION_KEY;
  });

  afterAll(() => {
    process.env.ENCRYPTION_KEY = originalEncryptionKey;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ENCRYPTION_KEY = '';
    service = new EmpresaConfigService(repository as any);
  });

  it('rejeita provider de gateway nao suportado', async () => {
    repository.findOne.mockResolvedValueOnce({
      id: 'cfg-1',
      empresaId: 'empresa-1',
      gatewayPagamentoProvider: null,
    });

    await expect(
      service.update('empresa-1', {
        gatewayPagamentoProvider: 'stripe',
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('normaliza aliases de Mercado Pago para mercadopago', async () => {
    repository.findOne.mockResolvedValueOnce({
      id: 'cfg-1',
      empresaId: 'empresa-1',
      gatewayPagamentoProvider: null,
    });

    const atualizado = await service.update('empresa-1', {
      gatewayPagamentoProvider: 'mercado-pago',
    } as any);

    expect(repository.save).toHaveBeenCalledTimes(1);
    const payloadSalvo = repository.save.mock.calls[0][0];
    expect(payloadSalvo.gatewayPagamentoProvider).toBe('mercadopago');
    expect(atualizado.gatewayPagamentoProvider).toBe('mercadopago');
  });
});
