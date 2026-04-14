import { BadRequestException } from '@nestjs/common';
import { PropostasService } from './propostas.service';

describe('PropostasService - sales MVP scope', () => {
  const originalEnv = {
    SALES_MVP_MODE: process.env.SALES_MVP_MODE,
    MVP_MODE: process.env.MVP_MODE,
    FINANCEIRO_MVP_MODE: process.env.FINANCEIRO_MVP_MODE,
  };

  const propostaRepository = {
    query: jest.fn().mockResolvedValue([]),
    findOne: jest.fn(),
    save: jest.fn(),
    manager: {
      transaction: jest.fn().mockImplementation(async (callback: any) => callback({ query: jest.fn() })),
    },
  };

  const userRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const clienteRepository = {
    findOne: jest.fn(),
  };

  const produtoRepository = {
    find: jest.fn(),
  };

  const catalogItemRepository = {
    find: jest.fn(),
  };

  const oportunidadesService = {
    isSalesFeatureEnabledForTenant: jest.fn().mockResolvedValue(true),
    findOne: jest.fn(),
    updateEstagio: jest.fn(),
  };

  const createService = () =>
    new PropostasService(
      propostaRepository as any,
      userRepository as any,
      clienteRepository as any,
      produtoRepository as any,
      catalogItemRepository as any,
      oportunidadesService as any,
      undefined,
    );

  afterEach(() => {
    jest.clearAllMocks();
    process.env.SALES_MVP_MODE = originalEnv.SALES_MVP_MODE;
    process.env.MVP_MODE = originalEnv.MVP_MODE;
    process.env.FINANCEIRO_MVP_MODE = originalEnv.FINANCEIRO_MVP_MODE;
  });

  it('remove transicoes de faturamento quando SALES_MVP_MODE estiver ativo', () => {
    process.env.SALES_MVP_MODE = 'true';
    process.env.MVP_MODE = 'false';
    process.env.FINANCEIRO_MVP_MODE = 'false';

    const service = createService();
    const allowedTransitions = (service as any).getAllowedStatusTransitionsByPolicy(
      'contrato_assinado',
      true,
    );

    expect(allowedTransitions).not.toContain('fatura_criada');
  });

  it('bloqueia status de faturamento quando modo MVP estiver ativo', () => {
    process.env.SALES_MVP_MODE = 'false';
    process.env.MVP_MODE = 'true';
    process.env.FINANCEIRO_MVP_MODE = 'false';

    const service = createService();

    expect(() => (service as any).assertStatusAllowedBySalesMvp('fatura_criada')).toThrow(
      BadRequestException,
    );
    expect(() => (service as any).assertStatusAllowedBySalesMvp('fatura_criada')).toThrow(
      'fora do escopo do MVP comercial',
    );
  });

  it('mantem transicoes de faturamento quando modo MVP estiver desativado', () => {
    process.env.SALES_MVP_MODE = 'false';
    process.env.MVP_MODE = 'false';
    process.env.FINANCEIRO_MVP_MODE = 'false';

    const service = createService();
    const allowedTransitions = (service as any).getAllowedStatusTransitionsByPolicy(
      'contrato_assinado',
      true,
    );

    expect(allowedTransitions).toContain('fatura_criada');
    expect(() => (service as any).assertStatusAllowedBySalesMvp('fatura_criada')).not.toThrow();
  });
});
