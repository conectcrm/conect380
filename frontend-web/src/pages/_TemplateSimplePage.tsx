/**
 * TEMPLATE SIMPLES DE PÁGINA - CONECT CRM
 * 
 * Use este template para páginas CRUD SIMPLES, sem necessidade de métricas/KPIs.
 * Ideal para: Cadastros básicos, listagens simples, páginas de configuração.
 * 
 * INSTRUÇÕES DE USO:
 * 1. Copie este arquivo para src/pages/SuaPaginaPage.tsx
 * 2. Substitua todos os comentários [PERSONALIZAR] com seus valores
 * 3. Ajuste os imports conforme necessário
 * 4. Remova os comentários de instrução
 * 5. Registre a rota em App.tsx
 * 6. Adicione no menu em menuConfig.ts
 * 
 * CORES POR MÓDULO (use na cor do ícone principal e botão primary):
 * - Comercial: #159A9C (teal) - Crevasse-2 ⭐
 * - Atendimento: #9333EA (purple)
 * - Financeiro: #16A34A (green)
 * - Gestão: #2563EB (blue)
 * 
 * QUANDO USAR ESTE TEMPLATE:
 * ✅ Cadastros simples (ex: categorias, tags, status)
 * ✅ Páginas de configuração
 * ✅ Listagens sem métricas
 * ✅ Formulários de edição
 * ✅ Páginas auxiliares
 * 
 * QUANDO NÃO USAR (use _TemplatePage.tsx):
 * ❌ Dashboards com métricas
 * ❌ Páginas principais de módulos
 * ❌ Telas que mostram estatísticas
 * ❌ Páginas de overview/resumo
 */

import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  // [PERSONALIZAR] Adicione outros ícones do Lucide React conforme necessário
  Package, // Exemplo de ícone principal
} from 'lucide-react';
import { BackToNucleus } from '../components/navigation/BackToNucleus';
// [PERSONALIZAR] import seuService from '../services/seuService';

// [PERSONALIZAR] Defina suas interfaces
interface Item {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  // ... outros campos
}

interface CreateItemDto {
  nome: string;
  descricao?: string;
  ativo?: boolean;
  // ... outros campos
}

