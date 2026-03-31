import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Edit2,
  Calendar,
  DollarSign,
  Users,
  Phone,
  Mail,
  Building,
  Tag,
  TrendingUp,
  Clock,
  MessageSquare,
  FileText,
  CheckCircle,
  AlertCircle,
  PhoneCall,
  Send,
  User,
  Copy,
  Plus,
  GitBranch,
  Archive,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import {
  Oportunidade,
  Atividade,
  EstagioOportunidade,
  LifecycleStatusOportunidade,
  PrioridadeOportunidade,
  TipoAtividade,
  OportunidadeHistoricoEstagioItem,
} from '../../types/oportunidades';
import { oportunidadesService } from '../../services/oportunidadesService';
import { toastService } from '../../services/toastService';
import { differenceInDays } from 'date-fns';
import { BaseModal } from '../base/BaseModal';
import { useAuth } from '../../contexts/AuthContext';

interface ModalDetalhesOportunidadeProps {
  oportunidade: Oportunidade | null;
  onClose: () => void;
  onEditar: (oportunidade: Oportunidade) => void;
  initialTab?: 'detalhes' | 'atividades';
  eventContext?: ModalDetalhesEventoContext | null;
  onClonar?: (oportunidade: Oportunidade) => void;
  exclusaoDireta?: boolean;
  onMarcarComoGanho?: (oportunidade: Oportunidade) => Promise<void> | void;
  onMarcarComoPerdido?: (oportunidade: Oportunidade) => Promise<void> | void;
  onArquivar?: (oportunidade: Oportunidade) => Promise<void> | void;
  onRestaurar?: (oportunidade: Oportunidade) => Promise<void> | void;
  onReabrir?: (oportunidade: Oportunidade) => Promise<void> | void;
  onExcluir?: (oportunidade: Oportunidade) => Promise<void> | void;
  onExcluirPermanente?: (oportunidade: Oportunidade) => Promise<void> | void;
}

export interface ModalDetalhesEventoContext {
  kind: 'oportunidade' | 'atividade';
  title: string;
  dataEvento?: Date | string | null;
  tipoAtividadeLabel?: string;
  responsavelNome?: string;
  prioridade?: PrioridadeOportunidade;
  descricao?: string;
}

type AtividadeFiltro = 'all' | 'pending' | 'completed';

