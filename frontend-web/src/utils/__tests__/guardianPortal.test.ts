import { buildGuardianUrl, getGuardianBaseUrl, openGuardianPortal } from '../guardianPortal';

describe('guardianPortal utils', () => {
  const originalGuardianBase = process.env.REACT_APP_GUARDIAN_WEB_URL;

  afterEach(() => {
    if (typeof originalGuardianBase === 'string') {
      process.env.REACT_APP_GUARDIAN_WEB_URL = originalGuardianBase;
    } else {
      delete process.env.REACT_APP_GUARDIAN_WEB_URL;
    }

    jest.restoreAllMocks();
  });

  it('uses configured guardian base URL and removes trailing slash', () => {
    process.env.REACT_APP_GUARDIAN_WEB_URL = 'https://guardian.conect360.com.br///';

    expect(getGuardianBaseUrl()).toBe('https://guardian.conect360.com.br');
  });

  it('builds guardian URL with query string and ignores empty values', () => {
    process.env.REACT_APP_GUARDIAN_WEB_URL = 'https://guardian.conect360.com.br';

    const target = buildGuardianUrl('/governance/companies', {
      empresaId: 'emp-123',
      tab: 'billing',
      vazio: '',
      nulo: null,
      indefinido: undefined,
    });

    expect(target).toBe(
      'https://guardian.conect360.com.br/governance/companies?empresaId=emp-123&tab=billing',
    );
  });

  it('falls back to current host on port 3020 when env is not configured', () => {
    delete process.env.REACT_APP_GUARDIAN_WEB_URL;

    expect(getGuardianBaseUrl()).toBe('http://localhost:3020');
  });

  it('opens guardian in a new tab when requested', () => {
    process.env.REACT_APP_GUARDIAN_WEB_URL = 'https://guardian.conect360.com.br';
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);

    const destination = openGuardianPortal('/governance/companies', {
      newTab: true,
      query: { empresaId: 'emp-99' },
    });

    expect(destination).toBe(
      'https://guardian.conect360.com.br/governance/companies?empresaId=emp-99',
    );
    expect(openSpy).toHaveBeenCalledWith(
      'https://guardian.conect360.com.br/governance/companies?empresaId=emp-99',
      '_blank',
      'noopener,noreferrer',
    );
  });
});
