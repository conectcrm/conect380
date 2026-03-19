import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PropostaCompleta } from '../services/propostasService';
import PropostaActions from './PropostaActions';
import { propostasService as propostasApiService } from '../../../services/propostasService';
import { BaseModal, ModalButton } from '../../../components/modals/BaseModal';
import { produtosService } from '../../../services/produtosService';
import { toastService } from '../../../services/toastService';
import {
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Building,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Clock,
  Eye,
  History,
} from 'lucide-react';

interface ModalVisualizarPropostaProps {
  isOpen?: boolean;
  onClose?: () => void;
  proposta: PropostaCompleta | null;
  onEditProposta?: (proposta: PropostaCompleta) => void;
  onPropostaUpdated?: () => void;
  mode?: 'modal' | 'page';
}

type HistoricoResposta = {
  criacaoEm: string;
  envioEm?: string;
  primeiraVisualizacaoEm?: string;
  decisaoEm?: string;
  statusAtual?: string;
  aprovacaoInterna?: {
    obrigatoria?: boolean;
    status?: 'nao_requer' | 'pendente' | 'aprovada' | 'rejeitada' | string;
    motivo?: string;
    limiteDesconto?: number;
    descontoDetectado?: number;
    observacoes?: string;
    solicitadaEm?: string;
    aprovadaEm?: string;
    rejeitadaEm?: string;
    aprovadaPorNome?: string;
    rejeitadaPorNome?: string;
  };
  versoes?: Array<{
    versao: number;
    criadaEm?: string;
    origem?: string;
    descricao?: string;
    snapshot?: {
      total?: number;
      status?: string;
      subtotal?: number;
      descontoGlobal?: number;
      impostos?: number;
      valor?: number;
      formaPagamento?: string;
      validadeDias?: number;
      dataVencimento?: string;
      observacoes?: string;
      produtos?: unknown[];
    };
  }>;
  log?: Array<{
    data: string;
    evento: string;
    detalhes: string;
    ip?: string;
  }>;
};

type EstatisticasResposta = {
  totalVisualizacoes?: number;
  ultimaVisualizacao?: string;
  tempoMedioVisualizacao?: number;
  dispositivosUtilizados?: string[];
  acoes?: Array<{
    acao: string;
    timestamp: string;
    ip?: string;
    userAgent?: string;
    observacoes?: string;
  }>;
};

type PlanoComponente = {
  childItemId: string;
  componentRole: 'included' | 'required' | 'optional' | 'recommended' | 'addon';
  quantity?: number;
  nome?: string;
  preco?: number;
  tipoItem?: string;
  affectsPrice?: boolean;
  isDefault?: boolean;
};

type ItemNegociado = {
  produtoId: string;
  nome: string;
  descricao: string;
  quantidade: number;
  precoUnitario: number;
  desconto: number;
  subtotal: number;
  tipoItem?: string;
  componentesPlano?: PlanoComponente[];
};

const componentRoleLabels: Record<PlanoComponente['componentRole'], string> = {
  included: 'Incluido',
  required: 'Obrigatorio',
  optional: 'Opcional',
  recommended: 'Recomendado',
  addon: 'Add-on',
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0));
};

const formatDate = (date: Date | string | undefined | null) => {
  if (!date) return '-';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('pt-BR');
};

const formatDateTime = (date: Date | string | undefined | null) => {
  if (!date) return '-';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('pt-BR');
};

const descreverFormaPagamento = (formaPagamento: unknown, parcelas?: unknown) => {
  const normalized = String(formaPagamento || '')
    .trim()
    .toLowerCase();

  if (normalized === 'avista' || normalized === 'a_vista' || normalized === 'a-vista') {
    return 'A vista';
  }

  if (normalized === 'boleto') {
    return 'Boleto';
  }

  if (normalized === 'cartao' || normalized === 'cartao_credito') {
    return 'Cartao';
  }

  if (normalized === 'parcelado') {
    const totalParcelas = Number(parcelas);
    return Number.isFinite(totalParcelas) && totalParcelas > 1
      ? `Parcelado em ${totalParcelas}x`
      : 'Parcelado';
  }

  return normalized ? normalized.replace(/_/g, ' ') : 'Nao informado';
};

const getStatusColor = (status?: string) => {
  const statusColors = {
    rascunho: 'bg-[#B4BEC9]/20 text-[#244455]',
    enviada: 'bg-[#38BDF8]/10 text-[#0369A1]',
    visualizada: 'bg-[#159A9C]/10 text-[#0F7B7D]',
    negociacao: 'bg-[#FBBF24]/20 text-[#92400E]',
    aprovada: 'bg-[#16A34A]/10 text-[#166534]',
    rejeitada: 'bg-[#DC2626]/10 text-[#B91C1C]',
    expirada: 'bg-[#F97316]/15 text-[#9A3412]',
    contrato_gerado: 'bg-[#C084FC]/15 text-[#7C3AED]',
    contrato_assinado: 'bg-[#22C55E]/15 text-[#15803D]',
    fatura_criada: 'bg-[#0EA5E9]/15 text-[#0C4A6E]',
    aguardando_pagamento: 'bg-[#F59E0B]/20 text-[#92400E]',
    pago: 'bg-[#16A34A]/20 text-[#166534]',
  };
  return statusColors[status as keyof typeof statusColors] || 'bg-[#B4BEC9]/20 text-[#244455]';
};

const getStatusText = (status?: string) => {
  const statusText = {
    rascunho: 'Rascunho',
    enviada: 'Enviada',
    visualizada: 'Visualizada',
    negociacao: 'Negociacao',
    aprovada: 'Aprovada',
    rejeitada: 'Rejeitada',
    expirada: 'Expirada',
    contrato_gerado: 'Aguardando assinatura do contrato',
    contrato_assinado: 'Contrato assinado',
    fatura_criada: 'Fatura criada',
    aguardando_pagamento: 'Aguardando pagamento',
    pago: 'Pago',
  };
  return statusText[status as keyof typeof statusText] || 'Indefinido';
};

const getAprovacaoBadge = (status?: string) => {
  switch (String(status || '').toLowerCase()) {
    case 'aprovada':
      return {
        label: 'Aprovacao interna aprovada',
        className: 'bg-[#16A34A]/10 text-[#166534]',
        icon: ShieldCheck,
      };
    case 'rejeitada':
      return {
        label: 'Aprovacao interna rejeitada',
        className: 'bg-[#DC2626]/10 text-[#B91C1C]',
        icon: ShieldX,
      };
    case 'pendente':
      return {
        label: 'Aprovacao interna pendente',
        className: 'bg-[#FBBF24]/20 text-[#92400E]',
        icon: ShieldAlert,
      };
    default:
      return {
        label: 'Sem necessidade de alçada',
        className: 'bg-[#DEE8EC] text-[#355166]',
        icon: ShieldCheck,
      };
  }
};

const parseNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeText = (value: unknown) => String(value || '').trim().toLowerCase();

const normalizePlanoComponentes = (value: unknown): PlanoComponente[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((raw) => {
      if (!raw || typeof raw !== 'object') {
        return null;
      }

      const record = raw as Record<string, unknown>;
      const childItemId = String(record.childItemId || record.child_item_id || '').trim();
      if (!childItemId) {
        return null;
      }

      const componentRoleRaw = String(record.componentRole || record.component_role || 'included');
      const componentRole = (
        ['included', 'required', 'optional', 'recommended', 'addon'].includes(componentRoleRaw)
          ? componentRoleRaw
          : 'included'
      ) as PlanoComponente['componentRole'];

      const quantity = Number(record.quantity);
      const preco = Number(record.preco);

      return {
        childItemId,
        componentRole,
        quantity: Number.isFinite(quantity) ? quantity : undefined,
        nome: typeof record.nome === 'string' ? record.nome : undefined,
        preco: Number.isFinite(preco) ? preco : undefined,
        tipoItem: typeof record.tipoItem === 'string' ? record.tipoItem : undefined,
        affectsPrice: Boolean(record.affectsPrice),
        isDefault: record.isDefault === undefined ? undefined : Boolean(record.isDefault),
      } as PlanoComponente;
    })
    .filter((item): item is PlanoComponente => Boolean(item));
};

