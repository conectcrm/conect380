import { api } from './api';
import {
  AtualizarCategoriaProdutoRequest,
  AtualizarConfiguracaoProdutoRequest,
  AtualizarSubcategoriaProdutoRequest,
  CategoriaProduto,
  ConfiguracaoProduto,
  CriarCategoriaProdutoRequest,
  CriarConfiguracaoProdutoRequest,
  CriarSubcategoriaProdutoRequest,
  EstatisticasCategorias,
  FiltrosCategorias,
  FiltrosConfiguracoes,
  FiltrosSubcategorias,
  SubcategoriaProduto,
} from '../types/produtos';

class CategoriasProdutosService {
  private limparParams<T extends Record<string, unknown>>(params: T): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
    );
  }

  async listarCategorias(filtros?: FiltrosCategorias): Promise<CategoriaProduto[]> {
    const response = await api.get<CategoriaProduto[]>('/categorias-produtos', {
      params: this.limparParams({
        ativo: filtros?.ativo,
        busca: filtros?.busca,
        ordenacao: filtros?.ordenacao,
        direcao: filtros?.direcao,
      }),
    });
    return response.data;
  }

  async obterCategoria(id: string): Promise<CategoriaProduto> {
    const response = await api.get<CategoriaProduto>(`/categorias-produtos/${id}`);
    return response.data;
  }

  async criarCategoria(categoria: CriarCategoriaProdutoRequest): Promise<CategoriaProduto> {
    const response = await api.post<CategoriaProduto>('/categorias-produtos', categoria);
    return response.data;
  }

  async atualizarCategoria(categoria: AtualizarCategoriaProdutoRequest): Promise<CategoriaProduto> {
    const response = await api.put<CategoriaProduto>(`/categorias-produtos/${categoria.id}`, categoria);
    return response.data;
  }

  async excluirCategoria(id: string): Promise<void> {
    await api.delete(`/categorias-produtos/${id}`);
  }

  async listarSubcategorias(filtros?: FiltrosSubcategorias): Promise<SubcategoriaProduto[]> {
    const response = await api.get<SubcategoriaProduto[]>('/subcategorias-produtos', {
      params: this.limparParams({
        ativo: filtros?.ativo,
        busca: filtros?.busca,
        categoria_id: filtros?.categoria_id,
        ordenacao: filtros?.ordenacao,
        direcao: filtros?.direcao,
      }),
    });
    return response.data;
  }

  async criarSubcategoria(
    subcategoria: CriarSubcategoriaProdutoRequest,
  ): Promise<SubcategoriaProduto> {
    const response = await api.post<SubcategoriaProduto>('/subcategorias-produtos', subcategoria);
    return response.data;
  }

  async atualizarSubcategoria(
    subcategoria: AtualizarSubcategoriaProdutoRequest,
  ): Promise<SubcategoriaProduto> {
    const response = await api.put<SubcategoriaProduto>(
      `/subcategorias-produtos/${subcategoria.id}`,
      subcategoria,
    );
    return response.data;
  }

  async excluirSubcategoria(id: string): Promise<void> {
    await api.delete(`/subcategorias-produtos/${id}`);
  }

  async listarConfiguracoes(filtros?: FiltrosConfiguracoes): Promise<ConfiguracaoProduto[]> {
    const response = await api.get<ConfiguracaoProduto[]>('/configuracoes-produtos', {
      params: this.limparParams({
        ativo: filtros?.ativo,
        busca: filtros?.busca,
        subcategoria_id: filtros?.subcategoria_id,
        ordenacao: filtros?.ordenacao,
        direcao: filtros?.direcao,
      }),
    });
    return response.data;
  }

  async criarConfiguracao(
    configuracao: CriarConfiguracaoProdutoRequest,
  ): Promise<ConfiguracaoProduto> {
    const response = await api.post<ConfiguracaoProduto>('/configuracoes-produtos', configuracao);
    return response.data;
  }

  async atualizarConfiguracao(
    configuracao: AtualizarConfiguracaoProdutoRequest,
  ): Promise<ConfiguracaoProduto> {
    const response = await api.put<ConfiguracaoProduto>(
      `/configuracoes-produtos/${configuracao.id}`,
      configuracao,
    );
    return response.data;
  }

  async excluirConfiguracao(id: string): Promise<void> {
    await api.delete(`/configuracoes-produtos/${id}`);
  }

  async obterEstatisticas(): Promise<EstatisticasCategorias> {
    const response = await api.get<EstatisticasCategorias>('/categorias-produtos/estatisticas');
    return response.data;
  }

  async reordenarCategorias(categorias: Array<{ id: string; ordem: number }>): Promise<void> {
    await api.put('/categorias-produtos/reordenar', { categorias });
  }

  async duplicarCategoria(id: string, novoNome: string): Promise<CategoriaProduto> {
    const response = await api.post<CategoriaProduto>(`/categorias-produtos/${id}/duplicar`, {
      novoNome,
    });
    return response.data;
  }

  async exportarCategorias(): Promise<Blob> {
    const response = await api.get('/categorias-produtos/exportar', {
      responseType: 'blob',
    });
    return response.data;
  }

  async importarCategorias(arquivo: File): Promise<{ importadas: number; erros: string[] }> {
    const formData = new FormData();
    formData.append('arquivo', arquivo);

    const response = await api.post<{ importadas: number; erros: string[] }>(
      '/categorias-produtos/importar',
      formData,
    );
    return response.data;
  }
}

export const categoriasProdutosService = new CategoriasProdutosService();