const ModalDetalhesOportunidade: React.FC<ModalDetalhesOportunidadeProps> = ({
  oportunidade,
  onClose,
  onEditar,
  initialTab = 'detalhes',
  eventContext = null,
  onClonar,
  exclusaoDireta = false,
  onMarcarComoGanho,
  onMarcarComoPerdido,
  onArquivar,
  onRestaurar,
  onReabrir,
  onExcluir,
  onExcluirPermanente,
}) => {
  const { user } = useAuth();
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [historicoEstagios, setHistoricoEstagios] = useState<OportunidadeHistoricoEstagioItem[]>(
    [],
  );
  const [loadingAtividades, setLoadingAtividades] = useState(false);
  const [loadingHistoricoEstagios, setLoadingHistoricoEstagios] = useState(false);
  const [salvandoAtividade, setSalvandoAtividade] = useState(false);
  const [tentouSalvarAtividade, setTentouSalvarAtividade] = useState(false);
  const [novoTipoAtividade, setNovoTipoAtividade] = useState<TipoAtividade>(TipoAtividade.NOTA);
  const [novaDescricaoAtividade, setNovaDescricaoAtividade] = useState('');
  const [novaDataAtividade, setNovaDataAtividade] = useState('');
  const [atividadeEmConclusaoId, setAtividadeEmConclusaoId] = useState<number | null>(null);
  const [resultadoConclusao, setResultadoConclusao] = useState('');
  const [concluindoAtividadeId, setConcluindoAtividadeId] = useState<number | null>(null);
  const [atividadeFiltro, setAtividadeFiltro] = useState<AtividadeFiltro>('all');
  const [abaSelecionada, setAbaSelecionada] = useState<'detalhes' | 'atividades'>('detalhes');
  const [limiteHistoricoEstagios, setLimiteHistoricoEstagios] = useState(30);
  const [acaoLifecycleLoading, setAcaoLifecycleLoading] = useState<
    'ganhar' | 'arquivar' | 'restaurar' | 'reabrir' | 'excluir' | 'excluir_permanente' | null
  >(null);

  const descricaoAtividadeLimpa = novaDescricaoAtividade.trim();
  const descricaoAtividadeInvalida = tentouSalvarAtividade && !descricaoAtividadeLimpa;
  const hasDraftAtividade =
    Boolean(descricaoAtividadeLimpa) ||
    Boolean(novaDataAtividade) ||
    novoTipoAtividade !== TipoAtividade.NOTA;

  const formatarDataEvento = (value?: Date | string | null): string => {
    if (!value) return 'Data não informada';
    const parsed = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Data não informada';
    return parsed.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEventTimingBadge = (value?: Date | string | null) => {
    if (!value) return null;
    const parsed = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;

    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfEvent = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    const diff = Math.round(
      (startOfEvent.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diff < 0) {
      return {
        label: `Atrasado ${Math.abs(diff)}d`,
        className: 'border-red-200 bg-red-50 text-red-700',
      };
    }

    if (diff === 0) {
      return {
        label: 'Vence hoje',
        className: 'border-amber-200 bg-amber-50 text-amber-700',
      };
    }

    if (diff === 1) {
      return {
        label: 'Amanha',
        className: 'border-blue-200 bg-blue-50 text-blue-700',
      };
    }

    return {
      label: `Em ${diff}d`,
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    };
  };

  const getPrioridadeEventoBadge = (prioridade?: PrioridadeOportunidade) => {
    if (!prioridade) return null;

    if (prioridade === PrioridadeOportunidade.ALTA) {
      return {
        label: 'Prioridade alta',
        className: 'border-red-200 bg-red-50 text-red-700',
      };
    }

    if (prioridade === PrioridadeOportunidade.MEDIA) {
      return {
        label: 'Prioridade media',
        className: 'border-amber-200 bg-amber-50 text-amber-700',
      };
    }

    return {
      label: 'Prioridade baixa',
      className: 'border-slate-200 bg-slate-50 text-slate-700',
    };
  };

  const eventTimingBadge = getEventTimingBadge(eventContext?.dataEvento);
  const prioridadeEventoBadge = getPrioridadeEventoBadge(eventContext?.prioridade);

  useEffect(() => {
    if (oportunidade?.id) {
      setLimiteHistoricoEstagios(30);
      void Promise.all([carregarAtividades(), carregarHistoricoEstagios(30)]);
      setNovoTipoAtividade(TipoAtividade.NOTA);
      setNovaDescricaoAtividade('');
      setNovaDataAtividade('');
      setTentouSalvarAtividade(false);
      setAtividadeEmConclusaoId(null);
      setResultadoConclusao('');
      setConcluindoAtividadeId(null);
      setAtividadeFiltro('all');
      setAbaSelecionada(initialTab);
    }
  }, [initialTab, oportunidade?.id]);

  const podeFecharModal = useCallback(() => {
    if (abaSelecionada !== 'atividades' || salvandoAtividade || !hasDraftAtividade) {
      return true;
    }

    return window.confirm(
      'Existe uma atividade em rascunho. Deseja fechar e descartar esse rascunho?',
    );
  }, [abaSelecionada, hasDraftAtividade, salvandoAtividade]);

  const handleClose = useCallback(() => {
    if (!podeFecharModal()) return;
    onClose();
  }, [onClose, podeFecharModal]);

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    setAbaSelecionada((current) => (current === 'detalhes' ? 'atividades' : 'detalhes'));
  };

  const carregarAtividades = async () => {
    if (!oportunidade) return;

    try {
      setLoadingAtividades(true);
      const dados = await oportunidadesService.listarAtividades(oportunidade.id);
      setAtividades(dados);
    } catch (err) {
      console.error('Erro ao carregar atividades:', err);
      toastService.error('Não foi possível carregar as atividades desta oportunidade.');
    } finally {
      setLoadingAtividades(false);
    }
  };

  const carregarHistoricoEstagios = async (limit = limiteHistoricoEstagios) => {
    if (!oportunidade) return;

    try {
      setLoadingHistoricoEstagios(true);
      const dados = await oportunidadesService.listarHistoricoEstagios(oportunidade.id, limit);
      setHistoricoEstagios(dados);
    } catch (err) {
      console.error('Erro ao carregar historico de estagios:', err);
      toastService.error('Nao foi possivel carregar o historico de estagios.');
    } finally {
      setLoadingHistoricoEstagios(false);
    }
  };

  const converterDataInputParaDate = (value: string): Date | undefined => {
    if (!value) return undefined;

    const [ano, mes, dia] = value.split('-').map(Number);
    if (!ano || !mes || !dia) return undefined;

    const parsed = new Date(ano, mes - 1, dia, 12, 0, 0, 0);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  };

  const criarAtividade = async () => {
    if (!oportunidade) return;

    setTentouSalvarAtividade(true);

    if (!descricaoAtividadeLimpa) {
      toastService.error('Informe a descricao da atividade.');
      return;
    }

    try {
      setSalvandoAtividade(true);

      await oportunidadesService.criarAtividade({
        oportunidadeId: oportunidade.id,
        tipo: novoTipoAtividade,
        descricao: descricaoAtividadeLimpa,
        dataAtividade: converterDataInputParaDate(novaDataAtividade),
      });

      setNovoTipoAtividade(TipoAtividade.NOTA);
      setNovaDescricaoAtividade('');
      setNovaDataAtividade('');
      setTentouSalvarAtividade(false);
      await carregarAtividades();
      toastService.success('Atividade registrada com sucesso.');
    } catch (err) {
      console.error('Erro ao criar atividade:', err);
      toastService.error('Nao foi possivel registrar a atividade.');
    } finally {
      setSalvandoAtividade(false);
    }
  };

  const isUsuarioGestor = (() => {
    const role = String(user?.role || '').toLowerCase();
    return role === 'superadmin' || role === 'admin' || role === 'gerente' || role === 'manager';
  })();

  const isAtividadeConcluida = (atividade: Atividade): boolean =>
    String(atividade.status || 'pending').toLowerCase() === 'completed';

  const atividadesPendentesCount = useMemo(
    () => atividades.filter((atividade) => !isAtividadeConcluida(atividade)).length,
    [atividades],
  );

  const atividadesConcluidasCount = useMemo(
    () => atividades.filter((atividade) => isAtividadeConcluida(atividade)).length,
    [atividades],
  );

  const atividadesFiltradas = useMemo(() => {
    if (atividadeFiltro === 'pending') {
      return atividades.filter((atividade) => !isAtividadeConcluida(atividade));
    }

    if (atividadeFiltro === 'completed') {
      return atividades.filter((atividade) => isAtividadeConcluida(atividade));
    }

    return atividades;
  }, [atividadeFiltro, atividades]);

  const podeConcluirAtividade = (atividade: Atividade): boolean => {
    if (!user?.id) return false;
    if (atividade.tipo === TipoAtividade.NOTA) return false;
    if (isAtividadeConcluida(atividade)) return false;
    if (isUsuarioGestor) return true;

    const responsavelId = atividade.responsavelId || atividade.responsavel?.id;
    if (responsavelId) {
      return responsavelId === user.id;
    }

    return atividade.criadoPor?.id === user.id;
  };

  const abrirConclusaoAtividade = (atividade: Atividade) => {
    const concluirSemObservacao = window.confirm(
      'Deseja concluir esta atividade sem observacao?\n\nClique em "OK" para concluir agora.\nClique em "Cancelar" para adicionar observacao antes de concluir.',
    );

    if (concluirSemObservacao) {
      void concluirAtividade(atividade, '');
      return;
    }

    setAtividadeEmConclusaoId(atividade.id);
    setResultadoConclusao('');
  };

  const cancelarConclusaoAtividade = () => {
    setAtividadeEmConclusaoId(null);
    setResultadoConclusao('');
  };

  const concluirAtividade = async (atividade: Atividade, resultadoForcado?: string) => {
    if (!oportunidade) return;

    const resultadoFinal = (resultadoForcado ?? resultadoConclusao).trim();

    try {
      setConcluindoAtividadeId(atividade.id);
      const atividadeAtualizada = await oportunidadesService.concluirAtividade(
        oportunidade.id,
        atividade.id,
        resultadoFinal ? { resultadoConclusao: resultadoFinal } : {},
      );
      setAtividades((prev) =>
        prev.map((item) => (item.id === atividade.id ? atividadeAtualizada : item)),
      );
      cancelarConclusaoAtividade();
      toastService.success('Atividade concluida com sucesso.');
    } catch (err: any) {
      const apiMessage = err?.response?.data?.message;
      const mensagem =
        Array.isArray(apiMessage) && apiMessage.length
          ? apiMessage.join(', ')
          : typeof apiMessage === 'string' && apiMessage.trim()
            ? apiMessage
            : 'Nao foi possivel concluir a atividade.';
      toastService.error(mensagem);
    } finally {
      setConcluindoAtividadeId(null);
    }
  };

  if (!oportunidade) return null;

  // Calcular dias até vencimento
  const diasAteVencimento = oportunidade.dataFechamentoEsperado
    ? differenceInDays(new Date(oportunidade.dataFechamentoEsperado), new Date())
    : null;
  const lifecycleStatus = oportunidade.lifecycle_status
    ? oportunidade.lifecycle_status
    : oportunidade.estagio === EstagioOportunidade.GANHO
      ? LifecycleStatusOportunidade.WON
      : oportunidade.estagio === EstagioOportunidade.PERDIDO
        ? LifecycleStatusOportunidade.LOST
        : LifecycleStatusOportunidade.OPEN;
  const staleDays = Number(oportunidade.stale_days || 0);
  const isStaleOpen =
    Boolean(oportunidade.is_stale) &&
    staleDays > 0 &&
    lifecycleStatus === LifecycleStatusOportunidade.OPEN;
  const lastInteractionDate = oportunidade.last_interaction_at
    ? new Date(oportunidade.last_interaction_at)
    : null;
  const lastInteractionLabel =
    lastInteractionDate && !Number.isNaN(lastInteractionDate.getTime())
      ? lastInteractionDate.toLocaleDateString('pt-BR')
      : null;

  const podeArquivar =
    lifecycleStatus !== LifecycleStatusOportunidade.ARCHIVED &&
    lifecycleStatus !== LifecycleStatusOportunidade.DELETED;
  const podeMarcarComoGanho =
    lifecycleStatus === LifecycleStatusOportunidade.OPEN &&
    oportunidade.estagio === EstagioOportunidade.FECHAMENTO;
  const podeMarcarComoPerdido =
    lifecycleStatus === LifecycleStatusOportunidade.OPEN &&
    oportunidade.estagio !== EstagioOportunidade.GANHO &&
    oportunidade.estagio !== EstagioOportunidade.PERDIDO;
  const podeRestaurar =
    lifecycleStatus === LifecycleStatusOportunidade.ARCHIVED ||
    lifecycleStatus === LifecycleStatusOportunidade.DELETED;
  const podeReabrir =
    lifecycleStatus !== LifecycleStatusOportunidade.ARCHIVED &&
    lifecycleStatus !== LifecycleStatusOportunidade.DELETED &&
    (oportunidade.estagio === EstagioOportunidade.GANHO ||
      oportunidade.estagio === EstagioOportunidade.PERDIDO);
  const podeExcluir = lifecycleStatus !== LifecycleStatusOportunidade.DELETED;
  const podeExcluirPermanente = lifecycleStatus === LifecycleStatusOportunidade.DELETED;

  const executarAcaoLifecycle = async (
    acao: 'ganhar' | 'arquivar' | 'restaurar' | 'reabrir' | 'excluir' | 'excluir_permanente',
    callback: ((item: Oportunidade) => Promise<void> | void) | undefined,
    confirmacao: string,
  ) => {
    if (!callback) return;
    if (!window.confirm(confirmacao)) return;

    try {
      setAcaoLifecycleLoading(acao);
      await callback(oportunidade);
      onClose();
    } catch (err) {
      console.error(`Erro ao executar acao ${acao}:`, err);
      toastService.error('Nao foi possivel concluir a acao solicitada.');
    } finally {
      setAcaoLifecycleLoading(null);
    }
  };

  const iniciarFluxoPerda = async () => {
    if (!onMarcarComoPerdido) return;

    try {
      await Promise.resolve(onMarcarComoPerdido(oportunidade));
      onClose();
    } catch (err) {
      console.error('Erro ao iniciar fluxo de perda:', err);
      toastService.error('Nao foi possivel iniciar o fluxo de perda.');
    }
  };

  // Cor da probabilidade
  const prob = oportunidade.probabilidade || 0;
  const probColor =
    prob <= 20
      ? 'bg-red-100 text-red-700 border-red-200'
      : prob <= 40
        ? 'bg-orange-100 text-orange-700 border-orange-200'
        : prob <= 60
          ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
          : prob <= 80
            ? 'bg-green-100 text-green-700 border-green-200'
            : 'bg-green-200 text-green-800 border-green-300';
  const probEmoji =
    prob <= 20 ? '❄️' : prob <= 40 ? '🌤️' : prob <= 60 ? '☀️' : prob <= 80 ? '🔥' : '🚀';

  // Ícone por tipo de atividade
  const getIconeAtividade = (tipo: string) => {
    switch (tipo) {
      case 'call':
        return <PhoneCall className="h-4 w-4 text-white" />;
      case 'email':
        return <Send className="h-4 w-4 text-white" />;
      case 'meeting':
        return <Users className="h-4 w-4 text-white" />;
      case 'note':
        return <MessageSquare className="h-4 w-4 text-white" />;
      case 'task':
        return <CheckCircle className="h-4 w-4 text-white" />;
      default:
        return <FileText className="h-4 w-4 text-white" />;
    }
  };

  // Nome do estágio em português
  const getNomeEstagio = (estagio?: EstagioOportunidade | string | null) => {
    if (!estagio) return 'Nao informado';
    const estagios = {
      [EstagioOportunidade.LEADS]: 'Leads',
      [EstagioOportunidade.QUALIFICACAO]: 'Qualificação',
      [EstagioOportunidade.PROPOSTA]: 'Proposta',
      [EstagioOportunidade.NEGOCIACAO]: 'Negociação',
      [EstagioOportunidade.FECHAMENTO]: 'Fechamento',
      [EstagioOportunidade.GANHO]: 'Ganho',
      [EstagioOportunidade.PERDIDO]: 'Perdido',
    };
    return estagios[estagio as EstagioOportunidade] || String(estagio);
  };

  const getLabelTipoAtividade = (tipo: TipoAtividade | string): string => {
    const labels: Record<string, string> = {
      [TipoAtividade.LIGACAO]: 'Ligacao',
      [TipoAtividade.EMAIL]: 'Email',
      [TipoAtividade.REUNIAO]: 'Reuniao',
      [TipoAtividade.NOTA]: 'Nota',
      [TipoAtividade.TAREFA]: 'Tarefa',
    };

    return labels[String(tipo)] || String(tipo);
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const formatarData = (data: Date | string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const tabDetalhesId = `modal-detalhes-oportunidade-tab-detalhes-${oportunidade.id}`;
  const tabAtividadesId = `modal-detalhes-oportunidade-tab-atividades-${oportunidade.id}`;
  const panelDetalhesId = `modal-detalhes-oportunidade-panel-detalhes-${oportunidade.id}`;
  const panelAtividadesId = `modal-detalhes-oportunidade-panel-atividades-${oportunidade.id}`;
  const podeCarregarMaisHistorico =
    historicoEstagios.length >= limiteHistoricoEstagios && limiteHistoricoEstagios < 200;

  const handleEditarOportunidade = () => {
    if (!podeFecharModal()) return;
    onEditar(oportunidade);
    onClose();
  };

  const handleClonarOportunidade = () => {
    if (!onClonar || !podeFecharModal()) return;
    onClonar(oportunidade);
    onClose();
  };

  const handleCarregarMaisHistorico = () => {
    const novoLimite = Math.min(limiteHistoricoEstagios + 30, 200);
    setLimiteHistoricoEstagios(novoLimite);
    void carregarHistoricoEstagios(novoLimite);
  };

  return (
    <BaseModal
      isOpen={Boolean(oportunidade)}
      onClose={handleClose}
      title={oportunidade.titulo}
      subtitle="Detalhes da oportunidade e acompanhamento comercial"
      maxWidth="5xl"
      modalClassName="max-h-[90vh] overflow-hidden rounded-2xl"
    >
      <div className="border-b border-[#B4BEC9]/25 bg-[#DEEFE7]/20 px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4 text-sm text-[#002333]/70">
            <span className="inline-flex items-center gap-1">
              <User className="h-4 w-4 text-[#159A9C]" />
              {oportunidade.responsavel?.nome || 'Sem responsável'}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4 text-[#159A9C]" />
              Criado em {new Date(oportunidade.createdAt).toLocaleDateString('pt-BR')}
            </span>
            {isStaleOpen && (
              <span className="inline-flex items-center gap-1 rounded-full border border-orange-300 bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
                <AlertCircle className="h-3.5 w-3.5" />
                Parada {staleDays}d
              </span>
            )}
          </div>
          {onClonar && (
            <button
              onClick={handleClonarOportunidade}
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#B4BEC9]/70 bg-white px-3 py-1.5 text-sm font-medium text-[#002333] transition-colors hover:bg-[#DEEFE7]/50"
            >
              <Copy className="h-4 w-4 text-[#159A9C]" />
              Duplicar
            </button>
          )}
        </div>
      </div>
      {eventContext && (
        <div className="border-b border-[#B4BEC9]/25 bg-[#E8F5FF] px-6 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#0F4A6C]/70">
            Evento selecionado no calendário
          </p>
          <p className="mt-1 text-sm font-semibold text-[#0F4A6C]">{eventContext.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[#0F4A6C]">
            <span className="rounded-full border border-[#B6D9EE] bg-white px-2 py-0.5 text-xs font-semibold">
              {eventContext.kind === 'atividade' ? 'Atividade agendada' : 'Marco da oportunidade'}
            </span>
            <span className="rounded-full border border-[#B6D9EE] bg-white px-2 py-0.5 text-xs">
              {formatarDataEvento(eventContext.dataEvento)}
            </span>
            {eventTimingBadge && (
              <span
                className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${eventTimingBadge.className}`}
              >
                {eventTimingBadge.label}
              </span>
            )}
            {eventContext.tipoAtividadeLabel && (
              <span className="rounded-full border border-[#B6D9EE] bg-white px-2 py-0.5 text-xs">
                {eventContext.tipoAtividadeLabel}
              </span>
            )}
            {prioridadeEventoBadge && (
              <span
                className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${prioridadeEventoBadge.className}`}
              >
                {prioridadeEventoBadge.label}
              </span>
            )}
            {eventContext.responsavelNome && (
              <span className="rounded-full border border-[#B6D9EE] bg-white px-2 py-0.5 text-xs">
                Responsável: {eventContext.responsavelNome}
              </span>
            )}
          </div>
          {eventContext.descricao?.trim() && (
            <p className="mt-2 rounded-lg border border-[#B6D9EE] bg-white px-3 py-2 text-sm text-[#0F4A6C]">
              {eventContext.descricao.trim()}
            </p>
          )}
        </div>
      )}
      {/* Abas */}
      <div className="border-b border-[#B4BEC9]/35 bg-[#DEEFE7]/35">
        <div className="flex" role="tablist" aria-label="Navegacao de detalhes da oportunidade">
          <button
            id={tabDetalhesId}
            role="tab"
            onClick={() => setAbaSelecionada('detalhes')}
            onKeyDown={handleTabKeyDown}
            type="button"
            aria-selected={abaSelecionada === 'detalhes'}
            aria-controls={panelDetalhesId}
            tabIndex={abaSelecionada === 'detalhes' ? 0 : -1}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              abaSelecionada === 'detalhes'
                ? 'border-[#159A9C] text-[#159A9C] bg-white'
                : 'border-transparent text-[#002333]/60 hover:text-[#002333]'
            }`}
          >
            Detalhes
          </button>
          <button
            id={tabAtividadesId}
            role="tab"
            onClick={() => setAbaSelecionada('atividades')}
            onKeyDown={handleTabKeyDown}
            type="button"
            aria-selected={abaSelecionada === 'atividades'}
            aria-controls={panelAtividadesId}
            tabIndex={abaSelecionada === 'atividades' ? 0 : -1}
            className={`px-6 py-3 font-medium transition-colors border-b-2 flex items-center gap-2 ${
              abaSelecionada === 'atividades'
                ? 'border-[#159A9C] text-[#159A9C] bg-white'
                : 'border-transparent text-[#002333]/60 hover:text-[#002333]'
            }`}
          >
            Atividades
            {atividades.length > 0 && (
              <span className="px-2 py-0.5 bg-[#159A9C] text-white text-xs rounded-full font-semibold">
                {atividades.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Conteúdo com scroll */}
      <div className="p-6">
        {abaSelecionada === 'detalhes' ? (
          <div
            id={panelDetalhesId}
            role="tabpanel"
            aria-labelledby={tabDetalhesId}
            className="space-y-6"
          >
            {/* Métricas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Valor */}
              <div className="bg-[#159A9C]/10 border border-[#159A9C]/20 rounded-xl p-4">
                <div className="flex items-center gap-2 text-[#159A9C] mb-1">
                  <DollarSign className="h-5 w-5" />
                  <span className="text-sm font-medium">Valor</span>
                </div>
                <p className="text-2xl font-bold text-[#0F7B7D]">
                  {formatarMoeda(Number(oportunidade.valor || 0))}
                </p>
              </div>

              {/* Probabilidade */}
              <div className={`border rounded-xl p-4 ${probColor}`}>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-sm font-medium">Probabilidade</span>
                </div>
                <p className="text-2xl font-bold flex items-center gap-2">
                  <span>{probEmoji}</span>
                  <span>{oportunidade.probabilidade}%</span>
                </p>
              </div>

              {/* Estágio */}
              <div className="bg-[#DEEFE7]/55 border border-[#B4BEC9]/35 rounded-xl p-4">
                <div className="flex items-center gap-2 text-[#159A9C] mb-1">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">Estágio</span>
                </div>
                <p className="text-xl font-bold text-[#002333]">
                  {getNomeEstagio(oportunidade.estagio)}
                </p>
              </div>
            </div>

            {isStaleOpen && (
              <div className="rounded-xl border-2 border-orange-200 bg-orange-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-orange-600" />
                  <div>
                    <h4 className="font-semibold text-orange-900">
                      Oportunidade sem interacao recente
                    </h4>
                    <p className="text-sm text-orange-700">
                      Esta oportunidade esta parada ha {staleDays}{' '}
                      {staleDays === 1 ? 'dia' : 'dias'}.
                      {lastInteractionLabel ? ` Ultima interacao em ${lastInteractionLabel}.` : ''}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Alerta de SLA */}
            {diasAteVencimento !== null && (
              <>
                {diasAteVencimento < 0 && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-900">Oportunidade Atrasada</h4>
                      <p className="text-red-700 text-sm">
                        Esta oportunidade está atrasada há {Math.abs(diasAteVencimento)} dias
                      </p>
                    </div>
                  </div>
                )}
                {diasAteVencimento >= 0 && diasAteVencimento < 7 && (
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-900">Atenção: Vencimento Próximo</h4>
                      <p className="text-yellow-700 text-sm">
                        Esta oportunidade vence em {diasAteVencimento}{' '}
                        {diasAteVencimento === 1 ? 'dia' : 'dias'}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Informações de Contato */}
            <div className="bg-[#DEEFE7]/35 rounded-xl p-5 space-y-4 border border-[#B4BEC9]/25">
              <h3 className="text-lg font-bold text-[#002333] flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-[#159A9C]" />
                Informações de Contato
              </h3>

              {oportunidade.nomeContato && (
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-[#159A9C] mt-0.5" />
                  <div>
                    <p className="text-sm text-[#002333]/60">Nome do Contato</p>
                    <p className="font-semibold text-[#002333]">{oportunidade.nomeContato}</p>
                  </div>
                </div>
              )}

              {oportunidade.empresaContato && (
                <div className="flex items-start gap-3">
                  <Building className="h-5 w-5 text-[#159A9C] mt-0.5" />
                  <div>
                    <p className="text-sm text-[#002333]/60">Empresa</p>
                    <p className="font-semibold text-[#002333]">{oportunidade.empresaContato}</p>
                  </div>
                </div>
              )}

              {oportunidade.emailContato && (
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-[#159A9C] mt-0.5" />
                  <div>
                    <p className="text-sm text-[#002333]/60">Email</p>
                    <a
                      href={`mailto:${oportunidade.emailContato}`}
                      className="font-semibold text-[#159A9C] hover:underline"
                    >
                      {oportunidade.emailContato}
                    </a>
                  </div>
                </div>
              )}

              {oportunidade.telefoneContato && (
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-[#159A9C] mt-0.5" />
                  <div>
                    <p className="text-sm text-[#002333]/60">Telefone</p>
                    <a
                      href={`tel:${oportunidade.telefoneContato}`}
                      className="font-semibold text-[#159A9C] hover:underline"
                    >
                      {oportunidade.telefoneContato}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Detalhes Adicionais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {oportunidade.prioridade && (
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-[#159A9C] mt-0.5" />
                  <div>
                    <p className="text-sm text-[#002333]/60">Prioridade</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        oportunidade.prioridade === PrioridadeOportunidade.ALTA
                          ? 'bg-red-100 text-red-700'
                          : oportunidade.prioridade === PrioridadeOportunidade.MEDIA
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {oportunidade.prioridade === PrioridadeOportunidade.ALTA
                        ? 'Alta'
                        : oportunidade.prioridade === PrioridadeOportunidade.MEDIA
                          ? 'Média'
                          : 'Baixa'}
                    </span>
                  </div>
                </div>
              )}

              {oportunidade.origem && (
                <div className="flex items-start gap-3">
                  <Tag className="h-5 w-5 text-[#159A9C] mt-0.5" />
                  <div>
                    <p className="text-sm text-[#002333]/60">Origem</p>
                    <p className="font-semibold text-[#002333] capitalize">{oportunidade.origem}</p>
                  </div>
                </div>
              )}

              {oportunidade.dataFechamentoEsperado && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-[#159A9C] mt-0.5" />
                  <div>
                    <p className="text-sm text-[#002333]/60">Data Esperada</p>
                    <p className="font-semibold text-[#002333]">
                      {new Date(oportunidade.dataFechamentoEsperado).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Descrição */}
            {oportunidade.descricao && (
              <div>
                <h3 className="text-lg font-bold text-[#002333] mb-3">Descrição</h3>
                <div className="bg-[#DEEFE7]/35 rounded-xl p-4 border border-[#B4BEC9]/25">
                  <p className="text-[#002333]/80 whitespace-pre-wrap">{oportunidade.descricao}</p>
                </div>
              </div>
            )}

            {/* Tags */}
            {oportunidade.tags && oportunidade.tags.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-[#002333] mb-3 flex items-center gap-2">
                  <Tag className="h-5 w-5 text-[#159A9C]" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {oportunidade.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-[#159A9C]/10 text-[#159A9C] rounded-lg text-sm font-semibold"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            id={panelAtividadesId}
            role="tabpanel"
            aria-labelledby={tabAtividadesId}
            className="space-y-6"
          >
            <div className="rounded-xl border border-[#B4BEC9]/35 bg-[#DEEFE7]/35 p-4">
              <h3 className="text-base font-bold text-[#002333] mb-3 flex items-center gap-2">
                <Plus className="h-4 w-4 text-[#159A9C]" />
                Registrar nova atividade
              </h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#002333]/70">Tipo</label>
                  <select
                    value={novoTipoAtividade}
                    onChange={(event) => setNovoTipoAtividade(event.target.value as TipoAtividade)}
                    disabled={salvandoAtividade}
                    className="w-full rounded-lg border border-[#B4BEC9]/70 bg-white px-3 py-2 text-sm text-[#002333] focus:border-[#159A9C] focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <option value={TipoAtividade.LIGACAO}>Ligacao</option>
                    <option value={TipoAtividade.EMAIL}>Email</option>
                    <option value={TipoAtividade.REUNIAO}>Reuniao</option>
                    <option value={TipoAtividade.NOTA}>Nota</option>
                    <option value={TipoAtividade.TAREFA}>Tarefa</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-[#002333]/70">
                    Data da atividade
                  </label>
                  <input
                    type="date"
                    value={novaDataAtividade}
                    onChange={(event) => setNovaDataAtividade(event.target.value)}
                    disabled={salvandoAtividade}
                    className="w-full rounded-lg border border-[#B4BEC9]/70 bg-white px-3 py-2 text-sm text-[#002333] focus:border-[#159A9C] focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
                  />
                </div>

                <div className="md:col-span-4">
                  <div className="mb-1 flex items-center justify-between">
                    <label
                      htmlFor={`descricao-atividade-${oportunidade.id}`}
                      className="block text-xs font-medium text-[#002333]/70"
                    >
                      Descricao da atividade
                    </label>
                    <span className="text-xs text-[#002333]/50">
                      {novaDescricaoAtividade.length} caracteres
                    </span>
                  </div>
                  <textarea
                    id={`descricao-atividade-${oportunidade.id}`}
                    value={novaDescricaoAtividade}
                    onChange={(event) => setNovaDescricaoAtividade(event.target.value)}
                    rows={5}
                    disabled={salvandoAtividade}
                    placeholder="Descreva a interacao, follow-up ou proximo passo..."
                    aria-invalid={descricaoAtividadeInvalida}
                    className={`min-h-[140px] w-full resize-y rounded-lg border bg-white px-3 py-2 text-sm text-[#002333] focus:outline-none disabled:cursor-not-allowed disabled:opacity-70 ${
                      descricaoAtividadeInvalida
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-[#B4BEC9]/70 focus:border-[#159A9C]'
                    }`}
                  />
                  {descricaoAtividadeInvalida && (
                    <p className="mt-1 text-xs text-red-600">
                      A descricao da atividade e obrigatoria.
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  disabled={salvandoAtividade}
                  onClick={() => {
                    void criarAtividade();
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#159A9C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0F7B7D] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Plus className="h-4 w-4" />
                  {salvandoAtividade ? 'Salvando...' : 'Adicionar atividade'}
                </button>
              </div>
            </div>

            <div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-[#002333] flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-[#159A9C]" />
                  Timeline de Atividades
                </h3>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAtividadeFiltro('all')}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                      atividadeFiltro === 'all'
                        ? 'border-[#159A9C] bg-[#159A9C] text-white'
                        : 'border-[#B4BEC9]/70 bg-white text-[#002333]/80 hover:bg-[#DEEFE7]/35'
                    }`}
                  >
                    Todas ({atividades.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAtividadeFiltro('pending')}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                      atividadeFiltro === 'pending'
                        ? 'border-amber-500 bg-amber-500 text-white'
                        : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                    }`}
                  >
                    Pendentes ({atividadesPendentesCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAtividadeFiltro('completed')}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                      atividadeFiltro === 'completed'
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    Concluidas ({atividadesConcluidasCount})
                  </button>
                </div>
              </div>

              {loadingAtividades ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#159A9C] mx-auto"></div>
                  <p className="text-[#002333]/60 mt-2 text-sm">Carregando atividades...</p>
                </div>
              ) : atividades.length === 0 ? (
                <div className="text-center py-12 bg-[#DEEFE7]/35 rounded-xl border border-[#B4BEC9]/25">
                  <MessageSquare className="h-12 w-12 text-[#B4BEC9] mx-auto mb-3" />
                  <p className="text-[#002333]/70 font-medium">Nenhuma atividade registrada</p>
                  <p className="text-[#002333]/55 text-sm mt-1">
                    As atividades aparecerão aqui conforme forem criadas.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      void carregarAtividades();
                    }}
                    className="mt-4 px-4 py-2 border border-[#B4BEC9]/70 rounded-lg text-sm font-medium text-[#002333] hover:bg-[#DEEFE7]/55 transition-colors"
                  >
                    Recarregar
                  </button>
                </div>
              ) : atividadesFiltradas.length === 0 ? (
                <div className="text-center py-10 bg-[#F8FAFC] rounded-xl border border-[#B4BEC9]/25">
                  <MessageSquare className="h-10 w-10 text-[#B4BEC9] mx-auto mb-3" />
                  <p className="text-[#002333]/70 font-medium">Nenhuma atividade neste filtro</p>
                  <p className="text-[#002333]/55 text-sm mt-1">
                    Ajuste o filtro para visualizar outras atividades da oportunidade.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {atividadesFiltradas.map((atividade, index) => (
                    <div key={atividade.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#159A9C] to-[#0F7B7D] flex items-center justify-center shadow-sm">
                          {getIconeAtividade(atividade.tipo)}
                        </div>
                        {index < atividadesFiltradas.length - 1 && (
                          <div className="w-0.5 flex-1 bg-[#B4BEC9]/60 my-2 min-h-[30px]" />
                        )}
                      </div>

                      <div className="flex-1 pb-6">
                        <div className="bg-white border border-[#B4BEC9]/35 rounded-xl p-4 hover:border-[#159A9C]/30 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-[#002333] capitalize">
                                {getLabelTipoAtividade(atividade.tipo)}
                              </p>
                              <p className="text-xs text-[#002333]/55 flex items-center gap-1 mt-1">
                                <User className="h-3 w-3" />
                                {atividade.criadoPor?.nome || 'Sistema'} •{' '}
                                {formatarData(atividade.dataAtividade || atividade.createdAt)}
                              </p>
                              {atividade.responsavel?.nome && (
                                <p className="text-xs text-[#002333]/55 flex items-center gap-1 mt-1">
                                  <User className="h-3 w-3" />
                                  Responsavel da acao: {atividade.responsavel.nome}
                                </p>
                              )}
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                {isAtividadeConcluida(atividade) ? (
                                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                                    Concluida
                                  </span>
                                ) : (
                                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                                    Pendente
                                  </span>
                                )}
                                {atividade.concluidoEm && (
                                  <span className="rounded-full border border-[#B4BEC9]/40 bg-[#F8FAFC] px-2.5 py-0.5 text-xs text-[#002333]/70">
                                    Concluida em {formatarData(atividade.concluidoEm)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <p className="text-[#002333]/80 text-sm whitespace-pre-wrap">
                            {atividade.descricao}
                          </p>

                          {atividade.resultadoConclusao?.trim() && (
                            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2">
                              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                                Resultado da conclusao
                              </p>
                              <p className="mt-1 whitespace-pre-wrap text-sm text-[#002333]/85">
                                {atividade.resultadoConclusao}
                              </p>
                              {(atividade.concluidoPor?.nome || atividade.concluidoEm) && (
                                <p className="mt-1 text-xs text-[#002333]/65">
                                  {atividade.concluidoPor?.nome
                                    ? `Por ${atividade.concluidoPor.nome}`
                                    : 'Concluida'}{' '}
                                  {atividade.concluidoEm
                                    ? `em ${formatarData(atividade.concluidoEm)}`
                                    : ''}
                                </p>
                              )}
                            </div>
                          )}

                          {!isAtividadeConcluida(atividade) && podeConcluirAtividade(atividade) && (
                            <div className="mt-3 rounded-lg border border-[#B4BEC9]/40 bg-[#F8FAFC] p-3">
                              {atividadeEmConclusaoId === atividade.id ? (
                                <>
                                  <label className="mb-1 block text-xs font-semibold text-[#002333]/80">
                                    Observacao da conclusao (opcional)
                                  </label>
                                  <textarea
                                    value={resultadoConclusao}
                                    onChange={(event) => setResultadoConclusao(event.target.value)}
                                    rows={3}
                                    maxLength={2000}
                                    disabled={concluindoAtividadeId === atividade.id}
                                    placeholder="Descreva o resultado final desta tarefa/acao."
                                    className="w-full resize-y rounded-lg border border-[#B4BEC9]/70 bg-white px-3 py-2 text-sm text-[#002333] focus:border-[#159A9C] focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
                                  />
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        void concluirAtividade(atividade);
                                      }}
                                      disabled={concluindoAtividadeId === atividade.id}
                                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                                    >
                                      {concluindoAtividadeId === atividade.id
                                        ? 'Concluindo...'
                                        : 'Confirmar conclusao'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={cancelarConclusaoAtividade}
                                      disabled={concluindoAtividadeId === atividade.id}
                                      className="rounded-lg border border-[#B4BEC9]/70 px-3 py-1.5 text-xs font-semibold text-[#002333] hover:bg-[#DEEFE7]/55 disabled:cursor-not-allowed disabled:opacity-70"
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => abrirConclusaoAtividade(atividade)}
                                  disabled={concluindoAtividadeId === atividade.id}
                                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                                >
                                  Marcar como concluida
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#002333] mb-4 flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-[#159A9C]" />
                Historico de estagios
              </h3>

              {loadingHistoricoEstagios ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#159A9C] mx-auto"></div>
                  <p className="text-[#002333]/60 mt-2 text-sm">Carregando historico...</p>
                </div>
              ) : historicoEstagios.length === 0 ? (
                <div className="rounded-xl border border-[#B4BEC9]/25 bg-[#DEEFE7]/25 px-4 py-5 text-sm text-[#002333]/65">
                  Nenhuma movimentacao de estagio registrada para esta oportunidade.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {historicoEstagios.map((evento) => (
                    <div
                      key={evento.id}
                      className="rounded-xl border border-[#B4BEC9]/35 bg-white px-4 py-3"
                    >
                      <p className="text-sm font-semibold text-[#002333]">
                        {evento.fromStage
                          ? `${getNomeEstagio(evento.fromStage)} -> ${getNomeEstagio(evento.toStage)}`
                          : `Entrada em ${getNomeEstagio(evento.toStage)}`}
                      </p>
                      <p className="mt-1 text-xs text-[#002333]/60">
                        {evento.changedBy?.nome || 'Sistema'} • {formatarData(evento.changedAt)} •{' '}
                        Origem: {evento.source}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {podeCarregarMaisHistorico && (
                <div className="mt-3 flex justify-center">
                  <button
                    type="button"
                    onClick={handleCarregarMaisHistorico}
                    disabled={loadingHistoricoEstagios}
                    className="rounded-lg border border-[#B4BEC9]/70 px-4 py-2 text-sm font-medium text-[#002333] transition-colors hover:bg-[#DEEFE7]/55 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loadingHistoricoEstagios ? 'Carregando...' : 'Carregar mais historico'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-[#B4BEC9]/35 px-6 py-4 bg-[#DEEFE7]/35 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {podeMarcarComoGanho && onMarcarComoGanho && (
            <button
              onClick={() =>
                void executarAcaoLifecycle(
                  'ganhar',
                  onMarcarComoGanho,
                  'Deseja marcar esta oportunidade como ganha?',
                )
              }
              type="button"
              disabled={acaoLifecycleLoading !== null}
              className="px-3 py-2 rounded-lg border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition-colors text-sm font-medium inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <CheckCircle className="h-4 w-4" />
              {acaoLifecycleLoading === 'ganhar' ? 'Marcando...' : 'Marcar como ganho'}
            </button>
          )}

          {podeMarcarComoPerdido && onMarcarComoPerdido && (
            <button
              onClick={() => void iniciarFluxoPerda()}
              type="button"
              disabled={acaoLifecycleLoading !== null}
              className="px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors text-sm font-medium inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <AlertCircle className="h-4 w-4" />
              Marcar como perdido
            </button>
          )}

          {podeArquivar && onArquivar && (
            <button
              onClick={() =>
                void executarAcaoLifecycle(
                  'arquivar',
                  onArquivar,
                  'Deseja arquivar esta oportunidade?',
                )
              }
              type="button"
              disabled={acaoLifecycleLoading !== null}
              className="px-3 py-2 rounded-lg border border-[#B4BEC9]/70 bg-white text-[#002333] hover:bg-[#DEEFE7]/55 transition-colors text-sm font-medium inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Archive className="h-4 w-4 text-[#159A9C]" />
              {acaoLifecycleLoading === 'arquivar' ? 'Arquivando...' : 'Arquivar'}
            </button>
          )}

          {podeRestaurar && onRestaurar && (
            <button
              onClick={() =>
                void executarAcaoLifecycle(
                  'restaurar',
                  onRestaurar,
                  'Deseja restaurar esta oportunidade para o fluxo ativo?',
                )
              }
              type="button"
              disabled={acaoLifecycleLoading !== null}
              className="px-3 py-2 rounded-lg border border-[#B4BEC9]/70 bg-white text-[#002333] hover:bg-[#DEEFE7]/55 transition-colors text-sm font-medium inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <RotateCcw className="h-4 w-4 text-[#159A9C]" />
              {acaoLifecycleLoading === 'restaurar' ? 'Restaurando...' : 'Restaurar'}
            </button>
          )}

          {podeReabrir && onReabrir && (
            <button
              onClick={() =>
                void executarAcaoLifecycle(
                  'reabrir',
                  onReabrir,
                  'Deseja reabrir esta oportunidade?',
                )
              }
              type="button"
              disabled={acaoLifecycleLoading !== null}
              className="px-3 py-2 rounded-lg border border-[#B4BEC9]/70 bg-white text-[#002333] hover:bg-[#DEEFE7]/55 transition-colors text-sm font-medium inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <RotateCcw className="h-4 w-4 text-[#159A9C]" />
              {acaoLifecycleLoading === 'reabrir' ? 'Reabrindo...' : 'Reabrir'}
            </button>
          )}

          {podeExcluir && onExcluir && (
            <button
              onClick={() =>
                void executarAcaoLifecycle(
                  'excluir',
                  onExcluir,
                  exclusaoDireta
                    ? 'Deseja excluir esta oportunidade permanentemente? Esta acao nao pode ser desfeita.'
                    : 'Deseja mover esta oportunidade para a lixeira?',
                )
              }
              type="button"
              disabled={acaoLifecycleLoading !== null}
              className="px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors text-sm font-medium inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-4 w-4" />
              {acaoLifecycleLoading === 'excluir'
                ? exclusaoDireta
                  ? 'Excluindo...'
                  : 'Enviando...'
                : 'Excluir'}
            </button>
          )}

          {podeExcluirPermanente && onExcluirPermanente && (
            <button
              onClick={() =>
                void executarAcaoLifecycle(
                  'excluir_permanente',
                  onExcluirPermanente,
                  'Deseja excluir permanentemente esta oportunidade? Esta acao nao pode ser desfeita.',
                )
              }
              type="button"
              disabled={acaoLifecycleLoading !== null}
              className="px-3 py-2 rounded-lg border border-red-600 bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-4 w-4" />
              {acaoLifecycleLoading === 'excluir_permanente'
                ? 'Excluindo...'
                : 'Excluir permanente'}
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleClose}
            type="button"
            className="px-4 py-2 border border-[#B4BEC9]/70 text-[#002333] rounded-lg hover:bg-[#DEEFE7]/55 transition-colors text-sm font-medium"
          >
            Fechar
          </button>
          <button
            onClick={handleEditarOportunidade}
            type="button"
            className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Edit2 className="h-4 w-4" />
            Editar oportunidade
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default ModalDetalhesOportunidade;


