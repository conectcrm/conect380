import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { PropostaCompleta } from '../services/propostasService';
import PropostaActions from './PropostaActions';
import { propostasService as propostasApiService } from '../../../services/propostasService';
import { BaseModal, ModalButton } from '../../../components/modals/BaseModal';
import { produtosService } from '../../../services/produtosService';
import {
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Building,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Clock,
  Eye,
  History,
} from 'lucide-react';

interface ModalVisualizarPropostaProps {
  isOpen: boolean;
  onClose: () => void;
  proposta: PropostaCompleta | null;
  onPropostaUpdated?: () => void;
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

const getStatusColor = (status?: string) => {
  const statusColors = {
    rascunho: 'bg-gray-100 text-gray-800',
    enviada: 'bg-blue-100 text-blue-800',
    visualizada: 'bg-sky-100 text-sky-800',
    negociacao: 'bg-amber-100 text-amber-800',
    aprovada: 'bg-green-100 text-green-800',
    rejeitada: 'bg-red-100 text-red-800',
    expirada: 'bg-orange-100 text-orange-800',
  };
  return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
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
    contrato_gerado: 'Contrato gerado',
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
        className: 'bg-green-100 text-green-800',
        icon: ShieldCheck,
      };
    case 'rejeitada':
      return {
        label: 'Aprovacao interna rejeitada',
        className: 'bg-red-100 text-red-800',
        icon: ShieldX,
      };
    case 'pendente':
      return {
        label: 'Aprovacao interna pendente',
        className: 'bg-amber-100 text-amber-800',
        icon: ShieldAlert,
      };
    default:
      return {
        label: 'Sem necessidade de alçada',
        className: 'bg-slate-100 text-slate-700',
        icon: ShieldCheck,
      };
  }
};

const parseNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeText = (value: unknown) => String(value || '').trim().toLowerCase();

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

      return {
        key: normalizeText(nome),
        nome: String(nome),
        quantidade,
        precoUnitario,
        desconto,
        subtotal,
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
    map.set(item.key, {
      ...existente,
      quantidade,
      subtotal,
      desconto: Math.max(existente.desconto, item.desconto),
      precoUnitario: quantidade > 0 ? subtotal / quantidade : existente.precoUnitario,
    });
  });

  return map;
};

