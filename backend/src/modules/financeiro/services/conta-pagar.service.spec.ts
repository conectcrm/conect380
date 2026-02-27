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

    const service = new ContaPagarService(
      contaPagarRepository as any,
      fornecedorRepository as any,
      contaBancariaRepository as any,
    );

    return { service, contaPagarRepository, fornecedorRepository, contaBancariaRepository };
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
});
