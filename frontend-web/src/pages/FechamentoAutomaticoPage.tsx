/**
 * 🤖 Fechamento Automático de Tickets por Inatividade
 *
 * Permite configurar fechamento automático de tickets que ficam inativos
 * por determinado período de tempo.
 *
 * Features:
 * - Configuração global (empresa) ou por departamento
 * - Tempo de timeout configurável
 * - Aviso antes do fechamento
 * - Mensagens personalizáveis
 * - Status aplicáveis (AGUARDANDO, EM_ATENDIMENTO, etc)
 * - Teste manual (verificar agora)
 */

import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Save,
  AlertCircle,
  Clock,
  Settings,
  CheckCircle,
  X,
  Play,
  Users,
  Building2,
  MessageSquare,
  Info,
  Zap,
} from 'lucide-react';
import { BackToNucleus } from '../components/navigation/BackToNucleus';
import { useGlobalConfirmation } from '../contexts/GlobalConfirmationContext';
import { useAuth } from '../hooks/useAuth';
import configuracaoInactividadeService from '../services/configuracaoInactividadeService';
import type {
  ConfiguracaoInatividade,
  ConfiguracaoInactivityDto,
  Departamento,
} from '../services/configuracaoInactividadeService';

const FechamentoAutomaticoPage: React.FC = () => {
  const { confirm } = useGlobalConfirmation();
  const { user } = useAuth();

  // Estados principais
  const [config, setConfig] = useState<ConfiguracaoInatividade | null>(null);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Estados de UI
  const [modoConfig, setModoConfig] = useState<'global' | 'departamento'>('global');
  const [departamentoSelecionado, setDepartamentoSelecionado] = useState<string>('');

  // Form state (valores padrão)
  const [formData, setFormData] = useState<ConfiguracaoInactivityDto>({
    timeoutMinutos: 1440, // 24 horas
    enviarAviso: true,
    avisoMinutosAntes: 60, // 1 hora antes
    mensagemAviso:
      'Olá! Notamos que este atendimento está inativo há algum tempo. Este ticket será fechado automaticamente em breve se não houver resposta.',
    mensagemFechamento: 'Este ticket foi fechado automaticamente devido à inatividade.',
    ativo: false,
    statusAplicaveis: ['AGUARDANDO', 'EM_ATENDIMENTO'],
    departamentoId: undefined,
  });

  // Carregar dados ao montar
  useEffect(() => {
    carregarDados();
  }, []);

  // Carregar configuração quando trocar modo/departamento
  useEffect(() => {
    if (!loading) {
      carregarConfiguracao();
    }
  }, [modoConfig, departamentoSelecionado]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);

      const empresaId = user?.empresa?.id;
      if (!empresaId) {
        throw new Error('Usuário não possui empresa associada');
      }

      // Carregar departamentos
      const deptosResponse = await configuracaoInactividadeService.listarDepartamentos(empresaId);
      setDepartamentos(deptosResponse?.dados || []);

      // Carregar configuração global inicial
      await carregarConfiguracao();
    } catch (err: unknown) {
      console.error('Erro ao carregar dados:', err);
      handleError(err, 'Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const carregarConfiguracao = async () => {
    try {
      setError(null);
      const empresaId = user?.empresa?.id;
      if (!empresaId) {
        throw new Error('Usuário não possui empresa associada');
      }

      const departamentoId = modoConfig === 'departamento' ? departamentoSelecionado : undefined;

      const response = await configuracaoInactividadeService.buscar(departamentoId);

      if (response.sucesso && response.dados) {
        setConfig(response.dados);
        setFormData({
          timeoutMinutos: response.dados.timeoutMinutos,
          enviarAviso: response.dados.enviarAviso,
          avisoMinutosAntes: response.dados.avisoMinutosAntes,
          mensagemAviso: response.dados.mensagemAviso || formData.mensagemAviso,
          mensagemFechamento: response.dados.mensagemFechamento || formData.mensagemFechamento,
          ativo: response.dados.ativo,
          statusAplicaveis: response.dados.statusAplicaveis || ['AGUARDANDO', 'EM_ATENDIMENTO'],
          departamentoId: departamentoId,
        });
      }
    } catch (err: unknown) {
      console.error('Erro ao carregar configuração:', err);
      handleError(err, 'Erro ao carregar configuração');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const empresaId = user?.empresa?.id;
      if (!empresaId) {
        throw new Error('Usuário não possui empresa associada');
      }

      if (config?.id) {
        // Atualizar existente
        await configuracaoInactividadeService.atualizar(formData);
        setSuccess('✅ Configuração atualizada com sucesso!');
      } else {
        // Criar nova
        await configuracaoInactividadeService.criar(formData);
        setSuccess('✅ Configuração criada com sucesso!');
      }

      // Recarregar
      await carregarConfiguracao();

      // Limpar mensagem de sucesso após 3s
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      console.error('Erro ao salvar:', err);
      handleError(err, 'Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  const handleVerificarAgora = async () => {
    if (
      !(await confirm(
        'Deseja executar a verificação de inatividade AGORA? Isso pode fechar tickets inativos imediatamente.',
      ))
    ) {
      return;
    }

    try {
      setTesting(true);
      setError(null);
      setSuccess(null);

      const empresaId = user?.empresa?.id;
      if (!empresaId) {
        throw new Error('Usuário não possui empresa associada');
      }
      const departamentoId = modoConfig === 'departamento' ? departamentoSelecionado : undefined;

      const resultado = await configuracaoInactividadeService.verificarAgora(
        empresaId,
        departamentoId,
      );

      if (resultado.sucesso) {
        const { processados, fechados, avisados } = resultado.resultado;
        setSuccess(
          `✅ Verificação concluída!\n\n📊 Resultados:\n• ${processados} tickets processados\n• ${avisados} avisos enviados\n• ${fechados} tickets fechados`,
        );
      }
    } catch (err: unknown) {
      console.error('Erro ao verificar:', err);
      handleError(err, 'Erro ao executar verificação');
    } finally {
      setTesting(false);
    }
  };

  const handleError = (err: unknown, defaultMsg: string) => {
    const responseMessage = (err as any)?.response?.data?.message;
    const normalizedMessage = Array.isArray(responseMessage)
      ? responseMessage.join('. ')
      : responseMessage;
    const fallbackMessage = err instanceof Error ? err.message : undefined;
    setError(normalizedMessage || fallbackMessage || defaultMsg);
  };

  const formatarTempo = (minutos: number): string => {
    if (minutos < 60) return `${minutos} minutos`;
    if (minutos < 1440) return `${Math.floor(minutos / 60)} horas`;
    return `${Math.floor(minutos / 1440)} dias`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-[#9333EA] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com BackToNucleus */}
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus nucleusName="Atendimento" nucleusPath="/atendimento" />
      </div>

      {/* Container principal */}
      <div className="p-6">
        <div className="max-w-5xl mx-auto">
          {/* Header da página */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#002333] flex items-center">
                  <Clock className="h-8 w-8 mr-3 text-[#9333EA]" />
                  Fechamento Automático
                </h1>
                <p className="text-gray-600 mt-2">
                  Configure o fechamento automático de tickets por inatividade
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={carregarDados}
                  disabled={loading}
                  className="p-2 text-[#9333EA] hover:bg-[#9333EA]/10 rounded-lg transition-colors disabled:opacity-50"
                  title="Recarregar"
                >
                  <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Card: Status Atual */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Status Atual
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">
                    {formData.ativo ? 'ATIVO' : 'INATIVO'}
                  </p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    {formData.ativo ? 'Monitoramento funcionando' : 'Monitoramento pausado'}
                  </p>
                </div>
                <div
                  className={`h-12 w-12 rounded-2xl ${formData.ativo ? 'bg-green-500/10' : 'bg-gray-500/10'} flex items-center justify-center shadow-sm`}
                >
                  <CheckCircle
                    className={`h-6 w-6 ${formData.ativo ? 'text-green-600' : 'text-gray-600'}`}
                  />
                </div>
              </div>
            </div>

            {/* Card: Timeout Configurado */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Tempo de Inatividade
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">
                    {formatarTempo(formData.timeoutMinutos)}
                  </p>
                  <p className="mt-3 text-sm text-[#002333]/70">Após este período sem atividade</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#9333EA]/10 flex items-center justify-center shadow-sm">
                  <Clock className="h-6 w-6 text-[#9333EA]" />
                </div>
              </div>
            </div>

            {/* Card: Aviso Prévio */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Aviso Prévio
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">
                    {formData.enviarAviso
                      ? formatarTempo(formData.avisoMinutosAntes)
                      : 'Desativado'}
                  </p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    {formData.enviarAviso ? 'Antes do fechamento' : 'Sem aviso prévio'}
                  </p>
                </div>
                <div
                  className={`h-12 w-12 rounded-2xl ${formData.enviarAviso ? 'bg-yellow-500/10' : 'bg-gray-500/10'} flex items-center justify-center shadow-sm`}
                >
                  <AlertCircle
                    className={`h-6 w-6 ${formData.enviarAviso ? 'text-yellow-600' : 'text-gray-600'}`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Mensagens de feedback */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800 whitespace-pre-line">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-3 text-red-600 hover:text-red-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
              <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-green-800 whitespace-pre-line">{success}</p>
              </div>
              <button
                onClick={() => setSuccess(null)}
                className="ml-3 text-green-600 hover:text-green-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Seletor de Modo (Global vs Departamento) */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-xl font-bold text-[#002333] mb-4 flex items-center">
              <Settings className="h-6 w-6 mr-2 text-[#9333EA]" />
              Escopo da Configuração
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Opção: Global */}
              <button
                onClick={() => {
                  setModoConfig('global');
                  setDepartamentoSelecionado('');
                }}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  modoConfig === 'global'
                    ? 'border-[#9333EA] bg-[#9333EA]/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start">
                  <Building2
                    className={`h-6 w-6 mr-3 ${modoConfig === 'global' ? 'text-[#9333EA]' : 'text-gray-400'}`}
                  />
                  <div>
                    <h3 className="font-semibold text-[#002333]">Global (Empresa)</h3>
                    <p className="text-sm text-gray-600 mt-1">Aplica-se a todos os departamentos</p>
                  </div>
                </div>
              </button>

              {/* Opção: Departamento Específico */}
              <button
                onClick={() => setModoConfig('departamento')}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  modoConfig === 'departamento'
                    ? 'border-[#9333EA] bg-[#9333EA]/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start">
                  <Users
                    className={`h-6 w-6 mr-3 ${modoConfig === 'departamento' ? 'text-[#9333EA]' : 'text-gray-400'}`}
                  />
                  <div>
                    <h3 className="font-semibold text-[#002333]">Por Departamento</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Regras específicas por departamento
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Dropdown de Departamentos */}
            {modoConfig === 'departamento' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-[#002333] mb-2">
                  Selecione o Departamento
                </label>
                <select
                  value={departamentoSelecionado}
                  onChange={(e) => setDepartamentoSelecionado(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
                >
                  <option value="">-- Selecione --</option>
                  {departamentos.map((depto) => (
                    <option key={depto.id} value={depto.id}>
                      {depto.nome} {(depto as any).temConfiguracao && '(configurado)'}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Formulário de Configuração */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-xl font-bold text-[#002333] mb-6 flex items-center">
              <Zap className="h-6 w-6 mr-2 text-[#9333EA]" />
              Configurações de Fechamento
            </h2>

            <div className="space-y-6">
              {/* Ativar/Desativar */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="font-medium text-[#002333]">Ativar Fechamento Automático</label>
                  <p className="text-sm text-gray-600 mt-1">
                    Tickets inativos serão fechados automaticamente
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.ativo}
                    onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#9333EA]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9333EA]"></div>
                </label>
              </div>

              {/* Tempo de Inatividade */}
              <div>
                <label className="block text-sm font-medium text-[#002333] mb-2">
                  Tempo de Inatividade (minutos)
                </label>
                <input
                  type="number"
                  min="5"
                  value={formData.timeoutMinutos}
                  onChange={(e) =>
                    setFormData({ ...formData, timeoutMinutos: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
                  placeholder="Ex: 1440 (24 horas)"
                />
                <p className="text-sm text-gray-600 mt-2">
                  ⏱️ Equivale a: <strong>{formatarTempo(formData.timeoutMinutos)}</strong>
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    onClick={() => setFormData({ ...formData, timeoutMinutos: 30 })}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    30 min
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, timeoutMinutos: 60 })}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    1 hora
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, timeoutMinutos: 120 })}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    2 horas
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, timeoutMinutos: 1440 })}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    24 horas
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, timeoutMinutos: 2880 })}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    48 horas
                  </button>
                </div>
              </div>

              {/* Enviar Aviso */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="font-medium text-[#002333]">
                    Enviar Aviso Antes do Fechamento
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    Notifica o cliente antes de fechar automaticamente
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enviarAviso}
                    onChange={(e) => setFormData({ ...formData, enviarAviso: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#9333EA]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9333EA]"></div>
                </label>
              </div>

              {/* Tempo do Aviso (condicional) */}
              {formData.enviarAviso && (
                <div>
                  <label className="block text-sm font-medium text-[#002333] mb-2">
                    Aviso com Antecedência (minutos)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.avisoMinutosAntes}
                    onChange={(e) =>
                      setFormData({ ...formData, avisoMinutosAntes: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
                    placeholder="Ex: 60 (1 hora antes)"
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    ⏱️ Equivale a: <strong>{formatarTempo(formData.avisoMinutosAntes)}</strong>
                  </p>
                </div>
              )}

              {/* Mensagem de Aviso */}
              {formData.enviarAviso && (
                <div>
                  <label className="block text-sm font-medium text-[#002333] mb-2">
                    <MessageSquare className="inline h-4 w-4 mr-1" />
                    Mensagem de Aviso
                  </label>
                  <textarea
                    value={formData.mensagemAviso || ''}
                    onChange={(e) => setFormData({ ...formData, mensagemAviso: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9333EA] focus:border-transparent resize-none"
                    placeholder="Mensagem enviada ao cliente antes do fechamento..."
                  />
                </div>
              )}

              {/* Mensagem de Fechamento */}
              <div>
                <label className="block text-sm font-medium text-[#002333] mb-2">
                  <MessageSquare className="inline h-4 w-4 mr-1" />
                  Mensagem de Fechamento
                </label>
                <textarea
                  value={formData.mensagemFechamento || ''}
                  onChange={(e) => setFormData({ ...formData, mensagemFechamento: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9333EA] focus:border-transparent resize-none"
                  placeholder="Mensagem enviada ao fechar o ticket..."
                />
              </div>

              {/* Status Aplicáveis */}
              <div>
                <label className="block text-sm font-medium text-[#002333] mb-3">
                  Status Aplicáveis
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {['AGUARDANDO', 'EM_ATENDIMENTO', 'PENDENTE', 'NOVO'].map((status) => (
                    <label
                      key={status}
                      className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.statusAplicaveis.includes(status)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              statusAplicaveis: [...formData.statusAplicaveis, status],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              statusAplicaveis: formData.statusAplicaveis.filter(
                                (s) => s !== status,
                              ),
                            });
                          }
                        }}
                        className="h-4 w-4 text-[#9333EA] focus:ring-[#9333EA] border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-[#002333]">{status}</span>
                    </label>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-2 flex items-start">
                  <Info className="h-4 w-4 mr-1 flex-shrink-0 mt-0.5" />
                  Selecione os status de tickets que devem ser monitorados
                </p>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-[#9333EA] text-white rounded-lg hover:bg-[#7E22CE] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Save className="h-5 w-5" />
                {saving ? 'Salvando...' : 'Salvar Configuração'}
              </button>

              <button
                onClick={handleVerificarAgora}
                disabled={testing || !formData.ativo}
                className="flex-1 px-4 py-3 bg-white text-[#9333EA] border border-[#9333EA] rounded-lg hover:bg-[#9333EA]/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
                title={
                  !formData.ativo ? 'Ative a configuração primeiro' : 'Executar verificação agora'
                }
              >
                <Play className="h-5 w-5" />
                {testing ? 'Verificando...' : 'Verificar Agora (Teste)'}
              </button>
            </div>

            {!formData.ativo && (
              <p className="mt-3 text-sm text-yellow-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                Ative a configuração para habilitar o teste manual
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FechamentoAutomaticoPage;
