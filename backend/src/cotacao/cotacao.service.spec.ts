import { HttpException, HttpStatus } from '@nestjs/common';
import { CotacaoService } from './cotacao.service';
import { Cotacao, StatusCotacao } from './entities/cotacao.entity';

describe('CotacaoService (fluxo compras internas)', () => {
  const createService = () => {
    const cotacaoRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    const contaPagarService = {
      findOne: jest.fn(),
      create: jest.fn(),
    };

    const service = new CotacaoService(
      cotacaoRepository as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      contaPagarService as any,
      {} as any,
      {} as any,
    );

    return { service, cotacaoRepository, contaPagarService };
  };

  const makeCotacao = (overrides: Partial<Cotacao> = {}): Cotacao =>
    ({
      id: 'cot-1',
      numero: 'COT-0001',
      empresaId: 'emp-1',
      status: StatusCotacao.APROVADA,
      observacoes: null,
      metadados: null,
      ...overrides,
    }) as Cotacao;

  it('deve permitir transicoes do fluxo de compras internas e bloquear salto invalido', () => {
    const { service } = createService();
    const isValidStatusTransition = (service as any).isValidStatusTransition.bind(service);

    expect(
      isValidStatusTransition(StatusCotacao.APROVADA, StatusCotacao.PEDIDO_GERADO),
    ).toBe(true);
    expect(
      isValidStatusTransition(StatusCotacao.PEDIDO_GERADO, StatusCotacao.ADQUIRIDO),
    ).toBe(true);
    expect(
      isValidStatusTransition(StatusCotacao.CONVERTIDA, StatusCotacao.ADQUIRIDO),
    ).toBe(true);
    expect(isValidStatusTransition(StatusCotacao.APROVADA, StatusCotacao.ADQUIRIDO)).toBe(false);
  });

  it('deve bloquear alteracao direta de status critico no endpoint generico', async () => {
    const { service, cotacaoRepository } = createService();
    cotacaoRepository.findOne.mockResolvedValue(makeCotacao({ status: StatusCotacao.ENVIADA }));

    try {
      await service.alterarStatus(
        'cot-1',
        StatusCotacao.APROVADA,
        undefined,
        'user-1',
        'emp-1',
      );
      fail('esperava HttpException');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect((error as HttpException).message).toContain('fluxo específico');
      expect(cotacaoRepository.save).not.toHaveBeenCalled();
    }
  });

  it('deve converter cotacao aprovada para pedido_gerado e registrar metadados de compra', async () => {
    const { service, cotacaoRepository } = createService();
    const cotacao = makeCotacao({
      status: StatusCotacao.APROVADA,
      metadados: { origem: 'teste' } as any,
    });

    cotacaoRepository.findOne.mockResolvedValue(cotacao);
    cotacaoRepository.save.mockImplementation(async (entity: Cotacao) => entity);

    const result = await service.converterEmPedido(
      cotacao.id,
      'Gerado para compra interna',
      'user-1',
      cotacao.empresaId,
    );

    expect(cotacao.status).toBe(StatusCotacao.PEDIDO_GERADO);
    expect(cotacao.dataConversao).toBeInstanceOf(Date);
    expect(cotacao.metadados?.compra?.status).toBe('pedido_gerado');
    expect(cotacao.metadados?.compra?.pagamentoExterno).toBe(true);
    expect(cotacao.metadados?.compra?.pedidoId).toMatch(/^PED-/);
    expect(cotacaoRepository.save).toHaveBeenCalledWith(cotacao);
    expect(result.cotacaoId).toBe(cotacao.id);
    expect(result.id).toMatch(/^PED-/);
    expect(result.status).toBe('CRIADO');
  });

  it('deve marcar cotacao com pedido_gerado como adquirida e retornar payload atualizado', async () => {
    const { service, cotacaoRepository } = createService();
    const cotacao = makeCotacao({
      status: StatusCotacao.PEDIDO_GERADO,
      metadados: { compra: { status: 'pedido_gerado', pedidoId: 'PED-123' } } as any,
    });

    cotacaoRepository.findOne.mockResolvedValue(cotacao);
    cotacaoRepository.save.mockImplementation(async (entity: Cotacao) => entity);
    jest.spyOn(service, 'buscarPorId').mockResolvedValue({
      id: cotacao.id,
      status: StatusCotacao.ADQUIRIDO,
    } as any);

    const result = await service.marcarAdquirido(
      cotacao.id,
      {
        referenciaPagamento: 'PIX-999',
        observacoes: 'Pago externamente',
      },
      'user-1',
      cotacao.empresaId,
    );

    expect(cotacao.status).toBe(StatusCotacao.ADQUIRIDO);
    expect(cotacao.metadados?.compra?.status).toBe('adquirido');
    expect(cotacao.metadados?.compra?.referenciaPagamento).toBe('PIX-999');
    expect(cotacaoRepository.save).toHaveBeenCalledWith(cotacao);
    expect(result.status).toBe(StatusCotacao.ADQUIRIDO);
  });

  it('deve aceitar status legado convertida ao marcar adquirido', async () => {
    const { service, cotacaoRepository } = createService();
    const cotacao = makeCotacao({
      status: StatusCotacao.CONVERTIDA,
      metadados: { compra: { status: 'pedido_gerado', pedidoId: 'PED-LEGADO' } } as any,
    });

    cotacaoRepository.findOne.mockResolvedValue(cotacao);
    cotacaoRepository.save.mockImplementation(async (entity: Cotacao) => entity);
    jest.spyOn(service, 'buscarPorId').mockResolvedValue({
      id: cotacao.id,
      status: StatusCotacao.ADQUIRIDO,
    } as any);

    await service.marcarAdquirido(cotacao.id, {}, 'user-1', cotacao.empresaId);

    expect(cotacao.status).toBe(StatusCotacao.ADQUIRIDO);
    expect(cotacao.metadados?.compra?.status).toBe('adquirido');
  });

  it('deve bloquear gerar conta a pagar quando cotacao nao estiver com pedido gerado', async () => {
    const { service, cotacaoRepository, contaPagarService } = createService();
    cotacaoRepository.findOne.mockResolvedValue(
      makeCotacao({
        status: StatusCotacao.APROVADA,
      }),
    );

    await expect(
      service.gerarContaPagar(
        'cot-1',
        {},
        'user-1',
        'emp-1',
      ),
    ).rejects.toMatchObject({
      status: HttpStatus.BAD_REQUEST,
    });

    expect(contaPagarService.create).not.toHaveBeenCalled();
    expect(cotacaoRepository.save).not.toHaveBeenCalled();
  });

  it('deve retornar conta a pagar existente sem recriar quando vinculo ja estiver em metadados', async () => {
    const { service, cotacaoRepository, contaPagarService } = createService();
    const cotacao = makeCotacao({
      status: StatusCotacao.PEDIDO_GERADO,
      titulo: 'Compra interna de insumos',
      valorTotal: 1500,
      fornecedorId: 'forn-1',
      prazoResposta: new Date('2026-02-20'),
      metadados: {
        compra: {
          status: 'pedido_gerado',
          pedidoId: 'PED-123',
          contaPagarId: 'cp-1',
        },
      } as any,
    });

    cotacaoRepository.findOne.mockResolvedValue(cotacao);
    contaPagarService.findOne.mockResolvedValue({
      id: 'cp-1',
      numero: 'CP-202602-0001',
      status: 'em_aberto',
    });
    jest.spyOn(service, 'buscarPorId').mockResolvedValue({
      id: cotacao.id,
      status: cotacao.status,
    } as any);

    const result = await service.gerarContaPagar(
      cotacao.id,
      {},
      'user-1',
      cotacao.empresaId,
    );

    expect(contaPagarService.findOne).toHaveBeenCalledWith('cp-1', cotacao.empresaId);
    expect(contaPagarService.create).not.toHaveBeenCalled();
    expect(cotacaoRepository.save).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.alreadyExisted).toBe(true);
    expect(result.contaPagar.id).toBe('cp-1');
  });
});
