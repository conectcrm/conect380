type MvpScopeModule = typeof import('../mvpScope');

const runWithMvpMode = (value: string | undefined, callback: (module: MvpScopeModule) => void): void => {
  const previous = process.env.REACT_APP_MVP_MODE;

  if (value === undefined) {
    delete process.env.REACT_APP_MVP_MODE;
  } else {
    process.env.REACT_APP_MVP_MODE = value;
  }

  jest.resetModules();

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const module = require('../mvpScope') as MvpScopeModule;
    callback(module);
  } finally {
    if (previous === undefined) {
      delete process.env.REACT_APP_MVP_MODE;
    } else {
      process.env.REACT_APP_MVP_MODE = previous;
    }
    jest.resetModules();
  }
};

describe('mvpScope', () => {
  it('keeps compras/fechamento routes available in MVP mode', () => {
    runWithMvpMode('true', ({ getMvpBlockedRouteInfo }) => {
      expect(getMvpBlockedRouteInfo('/compras/cotacoes')).toBeNull();
      expect(getMvpBlockedRouteInfo('/compras/aprovacoes')).toBeNull();
      expect(getMvpBlockedRouteInfo('/financeiro/cotacoes')).toBeNull();
      expect(getMvpBlockedRouteInfo('/financeiro/compras/aprovacoes')).toBeNull();
      expect(getMvpBlockedRouteInfo('/contratos/123')).toBeNull();
    });
  });

  it('keeps financeiro operacional routes available in MVP mode', () => {
    runWithMvpMode('true', ({ getMvpBlockedRouteInfo }) => {
      expect(getMvpBlockedRouteInfo('/financeiro/contas-pagar')).toBeNull();
      expect(getMvpBlockedRouteInfo('/financeiro/contas-receber')).toBeNull();
      expect(getMvpBlockedRouteInfo('/financeiro/fluxo-caixa')).toBeNull();
      expect(getMvpBlockedRouteInfo('/financeiro/tesouraria')).toBeNull();

      const blockedBilling = getMvpBlockedRouteInfo('/billing/faturas');
      expect(blockedBilling).not.toBeNull();
      expect(blockedBilling?.moduleName).toBe('Billing e Fiscal');

      const blockedFiscal = getMvpBlockedRouteInfo('/financeiro/notas-fiscais');
      expect(blockedFiscal).not.toBeNull();
      expect(blockedFiscal?.moduleName).toBe('Billing e Fiscal');
    });
  });

  it('allows financial menu entries required by compras flow in MVP mode', () => {
    runWithMvpMode('true', ({ isMenuItemAllowedInMvp }) => {
      expect(isMenuItemAllowedInMvp('financeiro', 0)).toBe(true);
      expect(isMenuItemAllowedInMvp('comercial-cotacoes', 1)).toBe(true);
      expect(isMenuItemAllowedInMvp('comercial-aprovacoes', 1)).toBe(true);
      expect(isMenuItemAllowedInMvp('comercial-contratos', 1)).toBe(true);
      expect(isMenuItemAllowedInMvp('billing', 0)).toBe(false);
    });
  });

  it('does not block routes when MVP mode is disabled', () => {
    runWithMvpMode('false', ({ getMvpBlockedRouteInfo, isMenuItemAllowedInMvp }) => {
      expect(getMvpBlockedRouteInfo('/financeiro/contas-pagar')).toBeNull();
      expect(isMenuItemAllowedInMvp('billing', 0)).toBe(true);
    });
  });
});
