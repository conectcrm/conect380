/**
 * PÁGINA: Configuração de Distribuição Automática
 * Módulo: Atendimento
 * Funcionalidade: CRUD de configurações de distribuição por fila
 */

import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  Settings,
  Shuffle,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { BackToNucleus } from '../components/navigation/BackToNucleus';
import {
  distribuicaoAvancadaService,
  DistribuicaoConfig,
  CreateDistribuicaoConfigDto,
  AlgoritmoDistribuicao,
} from '../services/distribuicaoAvancadaService';
import api from '../services/api';

interface Fila {
  id: string;
  nome: string;
  ativo: boolean;
}

const ConfiguracaoDistribuicaoPage: React.FC = () => {
  // Estados principais
  const [configuracoes, setConfiguracoes] = useState<DistribuicaoConfig[]>([]);
  const [filas, setFilas] = useState<Fila[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState('');

  // Estados de UI
  const [showDialog, setShowDialog] = useState(false);
  const [editingConfig, setEditingConfig] = useState<DistribuicaoConfig | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateDistribuicaoConfigDto>({
    filaId: '',
    algoritmo: 'hibrido',
    capacidadeMaxima: 10,
    priorizarOnline: true,
    considerarSkills: true,
    tempoTimeoutMin: 5,
    permitirOverflow: false,
    filaBackupId: undefined,
    ativo: true,
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);

      const [configsData, filasData] = await Promise.all([
        distribuicaoAvancadaService.listarConfiguracoes(),
        api.get('/api/filas').then((res) => res.data.data || res.data),
      ]);

      setConfiguracoes(Array.isArray(configsData) ? configsData : []);
      setFilas(Array.isArray(filasData) ? filasData : []);
    } catch (err: unknown) {
      console.error('Erro ao carregar dados:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      if (editingConfig) {
        const { filaId, ...updateData } = formData;
        await distribuicaoAvancadaService.atualizarConfiguracao(editingConfig.id, updateData);
      } else {
        await distribuicaoAvancadaService.criarConfiguracao(formData);
      }

      await carregarDados();
      handleCloseDialog();
    } catch (err: unknown) {
      console.error('Erro ao salvar configuração:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao salvar configuração');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (config: DistribuicaoConfig) => {
    setEditingConfig(config);
    setFormData({
      filaId: config.filaId,
      algoritmo: config.algoritmo,
      capacidadeMaxima: config.capacidadeMaxima,
      priorizarOnline: config.priorizarOnline,
      considerarSkills: config.considerarSkills,
      tempoTimeoutMin: config.tempoTimeoutMin,
      permitirOverflow: config.permitirOverflow,
      filaBackupId: config.filaBackupId,
      ativo: config.ativo,
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Deseja realmente deletar esta configuração?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await distribuicaoAvancadaService.deletarConfiguracao(id);
      await carregarDados();
    } catch (err: unknown) {
      console.error('Erro ao deletar configuração:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao deletar configuração');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingConfig(null);
    setFormData({
      filaId: '',
      algoritmo: 'hibrido',
      capacidadeMaxima: 10,
      priorizarOnline: true,
      considerarSkills: true,
      tempoTimeoutMin: 5,
      permitirOverflow: false,
      filaBackupId: undefined,
      ativo: true,
    });
  };

  const configsFiltradas = configuracoes.filter((config) => {
    const searchLower = busca.toLowerCase();
    return (
      config.fila?.nome.toLowerCase().includes(searchLower) ||
      config.algoritmo.toLowerCase().includes(searchLower)
    );
  });

  const getAlgoritmoLabel = (algoritmo: AlgoritmoDistribuicao): string => {
    const labels: Record<AlgoritmoDistribuicao, string> = {
      'round-robin': 'Round-Robin',
      'menor-carga': 'Menor Carga',
      skills: 'Skills-Based',
      hibrido: 'Híbrido',
    };
    return labels[algoritmo];
  };

  const getAlgoritmoColor = (algoritmo: AlgoritmoDistribuicao): string => {
    const colors: Record<AlgoritmoDistribuicao, string> = {
      'round-robin': 'bg-blue-500/10 text-blue-600',
      'menor-carga': 'bg-green-500/10 text-green-600',
      skills: 'bg-purple-500/10 text-purple-600',
      hibrido: 'bg-[#159A9C]/10 text-[#159A9C]',
    };
    return colors[algoritmo];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com BackToNucleus */}
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus nucleusName="Atendimento" nucleusPath="/atendimento" />
      </div>

      {/* Container principal */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header da página */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#002333] flex items-center gap-3">
                  <Settings className="h-8 w-8 text-[#159A9C]" />
                  Configuração de Distribuição
                </h1>
                <p className="text-[#002333]/70 mt-2">
                  Configure algoritmos de distribuição automática por fila
                </p>
              </div>
              <button
                onClick={() => setShowDialog(true)}
                className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                Nova Configuração
              </button>
            </div>
          </div>

          {/* Barra de busca e ações */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#B4BEC9]" />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por fila ou algoritmo..."
                  className="w-full pl-10 pr-4 py-2 border border-[#B4BEC9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                />
              </div>
              <button
                onClick={carregarDados}
                disabled={loading}
                className="px-4 py-2 bg-white text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
            </div>
          </div>

          {/* Mensagens de erro */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900">Erro</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && configuracoes.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <RefreshCw className="h-8 w-8 text-[#159A9C] animate-spin mx-auto mb-4" />
              <p className="text-[#002333]/70">Carregando configurações...</p>
            </div>
          ) : configsFiltradas.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <Shuffle className="h-12 w-12 text-[#B4BEC9] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#002333] mb-2">
                Nenhuma configuração encontrada
              </h3>
              <p className="text-[#002333]/70 mb-6">
                {busca
                  ? 'Nenhuma configuração corresponde à sua busca.'
                  : 'Crie sua primeira configuração de distribuição automática.'}
              </p>
              {!busca && (
                <button
                  onClick={() => setShowDialog(true)}
                  className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors inline-flex items-center gap-2 text-sm font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Nova Configuração
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {configsFiltradas.map((config) => (
                <div
                  key={config.id}
                  className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-lg transition-shadow"
                >
                  {/* Header do card */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#002333] text-lg mb-1">
                        {config.fila?.nome || 'Fila não encontrada'}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAlgoritmoColor(config.algoritmo)}`}
                      >
                        {getAlgoritmoLabel(config.algoritmo)}
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        config.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {config.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  {/* Configurações */}
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#002333]/70">Capacidade Máx.:</span>
                      <span className="font-medium text-[#002333]">
                        {config.capacidadeMaxima} tickets
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#002333]/70">Timeout:</span>
                      <span className="font-medium text-[#002333]">
                        {config.tempoTimeoutMin} min
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {config.priorizarOnline && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700">
                          Prioriza Online
                        </span>
                      )}
                      {config.considerarSkills && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-purple-50 text-purple-700">
                          Skills
                        </span>
                      )}
                    </div>
                    {config.permitirOverflow && config.filaBackup && (
                      <div className="flex justify-between">
                        <span className="text-[#002333]/70">Fila Backup:</span>
                        <span className="font-medium text-[#002333] text-xs">
                          {config.filaBackup.nome}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex gap-2 pt-4 border-t">
                    <button
                      onClick={() => handleEdit(config)}
                      className="flex-1 px-3 py-2 text-[#159A9C] hover:bg-[#159A9C]/10 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <Edit2 className="h-4 w-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(config.id)}
                      className="flex-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <Trash2 className="h-4 w-4" />
                      Deletar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Criação/Edição */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header do modal */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-[#002333]">
                {editingConfig ? 'Editar Configuração' : 'Nova Configuração'}
              </h2>
              <button
                onClick={handleCloseDialog}
                className="text-[#002333]/70 hover:text-[#002333]"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Fila */}
              <div>
                <label className="block text-sm font-medium text-[#002333] mb-2">Fila *</label>
                <select
                  value={formData.filaId}
                  onChange={(e) => setFormData({ ...formData, filaId: e.target.value })}
                  disabled={!!editingConfig}
                  required
                  className="w-full px-3 py-2 border border-[#B4BEC9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                >
                  <option value="">Selecione uma fila</option>
                  {filas
                    .filter((f) => f.ativo)
                    .map((fila) => (
                      <option key={fila.id} value={fila.id}>
                        {fila.nome}
                      </option>
                    ))}
                </select>
                {editingConfig && (
                  <p className="text-xs text-[#002333]/70 mt-1">
                    Não é possível alterar a fila após criar a configuração
                  </p>
                )}
              </div>

              {/* Algoritmo */}
              <div>
                <label className="block text-sm font-medium text-[#002333] mb-2">
                  Algoritmo de Distribuição *
                </label>
                <select
                  value={formData.algoritmo}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      algoritmo: e.target.value as AlgoritmoDistribuicao,
                    })
                  }
                  required
                  className="w-full px-3 py-2 border border-[#B4BEC9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                >
                  <option value="round-robin">Round-Robin (Circular)</option>
                  <option value="menor-carga">Menor Carga (Balanceamento)</option>
                  <option value="skills">Skills-Based (Por Competência)</option>
                  <option value="hibrido">Híbrido (Skills + Menor Carga)</option>
                </select>
              </div>

              {/* Capacidade Máxima */}
              <div>
                <label className="block text-sm font-medium text-[#002333] mb-2">
                  Capacidade Máxima (tickets/atendente) *
                </label>
                <input
                  type="number"
                  value={formData.capacidadeMaxima}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      capacidadeMaxima: parseInt(e.target.value) || 1,
                    })
                  }
                  min={1}
                  max={50}
                  required
                  className="w-full px-3 py-2 border border-[#B4BEC9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                />
              </div>

              {/* Timeout */}
              <div>
                <label className="block text-sm font-medium text-[#002333] mb-2">
                  Tempo de Timeout (minutos)
                </label>
                <input
                  type="number"
                  value={formData.tempoTimeoutMin}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tempoTimeoutMin: parseInt(e.target.value) || 1,
                    })
                  }
                  min={1}
                  max={60}
                  className="w-full px-3 py-2 border border-[#B4BEC9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                />
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.priorizarOnline}
                    onChange={(e) =>
                      setFormData({ ...formData, priorizarOnline: e.target.checked })
                    }
                    className="w-5 h-5 text-[#159A9C] rounded focus:ring-2 focus:ring-[#159A9C]"
                  />
                  <span className="text-sm text-[#002333]">Priorizar atendentes online</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.considerarSkills}
                    onChange={(e) =>
                      setFormData({ ...formData, considerarSkills: e.target.checked })
                    }
                    className="w-5 h-5 text-[#159A9C] rounded focus:ring-2 focus:ring-[#159A9C]"
                  />
                  <span className="text-sm text-[#002333]">Considerar skills dos atendentes</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permitirOverflow}
                    onChange={(e) =>
                      setFormData({ ...formData, permitirOverflow: e.target.checked })
                    }
                    className="w-5 h-5 text-[#159A9C] rounded focus:ring-2 focus:ring-[#159A9C]"
                  />
                  <span className="text-sm text-[#002333]">Permitir overflow (fila de backup)</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.ativo}
                    onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                    className="w-5 h-5 text-[#159A9C] rounded focus:ring-2 focus:ring-[#159A9C]"
                  />
                  <span className="text-sm text-[#002333]">Ativo</span>
                </label>
              </div>

              {/* Fila de Backup (condicional) */}
              {formData.permitirOverflow && (
                <div>
                  <label className="block text-sm font-medium text-[#002333] mb-2">
                    Fila de Backup
                  </label>
                  <select
                    value={formData.filaBackupId || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        filaBackupId: e.target.value || undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-[#B4BEC9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                  >
                    <option value="">Nenhuma</option>
                    {filas
                      .filter((f) => f.ativo && f.id !== formData.filaId)
                      .map((fila) => (
                        <option key={fila.id} value={fila.id}>
                          {fila.nome}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Botões */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseDialog}
                  className="flex-1 px-4 py-2 bg-white text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {loading ? 'Salvando...' : editingConfig ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfiguracaoDistribuicaoPage;
