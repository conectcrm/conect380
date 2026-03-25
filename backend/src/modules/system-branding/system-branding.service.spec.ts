import { BadRequestException } from '@nestjs/common';
import { SystemBrandingService } from './system-branding.service';

describe('SystemBrandingService', () => {
  const findOneMock = jest.fn();
  const queryMock = jest.fn();
  const saveMock = jest.fn();
  const originalOwnerEmpresaIds = process.env.PLATFORM_OWNER_EMPRESA_IDS;

  const repositoryMock = {
    findOne: findOneMock,
    query: queryMock,
    save: saveMock,
  };

  let service: SystemBrandingService;

  beforeEach(() => {
    findOneMock.mockReset();
    queryMock.mockReset();
    saveMock.mockReset();
    if (originalOwnerEmpresaIds === undefined) {
      delete process.env.PLATFORM_OWNER_EMPRESA_IDS;
    } else {
      process.env.PLATFORM_OWNER_EMPRESA_IDS = originalOwnerEmpresaIds;
    }
    service = new SystemBrandingService(repositoryMock as any);
  });

  afterAll(() => {
    if (originalOwnerEmpresaIds === undefined) {
      delete process.env.PLATFORM_OWNER_EMPRESA_IDS;
      return;
    }

    process.env.PLATFORM_OWNER_EMPRESA_IDS = originalOwnerEmpresaIds;
  });

  it('retorna branding padrao quando schema esta sem colunas de manutencao', async () => {
    findOneMock.mockRejectedValue(
      new Error('column SystemBranding.maintenance_enabled does not exist'),
    );

    const result = await service.getPublicBranding();

    expect(result.logoFullUrl).toBe('');
    expect(result.maintenanceBanner.enabled).toBe(false);
    expect(result.maintenanceBanner.title).toBe('Manutencao programada');
  });

  it('retorna erro orientado quando update e solicitado com schema desatualizado', async () => {
    findOneMock.mockRejectedValue(
      new Error('column SystemBranding.maintenance_enabled does not exist'),
    );
    queryMock.mockRejectedValue(
      new Error('column SystemBranding.maintenance_enabled does not exist'),
    );

    await expect(
      service.updateBranding(
        {
          maintenanceEnabled: true,
        },
        'user-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('retorna erro orientado quando save falha por schema desatualizado', async () => {
    findOneMock.mockResolvedValue({
      id: '1',
      chave: 'global',
      logoFullUrl: null,
      logoFullLightUrl: null,
      logoIconUrl: null,
      loadingLogoUrl: null,
      faviconUrl: null,
      maintenanceEnabled: false,
      maintenanceTitle: null,
      maintenanceMessage: null,
      maintenanceStartsAt: null,
      maintenanceExpectedEndAt: null,
      maintenanceSeverity: 'warning',
      updatedBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    saveMock.mockRejectedValue(
      new Error('column system_branding.maintenance_enabled does not exist'),
    );

    await expect(
      service.updateBranding(
        {
          maintenanceEnabled: true,
        },
        'user-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('retorna branding padrao em runtime quando tenant nao e proprietario', async () => {
    process.env.PLATFORM_OWNER_EMPRESA_IDS = 'tenant-owner-1';
    const scopedService = new SystemBrandingService(repositoryMock as any);

    const result = await scopedService.getRuntimeBrandingForEmpresa('tenant-outro-1');

    expect(result.logoFullUrl).toBe('');
    expect(result.logoIconUrl).toBe('');
    expect(result.faviconUrl).toBe('/favicon.svg');
    expect(result.maintenanceBanner.enabled).toBe(false);
  });

  it('retorna branding global em runtime quando tenant e proprietario', async () => {
    process.env.PLATFORM_OWNER_EMPRESA_IDS = 'tenant-owner-1';
    findOneMock.mockResolvedValue({
      id: '1',
      chave: 'global',
      logoFullUrl: '/uploads/system-branding/full.png',
      logoFullLightUrl: null,
      logoIconUrl: '/uploads/system-branding/icon.png',
      loadingLogoUrl: null,
      faviconUrl: '/uploads/system-branding/favicon.png',
      maintenanceEnabled: true,
      maintenanceTitle: 'Manutencao',
      maintenanceMessage: 'Mensagem',
      maintenanceStartsAt: new Date('2026-03-20T00:00:00.000Z'),
      maintenanceExpectedEndAt: null,
      maintenanceSeverity: 'warning',
      updatedBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const scopedService = new SystemBrandingService(repositoryMock as any);

    const result = await scopedService.getRuntimeBrandingForEmpresa('tenant-owner-1');

    expect(result.logoFullUrl).toBe('/uploads/system-branding/full.png');
    expect(result.logoIconUrl).toBe('/uploads/system-branding/icon.png');
    expect(result.faviconUrl).toBe('/uploads/system-branding/favicon.png');
    expect(result.maintenanceBanner.enabled).toBe(true);
    expect(result.maintenanceBanner.title).toBe('Manutencao');
  });

  it('retorna branding padrao em runtime quando empresaId nao informado', async () => {
    process.env.PLATFORM_OWNER_EMPRESA_IDS = 'tenant-owner-1';
    const scopedService = new SystemBrandingService(repositoryMock as any);

    const result = await scopedService.getRuntimeBrandingForEmpresa(null);

    expect(result.logoFullUrl).toBe('');
    expect(result.logoIconUrl).toBe('');
    expect(result.faviconUrl).toBe('/favicon.svg');
    expect(result.maintenanceBanner.enabled).toBe(false);
  });
});
