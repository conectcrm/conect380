import { BadRequestException } from '@nestjs/common';
import { PropostasService } from './propostas.service';

describe('PropostasService - cancelarVenda', () => {
  let service: PropostasService;

  const propostaRepository = {
    query: jest.fn().mockResolvedValue([]),
    findOne: jest.fn(),
    save: jest.fn(),
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

  const baseProposta: any = {
    id: 'prop-1',
    numero: 'PROP-2026-999',
    status: 'negociacao',
    motivoPerda: undefined,
    cliente: {
      id: 'cliente-1',
      nome: 'Cliente Teste',
      email: 'cliente@teste.com',
      documento: '00000000000',
    },
    produtos: [{ id: 'item-1', nome: 'Produto A', quantidade: 1, precoUnitario: 100 }],
    subtotal: 100,
    descontoGlobal: 0,
    impostos: 0,
    total: 100,
    valor: 100,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

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

  it('deve exigir motivo para cancelar venda', async () => {
    await expect(
      service.cancelarVenda(
        'prop-1',
        {
          motivo: '   ',
        },
        'empresa-1',
      ),
    ).rejects.toThrow('Informe o motivo do cancelamento da venda.');
  });

  it('deve bloquear cancelamento quando proposta estiver paga', async () => {
    jest.spyOn(service, 'obterProposta').mockResolvedValue({
      ...baseProposta,
      status: 'pago',
    });

    await expect(
      service.cancelarVenda(
        'prop-1',
        {
          motivo: 'Cliente pediu cancelamento',
        },
        'empresa-1',
      ),
    ).rejects.toThrow(
      'Nao e possivel cancelar uma venda com pagamento confirmado. Realize o estorno no financeiro antes de cancelar.',
    );
  });

  it('deve bloquear quando houver contrato assinado', async () => {
    jest.spyOn(service, 'obterProposta').mockResolvedValue(baseProposta);
    jest
      .spyOn(service as any, 'carregarBloqueiosCancelamentoVenda')
      .mockResolvedValue({
        contratosAssinados: 1,
        faturasAtivasNaoCanceladas: 0,
        faturasPagasOuParciais: 0,
      });

    await expect(
      service.cancelarVenda(
        'prop-1',
        {
          motivo: 'Cliente desistiu',
        },
        'empresa-1',
      ),
    ).rejects.toThrow(
      'Nao e possivel cancelar a venda porque existe contrato assinado vinculado. Cancele o contrato primeiro.',
    );
  });

  it('deve bloquear quando houver faturas pagas/parciais', async () => {
    jest.spyOn(service, 'obterProposta').mockResolvedValue(baseProposta);
    jest
      .spyOn(service as any, 'carregarBloqueiosCancelamentoVenda')
      .mockResolvedValue({
        contratosAssinados: 0,
        faturasAtivasNaoCanceladas: 1,
        faturasPagasOuParciais: 1,
      });

    await expect(
      service.cancelarVenda(
        'prop-1',
        {
          motivo: 'Cliente sem orçamento',
        },
        'empresa-1',
      ),
    ).rejects.toThrow(
      'Nao e possivel cancelar a venda porque existem faturas pagas/parcialmente pagas. Execute o estorno antes de cancelar.',
    );
  });

  it('deve bloquear quando houver faturas ativas', async () => {
    jest.spyOn(service, 'obterProposta').mockResolvedValue(baseProposta);
    jest
      .spyOn(service as any, 'carregarBloqueiosCancelamentoVenda')
      .mockResolvedValue({
        contratosAssinados: 0,
        faturasAtivasNaoCanceladas: 1,
        faturasPagasOuParciais: 0,
      });

    await expect(
      service.cancelarVenda(
        'prop-1',
        {
          motivo: 'Cliente pediu revisão sem continuidade',
        },
        'empresa-1',
      ),
    ).rejects.toThrow(
      'Nao e possivel cancelar a venda enquanto houver faturas ativas. Cancele as faturas pendentes/enviadas antes de continuar.',
    );
  });

  it('deve cancelar venda com sucesso quando nao houver bloqueios', async () => {
    jest.spyOn(service, 'obterProposta').mockResolvedValue(baseProposta);
    jest
      .spyOn(service as any, 'carregarBloqueiosCancelamentoVenda')
      .mockResolvedValue({
        contratosAssinados: 0,
        faturasAtivasNaoCanceladas: 0,
        faturasPagasOuParciais: 0,
      });

    const propostaAtualizada = {
      ...baseProposta,
      status: 'rejeitada',
      motivoPerda: 'Cliente desistiu por prazo',
    } as any;
    const atualizarStatusSpy = jest
      .spyOn(service, 'atualizarStatus')
      .mockResolvedValue(propostaAtualizada);

    const resultado = await service.cancelarVenda(
      'prop-1',
      {
        motivo: 'Cliente desistiu por prazo',
        source: 'teste-unit',
      },
      'empresa-1',
    );

    expect(atualizarStatusSpy).toHaveBeenCalledWith(
      'prop-1',
      'rejeitada',
      'teste-unit',
      expect.stringContaining('Motivo: Cliente desistiu por prazo'),
      'Cliente desistiu por prazo',
      'empresa-1',
      expect.objectContaining({
        tipo: 'cancelamento_venda',
      }),
    );
    expect(resultado).toEqual(propostaAtualizada);
  });

  it('deve propagar BadRequestException quando proposta nao existir', async () => {
    jest.spyOn(service, 'obterProposta').mockResolvedValue(null as any);

    await expect(
      service.cancelarVenda(
        'prop-1',
        {
          motivo: 'Cliente desistiu',
        },
        'empresa-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

