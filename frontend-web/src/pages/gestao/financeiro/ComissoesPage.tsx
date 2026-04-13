import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2, RefreshCw } from 'lucide-react';
import { PageHeader, SectionCard, EmptyState, LoadingSkeleton } from '../../../components/layout-v2';
import comissoesService, { ComissaoLancamento, StatusComissaoLancamento } from '../../../services/comissoesService';

const moneyFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const statusLabel: Record<StatusComissaoLancamento | 'todos', string> = {
  todos: 'Todos',
  pendente: 'Pendente',
  aprovada: 'Aprovada',
  paga: 'Paga',
  cancelada: 'Cancelada',
};

const now = new Date();
const defaultAno = now.getFullYear();
const defaultMes = now.getMonth() + 1;

function formatCompetencia(ano: number, mes: number): string {
  return `${ano}-${String(mes).padStart(2, '0')}`;
}

export default function ComissoesPage(): React.JSX.Element {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [ano, setAno] = useState(defaultAno);
  const [mes, setMes] = useState(defaultMes);
  const [status, setStatus] = useState<StatusComissaoLancamento | 'todos'>('todos');
  const [lancamentos, setLancamentos] = useState<ComissaoLancamento[]>([]);

  const competenciaLabel = useMemo(() => formatCompetencia(ano, mes), [ano, mes]);

  const carregar = useCallback(
    async (silent = false): Promise<void> => {
      try {
        if (!silent) setLoading(true);
        const res = await comissoesService.listarMinhas({
          competenciaAno: ano,
          competenciaMes: mes,
          status: status === 'todos' ? undefined : status,
          limit: 200,
        });
        setLancamentos(Array.isArray(res?.data) ? res.data : []);
      } catch (error) {
        console.error('Erro ao carregar comissoes:', error);
        toast.error('Nao foi possivel carregar suas comissoes.');
        setLancamentos([]);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [ano, mes, status],
  );

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const resumo = useMemo(() => {
    const totalBase = lancamentos.reduce((acc, item) => acc + Number(item.valorBaseLiquido || 0), 0);
    const totalComissao = lancamentos.reduce(
      (acc, item) => acc + Number(item.valorComissaoTotal || 0),
      0,
    );
    return { totalBase, totalComissao, quantidade: lancamentos.length };
  }, [lancamentos]);

  const handleRefresh = async (): Promise<void> => {
    try {
      setActionLoading(true);
      await carregar(true);
      toast.success('Comissoes atualizadas.');
    } catch {
      // handled in carregar
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4 pt-1 sm:pt-2">
      <SectionCard className="space-y-4 p-4 sm:p-5">
        <PageHeader
          title="Minhas Comissoes"
          description="Apuracao por baixa confirmada, calculada sobre o valor liquido."
          actions={
            <button
              type="button"
              onClick={() => void handleRefresh()}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#D4E2E7] bg-white px-4 text-sm font-medium text-[#355061] transition-colors hover:bg-[#F6FBFC] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Atualizar
            </button>
          }
        />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-[#D4E2E7] bg-white p-4">
            <p className="text-xs font-medium text-[#5F7A8B]">Competencia</p>
            <p className="mt-1 text-lg font-semibold text-[#143D52]">{competenciaLabel}</p>
          </div>
          <div className="rounded-xl border border-[#D4E2E7] bg-white p-4">
            <p className="text-xs font-medium text-[#5F7A8B]">Base liquida</p>
            <p className="mt-1 text-lg font-semibold text-[#143D52]">
              {moneyFmt.format(resumo.totalBase)}
            </p>
          </div>
          <div className="rounded-xl border border-[#D4E2E7] bg-white p-4">
            <p className="text-xs font-medium text-[#5F7A8B]">Comissao</p>
            <p className="mt-1 text-lg font-semibold text-[#143D52]">
              {moneyFmt.format(resumo.totalComissao)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-[#D4E2E7] bg-[#F8FCFD] p-4">
          <div className="min-w-[120px]">
            <label className="block text-xs font-medium text-[#355061]">Ano</label>
            <input
              value={ano}
              onChange={(e) => setAno(Number(e.target.value || defaultAno))}
              type="number"
              className="mt-1 h-10 w-full rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm text-[#143D52]"
              min={2000}
              max={2100}
            />
          </div>
          <div className="min-w-[120px]">
            <label className="block text-xs font-medium text-[#355061]">Mes</label>
            <input
              value={mes}
              onChange={(e) => setMes(Math.min(12, Math.max(1, Number(e.target.value || defaultMes))))}
              type="number"
              className="mt-1 h-10 w-full rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm text-[#143D52]"
              min={1}
              max={12}
            />
          </div>
          <div className="min-w-[220px]">
            <label className="block text-xs font-medium text-[#355061]">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="mt-1 h-10 w-full rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm text-[#143D52]"
            >
              {Object.entries(statusLabel).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="ml-auto">
            <button
              type="button"
              onClick={() => void carregar()}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#159A9C] px-4 text-sm font-medium text-white transition-colors hover:bg-[#0F7B7D]"
            >
              Filtrar
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : lancamentos.length === 0 ? (
          <EmptyState
            title="Sem comissoes nesta competencia"
            description="Se ja houve baixa confirmada, confirme se a proposta possui comissionados configurados."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#D4E2E7] bg-white">
            <div className="grid grid-cols-12 gap-2 border-b border-[#D4E2E7] bg-[#F6FBFC] px-4 py-3 text-xs font-semibold text-[#355061]">
              <div className="col-span-3">Evento</div>
              <div className="col-span-2">Base liquida</div>
              <div className="col-span-2">Comissao</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-3">Participantes</div>
            </div>
            {lancamentos.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-2 px-4 py-3 text-sm text-[#143D52] hover:bg-[#FBFDFE]"
              >
                <div className="col-span-3">
                  <div className="font-medium">{item.origem}</div>
                  <div className="text-xs text-[#5F7A8B]">
                    Fatura #{item.faturaId} | Pgto #{item.pagamentoId}
                  </div>
                </div>
                <div className="col-span-2 font-medium">{moneyFmt.format(Number(item.valorBaseLiquido || 0))}</div>
                <div className="col-span-2 font-medium">
                  {moneyFmt.format(Number(item.valorComissaoTotal || 0))}
                </div>
                <div className="col-span-2">
                  <span className="inline-flex items-center rounded-full border border-[#D4E2E7] bg-[#F8FCFD] px-2 py-1 text-xs font-medium text-[#355061]">
                    {statusLabel[item.status] ?? item.status}
                  </span>
                </div>
                <div className="col-span-3 text-xs text-[#355061]">
                  {Array.isArray(item.participantes) && item.participantes.length > 0 ? (
                    <div className="space-y-1">
                      {item.participantes.slice(0, 4).map((p) => (
                        <div key={p.id} className="flex items-center justify-between gap-2">
                          <span className="truncate">
                            {p.papel ? `${p.papel} ` : ''}{p.usuarioId.slice(0, 8)}
                          </span>
                          <span className="whitespace-nowrap">{moneyFmt.format(Number(p.valorComissao || 0))}</span>
                        </div>
                      ))}
                      {item.participantes.length > 4 ? (
                        <div className="text-[11px] text-[#5F7A8B]">
                          +{item.participantes.length - 4} participante(s)
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <span className="text-[#5F7A8B]">Nao configurado</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

