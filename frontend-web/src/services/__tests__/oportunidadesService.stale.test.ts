import { api } from '../api';
import { oportunidadesService } from '../oportunidadesService';

jest.mock('../api', () => ({
  __esModule: true,
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const apiMock = api as unknown as {
  get: jest.Mock;
  post: jest.Mock;
  patch: jest.Mock;
  delete: jest.Mock;
};

describe('oportunidadesService stale policy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve obter politica stale por tenant', async () => {
    const payload = {
      enabled: true,
      thresholdDays: 30,
      source: 'tenant',
      autoArchiveEnabled: false,
      autoArchiveAfterDays: 60,
      autoArchiveSource: 'default',
    };
    apiMock.get.mockResolvedValue({ data: payload });

    const result = await oportunidadesService.obterStalePolicy();

    expect(apiMock.get).toHaveBeenCalledWith('/oportunidades/lifecycle/stale-policy');
    expect(result).toEqual(payload);
  });

  it('deve atualizar politica stale com payload esperado', async () => {
    const updatePayload = {
      enabled: true,
      thresholdDays: 21,
      autoArchiveEnabled: true,
      autoArchiveAfterDays: 45,
    };

    apiMock.patch.mockResolvedValue({
      data: {
        ...updatePayload,
        source: 'tenant',
        autoArchiveSource: 'tenant',
      },
    });

    const result = await oportunidadesService.atualizarStalePolicy(updatePayload);

    expect(apiMock.patch).toHaveBeenCalledWith(
      '/oportunidades/lifecycle/stale-policy',
      updatePayload,
    );
    expect(result).toEqual({
      ...updatePayload,
      source: 'tenant',
      autoArchiveSource: 'tenant',
    });
  });

  it('deve listar oportunidades paradas serializando threshold_days e limit', async () => {
    apiMock.get.mockResolvedValue({
      data: {
        enabled: true,
        thresholdDays: 30,
        totalCandidates: 5,
        totalStale: 1,
        generatedAt: '2026-03-06T10:00:00.000Z',
        stale: [
          {
            id: 101,
            titulo: 'Negocio parado',
            descricao: 'Sem retorno',
            valor: '1200.50',
            probabilidade: 45,
            estagio: 'qualification',
            prioridade: 'media',
            origem: 'website',
            tags: ['follow-up'],
            responsavel: {
              id: 'user-1',
              nome: 'Vendedor 1',
              email: 'vendedor1@empresa.com',
            },
            createdAt: '2026-02-01T09:00:00.000Z',
            updatedAt: '2026-03-01T09:00:00.000Z',
            is_stale: true,
            stale_days: 33,
            last_interaction_at: '2026-02-02T08:00:00.000Z',
            stale_since: '2026-03-03T08:00:00.000Z',
          },
        ],
      },
    });

    const result = await oportunidadesService.listarOportunidadesParadas({
      thresholdDays: 30,
      limit: 200,
    });

    expect(apiMock.get).toHaveBeenCalledWith('/oportunidades/stale', {
      params: {
        threshold_days: 30,
        limit: 200,
      },
    });
    expect(result.totalStale).toBe(1);
    expect(result.stale).toHaveLength(1);
    expect(result.stale[0].id).toBe(101);
    expect(result.stale[0].is_stale).toBe(true);
    expect(result.stale[0].stale_days).toBe(33);
    expect(result.stale[0].last_interaction_at).toBeInstanceOf(Date);
    expect(result.stale[0].stale_since).toBeInstanceOf(Date);
  });

  it('deve executar auto arquivamento com dry_run=true quando solicitado', async () => {
    apiMock.post.mockResolvedValue({
      data: {
        enabled: true,
        autoArchiveEnabled: true,
        thresholdDays: 45,
        totalCandidates: 2,
        archivedCount: 1,
        dryRun: true,
        trigger: 'manual',
        archivedIds: ['opp-1'],
        failed: [],
        generatedAt: '2026-03-06T10:00:00.000Z',
      },
    });

    const result = await oportunidadesService.executarAutoArquivamentoStale({ dryRun: true });

    expect(apiMock.post).toHaveBeenCalledWith('/oportunidades/stale/auto-archive/run', null, {
      params: {
        dry_run: 'true',
      },
    });
    expect(result.dryRun).toBe(true);
    expect(result.archivedCount).toBe(1);
  });

  it('deve executar auto arquivamento sem dry_run quando nao informado', async () => {
    apiMock.post.mockResolvedValue({
      data: {
        enabled: true,
        autoArchiveEnabled: false,
        thresholdDays: 45,
        totalCandidates: 0,
        archivedCount: 0,
        dryRun: false,
        trigger: 'manual',
        archivedIds: [],
        failed: [],
        generatedAt: '2026-03-06T10:00:00.000Z',
      },
    });

    await oportunidadesService.executarAutoArquivamentoStale();

    expect(apiMock.post).toHaveBeenCalledWith('/oportunidades/stale/auto-archive/run', null, {
      params: {
        dry_run: undefined,
      },
    });
  });
});
