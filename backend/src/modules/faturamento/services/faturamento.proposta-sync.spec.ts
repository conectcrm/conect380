import { FaturamentoService } from './faturamento.service';
import { StatusFatura } from '../entities/fatura.entity';

describe('FaturamentoService - sincronizacao de proposta sem contrato', () => {
  const faturaRepository = {
    save: jest.fn(async (value) => value),
  };
  const itemFaturaRepository = {};
  const pagamentoRepository = {};
  const contratoRepository = {
    findOne: jest.fn(),
  };
  const clienteRepository = {};
  const propostasService = {
    atualizarStatus: jest.fn().mockResolvedValue(undefined),
  };
  const emailService = {};

  let service: FaturamentoService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FaturamentoService(
      faturaRepository as any,
      itemFaturaRepository as any,
      pagamentoRepository as any,
      contratoRepository as any,
      clienteRepository as any,
      propostasService as any,
      emailService as any,
      undefined,
      undefined,
    );
  });

  it('sincroniza proposta usando metadados.propostaId quando nao ha contrato vinculado', async () => {
    const propostaId = '39de88b8-a040-4cb8-a8c0-33d385793db4';
    const fatura = {
      id: 9001,
      numero: 'FT2026009001',
      status: StatusFatura.PENDENTE,
      contratoId: null,
      contrato: null,
      metadados: {
        propostaId,
      },
    } as any;

    await (service as any).sincronizarStatusPropostaPelaFatura(
      fatura,
      'empresa-teste',
      'fatura_criada',
      'faturamento-criacao',
    );

    expect(contratoRepository.findOne).not.toHaveBeenCalled();
    expect(propostasService.atualizarStatus).toHaveBeenCalledWith(
      propostaId,
      'fatura_criada',
      'faturamento-criacao',
      expect.stringContaining('FT2026009001'),
      undefined,
      'empresa-teste',
      expect.objectContaining({
        entidade: 'fatura',
        entidadeId: 9001,
      }),
    );
  });

  it('sincroniza proposta usando metadados.comercial.propostaId quando presente', async () => {
    const propostaId = '9f3f660f-d307-4b51-90dc-f99389cb5a4b';
    const fatura = {
      id: 9002,
      numero: 'FT2026009002',
      status: StatusFatura.ENVIADA,
      contratoId: undefined,
      contrato: null,
      metadados: {
        comercial: {
          propostaId,
        },
      },
    } as any;

    await (service as any).sincronizarStatusPropostaPelaFatura(
      fatura,
      'empresa-teste',
      undefined,
      'faturamento',
    );

    expect(propostasService.atualizarStatus).toHaveBeenCalledWith(
      propostaId,
      'aguardando_pagamento',
      'faturamento',
      expect.stringContaining('FT2026009002'),
      undefined,
      'empresa-teste',
      expect.objectContaining({
        entidade: 'fatura',
        entidadeId: 9002,
      }),
    );
  });

  it('nao tenta sincronizar quando a fatura nao possui referencia de proposta', async () => {
    const fatura = {
      id: 9003,
      numero: 'FT2026009003',
      status: StatusFatura.PENDENTE,
      contratoId: null,
      contrato: null,
      metadados: {},
    } as any;

    await (service as any).sincronizarStatusPropostaPelaFatura(
      fatura,
      'empresa-teste',
      'fatura_criada',
      'faturamento-criacao',
    );

    expect(propostasService.atualizarStatus).not.toHaveBeenCalled();
    expect(contratoRepository.findOne).not.toHaveBeenCalled();
  });
});
