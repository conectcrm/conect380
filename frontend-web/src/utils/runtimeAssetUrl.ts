import { api } from '../services/api';

/**
 * Resolve assets dinâmicos retornados pela API (ex.: /uploads/...).
 * Em produção app/api podem estar em hosts diferentes, então caminhos relativos
 * devem usar a base da API.
 */
export const resolveRuntimeAssetUrl = (url: string): string => {
  if (!url) {
    return url;
  }

  const normalized = url.trim();
  if (!normalized) {
    return normalized;
  }

  const ensureLeadingSlash = (value: string): string =>
    value.startsWith('/') ? value : `/${value}`;

  const isApiHostedAssetPath = (value: string): boolean =>
    ensureLeadingSlash(value).startsWith('/uploads/');

  if (
    normalized.startsWith('data:') ||
    normalized.startsWith('blob:') ||
    normalized.startsWith('http://') ||
    normalized.startsWith('https://')
  ) {
    return normalized;
  }

  if (normalized.startsWith('//')) {
    return `https:${normalized}`;
  }

  const baseURL = api.defaults.baseURL || '';
  if (baseURL && isApiHostedAssetPath(normalized)) {
    const normalizedBase = baseURL.replace(/\/$/, '');
    const normalizedPath = ensureLeadingSlash(normalized);
    return `${normalizedBase}${normalizedPath}`;
  }

  if (isApiHostedAssetPath(normalized)) {
    return ensureLeadingSlash(normalized);
  }

  if (normalized.startsWith('/')) {
    const basePath = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
    return `${basePath}${normalized}`;
  }

  return normalized;
};
