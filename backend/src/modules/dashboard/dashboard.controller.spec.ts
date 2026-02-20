import { DashboardController } from './dashboard.controller';
import { UserRole } from '../users/user.entity';

describe('DashboardController', () => {
  const dashboardService = {
    getKPIs: jest.fn(),
    getVendedoresRanking: jest.fn(),
    getChartsData: jest.fn(),
    getAlertasInteligentes: jest.fn(),
    getPeriodosDisponiveis: jest.fn(),
    getRegioesDisponiveis: jest.fn(),
  };

  let controller: DashboardController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new DashboardController(dashboardService as any);
    dashboardService.getPeriodosDisponiveis.mockReturnValue(['mensal']);
    dashboardService.getRegioesDisponiveis.mockReturnValue(['Todas']);
  });

  it('forca escopo do proprio vendedor no endpoint de KPIs', async () => {
    dashboardService.getKPIs.mockResolvedValue({ ok: true });

    const user = { id: 'vend-1', role: UserRole.VENDEDOR } as any;
    await controller.getKPIs(user, 'emp-1', 'mensal', 'vend-outro', 'Sudeste');

    expect(dashboardService.getKPIs).toHaveBeenCalledWith('mensal', 'vend-1', 'Sudeste', 'emp-1');
  });

  it('permite filtro de vendedor solicitado para gerente', async () => {
    dashboardService.getKPIs.mockResolvedValue({ ok: true });

    const user = { id: 'gerente-1', role: 'gerente' } as any;
    await controller.getKPIs(user, 'emp-1', 'mensal', 'vend-2', 'Sul');

    expect(dashboardService.getKPIs).toHaveBeenCalledWith('mensal', 'vend-2', 'Sul', 'emp-1');
  });

  it('aplica menor privilegio para role suporte no endpoint de ranking', async () => {
    dashboardService.getVendedoresRanking.mockResolvedValue([]);

    const user = { id: 'suporte-1', role: 'suporte' } as any;
    await controller.getVendedoresRanking(user, 'emp-1', 'mensal');

    expect(dashboardService.getVendedoresRanking).toHaveBeenCalledWith(
      'mensal',
      'emp-1',
      'suporte-1',
    );
  });

  it('propaga escopo forcado no resumo para role suporte', async () => {
    const kpisMock = { faturamentoTotal: { valor: 0, meta: 0 } };
    const rankingMock = [{ id: 'suporte-1', nome: 'Suporte 1' }];
    const chartsMock = {
      vendasMensais: [],
      propostasPorStatus: [],
      atividadesTimeline: [],
      funilVendas: [],
    };
    const alertasMock: any[] = [];

    dashboardService.getKPIs.mockResolvedValue(kpisMock);
    dashboardService.getVendedoresRanking.mockResolvedValue(rankingMock);
    dashboardService.getChartsData.mockResolvedValue(chartsMock);
    dashboardService.getAlertasInteligentes.mockResolvedValue(alertasMock);

    const user = { id: 'suporte-1', role: 'suporte' } as any;
    const result = await controller.getResumoCompleto(user, 'emp-1', 'mensal', 'vend-outro', 'Norte');

    expect(dashboardService.getKPIs).toHaveBeenCalledWith('mensal', 'suporte-1', 'Norte', 'emp-1');
    expect(dashboardService.getVendedoresRanking).toHaveBeenCalledWith('mensal', 'emp-1', 'suporte-1');
    expect(dashboardService.getChartsData).toHaveBeenCalledWith('mensal', 'suporte-1', 'Norte', 'emp-1');
    expect(dashboardService.getAlertasInteligentes).toHaveBeenCalledWith(
      'mensal',
      'emp-1',
      expect.objectContaining({
        ranking: rankingMock,
        kpis: kpisMock,
      }),
      'suporte-1',
    );
    expect(result?.metadata?.vendedorId).toBe('suporte-1');
  });

  it('nao aplica escopo de vendedor para admin no endpoint de alertas', async () => {
    dashboardService.getAlertasInteligentes.mockResolvedValue([]);

    const user = { id: 'admin-1', role: UserRole.ADMIN } as any;
    await controller.getAlertasInteligentes(user, 'emp-1');

    expect(dashboardService.getAlertasInteligentes).toHaveBeenCalledWith(
      'mensal',
      'emp-1',
      undefined,
      undefined,
    );
  });
});
