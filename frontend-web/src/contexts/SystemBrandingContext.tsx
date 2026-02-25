import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import systemBrandingService, {
  DEFAULT_SYSTEM_BRANDING,
  type SystemBrandingEffectiveConfig,
} from '../services/systemBrandingService';

interface SystemBrandingContextValue {
  branding: SystemBrandingEffectiveConfig;
  isLoading: boolean;
  isReady: boolean;
  refreshBranding: () => Promise<void>;
}

const STORAGE_KEY = 'conect_system_branding_cache_v1';

const resolveAssetUrl = (url: string): string => {
  if (!url) {
    return url;
  }

  if (
    url.startsWith('data:') ||
    url.startsWith('blob:') ||
    url.startsWith('http://') ||
    url.startsWith('https://')
  ) {
    return url;
  }

  if (url.startsWith('/')) {
    const basePath = process.env.PUBLIC_URL || '';
    return `${basePath}${url}`;
  }

  return url;
};

const applyFavicon = (faviconUrl: string): void => {
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

  const refreshBranding = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await systemBrandingService.getPublicBranding();
      const normalized = { ...DEFAULT_SYSTEM_BRANDING, ...data };
      setBranding(normalized);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    } catch (error) {
      console.warn('[SystemBranding] Nao foi possivel atualizar branding publico.', error);
    } finally {
      setIsLoading(false);
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as Partial<SystemBrandingEffectiveConfig>;
        setBranding({ ...DEFAULT_SYSTEM_BRANDING, ...parsed });
      } catch (error) {
        console.warn('[SystemBranding] Cache invalido, usando branding padrao.', error);
      }
    }

    void refreshBranding();
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
