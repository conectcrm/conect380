/**
 * GESTÃO DE STATUS CUSTOMIZADOS
 * Permite gerenciar os status de tickets por nível de atendimento
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
  ListChecks,
  Flag,
  Filter,
} from 'lucide-react';
import { BackToNucleus } from '../components/navigation/BackToNucleus';
import { statusService, type StatusCustomizado } from '../services/statusService';
import { niveisService, type NivelAtendimento } from '../services/niveisService';
import { useGlobalConfirmation } from '../contexts/GlobalConfirmationContext';

interface CreateStatusDto {
  nivelAtendimentoId: string;
  nome: string;
  descricao: string;
  cor: string;
  ordem: number;
  finalizador: boolean;
  ativo: boolean;
}

const GestaoStatusCustomizadosPage: React.FC = () => {
  const { confirm } = useGlobalConfirmation();
  // Estados principais
  const [status, setStatus] = useState<StatusCustomizado[]>([]);
  const [niveis, setNiveis] = useState<NivelAtendimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [nivelFiltro, setNivelFiltro] = useState<string>('');

  // Estados de UI
  const [showDialog, setShowDialog] = useState(false);
  const [editingStatus, setEditingStatus] = useState<StatusCustomizado | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateStatusDto>({
    nivelAtendimentoId: '',
    nome: '',
    descricao: '',
    cor: '#159A9C',
    ordem: 1,
    finalizador: false,
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

      const [statusData, niveisData] = await Promise.all([
        statusService.listarTodos(),
        niveisService.listarAtivos(),
      ]);

      setStatus(Array.isArray(statusData) ? statusData : []);
      setNiveis(Array.isArray(niveisData) ? niveisData : []);
    } catch (err: unknown) {
      console.error('Erro ao carregar status:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao carregar status customizados');
      setStatus([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (statusItem?: StatusCustomizado) => {
    if (statusItem) {
      setEditingStatus(statusItem);
      setFormData({
        nivelAtendimentoId: statusItem.nivelAtendimentoId ?? '',
        nome: statusItem.nome ?? '',
        descricao: statusItem.descricao ?? '',
        cor: statusItem.cor ?? '#159A9C',
        ordem: statusItem.ordem ?? 1,
        finalizador: statusItem.finalizador ?? false,
        ativo: statusItem.ativo ?? true,
      });
    } else {
      setEditingStatus(null);
      setFormData({
        nivelAtendimentoId: nivelFiltro || (niveis.length > 0 ? niveis[0].id : ''),
        nome: '',
        descricao: '',
        cor: '#159A9C',
        ordem: 1,
        finalizador: false,
        ativo: true,
      });
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    try {
      setError(null);

      // Validação
      if (!formData.nivelAtendimentoId) {
        setError('Nível de atendimento é obrigatório');
        return;
      }
      if (!formData.nome.trim()) {
        setError('Nome é obrigatório');
        return;
      }

      if (editingStatus) {
        await statusService.atualizar(editingStatus.id, formData);
      } else {
        await statusService.criar(formData);
      }

      setShowDialog(false);
      setEditingStatus(null);
      carregarDados();
    } catch (err: unknown) {
      console.error('Erro ao salvar status:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao salvar status customizado');
    }
  };

  const handleDelete = async (id: string, nome: string) => {
    if (
      !(await confirm(
        `Tem certeza que deseja excluir o status "${nome}"? Esta ação não pode ser desfeita.`,
      ))
    ) {
      return;
    }

    try {
      setError(null);
      await statusService.deletar(id);
      carregarDados();
    } catch (err: unknown) {
      console.error('Erro ao deletar status:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao deletar status. Verifique se não há tickets vinculados.');
    }
  };

  // Filtrar status
  const statusFiltrados = status.filter((item) => {
    const matchBusca =
      item.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      item.descricao?.toLowerCase().includes(busca.toLowerCase());
    const matchNivel = !nivelFiltro || item.nivelAtendimentoId === nivelFiltro;
    return matchBusca && matchNivel;
  });

  // Ordenar por ordem
  const statusOrdenados = [...statusFiltrados].sort((a, b) => a.ordem - b.ordem);

  // Calcular métricas
  const totalStatus = status.length;
  const statusAtivos = status.filter((s) => s.ativo).length;
  const statusInativos = status.filter((s) => !s.ativo).length;
  const statusFinalizadores = status.filter((s) => s.finalizador).length;

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

  // Helper para obter nome do nível
  const getNivelNome = (nivelId: string): string => {
    const nivel = niveis.find((n) => n.id === nivelId);
    return nivel ? nivel.codigo : 'N/A';
  };

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
                    <ListChecks className="h-8 w-8 mr-3 text-[#159A9C]" />
                    Gestão de Status Customizados
                    {loading && (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#159A9C] ml-3"></div>
                    )}
                  </h1>
                  <p className="mt-2 text-[#B4BEC9]">
                    {loading ? 'Carregando...' : `Configure os ${totalStatus} status por nível`}
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
                    Novo Status
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
                    Total de Status
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">{totalStatus}</p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    Status configurados em todos os níveis.
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                  <ListChecks className="h-6 w-6 text-[#159A9C]" />
                </div>
              </div>
            </div>

            {/* Card 2 - Ativos */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Status Ativos
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">{statusAtivos}</p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    Status disponíveis para uso em tickets.
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
                    Status Inativos
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">{statusInativos}</p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    Status desativados ou em manutenção.
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-gray-500/10 flex items-center justify-center shadow-sm">
                  <AlertCircle className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </div>

            {/* Card 4 - Finalizadores */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Finalizadores
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">{statusFinalizadores}</p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    Status que encerram tickets automaticamente.
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                  <Flag className="h-6 w-6 text-[#159A9C]" />
                </div>
              </div>
            </div>
          </div>

          {/* Barra de Busca e Filtros */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar Status
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou descrição..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filtrar por Nível
                </label>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                    value={nivelFiltro}
                    onChange={(e) => setNivelFiltro(e.target.value)}
                  >
                    <option value="">Todos os níveis</option>
                    {niveis.map((nivel) => (
                      <option key={nivel.id} value={nivel.id}>
                        {nivel.codigo} - {nivel.nome}
                      </option>
                    ))}
                  </select>
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
          {!loading && statusOrdenados.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="text-center py-12 px-6">
                <ListChecks className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {busca || nivelFiltro ? 'Nenhum status encontrado' : 'Nenhum status cadastrado'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {busca || nivelFiltro
                    ? 'Tente ajustar os filtros de busca'
                    : 'Crie o primeiro status customizado para começar'}
                </p>
                {!busca && !nivelFiltro && (
                  <button
                    onClick={() => handleOpenDialog()}
                    className="bg-[#159A9C] hover:bg-[#0F7B7D] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm mx-auto text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Criar Primeiro Status
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Grid de Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statusOrdenados.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-sm border hover:shadow-lg transition-shadow duration-300"
              >
                <div className="p-6">
                  {/* Header do Card */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.cor }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {item.nome}
                        </h3>
                        <div className="flex gap-2 items-center mt-1">
                          <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded">
                            {getNivelNome(item.nivelAtendimentoId)}
                          </span>
                          {item.finalizador && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <Flag className="h-3 w-3 mr-1" />
                              Finalizador
                            </span>
                          )}
                        </div>
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
                        onClick={() => handleDelete(item.id, item.nome)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </div>

                  {/* Conteúdo */}
                  {item.descricao && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{item.descricao}</p>
                  )}

                  {/* Footer do Card */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      {item.ativo ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Inativo
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">Ordem #{item.ordem}</span>
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
                {editingStatus ? 'Editar Status' : 'Novo Status'}
              </h2>
              <button
                onClick={() => {
                  setShowDialog(false);
                  setEditingStatus(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Campo Nível */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nível de Atendimento *
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                  value={formData.nivelAtendimentoId}
                  onChange={(e) => setFormData({ ...formData, nivelAtendimentoId: e.target.value })}
                >
                  <option value="">Selecione um nível</option>
                  {niveis.map((nivel) => (
                    <option key={nivel.id} value={nivel.id}>
                      {nivel.codigo} - {nivel.nome}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  O status pertencerá a este nível de escalação
                </p>
              </div>

              {/* Campo Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Em Atendimento"
                />
              </div>

              {/* Campo Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descreva quando este status deve ser usado"
                  rows={3}
                />
              </div>

              {/* Campo Cor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cor *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Ordem *</label>
                <input
                  type="number"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                  value={formData.ordem}
                  onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 1 })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Define a ordem de exibição no dropdown
                </p>
              </div>

              {/* Campo Finalizador */}
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <input
                  type="checkbox"
                  id="finalizador"
                  checked={formData.finalizador}
                  onChange={(e) => setFormData({ ...formData, finalizador: e.target.checked })}
                  className="h-4 w-4 text-[#159A9C] focus:ring-[#159A9C] border-gray-300 rounded"
                />
                <label htmlFor="finalizador" className="text-sm text-gray-700 cursor-pointer flex-1">
                  <span className="font-medium">Status Finalizador</span>
                  <p className="text-xs text-gray-600 mt-1">
                    Marca o ticket como concluído automaticamente
                  </p>
                </label>
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
                  setEditingStatus(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.nivelAtendimentoId || !formData.nome.trim()}
                className="flex-1 px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {editingStatus ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestaoStatusCustomizadosPage;
