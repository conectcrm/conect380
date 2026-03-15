import { BadRequestException } from '@nestjs/common';
import { ContaPagarService } from './conta-pagar.service';

describe('ContaPagarService', () => {
  const createService = () => {
    const contaPagarRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    const fornecedorRepository = {
      findOne: jest.fn(),
    };
    const contaBancariaRepository = {
      findOne: jest.fn(),
    };
    const contaPagarExportacaoRepository = {
      findOne: jest.fn(),
      save: jest.fn(async (payload) => payload),
      create: jest.fn((payload) => payload),
      createQueryBuilder: jest.fn(),
    };
    const empresaConfigRepository = {
      findOne: jest.fn(),
    };

    const service = new ContaPagarService(
      contaPagarRepository as any,
      fornecedorRepository as any,
      contaBancariaRepository as any,
      contaPagarExportacaoRepository as any,
      empresaConfigRepository as any,
    );

    return {
      service,
      contaPagarRepository,
      fornecedorRepository,
      contaBancariaRepository,
      contaPagarExportacaoRepository,
      empresaConfigRepository,
    };
  };

  const makeFornecedor = () =>
    ({
      id: 'forn-1',
      empresaId: 'emp-1',
      nome: 'Fornecedor Teste',
      cnpjCpf: '12345678000199',
      ativo: true,
      criadoEm: new Date('2026-01-01T00:00:00.000Z'),
      atualizadoEm: new Date('2026-01-01T00:00:00.000Z'),
    }) as any;

  const makeConta = (overrides: Record<string, unknown> = {}) =>
    ({
      id: 'cp-1',
      numero: 'CP-202602-0001',
      descricao: 'Conta teste',
      fornecedorId: 'forn-1',
      empresaId: 'emp-1',
      fornecedor: makeFornecedor(),
      valor: 100,
      valorOriginal: 100,
      valorDesconto: 0,
      valorMulta: 0,
      valorJuros: 0,
      valorTotal: 100,
      valorPago: 0,
      valorRestante: 100,
      dataEmissao: new Date('2026-02-01T00:00:00.000Z'),
      dataVencimento: new Date('2026-02-10T00:00:00.000Z'),
      status: 'pendente',
      categoria: 'fornecedores',
      prioridade: 'media',
      recorrente: false,
      frequenciaRecorrencia: undefined,
      necessitaAprovacao: false,
      tags: [],
      anexos: [],
      criadoPor: 'sistema',
      atualizadoPor: undefined,
      createdAt: new Date('2026-02-01T00:00:00.000Z'),
      updatedAt: new Date('2026-02-01T00:00:00.000Z'),
      ...overrides,
    }) as any;

  it('deve criar serie recorrente com anexos normalizados', async () => {
    const { service, contaPagarRepository, fornecedorRepository } = createService();
    const fornecedor = makeFornecedor();
    const contasSalvas: any[] = [];
    let sequencia = 0;

    fornecedorRepository.findOne.mockResolvedValue(fornecedor);
    contaPagarRepository.create.mockImplementation((data: any) => ({
      ...data,
      id: `cp-${sequencia + 1}`,
      createdAt: new Date('2026-02-01T00:00:00.000Z'),
      updatedAt: new Date('2026-02-01T00:00:00.000Z'),
    }));
    contaPagarRepository.save.mockImplementation(async (entity: any) => {
      sequencia += 1;
      contasSalvas.push(entity);
      return entity;
    });

    jest
      .spyOn(service as any, 'gerarNumeroConta')
      .mockResolvedValueOnce('CP-202602-0001')
      .mockResolvedValueOnce('CP-202602-0002')
      .mockResolvedValueOnce('CP-202602-0003');

    jest.spyOn(service as any, 'findContaEntity').mockImplementation(async () =>
      makeConta({
        ...contasSalvas[0],
        fornecedor,
      }),
    );

    const resposta = await service.create(
      {
        fornecedorId: fornecedor.id,
        descricao: 'Licencas anuais',
        dataVencimento: '2026-03-10',
        dataEmissao: '2026-03-01',
        valorOriginal: 1200,
        valorDesconto: 100,
        categoria: 'fornecedores',
        prioridade: 'alta',
        tipoPagamento: 'pix',
        recorrente: true,
        frequenciaRecorrencia: 'mensal',
        numeroParcelas: 3,
        numeroDocumento: 'NF-123',
        tags: ['software'],
        anexos: [
          { nome: 'proposta.pdf', tipo: 'application/pdf', tamanho: 1024 },
          { nome: '  ', tipo: 'text/plain', tamanho: 10 } as any,
          { nome: 'img.png', tamanho: 200 } as any,
        ],
      } as any,
      'emp-1',
    );

    expect(contaPagarRepository.save).toHaveBeenCalledTimes(3);
    expect(resposta.parcelasGeradas).toBe(3);
    expect(resposta.grupoRecorrenciaId).toBeTruthy();

    const [p1, p2, p3] = contasSalvas;
    expect(p1.numeroDocumento).toBe('NF-123-01/03');
    expect(p2.numeroDocumento).toBe('NF-123-02/03');
    expect(p3.numeroDocumento).toBe('NF-123-03/03');

    expect(new Date(p1.dataVencimento).toISOString().slice(0, 10)).toBe('2026-03-10');
    expect(new Date(p2.dataVencimento).toISOString().slice(0, 10)).toBe('2026-04-10');
    expect(new Date(p3.dataVencimento).toISOString().slice(0, 10)).toBe('2026-05-10');

    expect(p1.tags).toEqual(
      expect.arrayContaining(['software', 'parcela:1/3', expect.stringMatching(/^recorrencia_grupo:/)]),
    );
    expect(p2.tags).toEqual(
      expect.arrayContaining(['software', 'parcela:2/3', expect.stringMatching(/^recorrencia_grupo:/)]),
    );

    expect(p1.anexos).toEqual([
      { nome: 'proposta.pdf', tipo: 'application/pdf', tamanho: 1024 },
      { nome: 'img.png', tipo: 'application/octet-stream', tamanho: 200 },
    ]);
  });

  it('deve marcar conta automaticamente como pendente de aprovacao quando exceder alcada da empresa', async () => {
    const { service, contaPagarRepository, fornecedorRepository, empresaConfigRepository } =
      createService();
    const fornecedor = makeFornecedor();
    let contaSalva: any;

    fornecedorRepository.findOne.mockResolvedValue(fornecedor);
    empresaConfigRepository.findOne.mockResolvedValue({
      empresaId: fornecedor.empresaId,
      alcadaAprovacaoFinanceira: 500,
    });
    contaPagarRepository.create.mockImplementation((data: any) => ({
      ...data,
      id: 'cp-1',
      createdAt: new Date('2026-02-01T00:00:00.000Z'),
      updatedAt: new Date('2026-02-01T00:00:00.000Z'),
    }));
    contaPagarRepository.save.mockImplementation(async (entity: any) => {
      contaSalva = entity;
      return entity;
    });

    jest.spyOn(service as any, 'gerarNumeroConta').mockResolvedValue('CP-202602-0001');
    jest.spyOn(service as any, 'findContaEntity').mockImplementation(async () =>
      makeConta({
        ...contaSalva,
        fornecedor,
      }),
    );

    const resposta = await service.create(
      {
        fornecedorId: fornecedor.id,
        descricao: 'Compra acima da alcada',
        dataVencimento: '2026-03-10',
        dataEmissao: '2026-03-01',
        valorOriginal: 900,
        valorDesconto: 0,
      } as any,
      fornecedor.empresaId,
    );

    expect(contaSalva.necessitaAprovacao).toBe(true);
    expect(resposta.necessitaAprovacao).toBe(true);
  });

  it('deve manter fluxo direto para valores abaixo da alcada da empresa', async () => {
    const { service, contaPagarRepository, fornecedorRepository, empresaConfigRepository } =
      createService();
    const fornecedor = makeFornecedor();
    let contaSalva: any;

    fornecedorRepository.findOne.mockResolvedValue(fornecedor);
    empresaConfigRepository.findOne.mockResolvedValue({
      empresaId: fornecedor.empresaId,
      alcadaAprovacaoFinanceira: 1000,
    });
    contaPagarRepository.create.mockImplementation((data: any) => ({
      ...data,
      id: 'cp-1',
      createdAt: new Date('2026-02-01T00:00:00.000Z'),
      updatedAt: new Date('2026-02-01T00:00:00.000Z'),
    }));
    contaPagarRepository.save.mockImplementation(async (entity: any) => {
      contaSalva = entity;
      return entity;
    });

    jest.spyOn(service as any, 'gerarNumeroConta').mockResolvedValue('CP-202602-0001');
    jest.spyOn(service as any, 'findContaEntity').mockImplementation(async () =>
      makeConta({
        ...contaSalva,
        fornecedor,
      }),
    );

    const resposta = await service.create(
      {
        fornecedorId: fornecedor.id,
        descricao: 'Compra abaixo da alcada',
        dataVencimento: '2026-03-10',
        dataEmissao: '2026-03-01',
        valorOriginal: 300,
        valorDesconto: 0,
      } as any,
      fornecedor.empresaId,
    );

    expect(contaSalva.necessitaAprovacao).toBe(false);
    expect(resposta.necessitaAprovacao).toBe(false);
  });

  it('deve atualizar conta persistindo anexos normalizados', async () => {
    const { service, contaPagarRepository } = createService();
    const conta = makeConta();

    contaPagarRepository.save.mockImplementation(async (entity: any) => entity);
    jest.spyOn(service as any, 'findContaEntity').mockResolvedValue(conta);

    const result = await service.update(
      conta.id,
      {
        anexos: [
          { nome: ' boleto.pdf ', tipo: 'application/pdf', tamanho: '500' as any },
          { nome: '', tipo: 'text/plain', tamanho: 10 } as any,
        ],
      } as any,
      conta.empresaId,
    );

    expect(conta.anexos).toEqual([{ nome: 'boleto.pdf', tipo: 'application/pdf', tamanho: 500 }]);
    expect(result.anexos).toEqual([{ nome: 'boleto.pdf', tipo: 'application/pdf', tamanho: 500 }]);
  });

  it('deve exigir aprovacao quando atualizacao ultrapassar alcada da empresa', async () => {
    const { service, contaPagarRepository, empresaConfigRepository } = createService();
    const conta = makeConta({
      valor: 200,
      valorOriginal: 200,
      valorTotal: 200,
      valorPago: 0,
      valorRestante: 200,
      necessitaAprovacao: false,
      aprovadoPor: undefined,
      dataAprovacao: undefined,
    });

    empresaConfigRepository.findOne.mockResolvedValue({
      empresaId: conta.empresaId,
      alcadaAprovacaoFinanceira: 1000,
    });
    contaPagarRepository.save.mockImplementation(async (entity: any) => entity);
    jest.spyOn(service as any, 'findContaEntity').mockResolvedValue(conta);

    const result = await service.update(
      conta.id,
      {
        valorOriginal: 1200,
      } as any,
      conta.empresaId,
    );

    expect(conta.necessitaAprovacao).toBe(true);
    expect(result.necessitaAprovacao).toBe(true);
  });

  it('deve registrar pagamento com comprovante e atualizar status/valores', async () => {
    const { service, contaPagarRepository, contaBancariaRepository } = createService();
    const conta = makeConta({
      valor: 350,
      valorOriginal: 350,
      valorTotal: 350,
      valorPago: 0,
      valorRestante: 350,
      status: 'pendente',
      observacoes: 'Conta criada',
    });

    contaPagarRepository.save.mockImplementation(async (entity: any) => entity);
    contaBancariaRepository.findOne.mockResolvedValue({
      id: 'conta-1',
      empresaId: conta.empresaId,
      ativo: true,
    });
    jest.spyOn(service as any, 'findContaEntity').mockResolvedValue(conta);

    const result = await service.registrarPagamento(
      conta.id,
      {
        valorPago: 350,
        tipoPagamento: 'pix',
        contaBancariaId: 'conta-1',
        comprovantePagamento: 'comprovante-pix.pdf',
        observacoes: 'Pago no banco',
      } as any,
      conta.empresaId,
    );

    expect(conta.comprovantePagamento).toBe('comprovante-pix.pdf');
    expect(conta.valorPago).toBe(350);
    expect(conta.valorRestante).toBe(0);
    expect(conta.status).toBe('paga');
    expect(conta.observacoes).toContain('Conta criada');
    expect(conta.observacoes).toContain('Pago no banco');

    expect(result.comprovantePagamento).toBe('comprovante-pix.pdf');
    expect(result.status).toBe('pago');
    expect(result.valorPago).toBe(350);
    expect(result.valorRestante).toBe(0);
  });

  it('deve bloquear criacao quando conta bancaria informada nao for valida para a empresa', async () => {
    const { service, contaPagarRepository, fornecedorRepository, contaBancariaRepository } = createService();
    const fornecedor = makeFornecedor();

    fornecedorRepository.findOne.mockResolvedValue(fornecedor);
    contaBancariaRepository.findOne.mockResolvedValue(null);

    await expect(
      service.create(
        {
          fornecedorId: fornecedor.id,
          descricao: 'Despesa com banco invalido',
          dataVencimento: '2026-03-10',
          dataEmissao: '2026-03-01',
          valorOriginal: 300,
          categoria: 'fornecedores',
          prioridade: 'media',
          contaBancariaId: 'conta-inativa',
        } as any,
        fornecedor.empresaId,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(contaPagarRepository.create).not.toHaveBeenCalled();
    expect(contaPagarRepository.save).not.toHaveBeenCalled();
  });

  it('deve bloquear atualizacao quando conta bancaria informada nao for valida para a empresa', async () => {
    const { service, contaPagarRepository, contaBancariaRepository } = createService();
    const conta = makeConta();

    jest.spyOn(service as any, 'findContaEntity').mockResolvedValue(conta);
    contaBancariaRepository.findOne.mockResolvedValue(null);

    await expect(
      service.update(
        conta.id,
        {
          contaBancariaId: 'conta-invalida',
        } as any,
        conta.empresaId,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(contaPagarRepository.save).not.toHaveBeenCalled();
  });

  it('deve bloquear pagamento quando conta bancaria informada nao for valida para a empresa', async () => {
    const { service, contaPagarRepository, contaBancariaRepository } = createService();
    const conta = makeConta();

    jest.spyOn(service as any, 'findContaEntity').mockResolvedValue(conta);
    contaBancariaRepository.findOne.mockResolvedValue(null);

    await expect(
      service.registrarPagamento(
        conta.id,
        {
          valorPago: 50,
          contaBancariaId: 'conta-inativa',
        } as any,
        conta.empresaId,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(contaPagarRepository.save).not.toHaveBeenCalled();
  });

  it('deve bloquear pagamento de conta aguardando aprovacao financeira', async () => {
    const { service, contaPagarRepository } = createService();
    const conta = makeConta({
      necessitaAprovacao: true,
      dataAprovacao: undefined,
    });

    jest.spyOn(service as any, 'findContaEntity').mockResolvedValue(conta);

    await expect(
      service.registrarPagamento(
        conta.id,
        {
          valorPago: 100,
          tipoPagamento: 'pix',
        } as any,
        conta.empresaId,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(contaPagarRepository.save).not.toHaveBeenCalled();
  });

  it('deve aprovar conta com aprovacao pendente registrando auditoria', async () => {
    const { service, contaPagarRepository } = createService();
    const conta = makeConta({
      necessitaAprovacao: true,
      dataAprovacao: undefined,
      aprovadoPor: undefined,
      status: 'pendente',
    });

    contaPagarRepository.save.mockImplementation(async (entity: any) => entity);
    jest.spyOn(service as any, 'findContaEntity').mockResolvedValue(conta);

    const result = await service.aprovar(
      conta.id,
      { observacoes: 'Aprovado pelo financeiro' } as any,
      conta.empresaId,
      'user-financeiro',
    );

    expect(conta.aprovadoPor).toBe('user-financeiro');
    expect(conta.dataAprovacao).toBeInstanceOf(Date);
    expect(conta.atualizadoPor).toBe('user-financeiro');
    expect(conta.observacoes).toContain('Aprovado pelo financeiro');
    expect(result.aprovadoPor).toBe('user-financeiro');
    expect(result.dataAprovacao).toBeTruthy();
  });

  it('deve reprovar conta em aprovacao pendente e cancelar status', async () => {
    const { service, contaPagarRepository } = createService();
    const conta = makeConta({
      necessitaAprovacao: true,
      dataAprovacao: undefined,
      status: 'pendente',
    });

    contaPagarRepository.save.mockImplementation(async (entity: any) => entity);
    jest.spyOn(service as any, 'findContaEntity').mockResolvedValue(conta);

    const result = await service.reprovar(
      conta.id,
      { justificativa: 'Documento fiscal incompleto' } as any,
      conta.empresaId,
      'user-aprovador',
    );

    expect(conta.status).toBe('cancelada');
    expect(conta.atualizadoPor).toBe('user-aprovador');
    expect(conta.observacoes).toContain('Documento fiscal incompleto');
    expect(result.status).toBe('cancelado');
  });

  it('deve listar apenas contas aguardando aprovacao na fila de pendencias', async () => {
    const { service } = createService();

    jest.spyOn(service, 'findAll').mockResolvedValue([
      {
        id: 'cp-1',
        status: 'em_aberto',
        necessitaAprovacao: true,
        dataAprovacao: undefined,
      } as any,
      {
        id: 'cp-2',
        status: 'pago',
        necessitaAprovacao: true,
        dataAprovacao: '2026-02-20T10:00:00.000Z',
      } as any,
      {
        id: 'cp-3',
        status: 'em_aberto',
        necessitaAprovacao: false,
        dataAprovacao: undefined,
      } as any,
      {
        id: 'cp-4',
        status: 'vencido',
        necessitaAprovacao: true,
        dataAprovacao: undefined,
      } as any,
    ]);

    const resultado = await service.listarPendenciasAprovacao('emp-1');

    expect(resultado.map((item) => item.id)).toEqual(['cp-1', 'cp-4']);
  });

  it('deve processar aprovacao em lote com sucesso parcial', async () => {
    const { service } = createService();

    jest.spyOn(service, 'aprovar').mockImplementation(async (id: string) => {
      if (id === 'cp-erro') {
        throw new BadRequestException('Conta nao exige aprovacao financeira');
      }
      return { id, necessitaAprovacao: true, dataAprovacao: '2026-02-27T12:00:00.000Z' } as any;
    });

    const resultado = await service.aprovarLote(
      {
        contaIds: ['cp-ok', 'cp-erro'],
        acao: 'aprovar',
      } as any,
      'emp-1',
      'user-financeiro',
    );

    expect(resultado.total).toBe(2);
    expect(resultado.sucesso).toBe(1);
    expect(resultado.falha).toBe(1);
    expect(resultado.itens.find((item) => item.contaId === 'cp-ok')?.sucesso).toBe(true);
    expect(resultado.itens.find((item) => item.contaId === 'cp-erro')?.sucesso).toBe(false);
  });

  it('deve exigir justificativa para reprovar em lote', async () => {
    const { service } = createService();

    await expect(
      service.aprovarLote(
        {
          contaIds: ['cp-1'],
          acao: 'reprovar',
          justificativa: ' ',
        } as any,
        'emp-1',
        'user-financeiro',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deve bloquear pagamento de conta cancelada', async () => {
    const { service, contaPagarRepository } = createService();
    const conta = makeConta({ status: 'cancelada' });

    jest.spyOn(service as any, 'findContaEntity').mockResolvedValue(conta);

    await expect(
      service.registrarPagamento(
        conta.id,
        { valorPago: 10 } as any,
        conta.empresaId,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(contaPagarRepository.save).not.toHaveBeenCalled();
  });

  it('deve exportar contas a pagar em csv aplicando filtros principais e registrando auditoria', async () => {
    const { service, contaPagarRepository, contaPagarExportacaoRepository } = createService();
    const conta = makeConta({
      numeroDocumento: 'NF-2026-001',
      contaBancariaId: 'conta-1',
      centroCustoId: 'cc-1',
      fornecedor: makeFornecedor(),
    });

    const queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([conta]),
    };
    contaPagarRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

    const resultado = await service.exportarContasPagar('emp-1', {
      formato: 'csv',
      fornecedorId: 'forn-1',
      status: 'pago,vencido',
      contaBancariaId: 'conta-1',
      centroCustoId: 'cc-1',
      dataVencimentoInicio: '2026-02-01',
      dataVencimentoFim: '2026-02-28',
      dataEmissaoInicio: '2026-01-01',
      dataEmissaoFim: '2026-02-10',
    } as any, 'user-1');

    expect(resultado.filename).toMatch(/^contas-pagar-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(resultado.contentType).toBe('text/csv; charset=utf-8');
    expect(resultado.totalRegistros).toBe(1);
    expect(resultado.buffer.toString('utf-8')).toContain('numero_documento');
    expect(resultado.buffer.toString('utf-8')).toContain('NF-2026-001');

    expect(queryBuilder.where).toHaveBeenCalledWith('conta.empresaId = :empresaId', {
      empresaId: 'emp-1',
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('conta.fornecedorId = :fornecedorId', {
      fornecedorId: 'forn-1',
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('conta.status IN (:...status)', {
      status: ['paga', 'vencida'],
    });
    expect(contaPagarExportacaoRepository.save).toHaveBeenCalledTimes(2);
    expect(contaPagarExportacaoRepository.save).toHaveBeenLastCalledWith(
      expect.objectContaining({
        status: 'sucesso',
        totalRegistros: 1,
        nomeArquivo: expect.stringMatching(/^contas-pagar-\d{4}-\d{2}-\d{2}\.csv$/),
      }),
    );
  });

  it('deve exportar contas a pagar em xlsx', async () => {
    const { service, contaPagarRepository, contaPagarExportacaoRepository } = createService();

    const queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    contaPagarRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

    const resultado = await service.exportarContasPagar('emp-1', {
      formato: 'xlsx',
    } as any);

    expect(resultado.filename).toMatch(/^contas-pagar-\d{4}-\d{2}-\d{2}\.xlsx$/);
    expect(resultado.contentType).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(resultado.totalRegistros).toBe(0);
    expect(resultado.buffer.length).toBeGreaterThan(0);
    expect(queryBuilder.getMany).toHaveBeenCalled();
    expect(contaPagarExportacaoRepository.save).toHaveBeenCalledTimes(2);
  });

  it('deve registrar falha na auditoria quando exportacao quebra', async () => {
    const { service, contaPagarRepository, contaPagarExportacaoRepository } = createService();
    const queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockRejectedValue(new Error('erro-exportacao')),
    };
    contaPagarRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

    await expect(
      service.exportarContasPagar(
        'emp-1',
        {
          formato: 'csv',
        } as any,
        'user-2',
      ),
    ).rejects.toThrow('erro-exportacao');

    expect(contaPagarExportacaoRepository.save).toHaveBeenCalledTimes(2);
    expect(contaPagarExportacaoRepository.save).toHaveBeenLastCalledWith(
      expect.objectContaining({
        status: 'falha',
        erro: 'erro-exportacao',
      }),
    );
  });

  it('deve listar historico de exportacoes com filtros', async () => {
    const { service, contaPagarExportacaoRepository } = createService();
    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        {
          id: 'exp-1',
          formato: 'csv',
          status: 'sucesso',
          nomeArquivo: 'contas-pagar-2026-02-27.csv',
          totalRegistros: 25,
          erro: null,
          filtros: { status: ['paga'] },
          usuarioId: 'user-1',
          iniciadoEm: new Date('2026-02-27T10:00:00.000Z'),
          finalizadoEm: new Date('2026-02-27T10:00:05.000Z'),
          createdAt: new Date('2026-02-27T10:00:00.000Z'),
        },
      ]),
    };
    contaPagarExportacaoRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

    const resultado = await service.listarHistoricoExportacoes('emp-1', {
      formato: 'csv',
      status: 'sucesso',
      limite: 30,
    } as any);

    expect(resultado).toHaveLength(1);
    expect(resultado[0]).toEqual(
      expect.objectContaining({
        id: 'exp-1',
        formato: 'csv',
        status: 'sucesso',
        totalRegistros: 25,
        usuarioId: 'user-1',
      }),
    );
    expect(queryBuilder.where).toHaveBeenCalledWith('exportacao.empresaId = :empresaId', {
      empresaId: 'emp-1',
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('exportacao.formato = :formato', {
      formato: 'csv',
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('exportacao.status = :status', {
      status: 'sucesso',
    });
    expect(queryBuilder.limit).toHaveBeenCalledWith(30);
  });
});
