import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CentroCustoService } from './centro-custo.service';

describe('CentroCustoService', () => {
  const createService = () => {
    const centroCustoQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };

    const contaPagarQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn(),
    };

    const centroCustoRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(centroCustoQueryBuilder),
    };

    const contaPagarRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(contaPagarQueryBuilder),
    };

    const service = new CentroCustoService(
      centroCustoRepository as any,
      contaPagarRepository as any,
    );

    return {
      service,
      centroCustoRepository,
      contaPagarRepository,
      centroCustoQueryBuilder,
      contaPagarQueryBuilder,
    };
  };

  const makeCentro = (overrides: Record<string, unknown> = {}) =>
    ({
      id: 'cc-1',
      empresaId: 'emp-1',
      codigo: 'ADM',
      nome: 'Administrativo',
      descricao: 'Centro administrativo',
      ativo: true,
      criadoPor: 'sistema',
      atualizadoPor: undefined,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      ...overrides,
    }) as any;

  it('deve criar centro de custo com codigo normalizado', async () => {
    const { service, centroCustoRepository, centroCustoQueryBuilder } = createService();

    centroCustoQueryBuilder.getOne.mockResolvedValue(null);
    centroCustoRepository.create.mockImplementation((data: any) => data);
    centroCustoRepository.save.mockImplementation(async (data: any) => ({
      id: 'cc-2',
      ...data,
    }));

    const result = await service.create(
      {
        codigo: '  adm  ',
        nome: 'Administrativo',
        descricao: 'Centro principal',
      } as any,
      'emp-1',
      'user-1',
    );

    expect(centroCustoRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        codigo: 'ADM',
        nome: 'Administrativo',
        descricao: 'Centro principal',
        ativo: true,
        empresaId: 'emp-1',
        criadoPor: 'user-1',
      }),
    );
    expect(result.codigo).toBe('ADM');
  });

  it('deve bloquear criacao com codigo duplicado', async () => {
    const { service, centroCustoQueryBuilder } = createService();

    centroCustoQueryBuilder.getOne.mockResolvedValueOnce(makeCentro({ id: 'cc-existente' }));

    await expect(
      service.create(
        {
          codigo: 'ADM',
          nome: 'Administrativo',
        } as any,
        'emp-1',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('deve retornar erro quando centro nao existe na empresa', async () => {
    const { service, centroCustoRepository } = createService();
    centroCustoRepository.findOne.mockResolvedValue(null);

    await expect(service.findOne('nao-existe', 'emp-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deve atualizar centro de custo', async () => {
    const { service, centroCustoRepository, centroCustoQueryBuilder } = createService();
    const centroAtual = makeCentro();

    centroCustoRepository.findOne.mockResolvedValue(centroAtual);
    centroCustoQueryBuilder.getOne.mockResolvedValue(null);
    centroCustoRepository.save.mockImplementation(async (entity: any) => entity);

    const result = await service.update(
      centroAtual.id,
      {
        nome: 'Administrativo e Financeiro',
        descricao: 'Atualizado',
      },
      centroAtual.empresaId,
      'user-2',
    );

    expect(result.nome).toBe('Administrativo e Financeiro');
    expect(result.descricao).toBe('Atualizado');
    expect(result.atualizadoPor).toBe('user-2');
  });

  it('deve bloquear exclusao quando houver contas vinculadas', async () => {
    const { service, centroCustoRepository, contaPagarQueryBuilder } = createService();
    const centro = makeCentro();

    centroCustoRepository.findOne.mockResolvedValue(centro);
    contaPagarQueryBuilder.getCount.mockResolvedValue(1);

    await expect(service.remove(centro.id, centro.empresaId)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(centroCustoRepository.remove).not.toHaveBeenCalled();
  });

  it('deve excluir centro sem vinculacoes', async () => {
    const { service, centroCustoRepository, contaPagarQueryBuilder } = createService();
    const centro = makeCentro();

    centroCustoRepository.findOne.mockResolvedValue(centro);
    contaPagarQueryBuilder.getCount.mockResolvedValue(0);
    centroCustoRepository.remove.mockResolvedValue(centro);

    await service.remove(centro.id, centro.empresaId);

    expect(centroCustoRepository.remove).toHaveBeenCalledWith(centro);
  });
});
