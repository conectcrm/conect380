import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import systemBrandingService, {
  DEFAULT_SYSTEM_BRANDING,
  type SystemBrandingEffectiveConfig,
} from '../services/systemBrandingService';
import { resolveRuntimeAssetUrl } from '../utils/runtimeAssetUrl';

interface SystemBrandingContextValue {
  branding: SystemBrandingEffectiveConfig;
  isLoading: boolean;
  isReady: boolean;
  refreshBranding: (options?: { silent?: boolean }) => Promise<void>;
}

const STORAGE_KEY = 'conect_system_branding_cache_v2';
const GLOBAL_STORAGE_KEY = `${STORAGE_KEY}::global`;
const BRANDING_REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const AUTH_TOKEN_EVENT_NAME = 'authTokenChanged';
const EMPRESA_EVENT_NAME = 'empresaAtivaChanged';
const BRANDING_CACHE_PREFIX = `${STORAGE_KEY}::`;
const LEGACY_BRANDING_CACHE_KEY = 'conect_system_branding_cache_v1';
const MAX_CACHEABLE_URL_LENGTH = 2048;
let brandingCacheDisabled = false;
const isQuotaExceededError = (error: unknown): boolean => {
  if (!(error instanceof DOMException)) {
    return false;
  }

  return (
    error.name === 'QuotaExceededError' ||
    error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    error.code === 22 ||
    error.code === 1014
  );
};

const sanitizeAssetForCache = (value: string | null | undefined, fallback = ''): string => {
  const normalized = String(value || '').trim();
  if (!normalized) {
    return fallback;
  }

  if (normalized.startsWith('data:') || normalized.startsWith('blob:')) {
    return fallback;
  }

  if (normalized.length > MAX_CACHEABLE_URL_LENGTH) {
    return fallback;
  }

  return normalized;
};

const sanitizeBrandingForCache = (
  value: SystemBrandingEffectiveConfig,
): SystemBrandingEffectiveConfig => {
  const normalized = systemBrandingService.normalizeBranding(value);

  return {
    ...normalized,
    logoFullUrl: sanitizeAssetForCache(normalized.logoFullUrl, ''),
    logoFullLightUrl: sanitizeAssetForCache(normalized.logoFullLightUrl, ''),
    logoIconUrl: sanitizeAssetForCache(normalized.logoIconUrl, ''),
    loadingLogoUrl: sanitizeAssetForCache(normalized.loadingLogoUrl, ''),
    faviconUrl: sanitizeAssetForCache(
      normalized.faviconUrl,
      DEFAULT_SYSTEM_BRANDING.faviconUrl,
    ),
  };
};

const buildMinimalBrandingCache = (
  value: SystemBrandingEffectiveConfig,
): SystemBrandingEffectiveConfig => {
  const normalized = systemBrandingService.normalizeBranding(value);
  return {
    ...DEFAULT_SYSTEM_BRANDING,
    faviconUrl: sanitizeAssetForCache(
      normalized.faviconUrl,
      DEFAULT_SYSTEM_BRANDING.faviconUrl,
    ),
    maintenanceBanner: normalized.maintenanceBanner,
  };
};

const removeLegacyBrandingCacheEntries = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  const keysToRemove: string[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key && key.startsWith(BRANDING_CACHE_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => window.localStorage.removeItem(key));

  window.localStorage.removeItem(LEGACY_BRANDING_CACHE_KEY);
};

const readCachedBranding = (): Partial<SystemBrandingEffectiveConfig> | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const cached = window.localStorage.getItem(GLOBAL_STORAGE_KEY);
    if (!cached) {
      return null;
    }

    return JSON.parse(cached) as Partial<SystemBrandingEffectiveConfig>;
  } catch (error) {
    console.warn('[SystemBranding] Cache invalido, descartando entrada atual.', error);
    try {
      window.localStorage.removeItem(GLOBAL_STORAGE_KEY);
    } catch (removeError) {
      console.warn('[SystemBranding] Nao foi possivel limpar cache invalido.', removeError);
    }
    return null;
  }
};

const persistBrandingCache = (
  value: SystemBrandingEffectiveConfig,
): void => {
  if (typeof window === 'undefined' || brandingCacheDisabled) {
    return;
  }

  const safePayload = sanitizeBrandingForCache(value);
  const serializedPayload = JSON.stringify(safePayload);

  try {
    window.localStorage.setItem(GLOBAL_STORAGE_KEY, serializedPayload);
    return;
  } catch (error) {
    if (!isQuotaExceededError(error)) {
      console.warn('[SystemBranding] Nao foi possivel persistir cache de branding.', error);
      return;
    }
  }

  try {
    removeLegacyBrandingCacheEntries();
  } catch (cleanupError) {
    console.warn('[SystemBranding] Falha ao limpar cache de branding apos quota excedida.', cleanupError);
  }

  try {
    const minimalPayload = JSON.stringify(buildMinimalBrandingCache(safePayload));
    window.localStorage.setItem(GLOBAL_STORAGE_KEY, minimalPayload);
  } catch (retryError) {
    brandingCacheDisabled = true;
    console.warn('[SystemBranding] Quota excedida ao persistir cache minimo de branding.', retryError);
  }
};

