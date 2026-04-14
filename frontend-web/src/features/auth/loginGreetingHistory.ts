const LOGIN_HISTORY_STORAGE_KEY = 'conect360_login_history_v1';
const MAX_HISTORY_ENTRIES = 64;

const isBrowser = (): boolean =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const hashEmail = (normalizedEmail: string): string => {
  let hash = 5381;
  for (let index = 0; index < normalizedEmail.length; index += 1) {
    hash = (hash * 33) ^ normalizedEmail.charCodeAt(index);
  }

  return (hash >>> 0).toString(36);
};

const readHistory = (): Set<string> => {
  if (!isBrowser()) {
    return new Set();
  }

  try {
    const rawValue = window.localStorage.getItem(LOGIN_HISTORY_STORAGE_KEY);
    if (!rawValue) {
      return new Set();
    }

    const parsed = JSON.parse(rawValue) as unknown;
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((entry): entry is string => typeof entry === 'string'));
    }

    const parsedObject = parsed as { emails?: unknown };
    if (typeof parsed === 'object' && parsed !== null && Array.isArray(parsedObject.emails)) {
      return new Set(
        parsedObject.emails.filter((entry: unknown): entry is string => typeof entry === 'string'),
      );
    }

    return new Set();
  } catch {
    return new Set();
  }
};

const writeHistory = (history: Set<string>): void => {
  if (!isBrowser()) {
    return;
  }

  const trimmed = Array.from(history).slice(-MAX_HISTORY_ENTRIES);
  try {
    window.localStorage.setItem(LOGIN_HISTORY_STORAGE_KEY, JSON.stringify({ emails: trimmed }));
  } catch {
    // Ignore quota/storage errors. Greeting must not block login flow.
  }
};

export const hasKnownLoginForEmail = (email: string): boolean => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return false;
  }

  return readHistory().has(hashEmail(normalizedEmail));
};

export const markKnownLoginForEmail = (email: string): void => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return;
  }

  const history = readHistory();
  history.add(hashEmail(normalizedEmail));
  writeHistory(history);
};

export const clearKnownLoginHistory = (): void => {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.removeItem(LOGIN_HISTORY_STORAGE_KEY);
  } catch {
    // No-op for storage-restricted environments.
  }
};
