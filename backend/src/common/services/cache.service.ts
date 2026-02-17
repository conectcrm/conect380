import { Injectable } from '@nestjs/common';

/**
 * Cache Service
 *
 * Gerencia invalidação de cache de forma centralizada.
 * Use este service para invalidar cache após operações de escrita.
 */
@Injectable()
export class CacheService {
  private static cacheInterceptorInstance: any;

  /**
   * Registrar instância do CacheInterceptor
   * Chamado pelo próprio interceptor durante inicialização
   */
  static registerInterceptor(instance: any) {
    CacheService.cacheInterceptorInstance = instance;
  }

  /**
   * Invalidar cache por rota/prefixo
   *
   * @example
   * // Invalida todo cache de clientes
   * cacheService.invalidate('/clientes');
   *
   * // Invalida cache de uma empresa específica
   * cacheService.invalidate('empresa-123:/clientes');
   */
  invalidate(prefix: string) {
    if (!CacheService.cacheInterceptorInstance) {
      console.warn('⚠️ [CacheService] CacheInterceptor não registrado');
      return;
    }

    CacheService.cacheInterceptorInstance.invalidateByPrefix(prefix);
  }

  /**
   * Limpar todo o cache
   */
  clearAll() {
    if (!CacheService.cacheInterceptorInstance) {
      console.warn('⚠️ [CacheService] CacheInterceptor não registrado');
      return;
    }

    CacheService.cacheInterceptorInstance.clearAll();
  }

  /**
   * Obter estatísticas do cache
   */
  getStats() {
    if (!CacheService.cacheInterceptorInstance) {
      return { size: 0, entries: [] };
    }

    return CacheService.cacheInterceptorInstance.getStats();
  }
}
