import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  Mail,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import {
  DataTableCard,
  EmptyState,
  InlineStats,
  LoadingSkeleton,
  PageHeader,
  SectionCard,
} from '../components/layout-v2';
import { propostasService, type Proposta } from '../services/propostasService';
import { portalClienteService } from '../services/portalClienteService';

const STATUS_ENVIADAS = new Set([
  'enviada',
  'visualizada',
  'negociacao',
  'aprovada',
  'contrato_gerado',
  'contrato_assinado',
  'fatura_criada',
  'aguardando_pagamento',
  'pago',
  'rejeitada',
  'expirada',
]);

const STATUS_APROVADAS = new Set([
  'aprovada',
  'contrato_gerado',
  'contrato_assinado',
  'fatura_criada',
  'aguardando_pagamento',
  'pago',
]);

type PortalEvent = {
  propostaId: string;
  propostaNumero: string;
  cliente: string;
  acao: string;
  status: string;
  ip: string;
  timestamp: string;
  tempoVisualizacao?: number;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0));

const formatDateTime = (value?: string) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleString('pt-BR');
};

const formatTempo = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0s';
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const remaining = total % 60;
  if (minutes <= 0) return `${remaining}s`;
  return `${minutes}m ${remaining}s`;
};

const normalizarAcao = (raw: string) => {
  const value = String(raw || '').toLowerCase();
  if (value.includes('visual') || value.includes('view')) return 'Visualizacao';
  if (value.includes('aceite') || value.includes('aprov')) return 'Aceite';
  if (value.includes('rejei')) return 'Rejeicao';
  if (value.includes('download')) return 'Download';
  if (value.includes('contrato')) return 'Solicitacao de contrato';
  if (value.includes('scroll')) return 'Scroll';
  return raw || 'Acesso';
};

const extrairEventosPortal = (proposta: Proposta): PortalEvent[] => {
  const numero = String(proposta.numero || proposta.id || '-');
  const cliente = String(proposta.cliente?.nome || 'Cliente nao informado');
  const propostaId = String(proposta.id || proposta.numero || '');

  const eventosRaw = [
    ...(((proposta as any)?.emailDetails?.portalEventos as any[]) || []),
    ...(((proposta as any)?.historicoEventos as any[]) || []).filter((evento: any) =>
      String(evento?.origem || '').toLowerCase().includes('portal'),
    ),
  ];

  return eventosRaw
    .map((evento: any) => {
      const timestamp =
        evento?.timestamp ||
        evento?.data ||
        evento?.createdAt ||
        evento?.criadoEm ||
        null;

      if (!timestamp) {
        return null;
      }

      return {
        propostaId,
        propostaNumero: numero,
        cliente,
        acao: normalizarAcao(String(evento?.evento || evento?.acao || 'Acesso')),
        status: String(evento?.status || proposta.status || ''),
        ip: String(evento?.ip || evento?.dados?.ip || '-'),
        timestamp: String(timestamp),
        tempoVisualizacao: Number(evento?.dados?.tempoVisualizacao || 0) || undefined,
      } satisfies PortalEvent;
    })
    .filter(Boolean) as PortalEvent[];
};

