import {
  defaultDashboardV2Filters,
  resolveDashboardV2Range,
  sanitizeDashboardV2Filters,
  type DashboardV2Filters,
} from '../useDashboardV2';

jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

describe('useDashboardV2 filtros e periodo', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    // Data fixa para evitar flutuação nos testes de periodo.
    jest.setSystemTime(new Date(2026, 2, 4, 10, 0, 0, 0));
  });

  it('resolve periodo de hoje e mes atual corretamente', () => {
    const hoje = resolveDashboardV2Range({
      periodPreset: 'today',
    } as DashboardV2Filters);
    const mesAtual = resolveDashboardV2Range({
      periodPreset: 'month',
    } as DashboardV2Filters);

    expect(hoje).toEqual({
      periodStart: '2026-03-04',
      periodEnd: '2026-03-04',
    });
    expect(mesAtual).toEqual({
      periodStart: '2026-03-01',
      periodEnd: '2026-03-04',
    });
  });

  it('resolve periodo do mes anterior e janela de 30 dias corretamente', () => {
    const mesAnterior = resolveDashboardV2Range({
      periodPreset: 'lastMonth',
    } as DashboardV2Filters);
    const ultimos30 = resolveDashboardV2Range({
      periodPreset: '30d',
    } as DashboardV2Filters);

    expect(mesAnterior).toEqual({
      periodStart: '2026-02-01',
      periodEnd: '2026-02-28',
    });
    expect(ultimos30).toEqual({
      periodStart: '2026-02-03',
      periodEnd: '2026-03-04',
    });
  });

  it('resolve periodo custom e corrige ordem invertida de datas', () => {
    const customOrdenado = resolveDashboardV2Range({
      periodPreset: 'custom',
      customStart: '2026-03-02',
      customEnd: '2026-03-10',
    });
    const customInvertido = resolveDashboardV2Range({
      periodPreset: 'custom',
      customStart: '2026-03-10',
      customEnd: '2026-03-02',
    });

    expect(customOrdenado).toEqual({
      periodStart: '2026-03-02',
      periodEnd: '2026-03-10',
    });
    expect(customInvertido).toEqual({
      periodStart: '2026-03-02',
      periodEnd: '2026-03-10',
    });
  });

  it('fallback para 30 dias quando custom nao possui datas validas', () => {
    const semDatas = resolveDashboardV2Range({
      periodPreset: 'custom',
    });
    const dataInvalida = resolveDashboardV2Range({
      periodPreset: 'custom',
      customStart: '2026-13-50',
      customEnd: '2026-99-99',
    });

    expect(semDatas).toEqual({
      periodStart: '2026-02-03',
      periodEnd: '2026-03-04',
    });
    expect(dataInvalida).toEqual({
      periodStart: '2026-02-03',
      periodEnd: '2026-03-04',
    });
  });

  it('sanitiza filtros com compatibilidade legado e limpa custom fora do modo custom', () => {
    const fromLegacy = sanitizeDashboardV2Filters({
      period: '90d',
      customStart: '2026-03-01',
      customEnd: '2026-03-31',
      vendedorId: 'vend-1',
    });

    expect(fromLegacy).toEqual({
      periodPreset: '90d',
      customStart: undefined,
      customEnd: undefined,
      vendedorId: 'vend-1',
      pipelineId: undefined,
    });
  });

  it('sanitiza filtros invalidos com defaults seguros', () => {
    const invalid = sanitizeDashboardV2Filters({
      periodPreset: 'nao-existe',
      customStart: 'abc',
      customEnd: '123',
      vendedorId: '',
      pipelineId: '',
    });

    expect(invalid).toEqual(defaultDashboardV2Filters);
  });

  it('sanitiza custom invertido no proprio estado salvo', () => {
    const customInvertido = sanitizeDashboardV2Filters({
      periodPreset: 'custom',
      customStart: '2026-03-10',
      customEnd: '2026-03-02',
      vendedorId: 'vend-2',
    });

    expect(customInvertido).toEqual({
      periodPreset: 'custom',
      customStart: '2026-03-02',
      customEnd: '2026-03-10',
      vendedorId: 'vend-2',
      pipelineId: undefined,
    });
  });
});
