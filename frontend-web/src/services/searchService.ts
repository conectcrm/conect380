import api from './api';

export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: 'cliente' | 'cotacao' | 'produto' | 'oportunidade' | 'contato';
  path: string;
  highlight?: string;
}

class SearchService {
  /**
   * Busca global no sistema
   * @param query Termo de busca
   * @param tipos Tipos de entidades (opcional)
   * @returns Lista de resultados
   */
  async searchGlobal(query: string, tipos?: string[]): Promise<SearchResult[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    try {
      const params: any = { q: query.trim() };

      if (tipos && tipos.length > 0) {
        params.tipos = tipos.join(',');
      }

      const response = await api.get<SearchResult[]>('/search', { params });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar:', error);
      return [];
    }
  }
}

export default new SearchService();
