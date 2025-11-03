import { api } from '../services/api';

/**
 * Normaliza o caminho de avatar retornado pela API.
 * Aceita URLs absolutas, base64 e caminhos relativos.
 */
export const resolveAvatarUrl = (rawFoto?: string | null): string | null => {
  if (!rawFoto) {
    return null;
  }

  const foto = rawFoto.trim();
  if (!foto) {
    return null;
  }

  // URLs absolutas (http, https) ou base64/data
  if (/^(https?:)?\/\//i.test(foto) || foto.startsWith('data:')) {
    if (foto.startsWith('//')) {
      return `https:${foto}`;
    }
    return foto;
  }

  const baseURL = api.defaults.baseURL || '';
  if (!baseURL) {
    return foto;
  }

  const normalizedBase = baseURL.replace(/\/$/, '');
  const normalizedPath = foto.startsWith('/') ? foto : `/${foto}`;

  return `${normalizedBase}${normalizedPath}`;
};