const ModalVisualizarProposta: React.FC<ModalVisualizarPropostaProps> = ({
  isOpen,
  onClose,
  proposta,
  onPropostaUpdated,
}) => {
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
    if (!isOpen || !propostaId) {
      return;
    }
    void carregarDadosCiclo();
  }, [isOpen, propostaId, carregarDadosCiclo]);

  useEffect(() => {
    if (!isOpen) {
      setShowFollowupForm(false);
      setFollowupDias('3');
      setShowCiclo(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!showCiclo) {
      setShowFollowupForm(false);
    }
  }, [showCiclo]);

  const handleAgendarFollowup = async (dias: number) => {
    if (!propostaId) {
      toast.error('Proposta sem identificador para agendar follow-up.');
      return;
    }

    setAgendandoFollowup(true);
    try {
      await propostasApiService.agendarLembrete(propostaId, dias);
      toast.success(`Follow-up agendado para ${dias} dia(s).`);
      await carregarDadosCiclo();
      onPropostaUpdated?.();
      setShowFollowupForm(false);
    } catch (error) {
      console.error('Erro ao agendar follow-up:', error);
      toast.error('Nao foi possivel agendar o follow-up.');
    } finally {
      setAgendandoFollowup(false);
    }
  };

  const aprovacao =
    historico?.aprovacaoInterna ||
    (proposta?.aprovacaoInterna as HistoricoResposta['aprovacaoInterna'] | undefined);
  const aprovacaoBadge = getAprovacaoBadge(aprovacao?.status);
  const AprovacaoIcon = aprovacaoBadge.icon;

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

        const adicionado = Boolean(itemAtual) && !itemBase;
        const removido = Boolean(itemBase) && !itemAtual;
        const alterado =
          adicionado ||
          removido ||
          Math.abs(quantidadeAtual - quantidadeBase) > 0.0001 ||
          Math.abs(precoAtual - precoBase) > 0.01 ||
          Math.abs(descontoAtualItem - descontoBaseItem) > 0.01 ||
          Math.abs(subtotalAtual - subtotalBase) > 0.01;

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
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => Math.abs(b.deltaSubtotal) - Math.abs(a.deltaSubtotal))
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

  const itensNegociados = (() => {
    const itensDaProposta = Array.isArray(proposta.produtos) ? proposta.produtos : [];

    if (itensDaProposta.length > 0) {
      return itensDaProposta
        .map((item) => ({
          produtoId: String(item?.produto?.id || ''),
          nome: item?.produto?.nome || '',
          descricao: item?.produto?.descricao || '',
          quantidade: Number(item?.quantidade || 0),
          precoUnitario: Number(item?.produto?.preco || 0),
          desconto: Number(item?.desconto || 0),
          subtotal: Number(item?.subtotal || 0),
        }))
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
        const subtotalCalculado = quantidade * precoUnitario;
        const subtotal = Number(raw?.subtotal ?? subtotalCalculado);

        return {
          produtoId: String(produtoIdRaw || ''),
          nome: String(nome),
          descricao: String(raw?.descricao ?? nestedProduto?.descricao ?? ''),
          quantidade: Number.isFinite(quantidade) ? quantidade : 0,
          precoUnitario: Number.isFinite(precoUnitario) ? precoUnitario : 0,
          desconto: Number.isFinite(desconto) ? desconto : 0,
          subtotal: Number.isFinite(subtotal) ? subtotal : 0,
        };
      })
      .filter((item) => item.nome.trim().length > 0);
  })();

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
    if (!isOpen) {
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
  }, [isOpen, missingIdsKey, nomesProdutosPorId]);

  const footerContent = (
    <div className="flex items-center justify-end">
      <ModalButton type="button" variant="secondary" onClick={onClose}>
        Fechar
      </ModalButton>
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Proposta #${proposta.numero}`}
      subtitle={proposta.titulo || 'Proposta comercial'}
      size="large"
      footer={footerContent}
      contentClassName="p-3 sm:p-4"
      className="max-h-[80vh] max-w-5xl"
    >
      <div className="mb-4 flex items-center justify-end">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(proposta.status)}`}>
          {getStatusText(proposta.status)}
        </span>
      </div>

      <div className="mb-4 rounded-lg bg-gray-50 p-3 sm:p-4">
        <h4 className="mb-3 text-sm font-medium text-gray-900">Compartilhar proposta</h4>
        <PropostaActions
          proposta={proposta}
          onViewProposta={() => {}}
          onPropostaUpdated={onPropostaUpdated}
          showLabels={true}
          hideView={true}
          className="flex-wrap"
        />
      </div>

      <div className="mb-4 rounded-lg border border-[#DCE7EC] bg-[#F8FBFC] p-3 sm:p-4">
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
            <div className="rounded-md border border-[#E2ECF0] bg-white p-3">
              <p className="text-xs text-[#607B89]">Criada em</p>
              <p className="mt-1 text-sm font-medium text-[#19384C]">
                {formatDateTime(proposta.criadaEm)}
              </p>
            </div>
            <div className="rounded-md border border-[#E2ECF0] bg-white p-3">
              <p className="text-xs text-[#607B89]">Total visualizacoes</p>
              <p className="mt-1 text-sm font-medium text-[#19384C]">
                {Number(estatisticas?.totalVisualizacoes || 0)}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={() => void carregarDadosCiclo()}
                className="inline-flex h-8 items-center justify-center rounded-md border border-[#C8DAE2] bg-white px-3 text-xs font-medium text-[#244455] transition hover:bg-[#F1F7FA]"
              >
                Atualizar
              </button>
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

            {showFollowupForm && (
              <div className="mt-3 rounded-md border border-[#E2ECF0] bg-white p-3">
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
              <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-md border border-[#E2ECF0] bg-white p-3">
                  <p className="text-xs text-[#607B89]">Criada em</p>
                  <p className="mt-1 text-sm font-medium text-[#19384C]">
                    {formatDateTime(historico?.criacaoEm || proposta.criadaEm)}
                  </p>
                </div>
                <div className="rounded-md border border-[#E2ECF0] bg-white p-3">
                  <p className="text-xs text-[#607B89]">Primeiro envio</p>
                  <p className="mt-1 text-sm font-medium text-[#19384C]">{formatDateTime(historico?.envioEm)}</p>
                </div>
                <div className="rounded-md border border-[#E2ECF0] bg-white p-3">
                  <p className="text-xs text-[#607B89]">Primeira visualizacao</p>
                  <p className="mt-1 text-sm font-medium text-[#19384C]">
                    {formatDateTime(historico?.primeiraVisualizacaoEm)}
                  </p>
                </div>
                <div className="rounded-md border border-[#E2ECF0] bg-white p-3">
                  <p className="text-xs text-[#607B89]">Total visualizacoes</p>
                  <p className="mt-1 text-sm font-medium text-[#19384C]">
                    {Number(estatisticas?.totalVisualizacoes || 0)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-md border border-[#E2ECF0] bg-white p-3">
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

                <div className="rounded-md border border-[#E2ECF0] bg-white p-3">
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
                <div className="rounded-md border border-[#E2ECF0] bg-white p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <History className="h-4 w-4 text-[#2B4C5F]" />
                    <p className="text-sm font-semibold text-[#19384C]">Versionamento</p>
                  </div>
                  {versoesOrdenadas.length === 0 ? (
                    <p className="text-xs text-[#607B89]">Nenhuma versao registrada.</p>
                  ) : (
                    <div className="max-h-36 space-y-2 overflow-y-auto pr-1">
                      {versoesOrdenadas.map((versao) => (
                        <div key={versao.versao} className="rounded-md border border-[#EDF3F6] p-2">
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
                    <div className="mt-3 rounded-md border border-[#DCE7EC] bg-[#FAFCFD] p-2">
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
                        <div className="mt-2 space-y-1 rounded-md border border-[#E7EFF3] bg-white p-2 text-xs text-[#546E7A]">
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
                            <div className="mt-2 rounded-md border border-[#E2ECF0] bg-[#F8FBFC] p-2">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#244455]">
                                Detalhe por item ({comparacaoVersoes.totalItensAlterados})
                              </p>
                              <div className="mt-2 max-h-40 space-y-1 overflow-y-auto pr-1">
                                {comparacaoVersoes.itensAlterados.map((item) => (
                                  <div key={item.nome} className="rounded-md border border-[#EDF3F6] bg-white p-2">
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

                <div className="rounded-md border border-[#E2ECF0] bg-white p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#2B4C5F]" />
                    <p className="text-sm font-semibold text-[#19384C]">Historico recente</p>
                  </div>
                  {ultimosEventos.length === 0 ? (
                    <p className="text-xs text-[#607B89]">Sem eventos registrados.</p>
                  ) : (
                    <div className="max-h-36 space-y-2 overflow-y-auto pr-1">
                      {ultimosEventos.map((evento, index) => (
                        <div key={`${evento.data}-${evento.evento}-${index}`} className="rounded-md border border-[#EDF3F6] p-2">
                          <p className="text-xs font-medium text-[#19384C]">{formatDateTime(evento.data)}</p>
                          <p className="text-xs text-[#546E7A]">{evento.evento}</p>
                          {evento.detalhes ? <p className="text-xs text-[#607B89]">{evento.detalhes}</p> : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              </>
            )}
          </>
        )}
      </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <h4 className="border-b pb-2 text-lg font-semibold text-gray-900">Informacoes do cliente</h4>

            <div className="space-y-3">
              <div className="flex items-center">
                <User className="mr-3 h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{proposta.cliente?.nome || 'Nome nao informado'}</p>
                  <p className="text-xs text-gray-600">
                    {proposta.cliente?.tipoPessoa === 'juridica' ? 'Pessoa Juridica' : 'Pessoa Fisica'}
                  </p>
                </div>
              </div>

              {proposta.cliente?.email && (
                <div className="flex items-center">
                  <Mail className="mr-3 h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{proposta.cliente.email}</span>
                </div>
              )}

              {proposta.cliente?.telefone && (
                <div className="flex items-center">
                  <Phone className="mr-3 h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{proposta.cliente.telefone}</span>
                </div>
              )}

              {proposta.cliente?.endereco && (
                <div className="flex items-center">
                  <MapPin className="mr-3 h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-700">
                    {proposta.cliente.endereco}
                    {proposta.cliente.cidade && `, ${proposta.cliente.cidade}`}
                    {proposta.cliente.estado && ` - ${proposta.cliente.estado}`}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="border-b pb-2 text-lg font-semibold text-gray-900">Detalhes da proposta</h4>

            <div className="space-y-3">
              <div className="rounded-md border border-gray-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                  O que esta sendo negociado
                </p>
                {itensNegociados.length > 0 ? (
                  <>
                    <ul className="mt-2 space-y-1">
                      {itensNegociados.slice(0, 3).map((item, index) => {
                        const nomeResolvido =
                          item.nome.startsWith('Item ') &&
                          item.produtoId &&
                          nomesProdutosPorId[item.produtoId]
                            ? nomesProdutosPorId[item.produtoId]
                            : item.nome;

                        return (
                          <li
                            key={`${item.produtoId || item.nome}-${item.quantidade}-${index}`}
                            className="flex items-start justify-between gap-3 text-sm"
                          >
                            <span className="text-gray-900">{nomeResolvido}</span>
                          <span className="text-gray-500">x{Math.max(1, item.quantidade || 1)}</span>
                          </li>
                        );
                      })}
                    </ul>
                    {itensNegociados.length > 3 && (
                      <p className="mt-2 text-xs text-gray-500">
                        + {itensNegociados.length - 3} item(ns)
                      </p>
                    )}
                  </>
                ) : loadingCiclo ? (
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando itens...
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-gray-700">{proposta.titulo || 'Proposta comercial'}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Subtotal:</span>
                <span className="text-sm font-medium">{formatCurrency(proposta.subtotal)}</span>
              </div>

              <div className="flex items-center justify-between border-t pt-2">
                <span className="text-base font-semibold text-gray-900">Total:</span>
                <span className="text-lg font-bold text-[#159A9C]">{formatCurrency(proposta.total)}</span>
              </div>

              <div className="flex items-center">
                <Calendar className="mr-3 h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Valida ate: {formatDate(proposta.dataValidade)}</p>
                  <p className="text-xs text-gray-600">Criada em: {proposta.criadaEm ? formatDate(proposta.criadaEm) : 'N/A'}</p>
                </div>
              </div>

              {typeof proposta.vendedor === 'object' && (
                <div className="flex items-center">
                  <Building className="mr-3 h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{proposta.vendedor.nome}</p>
                    <p className="text-xs text-gray-600">Vendedor responsavel</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="mb-3 border-b pb-2 text-lg font-semibold text-gray-900">Produtos / Servicos</h4>

          {itensNegociados.length === 0 ? (
            loadingCiclo ? (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando itens negociados...
              </div>
            ) : (
            <p className="text-sm text-gray-600">Nenhum item informado nesta proposta.</p>
            )
          ) : (
            <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Produto</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Qtd</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Preco Unit.</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Desconto</th>
                    <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {itensNegociados.map((item, index) => {
                    const nomeProdutoRaw = item?.nome || 'Produto/Servico';
                    const nomeProduto =
                      nomeProdutoRaw.startsWith('Item ') &&
                      item.produtoId &&
                      nomesProdutosPorId[item.produtoId]
                        ? nomesProdutosPorId[item.produtoId]
                        : nomeProdutoRaw;
                    const descricaoProduto = item?.descricao || '';
                    const precoUnit = Number(item?.precoUnitario || 0);
                    const quantidade = Number(item?.quantidade || 0);
                    const desconto = Number(item?.desconto || 0);
                    const subtotal = Number(item?.subtotal || 0);

                    return (
                      <tr key={`${item.produtoId || nomeProduto}-${index}`}>
                        <td className="px-4 py-2 align-top">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{nomeProduto}</div>
                            {descricaoProduto ? (
                              <div className="text-xs text-gray-500">{descricaoProduto}</div>
                            ) : null}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-900">{quantidade}</td>
                        <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-900">
                          {formatCurrency(precoUnit)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-900">{desconto}%</td>
                        <td className="whitespace-nowrap px-4 py-2 text-right text-sm text-gray-900">
                          {formatCurrency(subtotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {proposta.observacoes && (
          <div className="mt-6">
            <h4 className="mb-4 border-b pb-2 text-lg font-semibold text-gray-900">Observacoes</h4>
            <p className="whitespace-pre-wrap text-sm text-gray-700">{proposta.observacoes}</p>
          </div>
        )}

    </BaseModal>
  );
};

export default ModalVisualizarProposta;
