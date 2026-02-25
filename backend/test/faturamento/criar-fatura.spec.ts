import { FaturamentoService } from '../../src/modules/faturamento/services/faturamento.service';
import { Fatura } from '../../src/modules/faturamento/entities/fatura.entity';
import { ItemFatura } from '../../src/modules/faturamento/entities/item-fatura.entity';
import { Contrato } from '../../src/modules/contratos/entities/contrato.entity';
import { CreateFaturaDto } from '../../src/modules/faturamento/dto/fatura.dto';

class EmailMock {
  async enviarEmailGenerico() {
    return true;
  }
}

function createInMemoryRepository<T extends { id?: any }>() {
  const data: T[] = [];
  let seq = 1;

  const saveSingle = async (obj: T): Promise<T> => {
    const record: any = { ...obj };
    if (!record.id) {
      record.id = seq++;
    }

    const index = data.findIndex((item) => (item as any).id === record.id);
    if (index >= 0) {
      data[index] = record;
    } else {
      data.push(record);
    }

    return { ...record } as T;
  };

  return {
    create: (obj: Partial<T>) => ({ ...obj }) as T,
    save: async (obj: T | T[]) => {
      if (Array.isArray(obj)) {
        const saved: T[] = [];
        for (const item of obj) {
          saved.push(await saveSingle(item));
        }
        return saved as any;
      }

      return saveSingle(obj);
    },
    findOne: async (opts: any) => {
      if (opts?.where?.id != null) {
        const found = data.find((d) => (d as any).id === opts.where.id);
        if (!found) return null;

        if ((found as any).numero && opts.relations?.includes('itens')) {
          (found as any).itens = (itemRepo as any)
            ._all()
            .filter((i: any) => i.faturaId === (found as any).id);
          (found as any).pagamentos = [];
        }

        return { ...found } as T;
      }

      return null;
    },
    createQueryBuilder: () => ({
      where: () => ({
        orderBy: () => ({
          getOne: async () =>
            data
              .slice()
              .sort((a: any, b: any) => ((a.numero || '') > (b.numero || '') ? -1 : 1))[0],
        }),
      }),
    }),
    _all: () => data,
  };
}

const faturaRepo = createInMemoryRepository<Fatura>();
const itemRepo = createInMemoryRepository<ItemFatura>();
const contratoRepo = createInMemoryRepository<Contrato>();
const clienteRepo = createInMemoryRepository<any>();

describe('FaturamentoService - criar fatura (unit sem TypeORM)', () => {
  let service: FaturamentoService;

  beforeAll(() => {
    service = new FaturamentoService(
      faturaRepo as any,
      itemRepo as any,
      contratoRepo as any,
      clienteRepo as any,
      new EmailMock() as any,
    );
  });

  it('calcula valorTotal do item corretamente', async () => {
    const dto: CreateFaturaDto = {
      clienteId: '11870d4f-0059-4466-a546-1c878d1330a2',
      usuarioResponsavelId: 'a47ac10b-58cc-4372-a567-0e02b2c3d480',
      tipo: 'unica' as any,
      descricao: 'Teste Fatura',
      dataVencimento: new Date().toISOString().split('T')[0],
      itens: [{ descricao: 'Item Teste', quantidade: 2, valorUnitario: 50, valorDesconto: 10 }],
      valorDesconto: 0,
    };

    const fatura = await service.criarFatura(dto, 'empresa-teste');

    expect(fatura.id).toBeDefined();
    expect(fatura.itens).toHaveLength(1);
    expect(Number(fatura.itens[0].valorTotal)).toBe(90);
  });

  it('soma varios itens com descontos mistos', async () => {
    const dto: CreateFaturaDto = {
      clienteId: '22770d4f-0059-4466-a546-1c878d1330a3',
      usuarioResponsavelId: 'b47ac10b-58cc-4372-a567-0e02b2c3d481',
      tipo: 'unica' as any,
      descricao: 'Teste Multi Itens',
      dataVencimento: new Date().toISOString().split('T')[0],
      itens: [
        { descricao: 'A', quantidade: 2, valorUnitario: 50 },
        { descricao: 'B', quantidade: 1, valorUnitario: 80, valorDesconto: 20 },
        { descricao: 'C', quantidade: 3, valorUnitario: 40, percentualDesconto: 25 },
        {
          descricao: 'D',
          quantidade: 4,
          valorUnitario: 25,
          valorDesconto: 10,
          percentualDesconto: 10,
        },
      ],
    };

    const fatura = await service.criarFatura(dto, 'empresa-teste');
    const totalItens = fatura.itens.reduce((acc, i) => acc + Number(i.valorTotal), 0);

    expect(Number(totalItens.toFixed(2))).toBe(330);
  });
});
