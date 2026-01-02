import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  RefreshCw,
  AlertCircle,
  Edit2,
  Trash2,
  PlayCircle,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Phone,
  User,
  Calendar,
} from 'lucide-react';
import { BackToNucleus } from '../components/navigation/BackToNucleus';
import demandaService, {
  Demanda,
  StatusDemanda,
  TipoDemanda,
  PrioridadeDemanda,
  tipoLabels,
  statusLabels,
  prioridadeLabels,
  tipoColors,
  statusColors,
  prioridadeColors,
} from '../services/demandaService';
import toast from 'react-hot-toast';

export default function DemandaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Estados
  const [demanda, setDemanda] = useState<Demanda | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);
  const [processando, setProcessando] = useState(false);

  // Formulário de edição
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    tipo: 'suporte' as TipoDemanda,
    prioridade: 'media' as PrioridadeDemanda,
  });

  // Carregar demanda
  useEffect(() => {
    if (!id) {
      setError('ID da demanda não fornecido');
      setLoading(false);
      return;
    }
    carregarDemanda();
  }, [id]);

  const carregarDemanda = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const dados = await demandaService.buscarPorId(id);
      setDemanda(dados);
      setFormData({
        titulo: dados.titulo,
        descricao: dados.descricao || '',
        tipo: dados.tipo,
        prioridade: dados.prioridade,
      });
    } catch (err: any) {
      console.error('Erro ao carregar demanda:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar demanda';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Ações de status
  const handleIniciar = async () => {
    if (!demanda) return;
    try {
      setProcessando(true);
      await demandaService.iniciar(demanda.id);
      toast.success('Demanda iniciada!');
      await carregarDemanda();
    } catch (err: any) {
      toast.error('Erro ao iniciar demanda');
    } finally {
      setProcessando(false);
    }
  };

  const handleConcluir = async () => {
    if (!demanda) return;
    try {
      setProcessando(true);
      await demandaService.concluir(demanda.id);
      toast.success('Demanda concluída!');
      await carregarDemanda();
    } catch (err: any) {
      toast.error('Erro ao concluir demanda');
    } finally {
      setProcessando(false);
    }
  };

  const handleCancelar = async () => {
    if (!demanda) return;
    if (!window.confirm('Tem certeza que deseja cancelar esta demanda?')) return;

    try {
      setProcessando(true);
      await demandaService.cancelar(demanda.id);
      toast.success('Demanda cancelada!');
      await carregarDemanda();
    } catch (err: any) {
      toast.error('Erro ao cancelar demanda');
    } finally {
      setProcessando(false);
    }
  };

  const handleSalvarEdicao = async () => {
    if (!demanda) return;
    try {
      setProcessando(true);
      await demandaService.atualizar(demanda.id, formData);
      toast.success('Demanda atualizada!');
      setEditando(false);
      await carregarDemanda();
    } catch (err: any) {
      toast.error('Erro ao atualizar demanda');
    } finally {
      setProcessando(false);
    }
  };

  const handleDeletar = async () => {
    if (!demanda) return;
    if (!window.confirm('Tem certeza que deseja deletar esta demanda? Esta ação não pode ser desfeita.')) return;

    try {
      setProcessando(true);
      await demandaService.deletar(demanda.id);
      toast.success('Demanda deletada!');
      navigate('/nuclei/atendimento/demandas');
    } catch (err: any) {
      toast.error('Erro ao deletar demanda');
      setProcessando(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b px-6 py-4">
          <BackToNucleus nucleusName="Demandas" nucleusPath="/nuclei/atendimento/demandas" />
        </div>
        <div className="p-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 text-[#159A9C] animate-spin" />
              <span className="ml-3 text-[#002333]">Carregando demanda...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !demanda) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b px-6 py-4">
          <BackToNucleus nucleusName="Demandas" nucleusPath="/nuclei/atendimento/demandas" />
        </div>
        <div className="p-6">
          <div className="max-w-5xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Erro ao carregar demanda</p>
                <p className="text-sm text-red-700 mt-1">{error || 'Demanda não encontrada'}</p>
                <button
                  onClick={carregarDemanda}
                  className="mt-3 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus nucleusName="Demandas" nucleusPath="/nuclei/atendimento/demandas" />
      </div>

      {/* Container Principal */}
      <div className="p-6">
        <div className="max-w-5xl mx-auto">
          {/* Header da Demanda */}
          <div className="bg-white rounded-lg shadow-sm border mb-6 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                {editando ? (
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    className="text-3xl font-bold text-[#002333] w-full border border-[#B4BEC9] rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                  />
                ) : (
                  <h1 className="text-3xl font-bold text-[#002333] flex items-center">
                    <ClipboardList className="h-8 w-8 mr-3 text-[#159A9C]" />
                    {demanda.titulo}
                  </h1>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                {!editando ? (
                  <>
                    <button
                      onClick={() => setEditando(true)}
                      className="p-2 text-[#159A9C] hover:bg-[#159A9C]/10 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={handleDeletar}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Deletar"
                      disabled={processando}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleSalvarEdicao}
                      className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors text-sm font-medium"
                      disabled={processando}
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => {
                        setEditando(false);
                        setFormData({
                          titulo: demanda.titulo,
                          descricao: demanda.descricao || '',
                          tipo: demanda.tipo,
                          prioridade: demanda.prioridade,
                        });
                      }}
                      className="px-4 py-2 bg-white text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      Cancelar
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {editando ? (
                <>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value as TipoDemanda })}
                    className="px-3 py-1.5 border border-[#B4BEC9] rounded-lg text-sm focus:ring-2 focus:ring-[#159A9C]"
                  >
                    {(Object.keys(tipoLabels) as TipoDemanda[]).map((key) => (
                      <option key={key} value={key}>
                        {tipoLabels[key]}
                      </option>
                    ))}
                  </select>
                  <select
                    value={formData.prioridade}
                    onChange={(e) => setFormData({ ...formData, prioridade: e.target.value as PrioridadeDemanda })}
                    className="px-3 py-1.5 border border-[#B4BEC9] rounded-lg text-sm focus:ring-2 focus:ring-[#159A9C]"
                  >
                    {(Object.keys(prioridadeLabels) as PrioridadeDemanda[]).map((key) => (
                      <option key={key} value={key}>
                        {prioridadeLabels[key]}
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tipoColors[demanda.tipo]}`}>
                    {tipoLabels[demanda.tipo]}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[demanda.status]}`}>
                    {statusLabels[demanda.status]}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${prioridadeColors[demanda.prioridade]}`}>
                    {prioridadeLabels[demanda.prioridade]}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Grid Principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna Principal (2/3) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Descrição */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-[#002333] mb-4">Descrição</h2>
                {editando ? (
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent resize-none"
                    placeholder="Descreva a demanda..."
                  />
                ) : (
                  <p className="text-[#002333] whitespace-pre-wrap">
                    {demanda.descricao || 'Sem descrição'}
                  </p>
                )}
              </div>

              {/* Ações */}
              {!editando && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h2 className="text-lg font-semibold text-[#002333] mb-4">Ações</h2>
                  <div className="flex flex-wrap gap-3">
                    {demanda.status === 'aberta' && (
                      <button
                        onClick={handleIniciar}
                        className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors flex items-center gap-2 text-sm font-medium"
                        disabled={processando}
                      >
                        <PlayCircle className="h-4 w-4" />
                        Iniciar Atendimento
                      </button>
                    )}
                    {demanda.status === 'em_andamento' && (
                      <>
                        <button
                          onClick={handleConcluir}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium"
                          disabled={processando}
                        >
                          <CheckCircle className="h-4 w-4" />
                          Concluir
                        </button>
                        <button
                          onClick={() => demandaService.atualizarStatus(demanda.id, 'aguardando_cliente')}
                          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2 text-sm font-medium"
                          disabled={processando}
                        >
                          <Clock className="h-4 w-4" />
                          Aguardar Cliente
                        </button>
                      </>
                    )}
                    {demanda.status === 'aguardando_cliente' && (
                      <button
                        onClick={() => demandaService.atualizarStatus(demanda.id, 'em_andamento')}
                        className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors flex items-center gap-2 text-sm font-medium"
                        disabled={processando}
                      >
                        <PlayCircle className="h-4 w-4" />
                        Retomar Atendimento
                      </button>
                    )}
                    {demanda.status !== 'cancelada' && demanda.status !== 'concluida' && (
                      <button
                        onClick={handleCancelar}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm font-medium"
                        disabled={processando}
                      >
                        <XCircle className="h-4 w-4" />
                        Cancelar Demanda
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Coluna Lateral (1/3) */}
            <div className="space-y-6">
              {/* Informações */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-[#002333] mb-4">Informações</h2>
                <div className="space-y-3 text-sm">
                  {demanda.telefone && (
                    <div className="flex items-center gap-2 text-[#002333]">
                      <Phone className="h-4 w-4 text-[#B4BEC9]" />
                      <span>{demanda.telefone}</span>
                    </div>
                  )}
                  {demanda.responsavelId && (
                    <div className="flex items-center gap-2 text-[#002333]">
                      <User className="h-4 w-4 text-[#B4BEC9]" />
                      <span>Responsável: {demanda.responsavelId}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[#002333]">
                    <Calendar className="h-4 w-4 text-[#B4BEC9]" />
                    <span>Criada em {new Date(demanda.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                  {demanda.updatedAt !== demanda.createdAt && (
                    <div className="flex items-center gap-2 text-[#002333]">
                      <Calendar className="h-4 w-4 text-[#B4BEC9]" />
                      <span>Atualizada em {new Date(demanda.updatedAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Ticket Vinculado */}
              {demanda.ticketId && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h2 className="text-lg font-semibold text-[#002333] mb-4">Ticket de Origem</h2>
                  <button
                    onClick={() => {
                      // Navegar para inbox e abrir ticket
                      navigate('/atendimento/inbox');
                    }}
                    className="w-full px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Ver Ticket Original
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
