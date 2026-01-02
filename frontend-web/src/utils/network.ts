const DEFAULT_API_PORT = '3001';

const getLocationSnapshot = () => {
  if (typeof window === 'undefined' || !window.location) {
    return {
      hostname: 'localhost',
      protocol: 'http:' as Location['protocol'],
    };
  }

  return window.location;
};

const ensureLeadingSlash = (value?: string) => {
  if (!value) {
    return '';
  }

  return value.startsWith('/') ? value : `/${value}`;
};

const normalizePort = (port?: string | number | null) => {
  if (port === null) {
    return '';
  }

  const normalized = port ?? DEFAULT_API_PORT;
  const asString = String(normalized).trim();

  return asString ? `:${asString}` : '';
};

const buildUrl = (
  protocol: 'http' | 'https' | 'ws' | 'wss',
  host: string,
  port?: string | number | null,
  path?: string,
) => {
  const portSegment = normalizePort(port);
  const pathSegment = ensureLeadingSlash(path);

  return `${protocol}://${host}${portSegment}${pathSegment}`;
};

export const isLoopbackHost = (host?: string | null): boolean => {
  if (!host) {
    return false;
  }

  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
};

export const isPrivateNetworkHost = (host?: string | null): boolean => {
  if (!host) {
    return false;
  }

  return (
    host.startsWith('10.') ||
    host.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  );
};

const shouldUseEnvHost = (envHost: string, currentHost: string) => {
  const envIsLoopback = isLoopbackHost(envHost);
  const currentIsLoopback = isLoopbackHost(currentHost);

  return !envIsLoopback || currentIsLoopback;
};

interface ResolveBaseUrlOptions {
  envUrl?: string;
  family: 'http' | 'ws';
  port?: string | number | null;
  path?: string;
  preferSecure?: boolean;
  onEnvIgnored?: (details: { envUrl: string; currentHost: string }) => void;
}

const resolveHostAwareBaseUrl = ({
  envUrl,
  family,
  port,
  path,
  preferSecure,
  onEnvIgnored,
}: ResolveBaseUrlOptions): string => {
  const location = getLocationSnapshot();
  const currentHost = location.hostname || 'localhost';
  const trimmedEnv = envUrl?.trim();

  if (trimmedEnv) {
    try {
      const parsed = new URL(trimmedEnv);

      if (shouldUseEnvHost(parsed.hostname, currentHost)) {
        return trimmedEnv;
      }

      onEnvIgnored?.({ envUrl: trimmedEnv, currentHost });
    } catch (err) {
      console.warn('[network] URL da env é inválida, retornando valor bruto:', trimmedEnv, err);
      return trimmedEnv;
    }
  }

  const isSecureContext = preferSecure ?? location.protocol === 'https:';
  const protocol =
    family === 'http' ? (isSecureContext ? 'https' : 'http') : isSecureContext ? 'wss' : 'ws';

  if (isLoopbackHost(currentHost)) {
    return buildUrl(protocol, 'localhost', port ?? DEFAULT_API_PORT, path);
  }

  if (isPrivateNetworkHost(currentHost)) {
    const privateProtocol = family === 'http' ? 'http' : 'ws';
    return buildUrl(privateProtocol, currentHost, port ?? DEFAULT_API_PORT, path);
  }

  return buildUrl(protocol, currentHost, port ?? DEFAULT_API_PORT, path);
};

interface ApiBaseUrlOptions {
  envUrl?: string;
  port?: string | number | null;
  preferSecure?: boolean;
  onEnvIgnored?: (details: { envUrl: string; currentHost: string }) => void;
}

export const resolveApiBaseUrl = (options?: ApiBaseUrlOptions): string => {
  return resolveHostAwareBaseUrl({
    ...options,
    envUrl: options?.envUrl,
    family: 'http',
    path: undefined,
    onEnvIgnored: options?.onEnvIgnored,
  });
};

interface SocketBaseUrlOptions {
  envUrl?: string;
  path?: string;
  port?: string | number | null;
  preferSecure?: boolean;
  useWebSocketScheme?: boolean;
  onEnvIgnored?: (details: { envUrl: string; currentHost: string }) => void;
}

export const resolveSocketBaseUrl = (options?: SocketBaseUrlOptions): string => {
  return resolveHostAwareBaseUrl({
    envUrl: options?.envUrl,
    family: options?.useWebSocketScheme ? 'ws' : 'http',
    path: options?.path,
    port: options?.port ?? DEFAULT_API_PORT,
    preferSecure: options?.preferSecure,
    onEnvIgnored: options?.onEnvIgnored,
  });
};

export { DEFAULT_API_PORT };
