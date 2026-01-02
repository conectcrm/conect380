import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Settings,
  CheckCircle,
  AlertCircle,
  X,
  Package,
  Users,
  ShoppingCart,
  DollarSign,
  LayoutDashboard,
  Wrench,
  BarChart3,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { BackToNucleus } from '../components/navigation/BackToNucleus';
import adminModulosService, {
  ModuloEmpresa,
  CreateModuloDto,
  UpdateModuloDto,
  LimitesModulo,
} from '../services/adminModulosService';

// Configuração dos módulos disponíveis
const MODULOS_CONFIG = [
  {
    id: 'crm',
    nome: 'CRM',
    descricao: 'Gestão de clientes, leads e relacionamento',
    icone: Users,
    cor: '#159A9C',
  },
  {
    id: 'atendimento',
    nome: 'Atendimento',
    descricao: 'Sistema de tickets e suporte ao cliente',
    icone: Package,
    cor: '#9333EA',
  },
  {
    id: 'comercial',
    nome: 'Comercial',
    descricao: 'Gestão de vendas, propostas e cotações',
    icone: ShoppingCart,
    cor: '#159A9C',
  },
  {
    id: 'financeiro',
    nome: 'Financeiro',
    descricao: 'Controle financeiro e faturamento',
    icone: DollarSign,
    cor: '#16A34A',
  },
  {
    id: 'produtos',
    nome: 'Produtos',
    descricao: 'Catálogo de produtos e serviços',
    icone: LayoutDashboard,
    cor: '#159A9C',
  },
  {
    id: 'configuracoes',
    nome: 'Configurações',
    descricao: 'Configurações gerais do sistema',
    icone: Wrench,
    cor: '#6B7280',
  },
];