const hasAuthToken = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return Boolean(window.localStorage.getItem('authToken'));
  } catch {
    return false;
  }
};

const resolveAssetUrl = (url: string): string => {
  return resolveRuntimeAssetUrl(url);
};

const applyFavicon = (faviconUrl: string): void => {
  if (!faviconUrl || !faviconUrl.trim()) {
    return;
  }

  const href = resolveAssetUrl(faviconUrl);
  const head = document.head;
  const lowerHref = href.toLowerCase();
  const inferredType = lowerHref.includes('.png') || lowerHref.startsWith('data:image/png')
    ? 'image/png'
    : lowerHref.includes('.ico') || lowerHref.startsWith('data:image/x-icon')
      ? 'image/x-icon'
      : 'image/svg+xml';

  const ensureLink = (rel: string): HTMLLinkElement => {
    const selector = `link[rel="${rel}"]`;
    let link = head.querySelector(selector) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = rel;
      head.appendChild(link);
    }
    return link;
  };

  const iconLink = ensureLink('icon');
  iconLink.href = href;
  iconLink.type = inferredType;

  const shortcutLink = ensureLink('shortcut icon');
  shortcutLink.href = href;
  shortcutLink.type = inferredType;

  ensureLink('apple-touch-icon').href = href;
};

const SystemBrandingContext = createContext<SystemBrandingContextValue | null>(null);

interface SystemBrandingProviderProps {
  children: React.ReactNode;
}

export const SystemBrandingProvider: React.FC<SystemBrandingProviderProps> = ({ children }) => {
  const [branding, setBranding] = useState<SystemBrandingEffectiveConfig>(DEFAULT_SYSTEM_BRANDING);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReady, setIsReady] = useState<boolean>(false);

  const refreshBranding = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    if (!silent) {
      setIsLoading(true);
    }

    try {
      const data = hasAuthToken()
        ? await systemBrandingService.getRuntimeBranding()
        : await systemBrandingService.getPublicBranding();
      const normalized = systemBrandingService.normalizeBranding(data);
      setBranding(normalized);
      persistBrandingCache(normalized);
    } catch (error) {
      console.warn('[SystemBranding] Nao foi possivel atualizar branding publico.', error);

      if (hasAuthToken()) {
        const fallback = systemBrandingService.normalizeBranding(DEFAULT_SYSTEM_BRANDING);
        setBranding(fallback);
        persistBrandingCache(fallback);
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    const parsed = readCachedBranding();
    if (parsed) {
      setBranding(systemBrandingService.normalizeBranding(parsed));
    }

    void refreshBranding();
  }, [refreshBranding]);

  useEffect(() => {
    const handleScopeChanged = () => {
      const parsed = readCachedBranding();
      if (parsed) {
        setBranding(systemBrandingService.normalizeBranding(parsed));
      } else {
        setBranding(systemBrandingService.normalizeBranding(DEFAULT_SYSTEM_BRANDING));
      }

      void refreshBranding({ silent: true });
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'authToken' || event.key === 'empresaAtiva') {
        handleScopeChanged();
      }
    };

    window.addEventListener(AUTH_TOKEN_EVENT_NAME, handleScopeChanged);
    window.addEventListener(EMPRESA_EVENT_NAME, handleScopeChanged);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(AUTH_TOKEN_EVENT_NAME, handleScopeChanged);
      window.removeEventListener(EMPRESA_EVENT_NAME, handleScopeChanged);
      window.removeEventListener('storage', handleStorage);
    };
  }, [refreshBranding]);

  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState !== 'visible') {
        return;
      }

      void refreshBranding({ silent: true });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshBranding({ silent: true });
      }
    };

    const interval = window.setInterval(refreshIfVisible, BRANDING_REFRESH_INTERVAL_MS);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshBranding]);

  useEffect(() => {
    applyFavicon(branding.faviconUrl);
  }, [branding.faviconUrl]);

  const value = useMemo<SystemBrandingContextValue>(
    () => ({
      branding,
      isLoading,
      isReady,
      refreshBranding,
    }),
    [branding, isLoading, isReady, refreshBranding],
  );

  return <SystemBrandingContext.Provider value={value}>{children}</SystemBrandingContext.Provider>;
};

export const useSystemBranding = (): SystemBrandingContextValue => {
  const context = useContext(SystemBrandingContext);
  if (!context) {
    throw new Error('useSystemBranding deve ser usado dentro de SystemBrandingProvider');
  }
  return context;
};

export const systemBrandingUrlResolver = resolveAssetUrl;
