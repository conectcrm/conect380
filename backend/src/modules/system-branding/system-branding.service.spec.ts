import { BadRequestException } from '@nestjs/common';
import { SystemBrandingService } from './system-branding.service';

describe('SystemBrandingService', () => {
  const findOneMock = jest.fn();
  const queryMock = jest.fn();
  const saveMock = jest.fn();

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
    service = new SystemBrandingService(repositoryMock as any);
  });

  it('retorna branding padrao quando schema esta sem colunas de manutencao', async () => {
    findOneMock.mockRejectedValue(
      new Error('column SystemBranding.maintenance_enabled does not exist'),
    );

    const result = await service.getPublicBranding();

    expect(result.logoFullUrl).toBe('/brand/conect360-logo-horizontal.svg');
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
});