const PortalClientePage: React.FC = () => {
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [generatingLinkId, setGeneratingLinkId] = useState<string | null>(null);
  const [linksGerados, setLinksGerados] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  const showFeedback = useCallback((type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    window.setTimeout(() => setFeedback(null), 4000);
  }, []);

  const carregarDados = useCallback(async () => {
    setLoading(true);
    setErro(null);

    try {
      const dados = await propostasService.findAll();
      setPropostas(Array.isArray(dados) ? dados : []);
    } catch (error) {
      console.error('Erro ao carregar dados do portal:', error);
      setErro('Nao foi possivel carregar os dados do portal.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void carregarDados();
  }, [carregarDados]);

  const propostasPortal = useMemo(
    () => propostas.filter((proposta) => STATUS_ENVIADAS.has(String(proposta.status || ''))),
    [propostas],
  );

  const eventosPortal = useMemo(
    () =>
      propostasPortal
        .flatMap((proposta) => extrairEventosPortal(proposta))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [propostasPortal],
  );

  const estatisticas = useMemo(() => {
    const enviadas = propostasPortal.length;
    const visualizadas = propostasPortal.filter((proposta) =>
      ['visualizada', 'negociacao', 'aprovada', 'rejeitada'].includes(String(proposta.status || '')),
    ).length;
    const aprovadas = propostasPortal.filter((proposta) =>
      STATUS_APROVADAS.has(String(proposta.status || '')),
    ).length;
    const rejeitadas = propostasPortal.filter(
      (proposta) => String(proposta.status || '') === 'rejeitada',
    ).length;

    const tempos = eventosPortal
      .map((evento) => Number(evento.tempoVisualizacao || 0))
      .filter((value) => value > 0);
    const tempoMedio = tempos.length
      ? formatTempo(tempos.reduce((sum, value) => sum + value, 0) / tempos.length)
      : '0s';

    return {
      enviadas,
      visualizadas,
      aprovadas,
      rejeitadas,
      totalAcessos: eventosPortal.length,
      tempoMedio,
      taxaAceite: enviadas > 0 ? Math.round((aprovadas / enviadas) * 100) : 0,
    };
  }, [eventosPortal, propostasPortal]);

  const acessosPorProposta = useMemo(() => {
    const mapa: Record<string, number> = {};
    eventosPortal.forEach((evento) => {
      mapa[evento.propostaId] = (mapa[evento.propostaId] || 0) + 1;
    });
    return mapa;
  }, [eventosPortal]);

  const ultimoAcessoPorProposta = useMemo(() => {
    const mapa: Record<string, string> = {};
    eventosPortal.forEach((evento) => {
      if (!mapa[evento.propostaId]) {
        mapa[evento.propostaId] = evento.timestamp;
      }
    });
    return mapa;
  }, [eventosPortal]);

  const obterStatusBadge = (status: string) => {
    const normalized = String(status || '').toLowerCase();
    if (['aprovada', 'contrato_gerado', 'contrato_assinado', 'fatura_criada', 'pago'].includes(normalized)) {
      return 'bg-[#DCFCE7] text-[#166534]';
    }
    if (normalized === 'rejeitada') {
      return 'bg-[#FEE2E2] text-[#991B1B]';
    }
    if (normalized === 'visualizada' || normalized === 'negociacao') {
      return 'bg-[#FEF3C7] text-[#92400E]';
    }
    if (normalized === 'expirada') {
      return 'bg-[#E5E7EB] text-[#374151]';
    }
    return 'bg-[#DBEAFE] text-[#1D4ED8]';
  };

  const montarLinkPortal = useCallback(
    async (proposta: Proposta) => {
      const propostaId = String(proposta.id || proposta.numero || '');
      if (!propostaId) {
        throw new Error('Proposta sem identificador para gerar link do portal.');
      }

      const cacheLink = linksGerados[propostaId];
      if (cacheLink) {
        return cacheLink;
      }

      setGeneratingLinkId(propostaId);
      try {
        const token = await portalClienteService.gerarTokenPublico(propostaId);
        const numero = String(proposta.numero || propostaId);
        const link = `${window.location.origin}/portal/${encodeURIComponent(numero)}/${encodeURIComponent(token)}`;

        setLinksGerados((prev) => ({
          ...prev,
          [propostaId]: link,
        }));

        return link;
      } finally {
        setGeneratingLinkId(null);
      }
    },
    [linksGerados],
  );

  const handleAbrirPortal = useCallback(
    async (proposta: Proposta) => {
      try {
        const link = await montarLinkPortal(proposta);
        window.open(link, '_blank', 'noopener,noreferrer');
      } catch (error) {
        console.error('Erro ao abrir portal:', error);
        showFeedback('error', 'Nao foi possivel abrir o link do portal.');
      }
    },
    [montarLinkPortal, showFeedback],
  );

  const handleCopiarLink = useCallback(
    async (proposta: Proposta) => {
      try {
        const link = await montarLinkPortal(proposta);
        await navigator.clipboard.writeText(link);
        showFeedback('success', `Link da proposta ${proposta.numero || proposta.id} copiado.`);
      } catch (error) {
        console.error('Erro ao copiar link:', error);
        showFeedback('error', 'Nao foi possivel copiar o link do portal.');
      }
    },
    [montarLinkPortal, showFeedback],
  );

  const handleEmailCliente = useCallback(
    async (proposta: Proposta) => {
      const email = String(proposta.cliente?.email || '').trim();
      if (!email) {
        showFeedback('error', 'Cliente sem email cadastrado para envio.');
        return;
      }

      try {
        const link = await montarLinkPortal(proposta);
        const assunto = encodeURIComponent(`Proposta ${proposta.numero || proposta.id}`);
        const corpo = encodeURIComponent(
          `Ola ${proposta.cliente?.nome || 'cliente'},\n\nSegue o link da sua proposta:\n${link}\n\nAtenciosamente.`,
        );
        window.location.href = `mailto:${email}?subject=${assunto}&body=${corpo}`;
      } catch (error) {
        console.error('Erro ao preparar email:', error);
        showFeedback('error', 'Nao foi possivel preparar o email com o link da proposta.');
      }
    },
    [montarLinkPortal, showFeedback],
  );

  return (
    <div className="space-y-4">
      <SectionCard className="p-4 sm:p-5">
        <PageHeader
          title="Portal de Propostas"
          description="Acompanhe links enviados, visualizacoes e aceite de propostas no portal do cliente."
          actions={
            <div className="flex items-center gap-2">
              <Link
                to="/nuclei/administracao"
                className="inline-flex h-9 items-center rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm font-medium text-[#244455] transition hover:bg-[#F6FAFB]"
              >
                Voltar ao nucleo
              </Link>
              <button
                type="button"
                onClick={() => void carregarDados()}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#159A9C] px-3 text-sm font-medium text-white transition hover:bg-[#117C7E]"
              >
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </button>
            </div>
          }
        />

        <InlineStats
          className="mt-3"
          stats={[
            { label: 'Propostas no portal', value: String(estatisticas.enviadas), tone: 'neutral' },
            { label: 'Visualizadas', value: String(estatisticas.visualizadas), tone: 'accent' },
            { label: 'Aprovadas', value: String(estatisticas.aprovadas), tone: 'accent' },
            { label: 'Rejeitadas', value: String(estatisticas.rejeitadas), tone: 'warning' },
            { label: 'Total de acessos', value: String(estatisticas.totalAcessos), tone: 'neutral' },
            { label: 'Taxa de aceite', value: `${estatisticas.taxaAceite}%`, tone: 'accent' },
            { label: 'Tempo medio de visualizacao', value: estatisticas.tempoMedio, tone: 'neutral' },
          ]}
        />
      </SectionCard>

      {feedback && (
        <SectionCard
          className={`p-3 text-sm font-medium ${
            feedback.type === 'success'
              ? 'border border-[#A7F3D0] bg-[#ECFDF5] text-[#166534]'
              : 'border border-[#FECACA] bg-[#FEF2F2] text-[#991B1B]'
          }`}
        >
          {feedback.message}
        </SectionCard>
      )}

      {erro && (
        <SectionCard className="border border-[#FECACA] bg-[#FEF2F2] p-3 text-sm font-medium text-[#991B1B]">
          {erro}
        </SectionCard>
      )}

      {loading ? (
        <div className="space-y-4">
          <LoadingSkeleton lines={5} />
          <LoadingSkeleton lines={4} />
        </div>
      ) : (
        <>
          <DataTableCard>
            <div className="border-b border-[#DEE8EC] px-4 py-3">
              <h3 className="text-sm font-semibold text-[#1B3B4E]">Propostas publicadas no portal</h3>
            </div>

            {propostasPortal.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="Nenhuma proposta publicada"
                  description="Envie propostas para clientes para acompanhar acessos no portal."
                  icon={<FileText className="h-5 w-5" />}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-[#F8FBFC]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#607B89]">Proposta</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#607B89]">Cliente</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#607B89]">Valor</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#607B89]">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#607B89]">Acessos</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#607B89]">Ultimo acesso</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#607B89]">Acoes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {propostasPortal.map((proposta) => {
                      const propostaId = String(proposta.id || proposta.numero || '');
                      const acessos = acessosPorProposta[propostaId] || 0;
                      const ultimoAcesso = ultimoAcessoPorProposta[propostaId];

                      return (
                        <tr key={propostaId} className="hover:bg-[#F8FBFC]">
                          <td className="px-4 py-3 text-sm text-[#1B3B4E]">
                            <div className="font-semibold">{proposta.numero || proposta.id}</div>
                            <div className="text-xs text-[#607B89]">{formatDateTime((proposta as any).createdAt)}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-[#244455]">
                            <div className="font-medium">{proposta.cliente?.nome || 'Cliente nao informado'}</div>
                            <div className="text-xs text-[#607B89]">{proposta.cliente?.email || '-'}</div>
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-[#19384C]">{formatCurrency(proposta.total || 0)}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${obterStatusBadge(String(proposta.status || ''))}`}>
                              {String(proposta.status || '-').replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-[#244455]">{acessos}</td>
                          <td className="px-4 py-3 text-sm text-[#244455]">{formatDateTime(ultimoAcesso)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => void handleAbrirPortal(proposta)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#0F7B7D] transition hover:bg-[#E6F4F5]"
                                title="Abrir portal"
                              >
                                {generatingLinkId === propostaId ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <ExternalLink className="h-4 w-4" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleCopiarLink(proposta)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#244455] transition hover:bg-[#F1F5F7]"
                                title="Copiar link"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleEmailCliente(proposta)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#166534] transition hover:bg-[#ECFDF5]"
                                title="Enviar link por email"
                              >
                                <Mail className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </DataTableCard>

          <DataTableCard>
            <div className="border-b border-[#DEE8EC] px-4 py-3">
              <h3 className="text-sm font-semibold text-[#1B3B4E]">Log recente de acessos do portal</h3>
            </div>

            {eventosPortal.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="Sem eventos registrados"
                  description="Os acessos e interacoes do cliente aparecem aqui apos a visualizacao da proposta."
                  icon={<Activity className="h-5 w-5" />}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-[#F8FBFC]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#607B89]">Data</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#607B89]">Proposta</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#607B89]">Cliente</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#607B89]">Acao</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#607B89]">IP</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#607B89]">Tempo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {eventosPortal.slice(0, 30).map((evento, index) => (
                      <tr key={`${evento.propostaId}-${evento.timestamp}-${index}`} className="hover:bg-[#F8FBFC]">
                        <td className="px-4 py-3 text-sm text-[#244455]">{formatDateTime(evento.timestamp)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-[#1B3B4E]">{evento.propostaNumero}</td>
                        <td className="px-4 py-3 text-sm text-[#244455]">{evento.cliente}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#EEF7F8] px-2 py-1 text-xs font-semibold text-[#0F7B7D]">
                            {evento.acao === 'Aceite' ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                            {evento.acao === 'Rejeicao' ? <XCircle className="h-3.5 w-3.5" /> : null}
                            {evento.acao === 'Visualizacao' ? <Eye className="h-3.5 w-3.5" /> : null}
                            {evento.acao}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#607B89]">{evento.ip || '-'}</td>
                        <td className="px-4 py-3 text-sm text-[#607B89]">{formatTempo(Number(evento.tempoVisualizacao || 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DataTableCard>
        </>
      )}
    </div>
  );
};

export default PortalClientePage;
