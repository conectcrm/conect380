import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BarChart3, FileCheck2, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  propostasService,
  type Proposta,
  type PropostaEstatisticas,
} from '../../services/propostasService';
import { contratoService, type Contrato } from '../../services/contratoService';

type PropostaStatusFilter = 'all' | Proposta['status'];
type ContratoStatusFilter = 'all' | Contrato['status'];

const formatCurrency = (value: number): string =>
  Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const formatNumber = (value: number): string =>
  Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const toDateInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateSafe = (value: unknown): Date | null => {
  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isFinite(time) ? value : null;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isFinite(parsed.getTime()) ? parsed : null;
  }
  return null;
};

const toRangeDate = (value: string, endOfDay = false): Date => {
  const [year, month, day] = value.split('-').map((chunk) => Number(chunk));
  if (!year || !month || !day) return new Date();
  if (endOfDay) return new Date(year, month - 1, day, 23, 59, 59, 999);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

const dateLabel = (value: unknown): string => {
  const parsed = parseDateSafe(value);
  return parsed ? parsed.toLocaleDateString('pt-BR') : '-';
};

const propostaStatusLabel: Record<Proposta['status'], string> = {
  rascunho: 'Rascunho',
  enviada: 'Enviada',
  visualizada: 'Visualizada',
  negociacao: 'Negociacao',
  aprovada: 'Aprovada',
  contrato_gerado: 'Contrato gerado',
  contrato_assinado: 'Contrato assinado',
  dispensa_contrato_solicitada: 'Dispensa de contrato solicitada',
  dispensa_contrato_aprovada: 'Dispensa de contrato aprovada',
  faturamento_liberado: 'Faturamento liberado',
  fatura_criada: 'Fatura criada',
  aguardando_pagamento: 'Aguardando pagamento',
  pago: 'Pago',
  rejeitada: 'Rejeitada',
  expirada: 'Expirada',
};

const contratoStatusLabel: Record<Contrato['status'], string> = {
  rascunho: 'Rascunho',
  aguardando_assinatura: 'Aguardando assinatura',
  assinado: 'Assinado',
  cancelado: 'Cancelado',
  expirado: 'Expirado',
};

const isPropostaConverted = (status: Proposta['status']): boolean =>
  [
    'contrato_gerado',
    'contrato_assinado',
    'dispensa_contrato_solicitada',
    'dispensa_contrato_aprovada',
    'faturamento_liberado',
    'fatura_criada',
    'aguardando_pagamento',
    'pago',
  ].includes(status);

const ComercialPropostasContratosReportPage: React.FC = () => {
  const navigate = useNavigate();
  const now = useMemo(() => new Date(), []);
  const defaultStart = useMemo(() => {
    const start = new Date(now);
    start.setDate(start.getDate() - 29);
    return toDateInput(start);
  }, [now]);
  const defaultEnd = useMemo(() => toDateInput(now), [now]);

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [propostaStatus, setPropostaStatus] = useState<PropostaStatusFilter>('all');
  const [contratoStatus, setContratoStatus] = useState<ContratoStatusFilter>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [estatisticas, setEstatisticas] = useState<PropostaEstatisticas | null>(null);
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);

  const loadData = useCallback(async () => {
    setWarning(null);

    const [estatisticasResult, propostasResult, contratosResult] = await Promise.allSettled([
      propostasService.getEstatisticas(),
      propostasService.findAll({
        dataInicio: startDate,
        dataFim: endDate,
      }),
      contratoService.listarContratos({
        dataInicio: startDate,
        dataFim: endDate,
      }),
    ]);

    let failCount = 0;

    if (estatisticasResult.status === 'fulfilled') {
      setEstatisticas(estatisticasResult.value);
    } else {
      setEstatisticas(null);
      failCount += 1;
    }

    if (propostasResult.status === 'fulfilled') {
      setPropostas(Array.isArray(propostasResult.value) ? propostasResult.value : []);
    } else {
      setPropostas([]);
      failCount += 1;
    }

    if (contratosResult.status === 'fulfilled') {
      setContratos(Array.isArray(contratosResult.value) ? contratosResult.value : []);
    } else {
      setContratos([]);
      failCount += 1;
    }

    if (failCount > 0) {
      setWarning(
        'Alguns dados nao puderam ser carregados agora. O relatorio continua com as fontes disponiveis.',
      );
    }
  }, [endDate, startDate]);

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      try {
        await loadData();
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, [loadData]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  const rangeStart = useMemo(() => toRangeDate(startDate), [startDate]);
  const rangeEnd = useMemo(() => toRangeDate(endDate, true), [endDate]);

  const filteredPropostas = useMemo(() => {
    const term = search.trim().toLowerCase();
    return propostas
      .filter((proposta) => (propostaStatus === 'all' ? true : proposta.status === propostaStatus))
      .filter((proposta) => {
        const createdAt = parseDateSafe((proposta as any).createdAt);
        if (!createdAt) return true;
        const time = createdAt.getTime();
        return time >= rangeStart.getTime() && time <= rangeEnd.getTime();
      })
      .filter((proposta) => {
        if (!term) return true;
        const source = [
          proposta.numero || '',
          proposta.cliente?.nome || '',
          proposta.vendedor?.nome || '',
          proposta.observacoes || '',
          proposta.status || '',
        ]
          .join(' ')
          .toLowerCase();
        return source.includes(term);
      })
      .sort((a, b) => {
        const aTime = parseDateSafe((a as any).createdAt)?.getTime() || 0;
        const bTime = parseDateSafe((b as any).createdAt)?.getTime() || 0;
        return bTime - aTime;
      });
  }, [propostaStatus, propostas, rangeEnd, rangeStart, search]);

  const filteredContratos = useMemo(() => {
    const term = search.trim().toLowerCase();
    return contratos
      .filter((contrato) => (contratoStatus === 'all' ? true : contrato.status === contratoStatus))
      .filter((contrato) => {
        const createdAt = parseDateSafe((contrato as any).criadoEm || (contrato as any).dataEmissao);
        if (!createdAt) return true;
        const time = createdAt.getTime();
        return time >= rangeStart.getTime() && time <= rangeEnd.getTime();
      })
      .filter((contrato) => {
        if (!term) return true;
        const source = [
          contrato.numero || '',
          contrato.cliente?.nome || '',
          contrato.vendedor?.nome || '',
          contrato.descricao || '',
          contrato.status || '',
        ]
          .join(' ')
          .toLowerCase();
        return source.includes(term);
      })
      .sort((a, b) => {
        const aTime =
          parseDateSafe((a as any).criadoEm || (a as any).dataEmissao)?.getTime() || 0;
        const bTime =
          parseDateSafe((b as any).criadoEm || (b as any).dataEmissao)?.getTime() || 0;
        return bTime - aTime;
      });
  }, [contratoStatus, contratos, rangeEnd, rangeStart, search]);

  const resumo = useMemo(() => {
    const propostasTotal = filteredPropostas.length;
    const propostasValor = filteredPropostas.reduce((acc, proposta) => acc + Number(proposta.total || 0), 0);
    const propostasConvertidas = filteredPropostas.filter((proposta) =>
      isPropostaConverted(proposta.status),
    ).length;
    const propostasAprovadas = filteredPropostas.filter((proposta) => proposta.status === 'aprovada').length;
    const taxaConversaoLocal =
      propostasTotal > 0 ? Number(((propostasConvertidas / propostasTotal) * 100).toFixed(1)) : 0;

    const contratosTotal = filteredContratos.length;
    const contratosAssinados = filteredContratos.filter((contrato) => contrato.status === 'assinado').length;
    const contratosPendentes = filteredContratos.filter(
      (contrato) => contrato.status === 'aguardando_assinatura' || contrato.status === 'rascunho',
    ).length;
    const contratosValor = filteredContratos.reduce((acc, contrato) => acc + Number(contrato.valor || 0), 0);

    return {
      propostasTotal,
      propostasValor,
      propostasConvertidas,
      propostasAprovadas,
      taxaConversaoLocal,
      contratosTotal,
      contratosAssinados,
      contratosPendentes,
      contratosValor,
    };
  }, [filteredContratos, filteredPropostas]);

  const taxaConversaoFinal =
    estatisticas && Number.isFinite(Number(estatisticas.taxaConversao))
      ? Number(estatisticas.taxaConversao)
      : resumo.taxaConversaoLocal;

  if (loading) {
    return <div className="h-64 animate-pulse rounded-[20px] bg-[#E6EFF0]" />;
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[20px] border border-[#DCE7EB] bg-[linear-gradient(135deg,#F9FDFD_0%,#F0F8F8_55%,#F8FCFC_100%)] p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center rounded-full border border-[#CFE6E8] bg-white/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#4C7283]">
              Relatorio comercial
            </span>
            <h1 className="mt-2 text-[27px] font-semibold tracking-[-0.02em] text-[#173A4E]">
              Propostas e contratos
            </h1>
            <p className="mt-1 text-[14px] text-[#4D6D7B]">
              Conversao da proposta ate contrato, status e valores no periodo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/relatorios')}
              className="inline-flex items-center gap-2 rounded-xl border border-[#D4DEE3] bg-white px-4 py-2 text-sm font-semibold text-[#244556] hover:bg-[#F4FAF8]"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para relatorios
            </button>
            <button
              type="button"
              onClick={() => {
                void refresh();
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-[#D4DEE3] bg-white px-4 py-2 text-sm font-semibold text-[#244556] hover:bg-[#F4FAF8]"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-5">
          <label className="text-sm text-[#244556]">
            <span className="mb-1 block text-[12px] text-[#67818D]">Inicio</span>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="w-full rounded-xl border border-[#CFE0E6] bg-white px-3 py-2 text-sm text-[#16394C]"
            />
          </label>
          <label className="text-sm text-[#244556]">
            <span className="mb-1 block text-[12px] text-[#67818D]">Fim</span>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="w-full rounded-xl border border-[#CFE0E6] bg-white px-3 py-2 text-sm text-[#16394C]"
            />
          </label>
          <label className="text-sm text-[#244556]">
            <span className="mb-1 block text-[12px] text-[#67818D]">Status proposta</span>
            <select
              value={propostaStatus}
              onChange={(event) => setPropostaStatus(event.target.value as PropostaStatusFilter)}
              className="w-full rounded-xl border border-[#CFE0E6] bg-white px-3 py-2 text-sm text-[#16394C]"
            >
              <option value="all">Todos</option>
              {Object.keys(propostaStatusLabel).map((status) => (
                <option key={status} value={status}>
                  {propostaStatusLabel[status as Proposta['status']]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-[#244556]">
            <span className="mb-1 block text-[12px] text-[#67818D]">Status contrato</span>
            <select
              value={contratoStatus}
              onChange={(event) => setContratoStatus(event.target.value as ContratoStatusFilter)}
              className="w-full rounded-xl border border-[#CFE0E6] bg-white px-3 py-2 text-sm text-[#16394C]"
            >
              <option value="all">Todos</option>
              {Object.keys(contratoStatusLabel).map((status) => (
                <option key={status} value={status}>
                  {contratoStatusLabel[status as Contrato['status']]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-[#244556]">
            <span className="mb-1 block text-[12px] text-[#67818D]">Busca</span>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Numero, cliente, vendedor"
              className="w-full rounded-xl border border-[#CFE0E6] bg-white px-3 py-2 text-sm text-[#16394C]"
            />
          </label>
        </div>

        {warning ? (
          <div className="mt-3 rounded-xl border border-[#F4D7A5] bg-[#FFF8E8] px-3 py-2 text-sm text-[#8D5A12]">
            {warning}
          </div>
        ) : null}
      </section>

      <section className="grid grid-cols-1 gap-3.5 lg:grid-cols-6">
        <article className="rounded-[16px] border border-[#DCE7EB] bg-white px-4 py-3.5 shadow-[0_10px_24px_-22px_rgba(16,57,74,0.35)] lg:col-span-2">
          <p className="text-[11px] uppercase tracking-wide text-[#758C98]">Propostas no filtro</p>
          <p className="mt-1 text-[22px] font-semibold text-[#173548]">
            {formatNumber(resumo.propostasTotal)}
          </p>
          <p className="mt-1 text-xs text-[#607B88]">Valor: {formatCurrency(resumo.propostasValor)}</p>
        </article>
        <article className="rounded-[16px] border border-[#DCE7EB] bg-white px-4 py-3.5 shadow-[0_10px_24px_-22px_rgba(16,57,74,0.35)] lg:col-span-2">
          <p className="text-[11px] uppercase tracking-wide text-[#758C98]">Taxa de conversao</p>
          <p className="mt-1 text-[22px] font-semibold text-[#173548]">{taxaConversaoFinal.toFixed(1)}%</p>
          <p className="mt-1 text-xs text-[#607B88]">
            Convertidas: {formatNumber(resumo.propostasConvertidas)} | Aprovadas:{' '}
            {formatNumber(resumo.propostasAprovadas)}
          </p>
        </article>
        <article className="rounded-[16px] border border-[#DCE7EB] bg-white px-4 py-3.5 shadow-[0_10px_24px_-22px_rgba(16,57,74,0.35)] lg:col-span-2">
          <p className="text-[11px] uppercase tracking-wide text-[#758C98]">Contratos no filtro</p>
          <p className="mt-1 text-[22px] font-semibold text-[#173548]">
            {formatNumber(resumo.contratosTotal)}
          </p>
          <p className="mt-1 text-xs text-[#607B88]">Valor: {formatCurrency(resumo.contratosValor)}</p>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-3.5 lg:grid-cols-3">
        <article className="rounded-[16px] border border-[#DCE7EB] bg-white px-4 py-3.5 shadow-[0_10px_24px_-22px_rgba(16,57,74,0.35)]">
          <p className="text-[11px] uppercase tracking-wide text-[#758C98]">Contratos assinados</p>
          <p className="mt-1 text-[20px] font-semibold text-[#173548]">
            {formatNumber(resumo.contratosAssinados)}
          </p>
        </article>
        <article className="rounded-[16px] border border-[#DCE7EB] bg-white px-4 py-3.5 shadow-[0_10px_24px_-22px_rgba(16,57,74,0.35)]">
          <p className="text-[11px] uppercase tracking-wide text-[#758C98]">Contratos pendentes</p>
          <p className="mt-1 text-[20px] font-semibold text-[#173548]">
            {formatNumber(resumo.contratosPendentes)}
          </p>
        </article>
        <article className="rounded-[16px] border border-[#DCE7EB] bg-white px-4 py-3.5 shadow-[0_10px_24px_-22px_rgba(16,57,74,0.35)]">
          <p className="text-[11px] uppercase tracking-wide text-[#758C98]">Pipeline global</p>
          <p className="mt-1 text-[20px] font-semibold text-[#173548]">
            {formatCurrency(Number(estatisticas?.valorTotalPipeline || resumo.propostasValor))}
          </p>
        </article>
      </section>

      <section className="rounded-[20px] border border-[#DCE7EB] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#1C8A8D]" />
            <h2 className="text-[20px] font-semibold tracking-[-0.012em] text-[#18374B]">
              Propostas recentes
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('/vendas/propostas')}
            className="rounded-xl border border-[#D6E4E9] bg-white px-3 py-2 text-sm font-medium text-[#214555] hover:bg-[#F4FAF8]"
          >
            Abrir propostas
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-[13px]">
            <thead className="text-[#6B8591]">
              <tr>
                <th className="px-2 py-2 font-semibold">Numero</th>
                <th className="px-2 py-2 font-semibold">Cliente</th>
                <th className="px-2 py-2 font-semibold">Vendedor</th>
                <th className="px-2 py-2 font-semibold">Status</th>
                <th className="px-2 py-2 font-semibold">Criacao</th>
                <th className="px-2 py-2 font-semibold">Valor</th>
              </tr>
            </thead>
            <tbody>
              {filteredPropostas.length ? (
                filteredPropostas.slice(0, 60).map((proposta, index) => (
                  <tr
                    key={String(proposta.id || proposta.numero || `proposta-${index}`)}
                    className="border-t border-[#E7EFF2] text-[#244556]"
                  >
                    <td className="px-2 py-2 font-medium text-[#15384A]">
                      {proposta.numero || String(proposta.id || '-')}
                    </td>
                    <td className="px-2 py-2">{proposta.cliente?.nome || '-'}</td>
                    <td className="px-2 py-2">{proposta.vendedor?.nome || '-'}</td>
                    <td className="px-2 py-2">{propostaStatusLabel[proposta.status] || proposta.status}</td>
                    <td className="px-2 py-2">{dateLabel((proposta as any).createdAt)}</td>
                    <td className="px-2 py-2">{formatCurrency(Number(proposta.total || 0))}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-2 py-5 text-[#6B8591]">
                    Nenhuma proposta encontrada para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-[20px] border border-[#DCE7EB] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-[#1C8A8D]" />
            <h2 className="text-[20px] font-semibold tracking-[-0.012em] text-[#18374B]">
              Contratos recentes
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('/contratos')}
            className="rounded-xl border border-[#D6E4E9] bg-white px-3 py-2 text-sm font-medium text-[#214555] hover:bg-[#F4FAF8]"
          >
            Abrir contratos
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-[13px]">
            <thead className="text-[#6B8591]">
              <tr>
                <th className="px-2 py-2 font-semibold">Numero</th>
                <th className="px-2 py-2 font-semibold">Cliente</th>
                <th className="px-2 py-2 font-semibold">Vendedor</th>
                <th className="px-2 py-2 font-semibold">Status</th>
                <th className="px-2 py-2 font-semibold">Emissao</th>
                <th className="px-2 py-2 font-semibold">Valor</th>
              </tr>
            </thead>
            <tbody>
              {filteredContratos.length ? (
                filteredContratos.slice(0, 60).map((contrato) => (
                  <tr key={contrato.id} className="border-t border-[#E7EFF2] text-[#244556]">
                    <td className="px-2 py-2 font-medium text-[#15384A]">{contrato.numero}</td>
                    <td className="px-2 py-2">{contrato.cliente?.nome || '-'}</td>
                    <td className="px-2 py-2">{contrato.vendedor?.nome || '-'}</td>
                    <td className="px-2 py-2">{contratoStatusLabel[contrato.status]}</td>
                    <td className="px-2 py-2">{dateLabel((contrato as any).dataEmissao)}</td>
                    <td className="px-2 py-2">{formatCurrency(Number(contrato.valor || 0))}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-2 py-5 text-[#6B8591]">
                    Nenhum contrato encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default ComercialPropostasContratosReportPage;
