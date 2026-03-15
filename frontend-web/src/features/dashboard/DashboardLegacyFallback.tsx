import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboard';

type DashboardLegacyFallbackProps = {
  reason?: string | null;
};

const formatCurrency = (value: number): string =>
  value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const formatNumber = (value: number): string =>
  value.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const DashboardLegacyFallback: React.FC<DashboardLegacyFallbackProps> = ({ reason }) => {
  const { data, loading, error, refresh } = useDashboard({
    periodo: 'mensal',
    autoRefresh: true,
  });

  if (loading) {
    return (
      <section className="space-y-3">
        <div className="h-9 w-64 animate-pulse rounded-xl bg-[#E6EFF0]" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-[14px] bg-[#E6EFF0]" />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-[20px] border border-[#F1D3D8] bg-[#FFF5F7] p-5">
        <h2 className="text-xl font-semibold text-[#8A2335]">Falha ao carregar dashboard</h2>
        <p className="mt-2 text-sm text-[#8A2335]">{error}</p>
        <button
          type="button"
          onClick={() => {
            void refresh();
          }}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#C53A53] px-4 py-2 text-sm font-semibold text-white hover:bg-[#A93247]"
        >
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </button>
      </section>
    );
  }

  const kpis = data.kpis;

  return (
    <section className="space-y-3.5">
      <div className="rounded-[18px] border border-[#DCE7EB] bg-[linear-gradient(135deg,#F9FDFD_0%,#F0F8F8_55%,#F8FCFC_100%)] p-4">
        <h1 className="text-[22px] font-semibold text-[#173A4E]">Dashboard comercial</h1>
        <p className="mt-1 text-sm text-[#4D6D7B]">
          Modo de compatibilidade ativo. Exibindo indicadores legados.
        </p>
        {reason ? (
          <p className="mt-2 text-xs font-medium text-[#A06213]">
            Motivo: {reason}
          </p>
        ) : null}
      </div>

      {kpis ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[14px] border border-[#DCE7EB] bg-white p-4">
            <p className="text-[12px] uppercase tracking-wide text-[#7A929E]">Faturamento</p>
            <p className="mt-1 text-[24px] font-semibold text-[#18374B]">
              {formatCurrency(Number(kpis.faturamentoTotal?.valor || 0))}
            </p>
            <p className="mt-1 text-xs text-[#5E7A88]">
              Meta: {formatCurrency(Number(kpis.faturamentoTotal?.meta || 0))}
            </p>
          </article>

          <article className="rounded-[14px] border border-[#DCE7EB] bg-white p-4">
            <p className="text-[12px] uppercase tracking-wide text-[#7A929E]">Ticket medio</p>
            <p className="mt-1 text-[24px] font-semibold text-[#18374B]">
              {formatCurrency(Number(kpis.ticketMedio?.valor || 0))}
            </p>
            <p className="mt-1 text-xs text-[#5E7A88]">Base do periodo selecionado</p>
          </article>

          <article className="rounded-[14px] border border-[#DCE7EB] bg-white p-4">
            <p className="text-[12px] uppercase tracking-wide text-[#7A929E]">Vendas fechadas</p>
            <p className="mt-1 text-[24px] font-semibold text-[#18374B]">
              {formatNumber(Number(kpis.vendasFechadas?.quantidade || 0))}
            </p>
            <p className="mt-1 text-xs text-[#5E7A88]">No periodo selecionado</p>
          </article>

          <article className="rounded-[14px] border border-[#DCE7EB] bg-white p-4">
            <p className="text-[12px] uppercase tracking-wide text-[#7A929E]">
              Em negociacao
            </p>
            <p className="mt-1 text-[24px] font-semibold text-[#18374B]">
              {formatCurrency(Number(kpis.emNegociacao?.valor || 0))}
            </p>
            <p className="mt-1 text-xs text-[#5E7A88]">
              {formatNumber(Number(kpis.emNegociacao?.quantidade || 0))} oportunidades
            </p>
          </article>
        </div>
      ) : (
        <section className="rounded-[14px] border border-[#DCE7EB] bg-white p-5">
          <p className="text-sm text-[#4D6D7B]">Sem dados disponiveis no dashboard legado.</p>
        </section>
      )}
    </section>
  );
};

export default DashboardLegacyFallback;
