import { MetasService } from './metas.service';
import { MetaTipo } from './entities/meta.entity';

type MetaRow = {
  id: string;
  tipo: MetaTipo;
  periodo: string;
  valor: number;
  ativa: boolean;
  vendedorId: string | null;
  regiao: string | null;
  empresaId: string | null;
  atualizadaEm: Date;
};

const getInValues = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
  if (typeof value === 'string') return [value];
  if (typeof value !== 'object') return [];

  const maybeObj = value as Record<string, unknown>;
  const candidates = [maybeObj._value, maybeObj.value, maybeObj._values];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter((item): item is string => typeof item === 'string');
    }
  }
  return [];
};

describe('MetasService', () => {
  let service: MetasService;
  let metasDb: MetaRow[];
  const dateAt = (year: number, monthIndex: number, day: number): Date =>
    new Date(year, monthIndex, day, 12, 0, 0, 0);

  const metasRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    create: jest.fn(),
    query: jest.fn(),
  };

  beforeEach(() => {
    metasDb = [];
    jest.clearAllMocks();

    metasRepository.query.mockResolvedValue([{ data_type: 'uuid', udt_name: 'uuid' }]);

    metasRepository.find.mockImplementation(async ({ where }: { where: Record<string, unknown> }) => {
      const periodValues = getInValues(where.periodo);
      return metasDb.filter((meta) => {
        if (where.ativa !== undefined && meta.ativa !== where.ativa) return false;
        if (where.tipo !== undefined && meta.tipo !== where.tipo) return false;
        if (where.vendedorId !== undefined && meta.vendedorId !== where.vendedorId) return false;
        if (where.regiao !== undefined && meta.regiao !== where.regiao) return false;
        if (where.empresaId !== undefined && meta.empresaId !== where.empresaId) return false;
        if (periodValues.length > 0 && !periodValues.includes(meta.periodo)) return false;
        return true;
      });
    });

    service = new MetasService(metasRepository as any);
  });

  it('calcula meta mensal proporcional ao intervalo', async () => {
    metasDb.push({
      id: 'meta-mensal',
      tipo: MetaTipo.MENSAL,
      periodo: '2026-03',
      valor: 3100,
      ativa: true,
      vendedorId: null,
      regiao: null,
      empresaId: 'emp-1',
      atualizadaEm: new Date('2026-03-01T10:00:00.000Z'),
    });

    const valor = await service.getMetaValorParaRange(
      dateAt(2026, 2, 1),
      dateAt(2026, 2, 10),
      undefined,
      undefined,
      'emp-1',
    );

    expect(valor).toBeCloseTo(1000, 2);
  });

  it('prioriza meta mensal sobre trimestral e anual no mesmo escopo', async () => {
    metasDb.push(
      {
        id: 'meta-anual',
        tipo: MetaTipo.ANUAL,
        periodo: '2026',
        valor: 36500,
        ativa: true,
        vendedorId: null,
        regiao: null,
        empresaId: 'emp-1',
        atualizadaEm: new Date('2026-01-10T10:00:00.000Z'),
      },
      {
        id: 'meta-trimestral',
        tipo: MetaTipo.TRIMESTRAL,
        periodo: '2026-Q1',
        valor: 18000,
        ativa: true,
        vendedorId: null,
        regiao: null,
        empresaId: 'emp-1',
        atualizadaEm: new Date('2026-01-11T10:00:00.000Z'),
      },
      {
        id: 'meta-mensal',
        tipo: MetaTipo.MENSAL,
        periodo: '2026-03',
        valor: 6200,
        ativa: true,
        vendedorId: null,
        regiao: null,
        empresaId: 'emp-1',
        atualizadaEm: new Date('2026-03-01T10:00:00.000Z'),
      },
    );

    const valor = await service.getMetaValorParaRange(
      dateAt(2026, 2, 1),
      dateAt(2026, 2, 31),
      undefined,
      undefined,
      'emp-1',
    );

    expect(valor).toBeCloseTo(6200, 2);
  });

  it('usa meta trimestral quando nao existe meta mensal', async () => {
    metasDb.push({
      id: 'meta-trimestral',
      tipo: MetaTipo.TRIMESTRAL,
      periodo: '2026-Q1',
      valor: 9000,
      ativa: true,
      vendedorId: null,
      regiao: null,
      empresaId: 'emp-1',
      atualizadaEm: new Date('2026-01-10T10:00:00.000Z'),
    });

    const valor = await service.getMetaValorParaRange(
      dateAt(2026, 2, 1),
      dateAt(2026, 2, 31),
      undefined,
      undefined,
      'emp-1',
    );

    expect(valor).toBeCloseTo(3100, 2);
  });

  it('prioriza escopo de vendedor sobre meta geral', async () => {
    const vendedorId = '11111111-1111-4111-8111-111111111111';

    metasDb.push(
      {
        id: 'meta-geral',
        tipo: MetaTipo.MENSAL,
        periodo: '2026-03',
        valor: 3100,
        ativa: true,
        vendedorId: null,
        regiao: null,
        empresaId: 'emp-1',
        atualizadaEm: new Date('2026-03-01T09:00:00.000Z'),
      },
      {
        id: 'meta-vendedor',
        tipo: MetaTipo.MENSAL,
        periodo: '2026-03',
        valor: 6200,
        ativa: true,
        vendedorId,
        regiao: null,
        empresaId: 'emp-1',
        atualizadaEm: new Date('2026-03-01T10:00:00.000Z'),
      },
    );

    const valor = await service.getMetaValorParaRange(
      dateAt(2026, 2, 1),
      dateAt(2026, 2, 31),
      vendedorId,
      undefined,
      'emp-1',
    );

    expect(valor).toBeCloseTo(6200, 2);
  });
});
