import { DashboardService } from './dashboard.service';
import { UserRole } from '../users/user.entity';

describe('DashboardService (metas)', () => {
  const propostaRepository = {
    createQueryBuilder: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
  };
  const userRepository = {
    find: jest.fn(),
  };
  const clienteRepository = {
    count: jest.fn(),
  };
  const sessaoTriagemRepository = {
    createQueryBuilder: jest.fn(),
  };
  const metasService = {
    getMetaValorParaRange: jest.fn(),
  };
  const eventosService = {
    getEventStatsByPeriod: jest.fn(),
  };

  let service: DashboardService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DashboardService(
      propostaRepository as any,
      userRepository as any,
      clienteRepository as any,
      sessaoTriagemRepository as any,
      metasService as any,
      eventosService as any,
    );

    eventosService.getEventStatsByPeriod.mockResolvedValue({
      totalEventos: 0,
      eventosConcluidos: 0,
      proximosEventos: 0,
      eventosHoje: 0,
      estatisticasPorTipo: {
        reuniao: 0,
        ligacao: 0,
        apresentacao: 0,
        visita: 0,
        'follow-up': 0,
        outro: 0,
      },
      produtividade: 0,
    });
  });

  it('nao aplica fallback fixo em getKPIs quando nao existe meta cadastrada', async () => {
    metasService.getMetaValorParaRange.mockResolvedValue(0);

    jest.spyOn(service as any, 'calculateFaturamento').mockResolvedValue(0);
    jest.spyOn(service as any, 'calculateTicketMedio').mockResolvedValue(0);
    jest.spyOn(service as any, 'calculateVendasFechadas').mockResolvedValue(0);
    jest.spyOn(service as any, 'calculateEmNegociacao').mockResolvedValue({
      valor: 0,
      quantidade: 0,
      propostas: [],
    });
    jest.spyOn(service as any, 'calculateNovosClientes').mockResolvedValue(0);
    jest.spyOn(service as any, 'calculateLeadsQualificados').mockResolvedValue(0);
    jest.spyOn(service as any, 'calculatePropostasEnviadas').mockResolvedValue(0);
    jest.spyOn(service as any, 'calculateCicloMedio').mockResolvedValue(0);
    jest.spyOn(service as any, 'calculateTempoEtapa').mockResolvedValue(0);
    jest.spyOn(service as any, 'calculateFollowUpsPendentes').mockResolvedValue(0);
    jest.spyOn(service as any, 'calculateTaxaSucesso').mockResolvedValue(0);
    jest.spyOn(service as any, 'calculateSatisfacaoCliente').mockResolvedValue({
      valor: null,
      amostra: 0,
      fonte: 'indisponivel',
    });
    jest.spyOn(service as any, 'calculateMetasAtividade').mockResolvedValue({
      callsDiarias: 0,
      reunioesSemana: 0,
      followupsDiarios: 0,
      amostraEventos: 0,
      fonte: 'indisponivel',
      periodoBase: {
        inicio: '2026-01-01',
        fim: '2026-01-31',
      },
    });

    const result = await service.getKPIs('mensal', 'vend-1', undefined, 'emp-1');

    expect(result.faturamentoTotal.meta).toBe(0);
  });

  it('nao aplica meta fixa no ranking quando vendedor nao possui meta', async () => {
    userRepository.find.mockResolvedValue([
      {
        id: 'vend-1',
        nome: 'Vendedor 1',
        role: UserRole.VENDEDOR,
        ativo: true,
      },
    ]);
    metasService.getMetaValorParaRange.mockResolvedValue(0);
    jest.spyOn(service as any, 'calculateFaturamento').mockResolvedValue(0);

    const ranking = await service.getVendedoresRanking('mensal', 'emp-1');

    expect(ranking).toHaveLength(1);
    expect(ranking[0].meta).toBe(0);
  });

  it('nao gera alerta de meta superada quando meta do periodo eh zero', async () => {
    propostaRepository.find.mockResolvedValue([]);

    const alertas = await service.getAlertasInteligentes(
      'mensal',
      'emp-1',
      {
        ranking: [],
        kpis: {
          faturamentoTotal: { valor: 1000, meta: 0, variacao: 0, periodo: 'vs mes anterior' },
          ticketMedio: { valor: 0, variacao: 0, periodo: 'vs mes anterior' },
          vendasFechadas: { quantidade: 0, variacao: 0, periodo: 'vs mes anterior' },
          emNegociacao: { valor: 0, quantidade: 0, propostas: [] },
          novosClientesMes: { quantidade: 0, variacao: 0 },
          leadsQualificados: { quantidade: 0, variacao: 0 },
          propostasEnviadas: { valor: 0, variacao: 0 },
          cicloMedio: { dias: 0, variacao: 0 },
          tempoEtapa: { dias: 0, variacao: 0 },
          followUpsPendentes: { quantidade: 0, variacao: 0 },
          taxaSucessoGeral: { percentual: 0, variacao: 0 },
          agenda: {
            totalEventos: 0,
            eventosConcluidos: 0,
            proximosEventos: 0,
            eventosHoje: 0,
            estatisticasPorTipo: {
              reuniao: 0,
              ligacao: 0,
              apresentacao: 0,
              visita: 0,
              'follow-up': 0,
              outro: 0,
            },
            produtividade: 0,
          },
        },
      },
      'vend-1',
    );

    expect(alertas.some((alerta) => alerta.id === 'meta-superada')).toBe(false);
  });
});
