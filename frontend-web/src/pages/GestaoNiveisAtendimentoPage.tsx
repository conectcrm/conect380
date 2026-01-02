/**
 * GESTÃO DE NÍVEIS DE ATENDIMENTO
 * Permite gerenciar os níveis customizados de atendimento (N1, N2, N3, N4...)
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
  Layers,
  TrendingUp,
} from 'lucide-react';
import { BackToNucleus } from '../components/navigation/BackToNucleus';
import { niveisService, type NivelAtendimento } from '../services/niveisService';

interface CreateNivelDto {
  codigo: string;
  nome: string;
  descricao: string;
  cor: string;
  ordem: number;
  ativo: boolean;
}

const GestaoNiveisAtendimentoPage: React.FC = () => {
  // Estados principais
  const [niveis, setNiveis] = useState<NivelAtendimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState('');

  // Estados de UI
  const [showDialog, setShowDialog] = useState(false);
  const [editingNivel, setEditingNivel] = useState<NivelAtendimento | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateNivelDto>({
    codigo: '',
    nome: '',
    descricao: '',
    cor: '#159A9C',
    ordem: 1,
    ativo: true,
  });

  // Carregar dados ao montar componente
  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);
      const dados = await niveisService.listarTodos();
      setNiveis(Array.isArray(dados) ? dados : []);
    } catch (err: unknown) {
      console.error('Erro ao carregar níveis:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao carregar níveis de atendimento');
      setNiveis([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (nivel?: NivelAtendimento) => {
    if (nivel) {
      setEditingNivel(nivel);
      setFormData({
        codigo: nivel.codigo ?? '',
        nome: nivel.nome ?? '',
        descricao: nivel.descricao ?? '',
        cor: nivel.cor ?? '#159A9C',
        ordem: nivel.ordem ?? 1,
        ativo: nivel.ativo ?? true,
      });
    } else {
      setEditingNivel(null);
      // Auto-sugerir próximo código e ordem
      const ultimoNivel = niveis.length > 0
        ? niveis.reduce((max, n) => n.ordem > max.ordem ? n : max)
        : null;
      const proximaOrdem = ultimoNivel ? ultimoNivel.ordem + 1 : 1;
      const proximoCodigo = `N${proximaOrdem}`;

      setFormData({
        codigo: proximoCodigo,
        nome: `${proximoCodigo} - `,
        descricao: '',
        cor: '#159A9C',
        ordem: proximaOrdem,
        ativo: true,
      });
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    try {
      setError(null);

      // Validação
      if (!formData.codigo.trim()) {
        setError('Código é obrigatório');
        return;
      }
      if (!formData.nome.trim()) {
        setError('Nome é obrigatório');
        return;
      }

      if (editingNivel) {
        await niveisService.atualizar(editingNivel.id, formData);
      } else {
        await niveisService.criar(formData);
      }

      setShowDialog(false);
      setEditingNivel(null);
      carregarDados();
    } catch (err: unknown) {
      console.error('Erro ao salvar nível:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao salvar nível de atendimento');
    }
  };

  const handleDelete = async (id: string, codigo: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o nível "${codigo}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      setError(null);
      await niveisService.deletar(id);
      carregarDados();
    } catch (err: unknown) {
      console.error('Erro ao deletar nível:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao deletar nível. Verifique se não há tickets vinculados.');
    }
  };

  // Filtrar níveis
  const niveisFiltrados = niveis.filter(
    (nivel) =>
      nivel.codigo?.toLowerCase().includes(busca.toLowerCase()) ||
      nivel.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      nivel.descricao?.toLowerCase().includes(busca.toLowerCase()),
  );

  // Ordenar por campo ordem
  const niveisOrdenados = [...niveisFiltrados].sort((a, b) => a.ordem - b.ordem);

  // Calcular métricas
  const totalNiveis = niveis.length;
  const niveisAtivos = niveis.filter((n) => n.ativo).length;
  const niveisInativos = niveis.filter((n) => !n.ativo).length;

  // Cores padrão para seleção
  const coresPadrao = [
    { nome: 'Crevasse (Padrão)', valor: '#159A9C' },
    { nome: 'Verde', valor: '#16A34A' },
    { nome: 'Azul', valor: '#2563EB' },
    { nome: 'Roxo', valor: '#9333EA' },
    { nome: 'Laranja', valor: '#F59E0B' },
    { nome: 'Vermelho', valor: '#DC2626' },
    { nome: 'Rosa', valor: '#EC4899' },
    { nome: 'Cinza', valor: '#6B7280' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com Breadcrumb */}
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus
          nucleusName="Configurações"
          nucleusPath="/nuclei/configuracoes"
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
                    <Layers className="h-8 w-8 mr-3 text-[#159A9C]" />
                    Gestão de Níveis de Atendimento
                    {loading && (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#159A9C] ml-3"></div>
                    )}
                  </h1>
                  <p className="mt-2 text-[#B4BEC9]">
                    {loading ? 'Carregando...' : `Configure os ${totalNiveis} níveis de escalação`}
                  </p>
                </div>
                <div className="mt-4 sm:mt-0 flex items-center gap-3">
                  <button
                    onClick={carregarDados}
                    disabled={loading}
                    className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`}
                    />
                  </button>
                  <button
                    onClick={() => handleOpenDialog()}
                    className="bg-[#159A9C] hover:bg-[#0F7B7D] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Novo Nível
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Cards (KPI Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Card 1 - Total */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Total de Níveis
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">{totalNiveis}</p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    Níveis de escalação configurados no sistema.
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                  <Layers className="h-6 w-6 text-[#159A9C]" />
                </div>
              </div>
            </div>

            {/* Card 2 - Ativos */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Níveis Ativos
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">{niveisAtivos}</p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    Níveis disponíveis para criação de tickets.
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center shadow-sm">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Card 3 - Inativos */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Níveis Inativos
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">{niveisInativos}</p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    Níveis desativados ou em manutenção.
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-gray-500/10 flex items-center justify-center shadow-sm">
                  <AlertCircle className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </div>

            {/* Card 4 - Taxa de Utilização */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Taxa de Uso
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">
                    {totalNiveis > 0 ? Math.round((niveisAtivos / totalNiveis) * 100) : 0}%
                  </p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    Percentual de níveis ativos no sistema.
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                  <TrendingUp className="h-6 w-6 text-[#159A9C]" />
                </div>
              </div>
            </div>
          </div>

          {/* Barra de Busca */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar Níveis
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar por código, nome ou descrição..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Estado Vazio */}
          {!loading && niveisOrdenados.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="text-center py-12 px-6">
                <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {busca ? 'Nenhum nível encontrado' : 'Nenhum nível cadastrado'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {busca
                    ? 'Tente ajustar os filtros de busca'
                    : 'Crie o primeiro nível de atendimento para começar'}
                </p>
                {!busca && (
                  <button
                    onClick={() => handleOpenDialog()}
                    className="bg-[#159A9C] hover:bg-[#0F7B7D] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm mx-auto text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Criar Primeiro Nível
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Grid de Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {niveisOrdenados.map((nivel) => (
              <div
                key={nivel.id}
                className="bg-white rounded-lg shadow-sm border hover:shadow-lg transition-shadow duration-300"
              >
                <div className="p-6">
                  {/* Header do Card */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md flex-shrink-0 font-bold text-lg"
                        style={{ backgroundColor: nivel.cor }}
                      >
                        {nivel.codigo}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {nivel.nome}
                        </h3>
                        <p className="text-sm">
                          {nivel.ativo ? (
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
                        onClick={() => handleOpenDialog(nivel)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(nivel.id, nivel.codigo)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </div>

                  {/* Conteúdo */}
                  {nivel.descricao && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{nivel.descricao}</p>
                  )}

                  {/* Footer do Card - Ordem */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-xs text-gray-500">Ordem de escalação</span>
                    <span className="text-sm font-semibold text-gray-900">#{nivel.ordem}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de Criação/Edição */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingNivel ? 'Editar Nível' : 'Novo Nível'}
              </h2>
              <button
                onClick={() => {
                  setShowDialog(false);
                  setEditingNivel(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Campo Código */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código * <span className="text-xs text-gray-500">(ex: N1, N2, N3...)</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                  placeholder="N1"
                  maxLength={10}
                />
              </div>

              {/* Campo Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome * <span className="text-xs text-gray-500">(ex: N1 - Suporte Básico)</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="N1 - Suporte Básico"
                />
              </div>

              {/* Campo Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descreva o objetivo deste nível de atendimento"
                  rows={3}
                />
              </div>

              {/* Campo Cor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cor * <span className="text-xs text-gray-500">(selecione ou digite código hex)</span>
                </label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {coresPadrao.map((cor) => (
                    <button
                      key={cor.valor}
                      type="button"
                      onClick={() => setFormData({ ...formData, cor: cor.valor })}
                      className={`h-10 rounded-lg border-2 transition-all ${formData.cor === cor.valor
                          ? 'border-gray-900 scale-110'
                          : 'border-gray-300 hover:scale-105'
                        }`}
                      style={{ backgroundColor: cor.valor }}
                      title={cor.nome}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors font-mono text-sm"
                    value={formData.cor}
                    onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                    placeholder="#159A9C"
                    maxLength={7}
                  />
                  <div
                    className="w-10 h-10 rounded-lg border border-gray-300"
                    style={{ backgroundColor: formData.cor }}
                  />
                </div>
              </div>

              {/* Campo Ordem */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ordem de Escalação *
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                  value={formData.ordem}
                  onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 1 })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Define a sequência de escalação dos tickets
                </p>
              </div>

              {/* Campo Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                  value={formData.ativo ? 'true' : 'false'}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.value === 'true' })}
                >
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDialog(false);
                  setEditingNivel(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.codigo.trim() || !formData.nome.trim()}
                className="flex-1 px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {editingNivel ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestaoNiveisAtendimentoPage;
