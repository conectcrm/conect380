type GatewayUiConfig = {
  enabledProviders: string[];
  hasEnabledProviders: boolean;
  allowUnimplemented: boolean;
  mvpMode: boolean;
  onlineGatewayUiEnabled: boolean;
  paymentLinkEnabled: boolean;
  motivoBloqueio: string;
};

const parseCsv = (value?: string): string[] =>
  (value || '')
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);

export const getPagamentosGatewayUiConfig = (): GatewayUiConfig => {
  const enabledProviders = parseCsv(process.env.REACT_APP_PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS);
  const allowUnimplemented = process.env.REACT_APP_PAGAMENTOS_GATEWAY_ALLOW_UNIMPLEMENTED === 'true';
  const mvpMode = process.env.REACT_APP_MVP_MODE === 'true';

  if (mvpMode) {
    return {
      enabledProviders,
      hasEnabledProviders: enabledProviders.length > 0,
      allowUnimplemented,
      mvpMode,
      onlineGatewayUiEnabled: false,
      paymentLinkEnabled: false,
      motivoBloqueio: 'Recursos de gateway estao fora do escopo do MVP desta release.',
    };
  }

  if (allowUnimplemented) {
    return {
      enabledProviders,
      hasEnabledProviders: enabledProviders.length > 0,
      allowUnimplemented,
      mvpMode,
      onlineGatewayUiEnabled: true,
      paymentLinkEnabled: true,
      motivoBloqueio: '',
    };
  }

  if (enabledProviders.length > 0) {
    return {
      enabledProviders,
      hasEnabledProviders: true,
      allowUnimplemented,
      mvpMode,
      onlineGatewayUiEnabled: true,
      paymentLinkEnabled: true,
      motivoBloqueio: '',
    };
  }

  return {
    enabledProviders,
    hasEnabledProviders: false,
    allowUnimplemented,
    mvpMode,
    onlineGatewayUiEnabled: false,
    paymentLinkEnabled: false,
    motivoBloqueio:
      'Nenhum gateway de pagamento foi habilitado neste ambiente. Configure REACT_APP_PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS para GO Full.',
  };
};
