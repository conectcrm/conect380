import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cotacaoService } from '../../../services/cotacaoService';
import { Cotacao } from '../../../types/cotacaoTypes';
import toast from 'react-hot-toast';
import ModalAcaoLote from '../../../components/modals/ModalAcaoLote';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  User,
  Calendar,
  DollarSign,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { BackToNucleus } from '../../../components/navigation/BackToNucleus';
import ModalAprovarCotacao from '../../../components/modals/ModalAprovarCotacao';

function MinhasAprovacoesPage() {
  const navigate = useNavigate();
  const [cotacoes, setCotacoes] = useState<Cotacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [cotacaoSelecionada, setCotacaoSelecionada] = useState<Cotacao | null>(null);
  const [cotacoesSelecionadas, setCotacoesSelecionadas] = useState<Set<string>>(new Set());
  const [modalLoteAberto, setModalLoteAberto] = useState(false);
  const [tipoAcaoLote, setTipoAcaoLote] = useState<'aprovar' | 'reprovar'>('aprovar');

  useEffect(() => {
    carregarAprovacoes();
  }, []);

  const carregarAprovacoes = async () => {
    setCarregando(true);
    try {
      const dados = await cotacaoService.minhasAprovacoes();
      setCotacoes(dados);
    } catch (error: any) {
      console.error('Erro ao carregar aprovações:', error);
      toast.error(error.message || 'Erro ao carregar aprovações pendentes');
    } finally {
      setCarregando(false);
    }
  };

  const abrirModalAprovacao = (cotacao: Cotacao) => {
    setCotacaoSelecionada(cotacao);
    setModalAberto(true);
  };

  const handleAprovar = async (justificativa?: string) => {
    if (!cotacaoSelecionada) return;

    try {
      await cotacaoService.aprovar(cotacaoSelecionada.id, justificativa);
      toast.success('Cotação aprovada com sucesso!');
      setModalAberto(false);
      setCotacaoSelecionada(null);
      await carregarAprovacoes();
    } catch (error: any) {
      console.error('Erro ao aprovar cotação:', error);
      toast.error(error.message || 'Erro ao aprovar cotação');
      throw error;
    }
  };

  const handleReprovar = async (justificativa: string) => {
    if (!cotacaoSelecionada) return;

    try {
      await cotacaoService.reprovar(cotacaoSelecionada.id, justificativa);
      toast.success('Cotação reprovada');
      setModalAberto(false);
      setCotacaoSelecionada(null);
      await carregarAprovacoes();
    } catch (error: any) {
      console.error('Erro ao reprovar cotação:', error);
      toast.error(error.message || 'Erro ao reprovar cotação');
      throw error;
    }
  };

  const toggleSelecionarCotacao = (cotacaoId: string) => {
    const novaSelecao = new Set(cotacoesSelecionadas);
    if (novaSelecao.has(cotacaoId)) {
      novaSelecao.delete(cotacaoId);
    } else {
      novaSelecao.add(cotacaoId);
    }
    setCotacoesSelecionadas(novaSelecao);
  };

  const toggleSelecionarTodas = () => {
    if (cotacoesSelecionadas.size === cotacoes.length) {
      setCotacoesSelecionadas(new Set());
    } else {
      setCotacoesSelecionadas(new Set(cotacoes.map((c) => c.id)));
    }
  };

  const abrirModalLote = (tipo: 'aprovar' | 'reprovar') => {
    if (cotacoesSelecionadas.size === 0) {
      toast.error('Selecione ao menos uma cotação');
      return;
    }
    setTipoAcaoLote(tipo);
    setModalLoteAberto(true);
  };

  const handleAcaoLote = async (justificativa?: string) => {
    if (cotacoesSelecionadas.size === 0) return;

    const ids = Array.from(cotacoesSelecionadas);

    try {
      if (tipoAcaoLote === 'aprovar') {
        const resultado = await cotacaoService.aprovarLote(ids, justificativa);
        if (resultado.falhas > 0) {
          toast.error(`${resultado.sucessos} aprovadas, ${resultado.falhas} falharam`);
        } else {
          toast.success(`${resultado.sucessos} cotação(ões) aprovada(s) com sucesso!`);
        }
      } else {
        if (!justificativa) {
          toast.error('Justificativa é obrigatória para reprovação');
          return;
        }
        const resultado = await cotacaoService.reprovarLote(ids, justificativa);
        if (resultado.falhas > 0) {
          toast.error(`${resultado.sucessos} reprovadas, ${resultado.falhas} falharam`);
        } else {
          toast.success(`${resultado.sucessos} cotação(ões) reprovada(s)`);
        }
      }
      setModalLoteAberto(false);
      setCotacoesSelecionadas(new Set());
      await carregarAprovacoes();
    } catch (error: any) {
      console.error('Erro na ação em lote:', error);
      toast.error(error.message || 'Erro ao processar ação em lote');
    }
  };

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'urgente':
        return 'bg-red-100 text-red-800';
      case 'alta':
        return 'bg-orange-100 text-orange-800';
      case 'media':
        return 'bg-yellow-100 text-yellow-800';
      case 'baixa':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPrioridadeLabel = (prioridade: string) => {
    switch (prioridade) {
      case 'urgente':
        return 'Urgente';
      case 'alta':
        return 'Alta';
      case 'media':
        return 'Média';
      case 'baixa':
        return 'Baixa';
      default:
        return prioridade;
    }
  };

  const formatarData = (data: string | Date | null | undefined) => {
    if (!data) return 'N/A';
    try {
      const dataObj = typeof data === 'string' ? new Date(data) : data;
      if (isNaN(dataObj.getTime())) return 'N/A';
      return dataObj.toLocaleDateString('pt-BR');
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com BackToNucleus */}
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus nucleusName="Comercial" nucleusPath="/comercial" />
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header da Página */}
          <div className="bg-white rounded-lg shadow-sm border mb-6 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                  <CheckCircle className="h-6 w-6 text-[#159A9C]" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-[#002333]">Minhas Aprovações</h1>
                  <p className="text-[#002333]/70 mt-1">
                    {cotacoesSelecionadas.size > 0
                      ? `${cotacoesSelecionadas.size} cotação(ões) selecionada(s)`
                      : 'Cotações aguardando sua aprovação'}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                {cotacoesSelecionadas.size > 0 && (
                  <>
                    <button
                      onClick={() => abrirModalLote('aprovar')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Aprovar Selecionadas ({cotacoesSelecionadas.size})
                    </button>
                    <button
                      onClick={() => abrirModalLote('reprovar')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Reprovar Selecionadas ({cotacoesSelecionadas.size})
                    </button>
                  </>
                )}
                <button
                  onClick={carregarAprovacoes}
                  disabled={carregando}
                  className="px-4 py-2 bg-white text-[#159A9C] border border-[#159A9C] rounded-lg hover:bg-[#159A9C]/10 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${carregando ? 'animate-spin' : ''}`} />
                  Atualizar
                </button>
              </div>
            </div>
          </div>

          {/* KPI Card */}
          <div className="mb-8">
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Aprovações Pendentes
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">{cotacoes.length}</p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    {cotacoes.length === 0
                      ? 'Nenhuma cotação aguardando aprovação'
                      : cotacoes.length === 1
                        ? '1 cotação aguardando sua decisão'
                        : `${cotacoes.length} cotações aguardando sua decisão`}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center shadow-sm">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {carregando && (
            <div className="flex flex-col items-center justify-center py-16">
              <RefreshCw className="h-12 w-12 text-[#159A9C] animate-spin mb-4" />
              <p className="text-gray-600">Carregando aprovações...</p>
            </div>
          )}

          {/* Empty State */}
          {!carregando && cotacoes.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-[#002333] mb-2">
                Nenhuma aprovação pendente
              </h3>
              <p className="text-gray-600 mb-6">
                Você não possui cotações aguardando sua aprovação no momento.
              </p>
              <button
                onClick={() => navigate('/comercial/cotacoes')}
                className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors text-sm font-medium"
              >
                Ver Todas as Cotações
              </button>
            </div>
          )}

          {/* Lista de Cotações */}
          {!carregando && cotacoes.length > 0 && (
            <>
              {/* Header da Lista com Checkbox Selecionar Todas */}
              {cotacoes.length > 1 && (
                <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cotacoesSelecionadas.size === cotacoes.length}
                      onChange={toggleSelecionarTodas}
                      className="h-5 w-5 text-[#159A9C] border-gray-300 rounded focus:ring-[#159A9C]"
                    />
                    <span className="text-sm font-medium text-[#002333]">
                      {cotacoesSelecionadas.size === cotacoes.length
                        ? 'Desmarcar todas'
                        : 'Selecionar todas'}
                    </span>
                  </label>
                </div>
              )}

              <div className="grid grid-cols-1 gap-6">
                {cotacoes.map((cotacao) => (
                  <div
                    key={cotacao.id}
                    className={`bg-white rounded-lg shadow-sm border hover:shadow-lg transition-all ${
                      cotacoesSelecionadas.has(cotacao.id) ? 'ring-2 ring-[#159A9C]' : ''
                    }`}
                  >
                    <div className="p-6">
                      {/* Header do Card com Checkbox */}
                      <div className="flex items-start gap-4 mb-4">
                        <input
                          type="checkbox"
                          checked={cotacoesSelecionadas.has(cotacao.id)}
                          onChange={() => toggleSelecionarCotacao(cotacao.id)}
                          className="mt-1 h-5 w-5 text-[#159A9C] border-gray-300 rounded focus:ring-[#159A9C] cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-[#002333]">{cotacao.titulo}</h3>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPrioridadeColor(
                                cotacao.prioridade,
                              )}`}
                            >
                              {getPrioridadeLabel(cotacao.prioridade)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">Cotação #{cotacao.numero}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => abrirModalAprovacao(cotacao)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Aprovar
                          </button>
                          <button
                            onClick={() => abrirModalAprovacao(cotacao)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2"
                          >
                            <XCircle className="h-4 w-4" />
                            Rejeitar
                          </button>
                        </div>
                      </div>

                      {/* Grid de Informações */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-gray-50">
                            <User className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Fornecedor</p>
                            <p className="text-sm text-[#002333] font-semibold">
                              {cotacao.fornecedor?.nome || 'N/A'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-gray-50">
                            <DollarSign className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Valor Total</p>
                            <p className="text-sm text-[#002333] font-semibold">
                              R${' '}
                              {cotacao.valorTotal?.toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }) || '0,00'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-gray-50">
                            <Calendar className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Prazo Resposta</p>
                            <p className="text-sm text-[#002333] font-semibold">
                              {formatarData(cotacao.prazoResposta)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-gray-50">
                            <User className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Solicitante</p>
                            <p className="text-sm text-[#002333] font-semibold">
                              {cotacao.responsavel?.nome || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Descrição */}
                      {cotacao.descricao && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 font-medium mb-1">Descrição</p>
                          <p className="text-sm text-[#002333]">{cotacao.descricao}</p>
                        </div>
                      )}

                      {/* Itens */}
                      {cotacao.itens && cotacao.itens.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs text-gray-500 font-medium mb-2">
                            Itens ({cotacao.itens.length})
                          </p>
                          <div className="space-y-2">
                            {cotacao.itens.slice(0, 3).map((item, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm"
                              >
                                <span className="text-[#002333] font-medium">{item.descricao}</span>
                                <div className="flex items-center gap-4 text-gray-600">
                                  <span>
                                    {item.quantidade} {item.unidade}
                                  </span>
                                  <span className="font-semibold text-[#002333]">
                                    R${' '}
                                    {item.valorUnitario?.toLocaleString('pt-BR', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </span>
                                </div>
                              </div>
                            ))}
                            {cotacao.itens.length > 3 && (
                              <p className="text-xs text-gray-500 text-center py-2">
                                + {cotacao.itens.length - 3} itens adicionais
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de Aprovação/Reprovação */}
      {modalAberto && cotacaoSelecionada && (
        <ModalAprovarCotacao
          cotacao={cotacaoSelecionada}
          onClose={() => {
            setModalAberto(false);
            setCotacaoSelecionada(null);
          }}
          onAprovar={handleAprovar}
          onReprovar={handleReprovar}
        />
      )}

      {/* Modal de Ação em Lote */}
      {modalLoteAberto && (
        <ModalAcaoLote
          tipo={tipoAcaoLote}
          quantidadeCotacoes={cotacoesSelecionadas.size}
          onClose={() => setModalLoteAberto(false)}
          onConfirmar={handleAcaoLote}
        />
      )}
    </div>
  );
}

export default MinhasAprovacoesPage;