const getComposicaoDetalhes = (item: ItemNegociado, limit = 3): string[] => {
  const componentes = Array.isArray(item.componentesPlano) ? item.componentesPlano : [];
  return componentes.slice(0, limit).map((componente) => {
    const nome = componente.nome?.trim() || 'Item da composicao';
    const qtd =
      typeof componente.quantity === 'number' && componente.quantity > 1
        ? ` x${componente.quantity}`
        : '';
    const papel = componentRoleLabels[componente.componentRole || 'included'] || 'Incluido';
    return `${nome}${qtd} (${papel})`;
  });
};

const getComposicaoDetalhesPlano = (componentes: PlanoComponente[], limit = 3): string[] => {
  return componentes.slice(0, limit).map((componente) => {
    const nome = componente.nome?.trim() || 'Item da composicao';
    const qtd =
      typeof componente.quantity === 'number' && componente.quantity > 1
        ? ` x${componente.quantity}`
        : '';
    const papel = componentRoleLabels[componente.componentRole || 'included'] || 'Incluido';
    return `${nome}${qtd} (${papel})`;
  });
};

const buildComposicaoPlanoSignature = (componentes: PlanoComponente[]): string => {
  if (!Array.isArray(componentes) || componentes.length === 0) {
    return '';
  }

  return componentes
    .map((componente) => {
      const nomeBase = componente.nome?.trim() || componente.childItemId || '';
      const nome = normalizeText(nomeBase);
      const papel = normalizeText(componente.componentRole || 'included');
      const quantidade = parseNumber(componente.quantity, 1);
      return `${nome}|${papel}|${quantidade}`;
    })
    .filter((item) => Boolean(item))
    .sort()
    .join('||');
};

const buildResumoComposicaoPlano = (componentes: PlanoComponente[], limit = 3): string => {
  if (!Array.isArray(componentes) || componentes.length === 0) {
    return '';
  }

  const detalhes = getComposicaoDetalhesPlano(componentes, limit);
  if (detalhes.length === 0) {
    return '';
  }

  if (componentes.length > limit) {
    return `${detalhes.join(', ')} +${componentes.length - limit}`;
  }

  return detalhes.join(', ');
};

const extractProductNames = (produtos?: unknown[]): string[] => {
  if (!Array.isArray(produtos)) {
    return [];
  }

  const nomes = produtos
    .map((produto) => {
      if (!produto || typeof produto !== 'object') {
        return '';
      }

      const raw = produto as Record<string, unknown>;
      if (typeof raw.nome === 'string' && raw.nome.trim()) {
        return raw.nome.trim();
      }

      if (typeof raw.produtoNome === 'string' && raw.produtoNome.trim()) {
        return raw.produtoNome.trim();
      }

      const nestedProduto = raw.produto;
      if (
        nestedProduto &&
        typeof nestedProduto === 'object' &&
        typeof (nestedProduto as Record<string, unknown>).nome === 'string'
      ) {
        const nomeNested = String((nestedProduto as Record<string, unknown>).nome || '').trim();
        return nomeNested;
      }

      return '';
    })
    .filter((nome) => Boolean(nome));

  return Array.from(new Set(nomes));
};

type SnapshotItemNormalizado = {
  key: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
  desconto: number;
  subtotal: number;
  tipoItem: string;
  composicaoPlanoAssinatura: string;
  resumoComposicaoPlano: string;
};

const normalizeSnapshotItems = (produtos?: unknown[]): SnapshotItemNormalizado[] => {
  if (!Array.isArray(produtos)) {
    return [];
  }

  return produtos
    .map((produto, index) => {
      if (!produto || typeof produto !== 'object') {
        return null;
      }

      const raw = produto as Record<string, unknown>;
      const nestedProduto =
        raw.produto && typeof raw.produto === 'object'
          ? (raw.produto as Record<string, unknown>)
          : null;

      const nome =
        (typeof raw.nome === 'string' && raw.nome.trim()) ||
        (typeof raw.produtoNome === 'string' && raw.produtoNome.trim()) ||
        (nestedProduto && typeof nestedProduto.nome === 'string' && String(nestedProduto.nome).trim()) ||
        `Item ${index + 1}`;
      const quantidade = Math.max(parseNumber(raw.quantidade, 1), 0);
      const precoUnitario = Math.max(
        parseNumber(raw.precoUnitario ?? raw.preco ?? nestedProduto?.preco, 0),
        0,
      );
      const desconto = Math.max(parseNumber(raw.desconto, 0), 0);
      const subtotalCalculado = quantidade * precoUnitario * (1 - desconto / 100);
      const subtotal = Math.max(parseNumber(raw.subtotal, subtotalCalculado), 0);
      const tipoItemRaw = raw.tipoItem ?? nestedProduto?.tipoItem ?? '';
      const tipoItem = normalizeText(tipoItemRaw);
      const componentesCandidatos = normalizePlanoComponentes(
        raw.componentesPlano ?? raw.componentes ?? nestedProduto?.componentes,
      );
      const isPlano = tipoItem === 'plano' || componentesCandidatos.length > 0;
      const componentesPlano = isPlano ? componentesCandidatos : [];
      const composicaoPlanoAssinatura =
        isPlano ? buildComposicaoPlanoSignature(componentesPlano) : '';
      const resumoComposicaoPlano =
        isPlano ? buildResumoComposicaoPlano(componentesPlano) : '';

      return {
        key: normalizeText(nome),
        nome: String(nome),
        quantidade,
        precoUnitario,
        desconto,
        subtotal,
        tipoItem,
        composicaoPlanoAssinatura,
        resumoComposicaoPlano,
      };
    })
    .filter((item): item is SnapshotItemNormalizado => Boolean(item));
};

const buildSnapshotItemMap = (items: SnapshotItemNormalizado[]) => {
  const map = new Map<string, SnapshotItemNormalizado>();

  items.forEach((item) => {
    const existente = map.get(item.key);
    if (!existente) {
      map.set(item.key, { ...item });
      return;
    }

    const quantidade = existente.quantidade + item.quantidade;
    const subtotal = existente.subtotal + item.subtotal;
    const composicoes = Array.from(
      new Set(
        [existente.composicaoPlanoAssinatura, item.composicaoPlanoAssinatura]
          .map((value) => value.trim())
          .filter((value) => value.length > 0),
      ),
    ).sort();
    const resumos = Array.from(
      new Set(
        [existente.resumoComposicaoPlano, item.resumoComposicaoPlano]
          .map((value) => value.trim())
          .filter((value) => value.length > 0),
      ),
    );

    map.set(item.key, {
      ...existente,
      quantidade,
      subtotal,
      desconto: Math.max(existente.desconto, item.desconto),
      precoUnitario: quantidade > 0 ? subtotal / quantidade : existente.precoUnitario,
      tipoItem: existente.tipoItem || item.tipoItem,
      composicaoPlanoAssinatura: composicoes.join('&&'),
      resumoComposicaoPlano: resumos.join(' | '),
    });
  });

  return map;
};

