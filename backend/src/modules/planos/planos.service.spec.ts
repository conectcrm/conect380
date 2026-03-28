import { BadRequestException } from '@nestjs/common';
import { PlanosService } from './planos.service';

describe('PlanosService - validacao de limites', () => {
  let service: PlanosService;

  const planoRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const moduloSistemaRepository = {
    find: jest.fn(),
  };

  const planoModuloRepository = {
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const dataSource = {
    query: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new PlanosService(
      planoRepository as any,
      moduloSistemaRepository as any,
      planoModuloRepository as any,
      dataSource as any,
    );
  });

  it('rejeita criacao de plano com limiteUsuarios = 0', async () => {
    planoRepository.findOne.mockResolvedValue(null);

    await expect(
      service.criar({
        nome: 'Plano invalido',
        codigo: 'plano-invalido',
        descricao: 'teste',
        preco: 100,
        limiteUsuarios: 0,
        limiteClientes: 10,
        limiteStorage: 1024,
        limiteApiCalls: 1000,
        whiteLabel: false,
        suportePrioritario: false,
        ativo: true,
        ordem: 0,
        modulosInclusos: ['modulo-1'],
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(moduloSistemaRepository.find).not.toHaveBeenCalled();
  });

  it('rejeita atualizacao de plano com limiteApiCalls = 0', async () => {
    jest.spyOn(service, 'buscarPorId').mockResolvedValue({
      id: 'plano-1',
      codigo: 'starter',
    } as any);

    await expect(
      service.atualizar('plano-1', {
        modulosInclusos: ['modulo-1'],
        limiteApiCalls: 0,
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(moduloSistemaRepository.find).not.toHaveBeenCalled();
  });

  it('inclui modulos inativos quando includeInactive = true', async () => {
    planoRepository.find.mockResolvedValue([
      { codigo: 'starter' },
      { codigo: 'business' },
      { codigo: 'enterprise' },
    ]);
    moduloSistemaRepository.find
      .mockResolvedValueOnce([
        { codigo: 'CRM' },
        { codigo: 'ATENDIMENTO' },
        { codigo: 'VENDAS' },
        { codigo: 'FINANCEIRO' },
        { codigo: 'COMPRAS' },
        { codigo: 'BILLING' },
        { codigo: 'ADMINISTRACAO' },
      ])
      .mockResolvedValueOnce([{ id: 'mod-compras', codigo: 'COMPRAS', ativo: false }]);

    await service.listarModulosDisponiveis(true);

    expect(moduloSistemaRepository.find).toHaveBeenLastCalledWith({
      where: undefined,
      order: { ordem: 'ASC', nome: 'ASC' },
    });
  });

  it('executa bootstrap defaults quando faltar modulo canonico no catalogo', async () => {
    planoRepository.find.mockResolvedValue([
      { codigo: 'starter' },
      { codigo: 'business' },
      { codigo: 'enterprise' },
    ]);
    moduloSistemaRepository.find
      .mockResolvedValueOnce([
        { codigo: 'CRM' },
        { codigo: 'ATENDIMENTO' },
        { codigo: 'VENDAS' },
        { codigo: 'FINANCEIRO' },
        { codigo: 'BILLING' },
        { codigo: 'ADMINISTRACAO' },
      ])
      .mockResolvedValueOnce([{ id: 'mod-crm', codigo: 'CRM', ativo: true }]);

    const bootstrapSpy = jest
      .spyOn(service, 'bootstrapDefaults')
      .mockResolvedValue({} as Awaited<ReturnType<PlanosService['bootstrapDefaults']>>);

    await service.listarModulosDisponiveis();

    expect(bootstrapSpy).toHaveBeenCalledWith({ overwrite: false });
    expect(moduloSistemaRepository.find).toHaveBeenLastCalledWith({
      where: { ativo: true },
      order: { ordem: 'ASC', nome: 'ASC' },
    });
  });
});
