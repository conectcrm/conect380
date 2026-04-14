import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PropostasService } from './propostas.service';

describe('PropostasService - quote to cash gates', () => {
  let service: PropostasService;

  const propostaRepository = {
    query: jest.fn().mockResolvedValue([]),
    findOne: jest.fn(),
    save: jest.fn(async (value) => value),
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

  const baseDate = new Date('2026-04-08T10:00:00.000Z');

  const buildPropostaEntity = (overrides?: Record<string, unknown>): any => ({
    id: 'prop-qtc-1',
    numero: 'PROP-2026-0101',
    titulo: 'Proposta Quote-to-Cash',
    status: 'aprovada',
    cliente: {
      id: 'cliente-1',
      nome: 'Cliente Teste',
      email: 'cliente@teste.com',
    },
    produtos: [
      {
        id: 'item-1',
        nome: 'Plano Pro',
        quantidade: 1,
        precoUnitario: 1000,
        desconto: 0,
        subtotal: 1000,
      },
    ],
    subtotal: 1000,
    descontoGlobal: 0,
    impostos: 0,
    total: 1000,
    valor: 1000,
    formaPagamento: 'avista',
    validadeDias: 30,
    incluirImpostosPDF: false,
    criadaEm: baseDate,
    atualizadaEm: baseDate,
    dataVencimento: new Date('2026-05-08T00:00:00.000Z'),
    emailDetails: {},
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    service = new PropostasService(
      propostaRepository as any,
      userRepository as any,
      clienteRepository as any,
      produtoRepository as any,
      catalogItemRepository as any,
      oportunidadesService as any,
      undefined,
    );
  });

  it('deve registrar solicitacao de dispensa e mover fluxo para dispensa_contrato_solicitada', async () => {
    propostaRepository.findOne.mockResolvedValue(
      buildPropostaEntity({
        emailDetails: {
          contratoGate: {
            contratoObrigatorio: false,
            dispensa: { status: 'nao_solicitada' },
            faturamento: { liberado: false },
          },
        },
      }),
    );

    const resultado = await service.solicitarDispensaContrato(
      'prop-qtc-1',
      { motivo: 'Contrato simplificado para venda avulsa.' },
      { id: 'user-solicitante', nome: 'Vendedor A' },
      'empresa-1',
    );

    expect(resultado.status).toBe('dispensa_contrato_solicitada');
    expect((resultado.emailDetails as any)?.contratoGate?.dispensa?.status).toBe('solicitada');
    expect((resultado.emailDetails as any)?.contratoGate?.faturamento?.liberado).toBe(false);
    expect(propostaRepository.save).toHaveBeenCalled();
  });

  it('deve bloquear autoaprovacao de dispensa quando solicitante e aprovador sao o mesmo usuario', async () => {
    propostaRepository.findOne.mockResolvedValue(
      buildPropostaEntity({
        emailDetails: {
          fluxoStatus: 'dispensa_contrato_solicitada',
          contratoGate: {
            contratoObrigatorio: false,
            dispensa: {
              status: 'solicitada',
              solicitadaPorId: 'user-1',
            },
            faturamento: { liberado: false },
          },
        },
      }),
    );

    await expect(
      service.aprovarDispensaContrato(
        'prop-qtc-1',
        { motivo: 'Aprovacao de dispensa' },
        { id: 'user-1', nome: 'Mesmo Usuario' },
        'empresa-1',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(propostaRepository.save).not.toHaveBeenCalled();
  });

  it('deve liberar faturamento quando proposta estiver com contrato assinado', async () => {
    propostaRepository.findOne.mockResolvedValue(
      buildPropostaEntity({
        emailDetails: {
          fluxoStatus: 'contrato_assinado',
          contratoGate: {
            contratoObrigatorio: true,
            dispensa: { status: 'nao_solicitada' },
            faturamento: { liberado: false },
          },
        },
      }),
    );

    const resultado = await service.liberarFaturamentoProposta(
      'prop-qtc-1',
      { motivo: 'Checklist documental concluido.' },
      { id: 'fin-1', nome: 'Financeiro A' },
      'empresa-1',
    );

    expect(resultado.status).toBe('faturamento_liberado');
    expect((resultado.emailDetails as any)?.contratoGate?.faturamento?.liberado).toBe(true);
    expect((resultado.emailDetails as any)?.fluxoStatus).toBe('faturamento_liberado');
    expect(propostaRepository.save).toHaveBeenCalled();
  });

  it('deve bloquear faturamento quando houver apenas contrato assinado sem liberacao formal', async () => {
    propostaRepository.findOne.mockResolvedValue(
      buildPropostaEntity({
        emailDetails: {
          fluxoStatus: 'contrato_assinado',
          contratoGate: {
            contratoObrigatorio: true,
            dispensa: { status: 'nao_solicitada' },
            faturamento: { liberado: false },
          },
        },
      }),
    );

    await expect(
      service.assertPropostaElegivelParaFaturamento('prop-qtc-1', 'empresa-1'),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.assertPropostaElegivelParaFaturamento('prop-qtc-1', 'empresa-1'),
    ).rejects.toThrow(/sem liberacao formal de faturamento/i);
  });

  it('deve bloquear faturamento quando dispensa estiver apenas solicitada (pendente de aprovacao)', async () => {
    propostaRepository.findOne.mockResolvedValue(
      buildPropostaEntity({
        emailDetails: {
          fluxoStatus: 'dispensa_contrato_solicitada',
          contratoGate: {
            contratoObrigatorio: false,
            dispensa: { status: 'solicitada' },
            faturamento: { liberado: false },
          },
        },
      }),
    );

    await expect(
      service.assertPropostaElegivelParaFaturamento('prop-qtc-1', 'empresa-1'),
    ).rejects.toThrow(/pendente de aprovacao/i);
  });

  it('deve permitir faturamento quando gate formal estiver liberado', async () => {
    propostaRepository.findOne.mockResolvedValue(
      buildPropostaEntity({
        emailDetails: {
          fluxoStatus: 'dispensa_contrato_aprovada',
          contratoGate: {
            contratoObrigatorio: false,
            dispensa: { status: 'aprovada' },
            faturamento: { liberado: true },
          },
        },
      }),
    );

    await expect(
      service.assertPropostaElegivelParaFaturamento('prop-qtc-1', 'empresa-1'),
    ).resolves.toBeUndefined();
  });
});
