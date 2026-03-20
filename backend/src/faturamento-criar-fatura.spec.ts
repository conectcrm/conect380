import { FaturamentoService } from './modules/faturamento/services/faturamento.service';
import { Fatura } from './modules/faturamento/entities/fatura.entity';
import { ItemFatura } from './modules/faturamento/entities/item-fatura.entity';
import { CreateFaturaDto } from './modules/faturamento/dto/fatura.dto';
import { EmailIntegradoService } from './modules/propostas/email-integrado.service';
import { Contrato } from './modules/contratos/entities/contrato.entity';

class EmailMock {
  async enviarEmailGenerico() {
    return true;
  }

  async enviarEmailGenericoDetalhado() {
    return { sucesso: true, simulado: false };
  }
}

// Repositório genérico em memória
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
        const results: T[] = [];
        for (const item of obj) {
          results.push(await saveSingle(item));
        }
        return results as any;
      }

      return saveSingle(obj);
    },
    findOne: async (opts: any) => {
      if (opts?.where?.id != null) {
        const found = data.find((d) => (d as any).id === opts.where.id);
        if (!found) return null;
        // preenchimento manual de itens quando buscando fatura
        // Como não temos instâncias reais de classe (apenas objetos), usar heurística por propriedades
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
          getOne: () =>
            Promise.resolve(
              data
                .slice()
                .sort((a: any, b: any) => ((a.numero || '') > (b.numero || '') ? -1 : 1))[0],
            ),
        }),
      }),
    }),
    query: async () => [],
    manager: {
      query: async () => [],
    },
    _all: () => data,
  };
}

// Instâncias dos repositórios em memória
const faturaRepo = createInMemoryRepository<Fatura>();
const itemRepo = createInMemoryRepository<ItemFatura>();
const contratoRepo = createInMemoryRepository<Contrato>();
const clienteRepo = createInMemoryRepository<any>();
const propostasServiceMock = {};

