jest.mock('../api', () => ({
  __esModule: true,
  API_BASE_URL: 'http://localhost:3001',
  default: {},
}));

import { portalClienteService } from '../portalClienteService';

describe('portalClienteService.atualizarStatus', () => {
  const token = 'token-sync-123';

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('deve atualizar status apenas via endpoint do portal (sem sync duplicado no CRM)', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    (global as any).fetch = fetchMock;

    jest.spyOn(portalClienteService as any, 'obterIP').mockResolvedValue('127.0.0.1');
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');

    await portalClienteService.atualizarStatus(token, 'aprovada', 'Motivo de ajuste');

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(`/api/portal/proposta/${token}/status`);
    expect(options.method).toBe('PUT');
    expect(String(url)).not.toContain(`/propostas/${token}/status`);

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
  });

  it('deve acionar fallback local quando o endpoint do portal falhar', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: false });
    (global as any).fetch = fetchMock;

    jest.spyOn(portalClienteService as any, 'obterIP').mockResolvedValue('127.0.0.1');
    const fallbackSpy = jest
      .spyOn(portalClienteService as any, 'atualizarStatusLocal')
      .mockResolvedValue(undefined);

    await portalClienteService.atualizarStatus(token, 'rejeitada');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fallbackSpy).toHaveBeenCalledWith(token, 'rejeitada');
  });
});
