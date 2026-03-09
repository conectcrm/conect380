type GuardianQuery = Record<string, string | number | boolean | null | undefined>;

const DEFAULT_GUARDIAN_PORT = 3020;
const DEFAULT_GUARDIAN_HOST = 'localhost';

const sanitizeBaseUrl = (baseUrl: string): string => {
  return baseUrl.trim().replace(/\/+$/, '');
};

const resolveGuardianHost = (): string => {
  if (typeof window === 'undefined') {
    return DEFAULT_GUARDIAN_HOST;
  }

  return window.location.hostname || DEFAULT_GUARDIAN_HOST;
};

export const getGuardianBaseUrl = (): string => {
  const configuredBase = process.env.REACT_APP_GUARDIAN_WEB_URL;
  if (configuredBase && configuredBase.trim().length > 0) {
    return sanitizeBaseUrl(configuredBase);
  }

  if (typeof window === 'undefined') {
    return `http://${DEFAULT_GUARDIAN_HOST}:${DEFAULT_GUARDIAN_PORT}`;
  }

  const protocol = window.location.protocol || 'http:';
  return `${protocol}//${resolveGuardianHost()}:${DEFAULT_GUARDIAN_PORT}`;
};

const applyQuery = (url: URL, query?: GuardianQuery): void => {
  if (!query) {
    return;
  }

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    url.searchParams.set(key, String(value));
  });
};

export const buildGuardianUrl = (path: string, query?: GuardianQuery): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${getGuardianBaseUrl()}${normalizedPath}`);
  applyQuery(url, query);
  return url.toString();
};

type OpenGuardianOptions = {
  newTab?: boolean;
  query?: GuardianQuery;
};

export const openGuardianPortal = (path: string, options?: OpenGuardianOptions): string => {
  const destination = buildGuardianUrl(path, options?.query);

  if (typeof window === 'undefined') {
    return destination;
  }

  if (options?.newTab) {
    window.open(destination, '_blank', 'noopener,noreferrer');
    return destination;
  }

  window.location.assign(destination);
  return destination;
};
