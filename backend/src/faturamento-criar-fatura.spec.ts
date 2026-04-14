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

class MercadoPagoMock {
  public lastPayload: any = null;

  async createPreference(payload?: any) {
    this.lastPayload = payload || null;
    return {
      id: 'pref_teste_123',
      init_point: 'https://pagamento.exemplo.com/checkout/pref_teste_123',
      sandbox_init_point: 'https://sandbox.pagamento.exemplo.com/checkout/pref_teste_123',
    };
  }

  reset() {
    this.lastPayload = null;
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
const pagamentoRepo = createInMemoryRepository<any>();
const contratoRepo = createInMemoryRepository<Contrato>();
const clienteRepo = createInMemoryRepository<any>();
const propostasServiceMock = {};
const mercadoPagoMock = new MercadoPagoMock();

describe('FaturamentoService - criar fatura (unitário sem TypeORM)', () => {
  let service: FaturamentoService;

  beforeAll(() => {
    service = new FaturamentoService(
      faturaRepo as any,
      itemRepo as any,
      pagamentoRepo as any,
      contratoRepo as any,
      clienteRepo as any,
      propostasServiceMock as any,
      new EmailMock() as any,
      mercadoPagoMock as any,
    );
  });

  beforeEach(() => {
    mercadoPagoMock.reset();
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

  it('deve bloquear tipo adicional sem contrato no contexto de faturamento', async () => {
    const dto: CreateFaturaDto = {
      clienteId: 'f6d5f870-0709-4af2-bdf1-92cbf1909683',
      usuarioResponsavelId: '7c640d96-4bdc-47b0-a7a3-53d0e8f261f3',
      tipo: 'adicional' as any,
      descricao: 'Lancamento adicional sem contrato',
      dataVencimento: new Date().toISOString().split('T')[0],
      itens: [{ descricao: 'Item adicional', quantidade: 1, valorUnitario: 100 }],
    };

    await expect(service.criarFatura(dto, 'empresa-teste')).rejects.toThrow(
      'Erro ao criar fatura',
    );
  });

  it('deve permitir tipo adicional sem contrato quando origem operacional for avulso', async () => {
    const dto: CreateFaturaDto = {
      clienteId: '465640a2-6ee6-4125-8600-b4f08a53bc11',
      usuarioResponsavelId: 'de27f466-8203-4ce9-a558-531f8765d4b0',
      tipo: 'adicional' as any,
      descricao: 'Lancamento avulso operacional',
      dataVencimento: new Date().toISOString().split('T')[0],
      itens: [{ descricao: 'Item avulso', quantidade: 1, valorUnitario: 140 }],
    };

    const fatura = await service.criarFatura(
      dto,
      'empresa-teste',
      undefined,
      { origemOperacional: 'avulso' },
    );

    expect(fatura.id).toBeDefined();
    expect(String(fatura.tipo)).toBe('adicional');
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

  it('deve bloquear criacao de fatura quando o tipo de documento for folha_pagamento', async () => {
    const dto: CreateFaturaDto = {
      clienteId: '2b8f8fef-0d31-41c4-8fbe-b54d8b8797f3',
      usuarioResponsavelId: 'd4e71032-464f-45a5-a970-2f7dc2ecac0f',
      tipo: 'unica' as any,
      descricao: 'Fatura com tipo de documento bloqueado',
      dataVencimento: new Date().toISOString().split('T')[0],
      itens: [{ descricao: 'Item bloqueio', quantidade: 1, valorUnitario: 100 }],
      detalhesTributarios: {
        documento: {
          tipo: 'folha_pagamento',
          numero: 'FPG-2026-000001',
        },
      },
    };

    await expect(service.criarFatura(dto, 'empresa-teste')).rejects.toThrow(
      'Erro ao criar fatura',
    );
  });

  it('deve bloquear geracao de numero para folha_pagamento', async () => {
    await expect(
      service.gerarNumeroDocumentoFinanceiro(
        'empresa-teste',
        'folha_pagamento' as any,
      ),
    ).rejects.toThrow('Tipo de documento "folha_pagamento" nao e permitido no faturamento de clientes.');
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

  it('deve gerar link de pagamento e registrar pagamento pendente para conciliacao automatica', async () => {
    const empresaId = 'empresa-teste';
    const clienteId = '8a4706bb-2fbf-4ac8-8e2f-c947f591adcb';

    await (clienteRepo as any).save([
      {
        id: clienteId,
        empresaId,
        nome: 'Cliente Link',
        email: 'cliente.link@teste.com',
      },
    ]);

    const fatura = await service.criarFatura(
      {
        clienteId,
        usuarioResponsavelId: '1a9f9224-b38f-4a28-a7f8-53d1886bc26f',
        tipo: 'unica' as any,
        descricao: 'Fatura para link',
        dataVencimento: new Date().toISOString().split('T')[0],
        itens: [{ descricao: 'Item link', quantidade: 1, valorUnitario: 250 }],
      },
      empresaId,
    );

    const resultado = await service.gerarLinkPagamentoFatura(fatura.id, empresaId, {
      frontendBaseUrl: 'https://conect360.com',
      backendBaseUrl: 'https://api.conect360.com',
    });

    expect(resultado.link).toContain('pagamento.exemplo.com/checkout');
    expect(resultado.referenciaGateway).toBe(`fatura:${empresaId}:${fatura.id}`);

    const pagamentos = (pagamentoRepo as any)._all();
    expect(pagamentos.length).toBeGreaterThan(0);
    const pagamento = pagamentos.find(
      (item: any) =>
        item.faturaId === fatura.id && item.gatewayTransacaoId === resultado.referenciaGateway,
    );
    expect(pagamento).toBeDefined();
    expect(String(pagamento.status)).toBe('pendente');
    expect(Number(pagamento.valor)).toBe(250);

    const faturas = (faturaRepo as any)._all();
    const faturaAtualizada = faturas.find((item: any) => item.id === fatura.id);
    expect(String(faturaAtualizada.linkPagamento || '')).toContain(
      'pagamento.exemplo.com/checkout',
    );
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

  it('deve aplicar whitelist de ordenacao ao buscar faturas paginadas', async () => {
    const originalCreateQueryBuilder = (faturaRepo as any).createQueryBuilder;
    const queryOrderBy = jest.fn().mockReturnThis();
    const queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: queryOrderBy,
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    const resumoBuilder = {
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({
        valorTotal: 0,
        valorRecebido: 0,
        valorEmAberto: 0,
      }),
    };
    let chamada = 0;

    (faturaRepo as any).createQueryBuilder = jest.fn().mockImplementation(() => {
      chamada += 1;
      return chamada === 1 ? queryBuilder : resumoBuilder;
    });

    try {
      await service.buscarFaturasPaginadas(
        'empresa-teste',
        1,
        10,
        'createdAt;DROP TABLE faturas;--',
        'DESC;--' as any,
      );
      expect(queryOrderBy).toHaveBeenCalledWith('fatura.createdAt', 'DESC');
    } finally {
      (faturaRepo as any).createQueryBuilder = originalCreateQueryBuilder;
    }
  });

  it('deve restringir verificacao de vencidas ao empresaId informado', async () => {
    const originalCreateQueryBuilder = (faturaRepo as any).createQueryBuilder;
    const where = jest.fn().mockReturnThis();
    const andWhere = jest.fn().mockReturnThis();
    const getMany = jest.fn().mockResolvedValue([]);

    (faturaRepo as any).createQueryBuilder = jest.fn().mockReturnValue({
      where,
      andWhere,
      getMany,
    });

    try {
      await service.verificarFaturasVencidas('empresa-segura');
      expect(andWhere).toHaveBeenCalledWith('fatura.empresa_id = :empresaId', {
        empresaId: 'empresa-segura',
      });
    } finally {
      (faturaRepo as any).createQueryBuilder = originalCreateQueryBuilder;
    }
  });

  it('deve priorizar URLs configuradas e ignorar contexto local/privado ao gerar link', async () => {
    const originalEnv = {
      FRONTEND_URL: process.env.FRONTEND_URL,
      APP_FRONTEND_URL: process.env.APP_FRONTEND_URL,
      WEBHOOK_BASE_URL: process.env.WEBHOOK_BASE_URL,
      BACKEND_URL: process.env.BACKEND_URL,
      API_URL: process.env.API_URL,
      MERCADO_PAGO_MOCK: process.env.MERCADO_PAGO_MOCK,
    };

    process.env.FRONTEND_URL = 'https://app.conectcrm.com/';
    process.env.WEBHOOK_BASE_URL = 'https://api.conectcrm.com/';
    process.env.BACKEND_URL = '';
    process.env.API_URL = '';
    process.env.MERCADO_PAGO_MOCK = 'false';

    const empresaId = 'empresa-safe';
    const clienteId = 'cliente-safe';

    await (clienteRepo as any).save([
      {
        id: clienteId,
        empresaId,
        nome: 'Cliente Seguro',
        email: 'cliente.seguro@teste.com',
      },
    ]);

    const fatura = await service.criarFatura(
      {
        clienteId,
        usuarioResponsavelId: 'safe-user',
        tipo: 'unica' as any,
        descricao: 'Fatura segura',
        dataVencimento: new Date().toISOString().split('T')[0],
        itens: [{ descricao: 'Item seguro', quantidade: 1, valorUnitario: 320 }],
      },
      empresaId,
    );

    try {
      await service.gerarLinkPagamentoFatura(fatura.id, empresaId, {
        frontendBaseUrl: 'http://127.0.0.1:3000',
        backendBaseUrl: 'http://localhost:3001',
      });

      expect(mercadoPagoMock.lastPayload?.back_urls?.success).toContain(
        'https://app.conectcrm.com/faturamento?status=success',
      );
      expect(mercadoPagoMock.lastPayload?.notification_url).toBe(
        'https://api.conectcrm.com/mercadopago/webhooks',
      );
    } finally {
      process.env.FRONTEND_URL = originalEnv.FRONTEND_URL;
      process.env.APP_FRONTEND_URL = originalEnv.APP_FRONTEND_URL;
      process.env.WEBHOOK_BASE_URL = originalEnv.WEBHOOK_BASE_URL;
      process.env.BACKEND_URL = originalEnv.BACKEND_URL;
      process.env.API_URL = originalEnv.API_URL;
      process.env.MERCADO_PAGO_MOCK = originalEnv.MERCADO_PAGO_MOCK;
    }
  });

  it('deve bloquear FRONTEND_URL local quando mock do gateway estiver desabilitado', async () => {
    const originalEnv = {
      FRONTEND_URL: process.env.FRONTEND_URL,
      APP_FRONTEND_URL: process.env.APP_FRONTEND_URL,
      WEBHOOK_BASE_URL: process.env.WEBHOOK_BASE_URL,
      BACKEND_URL: process.env.BACKEND_URL,
      API_URL: process.env.API_URL,
      MERCADO_PAGO_MOCK: process.env.MERCADO_PAGO_MOCK,
    };

    process.env.FRONTEND_URL = 'http://localhost:3000';
    process.env.WEBHOOK_BASE_URL = 'https://api.conectcrm.com';
    process.env.BACKEND_URL = '';
    process.env.API_URL = '';
    process.env.MERCADO_PAGO_MOCK = 'false';

    const empresaId = 'empresa-local-bloqueada';
    const clienteId = 'cliente-local-bloqueado';
    await (clienteRepo as any).save([
      {
        id: clienteId,
        empresaId,
        nome: 'Cliente Local',
        email: 'cliente.local@teste.com',
      },
    ]);

    const fatura = await service.criarFatura(
      {
        clienteId,
        usuarioResponsavelId: 'user-local',
        tipo: 'unica' as any,
        descricao: 'Fatura bloqueio URL local',
        dataVencimento: new Date().toISOString().split('T')[0],
        itens: [{ descricao: 'Item local', quantidade: 1, valorUnitario: 99 }],
      },
      empresaId,
    );

    try {
      await expect(
        service.gerarLinkPagamentoFatura(fatura.id, empresaId, {
          frontendBaseUrl: 'https://origem-ignorada.exemplo',
          backendBaseUrl: 'https://api-ignorada.exemplo',
        }),
      ).rejects.toThrow('Link de pagamento exige URL publica no retorno');
    } finally {
      process.env.FRONTEND_URL = originalEnv.FRONTEND_URL;
      process.env.APP_FRONTEND_URL = originalEnv.APP_FRONTEND_URL;
      process.env.WEBHOOK_BASE_URL = originalEnv.WEBHOOK_BASE_URL;
      process.env.BACKEND_URL = originalEnv.BACKEND_URL;
      process.env.API_URL = originalEnv.API_URL;
      process.env.MERCADO_PAGO_MOCK = originalEnv.MERCADO_PAGO_MOCK;
    }
  });
});
