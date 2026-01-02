/**
 * GESTÃO DE TIPOS DE SERVIÇO
 * Permite gerenciar os tipos de serviço dos tickets
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
  Tag,
  TrendingUp,
  Wrench,
  DollarSign,
  MessageSquare,
  AlertTriangle,
  FileQuestion,
  Folder,
} from 'lucide-react';
import { BackToNucleus } from '../components/navigation/BackToNucleus';
import { tiposService, type TipoServico } from '../services/tiposService';

interface CreateTipoDto {
  nome: string;
  descricao: string;
  cor: string;
  icone: string;
  ordem: number;
  ativo: boolean;
}

// Ícones disponíveis para seleção
const iconesDisponiveis = [
  { nome: 'Wrench', componente: Wrench, label: '🔧 Técnica' },
  { nome: 'DollarSign', componente: DollarSign, label: '💵 Comercial/Financeira' },
  { nome: 'MessageSquare', componente: MessageSquare, label: '💬 Suporte' },
  { nome: 'AlertTriangle', componente: AlertTriangle, label: '⚠️ Reclamação' },
  { nome: 'FileQuestion', componente: FileQuestion, label: '❓ Solicitação' },
  { nome: 'Folder', componente: Folder, label: '📁 Outros' },
  { nome: 'Tag', componente: Tag, label: '🏷️ Genérico' },
];

const GestaoTiposServicoPage: React.FC = () => {
  // Estados principais
  const [tipos, setTipos] = useState<TipoServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState('');

  // Estados de UI
  const [showDialog, setShowDialog] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TipoServico | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateTipoDto>({
    nome: '',
    descricao: '',
    cor: '#159A9C',
    icone: 'Tag',
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
      const dados = await tiposService.listarTodos();
      setTipos(Array.isArray(dados) ? dados : []);
    } catch (err: unknown) {
      console.error('Erro ao carregar tipos:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao carregar tipos de serviço');
      setTipos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (tipo?: TipoServico) => {
    if (tipo) {
      setEditingTipo(tipo);
      setFormData({
        nome: tipo.nome ?? '',
        descricao: tipo.descricao ?? '',
        cor: tipo.cor ?? '#159A9C',
        icone: tipo.icone ?? 'Tag',
        ordem: tipo.ordem ?? 1,
        ativo: tipo.ativo ?? true,
      });
    } else {
      setEditingTipo(null);
      // Auto-sugerir próxima ordem
      const ultimoTipo = tipos.length > 0
        ? tipos.reduce((max, t) => t.ordem > max.ordem ? t : max)
        : null;
      const proximaOrdem = ultimoTipo ? ultimoTipo.ordem + 1 : 1;

      setFormData({
        nome: '',
        descricao: '',
        cor: '#159A9C',
        icone: 'Tag',
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
      if (!formData.nome.trim()) {
        setError('Nome é obrigatório');
        return;
      }

      if (editingTipo) {
        await tiposService.atualizar(editingTipo.id, formData);
      } else {
        await tiposService.criar(formData);
      }

      setShowDialog(false);
      setEditingTipo(null);
      carregarDados();
    } catch (err: unknown) {
      console.error('Erro ao salvar tipo:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao salvar tipo de serviço');
    }
  };

  const handleDelete = async (id: string, nome: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o tipo "${nome}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      setError(null);
      await tiposService.deletar(id);
      carregarDados();
    } catch (err: unknown) {
      console.error('Erro ao deletar tipo:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao deletar tipo. Verifique se não há tickets vinculados.');
    }
  };

  // Filtrar tipos
  const tiposFiltrados = tipos.filter(
    (tipo) =>
      tipo.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      tipo.descricao?.toLowerCase().includes(busca.toLowerCase()),
  );

  // Ordenar por ordem
  const tiposOrdenados = [...tiposFiltrados].sort((a, b) => a.ordem - b.ordem);

  // Calcular métricas
  const totalTipos = tipos.length;
  const tiposAtivos = tipos.filter((t) => t.ativo).length;
  const tiposInativos = tipos.filter((t) => !t.ativo).length;

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

  // Helper para renderizar ícone
  const renderIcone = (iconeNome: string) => {
    const icone = iconesDisponiveis.find((i) => i.nome === iconeNome);
    if (!icone) return <Tag className="h-5 w-5" />;
    const IconeComponente = icone.componente;
    return <IconeComponente className="h-5 w-5" />;
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
                    <Tag className="h-8 w-8 mr-3 text-[#159A9C]" />
                    Gestão de Tipos de Serviço
                    {loading && (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#159A9C] ml-3"></div>
                    )}
                  </h1>
                  <p className="mt-2 text-[#B4BEC9]">
                    {loading ? 'Carregando...' : `Configure os ${totalTipos} tipos de atendimento`}
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
                    Novo Tipo
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
                    Total de Tipos
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">{totalTipos}</p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    Tipos de serviço configurados no sistema.
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                  <Tag className="h-6 w-6 text-[#159A9C]" />
                </div>
              </div>
            </div>

            {/* Card 2 - Ativos */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Tipos Ativos
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">{tiposAtivos}</p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    Tipos disponíveis para criação de tickets.
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
                    Tipos Inativos
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">{tiposInativos}</p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    Tipos desativados ou em manutenção.
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
                    {totalTipos > 0 ? Math.round((tiposAtivos / totalTipos) * 100) : 0}%
                  </p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    Percentual de tipos ativos no sistema.
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
                  Buscar Tipos
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
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Estado Vazio */}
          {!loading && tiposOrdenados.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="text-center py-12 px-6">
                <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {busca ? 'Nenhum tipo encontrado' : 'Nenhum tipo cadastrado'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {busca
                    ? 'Tente ajustar os filtros de busca'
                    : 'Crie o primeiro tipo de serviço para começar'}
                </p>
                {!busca && (
                  <button
                    onClick={() => handleOpenDialog()}
                    className="bg-[#159A9C] hover:bg-[#0F7B7D] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm mx-auto text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Criar Primeiro Tipo
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Grid de Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tiposOrdenados.map((tipo) => (
              <div
                key={tipo.id}
                className="bg-white rounded-lg shadow-sm border hover:shadow-lg transition-shadow duration-300"
              >
                <div className="p-6">
                  {/* Header do Card */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md flex-shrink-0"
                        style={{ backgroundColor: tipo.cor }}
                      >
                        {renderIcone(tipo.icone)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {tipo.nome}
                        </h3>
                        <p className="text-sm">
                          {tipo.ativo ? (
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
                        onClick={() => handleOpenDialog(tipo)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(tipo.id, tipo.nome)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </div>

                  {/* Conteúdo */}
                  {tipo.descricao && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{tipo.descricao}</p>
                  )}

                  {/* Footer do Card - Ordem */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-xs text-gray-500">Ordem de exibição</span>
                    <span className="text-sm font-semibold text-gray-900">#{tipo.ordem}</span>
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
                {editingTipo ? 'Editar Tipo' : 'Novo Tipo'}
              </h2>
              <button
                onClick={() => {
                  setShowDialog(false);
                  setEditingTipo(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Campo Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Suporte Técnico"
                />
              </div>

              {/* Campo Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descreva quando este tipo deve ser usado"
                  rows={3}
                />
              </div>

              {/* Campo Ícone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ícone *</label>
                <div className="grid grid-cols-2 gap-2">
                  {iconesDisponiveis.map((icone) => {
                    const IconeComponente = icone.componente;
                    return (
                      <button
                        key={icone.nome}
                        type="button"
                        onClick={() => setFormData({ ...formData, icone: icone.nome })}
                        className={`p-3 border-2 rounded-lg transition-all flex items-center gap-2 ${formData.icone === icone.nome
                            ? 'border-[#159A9C] bg-[#159A9C]/5'
                            : 'border-gray-300 hover:border-gray-400'
                          }`}
                      >
                        <IconeComponente className="h-5 w-5 flex-shrink-0" />
                        <span className="text-xs truncate">{icone.label}</span>
                      </button>
                    );
                  })}
                </div>
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
                  setEditingTipo(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.nome.trim()}
                className="flex-1 px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {editingTipo ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestaoTiposServicoPage;
