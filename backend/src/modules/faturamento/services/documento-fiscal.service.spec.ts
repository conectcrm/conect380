import { BadRequestException } from '@nestjs/common';
import { DocumentoFiscalService } from './documento-fiscal.service';
import { Fatura, StatusFatura, TipoFatura } from '../entities/fatura.entity';

function createInMemoryRepositories() {
  const faturas: any[] = [];
  const itens: any[] = [];

  const faturaRepository = {
    findOne: jest.fn(async ({ where }: any) => {
      return (
        faturas.find(
          (fatura) =>
            fatura.id === where?.id &&
            fatura.empresaId === where?.empresaId &&
            fatura.ativo === where?.ativo,
        ) || null
      );
    }),
    save: jest.fn(async (entity: any) => {
      const idx = faturas.findIndex((item) => item.id === entity.id);
      if (idx >= 0) {
        faturas[idx] = entity;
      } else {
        faturas.push(entity);
      }
      return entity;
    }),
  };

  const itemRepository = {
    find: jest.fn(async ({ where }: any) =>
      itens.filter((item) => item.faturaId === where?.faturaId),
    ),
  };

  return {
    faturas,
    itens,
    faturaRepository,
    itemRepository,
  };
}

function criarFaturaBase(): Fatura {
  return {
    id: 101,
    numero: 'FT2026000101',
    empresaId: 'empresa-teste',
    contratoId: 50,
    clienteId: '2fd6c389-1cc7-4760-8f74-8f6908eb6f1e',
    usuarioResponsavelId: 'ea0a1e8a-1816-45aa-9ca6-30f9426de89a',
    tipo: TipoFatura.UNICA,
    status: StatusFatura.PENDENTE,
    descricao: 'Fatura para teste fiscal',
    valorTotal: 1120,
    valorPago: 0,
    valorDesconto: 0,
    valorImpostos: 120,
    percentualImpostos: 12,
    diasCarenciaJuros: 0,
    percentualJuros: 0,
    percentualMulta: 0,
    valorJuros: 0,
    valorMulta: 0,
    dataEmissao: new Date('2026-03-20T00:00:00Z'),
    dataVencimento: new Date('2026-04-20T00:00:00Z'),
    dataPagamento: null as any,
    observacoes: null as any,
    linkPagamento: null as any,
    qrCodePix: null as any,
    codigoBoleto: null as any,
    metadados: null as any,
    detalhesTributarios: null,
    itens: [],
    pagamentos: [],
    ativo: true,
    createdAt: new Date('2026-03-20T00:00:00Z'),
    updatedAt: new Date('2026-03-20T00:00:00Z'),
    empresa: null as any,
    contrato: null as any,
    cliente: null as any,
    usuarioResponsavel: null as any,
    formaPagamentoPreferida: null as any,
    isPaga: () => false,
    isVencida: () => false,
    getValorRestante: () => 0,
    getValorComJurosMulta: () => 0,
    getDiasAtraso: () => 0,
    getPercentualPago: () => 0,
  } as Fatura;
}

describe('DocumentoFiscalService', () => {
  it('deve criar rascunho fiscal padrao para NFSe', async () => {
    const { faturas, itens, faturaRepository, itemRepository } = createInMemoryRepositories();
    const service = new DocumentoFiscalService(faturaRepository as any, itemRepository as any);

    const fatura = criarFaturaBase();
    faturas.push(fatura);
    itens.push({
      id: 1,
      faturaId: fatura.id,
      descricao: 'Servico de implementacao',
      quantidade: 1,
      valorUnitario: 1000,
      valorTotal: 1000,
      unidade: 'un',
      codigoProduto: 'SV-001',
      percentualDesconto: 0,
      valorDesconto: 0,
      fatura: null as any,
      calcularValorTotal: () => 1000,
      calcularValorDesconto: () => 0,
    });

    const status = await service.criarRascunho(
      fatura.id,
      fatura.empresaId,
      { observacoes: 'Preparar para emissao' },
      'usuario-1',
    );

    expect(status.status).toBe('rascunho');
    expect(status.tipo).toBe('nfse');
    expect(status.ambiente).toBe('homologacao');
    expect(status.ultimaMensagem).toBe('Preparar para emissao');
    expect(status.historico.length).toBe(1);
  });

  it('deve emitir documento fiscal e preencher numero/chave/protocolo', async () => {
    const { faturas, itens, faturaRepository, itemRepository } = createInMemoryRepositories();
    const service = new DocumentoFiscalService(faturaRepository as any, itemRepository as any);

    const fatura = criarFaturaBase();
    fatura.detalhesTributarios = {
      documento: {
        tipo: 'nfe',
      },
      fiscal: {
        status: 'rascunho',
      },
    };
    faturas.push(fatura);
    itens.push({
      id: 1,
      faturaId: fatura.id,
      descricao: 'Produto',
      quantidade: 2,
      valorUnitario: 500,
      valorTotal: 1000,
      unidade: 'un',
      codigoProduto: 'PRD-001',
      percentualDesconto: 0,
      valorDesconto: 0,
      fatura: null as any,
      calcularValorTotal: () => 1000,
      calcularValorDesconto: () => 0,
    });

    const status = await service.emitir(
      fatura.id,
      fatura.empresaId,
      { ambiente: 'homologacao' },
      'usuario-2',
    );

    expect(status.status).toBe('emitida');
    expect(status.tipo).toBe('nfe');
    expect(status.numeroDocumento).toContain('NFE-');
    expect((status.chaveAcesso || '').length).toBeGreaterThanOrEqual(44);
    expect((status.protocolo || '').startsWith('PRT-')).toBe(true);
  });

  it('deve bloquear emissao quando a fatura estiver cancelada', async () => {
    const { faturas, faturaRepository, itemRepository } = createInMemoryRepositories();
    const service = new DocumentoFiscalService(faturaRepository as any, itemRepository as any);

    const fatura = criarFaturaBase();
    fatura.status = StatusFatura.CANCELADA;
    faturas.push(fatura);

    await expect(service.emitir(fatura.id, fatura.empresaId, {}, 'usuario-3')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('deve cancelar documento fiscal emitido com motivo', async () => {
    const { faturas, itens, faturaRepository, itemRepository } = createInMemoryRepositories();
    const service = new DocumentoFiscalService(faturaRepository as any, itemRepository as any);

    const fatura = criarFaturaBase();
    fatura.detalhesTributarios = {
      documento: {
        tipo: 'nfse',
        numero: 'NFSE-2026-000101',
        serie: 'A1',
        chaveAcesso: '12345678901234567890123456789012345678901234',
      },
      fiscal: {
        tipo: 'nfse',
        status: 'emitida',
        protocolo: 'PRT-1',
        historico: [],
      },
    };
    faturas.push(fatura);
    itens.push({
      id: 1,
      faturaId: fatura.id,
      descricao: 'Servico',
      quantidade: 1,
      valorUnitario: 1000,
      valorTotal: 1000,
      unidade: 'un',
      codigoProduto: 'SV-100',
      percentualDesconto: 0,
      valorDesconto: 0,
      fatura: null as any,
      calcularValorTotal: () => 1000,
      calcularValorDesconto: () => 0,
    });

    const status = await service.cancelarOuInutilizar(
      fatura.id,
      fatura.empresaId,
      { tipoOperacao: 'cancelar', motivo: 'Solicitacao de cancelamento pelo financeiro.' },
      'usuario-4',
    );

    expect(status.status).toBe('cancelada');
    expect(status.numeroDocumento).toBe('NFSE-2026-000101');
    expect(status.historico[status.historico.length - 1]?.acao).toBe('documento_cancelado');
  });

  it('deve bloquear inutilizacao quando documento ja foi emitido', async () => {
    const { faturas, faturaRepository, itemRepository } = createInMemoryRepositories();
    const service = new DocumentoFiscalService(faturaRepository as any, itemRepository as any);

    const fatura = criarFaturaBase();
    fatura.detalhesTributarios = {
      documento: {
        tipo: 'nfe',
      },
      fiscal: {
        status: 'emitida',
      },
    };
    faturas.push(fatura);

    await expect(
      service.cancelarOuInutilizar(
        fatura.id,
        fatura.empresaId,
        {
          tipoOperacao: 'inutilizar',
          motivo: 'Tentativa de inutilizar numero ja emitido.',
        },
        'usuario-5',
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