const GestaoModulosPage: React.FC = () => {
  const { empresaId } = useParams<{ empresaId: string }>();

  // Estados principais
  const [modulos, setModulos] = useState<ModuloEmpresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de UI
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [configuringModulo, setConfiguringModulo] = useState<ModuloEmpresa | null>(null);
  const [configurandoModuloId, setConfigurandoModuloId] = useState<string | null>(null);

  // Form state para configuração de limites
  const [limites, setLimites] = useState<LimitesModulo>({
    usuarios: 0,
    leads: 0,
    storage_mb: 0,
    api_calls_dia: 0,
    whatsapp_conexoes: 0,
    email_envios_dia: 0,
  });

  useEffect(() => {
    if (empresaId) {
      carregarModulos();
    }
  }, [empresaId]);

  const carregarModulos = async () => {
    try {
      setLoading(true);
      setError(null);
      const dados = await adminModulosService.listarModulos(empresaId!);
      setModulos(Array.isArray(dados) ? dados : []);
    } catch (err: unknown) {
      console.error('Erro ao carregar módulos:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao carregar módulos');
      setModulos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleModulo = async (moduloId: string, ativo: boolean) => {
    try {
      setError(null);
      setConfigurandoModuloId(moduloId);

      if (ativo) {
        // Ativar módulo
        const dto: CreateModuloDto = {
          modulo: moduloId as any,
          ativo: true,
        };
        await adminModulosService.ativarModulo(empresaId!, dto);
      } else {
        // Desativar módulo
        await adminModulosService.desativarModulo(empresaId!, moduloId);
      }

      await carregarModulos();
    } catch (err: unknown) {
      console.error('Erro ao alternar módulo:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao alternar módulo');
    } finally {
      setConfigurandoModuloId(null);
    }
  };

  const handleOpenConfigDialog = (modulo: ModuloEmpresa) => {
    setConfiguringModulo(modulo);
    setLimites({
      usuarios: modulo.limites.usuarios || 0,
      leads: modulo.limites.leads || 0,
      storage_mb: modulo.limites.storage_mb || 0,
      api_calls_dia: modulo.limites.api_calls_dia || 0,
      whatsapp_conexoes: modulo.limites.whatsapp_conexoes || 0,
      email_envios_dia: modulo.limites.email_envios_dia || 0,
    });
    setShowConfigDialog(true);
  };

  const handleSaveLimites = async () => {
    if (!configuringModulo) return;

    try {
      setError(null);
      const dto: UpdateModuloDto = {
        limites,
      };
      await adminModulosService.atualizarModulo(empresaId!, configuringModulo.modulo, dto);
      setShowConfigDialog(false);
      setConfiguringModulo(null);
      await carregarModulos();
    } catch (err: unknown) {
      console.error('Erro ao salvar limites:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao salvar limites');
    }
  };

  // Calcular progresso de uso
  const calcularProgresso = (uso: number, limite: number): number => {
    if (!limite) return 0;
    return Math.min((uso / limite) * 100, 100);
  };

  const getCorProgresso = (progresso: number): string => {
    if (progresso >= 95) return 'bg-red-500';
    if (progresso >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Métricas para dashboard cards
  const totalModulos = MODULOS_CONFIG.length;
  const modulosAtivos = modulos.filter((m) => m.ativo).length;
  const modulosInativos = totalModulos - modulosAtivos;

  // Verificar se módulo está ativo
  const isModuloAtivo = (moduloId: string): boolean => {
    return modulos.some((m) => m.modulo === moduloId && m.ativo);
  };

  // Obter dados do módulo
  const getModuloData = (moduloId: string): ModuloEmpresa | undefined => {
    return modulos.find((m) => m.modulo === moduloId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com Breadcrumb */}
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus nucleusName="Administrativo" nucleusPath="/admin/empresas" />
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header da Página */}
          <div className="bg-white rounded-lg shadow-sm border mb-6">
            <div className="px-6 py-6">
              <div className="flex flex-col sm:flex-row justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-[#002333] flex items-center">
                    <Package className="h-8 w-8 mr-3 text-[#159A9C]" />
                    Gestão de Módulos
                    {loading && (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#159A9C] ml-3"></div>
                    )}
                  </h1>
                  <p className="mt-2 text-[#B4BEC9]">
                    {loading
                      ? 'Carregando...'
                      : `Ative e configure os ${totalModulos} módulos disponíveis`}
                  </p>
                </div>
                <div className="mt-4 sm:mt-0 flex items-center gap-3">
                  <button
                    onClick={carregarModulos}
                    disabled={loading}
                    className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`}
                    />
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
                    Total de Módulos
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">{totalModulos}</p>
                  <p className="mt-3 text-sm text-[#002333]/70">Módulos disponíveis no sistema.</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                  <Package className="h-6 w-6 text-[#159A9C]" />
                </div>
              </div>
            </div>

            {/* Card 2 - Ativos */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Módulos Ativos
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">{modulosAtivos}</p>
                  <p className="mt-3 text-sm text-[#002333]/70">Módulos ativos e operacionais.</p>
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
                    Módulos Inativos
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">{modulosInativos}</p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    Módulos desativados ou não configurados.
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-gray-500/10 flex items-center justify-center shadow-sm">
                  <AlertCircle className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </div>

            {/* Card 4 - Taxa de Ativação */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Taxa de Ativação
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">
                    {totalModulos > 0 ? Math.round((modulosAtivos / totalModulos) * 100) : 0}%
                  </p>
                  <p className="mt-3 text-sm text-[#002333]/70">Percentual de módulos em uso.</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                  <BarChart3 className="h-6 w-6 text-[#159A9C]" />
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

          {/* Grid de Módulos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MODULOS_CONFIG.map((moduloConfig) => {
              const ativo = isModuloAtivo(moduloConfig.id);
              const moduloData = getModuloData(moduloConfig.id);
              const Icone = moduloConfig.icone;
              const isConfigurando = configurandoModuloId === moduloConfig.id;

              return (
                <div
                  key={moduloConfig.id}
                  className={`bg-white rounded-lg shadow-sm border hover:shadow-lg transition-all duration-300 ${
                    ativo ? 'border-green-200' : ''
                  }`}
                >
                  <div className="p-6">
                    {/* Header do Card */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md flex-shrink-0"
                          style={{ backgroundColor: moduloConfig.cor }}
                        >
                          <Icone className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {moduloConfig.nome}
                          </h3>
                        </div>
                      </div>

                      {/* Toggle Switch */}
                      <button
                        onClick={() => handleToggleModulo(moduloConfig.id, !ativo)}
                        disabled={isConfigurando}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#159A9C] focus:ring-offset-2 ${
                          ativo ? 'bg-green-500' : 'bg-gray-300'
                        } ${isConfigurando ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            ativo ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Status Badge */}
                    <div className="mb-4">
                      {ativo ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Inativo
                        </span>
                      )}
                    </div>

                    {/* Descrição */}
                    <p className="text-sm text-gray-600 mb-4">{moduloConfig.descricao}</p>

                    {/* Informações de Uso (se ativo) */}
                    {ativo && moduloData && (
                      <div className="space-y-3 mb-4">
                        {/* Usuários */}
                        {moduloData.limites.usuarios && (
                          <div>
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Usuários</span>
                              <span>
                                {moduloData.uso_atual.usuarios || 0} / {moduloData.limites.usuarios}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${getCorProgresso(
                                  calcularProgresso(
                                    moduloData.uso_atual.usuarios || 0,
                                    moduloData.limites.usuarios,
                                  ),
                                )}`}
                                style={{
                                  width: `${calcularProgresso(
                                    moduloData.uso_atual.usuarios || 0,
                                    moduloData.limites.usuarios,
                                  )}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        )}

                        {/* Storage */}
                        {moduloData.limites.storage_mb && (
                          <div>
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Armazenamento</span>
                              <span>
                                {moduloData.uso_atual.storage_mb || 0} MB /{' '}
                                {moduloData.limites.storage_mb} MB
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${getCorProgresso(
                                  calcularProgresso(
                                    moduloData.uso_atual.storage_mb || 0,
                                    moduloData.limites.storage_mb,
                                  ),
                                )}`}
                                style={{
                                  width: `${calcularProgresso(
                                    moduloData.uso_atual.storage_mb || 0,
                                    moduloData.limites.storage_mb,
                                  )}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Botão Configurar (se ativo) */}
                    {ativo && moduloData && (
                      <button
                        onClick={() => handleOpenConfigDialog(moduloData)}
                        className="w-full px-4 py-2 bg-[#159A9C] hover:bg-[#0F7B7D] text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-medium"
                      >
                        <Settings className="h-4 w-4" />
                        Configurar Limites
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal de Configuração de Limites */}
      {showConfigDialog && configuringModulo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Configurar Limites - {configuringModulo.modulo.toUpperCase()}
              </h2>
              <button
                onClick={() => {
                  setShowConfigDialog(false);
                  setConfiguringModulo(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Usuários */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Limite de Usuários
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                  value={limites.usuarios}
                  onChange={(e) =>
                    setLimites({ ...limites, usuarios: parseInt(e.target.value) || 0 })
                  }
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Uso atual: {configuringModulo.uso_atual.usuarios || 0}
                </p>
              </div>

              {/* Leads */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Limite de Leads
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                  value={limites.leads}
                  onChange={(e) => setLimites({ ...limites, leads: parseInt(e.target.value) || 0 })}
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Uso atual: {configuringModulo.uso_atual.leads || 0}
                </p>
              </div>

              {/* Storage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Limite de Armazenamento (MB)
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                  value={limites.storage_mb}
                  onChange={(e) =>
                    setLimites({ ...limites, storage_mb: parseInt(e.target.value) || 0 })
                  }
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Uso atual: {configuringModulo.uso_atual.storage_mb || 0} MB
                </p>
              </div>

              {/* API Calls */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Limite de Chamadas API por Dia
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                  value={limites.api_calls_dia}
                  onChange={(e) =>
                    setLimites({
                      ...limites,
                      api_calls_dia: parseInt(e.target.value) || 0,
                    })
                  }
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Uso atual: {configuringModulo.uso_atual.api_calls_dia || 0}
                </p>
              </div>

              {/* WhatsApp */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Limite de Conexões WhatsApp
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                  value={limites.whatsapp_conexoes}
                  onChange={(e) =>
                    setLimites({
                      ...limites,
                      whatsapp_conexoes: parseInt(e.target.value) || 0,
                    })
                  }
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Uso atual: {configuringModulo.uso_atual.whatsapp_conexoes || 0}
                </p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Limite de Envios de Email por Dia
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                  value={limites.email_envios_dia}
                  onChange={(e) =>
                    setLimites({
                      ...limites,
                      email_envios_dia: parseInt(e.target.value) || 0,
                    })
                  }
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Uso atual: {configuringModulo.uso_atual.email_envios_dia || 0}
                </p>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowConfigDialog(false);
                  setConfiguringModulo(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveLimites}
                className="flex-1 px-4 py-2 bg-[#159A9C] hover:bg-[#0F7B7D] text-white rounded-lg transition-colors"
              >
                Salvar Limites
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestaoModulosPage;
