import { BadRequestException } from '@nestjs/common';
import { ConciliacaoBancariaService } from './conciliacao-bancaria.service';

describe('ConciliacaoBancariaService', () => {
  const createContaPagarQueryBuilder = (contas: any[] = []) => {
    const qb = {
      leftJoinAndSelect: jest.fn(),
      where: jest.fn(),
      andWhere: jest.fn(),
      orderBy: jest.fn(),
      addOrderBy: jest.fn(),
      limit: jest.fn(),
      getMany: jest.fn().mockResolvedValue(contas),
    } as any;

    qb.leftJoinAndSelect.mockReturnValue(qb);
    qb.where.mockReturnValue(qb);
    qb.andWhere.mockReturnValue(qb);
    qb.orderBy.mockReturnValue(qb);
    qb.addOrderBy.mockReturnValue(qb);
    qb.limit.mockReturnValue(qb);
    return qb;
  };

  const createService = (contasCandidatas: any[] = []) => {
    const importacaoRepository = {
      manager: {
        transaction: jest.fn(),
      },
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
    };

    const itemRepository = {
      createQueryBuilder: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const contaBancariaRepository = {
      findOne: jest.fn(),
    };

    const contaPagarQueryBuilder = createContaPagarQueryBuilder(contasCandidatas);
    const contaPagarRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(contaPagarQueryBuilder),
      findOne: jest.fn(),
    };

    const service = new ConciliacaoBancariaService(
      importacaoRepository as any,
      itemRepository as any,
      contaBancariaRepository as any,
      contaPagarRepository as any,
    );

    return {
      service,
      importacaoRepository,
      itemRepository,
      contaBancariaRepository,
      contaPagarRepository,
      contaPagarQueryBuilder,
    };
  };

  const createTransactionManager = () => {
    const timestamp = new Date('2026-02-27T10:00:00.000Z');

    return {
      create: jest.fn((_entity: unknown, payload: Record<string, unknown>) => ({ ...payload })),
      save: jest.fn(async (payload: any) => {
        if (Array.isArray(payload)) {
          return payload.map((item, index) => ({
            id: `item-${index + 1}`,
            createdAt: timestamp,
            updatedAt: timestamp,
            ...item,
          }));
        }

        return {
          id: 'importacao-1',
          createdAt: timestamp,
          updatedAt: timestamp,
          ...payload,
        };
      }),
    };
  };

  const makeArquivo = (nome: string, conteudo: string, mimeType: string) =>
    ({
      originalname: nome,
      mimetype: mimeType,
      size: Buffer.byteLength(conteudo, 'utf-8'),
      buffer: Buffer.from(conteudo, 'utf-8'),
    }) as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve importar extrato CSV, persistir lancamentos e retornar resumo', async () => {
    const { service, importacaoRepository, contaBancariaRepository } = createService();
    const manager = createTransactionManager();

    contaBancariaRepository.findOne.mockResolvedValue({
      id: 'cb-1',
      empresaId: 'emp-1',
      ativo: true,
    });
    importacaoRepository.manager.transaction.mockImplementation(async (callback: any) =>
      callback(manager),
    );

    const csv = [
      'data,descricao,valor,documento',
      '2026-02-01,Pagamento fornecedor,-150.00,NF-100',
      '02/02/2026,Recebimento cliente,300.00,REC-22',
    ].join('\n');

    const resultado = await service.importarExtrato(
      { contaBancariaId: 'cb-1' },
      makeArquivo('extrato-fevereiro.csv', csv, 'text/csv'),
      'emp-1',
      'user-1',
    );

    expect(resultado.importacao.tipoArquivo).toBe('csv');
    expect(resultado.resumo.totalLancamentos).toBe(2);
    expect(resultado.resumo.totalEntradas).toBe(300);
    expect(resultado.resumo.totalSaidas).toBe(150);
    expect(resultado.itensPreview).toHaveLength(2);
    expect(manager.save).toHaveBeenCalledTimes(2);
  });

  it('deve rejeitar importacao sem nenhum lancamento valido', async () => {
    const { service, contaBancariaRepository } = createService();

    contaBancariaRepository.findOne.mockResolvedValue({
      id: 'cb-1',
      empresaId: 'emp-1',
      ativo: true,
    });

    try {
      await service.importarExtrato(
        { contaBancariaId: 'cb-1' },
        makeArquivo(
          'extrato-invalido.csv',
          ['data,descricao', '2026-02-01,Lancamento sem valor'].join('\n'),
          'text/csv',
        ),
        'emp-1',
        'user-1',
      );
      fail('Importacao deveria falhar sem lancamentos validos');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const response = (error as BadRequestException).getResponse() as Record<string, unknown>;
      expect(response).toEqual(
        expect.objectContaining({
          message: 'Nenhum lancamento valido encontrado no arquivo informado',
        }),
      );
      expect(response.erros).toEqual(expect.any(Array));
    }
  });

  it('deve importar extrato OFX e classificar entradas e saidas', async () => {
    const { service, importacaoRepository, contaBancariaRepository } = createService();
    const manager = createTransactionManager();

    contaBancariaRepository.findOne.mockResolvedValue({
      id: 'cb-2',
      empresaId: 'emp-1',
      ativo: true,
    });
    importacaoRepository.manager.transaction.mockImplementation(async (callback: any) =>
      callback(manager),
    );

    const ofx = [
      '<OFX>',
      '<BANKTRANLIST>',
      '<STMTTRN>',
      '<DTPOSTED>20260202000000[-3:BRT]',
      '<TRNAMT>-45.10',
      '<FITID>ABC-1',
      '<MEMO>Tarifa bancaria',
      '</STMTTRN>',
      '<STMTTRN>',
      '<DTPOSTED>20260203',
      '<TRNAMT>150.55',
      '<FITID>ABC-2',
      '<MEMO>Transferencia recebida',
      '</STMTTRN>',
      '</BANKTRANLIST>',
      '</OFX>',
    ].join('\n');

    const resultado = await service.importarExtrato(
      { contaBancariaId: 'cb-2' },
      makeArquivo('extrato.ofx', ofx, 'application/x-ofx'),
      'emp-1',
      'user-2',
    );

    expect(resultado.importacao.tipoArquivo).toBe('ofx');
    expect(resultado.resumo.totalLancamentos).toBe(2);
    expect(resultado.resumo.totalEntradas).toBe(150.55);
    expect(resultado.resumo.totalSaidas).toBe(45.1);
  });

  it('deve executar matching automatico quando houver candidato univoco', async () => {
    const contaCandidata = {
      id: 'cp-1',
      empresaId: 'emp-1',
      status: 'paga',
      numero: 'CP-202602-0001',
      numeroDocumento: 'NF-100',
      descricao: 'Pagamento fornecedor NF-100',
      valor: 150,
      valorTotal: 150,
      valorPago: 150,
      dataPagamento: new Date('2026-02-01T12:00:00.000Z'),
      dataVencimento: new Date('2026-02-05T12:00:00.000Z'),
      contaBancariaId: 'cb-1',
      fornecedor: {
        nome: 'Fornecedor XPTO',
      },
    };

    const { service, importacaoRepository, itemRepository } = createService([contaCandidata]);

    importacaoRepository.findOne.mockResolvedValue({
      id: 'imp-1',
      empresaId: 'emp-1',
    });
    itemRepository.find.mockResolvedValue([
      {
        id: 'item-1',
        importacaoId: 'imp-1',
        empresaId: 'emp-1',
        contaBancariaId: 'cb-1',
        dataLancamento: new Date('2026-02-01T12:00:00.000Z'),
        descricao: 'Pagamento NF-100',
        documento: 'NF-100',
        referenciaExterna: 'NF-100',
        tipo: 'debito',
        valor: 150,
        conciliado: false,
      },
    ]);
    itemRepository.save.mockImplementation(async (payload: any) => payload);

    const resultado = await service.executarMatchingAutomatico(
      'imp-1',
      'emp-1',
      'user-1',
      { toleranciaDias: 3 },
    );

    expect(resultado.totalItensAnalisados).toBe(1);
    expect(resultado.totalConciliados).toBe(1);
    expect(resultado.itensConciliados[0].contaPagarId).toBe('cp-1');
    expect(itemRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'item-1',
        conciliado: true,
        contaPagarId: 'cp-1',
        conciliacaoOrigem: 'automatica',
      }),
    );
  });

  it('deve impedir conciliacao manual com conta nao paga', async () => {
    const { service, itemRepository, contaPagarRepository } = createService();

    itemRepository.findOne.mockResolvedValue({
      id: 'item-10',
      empresaId: 'emp-1',
      contaBancariaId: 'cb-1',
      tipo: 'debito',
      valor: 100,
      dataLancamento: new Date('2026-02-10T12:00:00.000Z'),
      descricao: 'Pagamento',
      conciliado: false,
    });

    contaPagarRepository.findOne.mockResolvedValue({
      id: 'cp-10',
      empresaId: 'emp-1',
      status: 'pendente',
      contaBancariaId: 'cb-1',
    });

    await expect(
      service.conciliarItemManual(
        'item-10',
        { contaPagarId: 'cp-10', observacao: 'Ajuste manual' },
        'emp-1',
        'user-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deve conciliar e desconciliar item manualmente registrando auditoria', async () => {
    const contaPaga = {
      id: 'cp-20',
      empresaId: 'emp-1',
      status: 'paga',
      numero: 'CP-202602-0020',
      numeroDocumento: 'DOC-20',
      descricao: 'Servico mensal',
      valor: 200,
      valorTotal: 200,
      valorPago: 200,
      dataPagamento: new Date('2026-02-12T12:00:00.000Z'),
      dataVencimento: new Date('2026-02-12T12:00:00.000Z'),
      contaBancariaId: 'cb-1',
      fornecedor: {
        nome: 'Fornecedor Teste',
      },
    };

    const { service, itemRepository, contaPagarRepository } = createService([contaPaga]);

    const itemBase = {
      id: 'item-20',
      importacaoId: 'imp-20',
      empresaId: 'emp-1',
      contaBancariaId: 'cb-1',
      tipo: 'debito',
      valor: 200,
      dataLancamento: new Date('2026-02-12T12:00:00.000Z'),
      descricao: 'Pagamento servico mensal',
      conciliado: false,
      auditoriaConciliacao: [],
    };

    itemRepository.findOne
      .mockResolvedValueOnce(itemBase)
      .mockResolvedValueOnce({
        ...itemBase,
        conciliado: true,
        contaPagarId: 'cp-20',
        contaPagar: contaPaga,
        conciliacaoOrigem: 'manual',
        dataConciliacao: new Date('2026-02-12T13:00:00.000Z'),
        conciliadoPor: 'user-1',
        auditoriaConciliacao: [{ acao: 'conciliacao_manual' }],
      })
      .mockResolvedValueOnce({
        ...itemBase,
        conciliado: true,
        contaPagarId: 'cp-20',
        contaPagar: contaPaga,
        conciliacaoOrigem: 'manual',
        auditoriaConciliacao: [{ acao: 'conciliacao_manual' }],
      })
      .mockResolvedValueOnce({
        ...itemBase,
        conciliado: false,
        contaPagarId: undefined,
        contaPagar: undefined,
        auditoriaConciliacao: [{ acao: 'conciliacao_manual' }, { acao: 'desconciliacao_manual' }],
      });

    contaPagarRepository.findOne.mockResolvedValue(contaPaga);
    itemRepository.save.mockImplementation(async (payload: any) => payload);

    const conciliado = await service.conciliarItemManual(
      'item-20',
      { contaPagarId: 'cp-20', observacao: 'Confirmacao manual' },
      'emp-1',
      'user-1',
    );

    expect(conciliado.conciliado).toBe(true);
    expect(conciliado.contaPagarId).toBe('cp-20');
    expect(itemRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'item-20',
        conciliado: true,
        conciliacaoOrigem: 'manual',
      }),
    );

    const desconciliado = await service.desconciliarItemManual(
      'item-20',
      { observacao: 'Desfazer ajuste' },
      'emp-1',
      'user-2',
    );

    expect(desconciliado.conciliado).toBe(false);
    expect(itemRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'item-20',
        conciliado: false,
        contaPagarId: undefined,
      }),
    );
  });
});
