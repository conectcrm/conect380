import { BadRequestException } from '@nestjs/common';
import { AtividadeTipo } from './entities/user-activity.entity';
import { UserActivitiesController } from './user-activities.controller';

describe('UserActivitiesController', () => {
  const userActivitiesServiceMock = {
    listarAtividades: jest.fn(),
    registrarAtividade: jest.fn(),
  };

  let controller: UserActivitiesController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new UserActivitiesController(userActivitiesServiceMock as any);
  });

  it('repassa filtros normalizados para o service', async () => {
    userActivitiesServiceMock.listarAtividades.mockResolvedValue([]);

    await controller.listarAtividades(
      'empresa-1',
      '25',
      'user-1',
      'edicao',
      '2026-01-01',
      '2026-01-31',
    );

    expect(userActivitiesServiceMock.listarAtividades).toHaveBeenCalledWith('empresa-1', {
      limit: 25,
      usuarioId: 'user-1',
      tipo: AtividadeTipo.EDICAO,
      dataInicio: '2026-01-01',
      dataFim: '2026-01-31',
    });
  });

  it('rejeita tipo invalido', async () => {
    await expect(
      controller.listarAtividades('empresa-1', undefined, undefined, 'invalido'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejeita limit invalido', async () => {
    await expect(
      controller.listarAtividades('empresa-1', '0'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
