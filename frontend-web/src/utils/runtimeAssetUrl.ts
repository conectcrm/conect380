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
  if (baseURL) {
    const normalizedBase = baseURL.replace(/\/$/, '');
    const normalizedPath = normalized.startsWith('/') ? normalized : `/${normalized}`;
    return `${normalizedBase}${normalizedPath}`;
  }

  if (normalized.startsWith('/')) {
    const basePath = process.env.PUBLIC_URL || '';
    return `${basePath}${normalized}`;
  }

  return normalized;
};

