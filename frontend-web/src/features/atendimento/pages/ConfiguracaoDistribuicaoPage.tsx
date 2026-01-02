/**
 * Página de Configuração de Auto-Distribuição de Filas
 *
 * Permite configurar estratégias de distribuição automática de tickets,
 * capacidades dos atendentes e prioridades.
 *
 * @author ConectCRM
 * @date 07/11/2025
 */

import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Save,
  Settings,
  Users,
  CheckCircle,
  AlertCircle,
  Info,
  TrendingUp,
  BarChart3,
  Zap,
} from 'lucide-react';
import { BackToNucleus } from '../../../components/navigation/BackToNucleus';
import distribuicaoService, {
  EstrategiaDistribuicao,
  ConfiguracaoDistribuicao,
  AtendenteCapacidade,
} from '../../../services/distribuicaoService';

const ConfiguracaoDistribuicaoPage: React.FC = () => {
  // Estados principais
  const [filas, setFilas] = useState<any[]>([]);
  const [filaSelecionada, setFilaSelecionada] = useState<string | null>(null);
  const [configuracao, setConfiguracao] = useState<ConfiguracaoDistribuicao | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Carregar filas ao montar
  useEffect(() => {
    carregarFilas();
  }, []);

  // Carregar configuração quando fila muda
  useEffect(() => {
    if (filaSelecionada) {
      carregarConfiguracao();
    }
  }, [filaSelecionada]);

  const carregarFilas = async () => {
    try {
      setLoading(true);
      setError(null);
      // Obter empresaId do usuário logado
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const empresaId = user?.empresaId || 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      const lista = await distribuicaoService.listarFilas(empresaId);
      setFilas(lista);

      if (lista.length === 0) {
        setFilaSelecionada(null);
        setConfiguracao(null);
        setError('Nenhuma fila encontrada para esta empresa.');
        return;
      }

      setFilaSelecionada((prev) => {
        if (prev && lista.some((fila) => fila.id === prev)) {
          return prev;
        }
        return lista[0].id;
      });
    } catch (err: unknown) {
      console.error('Erro ao carregar filas:', err);
      setError('Erro ao carregar filas');
    } finally {
      setLoading(false);
    }
  };

  const carregarConfiguracao = async () => {
    if (!filaSelecionada) return;

    try {
      setLoading(true);
      setError(null);

      // Obter empresaId do usuário logado
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const empresaId = user?.empresaId || 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      const config = await distribuicaoService.buscarConfiguracao(filaSelecionada, empresaId);

      if (config) {
        setConfiguracao(config);
      } else {
        // Configuração padrão se não existir
        setConfiguracao({
          filaId: filaSelecionada,
          distribuicaoAutomatica: false,
          estrategiaDistribuicao: EstrategiaDistribuicao.MENOR_CARGA,
          capacidadeMaxima: 5,
          atendentes: [],
        });
      }
    } catch (err: unknown) {
      console.error('Erro ao carregar configuração:', err);
      setError('Erro ao carregar configuração da fila');
    } finally {
      setLoading(false);
    }
  };

  const handleSalvar = async () => {
    if (!configuracao || !filaSelecionada) return;

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      // Obter empresaId do usuário logado
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const empresaId = user?.empresaId || 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      const sucesso = await distribuicaoService.atualizarConfiguracao(
        filaSelecionada,
        empresaId,
        configuracao,
      );

      if (sucesso) {
        setSuccessMessage('Configuração salva com sucesso!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError('Erro ao salvar configuração');
      }
    } catch (err: unknown) {
      console.error('Erro ao salvar:', err);
      setError('Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAutomatica = () => {
    if (!configuracao) return;

    setConfiguracao({
      ...configuracao,
      distribuicaoAutomatica: !configuracao.distribuicaoAutomatica,
    });
  };

  const handleChangeEstrategia = (estrategia: EstrategiaDistribuicao) => {
    if (!configuracao) return;

    setConfiguracao({
      ...configuracao,
      estrategiaDistribuicao: estrategia,
    });
  };

  const handleUpdateAtendente = (
    atendenteId: string,
    campo: keyof AtendenteCapacidade,
    valor: any,
  ) => {
    if (!configuracao) return;

    const atendentesAtualizados = configuracao.atendentes?.map((atendente) =>
      atendente.atendenteId === atendenteId ? { ...atendente, [campo]: valor } : atendente,
    );

    setConfiguracao({
      ...configuracao,
      atendentes: atendentesAtualizados,
    });
  };

  if (loading && !configuracao) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b px-6 py-4">
          <BackToNucleus nucleusName="Atendimento" nucleusPath="/nuclei/atendimento" />
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-[#9333EA]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus nucleusName="Atendimento" nucleusPath="/nuclei/atendimento" />
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Título */}
          <div className="bg-white rounded-lg shadow-sm border mb-6 p-6">
            <h1 className="text-3xl font-bold text-[#002333] flex items-center">
              <Settings className="h-8 w-8 mr-3 text-[#9333EA]" />
              Configuração de Auto-Distribuição
            </h1>
            <p className="text-[#002333]/70 mt-2">
              Configure estratégias de distribuição automática de tickets para suas filas de
              atendimento
            </p>
          </div>

          {/* Mensagens */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <p className="text-green-800">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Seleção de Fila */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <label className="block text-sm font-medium text-[#002333] mb-2">Selecionar Fila</label>
            <select
              value={filaSelecionada || ''}
              onChange={(e) => setFilaSelecionada(e.target.value)}
              className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
            >
              <option value="">Selecione uma fila...</option>
              {filas.map((fila) => (
                <option key={fila.id} value={fila.id}>
                  {fila.nome}
                </option>
              ))}
            </select>
          </div>

          {configuracao && (
            <>
              {/* Toggle Distribuição Automática */}
              <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#002333] flex items-center">
                      <Zap className="h-5 w-5 mr-2 text-[#9333EA]" />
                      Distribuição Automática
                    </h3>
                    <p className="text-sm text-[#002333]/70 mt-1">
                      Ativa ou desativa a distribuição automática de tickets nesta fila
                    </p>
                  </div>
                  <button
                    onClick={handleToggleAutomatica}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      configuracao.distribuicaoAutomatica ? 'bg-[#9333EA]' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        configuracao.distribuicaoAutomatica ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Estratégia de Distribuição */}
              <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                <h3 className="text-lg font-semibold text-[#002333] flex items-center mb-4">
                  <BarChart3 className="h-5 w-5 mr-2 text-[#9333EA]" />
                  Estratégia de Distribuição
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Round Robin */}
                  <button
                    onClick={() => handleChangeEstrategia(EstrategiaDistribuicao.ROUND_ROBIN)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      configuracao.estrategiaDistribuicao === EstrategiaDistribuicao.ROUND_ROBIN
                        ? 'border-[#9333EA] bg-[#9333EA]/10'
                        : 'border-[#B4BEC9] hover:border-[#9333EA]/50'
                    }`}
                  >
                    <div className="text-2xl mb-2">
                      {distribuicaoService.iconeEstrategia(EstrategiaDistribuicao.ROUND_ROBIN)}
                    </div>
                    <h4 className="font-semibold text-[#002333] mb-1">Round-Robin</h4>
                    <p className="text-sm text-[#002333]/70">
                      {distribuicaoService.descricaoEstrategia(EstrategiaDistribuicao.ROUND_ROBIN)}
                    </p>
                  </button>

                  {/* Menor Carga */}
                  <button
                    onClick={() => handleChangeEstrategia(EstrategiaDistribuicao.MENOR_CARGA)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      configuracao.estrategiaDistribuicao === EstrategiaDistribuicao.MENOR_CARGA
                        ? 'border-[#9333EA] bg-[#9333EA]/10'
                        : 'border-[#B4BEC9] hover:border-[#9333EA]/50'
                    }`}
                  >
                    <div className="text-2xl mb-2">
                      {distribuicaoService.iconeEstrategia(EstrategiaDistribuicao.MENOR_CARGA)}
                    </div>
                    <h4 className="font-semibold text-[#002333] mb-1">Menor Carga</h4>
                    <p className="text-sm text-[#002333]/70">
                      {distribuicaoService.descricaoEstrategia(EstrategiaDistribuicao.MENOR_CARGA)}
                    </p>
                  </button>

                  {/* Prioridade */}
                  <button
                    onClick={() => handleChangeEstrategia(EstrategiaDistribuicao.PRIORIDADE)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      configuracao.estrategiaDistribuicao === EstrategiaDistribuicao.PRIORIDADE
                        ? 'border-[#9333EA] bg-[#9333EA]/10'
                        : 'border-[#B4BEC9] hover:border-[#9333EA]/50'
                    }`}
                  >
                    <div className="text-2xl mb-2">
                      {distribuicaoService.iconeEstrategia(EstrategiaDistribuicao.PRIORIDADE)}
                    </div>
                    <h4 className="font-semibold text-[#002333] mb-1">Prioridade</h4>
                    <p className="text-sm text-[#002333]/70">
                      {distribuicaoService.descricaoEstrategia(EstrategiaDistribuicao.PRIORIDADE)}
                    </p>
                  </button>
                </div>
              </div>

              {/* Atendentes e Capacidades */}
              {configuracao.atendentes && configuracao.atendentes.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                  <h3 className="text-lg font-semibold text-[#002333] flex items-center mb-4">
                    <Users className="h-5 w-5 mr-2 text-[#9333EA]" />
                    Capacidade dos Atendentes
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-[#002333]">
                            Atendente
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-[#002333]">
                            Capacidade Máxima
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-[#002333]">
                            Prioridade
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-[#002333]">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {configuracao.atendentes.map((atendente) => (
                          <tr key={atendente.atendenteId} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <span className="text-sm font-medium text-[#002333]">
                                {atendente.atendenteNome}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <input
                                type="number"
                                min="1"
                                max="50"
                                value={atendente.capacidade}
                                onChange={(e) =>
                                  handleUpdateAtendente(
                                    atendente.atendenteId,
                                    'capacidade',
                                    parseInt(e.target.value),
                                  )
                                }
                                className="w-20 px-3 py-1 border border-[#B4BEC9] rounded focus:ring-2 focus:ring-[#9333EA]"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={atendente.prioridade}
                                onChange={(e) =>
                                  handleUpdateAtendente(
                                    atendente.atendenteId,
                                    'prioridade',
                                    parseInt(e.target.value),
                                  )
                                }
                                className="w-20 px-3 py-1 border border-[#B4BEC9] rounded focus:ring-2 focus:ring-[#9333EA]"
                              />
                              <span className="text-xs text-[#002333]/60 ml-2">(1 = maior)</span>
                            </td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() =>
                                  handleUpdateAtendente(
                                    atendente.atendenteId,
                                    'ativo',
                                    !atendente.ativo,
                                  )
                                }
                                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                  atendente.ativo
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                }`}
                              >
                                {atendente.ativo ? 'Ativo' : 'Inativo'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start">
                      <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Dicas de Configuração:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Capacidade: número máximo de tickets simultâneos por atendente</li>
                          <li>
                            Prioridade: quanto menor o número, maior a prioridade (1 = máxima)
                          </li>
                          <li>
                            Status Inativo: atendente não receberá novos tickets automaticamente
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Botão Salvar */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={carregarConfiguracao}
                  disabled={saving}
                  className="px-4 py-2 bg-white text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSalvar}
                  disabled={saving}
                  className="px-4 py-2 bg-[#9333EA] text-white rounded-lg hover:bg-[#7E22CE] transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Salvar Configurações
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfiguracaoDistribuicaoPage;
