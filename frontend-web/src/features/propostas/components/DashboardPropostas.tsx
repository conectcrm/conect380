import React, { useEffect, useMemo, useState } from 'react';
import { propostasService } from '../services/propostasService';
import { SectionCard, shellTokens } from '../../../components/layout-v2';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Users,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  FileText,
  Eye,
  FileSignature,
  CreditCard,
  Clock,
} from 'lucide-react';

interface MetricasPropostas {
  totalPropostas: number;
  valorTotalPipeline: number;
  taxaConversao: number;
  propostasAprovadas: number;
  estatisticasPorStatus: Record<string, number>;
  estatisticasPorVendedor: Record<string, number>;
  motivosPerdaTop?: Array<{ motivo: string; quantidade: number }>;
  conversaoPorVendedor?: Array<{
    vendedor: string;
    total: number;
    ganhas: number;
    perdidas: number;
    taxaConversao: number;
  }>;
  conversaoPorProduto?: Array<{
    produto: string;
    total: number;
    ganhas: number;
    perdidas: number;
    taxaConversao: number;
  }>;
  aprovacoesPendentes?: number;
  followupsPendentes?: number;
  propostasComVersao?: number;
  mediaVersoesPorProposta?: number;
  revisoesUltimos7Dias?: number;
}

interface DashboardPropostasProps {
  onRefresh?: () => void;
}

type StatusConfig = {
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  bgClass: string;
  label: string;
};

const getStatusConfig = (status: string): StatusConfig => {
  switch (String(status || '').toLowerCase()) {
    case 'aprovada':
      return { icon: CheckCircle, colorClass: 'text-[#16A34A]', bgClass: 'bg-[#16A34A]/10', label: 'Aprovadas' };
    case 'rejeitada':
      return { icon: XCircle, colorClass: 'text-[#DC2626]', bgClass: 'bg-[#DC2626]/10', label: 'Rejeitadas' };
    case 'enviada':
      return { icon: Send, colorClass: 'text-[#0369A1]', bgClass: 'bg-[#38BDF8]/10', label: 'Enviadas' };
    case 'visualizada':
      return { icon: Eye, colorClass: 'text-[#0F7B7D]', bgClass: 'bg-[#159A9C]/10', label: 'Visualizadas' };
    case 'negociacao':
      return { icon: AlertCircle, colorClass: 'text-[#92400E]', bgClass: 'bg-[#FBBF24]/20', label: 'Em negociacao' };
    case 'contrato_gerado':
      return { icon: FileSignature, colorClass: 'text-[#3730A3]', bgClass: 'bg-[#818CF8]/15', label: 'Contrato gerado' };
    case 'contrato_assinado':
      return { icon: CheckCircle, colorClass: 'text-[#166534]', bgClass: 'bg-[#16A34A]/10', label: 'Contrato assinado' };
    case 'fatura_criada':
      return { icon: CreditCard, colorClass: 'text-[#BE123C]', bgClass: 'bg-[#FB7185]/15', label: 'Fatura criada' };
    case 'aguardando_pagamento':
      return { icon: Clock, colorClass: 'text-[#C2410C]', bgClass: 'bg-[#FED7AA]', label: 'Aguardando pagamento' };
    case 'pago':
      return { icon: DollarSign, colorClass: 'text-[#166534]', bgClass: 'bg-[#16A34A]/10', label: 'Pago' };
    case 'expirada':
      return { icon: AlertCircle, colorClass: 'text-[#9A3412]', bgClass: 'bg-[#F97316]/15', label: 'Expiradas' };
    default:
      return { icon: FileText, colorClass: 'text-[#607B89]', bgClass: 'bg-[#E7EDF0]', label: 'Rascunhos' };
  }
};

const formatarMoeda = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor || 0);
};

export const DashboardPropostas: React.FC<DashboardPropostasProps> = ({ onRefresh }) => {
  const [metricas, setMetricas] = useState<MetricasPropostas | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarMetricas = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const dados = await propostasService.obterEstatisticas();
      setMetricas(dados);
    } catch (err) {
      console.error('Erro ao carregar metricas:', err);
      setError('Erro ao carregar metricas do dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void carregarMetricas();
  }, []);

  const valorMedio = useMemo(() => {
    if (!metricas || metricas.totalPropostas <= 0) {
      return 0;
    }
    return metricas.valorTotalPipeline / metricas.totalPropostas;
  }, [metricas]);

  const statusOrdenados = useMemo(() => {
    if (!metricas) {
      return [] as Array<[string, number]>;
    }
    return Object.entries(metricas.estatisticasPorStatus || {}).sort((a, b) => b[1] - a[1]);
  }, [metricas]);

  const vendedoresOrdenados = useMemo(() => {
    if (!metricas) {
      return [] as Array<[string, number]>;
    }
    return Object.entries(metricas.estatisticasPorVendedor || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [metricas]);

  const motivosPerdaTop = useMemo(() => {
    if (!metricas || !Array.isArray(metricas.motivosPerdaTop)) {
      return [] as Array<{ motivo: string; quantidade: number }>;
    }
    return metricas.motivosPerdaTop.slice(0, 5);
  }, [metricas]);

  const conversaoPorProduto = useMemo(() => {
    if (!metricas || !Array.isArray(metricas.conversaoPorProduto)) {
      return [] as Array<{
        produto: string;
        total: number;
        ganhas: number;
        perdidas: number;
        taxaConversao: number;
      }>;
    }
    return metricas.conversaoPorProduto.slice(0, 5);
  }, [metricas]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <SectionCard key={index} className="animate-pulse p-4 sm:p-5">
            <div className="h-4 w-2/3 rounded bg-[#E1EAEE]" />
            <div className="mt-3 h-7 w-1/2 rounded bg-[#E1EAEE]" />
          </SectionCard>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <SectionCard className="p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <XCircle className="h-5 w-5 text-[#DC2626]" />
          <p className="text-sm text-[#7A2F2F]">{error}</p>
          <button
            type="button"
            onClick={() => void carregarMetricas()}
            className="ml-auto inline-flex h-9 items-center rounded-lg bg-[#159A9C] px-3 text-sm font-medium text-white transition hover:bg-[#0F7B7D]"
          >
            Tentar novamente
          </button>
        </div>
      </SectionCard>
    );
  }

  if (!metricas) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SectionCard className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#607B89]">Total de propostas</p>
              <p className="mt-2 text-2xl font-semibold text-[#19384C]">{metricas.totalPropostas}</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#159A9C]/10">
              <FileText className="h-5 w-5 text-[#0F7B7D]" />
            </span>
          </div>
        </SectionCard>

        <SectionCard className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#607B89]">Pipeline total</p>
              <p className="mt-2 text-2xl font-semibold text-[#19384C]">{formatarMoeda(metricas.valorTotalPipeline)}</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#16A34A]/10">
              <DollarSign className="h-5 w-5 text-[#166534]" />
            </span>
          </div>
        </SectionCard>

        <SectionCard className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#607B89]">Valor medio</p>
              <p className="mt-2 text-2xl font-semibold text-[#19384C]">{formatarMoeda(valorMedio)}</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#818CF8]/15">
              <BarChart3 className="h-5 w-5 text-[#3730A3]" />
            </span>
          </div>
        </SectionCard>

        <SectionCard className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#607B89]">Taxa de conversao</p>
              <p className="mt-2 text-2xl font-semibold text-[#19384C]">{metricas.taxaConversao.toFixed(1)}%</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FBBF24]/20">
              {metricas.taxaConversao >= 50 ? (
                <TrendingUp className="h-5 w-5 text-[#92400E]" />
              ) : (
                <TrendingDown className="h-5 w-5 text-[#92400E]" />
              )}
            </span>
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionCard className="p-4 sm:p-5">
          <h3 className="text-base font-semibold text-[#19384C]">Propostas por status</h3>
          <div className="mt-4 space-y-3">
            {statusOrdenados.length === 0 ? (
              <p className="text-sm text-[#607B89]">Sem dados de status no periodo.</p>
            ) : (
              statusOrdenados.map(([status, quantidade]) => {
                const config = getStatusConfig(status);
                const Icone = config.icon;
                const valorEstimado =
                  metricas.totalPropostas > 0
                    ? quantidade * (metricas.valorTotalPipeline / metricas.totalPropostas)
                    : 0;

                return (
                  <div key={status} className={`${shellTokens.card} flex items-center justify-between gap-3 p-3`}>
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${config.bgClass}`}>
                        <Icone className={`h-4 w-4 ${config.colorClass}`} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#244455]">{config.label}</p>
                        <p className="text-xs text-[#607B89]">{quantidade} proposta(s)</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[#19384C]">{formatarMoeda(valorEstimado)}</p>
                      <p className="text-xs text-[#607B89]">
                        {metricas.totalPropostas > 0
                          ? ((quantidade / metricas.totalPropostas) * 100).toFixed(1)
                          : '0.0'}
                        %
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </SectionCard>

        <SectionCard className="p-4 sm:p-5">
          <h3 className="text-base font-semibold text-[#19384C]">Performance por vendedor</h3>
          <div className="mt-4 space-y-3">
            {vendedoresOrdenados.length === 0 ? (
              <p className="text-sm text-[#607B89]">Sem dados de vendedores no periodo.</p>
            ) : (
              vendedoresOrdenados.map(([vendedorNome, quantidade]) => {
                const valorEstimado =
                  metricas.totalPropostas > 0
                    ? quantidade * (metricas.valorTotalPipeline / metricas.totalPropostas)
                    : 0;
                return (
                  <div key={vendedorNome} className={`${shellTokens.card} flex items-center justify-between gap-3 p-3`}>
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#159A9C]/10">
                        <Users className="h-4 w-4 text-[#0F7B7D]" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#244455]" title={vendedorNome}>
                          {vendedorNome}
                        </p>
                        <p className="text-xs text-[#607B89]">{quantidade} proposta(s)</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[#19384C]">{formatarMoeda(valorEstimado)}</p>
                      <p className="text-xs text-[#607B89]">
                        {formatarMoeda(quantidade > 0 ? valorEstimado / quantidade : 0)} medio
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionCard className="p-4 sm:p-5">
          <h3 className="text-base font-semibold text-[#19384C]">Motivos de perda</h3>
          <div className="mt-4 space-y-3">
            {motivosPerdaTop.length === 0 ? (
              <p className="text-sm text-[#607B89]">Sem perdas registradas no periodo.</p>
            ) : (
              motivosPerdaTop.map((item) => (
                <div
                  key={item.motivo}
                  className={`${shellTokens.card} flex items-center justify-between gap-3 p-3`}
                >
                  <p className="truncate text-sm font-medium text-[#244455]" title={item.motivo}>
                    {item.motivo}
                  </p>
                  <span className="text-sm font-semibold text-[#7F1D1D]">{item.quantidade}</span>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard className="p-4 sm:p-5">
          <h3 className="text-base font-semibold text-[#19384C]">Conversao por produto</h3>
          <div className="mt-4 space-y-3">
            {conversaoPorProduto.length === 0 ? (
              <p className="text-sm text-[#607B89]">Sem dados de produtos no periodo.</p>
            ) : (
              conversaoPorProduto.map((item) => (
                <div
                  key={item.produto}
                  className={`${shellTokens.card} flex items-center justify-between gap-3 p-3`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#244455]" title={item.produto}>
                      {item.produto}
                    </p>
                    <p className="text-xs text-[#607B89]">
                      {item.ganhas} ganha(s) / {item.perdidas} perda(s)
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-[#19384C]">
                    {Number(item.taxaConversao || 0).toFixed(1)}%
                  </p>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#16A34A]/10">
              <Target className="h-5 w-5 text-[#166534]" />
            </span>
            <div>
              <p className="text-sm font-medium text-[#244455]">Propostas aprovadas</p>
              <p className="text-xs text-[#607B89]">{metricas.propostasAprovadas} de {metricas.totalPropostas} no periodo</p>
              <p className="mt-1 text-xs text-[#607B89]">
                {metricas.aprovacoesPendentes || 0} aprovacao(oes) pendente(s) e{' '}
                {metricas.followupsPendentes || 0} follow-up(s) pendente(s)
              </p>
              <p className="mt-1 text-xs text-[#607B89]">
                {metricas.propostasComVersao || 0} proposta(s) com revisao, media de{' '}
                {Number(metricas.mediaVersoesPorProposta || 0).toFixed(1)} versao(oes) por proposta
                e {metricas.revisoesUltimos7Dias || 0} revisao(oes) nos ultimos 7 dias
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              void carregarMetricas();
              onRefresh?.();
            }}
            className="inline-flex h-9 items-center rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm font-medium text-[#244455] transition hover:bg-[#F6FAFB]"
          >
            Atualizar metricas
          </button>
        </div>
      </SectionCard>
    </div>
  );
};

export default DashboardPropostas;