const ModalVisualizarProposta: React.FC<ModalVisualizarPropostaProps> = ({
  isOpen = true,
  onClose,
  proposta,
  onEditProposta,
  onPropostaUpdated,
  mode = 'modal',
}) => {
  const isPageMode = mode === 'page';
  const shouldRender = isPageMode || isOpen;
  const [historico, setHistorico] = useState<HistoricoResposta | null>(null);
  const [estatisticas, setEstatisticas] = useState<EstatisticasResposta | null>(null);
  const [loadingCiclo, setLoadingCiclo] = useState(false);
  const [agendandoFollowup, setAgendandoFollowup] = useState(false);
  const [followupDias, setFollowupDias] = useState('3');
  const [showFollowupForm, setShowFollowupForm] = useState(false);
  const [showCiclo, setShowCiclo] = useState(false);
  const [versaoAtualSelecionada, setVersaoAtualSelecionada] = useState<number | null>(null);
  const [versaoBaseSelecionada, setVersaoBaseSelecionada] = useState<number | null>(null);
  const [nomesProdutosPorId, setNomesProdutosPorId] = useState<Record<string, string>>({});
  const [recalculandoTotais, setRecalculandoTotais] = useState(false);

  const propostaId = proposta?.id ? String(proposta.id) : null;

  const carregarDadosCiclo = useCallback(async () => {
    if (!propostaId) {
      setHistorico(null);
      setEstatisticas(null);
      return;
    }

    setLoadingCiclo(true);
    try {
      const [historicoResp, estatisticasResp] = await Promise.all([
        propostasApiService.obterHistoricoProposta(propostaId),
        propostasApiService.obterEstatisticasProposta(propostaId),
      ]);

      const historicoData =
        historicoResp && typeof historicoResp === 'object' && 'success' in historicoResp
          ? (historicoResp as any).data || null
          : historicoResp;

      const estatisticasData =
        estatisticasResp && typeof estatisticasResp === 'object' && 'success' in estatisticasResp
          ? (estatisticasResp as any).data || null
          : estatisticasResp;

      setHistorico((historicoData || null) as HistoricoResposta | null);
      setEstatisticas((estatisticasData || null) as EstatisticasResposta | null);
    } catch (error) {
      console.error('Erro ao carregar rastreio da proposta:', error);
      setHistorico(null);
      setEstatisticas(null);
    } finally {
      setLoadingCiclo(false);
    }
  }, [propostaId]);

  useEffect(() => {
    if (!shouldRender || !propostaId) {
      return;
    }
    void carregarDadosCiclo();
  }, [shouldRender, propostaId, carregarDadosCiclo]);

  useEffect(() => {
    if (!shouldRender) {
      setShowFollowupForm(false);
      setFollowupDias('3');
      setShowCiclo(false);
    }
  }, [shouldRender]);

  useEffect(() => {
    if (!showCiclo) {
      setShowFollowupForm(false);
    }
  }, [showCiclo]);

  const handleAgendarFollowup = async (dias: number) => {
    if (!propostaId) {
      toastService.error('Proposta sem identificador para agendar follow-up.');
      return;
    }

    setAgendandoFollowup(true);
    try {
      await propostasApiService.agendarLembrete(propostaId, dias);
      toastService.success(`Follow-up agendado para ${dias} dia(s).`);
      await carregarDadosCiclo();
      onPropostaUpdated?.();
      setShowFollowupForm(false);
    } catch (error) {
      console.error('Erro ao agendar follow-up:', error);
      toastService.error('Nao foi possivel agendar o follow-up.');
    } finally {
      setAgendandoFollowup(false);
    }
  };

  const aprovacao =
    historico?.aprovacaoInterna ||
    (proposta?.aprovacaoInterna as HistoricoResposta['aprovacaoInterna'] | undefined);
  const aprovacaoBadge = getAprovacaoBadge(aprovacao?.status);
  const AprovacaoIcon = aprovacaoBadge.icon;
  const statusAtualNormalizado = String(proposta?.status || '')
    .trim()
    .toLowerCase();
  const statusSemFollowup = new Set(['rascunho', 'rejeitada', 'expirada', 'pago']);
  const podeAgendarFollowup = Boolean(propostaId) && !statusSemFollowup.has(statusAtualNormalizado);

  const versoesOrdenadas = useMemo(() => {
    return [...(historico?.versoes || [])].sort((a, b) => Number(b.versao || 0) - Number(a.versao || 0));
  }, [historico?.versoes]);

  useEffect(() => {
    if (versoesOrdenadas.length < 2) {
      setVersaoAtualSelecionada(null);
      setVersaoBaseSelecionada(null);
      return;
    }

    const versaoAtualPadrao = versoesOrdenadas[0].versao;
    const versaoBasePadrao = versoesOrdenadas[1].versao;
    const versoesDisponiveis = new Set(versoesOrdenadas.map((item) => item.versao));

    setVersaoAtualSelecionada((estadoAtual) => {
      if (estadoAtual && versoesDisponiveis.has(estadoAtual)) {
        return estadoAtual;
      }
      return versaoAtualPadrao;
    });

    setVersaoBaseSelecionada((estadoAtual) => {
      if (estadoAtual && versoesDisponiveis.has(estadoAtual)) {
        return estadoAtual;
      }
      return versaoBasePadrao;
    });
  }, [versoesOrdenadas]);

  const comparacaoVersoes = useMemo(() => {
    if (versaoAtualSelecionada == null || versaoBaseSelecionada == null) {
      return null;
    }

    const versaoAtual = versoesOrdenadas.find((item) => item.versao === versaoAtualSelecionada);
    const versaoBase = versoesOrdenadas.find((item) => item.versao === versaoBaseSelecionada);
    if (!versaoAtual || !versaoBase) {
      return null;
    }

    const snapshotAtual = versaoAtual.snapshot || {};
    const snapshotBase = versaoBase.snapshot || {};

    const totalAtual = parseNumber(snapshotAtual.total ?? snapshotAtual.valor, 0);
    const totalBase = parseNumber(snapshotBase.total ?? snapshotBase.valor, 0);
    const descontoAtual = parseNumber(snapshotAtual.descontoGlobal, 0);
    const descontoBase = parseNumber(snapshotBase.descontoGlobal, 0);
    const impostosAtual = parseNumber(snapshotAtual.impostos, 0);
    const impostosBase = parseNumber(snapshotBase.impostos, 0);
    const validadeAtual = parseNumber(snapshotAtual.validadeDias, 0);
    const validadeBase = parseNumber(snapshotBase.validadeDias, 0);

    const statusAtual = String(snapshotAtual.status || '');
    const statusBase = String(snapshotBase.status || '');
    const formaPagamentoAtual = String(snapshotAtual.formaPagamento || '');
    const formaPagamentoBase = String(snapshotBase.formaPagamento || '');
    const observacoesAtual = String(snapshotAtual.observacoes || '');
    const observacoesBase = String(snapshotBase.observacoes || '');

    const produtosAtual = extractProductNames(snapshotAtual.produtos);
    const produtosBase = extractProductNames(snapshotBase.produtos);
    const produtosBaseNormalizados = new Set(produtosBase.map((item) => normalizeText(item)));
    const produtosAtualNormalizados = new Set(produtosAtual.map((item) => normalizeText(item)));
    const itemsAtuaisMap = buildSnapshotItemMap(normalizeSnapshotItems(snapshotAtual.produtos));
    const itemsBaseMap = buildSnapshotItemMap(normalizeSnapshotItems(snapshotBase.produtos));
    const chavesItens = new Set([...itemsAtuaisMap.keys(), ...itemsBaseMap.keys()]);

    const produtosAdicionados = produtosAtual.filter(
      (item) => !produtosBaseNormalizados.has(normalizeText(item)),
    );
    const produtosRemovidos = produtosBase.filter(
      (item) => !produtosAtualNormalizados.has(normalizeText(item)),
    );

    const itensAlterados = Array.from(chavesItens)
      .map((chave) => {
        const itemAtual = itemsAtuaisMap.get(chave);
        const itemBase = itemsBaseMap.get(chave);

        const quantidadeAtual = parseNumber(itemAtual?.quantidade, 0);
        const quantidadeBase = parseNumber(itemBase?.quantidade, 0);
        const precoAtual = parseNumber(itemAtual?.precoUnitario, 0);
        const precoBase = parseNumber(itemBase?.precoUnitario, 0);
        const descontoAtualItem = parseNumber(itemAtual?.desconto, 0);
        const descontoBaseItem = parseNumber(itemBase?.desconto, 0);
        const subtotalAtual = parseNumber(itemAtual?.subtotal, 0);
        const subtotalBase = parseNumber(itemBase?.subtotal, 0);
        const composicaoAtual = String(itemAtual?.composicaoPlanoAssinatura || '').trim();
        const composicaoBase = String(itemBase?.composicaoPlanoAssinatura || '').trim();
        const composicaoAlterada = composicaoAtual !== composicaoBase;

        const adicionado = Boolean(itemAtual) && !itemBase;
        const removido = Boolean(itemBase) && !itemAtual;
        const alterado =
          adicionado ||
          removido ||
          Math.abs(quantidadeAtual - quantidadeBase) > 0.0001 ||
          Math.abs(precoAtual - precoBase) > 0.01 ||
          Math.abs(descontoAtualItem - descontoBaseItem) > 0.01 ||
          Math.abs(subtotalAtual - subtotalBase) > 0.01 ||
          composicaoAlterada;

        if (!alterado) {
          return null;
        }

        return {
          nome: itemAtual?.nome || itemBase?.nome || 'Item',
          adicionado,
          removido,
          quantidadeBase,
          quantidadeAtual,
          deltaQuantidade: quantidadeAtual - quantidadeBase,
          precoBase,
          precoAtual,
          deltaPreco: precoAtual - precoBase,
          descontoBase: descontoBaseItem,
          descontoAtual: descontoAtualItem,
          deltaDesconto: descontoAtualItem - descontoBaseItem,
          subtotalBase,
          subtotalAtual,
          deltaSubtotal: subtotalAtual - subtotalBase,
          composicaoAlterada,
          composicaoResumoBase: String(itemBase?.resumoComposicaoPlano || ''),
          composicaoResumoAtual: String(itemAtual?.resumoComposicaoPlano || ''),
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort(
        (a, b) =>
          Number(b.composicaoAlterada) - Number(a.composicaoAlterada) ||
          Math.abs(b.deltaSubtotal) - Math.abs(a.deltaSubtotal),
      )
      .slice(0, 8);

    return {
      versaoAtual,
      versaoBase,
      totalAtual,
      totalBase,
      deltaTotal: totalAtual - totalBase,
      descontoAtual,
      descontoBase,
      deltaDesconto: descontoAtual - descontoBase,
      impostosAtual,
      impostosBase,
      deltaImpostos: impostosAtual - impostosBase,
      validadeAtual,
      validadeBase,
      deltaValidade: validadeAtual - validadeBase,
      statusAtual,
      statusBase,
      formaPagamentoAtual,
      formaPagamentoBase,
      observacoesMudaram: normalizeText(observacoesAtual) !== normalizeText(observacoesBase),
      quantidadeProdutosAtual: produtosAtual.length,
      quantidadeProdutosBase: produtosBase.length,
      deltaProdutos: produtosAtual.length - produtosBase.length,
      produtosAdicionados: produtosAdicionados.slice(0, 4),
      produtosRemovidos: produtosRemovidos.slice(0, 4),
      itensAlterados,
      totalItensAlterados: itensAlterados.length,
    };
  }, [versaoAtualSelecionada, versaoBaseSelecionada, versoesOrdenadas]);

  const ultimosEventos = useMemo(() => {
    return [...(historico?.log || [])]
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .slice(0, 8);
  }, [historico?.log]);

  if (!proposta) return null;

  const versaoSnapshotAtual = (() => {
    if (!historico?.versoes || historico.versoes.length === 0) {
      return null;
    }

    const ordenadas = [...historico.versoes].sort(
      (a, b) => Number(b.versao || 0) - Number(a.versao || 0),
    );

    return ordenadas[0]?.snapshot || null;
  })();

  const itensNegociados: ItemNegociado[] = (() => {
    const itensDaProposta = Array.isArray(proposta.produtos) ? proposta.produtos : [];

    if (itensDaProposta.length > 0) {
      return itensDaProposta
        .map((item) => {
          const rawItem = item as unknown as Record<string, unknown>;
          const produto = rawItem?.produto && typeof rawItem.produto === 'object' ? rawItem.produto : null;
          const quantidade = Number(rawItem?.quantidade ?? 0);
          const precoUnitario = Number(
            rawItem?.precoUnitario ??
              rawItem?.preco ??
              (produto as any)?.precoUnitario ??
              (produto as any)?.preco ??
              0,
          );
          const desconto = Number(rawItem?.desconto ?? 0);
          const subtotalCalculado = quantidade * precoUnitario * (1 - desconto / 100);
          const subtotalInformado = Number(rawItem?.subtotal ?? rawItem?.valorTotal);

          const componentesPlano = normalizePlanoComponentes(
            rawItem?.componentesPlano ??
              rawItem?.componentes ??
              (produto as any)?.componentes,
          );

          return {
            produtoId: String(
              (rawItem?.produtoId as string) ||
                (rawItem?.id as string) ||
                (produto as any)?.id ||
                '',
            ),
            nome:
              typeof rawItem?.nome === 'string'
                ? String(rawItem.nome)
                : typeof rawItem?.produtoNome === 'string'
                  ? String(rawItem.produtoNome)
                  : typeof (produto as any)?.nome === 'string'
                    ? String((produto as any).nome)
                    : '',
            descricao:
              typeof rawItem?.descricao === 'string'
                ? String(rawItem.descricao)
                : typeof (produto as any)?.descricao === 'string'
                ? String((produto as any).descricao)
                : '',
            quantidade: Number.isFinite(quantidade) ? quantidade : 0,
            precoUnitario: Number.isFinite(precoUnitario) ? precoUnitario : 0,
            desconto: Number.isFinite(desconto) ? desconto : 0,
            subtotal: Number.isFinite(subtotalInformado)
              ? subtotalInformado
              : Number.isFinite(subtotalCalculado)
                ? subtotalCalculado
                : 0,
            tipoItem:
              typeof rawItem?.tipoItem === 'string'
                ? String(rawItem.tipoItem)
                : typeof (produto as any)?.tipoItem === 'string'
                ? String((produto as any).tipoItem)
                : undefined,
            componentesPlano,
          };
        })
        .map((item, index) => ({
          ...item,
          nome: item.nome.trim() ? item.nome : `Item ${index + 1}`,
        }));
    }

    const snapshotProdutos = (versaoSnapshotAtual as any)?.produtos;
    if (!Array.isArray(snapshotProdutos) || snapshotProdutos.length === 0) {
      return [];
    }

    return snapshotProdutos
      .map((raw: any, index: number) => {
        const nestedProduto = raw?.produto && typeof raw.produto === 'object' ? raw.produto : null;
        const produtoIdRaw =
          raw?.produtoId ??
          raw?.produto_id ??
          raw?.id ??
          raw?.produto?.id ??
          raw?.produto?.produtoId ??
          raw?.produto?.produto_id ??
          nestedProduto?.id ??
          nestedProduto?.produtoId ??
          nestedProduto?.produto_id ??
          '';
        const nome =
          (typeof raw?.nome === 'string' && raw.nome.trim()) ||
          (typeof raw?.produtoNome === 'string' && raw.produtoNome.trim()) ||
          (typeof nestedProduto?.nome === 'string' && String(nestedProduto.nome).trim()) ||
          `Item ${index + 1}`;

        const quantidade = Number(raw?.quantidade ?? 0);
        const precoUnitario = Number(raw?.precoUnitario ?? raw?.preco ?? nestedProduto?.preco ?? 0);
        const desconto = Number(raw?.desconto ?? 0);
        const subtotalCalculado = quantidade * precoUnitario * (1 - desconto / 100);
        const subtotal = Number(raw?.subtotal ?? subtotalCalculado);
        const tipoItemRaw = raw?.tipoItem ?? nestedProduto?.tipoItem ?? '';
        const componentesPlano = normalizePlanoComponentes(
          raw?.componentesPlano ?? raw?.componentes ?? nestedProduto?.componentes,
        );

        return {
          produtoId: String(produtoIdRaw || ''),
          nome: String(nome),
          descricao: String(raw?.descricao ?? nestedProduto?.descricao ?? ''),
          quantidade: Number.isFinite(quantidade) ? quantidade : 0,
          precoUnitario: Number.isFinite(precoUnitario) ? precoUnitario : 0,
          desconto: Number.isFinite(desconto) ? desconto : 0,
          subtotal: Number.isFinite(subtotal) ? subtotal : 0,
          tipoItem: typeof tipoItemRaw === 'string' ? tipoItemRaw : undefined,
          componentesPlano,
        };
      })
      .filter((item) => item.nome.trim().length > 0);
  })();
  const subtotalProposta = Number(proposta.subtotal || 0);
  const totalProposta = Number(proposta.total || 0);
  const descontoGlobalPercentual = Number(proposta.descontoGlobal || 0);
  const impostosPercentual = Number(proposta.impostos || 0);
  const descontoGlobalNormalizado = Math.min(100, Math.max(0, descontoGlobalPercentual));
  const impostosNormalizado = Math.min(100, Math.max(0, impostosPercentual));
  const formaPagamentoDescricao = descreverFormaPagamento(
    proposta.formaPagamento,
    proposta.parcelas,
  );
  const subtotalItensNegociados = itensNegociados.reduce((acc, item) => acc + Number(item.subtotal || 0), 0);
  const valorDescontoItens = itensNegociados.reduce((acc, item) => {
    const quantidade = Math.max(0, Number(item.quantidade || 0));
    const precoUnitario = Math.max(0, Number(item.precoUnitario || 0));
    const descontoItemPercentual = Math.min(100, Math.max(0, Number(item.desconto || 0)));
    return acc + quantidade * precoUnitario * (descontoItemPercentual / 100);
  }, 0);
  const valorDescontoGlobal = subtotalProposta * (descontoGlobalNormalizado / 100);
  const valorTotalDescontos = valorDescontoItens + valorDescontoGlobal;
  const baseCalculoImpostos = Math.max(0, subtotalProposta - valorDescontoGlobal);
  const valorImpostos = baseCalculoImpostos * (impostosNormalizado / 100);
  const divergenciaSubtotal = subtotalItensNegociados - subtotalProposta;
  const existeDivergenciaSubtotal =
    itensNegociados.length > 0 && Number.isFinite(divergenciaSubtotal) && Math.abs(divergenciaSubtotal) > 0.01;
  const statusAtualDetalhe = String(proposta.status || '')
    .trim()
    .toLowerCase();
  const exibirSecaoAcoesFluxo = !['rejeitada', 'expirada', 'pago'].includes(statusAtualDetalhe);
  const tituloExibicao = proposta.titulo || 'Proposta comercial';
  const registroCriacaoSistema = proposta.criadaEm ? formatDateTime(proposta.criadaEm) : 'N/A';

  const missingIdsKey = (() => {
    const missingIds = Array.from(
      new Set(
        itensNegociados
          .filter((item) => item.nome.startsWith('Item ') && item.produtoId)
          .map((item) => item.produtoId),
      ),
    )
      .filter((id) => Boolean(id))
      .sort();
    return missingIds.join('|');
  })();

  useEffect(() => {
    if (!shouldRender) {
      return;
    }

    const missingIds = missingIdsKey ? missingIdsKey.split('|') : [];
    const idsToFetch = missingIds.filter((id) => id && !nomesProdutosPorId[id]).slice(0, 10);
    if (idsToFetch.length === 0) {
      return;
    }

    let cancelled = false;

    const fetchNames = async () => {
      try {
        const results = await Promise.all(
          idsToFetch.map(async (id) => {
            try {
              const produto = await produtosService.findById(id);
              return { id, nome: produto?.nome ? String(produto.nome) : '' };
            } catch {
              return { id, nome: '' };
            }
          }),
        );

        if (cancelled) {
          return;
        }

        setNomesProdutosPorId((prev) => {
          const next = { ...prev };
          results.forEach((result) => {
            if (result.nome) {
              next[result.id] = result.nome;
            }
          });
          return next;
        });
      } catch {
        // Silencioso: apenas nao enriquece os nomes.
      }
    };

    void fetchNames();

    return () => {
      cancelled = true;
    };
  }, [shouldRender, missingIdsKey, nomesProdutosPorId]);

  const footerContent =
    onClose && !isPageMode ? (
      <div className="flex items-center justify-end">
        <ModalButton type="button" variant="secondary" onClick={onClose}>
          Fechar
        </ModalButton>
      </div>
    ) : undefined;

  const handleAtualizarPagina = () => {
    void carregarDadosCiclo();
    onPropostaUpdated?.();
  };

  const handleRecalcularTotais = async () => {
    if (!propostaId) {
      toastService.error('Proposta sem identificador para recalcular totais.');
      return;
    }

    if (itensNegociados.length === 0) {
      toastService.error('Adicione pelo menos 1 item para recalcular os totais.');
      return;
    }

    const subtotalRecalculado = itensNegociados.reduce((acc, item) => acc + Number(item.subtotal || 0), 0);
    const descontoPercentual = Math.max(Number(descontoGlobalPercentual || 0), 0);
    const impostosPercentualAtual = Math.max(Number(impostosPercentual || 0), 0);
    const valorDesconto = subtotalRecalculado * (descontoPercentual / 100);
    const subtotalComDesconto = subtotalRecalculado - valorDesconto;
    const valorImpostos = subtotalComDesconto * (impostosPercentualAtual / 100);
    const totalRecalculado = Math.max(subtotalComDesconto + valorImpostos, 0);

    try {
      setRecalculandoTotais(true);
      await propostasApiService.update(propostaId, {
        subtotal: Number(subtotalRecalculado.toFixed(2)),
        descontoGlobal: descontoPercentual,
        impostos: impostosPercentualAtual,
        total: Number(totalRecalculado.toFixed(2)),
        valor: Number(totalRecalculado.toFixed(2)),
      } as any);

      toastService.success('Totais recalculados com base nos itens da proposta.');
      handleAtualizarPagina();
    } catch (error) {
      console.error('Erro ao recalcular totais da proposta:', error);
      toastService.error('Nao foi possivel recalcular os totais da proposta.');
    } finally {
      setRecalculandoTotais(false);
    }
  };

  const compartilharSection = (
    <div className={`${isPageMode ? '' : 'mb-4 '}rounded-xl border border-[#E2ECF0] bg-[#F7FBFC] p-3 sm:p-4`}>
        <h4 className="mb-3 text-sm font-medium text-[#19384C]">Compartilhar proposta</h4>
        <PropostaActions
          proposta={proposta}
          onEditProposta={
            onEditProposta ? (propostaAtual) => onEditProposta(propostaAtual as PropostaCompleta) : undefined
          }
          onPropostaUpdated={onPropostaUpdated}
          showLabels={true}
          className="flex-wrap"
          actionScope="share"
        />
      </div>
  );

  const fluxoSection = exibirSecaoAcoesFluxo ? (
    <div className={`${isPageMode ? '' : 'mb-4 '}rounded-xl border border-[#E2ECF0] bg-[#F7FBFC] p-3 sm:p-4`}>
      <h4 className="mb-1 text-sm font-medium text-[#19384C]">Proxima etapa</h4>
      <p className="mb-3 text-xs text-[#607B89]">Acoes comerciais e de fluxo para o estagio atual da proposta</p>
      <PropostaActions
        proposta={proposta}
        onEditProposta={
          onEditProposta ? (propostaAtual) => onEditProposta(propostaAtual as PropostaCompleta) : undefined
        }
        onPropostaUpdated={onPropostaUpdated}
        showLabels={true}
        className="flex-wrap"
        actionScope="flow"
      />
    </div>
  ) : null;

  const cicloSection = (
    <div className={`${isPageMode ? '' : 'mb-4 '}rounded-xl border border-[#DCE7EC] bg-[#F8FBFC] p-4`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-[#2B4C5F]">Ciclo comercial</h4>
            <p className="text-xs text-[#607B89]">Rastreio de envio, aceite, aprovacao e versoes da proposta</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCiclo((prev) => !prev)}
              className="inline-flex h-8 items-center rounded-md border border-[#C8DAE2] bg-white px-3 text-xs font-medium text-[#244455] transition hover:bg-[#F1F7FA]"
            >
              {showCiclo ? 'Ocultar' : 'Ver detalhes'}
            </button>
          </div>
        </div>

        {!showCiclo ? (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-white p-3 ring-1 ring-[#E7EFF3]">
              <p className="text-xs text-[#607B89]">Criacao no sistema</p>
              <p className="mt-1 text-sm font-medium text-[#19384C]">
                {formatDateTime(proposta.criadaEm)}
              </p>
            </div>
            <div className="rounded-lg bg-white p-3 ring-1 ring-[#E7EFF3]">
              <p className="text-xs text-[#607B89]">Total visualizacoes</p>
              <p className="mt-1 text-sm font-medium text-[#19384C]">
                {Number(estatisticas?.totalVisualizacoes || 0)}
              </p>
            </div>
          </div>
        ) : (
          <>
            {podeAgendarFollowup && (
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowFollowupForm((prev) => !prev)}
                  disabled={agendandoFollowup || !propostaId}
                  className="inline-flex h-8 items-center justify-center rounded-md bg-[#159A9C] px-3 text-xs font-medium text-white transition hover:bg-[#0F7B7D] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {agendandoFollowup ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Agendando...
                    </>
                  ) : (
                    <>
                      <Clock className="mr-2 h-3.5 w-3.5" />
                      Agendar follow-up
                    </>
                  )}
                </button>
              </div>
            )}

            {showFollowupForm && podeAgendarFollowup && (
              <div className="mt-3 rounded-lg bg-white p-3 ring-1 ring-[#E7EFF3]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <label className="flex flex-col gap-1 text-xs text-[#607B89]">
                    Em quantos dias?
                    <input
                      type="number"
                      min={1}
                      max={365}
                      step={1}
                      value={followupDias}
                      onChange={(event) => setFollowupDias(event.target.value)}
                      className="h-8 w-full rounded-md border border-[#C8DAE2] bg-white px-2 text-xs text-[#244455] sm:w-40"
                    />
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowFollowupForm(false)}
                      className="inline-flex h-8 items-center rounded-md border border-[#C8DAE2] bg-white px-3 text-xs font-medium text-[#244455] transition hover:bg-[#F1F7FA]"
                      disabled={agendandoFollowup}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const parsed = Number(followupDias);
                        const dias = Math.max(1, Math.floor(Number.isFinite(parsed) ? parsed : 3));
                        void handleAgendarFollowup(dias);
                      }}
                      disabled={agendandoFollowup || !propostaId}
                      className="inline-flex h-8 items-center rounded-md bg-[#159A9C] px-3 text-xs font-medium text-white transition hover:bg-[#0F7B7D] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {loadingCiclo ? (
              <div className="mt-3 flex items-center gap-2 text-sm text-[#607B89]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando dados do ciclo...
              </div>
            ) : (
              <div className="mt-3 space-y-4 rounded-lg bg-[#F4FAFC] p-3 ring-1 ring-[#E2ECF0]">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg bg-white p-3 ring-1 ring-[#E7EFF3]">
                  <p className="text-xs text-[#607B89]">Criacao no sistema</p>
                  <p className="mt-1 text-sm font-medium text-[#19384C]">
                    {formatDateTime(historico?.criacaoEm || proposta.criadaEm)}
                  </p>
                </div>
                <div className="rounded-lg bg-white p-3 ring-1 ring-[#E7EFF3]">
                  <p className="text-xs text-[#607B89]">Primeiro envio</p>
                  <p className="mt-1 text-sm font-medium text-[#19384C]">{formatDateTime(historico?.envioEm)}</p>
                </div>
                <div className="rounded-lg bg-white p-3 ring-1 ring-[#E7EFF3]">
                  <p className="text-xs text-[#607B89]">Primeira visualizacao</p>
                  <p className="mt-1 text-sm font-medium text-[#19384C]">
                    {formatDateTime(historico?.primeiraVisualizacaoEm)}
                  </p>
                </div>
                <div className="rounded-lg bg-white p-3 ring-1 ring-[#E7EFF3]">
                  <p className="text-xs text-[#607B89]">Total visualizacoes</p>
                  <p className="mt-1 text-sm font-medium text-[#19384C]">
                    {Number(estatisticas?.totalVisualizacoes || 0)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-lg bg-white p-3 ring-1 ring-[#E7EFF3]">
                  <div className="mb-2 flex items-center gap-2">
                    <AprovacaoIcon className="h-4 w-4" />
                    <p className="text-sm font-semibold text-[#19384C]">Aprovacao interna</p>
                  </div>
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${aprovacaoBadge.className}`}>
                    {aprovacaoBadge.label}
                  </span>
                  {aprovacao?.motivo && (
                    <p className="mt-2 text-xs text-[#546E7A]">Motivo: {aprovacao.motivo}</p>
                  )}
                  {typeof aprovacao?.descontoDetectado === 'number' && typeof aprovacao?.limiteDesconto === 'number' && (
                    <p className="mt-1 text-xs text-[#546E7A]">
                      Desconto: {aprovacao.descontoDetectado.toFixed(2)}% (limite: {aprovacao.limiteDesconto.toFixed(2)}%)
                    </p>
                  )}
                  {aprovacao?.observacoes && (
                    <p className="mt-1 text-xs text-[#546E7A]">Obs: {aprovacao.observacoes}</p>
                  )}
                </div>

                <div className="rounded-lg bg-white p-3 ring-1 ring-[#E7EFF3]">
                  <div className="mb-2 flex items-center gap-2">
                    <Eye className="h-4 w-4 text-[#0F7B7D]" />
                    <p className="text-sm font-semibold text-[#19384C]">Rastreio de aceite</p>
                  </div>
                  <p className="text-xs text-[#546E7A]">
                    Ultima visualizacao: {formatDateTime(estatisticas?.ultimaVisualizacao)}
                  </p>
                  <p className="mt-1 text-xs text-[#546E7A]">
                    Tempo medio entre visualizacoes: {Number(estatisticas?.tempoMedioVisualizacao || 0).toFixed(0)}s
                  </p>
                  <p className="mt-1 text-xs text-[#546E7A]">Decisao comercial: {formatDateTime(historico?.decisaoEm)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-lg bg-white p-3 ring-1 ring-[#E7EFF3]">
                  <div className="mb-2 flex items-center gap-2">
                    <History className="h-4 w-4 text-[#2B4C5F]" />
                    <p className="text-sm font-semibold text-[#19384C]">Versionamento</p>
                  </div>
                  {versoesOrdenadas.length === 0 ? (
                    <p className="text-xs text-[#607B89]">Nenhuma versao registrada.</p>
                  ) : (
                    <div className="max-h-36 space-y-2 overflow-y-auto pr-1">
                      {versoesOrdenadas.map((versao) => (
                        <div key={versao.versao} className="rounded-md bg-[#FCFDFE] p-2 ring-1 ring-[#EDF3F6]">
                          <p className="text-xs font-medium text-[#19384C]">
                            v{versao.versao} - {formatDateTime(versao.criadaEm)}
                          </p>
                          <p className="text-xs text-[#607B89]">
                            {versao.descricao || 'Atualizacao de proposta'}
                          </p>
                          <p className="text-xs text-[#607B89]">
                            Status: {getStatusText(versao.snapshot?.status)} | Total: {formatCurrency(Number(versao.snapshot?.total || 0))}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {versoesOrdenadas.length >= 2 && (
                    <div className="mt-3 rounded-md bg-[#FAFCFD] p-2 ring-1 ring-[#DCE7EC]">
                      <p className="text-xs font-medium text-[#244455]">Comparar versoes</p>
                      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <label className="flex flex-col gap-1 text-xs text-[#607B89]">
                          Versao atual
                          <select
                            value={versaoAtualSelecionada || ''}
                            onChange={(event) => {
                              const parsed = Number(event.target.value);
                              setVersaoAtualSelecionada(Number.isFinite(parsed) ? parsed : null);
                            }}
                            className="h-8 rounded-md border border-[#C8DAE2] bg-white px-2 text-xs text-[#244455]"
                          >
                            {versoesOrdenadas.map((item) => (
                              <option key={`atual-${item.versao}`} value={item.versao}>
                                v{item.versao}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="flex flex-col gap-1 text-xs text-[#607B89]">
                          Versao base
                          <select
                            value={versaoBaseSelecionada || ''}
                            onChange={(event) => {
                              const parsed = Number(event.target.value);
                              setVersaoBaseSelecionada(Number.isFinite(parsed) ? parsed : null);
                            }}
                            className="h-8 rounded-md border border-[#C8DAE2] bg-white px-2 text-xs text-[#244455]"
                          >
                            {versoesOrdenadas.map((item) => (
                              <option key={`base-${item.versao}`} value={item.versao}>
                                v{item.versao}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      {comparacaoVersoes ? (
                        <div className="mt-2 space-y-1 rounded-md bg-white p-2 text-xs text-[#546E7A] ring-1 ring-[#E7EFF3]">
                          <p>
                            Total: {formatCurrency(comparacaoVersoes.totalBase)}
                            {' -> '}
                            {formatCurrency(comparacaoVersoes.totalAtual)} ({comparacaoVersoes.deltaTotal >= 0 ? '+' : ''}
                            {formatCurrency(comparacaoVersoes.deltaTotal)})
                          </p>
                          <p>
                            Status: {getStatusText(comparacaoVersoes.statusBase)}
                            {' -> '}
                            {getStatusText(comparacaoVersoes.statusAtual)}
                          </p>
                          <p>
                            Desconto global: {comparacaoVersoes.descontoBase.toFixed(2)}%
                            {' -> '}
                            {comparacaoVersoes.descontoAtual.toFixed(2)}%
                          </p>
                          <p>
                            Impostos: {comparacaoVersoes.impostosBase.toFixed(2)}%
                            {' -> '}
                            {comparacaoVersoes.impostosAtual.toFixed(2)}%
                          </p>
                          <p>
                            Validade: {comparacaoVersoes.validadeBase}
                            {' -> '}
                            {comparacaoVersoes.validadeAtual} dia(s)
                          </p>
                          <p>
                            Forma pagamento: {comparacaoVersoes.formaPagamentoBase || '-'}
                            {' -> '}
                            {comparacaoVersoes.formaPagamentoAtual || '-'}
                          </p>
                          <p>
                            Itens: {comparacaoVersoes.quantidadeProdutosBase}
                            {' -> '}
                            {comparacaoVersoes.quantidadeProdutosAtual} ({comparacaoVersoes.deltaProdutos >= 0 ? '+' : ''}
                            {comparacaoVersoes.deltaProdutos})
                          </p>
                          <p>Observacoes alteradas: {comparacaoVersoes.observacoesMudaram ? 'Sim' : 'Nao'}</p>

                          {comparacaoVersoes.produtosAdicionados.length > 0 && (
                            <p>Itens adicionados: {comparacaoVersoes.produtosAdicionados.join(', ')}</p>
                          )}
                          {comparacaoVersoes.produtosRemovidos.length > 0 && (
                            <p>Itens removidos: {comparacaoVersoes.produtosRemovidos.join(', ')}</p>
                          )}

                          {comparacaoVersoes.itensAlterados.length > 0 && (
                            <div className="mt-2 rounded-md bg-[#F8FBFC] p-2 ring-1 ring-[#E2ECF0]">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#244455]">
                                Detalhe por item ({comparacaoVersoes.totalItensAlterados})
                              </p>
                              <div className="mt-2 max-h-40 space-y-1 overflow-y-auto pr-1">
                                {comparacaoVersoes.itensAlterados.map((item) => (
                                  <div key={item.nome} className="rounded-md bg-white p-2 ring-1 ring-[#EDF3F6]">
                                    <p className="text-xs font-semibold text-[#19384C]">
                                      {item.nome}{' '}
                                      {item.adicionado ? '(adicionado)' : item.removido ? '(removido)' : ''}
                                    </p>
                                    <p className="text-[11px] text-[#546E7A]">
                                      Qtd: {item.quantidadeBase}
                                      {' -> '}
                                      {item.quantidadeAtual} | Unit: {formatCurrency(item.precoBase)}
                                      {' -> '}
                                      {formatCurrency(item.precoAtual)}
                                    </p>
                                    <p className="text-[11px] text-[#546E7A]">
                                      Desc: {item.descontoBase.toFixed(2)}%
                                      {' -> '}
                                      {item.descontoAtual.toFixed(2)}% | Subtotal:{' '}
                                      {formatCurrency(item.subtotalBase)}
                                      {' -> '}
                                      {formatCurrency(item.subtotalAtual)}
                                    </p>
                                    {(item.composicaoAlterada ||
                                      item.composicaoResumoBase ||
                                      item.composicaoResumoAtual) && (
                                      <p className="text-[11px] text-[#546E7A]">
                                        Composicao:{' '}
                                        {item.composicaoResumoBase || '-'}
                                        {' -> '}
                                        {item.composicaoResumoAtual || '-'}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-[#607B89]">
                          Selecione duas versoes para comparar alteracoes.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="rounded-lg bg-white p-3 ring-1 ring-[#E7EFF3]">
                  <div className="mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#2B4C5F]" />
                    <p className="text-sm font-semibold text-[#19384C]">Historico recente</p>
                  </div>
                  {ultimosEventos.length === 0 ? (
                    <p className="text-xs text-[#607B89]">Sem eventos registrados.</p>
                  ) : (
                    <div className="max-h-36 space-y-2 overflow-y-auto pr-1">
                      {ultimosEventos.map((evento, index) => (
                        <div
                          key={`${evento.data}-${evento.evento}-${index}`}
                          className="rounded-md bg-[#FCFDFE] p-2 ring-1 ring-[#EDF3F6]"
                        >
                          <p className="text-xs font-medium text-[#19384C]">{formatDateTime(evento.data)}</p>
                          <p className="text-xs text-[#546E7A]">{evento.evento}</p>
                          {evento.detalhes ? <p className="text-xs text-[#607B89]">{evento.detalhes}</p> : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              </div>
            )}
          </>
        )}
      </div>
  );

  const informacoesFluxoSection = (
    <div className="space-y-5">
      <section className="rounded-xl border border-[#DCE7EC] bg-white p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#E2ECF0] pb-3">
          <h4 className="text-lg font-semibold text-[#19384C]">Informacoes do cliente</h4>
          <span className="rounded-full bg-[#F1F7FA] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#486572]">
            {proposta.cliente?.tipoPessoa === 'juridica' ? 'Pessoa juridica' : 'Pessoa fisica'}
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <User className="mt-0.5 h-4 w-4 text-[#8BA0AA]" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#19384C]">
                {proposta.cliente?.nome || 'Nome nao informado'}
              </p>
              {proposta.cliente?.documento ? (
                <p className="text-xs text-[#607B89]">Documento: {proposta.cliente.documento}</p>
              ) : (
                <p className="text-xs text-[#607B89]">Documento nao informado</p>
              )}
            </div>
          </div>

          {proposta.cliente?.email && (
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 text-[#8BA0AA]" />
              <span className="text-sm text-[#355166]">{proposta.cliente.email}</span>
            </div>
          )}

          {proposta.cliente?.telefone && (
            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 h-4 w-4 text-[#8BA0AA]" />
              <span className="text-sm text-[#355166]">{proposta.cliente.telefone}</span>
            </div>
          )}

          {proposta.cliente?.endereco && (
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 text-[#8BA0AA]" />
              <span className="text-sm text-[#355166]">
                {proposta.cliente.endereco}
                {proposta.cliente.cidade && `, ${proposta.cliente.cidade}`}
                {proposta.cliente.estado && ` - ${proposta.cliente.estado}`}
              </span>
            </div>
          )}

          {!proposta.cliente?.email && !proposta.cliente?.telefone && !proposta.cliente?.endereco && (
            <p className="text-[11px] text-[#8BA0AA]">Dados complementares do cliente ainda nao informados.</p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-[#DCE7EC] bg-white p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#E2ECF0] pb-3">
          <h4 className="text-lg font-semibold text-[#19384C]">Produtos / Servicos</h4>
          {itensNegociados.length > 0 && (
            <span className="rounded-full bg-[#F1F7FA] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#486572]">
              {itensNegociados.length} item(ns)
            </span>
          )}
        </div>

        {itensNegociados.length === 0 ? (
          loadingCiclo ? (
            <div className="flex items-center gap-2 text-sm text-[#607B89]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando itens negociados...
            </div>
          ) : (
            <p className="text-sm text-[#607B89]">Nenhum item informado nesta proposta.</p>
          )
        ) : (
          <div className="space-y-3">
            {itensNegociados.map((item, index) => {
              const nomeProdutoRaw = item?.nome || 'Produto/Servico';
              const nomeProduto =
                nomeProdutoRaw.startsWith('Item ') && item.produtoId && nomesProdutosPorId[item.produtoId]
                  ? nomesProdutosPorId[item.produtoId]
                  : nomeProdutoRaw;
              const descricaoProduto = item?.descricao || '';
              const precoUnit = Number(item?.precoUnitario || 0);
              const quantidade = Math.max(1, Number(item?.quantidade || 0));
              const desconto = Number(item?.desconto || 0);
              const subtotal = Number(item?.subtotal || 0);
              const composicaoDetalhes = getComposicaoDetalhes(item);

              return (
                <article
                  key={`${item.produtoId || nomeProduto}-${index}`}
                  className="rounded-lg border border-[#E2ECF0] bg-[#FBFDFD] p-3"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#19384C]">{nomeProduto}</p>
                      {descricaoProduto ? <p className="mt-1 text-xs text-[#607B89]">{descricaoProduto}</p> : null}
                    </div>
                    <span className="inline-flex rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#486572] shadow-sm ring-1 ring-[#DCE7EC]">
                      x{quantidade}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 2xl:grid-cols-4">
                    <div className="rounded-md bg-white px-3 py-2 ring-1 ring-[#E7EFF3]">
                      <p className="text-[11px] uppercase tracking-wide text-[#607B89]">Qtd</p>
                      <p className="mt-1 break-words text-sm font-semibold text-[#19384C]">{quantidade}</p>
                    </div>
                    <div className="rounded-md bg-white px-3 py-2 ring-1 ring-[#E7EFF3]">
                      <p className="text-[11px] uppercase tracking-wide text-[#607B89]">Unitario</p>
                      <p className="mt-1 break-words text-sm font-semibold text-[#19384C]">
                        {formatCurrency(precoUnit)}
                      </p>
                    </div>
                    <div className="rounded-md bg-white px-3 py-2 ring-1 ring-[#E7EFF3]">
                      <p className="text-[11px] uppercase tracking-wide text-[#607B89]">Desconto</p>
                      <p className="mt-1 break-words text-sm font-semibold text-[#19384C]">{desconto}%</p>
                    </div>
                    <div className="rounded-md bg-white px-3 py-2 ring-1 ring-[#E7EFF3]">
                      <p className="text-[11px] uppercase tracking-wide text-[#607B89]">Subtotal</p>
                      <p className="mt-1 break-words text-sm font-semibold text-[#159A9C]">
                        {formatCurrency(subtotal)}
                      </p>
                    </div>
                  </div>

                  {composicaoDetalhes.length > 0 && (
                    <div className="mt-3 space-y-1 rounded-md border border-[#D4E2E7] bg-white px-3 py-2">
                      {composicaoDetalhes.map((detalhe, detalheIndex) => (
                        <p
                          key={`${item.produtoId || nomeProduto}-comp-${detalheIndex}`}
                          className="text-xs text-[#35538A]"
                        >
                          {detalhe}
                        </p>
                      ))}
                      {(item.componentesPlano?.length || 0) > 3 && (
                        <p className="text-xs font-medium text-[#607B89]">
                          +{(item.componentesPlano?.length || 0) - 3} componente(s)
                        </p>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {proposta.observacoes && (
        <section className="rounded-xl border border-[#DCE7EC] bg-white p-4">
          <h4 className="mb-3 border-b border-[#E2ECF0] pb-2 text-lg font-semibold text-[#19384C]">
            Observacoes
          </h4>
          <p className="whitespace-pre-wrap text-sm text-[#355166]">{proposta.observacoes}</p>
        </section>
      )}
    </div>
  );

  const dadosComerciaisSection = (
    <div className={`space-y-5 ${isPageMode ? 'xl:sticky xl:top-4' : ''}`}>
      <section className="rounded-xl border border-[#DCE7EC] bg-white p-4">
        <h4 className="mb-4 border-b border-[#E2ECF0] pb-3 text-lg font-semibold text-[#19384C]">
          Detalhes da proposta
        </h4>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-md bg-[#F8FBFC] px-3 py-2 ring-1 ring-[#E7EFF3]">
            <p className="text-[11px] uppercase tracking-wide text-[#607B89]">Subtotal</p>
            <p className="mt-1 text-sm font-semibold text-[#19384C]">{formatCurrency(subtotalProposta)}</p>
          </div>
          <div className="rounded-md bg-[#F8FBFC] px-3 py-2 ring-1 ring-[#E7EFF3]">
            <p className="text-[11px] uppercase tracking-wide text-[#607B89]">Descontos</p>
            <p className="mt-1 text-sm font-semibold text-[#19384C]">
              {descontoGlobalPercentual.toFixed(2)}%
            </p>
            <p className="mt-1 text-xs text-[#607B89]">Itens: {formatCurrency(valorDescontoItens)}</p>
            <p className="text-xs text-[#607B89]">Global: {formatCurrency(valorDescontoGlobal)}</p>
            <p className="text-xs font-medium text-[#355166]">
              Total: {formatCurrency(valorTotalDescontos)}
            </p>
          </div>
          <div className="rounded-md bg-[#F8FBFC] px-3 py-2 ring-1 ring-[#E7EFF3]">
            <p className="text-[11px] uppercase tracking-wide text-[#607B89]">Impostos</p>
            <p className="mt-1 text-sm font-semibold text-[#19384C]">{impostosPercentual.toFixed(2)}%</p>
            <p className="mt-1 text-xs text-[#607B89]">Valor: {formatCurrency(valorImpostos)}</p>
          </div>
          <div className="rounded-md bg-[#F2FBF8] px-3 py-2 ring-1 ring-[#D5ECE3]">
            <p className="text-[11px] uppercase tracking-wide text-[#607B89]">Total</p>
            <p className="mt-1 text-lg font-bold text-[#159A9C]">{formatCurrency(totalProposta)}</p>
          </div>
        </div>

        {existeDivergenciaSubtotal && (
          <div className="mt-4 rounded-md border border-[#F7C78A] bg-[#FFF7EB] p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-[#B45309]" />
              <div>
                <p className="text-xs font-semibold text-[#92400E]">Conferencia financeira</p>
                <p className="mt-1 text-xs text-[#92400E]">
                  Soma dos itens: {formatCurrency(subtotalItensNegociados)} | Subtotal da proposta:{' '}
                  {formatCurrency(subtotalProposta)} | Diferenca: {formatCurrency(divergenciaSubtotal)}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-[#E2ECF0] bg-white p-3">
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-4 w-4 text-[#8BA0AA]" />
              <div>
                <p className="text-sm font-medium text-[#19384C]">
                  Valida ate: {formatDate(proposta.dataValidade)}
                </p>
                <p className="text-xs text-[#607B89]">
                  Registro no sistema: {proposta.criadaEm ? formatDateTime(proposta.criadaEm) : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-md border border-[#E2ECF0] bg-white p-3">
            <p className="text-[11px] uppercase tracking-wide text-[#607B89]">Forma de pagamento</p>
            <p className="mt-1 text-sm font-semibold text-[#19384C]">{formaPagamentoDescricao}</p>
            {Number.isFinite(Number(proposta.parcelas)) && Number(proposta.parcelas) > 1 && (
              <p className="mt-1 text-xs text-[#607B89]">Parcelas: {Number(proposta.parcelas)}x</p>
            )}
          </div>

          {typeof proposta.vendedor === 'object' ? (
            <div className="rounded-md border border-[#E2ECF0] bg-white p-3 sm:col-span-2">
              <div className="flex items-start gap-3">
                <Building className="mt-0.5 h-4 w-4 text-[#8BA0AA]" />
                <div>
                  <p className="text-sm font-medium text-[#19384C]">{proposta.vendedor.nome}</p>
                  <p className="text-xs text-[#607B89]">Vendedor responsavel</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );

  const dadosPropostaSection = (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] xl:gap-6">
      {informacoesFluxoSection}
      {dadosComerciaisSection}
    </div>
  );

  const detalhesConteudo = isPageMode ? (
    <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,0.85fr)]">
      <div className="space-y-5">
        {cicloSection}
        {informacoesFluxoSection}
      </div>
      <div className="space-y-5">
        {compartilharSection}
        {fluxoSection}
        {dadosComerciaisSection}
      </div>
    </div>
  ) : (
    <>
      {!isPageMode && (
        <div className="mb-4 flex items-center justify-end">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(proposta.status)}`}>
            {getStatusText(proposta.status)}
          </span>
        </div>
      )}
      {compartilharSection}
      {cicloSection}
      {dadosPropostaSection}
    </>
  );

  if (isPageMode) {
    return (
      <div className="space-y-4">
        <section className="rounded-xl border border-[#D8E5EB] bg-white p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#607B89]">
                Detalhe da proposta
              </p>
              <h1 className="mt-1 text-2xl font-bold text-[#19384C]">#{proposta.numero}</h1>
              <p className="mt-1 text-sm text-[#607B89]">{tituloExibicao}</p>
              <p className="mt-1 text-xs text-[#6D8694]">Registro no sistema: {registroCriacaoSistema}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(
                  proposta.status,
                )}`}
              >
                {getStatusText(proposta.status)}
              </span>
              <button
                type="button"
                onClick={handleAtualizarPagina}
                className="inline-flex h-9 items-center rounded-md border border-[#C8DAE2] bg-white px-3 text-sm font-medium text-[#244455] transition hover:bg-[#F1F7FA]"
              >
                Atualizar
              </button>
              <button
                type="button"
                onClick={handleRecalcularTotais}
                disabled={recalculandoTotais || itensNegociados.length === 0}
                className="inline-flex h-9 items-center rounded-md border border-[#C8DAE2] bg-white px-3 text-sm font-medium text-[#244455] transition hover:bg-[#F1F7FA] disabled:cursor-not-allowed disabled:opacity-60"
                title={
                  itensNegociados.length > 0
                    ? 'Recalcular subtotal e total com base nos itens da proposta'
                    : 'Inclua itens na proposta para recalcular os totais'
                }
              >
                {recalculandoTotais ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Recalculando...
                  </>
                ) : (
                  'Recalcular totais'
                )}
              </button>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-9 items-center rounded-md bg-[#159A9C] px-3 text-sm font-medium text-white transition hover:bg-[#0F7B7D]"
                >
                  Voltar
                </button>
              )}
            </div>
          </div>
        </section>
        {detalhesConteudo}
        </div>
    );
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose || (() => {})}
      title={`Proposta #${proposta.numero}`}
      subtitle={proposta.titulo || 'Proposta comercial'}
      size="large"
      footer={footerContent}
      contentClassName="p-3 sm:p-4"
      className="max-h-[78vh] sm:max-h-[82vh] max-w-[58rem]"
    >
      {detalhesConteudo}
    </BaseModal>
  );
};

export default ModalVisualizarProposta;