describe('FaturamentoService - criar fatura (unitário sem TypeORM)', () => {
  let service: FaturamentoService;

  beforeAll(() => {
    service = new FaturamentoService(
      faturaRepo as any,
      itemRepo as any,
      contratoRepo as any,
      clienteRepo as any,
      propostasServiceMock as any,
      new EmailMock() as any,
    );
  });

  it('deve criar fatura com item calculando valorTotal corretamente', async () => {
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
    expect(fatura.itens.length).toBe(1);
    const item = fatura.itens[0];
    expect(Number(item.valorTotal)).toBe(90); // 2 * 50 - 10
  });

  it('deve persistir impostos estruturados e compor o valor total da fatura', async () => {
    const dto: CreateFaturaDto = {
      clienteId: 'a96cb5f6-0688-4ec1-9f29-e43f5bb8e3f2',
      usuarioResponsavelId: 'f47ac10b-58cc-4372-a567-0e02b2c3d489',
      tipo: 'unica' as any,
      descricao: 'Fatura com tributacao estruturada',
      dataVencimento: new Date().toISOString().split('T')[0],
      itens: [{ descricao: 'Item tributavel', quantidade: 1, valorUnitario: 100 }],
      valorDesconto: 10,
      valorImpostos: 18,
      percentualImpostos: 20,
      diasCarenciaJuros: 5,
      percentualJuros: 2,
      percentualMulta: 1,
      detalhesTributarios: { origem: 'teste_unitario' },
    };

    const fatura = await service.criarFatura(dto, 'empresa-teste');
    expect(Number(fatura.valorDesconto)).toBe(10);
    expect(Number(fatura.valorImpostos)).toBe(18);
    expect(Number(fatura.valorTotal)).toBe(108); // (100 - 10) + 18
    expect(Number(fatura.diasCarenciaJuros)).toBe(5);
    expect(Number(fatura.percentualJuros)).toBe(2);
    expect(Number(fatura.percentualMulta)).toBe(1);
  });

  it('deve aplicar percentualDesconto corretamente', async () => {
    const dto: CreateFaturaDto = {
      clienteId: '876d96fa-82d2-4e8a-8c37-91ed51bf701d',
      usuarioResponsavelId: 'b47ac10b-58cc-4372-a567-0e02b2c3d481',
      tipo: 'unica' as any,
      descricao: 'Teste Percentual',
      dataVencimento: new Date().toISOString().split('T')[0],
      itens: [
        { descricao: 'Item %', quantidade: 3, valorUnitario: 40, percentualDesconto: 25 }, // subtotal 120 - 30 = 90
      ],
    };

    const fatura = await service.criarFatura(dto, 'empresa-teste');
    const item = fatura.itens[0];
    expect(Number(item.valorTotal)).toBe(90);
  });

  it('deve combinar desconto valor e percentual corretamente (aplica ambos)', async () => {
    const dto: CreateFaturaDto = {
      clienteId: '2772593a-1e64-494b-a39a-825ee1245425',
      usuarioResponsavelId: 'c47ac10b-58cc-4372-a567-0e02b2c3d482',
      tipo: 'unica' as any,
      descricao: 'Teste Combinação',
      dataVencimento: new Date().toISOString().split('T')[0],
      itens: [
        {
          descricao: 'Item Combo',
          quantidade: 5,
          valorUnitario: 20,
          valorDesconto: 15,
          percentualDesconto: 10,
        }, // subtotal 100 - perc 10 (=10) - 15 = 75
      ],
    };

    const fatura = await service.criarFatura(dto, 'empresa-teste');
    const item = fatura.itens[0];
    expect(Number(item.valorTotal)).toBe(75);
  });

  it('deve somar corretamente vários itens com descontos mistos', async () => {
    const dto: CreateFaturaDto = {
      clienteId: '11870d4f-0059-4466-a546-1c878d1330a2',
      usuarioResponsavelId: 'd47ac10b-58cc-4372-a567-0e02b2c3d483',
      tipo: 'unica' as any,
      descricao: 'Teste Multi Itens',
      dataVencimento: new Date().toISOString().split('T')[0],
      itens: [
        { descricao: 'Item A', quantidade: 2, valorUnitario: 50 }, // 100
        { descricao: 'Item B', quantidade: 1, valorUnitario: 80, valorDesconto: 20 }, // 60
        { descricao: 'Item C', quantidade: 3, valorUnitario: 40, percentualDesconto: 25 }, // 120 - 30 = 90
        {
          descricao: 'Item D',
          quantidade: 4,
          valorUnitario: 25,
          valorDesconto: 10,
          percentualDesconto: 10,
        }, // subtotal 100 -10% (=10) -10 = 80
      ], // Total esperado = 100 + 60 + 90 + 80 = 330
    };

    const fatura = await service.criarFatura(dto, 'empresa-teste');
    const totalItens = fatura.itens.reduce((acc, i) => acc + Number(i.valorTotal), 0);
    expect(Number(totalItens.toFixed(2))).toBe(330);
  });
  it('deve gerar cobrança em lote apenas para faturas elegíveis', async () => {
    const empresaId = 'empresa-teste';
    const clienteElegivelId = '0f8fad5b-d9cb-469f-a165-70867728950e';
    const clienteIgnoradoId = '7d444840-9dc0-11d1-b245-5ffdce74fad2';

    await (clienteRepo as any).save([
      { id: clienteElegivelId, empresaId, email: 'cliente.elegivel@teste.com' },
      { id: clienteIgnoradoId, empresaId, email: 'cliente.ignorado@teste.com' },
    ]);

    const faturaElegivel = await service.criarFatura(
      {
        clienteId: clienteElegivelId,
        usuarioResponsavelId: 'e47ac10b-58cc-4372-a567-0e02b2c3d484',
        tipo: 'unica' as any,
        descricao: 'Fatura elegivel para cobranca',
        dataVencimento: new Date().toISOString().split('T')[0],
        itens: [{ descricao: 'Item elegivel', quantidade: 1, valorUnitario: 100 }],
      },
      empresaId,
    );

    const faturaIgnorada = await service.criarFatura(
      {
        clienteId: clienteIgnoradoId,
        usuarioResponsavelId: 'f47ac10b-58cc-4372-a567-0e02b2c3d485',
        tipo: 'unica' as any,
        descricao: 'Fatura que sera ignorada',
        dataVencimento: new Date().toISOString().split('T')[0],
        itens: [{ descricao: 'Item ignorado', quantidade: 1, valorUnitario: 80 }],
      },
      empresaId,
    );

    const armazenadas = (faturaRepo as any)._all();
    const registroIgnorado = armazenadas.find((item: any) => item.id === faturaIgnorada.id);
    registroIgnorado.status = 'cancelada';

    const resultado = await service.gerarCobrancaEmLote(
      [faturaElegivel.id, faturaIgnorada.id],
      empresaId,
    );

    expect(resultado.processadas).toBe(2);
    expect(resultado.sucesso).toBe(1);
    expect(resultado.ignoradas).toBe(1);
    expect(resultado.falhas).toBe(0);

    const itemIgnorado = resultado.resultados.find((item) => item.faturaId === faturaIgnorada.id);
    expect(itemIgnorado?.motivo).toBe('status_nao_elegivel');
  });
});