const SuaPaginaPage: React.FC = () => {
  // Estados principais
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState('');

  // Estados de UI
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateItemDto>({
    nome: '',
    descricao: '',
    ativo: true,
  });

  // [PERSONALIZAR] Carregar dados ao montar componente
  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);
      // [PERSONALIZAR] const dados = await seuService.listar();
      const dados: Item[] = []; // Mock - remover
      setItems(Array.isArray(dados) ? dados : []);
    } catch (err: unknown) {
      console.error('Erro ao carregar dados:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao carregar dados');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item?: Item) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        nome: item.nome ?? '',
        descricao: item.descricao ?? '',
        ativo: item.ativo ?? true,
      });
    } else {
      setEditingItem(null);
      setFormData({
        nome: '',
        descricao: '',
        ativo: true,
      });
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    try {
      setError(null);
      if (editingItem) {
        // [PERSONALIZAR] await seuService.atualizar(editingItem.id, formData);
      } else {
        // [PERSONALIZAR] await seuService.criar(formData);
      }
      setShowDialog(false);
      setEditingItem(null);
      carregarDados();
    } catch (err: unknown) {
      console.error('Erro ao salvar:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao salvar');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este item?')) {
      return;
    }

    try {
      setError(null);
      // [PERSONALIZAR] await seuService.deletar(id);
      carregarDados();
    } catch (err: unknown) {
      console.error('Erro ao deletar:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao deletar');
    }
  };

  // Filtrar items
  const itemsFiltrados = items.filter((item) =>
    item.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    item.descricao?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com Breadcrumb */}
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus
          nucleusName="Nome do Núcleo" // [PERSONALIZAR]
          nucleusPath="/nuclei/nome-nucleo" // [PERSONALIZAR]
        />
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header da Página */}
          <div className="bg-white rounded-lg shadow-sm border mb-6">
            <div className="px-6 py-6">
              <div className="flex flex-col sm:flex-row justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-[#002333] flex items-center">
                    {/* [PERSONALIZAR] Ícone (Package) e cor do módulo (#159A9C = Comercial) */}
                    <Package className="h-8 w-8 mr-3 text-[#159A9C]" />
                    Título da Página {/* [PERSONALIZAR] */}
                    {loading && (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#159A9C] ml-3"></div>
                    )}
                  </h1>
                  <p className="mt-2 text-[#B4BEC9]">
                    {/* [PERSONALIZAR] Descrição curta */}
                    {loading ? 'Carregando...' : `${items.length} ${items.length === 1 ? 'item' : 'itens'} cadastrado${items.length === 1 ? '' : 's'}`}
                  </p>
                </div>
                <div className="mt-4 sm:mt-0 flex items-center gap-3">
                  <button
                    onClick={carregarDados}
                    disabled={loading}
                    className="px-4 py-3 border border-[#B4BEC9] rounded-lg hover:bg-[#DEEFE7] transition-colors disabled:opacity-50"
                    title="Atualizar"
                  >
                    <RefreshCw className={`w-5 h-5 text-[#002333] ${loading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleOpenDialog()}
                    className="bg-[#159A9C] hover:bg-[#0F7B7D] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm text-sm font-medium"
                  >
                    {/* [PERSONALIZAR] Cor do botão (Crevasse-2 para Comercial) */}
                    <Plus className="w-4 h-4" />
                    Novo Item {/* [PERSONALIZAR] */}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Barra de Busca/Filtros */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-[#002333] mb-2">
                  Buscar Items {/* [PERSONALIZAR] */}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B4BEC9] w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou descrição..." // [PERSONALIZAR]
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                  />
                </div>
              </div>

              {/* [PERSONALIZAR] Adicione filtros adicionais se necessário */}
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-lg mb-6">
              <div className="flex items-start">
                <X className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-800 mb-1">Erro</h3>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="ml-3 text-red-600 hover:text-red-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Estado Vazio */}
          {!loading && itemsFiltrados.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="text-center py-20 px-6">
                <div className="flex justify-center mb-6">
                  <div className="h-20 w-20 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                    <Package className="w-12 h-12 text-[#159A9C]" /> {/* [PERSONALIZAR] */}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-[#002333] mb-3">
                  {busca ? 'Nenhum item encontrado' : 'Nenhum item cadastrado'}
                </h3>
                <p className="text-[#B4BEC9] mb-8 max-w-md mx-auto">
                  {busca
                    ? 'Tente ajustar os filtros de busca ou remover alguns termos'
                    : 'Comece criando seu primeiro item para organizar suas informações'} {/* [PERSONALIZAR] */}
                </p>
                {!busca && (
                  <button
                    onClick={() => handleOpenDialog()}
                    className="bg-[#159A9C] hover:bg-[#0F7B7D] text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 text-sm font-medium shadow-lg transition-colors"
                  >
                    <Plus className="w-6 h-6" />
                    Criar Primeiro Item {/* [PERSONALIZAR] */}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Grid de Cards */}
          {!loading && itemsFiltrados.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {itemsFiltrados.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg border border-[#B4BEC9] p-5 hover:shadow-lg hover:border-[#159A9C] transition-all duration-300"
                >
                  {/* Header do Card */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-[#002333] hover:text-[#159A9C] transition-colors mb-1">
                        {item.nome}
                      </h3>
                      {item.descricao && (
                        <p className="text-sm text-[#B4BEC9] line-clamp-2 mt-1">
                          {item.descricao}
                        </p>
                      )}
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.ativo
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                      }`}>
                      {item.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  {/* Footer do Card com Ações */}
                  <div className="flex items-center justify-between pt-3 border-t border-[#DEEFE7]">
                    <div className="text-xs text-[#B4BEC9]">
                      {/* [PERSONALIZAR] Adicione info adicional (data criação, etc) */}
                      ID: {item.id.substring(0, 8)}...
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenDialog(item)}
                        className="p-1 hover:bg-[#DEEFE7] rounded transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4 text-[#159A9C]" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 hover:bg-red-50 rounded transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Criação/Edição */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header do Modal */}
            <div className="flex justify-between items-center p-6 border-b border-[#DEEFE7]">
              <h2 className="text-2xl font-bold text-[#002333] flex items-center">
                <Plus className="w-6 h-6 mr-3 text-[#159A9C]" />
                {editingItem ? 'Editar Item' : 'Novo Item'} {/* [PERSONALIZAR] */}
              </h2>
              <button
                onClick={() => {
                  setShowDialog(false);
                  setEditingItem(null);
                }}
                className="p-2 hover:bg-[#DEEFE7] rounded-lg transition-colors"
              >
                <X className="h-5 h-5 text-[#B4BEC9]" />
              </button>
            </div>

            {/* Body do Modal */}
            <div className="p-6 space-y-4">
              {/* Campo Nome */}
              <div>
                <label className="block text-sm font-medium text-[#002333] mb-2">
                  Nome * {/* [PERSONALIZAR] */}
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  placeholder="Digite o nome" // [PERSONALIZAR]
                />
              </div>

              {/* Campo Descrição */}
              <div>
                <label className="block text-sm font-medium text-[#002333] mb-2">
                  Descrição
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors resize-none"
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                  placeholder="Descrição opcional" // [PERSONALIZAR]
                  rows={4}
                />
              </div>

              {/* Campo Status */}
              <div>
                <label className="block text-sm font-medium text-[#002333] mb-2">
                  Status
                </label>
                <select
                  className="w-full px-4 py-3 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors bg-white"
                  value={formData.ativo ? 'true' : 'false'}
                  onChange={(e) =>
                    setFormData({ ...formData, ativo: e.target.value === 'true' })
                  }
                >
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </div>

              {/* [PERSONALIZAR] Adicione outros campos conforme necessário */}
            </div>

            {/* Footer do Modal */}
            <div className="flex justify-end gap-3 p-6 border-t border-[#DEEFE7]">
              <button
                onClick={() => {
                  setShowDialog(false);
                  setEditingItem(null);
                }}
                className="px-4 py-2 border-2 border-[#B4BEC9] text-[#002333] rounded-lg hover:bg-[#DEEFE7] transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.nome.trim()}
                className="bg-[#159A9C] hover:bg-[#0F7B7D] text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {editingItem ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuaPaginaPage;
