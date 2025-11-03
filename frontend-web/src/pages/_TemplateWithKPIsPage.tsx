/**
 * TEMPLATE DE PÁGINA - CONECT CRM
 * 
 * Este é um template base para criar novas páginas seguindo o padrão visual do sistema.
 * 
 * INSTRUÇÕES DE USO:
 * 1. Copie este arquivo para src/pages/SuaPaginaPage.tsx
 * 2. Substitua todos os comentários [PERSONALIZAR] com seus valores
 * 3. Ajuste os imports conforme necessário
 * 4. Remova os comentários de instrução
 * 5. Registre a rota em App.tsx
 * 6. Adicione no menu em menuConfig.ts
 * 
 * CORES POR MÓDULO:
 * - Comercial: #159A9C (teal)
 * - Atendimento: #9333EA (purple)
 * - Financeiro: #16A34A (green)
 * - Gestão: #2563EB (blue)
 */

import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle,
  AlertCircle,
  X,
  // [PERSONALIZAR] Adicione outros ícones do Lucide React conforme necessário
  Users, // Exemplo de ícone principal
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

  // [PERSONALIZAR] Calcular métricas para dashboard cards
  const totalItems = items.length;
  const itensAtivos = items.filter((item) => item.ativo).length;
  const itensInativos = items.filter((item) => !item.ativo).length;

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
                    {/* [PERSONALIZAR] Ícone e cor do módulo */}
                    <Users className="h-8 w-8 mr-3 text-[#9333EA]" />
                    Título da Página {/* [PERSONALIZAR] */}
                    {loading && (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#9333EA] ml-3"></div>
                    )}
                  </h1>
                  <p className="mt-2 text-[#B4BEC9]">
                    {loading ? 'Carregando...' : `Gerencie seus ${totalItems} itens`}
                  </p>
                </div>
                <div className="mt-4 sm:mt-0 flex items-center gap-3">
                  <button
                    onClick={carregarDados}
                    disabled={loading}
                    className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleOpenDialog()}
                    className="bg-[#9333EA] hover:bg-[#7E22CE] text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                  >
                    {/* [PERSONALIZAR] Cor do botão (#9333EA = purple) */}
                    <Plus className="w-5 h-5" />
                    Novo Item {/* [PERSONALIZAR] */}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Card 1 - Total */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Total de Items {/* [PERSONALIZAR] */}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{totalItems}</p>
                  <p className="text-xs text-gray-400 mt-1">📊 Visão geral</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
                  <Users className="w-8 h-8 text-blue-600" /> {/* [PERSONALIZAR] */}
                </div>
              </div>
            </div>

            {/* Card 2 - Ativos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Ativos {/* [PERSONALIZAR] */}
                  </p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{itensAtivos}</p>
                  <p className="text-xs text-green-500 mt-1">✅ Operacionais</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-100 to-green-200 rounded-xl">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </div>

            {/* Card 3 - Inativos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Inativos {/* [PERSONALIZAR] */}
                  </p>
                  <p className="text-3xl font-bold text-gray-600 mt-2">{itensInativos}</p>
                  <p className="text-xs text-gray-500 mt-1">⏸️ Pausados</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl">
                  <AlertCircle className="w-8 h-8 text-gray-600" />
                </div>
              </div>
            </div>

            {/* Card 4 - Personalizado */}
            {/* [PERSONALIZAR] Adicione sua própria métrica */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Sua Métrica
                  </p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">0</p>
                  <p className="text-xs text-purple-500 mt-1">🎯 Descrição</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Barra de Busca/Filtros */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar Items {/* [PERSONALIZAR] */}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou descrição..." // [PERSONALIZAR]
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9333EA] focus:border-transparent transition-colors"
                  />
                </div>
              </div>

              {/* [PERSONALIZAR] Adicione filtros adicionais se necessário */}
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Estado Vazio */}
          {!loading && itemsFiltrados.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="text-center py-12 px-6">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" /> {/* [PERSONALIZAR] */}
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {busca ? 'Nenhum item encontrado' : 'Nenhum item cadastrado'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {busca
                    ? 'Tente ajustar os filtros de busca'
                    : 'Crie seu primeiro item para começar'}
                </p>
                {!busca && (
                  <button
                    onClick={() => handleOpenDialog()}
                    className="bg-[#9333EA] hover:bg-[#7E22CE] text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-sm mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    Criar Primeiro Item {/* [PERSONALIZAR] */}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Grid de Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {itemsFiltrados.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-sm border hover:shadow-lg transition-shadow duration-300"
              >
                <div className="p-6">
                  {/* Header do Card */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md flex-shrink-0"
                        style={{ backgroundColor: '#9333EA' }} // [PERSONALIZAR]
                      >
                        <Users className="h-6 w-6" /> {/* [PERSONALIZAR] */}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {item.nome}
                        </h3>
                        <p className="text-sm">
                          {item.ativo ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Inativo
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex gap-1 flex-shrink-0 ml-2">
                      <button
                        onClick={() => handleOpenDialog(item)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </div>

                  {/* Conteúdo */}
                  {item.descricao && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {item.descricao}
                    </p>
                  )}

                  {/* Footer do Card */}
                  {/* [PERSONALIZAR] Adicione informações adicionais ou ações */}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de Criação/Edição */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingItem ? 'Editar Item' : 'Novo Item'} {/* [PERSONALIZAR] */}
              </h2>
              <button
                onClick={() => {
                  setShowDialog(false);
                  setEditingItem(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Campo Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9333EA] focus:border-transparent transition-colors"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  placeholder="Digite o nome" // [PERSONALIZAR]
                />
              </div>

              {/* Campo Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9333EA] focus:border-transparent transition-colors"
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                  placeholder="Descrição opcional" // [PERSONALIZAR]
                  rows={3}
                />
              </div>

              {/* Campo Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9333EA] focus:border-transparent transition-colors"
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

            {/* Botões de Ação */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDialog(false);
                  setEditingItem(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.nome.trim()}
                className="flex-1 px-4 py-2 bg-[#9333EA] text-white rounded-lg hover:bg-[#7E22CE] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
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
