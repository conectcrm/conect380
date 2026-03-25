const USER_STORAGE_KEY = 'user_data';
const EMPRESA_STORAGE_KEY = 'empresaAtiva';

type ScopeIdentifiers = {
  userId: string | null;
  empresaId: string | null;
};

type ScopeFallback = Partial<ScopeIdentifiers>;

type ScopedStorageKeyOptions = {
  includeUser?: boolean;
  includeEmpresa?: boolean;
  fallbackUserId?: string | null;
  fallbackEmpresaId?: string | null;
};

const canUseStorage = (): boolean => typeof window !== 'undefined' && !!window.localStorage;

const normalizeScopeValue = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const getStoredUserId = (): string | null => {
  if (!canUseStorage()) return null;

  try {
    const raw = window.localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    return normalizeScopeValue((parsed as { id?: unknown }).id);
  } catch {
    return null;
  }
};

const getStoredEmpresaId = (): string | null => {
  if (!canUseStorage()) return null;
  return normalizeScopeValue(window.localStorage.getItem(EMPRESA_STORAGE_KEY));
};

export const getStorageScopeIdentifiers = (fallback?: ScopeFallback): ScopeIdentifiers => {
  const fallbackUserId = normalizeScopeValue(fallback?.userId);
  const fallbackEmpresaId = normalizeScopeValue(fallback?.empresaId);

  return {
    userId: fallbackUserId ?? getStoredUserId(),
    empresaId: fallbackEmpresaId ?? getStoredEmpresaId(),
  };
};

export const buildScopedStorageKey = (
  baseKey: string,
  options: ScopedStorageKeyOptions = {},
): string => {
  const includeUser = options.includeUser ?? false;
  const includeEmpresa = options.includeEmpresa ?? false;
  const scope = getStorageScopeIdentifiers({
    userId: options.fallbackUserId ?? null,
    empresaId: options.fallbackEmpresaId ?? null,
  });

  const keyParts = [baseKey];
  if (includeEmpresa) {
    keyParts.push(`empresa:${scope.empresaId ?? 'none'}`);
  }
  if (includeUser) {
    keyParts.push(`user:${scope.userId ?? 'anon'}`);
  }

  return keyParts.join('::');
};

export type { ScopeIdentifiers, ScopedStorageKeyOptions };
