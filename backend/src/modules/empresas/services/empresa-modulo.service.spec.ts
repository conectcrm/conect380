import { EmpresaModuloService } from './empresa-modulo.service';
import { ModuloEnum } from '../entities/empresa-modulo.entity';

describe('EmpresaModuloService', () => {
  const repositoryMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const tenantBillingPolicyServiceMock = {
    resolveForEmpresa: jest.fn(),
  };

  let service: EmpresaModuloService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EmpresaModuloService(
      repositoryMock as any,
      tenantBillingPolicyServiceMock as any,
    );
  });

  it('retorna todos os modulos para tenant proprietario com fullModuleAccess', async () => {
    tenantBillingPolicyServiceMock.resolveForEmpresa.mockResolvedValue({
      fullModuleAccess: true,
    });

    const result = await service.listarModulosAtivos('owner-tenant-id');

    expect(result).toEqual([
      ModuloEnum.ATENDIMENTO,
      ModuloEnum.CRM,
      ModuloEnum.VENDAS,
      ModuloEnum.COMPRAS,
      ModuloEnum.FINANCEIRO,
      ModuloEnum.BILLING,
      ModuloEnum.ADMINISTRACAO,
    ]);
    expect(repositoryMock.find).not.toHaveBeenCalled();
  });

  it('considera modulo ativo para tenant proprietario mesmo sem registro em empresa_modulos', async () => {
    tenantBillingPolicyServiceMock.resolveForEmpresa.mockResolvedValue({
      fullModuleAccess: true,
    });

    const result = await service.isModuloAtivo('owner-tenant-id', ModuloEnum.ADMINISTRACAO);

    expect(result).toBe(true);
    expect(repositoryMock.findOne).not.toHaveBeenCalled();
  });

  it('filtra modulos expirados e desativa registro vencido', async () => {
    tenantBillingPolicyServiceMock.resolveForEmpresa.mockResolvedValue({
      fullModuleAccess: false,
    });

    repositoryMock.find.mockResolvedValue([
      {
        id: 'module-1',
        modulo: ModuloEnum.CRM,
        data_expiracao: null,
      },
      {
        id: 'module-2',
        modulo: ModuloEnum.ADMINISTRACAO,
        data_expiracao: new Date(Date.now() - 60_000),
      },
    ]);

    const result = await service.listarModulosAtivos('tenant-id');

    expect(result).toEqual([ModuloEnum.CRM]);
    expect(repositoryMock.update).toHaveBeenCalledWith('module-2', { ativo: false });
  });

  it('fallback para consulta normal quando resolucao de politica falha', async () => {
    tenantBillingPolicyServiceMock.resolveForEmpresa.mockRejectedValue(new Error('db timeout'));
    repositoryMock.findOne.mockResolvedValue({
      id: 'module-1',
      modulo: ModuloEnum.ADMINISTRACAO,
      ativo: true,
      data_expiracao: null,
    });

    const result = await service.isModuloAtivo('tenant-id', ModuloEnum.ADMINISTRACAO);

    expect(result).toBe(true);
    expect(repositoryMock.findOne).toHaveBeenCalled();
  });

  it('impede desativacao de modulo essencial', async () => {
    await expect(service.desativar('tenant-id', ModuloEnum.CRM)).rejects.toThrow(
      'Modulo essencial CRM nao pode ser desativado',
    );
    expect(repositoryMock.findOne).not.toHaveBeenCalled();
  });

  it('considera CRM como modulo essencial ativo mesmo sem registro', async () => {
    const result = await service.isModuloAtivo('tenant-id', ModuloEnum.CRM);
    expect(result).toBe(true);
    expect(repositoryMock.findOne).not.toHaveBeenCalled();
  });
});
