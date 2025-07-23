// services/categoriasProdutosService.ts
import { 
  CategoriaProduto, 
  SubcategoriaProduto, 
  ConfiguracaoProduto,
  CriarCategoriaProdutoRequest,
  CriarSubcategoriaProdutoRequest,
  CriarConfiguracaoProdutoRequest,
  AtualizarCategoriaProdutoRequest,
  AtualizarSubcategoriaProdutoRequest,
  AtualizarConfiguracaoProdutoRequest,
  ApiResponse,
  FiltrosCategorias,
  FiltrosSubcategorias,
  FiltrosConfiguracoes,
  EstatisticasCategorias
} from '../types/produtos';

const BASE_URL = 'http://localhost:3001/api';
const STORAGE_KEY = 'fenixcrm_categorias';

class CategoriasProdutosService {
  // Método auxiliar para obter categorias do localStorage
  private obterCategoriasDoStorage(): CategoriaProduto[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erro ao ler categorias do localStorage:', error);
      return [];
    }
  }

  // Método auxiliar para salvar categorias no localStorage
  private salvarCategoriasNoStorage(categorias: CategoriaProduto[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(categorias));
    } catch (error) {
      console.error('Erro ao salvar categorias no localStorage:', error);
    }
  }

  // CATEGORIAS
  async listarCategorias(filtros?: FiltrosCategorias): Promise<CategoriaProduto[]> {
    try {
      // Primeiro tenta buscar do backend
      const params = new URLSearchParams();
      if (filtros?.ativo !== undefined) params.append('ativo', filtros.ativo.toString());
      if (filtros?.busca) params.append('busca', filtros.busca);
      if (filtros?.ordenacao) params.append('ordenacao', filtros.ordenacao);
      if (filtros?.direcao) params.append('direcao', filtros.direcao);

      const response = await fetch(`${BASE_URL}/categorias-produtos?${params}`);
      
      if (response.ok) {
        const data: ApiResponse<CategoriaProduto[]> = await response.json();
        
        if (data.success && data.data) {
          return data.data;
        }
      }
      
      // Se falhar, usa localStorage como fallback
      const categoriasLocal = this.obterCategoriasDoStorage();
      
      if (filtros?.busca) {
        return categoriasLocal.filter(cat => 
          cat.nome.toLowerCase().includes(filtros.busca!.toLowerCase()) ||
          cat.descricao.toLowerCase().includes(filtros.busca!.toLowerCase())
        );
      }
      
      if (filtros?.ativo !== undefined) {
        return categoriasLocal.filter(cat => cat.ativo === filtros.ativo);
      }
      
      return categoriasLocal;
    } catch (error) {
      console.error('Erro ao listar categorias, usando localStorage:', error);
      // Em caso de erro, sempre retorna do localStorage
      return this.obterCategoriasDoStorage();
    }
  }

  async obterCategoria(id: string): Promise<CategoriaProduto> {
    try {
      const response = await fetch(`${BASE_URL}/categorias-produtos/${id}`);
      
      if (response.ok) {
        const data: ApiResponse<CategoriaProduto> = await response.json();
        
        if (data.success && data.data) {
          return data.data;
        }
      }
      
      // Fallback para localStorage
      const categorias = this.obterCategoriasDoStorage();
      const categoria = categorias.find(cat => cat.id === id);
      
      if (!categoria) {
        throw new Error('Categoria não encontrada');
      }
      
      return categoria;
    } catch (error) {
      console.error('Erro ao obter categoria:', error);
      throw error;
    }
  }

  async criarCategoria(categoria: CriarCategoriaProdutoRequest): Promise<CategoriaProduto> {
    try {
      // Tenta criar no backend primeiro
      const response = await fetch(`${BASE_URL}/categorias-produtos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoria),
      });
      
      if (response.ok) {
        const data: ApiResponse<CategoriaProduto> = await response.json();
        
        if (data.success && data.data) {
          return data.data;
        }
      }
      
      // Fallback para localStorage
      const categorias = this.obterCategoriasDoStorage();
      const novaCategoria: CategoriaProduto = {
        id: Date.now().toString(),
        nome: categoria.nome,
        descricao: categoria.descricao || '',
        icone: categoria.icone || '📁',
        cor: categoria.cor || 'blue',
        ativo: categoria.ativo !== false,
        subcategorias: [],
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
      };
      
      categorias.push(novaCategoria);
      this.salvarCategoriasNoStorage(categorias);
      
      return novaCategoria;
    } catch (error) {
      console.error('Erro ao criar categoria, usando localStorage:', error);
      
      // Em caso de erro de rede, sempre usa localStorage
      const categorias = this.obterCategoriasDoStorage();
      const novaCategoria: CategoriaProduto = {
        id: Date.now().toString(),
        nome: categoria.nome,
        descricao: categoria.descricao || '',
        icone: categoria.icone || '📁',
        cor: categoria.cor || 'blue',
        ativo: categoria.ativo !== false,
        subcategorias: [],
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
      };
      
      categorias.push(novaCategoria);
      this.salvarCategoriasNoStorage(categorias);
      
      return novaCategoria;
    }
  }

  async atualizarCategoria(categoria: AtualizarCategoriaProdutoRequest): Promise<CategoriaProduto> {
    try {
      const response = await fetch(`${BASE_URL}/categorias-produtos/${categoria.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoria),
      });
      
      const data: ApiResponse<CategoriaProduto> = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erro ao atualizar categoria');
      }
      
      return data.data!;
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      throw error;
    }
  }

  async excluirCategoria(id: string): Promise<void> {
    try {
      const response = await fetch(`${BASE_URL}/categorias-produtos/${id}`, {
        method: 'DELETE',
      });
      
      const data: ApiResponse<void> = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erro ao excluir categoria');
      }
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      throw error;
    }
  }

  // SUBCATEGORIAS
  async listarSubcategorias(filtros?: FiltrosSubcategorias): Promise<SubcategoriaProduto[]> {
    try {
      const params = new URLSearchParams();
      if (filtros?.ativo !== undefined) params.append('ativo', filtros.ativo.toString());
      if (filtros?.busca) params.append('busca', filtros.busca);
      if (filtros?.categoria_id) params.append('categoria_id', filtros.categoria_id);
      if (filtros?.ordenacao) params.append('ordenacao', filtros.ordenacao);
      if (filtros?.direcao) params.append('direcao', filtros.direcao);

      const response = await fetch(`${BASE_URL}/subcategorias-produtos?${params}`);
      const data: ApiResponse<SubcategoriaProduto[]> = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erro ao buscar subcategorias');
      }
      
      return data.data || [];
    } catch (error) {
      console.error('Erro ao listar subcategorias:', error);
      throw error;
    }
  }

  async criarSubcategoria(subcategoria: CriarSubcategoriaProdutoRequest): Promise<SubcategoriaProduto> {
    try {
      const response = await fetch(`${BASE_URL}/subcategorias-produtos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subcategoria),
      });
      
      const data: ApiResponse<SubcategoriaProduto> = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erro ao criar subcategoria');
      }
      
      return data.data!;
    } catch (error) {
      console.error('Erro ao criar subcategoria:', error);
      throw error;
    }
  }

  async atualizarSubcategoria(subcategoria: AtualizarSubcategoriaProdutoRequest): Promise<SubcategoriaProduto> {
    try {
      const response = await fetch(`${BASE_URL}/subcategorias-produtos/${subcategoria.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subcategoria),
      });
      
      const data: ApiResponse<SubcategoriaProduto> = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erro ao atualizar subcategoria');
      }
      
      return data.data!;
    } catch (error) {
      console.error('Erro ao atualizar subcategoria:', error);
      throw error;
    }
  }

  async excluirSubcategoria(id: string): Promise<void> {
    try {
      const response = await fetch(`${BASE_URL}/subcategorias-produtos/${id}`, {
        method: 'DELETE',
      });
      
      const data: ApiResponse<void> = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erro ao excluir subcategoria');
      }
    } catch (error) {
      console.error('Erro ao excluir subcategoria:', error);
      throw error;
    }
  }

  // CONFIGURAÇÕES
  async listarConfiguracoes(filtros?: FiltrosConfiguracoes): Promise<ConfiguracaoProduto[]> {
    try {
      const params = new URLSearchParams();
      if (filtros?.ativo !== undefined) params.append('ativo', filtros.ativo.toString());
      if (filtros?.busca) params.append('busca', filtros.busca);
      if (filtros?.subcategoria_id) params.append('subcategoria_id', filtros.subcategoria_id);
      if (filtros?.ordenacao) params.append('ordenacao', filtros.ordenacao);
      if (filtros?.direcao) params.append('direcao', filtros.direcao);

      const response = await fetch(`${BASE_URL}/configuracoes-produtos?${params}`);
      const data: ApiResponse<ConfiguracaoProduto[]> = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erro ao buscar configurações');
      }
      
      return data.data || [];
    } catch (error) {
      console.error('Erro ao listar configurações:', error);
      throw error;
    }
  }

  async criarConfiguracao(configuracao: CriarConfiguracaoProdutoRequest): Promise<ConfiguracaoProduto> {
    try {
      const response = await fetch(`${BASE_URL}/configuracoes-produtos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configuracao),
      });
      
      const data: ApiResponse<ConfiguracaoProduto> = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erro ao criar configuração');
      }
      
      return data.data!;
    } catch (error) {
      console.error('Erro ao criar configuração:', error);
      throw error;
    }
  }

  async atualizarConfiguracao(configuracao: AtualizarConfiguracaoProdutoRequest): Promise<ConfiguracaoProduto> {
    try {
      const response = await fetch(`${BASE_URL}/configuracoes-produtos/${configuracao.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configuracao),
      });
      
      const data: ApiResponse<ConfiguracaoProduto> = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erro ao atualizar configuração');
      }
      
      return data.data!;
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      throw error;
    }
  }

  async excluirConfiguracao(id: string): Promise<void> {
    try {
      const response = await fetch(`${BASE_URL}/configuracoes-produtos/${id}`, {
        method: 'DELETE',
      });
      
      const data: ApiResponse<void> = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erro ao excluir configuração');
      }
    } catch (error) {
      console.error('Erro ao excluir configuração:', error);
      throw error;
    }
  }

  // ESTATÍSTICAS
  async obterEstatisticas(): Promise<EstatisticasCategorias> {
    try {
      const response = await fetch(`${BASE_URL}/categorias-produtos/estatisticas`);
      const data: ApiResponse<EstatisticasCategorias> = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erro ao buscar estatísticas');
      }
      
      return data.data!;
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw error;
    }
  }

  // MÉTODO PARA REORDENAR CATEGORIAS
  async reordenarCategorias(categorias: Array<{ id: string; ordem: number }>): Promise<void> {
    try {
      const response = await fetch(`${BASE_URL}/categorias-produtos/reordenar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ categorias }),
      });
      
      const data: ApiResponse<void> = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erro ao reordenar categorias');
      }
    } catch (error) {
      console.error('Erro ao reordenar categorias:', error);
      throw error;
    }
  }

  // MÉTODO PARA DUPLICAR CATEGORIA (COM SUAS SUBCATEGORIAS E CONFIGURAÇÕES)
  async duplicarCategoria(id: string, novoNome: string): Promise<CategoriaProduto> {
    try {
      const response = await fetch(`${BASE_URL}/categorias-produtos/${id}/duplicar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ novoNome }),
      });
      
      const data: ApiResponse<CategoriaProduto> = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erro ao duplicar categoria');
      }
      
      return data.data!;
    } catch (error) {
      console.error('Erro ao duplicar categoria:', error);
      throw error;
    }
  }

  // MÉTODO PARA IMPORTAR/EXPORTAR CONFIGURAÇÕES
  async exportarCategorias(): Promise<Blob> {
    try {
      const response = await fetch(`${BASE_URL}/categorias-produtos/exportar`);
      
      if (!response.ok) {
        throw new Error('Erro ao exportar categorias');
      }
      
      return response.blob();
    } catch (error) {
      console.error('Erro ao exportar categorias:', error);
      throw error;
    }
  }

  async importarCategorias(arquivo: File): Promise<{ importadas: number; erros: string[] }> {
    try {
      const formData = new FormData();
      formData.append('arquivo', arquivo);

      const response = await fetch(`${BASE_URL}/categorias-produtos/importar`, {
        method: 'POST',
        body: formData,
      });
      
      const data: ApiResponse<{ importadas: number; erros: string[] }> = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erro ao importar categorias');
      }
      
      return data.data!;
    } catch (error) {
      console.error('Erro ao importar categorias:', error);
      throw error;
    }
  }
}

export const categoriasProdutosService = new CategoriasProdutosService();
