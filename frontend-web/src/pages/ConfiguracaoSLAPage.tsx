import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  Settings,
  AlertCircle,
  Bell,
} from 'lucide-react';
import { BackToNucleus } from '../components/navigation/BackToNucleus';
import slaService, {
  SlaConfig,
  CreateSlaConfigDto,
  UpdateSlaConfigDto,
  HorarioFuncionamento,
} from '../services/slaService';
import { useGlobalConfirmation } from '../contexts/GlobalConfirmationContext';
import { FiltersBar, InlineStats, PageHeader, SectionCard } from '../components/layout-v2';

const ConfiguracaoSLAPage: React.FC = () => {
  const { confirm } = useGlobalConfirmation();
  const [configs, setConfigs] = useState<SlaConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPrioridade, setFilterPrioridade] = useState<string>('todas');
  const [filterCanal, setFilterCanal] = useState<string>('todos');
  const [filterAtivo, setFilterAtivo] = useState<string>('todos');
  const [showModal, setShowModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SlaConfig | null>(null);
  const [formData, setFormData] = useState<CreateSlaConfigDto>({
    nome: '',
    descricao: '',
    prioridade: 'normal',
    canal: '',
    tempoRespostaMinutos: 60,
    tempoResolucaoMinutos: 480,
    alertaPercentual: 80,
    notificarEmail: true,
    notificarSistema: true,
    ativo: true,
  });
  const [horariosFuncionamento, setHorariosFuncionamento] = useState<HorarioFuncionamento>({
    segunda: { ativo: true, inicio: '09:00', fim: '18:00' },
    terca: { ativo: true, inicio: '09:00', fim: '18:00' },
    quarta: { ativo: true, inicio: '09:00', fim: '18:00' },
    quinta: { ativo: true, inicio: '09:00', fim: '18:00' },
    sexta: { ativo: true, inicio: '09:00', fim: '18:00' },
    sabado: { ativo: false, inicio: '09:00', fim: '13:00' },
    domingo: { ativo: false, inicio: '09:00', fim: '13:00' },
  });

  // Carregar configurações
  const carregarConfigs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const dados = await slaService.listarConfigs();
      setConfigs(dados);
    } catch (err: unknown) {
      console.error('Erro ao carregar configurações SLA:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar configurações SLA');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarConfigs();
  }, [carregarConfigs]);

  // Filtrar configurações
  const configsFiltradas = configs.filter((config) => {
    const matchNome = config.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchPrioridade = filterPrioridade === 'todas' || config.prioridade === filterPrioridade;
    const matchCanal = filterCanal === 'todos' || config.canal === filterCanal;
    const matchAtivo =
      filterAtivo === 'todos' || (filterAtivo === 'ativo' ? config.ativo : !config.ativo);
    return matchNome && matchPrioridade && matchCanal && matchAtivo;
  });

  // KPIs
  const totalConfigs = configs.length;
  const configsAtivas = configs.filter((c) => c.ativo).length;
  const configMaisRestritiva = configs
    .filter((c) => c.ativo)
    .sort((a, b) => a.tempoResolucaoMinutos - b.tempoResolucaoMinutos)[0];

  // Abrir modal para criar
  const abrirModalCriar = () => {
    setEditingConfig(null);
    setFormData({
      nome: '',
      descricao: '',
      prioridade: 'normal',
      canal: '',
      tempoRespostaMinutos: 60,
      tempoResolucaoMinutos: 480,
      alertaPercentual: 80,
      notificarEmail: true,
      notificarSistema: true,
      ativo: true,
    });
    setHorariosFuncionamento({
      segunda: { ativo: true, inicio: '09:00', fim: '18:00' },
      terca: { ativo: true, inicio: '09:00', fim: '18:00' },
      quarta: { ativo: true, inicio: '09:00', fim: '18:00' },
      quinta: { ativo: true, inicio: '09:00', fim: '18:00' },
      sexta: { ativo: true, inicio: '09:00', fim: '18:00' },
      sabado: { ativo: false, inicio: '09:00', fim: '13:00' },
      domingo: { ativo: false, inicio: '09:00', fim: '13:00' },
    });
    setShowModal(true);
  };

  // Abrir modal para editar
  const abrirModalEditar = (config: SlaConfig) => {
    setEditingConfig(config);
    setFormData({
      nome: config.nome,
      descricao: config.descricao || '',
      prioridade: config.prioridade,
      canal: config.canal || '',
      tempoRespostaMinutos: config.tempoRespostaMinutos,
      tempoResolucaoMinutos: config.tempoResolucaoMinutos,
      alertaPercentual: config.alertaPercentual,
      notificarEmail: config.notificarEmail,
      notificarSistema: config.notificarSistema,
      ativo: config.ativo,
    });
    if (config.horariosFuncionamento) {
      setHorariosFuncionamento(config.horariosFuncionamento);
    }
    setShowModal(true);
  };

  // Salvar (criar ou atualizar)
  const handleSalvar = async () => {
    try {
      // Validações
      if (!formData.nome || formData.nome.trim() === '') {
        alert('Nome é obrigatório!');
        return;
      }

      if (formData.tempoRespostaMinutos <= 0) {
        alert('Tempo de resposta deve ser maior que 0!');
        return;
      }

      if (formData.tempoResolucaoMinutos <= 0) {
        alert('Tempo de resolução deve ser maior que 0!');
        return;
      }

      if (formData.tempoRespostaMinutos >= formData.tempoResolucaoMinutos) {
        alert('Tempo de resposta deve ser menor que tempo de resolução!');
        return;
      }

      // Garantir que os tempos sejam números inteiros
      const dto: CreateSlaConfigDto | UpdateSlaConfigDto = {
        ...formData,
        nome: formData.nome.trim(),
        tempoRespostaMinutos: Number(formData.tempoRespostaMinutos),
        tempoResolucaoMinutos: Number(formData.tempoResolucaoMinutos),
        alertaPercentual: Number(formData.alertaPercentual),
        horariosFuncionamento: horariosFuncionamento,
      };

      // Log para debugging
      console.log('📤 Enviando DTO para backend:', JSON.stringify(dto, null, 2));

      if (editingConfig) {
        await slaService.atualizarConfig(editingConfig.id, dto as UpdateSlaConfigDto);
      } else {
        await slaService.criarConfig(dto as CreateSlaConfigDto);
      }

      setShowModal(false);
      carregarConfigs();
    } catch (err: unknown) {
      console.error('Erro ao salvar configuração SLA:', err);
      // Extrair mensagem de erro do backend
      const errorMessage =
        (err as any)?.response?.data?.message ||
        (err instanceof Error ? err.message : 'Erro ao salvar configuração SLA');

      // Se for um array de mensagens, juntar em uma string
      const finalMessage = Array.isArray(errorMessage) ? errorMessage.join('\n') : errorMessage;

      alert(finalMessage);
    }
  };

  // Deletar
  const handleDeletar = async (id: string) => {
    if (!(await confirm('Tem certeza que deseja deletar esta configuração SLA?'))) {
      return;
    }

    try {
      await slaService.deletarConfig(id);
      carregarConfigs();
    } catch (err: unknown) {
      console.error('Erro ao deletar configuração SLA:', err);
      alert(err instanceof Error ? err.message : 'Erro ao deletar configuração SLA');
    }
  };

  // Converter minutos para horas/minutos
  const formatarTempo = (minutos: number): string => {
    if (minutos < 60) return `${minutos}m`;
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return mins > 0 ? `${horas}h ${mins}m` : `${horas}h`;
  };

  // Badge de prioridade
  const badgePrioridade = (prioridade: string) => {
    const colors = {
      baixa: 'bg-gray-100 text-gray-800',
      normal: 'bg-blue-100 text-blue-800',
      alta: 'bg-yellow-100 text-yellow-800',
      urgente: 'bg-red-100 text-red-800',
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[prioridade as keyof typeof colors]}`}
      >
        {prioridade.charAt(0).toUpperCase() + prioridade.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-4 pt-1 sm:pt-2">
      {/* Header com BackToNucleus */}
      <div className="px-2 sm:px-0">
        <SectionCard className="px-4 py-3">
          <BackToNucleus nucleusName="Atendimento" nucleusPath="/nuclei/atendimento" />
        </SectionCard>
      </div>

      <div className="px-2 sm:px-0">
        <div className="max-w-7xl mx-auto">
          {/* Header da página */}
          <SectionCard className="mb-6 space-y-4 p-4 sm:p-5">
            <PageHeader
              title={
                <span className="inline-flex items-center gap-2">
                  <Settings className="h-5 w-5 text-[#159A9C]" />
                  <span>Configurações de SLA</span>
                </span>
              }
              description="Gerencie configurações de SLA por prioridade e canal."
              actions={
                <button
                  onClick={abrirModalCriar}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#159A9C] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#0F7B7D]"
                >
                  <Plus className="h-4 w-4" />
                  Nova Configuração
                </button>
              }
            />
            {!loading && (
              <InlineStats
                compact
                stats={[
                  { label: 'Total de configurações', value: String(totalConfigs), tone: 'neutral' },
                  { label: 'Configurações ativas', value: String(configsAtivas), tone: 'accent' },
                  {
                    label: 'Mais restritiva',
                    value: configMaisRestritiva
                      ? formatarTempo(configMaisRestritiva.tempoResolucaoMinutos)
                      : '-',
                    tone: 'warning',
                  },
                ]}
              />
            )}
          </SectionCard>

          {/* Barra de busca e filtros */}
          <FiltersBar className="mb-6 p-4">
            <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#385A6A]">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AAEB8]" />
                  <input
                    type="text"
                    placeholder="Buscar por nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white pl-10 pr-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#385A6A]">Prioridade</label>
                <select
                  value={filterPrioridade}
                  onChange={(e) => setFilterPrioridade(e.target.value)}
                  className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                >
                  <option value="todas">Todas as Prioridades</option>
                  <option value="baixa">Baixa</option>
                  <option value="normal">Normal</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#385A6A]">Canal</label>
                <select
                  value={filterCanal}
                  onChange={(e) => setFilterCanal(e.target.value)}
                  className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                >
                  <option value="todos">Todos os Canais</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                  <option value="chat">Chat</option>
                  <option value="telefone">Telefone</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#385A6A]">Status</label>
                <select
                  value={filterAtivo}
                  onChange={(e) => setFilterAtivo(e.target.value)}
                  className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                >
                  <option value="todos">Todos os Status</option>
                  <option value="ativo">Ativos</option>
                  <option value="inativo">Inativos</option>
                </select>
              </div>
            </div>
          </FiltersBar>

          {/* Estados: Loading, Error, Empty */}
          {loading && (
            <SectionCard className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#159A9C] mx-auto"></div>
              <p className="mt-4 text-[#002333]/70">Carregando configurações...</p>
            </SectionCard>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && configsFiltradas.length === 0 && (
            <SectionCard className="p-12 text-center">
              <Settings className="h-16 w-16 text-[#B4BEC9] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#002333] mb-2">
                {configs.length === 0
                  ? 'Nenhuma configuração cadastrada'
                  : 'Nenhuma configuração encontrada'}
              </h3>
              <p className="text-[#002333]/70 mb-6">
                {configs.length === 0
                  ? 'Crie sua primeira configuração de SLA para começar'
                  : 'Tente ajustar os filtros de busca'}
              </p>
              {configs.length === 0 && (
                <button
                  onClick={abrirModalCriar}
                  className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors text-sm font-medium"
                >
                  <Plus className="h-4 w-4 inline mr-2" />
                  Criar Primeira Configuração
                </button>
              )}
            </SectionCard>
          )}

          {/* Grid de Configurações */}
          {!loading && !error && configsFiltradas.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {configsFiltradas.map((config) => (
                <SectionCard
                  key={config.id}
                  className="p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-[#002333] mb-1">{config.nome}</h3>
                      {config.descricao && (
                        <p className="text-sm text-[#002333]/70 mb-2">{config.descricao}</p>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        {badgePrioridade(config.prioridade)}
                        {config.canal && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#159A9C]/10 text-[#159A9C]">
                            {config.canal}
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                        >
                          {config.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-2">
                      <button
                        onClick={() => abrirModalEditar(config)}
                        className="p-2 text-[#159A9C] hover:bg-[#159A9C]/10 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeletar(config.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Deletar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#002333]/70">Tempo Resposta:</span>
                      <span className="text-sm font-semibold text-[#002333]">
                        {formatarTempo(config.tempoRespostaMinutos)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#002333]/70">Tempo Resolução:</span>
                      <span className="text-sm font-semibold text-[#002333]">
                        {formatarTempo(config.tempoResolucaoMinutos)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#002333]/70">Alerta em:</span>
                      <span className="text-sm font-semibold text-[#002333]">
                        {config.alertaPercentual}%
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      {config.notificarEmail && (
                        <span className="flex items-center text-[#002333]/70">
                          <Bell className="h-3 w-3 mr-1" />
                          Email
                        </span>
                      )}
                      {config.notificarSistema && (
                        <span className="flex items-center text-[#002333]/70">
                          <Bell className="h-3 w-3 mr-1" />
                          Sistema
                        </span>
                      )}
                    </div>
                  </div>
                </SectionCard>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Criar/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#002333]">
                {editingConfig ? 'Editar Configuração SLA' : 'Nova Configuração SLA'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-[#002333]/70 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Nome e Descrição */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#002333] mb-1">Nome *</label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                    placeholder="Ex: SLA Urgente WhatsApp"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#002333] mb-1">Descrição</label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                    rows={2}
                    placeholder="Descrição opcional"
                  />
                </div>
              </div>

              {/* Prioridade e Canal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#002333] mb-1">
                    Prioridade *
                  </label>
                  <select
                    value={formData.prioridade}
                    onChange={(e) =>
                      setFormData({ ...formData, prioridade: e.target.value as any })
                    }
                    className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="normal">Normal</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#002333] mb-1">
                    Canal (opcional)
                  </label>
                  <select
                    value={formData.canal}
                    onChange={(e) => setFormData({ ...formData, canal: e.target.value })}
                    className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                  >
                    <option value="">Todos</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                    <option value="chat">Chat</option>
                    <option value="telefone">Telefone</option>
                  </select>
                </div>
              </div>

              {/* Tempos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#002333] mb-1">
                    Tempo de Resposta (minutos) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.tempoRespostaMinutos}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tempoRespostaMinutos: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                  />
                  <p className="text-xs text-[#002333]/70 mt-1">
                    {formatarTempo(formData.tempoRespostaMinutos)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#002333] mb-1">
                    Tempo de Resolução (minutos) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.tempoResolucaoMinutos}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tempoResolucaoMinutos: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                  />
                  <p className="text-xs text-[#002333]/70 mt-1">
                    {formatarTempo(formData.tempoResolucaoMinutos)}
                  </p>
                </div>
              </div>

              {/* Horários de Funcionamento */}
              <div>
                <label className="block text-sm font-medium text-[#002333] mb-3">
                  Horários de Funcionamento
                </label>
                <div className="space-y-2">
                  {Object.entries(horariosFuncionamento).map(([dia, config]) => (
                    <div key={dia} className="flex items-center gap-4">
                      <label className="flex items-center gap-2 w-24">
                        <input
                          type="checkbox"
                          checked={config.ativo}
                          onChange={(e) =>
                            setHorariosFuncionamento({
                              ...horariosFuncionamento,
                              [dia]: { ...config, ativo: e.target.checked },
                            })
                          }
                          className="rounded border-[#B4BEC9] text-[#159A9C] focus:ring-[#159A9C]"
                        />
                        <span className="text-sm text-[#002333] capitalize">{dia}</span>
                      </label>
                      {config.ativo && (
                        <>
                          <input
                            type="time"
                            value={config.inicio}
                            onChange={(e) =>
                              setHorariosFuncionamento({
                                ...horariosFuncionamento,
                                [dia]: { ...config, inicio: e.target.value },
                              })
                            }
                            className="px-3 py-1 border border-[#B4BEC9] rounded-lg text-sm"
                          />
                          <span className="text-sm text-[#002333]/70">até</span>
                          <input
                            type="time"
                            value={config.fim}
                            onChange={(e) =>
                              setHorariosFuncionamento({
                                ...horariosFuncionamento,
                                [dia]: { ...config, fim: e.target.value },
                              })
                            }
                            className="px-3 py-1 border border-[#B4BEC9] rounded-lg text-sm"
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Alerta e Notificações */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#002333] mb-1">
                    Alerta em (%) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.alertaPercentual}
                    onChange={(e) =>
                      setFormData({ ...formData, alertaPercentual: parseInt(e.target.value) || 80 })
                    }
                    className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                  />
                  <p className="text-xs text-[#002333]/70 mt-1">
                    Alerta será gerado quando atingir {formData.alertaPercentual}% do tempo limite
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.notificarEmail}
                      onChange={(e) =>
                        setFormData({ ...formData, notificarEmail: e.target.checked })
                      }
                      className="rounded border-[#B4BEC9] text-[#159A9C] focus:ring-[#159A9C]"
                    />
                    <span className="text-sm text-[#002333]">Notificar por Email</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.notificarSistema}
                      onChange={(e) =>
                        setFormData({ ...formData, notificarSistema: e.target.checked })
                      }
                      className="rounded border-[#B4BEC9] text-[#159A9C] focus:ring-[#159A9C]"
                    />
                    <span className="text-sm text-[#002333]">Notificar no Sistema</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.ativo}
                      onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                      className="rounded border-[#B4BEC9] text-[#159A9C] focus:ring-[#159A9C]"
                    />
                    <span className="text-sm text-[#002333]">Ativo</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-white text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvar}
                className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors text-sm font-medium"
              >
                {editingConfig ? 'Salvar Alterações' : 'Criar Configuração'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfiguracaoSLAPage;
