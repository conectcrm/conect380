import {
  clearKnownLoginHistory,
  hasKnownLoginForEmail,
  markKnownLoginForEmail,
} from '../loginGreetingHistory';

const LOGIN_HISTORY_STORAGE_KEY = 'conect360_login_history_v1';

describe('loginGreetingHistory', () => {
  beforeEach(() => {
    localStorage.clear();
    clearKnownLoginHistory();
  });

  it('returns false when there is no history', () => {
    expect(hasKnownLoginForEmail('admin@conect360.com')).toBe(false);
    expect(hasKnownLoginForEmail('')).toBe(false);
  });

  it('marks and recognizes returning users by normalized email', () => {
    markKnownLoginForEmail(' Admin@Conect360.com ');

    expect(hasKnownLoginForEmail('admin@conect360.com')).toBe(true);
    expect(hasKnownLoginForEmail('ADMIN@CONECT360.COM')).toBe(true);
  });

  it('recovers from malformed localStorage payload', () => {
    localStorage.setItem(LOGIN_HISTORY_STORAGE_KEY, '{invalid-json');

    expect(hasKnownLoginForEmail('admin@conect360.com')).toBe(false);
    markKnownLoginForEmail('admin@conect360.com');
    expect(hasKnownLoginForEmail('admin@conect360.com')).toBe(true);
  });

  it('caps stored history to the latest entries', () => {
    for (let index = 0; index < 80; index += 1) {
      markKnownLoginForEmail(`usuario${index}@empresa.com`);
    }

    const raw = localStorage.getItem(LOGIN_HISTORY_STORAGE_KEY);
    expect(raw).not.toBeNull();

    const parsed = JSON.parse(raw as string) as { emails: string[] };
    expect(Array.isArray(parsed.emails)).toBe(true);
    expect(parsed.emails.length).toBeLessThanOrEqual(64);
  });
});
