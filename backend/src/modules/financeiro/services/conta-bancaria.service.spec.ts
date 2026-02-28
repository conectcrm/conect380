import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ContaBancariaService } from './conta-bancaria.service';

describe('ContaBancariaService', () => {
  const createService = () => {
    const contaBancariaRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
    };

    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn(),
    };

    const contaPagarRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };

    const service = new ContaBancariaService(
      contaBancariaRepository as any,
      contaPagarRepository as any,
    );

    return { service, contaBancariaRepository, contaPagarRepository, queryBuilder };
  };

  const makeContaBancaria = (overrides: Record<string, unknown> = {}) =>
    ({
      id: 'cb-1',
      empresaId: 'emp-1',
      nome: 'Conta Principal',
      banco: 'Banco XPTO',
      agencia: '0001',
      conta: '12345-6',
      tipoConta: 'corrente',
      saldo: 1000,
      chavePix: 'financeiro@empresa.com',
      ativo: true,
      criadoPor: 'sistema',
      atualizadoPor: undefined,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      ...overrides,
    }) as any;

  it('deve criar conta bancaria aplicando defaults e empresa ativa', async () => {
    const { service, contaBancariaRepository } = createService();
    const payload = {
      nome: 'Conta Operacional',
      banco: 'Banco XPTO',
      agencia: '0001',
      conta: '2222-3',
      tipoConta: 'corrente',
      saldo: 1500,
    };

    contaBancariaRepository.findOne.mockResolvedValue(null);
    contaBancariaRepository.create.mockImplementation((data: any) => data);
    contaBancariaRepository.save.mockImplementation(async (data: any) => ({
      id: 'cb-2',
      ...data,
    }));

    const result = await service.create(payload as any, 'emp-1');

    expect(contaBancariaRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ...payload,
        empresaId: 'emp-1',
        saldo: 1500,
        ativo: true,
        criadoPor: 'sistema',
      }),
    );
    expect(result.id).toBe('cb-2');
    expect(result.empresaId).toBe('emp-1');
  });

  it('deve bloquear criacao de conta bancaria duplicada', async () => {
    const { service, contaBancariaRepository } = createService();
    contaBancariaRepository.findOne.mockResolvedValue(makeContaBancaria());

    await expect(
      service.create(
        {
          nome: 'Conta Duplicada',
          banco: 'Banco XPTO',
          agencia: '0001',
          conta: '12345-6',
        } as any,
        'emp-1',
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(contaBancariaRepository.save).not.toHaveBeenCalled();
  });

  it('deve listar contas com filtro de busca', async () => {
    const { service, contaBancariaRepository } = createService();
    const contas = [makeContaBancaria()];
    contaBancariaRepository.find.mockResolvedValue(contas);

    const result = await service.findAll('emp-1', { busca: 'Banco' });

    expect(contaBancariaRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.any(Array),
      }),
    );
    expect(result).toEqual(contas);
  });

  it('deve retornar erro quando conta bancaria nao existe na empresa', async () => {
    const { service, contaBancariaRepository } = createService();
    contaBancariaRepository.findOne.mockResolvedValue(null);

    await expect(service.findOne('nao-existe', 'emp-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deve atualizar conta bancaria convertendo saldo e registrando auditoria', async () => {
    const { service, contaBancariaRepository } = createService();
    const contaAtual = makeContaBancaria({ id: 'cb-1', saldo: 100 });

    contaBancariaRepository.findOne
      .mockResolvedValueOnce(contaAtual) // findOne(id, empresaId)
      .mockResolvedValueOnce(contaAtual); // validarDuplicidade
    contaBancariaRepository.save.mockImplementation(async (entity: any) => entity);

    const result = await service.update(
      contaAtual.id,
      {
        nome: 'Conta Atualizada',
        saldo: '250' as any,
      } as any,
      contaAtual.empresaId,
    );

    expect(contaBancariaRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'cb-1',
        nome: 'Conta Atualizada',
        saldo: 250,
        atualizadoPor: 'sistema',
      }),
    );
    expect(result.saldo).toBe(250);
  });

  it('deve desativar conta bancaria', async () => {
    const { service, contaBancariaRepository } = createService();
    const conta = makeContaBancaria({ ativo: true });

    contaBancariaRepository.findOne.mockResolvedValue(conta);
    contaBancariaRepository.save.mockImplementation(async (entity: any) => entity);

    const result = await service.desativar(conta.id, conta.empresaId);

    expect(result.ativo).toBe(false);
    expect(result.atualizadoPor).toBe('sistema');
  });

  it('deve bloquear exclusao quando ha contas a pagar vinculadas', async () => {
    const { service, contaBancariaRepository, queryBuilder } = createService();
    const conta = makeContaBancaria();

    contaBancariaRepository.findOne.mockResolvedValue(conta);
    queryBuilder.getCount.mockResolvedValue(2);

    await expect(service.remove(conta.id, conta.empresaId)).rejects.toBeInstanceOf(BadRequestException);
    expect(contaBancariaRepository.remove).not.toHaveBeenCalled();
  });

  it('deve excluir conta bancaria sem vinculacoes', async () => {
    const { service, contaBancariaRepository, queryBuilder } = createService();
    const conta = makeContaBancaria();

    contaBancariaRepository.findOne.mockResolvedValue(conta);
    queryBuilder.getCount.mockResolvedValue(0);
    contaBancariaRepository.remove.mockResolvedValue(conta);

    await service.remove(conta.id, conta.empresaId);

    expect(contaBancariaRepository.remove).toHaveBeenCalledWith(conta);
  });
});
