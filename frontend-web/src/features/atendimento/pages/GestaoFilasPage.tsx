/**
 * GESTÃO DE FILAS - CONECT CRM
 * Sistema de distribuição de tickets com 3 estratégias
 * Núcleo: Atendimento
 */

import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  Users,
  UserPlus,
  UserMinus,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { BackToNucleus } from '../../../components/navigation/BackToNucleus';
import { useAuth } from '../../../hooks/useAuth';
import { useFilaStore } from '../../../stores/filaStore';
import {
  Fila,
  FilaAtendente,
  CreateFilaDto,
  EstrategiaDistribuicao,
} from '../../../services/filaService';

const GestaoFilasPage: React.FC = () => {
  const { user } = useAuth();
  // ⚠️ Obter empresaId do JWT token
  const empresaId = user?.empresa?.id || '';

  // Zustand Store
  const {
    filas,
    filaSelecionada,
    loading,
    error,
    metricas,
    listarFilas,
    criarFila,
    atualizarFila,
    removerFila,
    selecionarFila,
    adicionarAtendente,
    removerAtendente,
    obterMetricas,
    resetError,
  } = useFilaStore();

  // Estados de UI
  const [busca, setBusca] = useState('');
  const [showDialogFila, setShowDialogFila] = useState(false);
  const [showDialogAtendente, setShowDialogAtendente] = useState(false);
  const [editingFila, setEditingFila] = useState<Fila | null>(null);
  const [filaAtual, setFilaAtual] = useState<Fila | null>(null);

  // Form state - Fila
  const [formFila, setFormFila] = useState<CreateFilaDto>({
    nome: '',
    descricao: '',
    nucleoId: undefined, // Novo campo (Jan 2025)
    departamentoId: undefined, // Novo campo (Jan 2025)
    estrategiaDistribuicao: EstrategiaDistribuicao.ROUND_ROBIN,
    capacidadeMaxima: 10,
    distribuicaoAutomatica: false,
    ordem: 0,
    ativo: true,
  });

  // Form state - Atendente
  const [formAtendente, setFormAtendente] = useState({
    atendenteId: '',
    capacidade: 10,
    prioridade: 5,
  });

  // Carregar dados ao montar
  useEffect(() => {
    if (empresaId) {
      carregarDados();
    }
  }, [empresaId]);

  // Carregar métricas quando selecionar fila
  useEffect(() => {
    if (filaSelecionada && empresaId) {
      obterMetricas(filaSelecionada.id, empresaId);
    }
  }, [filaSelecionada]);

  const carregarDados = async () => {
    try {
      await listarFilas(empresaId);
    } catch (err) {
      console.error('Erro ao carregar filas:', err);
    }
  };

  // KPI Cards
  const totalFilas = filas.length;
  const filasAtivas = filas.filter((f) => f.ativo).length;
  const filasInativas = filas.filter((f) => !f.ativo).length;
  const totalAtendentes = filas.reduce(
    (acc, f) => acc + (f.atendentes?.length || 0),
    0,
  );

  // Filtro de busca
  const filasFiltradas = filas.filter(
    (fila) =>
      fila.nome.toLowerCase().includes(busca.toLowerCase()) ||
      fila.descricao?.toLowerCase().includes(busca.toLowerCase()),
  );

  // Handlers - Fila
  const handleOpenDialogFila = (fila?: Fila) => {
    if (fila) {
      setEditingFila(fila);
      setFormFila({
        nome: fila.nome,
        descricao: fila.descricao,
        estrategiaDistribuicao: fila.estrategiaDistribuicao,
        capacidadeMaxima: fila.capacidadeMaxima,
        distribuicaoAutomatica: fila.distribuicaoAutomatica,
        ordem: fila.ordem,
        ativo: fila.ativo,
        configuracoes: fila.configuracoes,
      });
    } else {
      setEditingFila(null);
      setFormFila({
        nome: '',
        descricao: '',
        estrategiaDistribuicao: EstrategiaDistribuicao.ROUND_ROBIN,
        capacidadeMaxima: 10,
        distribuicaoAutomatica: false,
        ordem: filas.length,
        ativo: true,
      });
    }
    setShowDialogFila(true);
  };

  const handleSaveFila = async () => {
    try {
      resetError();

      // ⚠️ Validar empresaId
      if (!empresaId) {
        alert('Erro: EmpresaId não encontrado. Faça login novamente.');
        return;
      }

      if (editingFila) {
        await atualizarFila(editingFila.id, empresaId, formFila);
      } else {
        await criarFila(empresaId, formFila);
      }
      setShowDialogFila(false);
      setEditingFila(null);
    } catch (err) {
      console.error('Erro ao salvar fila:', err);
    }
  };

  const handleDeleteFila = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta fila?')) {
      return;
    }

    try {
      resetError();
      await removerFila(id, empresaId);
    } catch (err) {
      console.error('Erro ao deletar fila:', err);
    }
  };

  // Handlers - Atendente
  const handleOpenDialogAtendente = (fila: Fila) => {
    setFilaAtual(fila);
    setFormAtendente({
      atendenteId: '',
      capacidade: 10,
      prioridade: 5,
    });
    setShowDialogAtendente(true);
  };

  const handleAddAtendente = async () => {
    if (!filaAtual) return;

    try {
      resetError();
      await adicionarAtendente(filaAtual.id, empresaId, formAtendente);
      setShowDialogAtendente(false);
      setFilaAtual(null);
    } catch (err) {
      console.error('Erro ao adicionar atendente:', err);
    }
  };

  const handleRemoveAtendente = async (filaId: string, atendenteId: string) => {
    if (!window.confirm('Tem certeza que deseja remover este atendente da fila?')) {
      return;
    }

    try {
      resetError();
      await removerAtendente(filaId, atendenteId, empresaId);
    } catch (err) {
      console.error('Erro ao remover atendente:', err);
    }
  };

  // ⚠️ Se não houver empresaId, mostrar aviso
  if (!empresaId) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header com BackToNucleus */}
        <div className="bg-white border-b px-6 py-4">
          <BackToNucleus
            nucleusName="Atendimento"
            nucleusPath="/atendimento"
          />
        </div>

        {/* Aviso de Empresa Não Selecionada */}
        <div className="p-6">
          <div className="max-w-2xl mx-auto">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="h-6 w-6 text-yellow-600 mr-3 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                    Nenhuma Empresa Selecionada
                  </h3>
                  <p className="text-yellow-700 mb-4">
                    Para acessar a Gestão de Filas, você precisa estar logado com uma empresa ativa.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => window.location.href = '/login'}
                      className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors text-sm font-medium"
                    >
                      Fazer Login
                    </button>
                    <button
                      onClick={() => window.location.href = '/'}
                      className="px-4 py-2 bg-white text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      Voltar ao Início
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com BackToNucleus */}
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus
          nucleusName="Atendimento"
          nucleusPath="/atendimento"
        />
      </div>

      {/* Container Principal */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header da Página */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#002333] flex items-center">
                  <Users className="h-8 w-8 mr-3 text-[#159A9C]" />
                  Gestão de Filas
                </h1>
                <p className="text-[#002333]/70 mt-2">
                  Sistema de distribuição inteligente de tickets
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={carregarDados}
                  disabled={loading}
                  className="px-4 py-2 text-[#159A9C] hover:bg-[#159A9C]/10 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar
                </button>
                <button
                  onClick={() => handleOpenDialogFila()}
                  className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Nova Fila
                </button>
              </div>
            </div>
          </div>

          {/* KPI Cards - Padrão Limpo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Filas */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Total de Filas
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">
                    {totalFilas}
                  </p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    Filas cadastradas no sistema
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                  <Users className="h-6 w-6 text-[#159A9C]" />
                </div>
              </div>
            </div>

            {/* Filas Ativas */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Filas Ativas
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">
                    {filasAtivas}
                  </p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    Recebendo tickets atualmente
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center shadow-sm">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Filas Inativas */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Filas Inativas
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">
                    {filasInativas}
                  </p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    Pausadas ou desabilitadas
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-gray-500/10 flex items-center justify-center shadow-sm">
                  <AlertCircle className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </div>

            {/* Total Atendentes */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Total Atendentes
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">
                    {totalAtendentes}
                  </p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    Atendentes em todas as filas
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                  <UserPlus className="h-6 w-6 text-[#159A9C]" />
                </div>
              </div>
            </div>
          </div>

          {/* Barra de Busca */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar filas por nome ou descrição..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Mensagem de Erro */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
              <button
                onClick={resetError}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <RefreshCw className="h-12 w-12 text-[#159A9C] animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Carregando filas...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && filasFiltradas.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {busca ? 'Nenhuma fila encontrada' : 'Nenhuma fila cadastrada'}
              </h3>
              <p className="text-gray-500 mb-6">
                {busca
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando sua primeira fila de atendimento'}
              </p>
              {!busca && (
                <button
                  onClick={() => handleOpenDialogFila()}
                  className="px-6 py-3 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors inline-flex items-center gap-2 font-medium"
                >
                  <Plus className="h-5 w-5" />
                  Criar Primeira Fila
                </button>
              )}
            </div>
          )}

          {/* Grid de Cards de Filas */}
          {!loading && filasFiltradas.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filasFiltradas.map((fila) => {
                const metricasFila = metricas[fila.id];

                return (
                  <div
                    key={fila.id}
                    className="bg-white rounded-lg shadow-sm border hover:shadow-lg transition-shadow p-6"
                  >
                    {/* Header do Card */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-[#002333]">
                            {fila.nome}
                          </h3>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${fila.ativo
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                              }`}
                          >
                            {fila.ativo ? 'Ativa' : 'Inativa'}
                          </span>
                        </div>
                        {fila.descricao && (
                          <p className="text-sm text-gray-600">{fila.descricao}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenDialogFila(fila)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFila(fila.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Informações da Fila */}
                    <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Estratégia</p>
                        <p className="text-sm font-medium text-gray-900">
                          {fila.estrategiaDistribuicao === EstrategiaDistribuicao.ROUND_ROBIN && 'Round Robin'}
                          {fila.estrategiaDistribuicao === EstrategiaDistribuicao.MENOR_CARGA && 'Menor Carga'}
                          {fila.estrategiaDistribuicao === EstrategiaDistribuicao.PRIORIDADE && 'Por Prioridade'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Capacidade</p>
                        <p className="text-sm font-medium text-gray-900">
                          {fila.capacidadeMaxima} tickets/atendente
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Atendentes</p>
                        <p className="text-sm font-medium text-gray-900">
                          {fila.atendentes?.length || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Distribuição</p>
                        <p className="text-sm font-medium text-gray-900">
                          {fila.distribuicaoAutomatica ? 'Automática' : 'Manual'}
                        </p>
                      </div>
                    </div>

                    {/* Métricas (se disponível) */}
                    {metricasFila && (
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Aguardando</p>
                          <p className="text-lg font-bold text-yellow-600">
                            {metricasFila.ticketsAguardando}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Em Atendimento</p>
                          <p className="text-lg font-bold text-blue-600">
                            {metricasFila.ticketsEmAtendimento}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Finalizados</p>
                          <p className="text-lg font-bold text-green-600">
                            {metricasFila.ticketsFinalizados}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Ações */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenDialogAtendente(fila)}
                        className="flex-1 px-4 py-2 bg-[#159A9C]/10 text-[#159A9C] rounded-lg hover:bg-[#159A9C]/20 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        <UserPlus className="h-4 w-4" />
                        Adicionar Atendente
                      </button>
                      <button
                        onClick={() => obterMetricas(fila.id, empresaId)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm font-medium"
                      >
                        <BarChart3 className="h-4 w-4" />
                        Métricas
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal - Criar/Editar Fila */}
      {showDialogFila && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-[#002333]">
                {editingFila ? 'Editar Fila' : 'Nova Fila'}
              </h2>
              <button
                onClick={() => setShowDialogFila(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Fila *
                </label>
                <input
                  type="text"
                  value={formFila.nome}
                  onChange={(e) => setFormFila({ ...formFila, nome: e.target.value })}
                  placeholder="Ex: Suporte Técnico"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formFila.descricao}
                  onChange={(e) => setFormFila({ ...formFila, descricao: e.target.value })}
                  placeholder="Descreva o propósito desta fila..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                />
              </div>

              {/* ====== NOVOS CAMPOS: Núcleo e Departamento (Jan 2025) ====== */}

              {/* Núcleo de Atendimento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Núcleo de Atendimento
                </label>
                <select
                  value={formFila.nucleoId || ''}
                  onChange={(e) => setFormFila({ ...formFila, nucleoId: e.target.value || undefined })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                >
                  <option value="">Nenhum (opcional)</option>
                  {/* TODO: Carregar núcleos dinamicamente */}
                  {/* {nucleos.map(n => <option key={n.id} value={n.id}>{n.nome}</option>)} */}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Associe a fila a um núcleo (ex: Suporte, Comercial, Financeiro)
                </p>
              </div>

              {/* Departamento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Departamento
                </label>
                <select
                  value={formFila.departamentoId || ''}
                  onChange={(e) => setFormFila({ ...formFila, departamentoId: e.target.value || undefined })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                >
                  <option value="">Nenhum (opcional)</option>
                  {/* TODO: Carregar departamentos dinamicamente */}
                  {/* {departamentos.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)} */}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Associe a fila a um departamento (ex: TI, Vendas, RH)
                </p>
              </div>

              {/* ============================================================ */}

              {/* Estratégia de Distribuição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estratégia de Distribuição *
                </label>
                <select
                  value={formFila.estrategiaDistribuicao}
                  onChange={(e) =>
                    setFormFila({
                      ...formFila,
                      estrategiaDistribuicao: e.target.value as EstrategiaDistribuicao,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                >
                  <option value={EstrategiaDistribuicao.ROUND_ROBIN}>
                    Round Robin (Rotação circular)
                  </option>
                  <option value={EstrategiaDistribuicao.MENOR_CARGA}>
                    Menor Carga (Menos tickets)
                  </option>
                  <option value={EstrategiaDistribuicao.PRIORIDADE}>
                    Por Prioridade (Baseado em prioridade)
                  </option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Define como os tickets serão distribuídos entre os atendentes
                </p>
              </div>

              {/* Capacidade Máxima */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacidade Máxima por Atendente *
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formFila.capacidadeMaxima || ''}
                  onChange={(e) =>
                    setFormFila({
                      ...formFila,
                      capacidadeMaxima: e.target.value ? parseInt(e.target.value) : 10
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Número máximo de tickets simultâneos por atendente
                </p>
              </div>

              {/* Distribuição Automática */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formFila.distribuicaoAutomatica}
                  onChange={(e) =>
                    setFormFila({ ...formFila, distribuicaoAutomatica: e.target.checked })
                  }
                  className="h-4 w-4 text-[#159A9C] focus:ring-[#159A9C] border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Distribuição Automática
                </label>
              </div>
              <p className="text-xs text-gray-500 -mt-2">
                Se ativado, tickets serão distribuídos automaticamente ao entrar na fila
              </p>

              {/* Ativo */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formFila.ativo}
                  onChange={(e) => setFormFila({ ...formFila, ativo: e.target.checked })}
                  className="h-4 w-4 text-[#159A9C] focus:ring-[#159A9C] border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">Fila Ativa</label>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowDialogFila(false)}
                className="px-4 py-2 bg-white text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveFila}
                disabled={!formFila.nome || loading}
                className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {editingFila ? 'Salvar' : 'Criar Fila'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Adicionar Atendente */}
      {showDialogAtendente && filaAtual && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-[#002333]">
                Adicionar Atendente
              </h2>
              <button
                onClick={() => setShowDialogAtendente(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Fila: <span className="font-medium">{filaAtual.nome}</span>
              </p>

              {/* ID do Atendente (em produção seria um select com busca) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID do Atendente *
                </label>
                <input
                  type="text"
                  value={formAtendente.atendenteId}
                  onChange={(e) =>
                    setFormAtendente({ ...formAtendente, atendenteId: e.target.value })
                  }
                  placeholder="UUID do atendente"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                />
              </div>

              {/* Capacidade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacidade nesta Fila
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={formAtendente.capacidade}
                  onChange={(e) =>
                    setFormAtendente({
                      ...formAtendente,
                      capacidade: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tickets simultâneos que pode atender nesta fila (1-50)
                </p>
              </div>

              {/* Prioridade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prioridade
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formAtendente.prioridade}
                  onChange={(e) =>
                    setFormAtendente({
                      ...formAtendente,
                      prioridade: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  1 = Alta prioridade, 10 = Baixa prioridade
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowDialogAtendente(false)}
                className="px-4 py-2 bg-white text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddAtendente}
                disabled={!formAtendente.atendenteId || loading}
                className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestaoFilasPage;
