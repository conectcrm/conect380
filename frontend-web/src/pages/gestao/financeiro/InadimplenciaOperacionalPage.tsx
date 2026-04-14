import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, Loader2, Lock, RefreshCw, Search, Unlock } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Card,
  EmptyState,
  LoadingSkeleton,
  PageHeader,
  SectionCard,
} from '../../../components/layout-v2';
import inadimplenciaOperacionalService, {
  InadimplenciaOperacionalCliente,
  StatusOperacionalCliente,
} from '../../../services/inadimplenciaOperacionalService';

type FiltroStatus = 'todos' | StatusOperacionalCliente;

const statusLabelMap: Record<FiltroStatus | StatusOperacionalCliente, string> = {
  todos: 'Todos',
  ativo: 'Ativo',
  em_risco: 'Em risco',
  bloqueado_automatico: 'Bloqueado automatico',
  bloqueado_manual: 'Bloqueado manual',
};

const statusClassMap: Record<StatusOperacionalCliente, string> = {
  ativo: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  em_risco: 'border-amber-200 bg-amber-50 text-amber-800',
  bloqueado_automatico: 'border-rose-200 bg-rose-50 text-rose-700',
  bloqueado_manual: 'border-red-200 bg-red-50 text-red-700',
};

const moneyFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDateTime = (value?: string | null): string => {
  if (!value) return 'Sem registro';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sem registro';
  return date.toLocaleString('pt-BR');
};

export default function InadimplenciaOperacionalPage(): React.JSX.Element {
  const [clientes, setClientes] = useState<InadimplenciaOperacionalCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<FiltroStatus>('todos');
  const [somenteComSaldoVencido, setSomenteComSaldoVencido] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reprocessandoFila, setReprocessandoFila] = useState(false);

  const carregarDados = useCallback(
    async (silent = false): Promise<void> => {
      try {
        if (!silent) {
          setLoading(true);
        }

        const lista = await inadimplenciaOperacionalService.listarClientes({
          status: statusFiltro === 'todos' ? undefined : statusFiltro,
          busca: buscaAplicada || undefined,
          somenteComSaldoVencido,
          limit: 200,
        });
        setClientes(Array.isArray(lista) ? lista : []);
      } catch (error) {
        console.error('Erro ao carregar fila de inadimplencia operacional:', error);
        if (!silent) {
          toast.error('Nao foi possivel carregar a fila operacional.');
        }
        setClientes([]);
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [buscaAplicada, somenteComSaldoVencido, statusFiltro],
  );

  useEffect(() => {
    void carregarDados();
  }, [carregarDados]);

  const metricas = useMemo(
    () => ({
      total: clientes.length,
      emRisco: clientes.filter((item) => item.statusOperacional === 'em_risco').length,
      bloqueados: clientes.filter(
        (item) =>
          item.statusOperacional === 'bloqueado_automatico' ||
          item.statusOperacional === 'bloqueado_manual',
      ).length,
      saldoVencido: clientes.reduce((acc, item) => acc + Number(item.saldoVencido || 0), 0),
    }),
    [clientes],
  );

  const handleBuscar = (): void => {
    setBuscaAplicada(busca.trim());
  };

  const handleLimpar = (): void => {
    setBusca('');
    setBuscaAplicada('');
    setStatusFiltro('todos');
    setSomenteComSaldoVencido(true);
  };

  const handleReavaliar = async (clienteId: string): Promise<void> => {
    try {
      setActionLoading(`reavaliar:${clienteId}`);
      await inadimplenciaOperacionalService.reavaliarCliente(
        clienteId,
        'Reavaliacao manual pela fila de inadimplencia operacional.',
      );
      await carregarDados(true);
      toast.success('Cliente reavaliado com sucesso.');
    } catch (error) {
      console.error('Erro ao reavaliar cliente:', error);
      toast.error('Nao foi possivel reavaliar o cliente.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBloquear = async (clienteId: string): Promise<void> => {
    try {
      setActionLoading(`bloquear:${clienteId}`);
      await inadimplenciaOperacionalService.bloquearManual(
        clienteId,
        'Bloqueio manual realizado pela fila operacional.',
      );
      await carregarDados(true);
      toast.success('Bloqueio manual aplicado.');
    } catch (error) {
      console.error('Erro ao bloquear cliente:', error);
      toast.error('Nao foi possivel bloquear o cliente.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDesbloquear = async (clienteId: string): Promise<void> => {
    try {
      setActionLoading(`desbloquear:${clienteId}`);
      await inadimplenciaOperacionalService.desbloquearManual(
        clienteId,
        'Desbloqueio manual realizado pela fila operacional.',
      );
      await carregarDados(true);
      toast.success('Cliente liberado manualmente.');
    } catch (error) {
      console.error('Erro ao desbloquear cliente:', error);
      toast.error('Nao foi possivel liberar o cliente.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReprocessarFila = async (): Promise<void> => {
    try {
      setReprocessandoFila(true);
      const resumo = await inadimplenciaOperacionalService.reprocessarEmpresa();
      await carregarDados(true);
      toast.success(
        `Fila reprocessada: ${resumo.clientesAvaliados} cliente(s) avaliados, ${resumo.bloqueados} bloqueado(s), ${resumo.emRisco} em risco.`,
      );
    } catch (error) {
      console.error('Erro ao reprocessar fila operacional:', error);
      toast.error('Nao foi possivel reprocessar a fila agora.');
    } finally {
      setReprocessandoFila(false);
    }
  };

  return (
    <div className="space-y-4 pt-1 sm:pt-2">
      <SectionCard className="space-y-4 p-4 sm:p-5">
        <PageHeader
          title={
            <span className="inline-flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-[#C17A00]" />
              Inadimplencia Operacional
            </span>
          }
          description="Fila operacional para acompanhar risco, bloqueio e regularizacao dos clientes."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  void handleReprocessarFila();
                }}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#159A9C] px-4 text-sm font-medium text-white transition-colors hover:bg-[#0F7B7D] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={reprocessandoFila}
              >
                {reprocessandoFila ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Processar agora
              </button>
              <button
                type="button"
                onClick={() => {
                  void carregarDados();
                }}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#D4E2E7] bg-white px-4 text-sm font-medium text-[#355061] transition-colors hover:bg-[#F6FBFC]"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar lista
              </button>
            </div>
          }
        />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Card className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[#6C8794]">
              Clientes monitorados
            </p>
            <p className="mt-2 text-2xl font-semibold text-[#173A4D]">{metricas.total}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[#6C8794]">Em risco</p>
            <p className="mt-2 text-2xl font-semibold text-amber-700">{metricas.emRisco}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[#6C8794]">Bloqueados</p>
            <p className="mt-2 text-2xl font-semibold text-rose-700">{metricas.bloqueados}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[#6C8794]">
              Saldo vencido
            </p>
            <p className="mt-2 text-2xl font-semibold text-[#173A4D]">
              {moneyFmt.format(metricas.saldoVencido)}
            </p>
          </Card>
        </div>

        <Card className="space-y-4 p-4">
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.4fr)_220px_220px_auto]">
            <label className="space-y-1">
              <span className="text-sm font-medium text-[#355061]">Buscar cliente</span>
              <div className="flex items-center rounded-xl border border-[#D4E2E7] bg-white px-3">
                <Search className="h-4 w-4 text-[#7B96A3]" />
                <input
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handleBuscar();
                    }
                  }}
                  placeholder="Nome ou e-mail"
                  className="h-11 w-full bg-transparent px-3 text-sm text-[#173A4D] outline-none"
                />
              </div>
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-[#355061]">Status</span>
              <select
                value={statusFiltro}
                onChange={(event) => setStatusFiltro(event.target.value as FiltroStatus)}
                className="h-11 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#173A4D] outline-none"
              >
                <option value="todos">Todos</option>
                <option value="em_risco">Em risco</option>
                <option value="bloqueado_automatico">Bloqueado automatico</option>
                <option value="bloqueado_manual">Bloqueado manual</option>
                <option value="ativo">Ativo</option>
              </select>
            </label>

            <label className="flex items-center gap-2 rounded-xl border border-[#D4E2E7] bg-[#FBFDFE] px-3 py-3">
              <input
                type="checkbox"
                checked={somenteComSaldoVencido}
                onChange={(event) => setSomenteComSaldoVencido(event.target.checked)}
                className="h-4 w-4 rounded border-[#C7D7DE] text-[#159A9C] focus:ring-[#159A9C]"
              />
              <span className="text-sm text-[#355061]">Somente com saldo vencido</span>
            </label>

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={handleBuscar}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-[#159A9C] px-4 text-sm font-medium text-white transition-colors hover:bg-[#0F7B7D]"
              >
                Buscar
              </button>
              <button
                type="button"
                onClick={handleLimpar}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D4E2E7] bg-white px-4 text-sm font-medium text-[#355061] transition-colors hover:bg-[#F6FBFC]"
              >
                Limpar
              </button>
            </div>
          </div>
        </Card>
      </SectionCard>

      <Card className="space-y-4 p-4">
        {loading ? (
          <LoadingSkeleton lines={5} />
        ) : clientes.length === 0 ? (
          <EmptyState
            title="Nenhum cliente encontrado"
            description="Ajuste os filtros ou reavalie os clientes para popular a fila operacional."
          />
        ) : (
          <div className="space-y-3">
            {clientes.map((cliente) => {
              const bloqueado =
                cliente.statusOperacional === 'bloqueado_automatico' ||
                cliente.statusOperacional === 'bloqueado_manual';

              return (
                <div key={cliente.id} className="rounded-2xl border border-[#DCE8EC] bg-white p-4">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/clientes/${cliente.clienteId}`}
                          className="text-base font-semibold text-[#159A9C] hover:text-[#0F7B7D]"
                        >
                          {cliente.cliente?.nome || 'Cliente'}
                        </Link>
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
                            statusClassMap[cliente.statusOperacional]
                          }`}
                        >
                          {statusLabelMap[cliente.statusOperacional]}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-2 text-sm text-[#355061] md:grid-cols-2 xl:grid-cols-4">
                        <p>
                          <span className="font-medium text-[#607B89]">Saldo vencido:</span>{' '}
                          {moneyFmt.format(Number(cliente.saldoVencido || 0))}
                        </p>
                        <p>
                          <span className="font-medium text-[#607B89]">Maior atraso:</span>{' '}
                          {cliente.diasMaiorAtraso} dia(s)
                        </p>
                        <p>
                          <span className="font-medium text-[#607B89]">Titulos vencidos:</span>{' '}
                          {cliente.quantidadeTitulosVencidos}
                        </p>
                        <p>
                          <span className="font-medium text-[#607B89]">Ultima avaliacao:</span>{' '}
                          {formatDateTime(cliente.ultimaAvaliacaoEm)}
                        </p>
                      </div>

                      {cliente.motivo ? (
                        <p className="rounded-xl border border-[#F3E1B6] bg-[#FFF9EB] px-3 py-2 text-sm text-[#8A5A00]">
                          {cliente.motivo}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          void handleReavaliar(cliente.clienteId);
                        }}
                        className="inline-flex items-center gap-2 rounded-lg border border-[#D4E2E7] px-3 py-2 text-xs font-medium text-[#355061] transition-colors hover:bg-[#F6FBFC] disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={actionLoading !== null}
                      >
                        {actionLoading === `reavaliar:${cliente.clienteId}` ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                        Reavaliar
                      </button>

                      {bloqueado ? (
                        <button
                          type="button"
                          onClick={() => {
                            void handleDesbloquear(cliente.clienteId);
                          }}
                          className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={actionLoading !== null}
                        >
                          {actionLoading === `desbloquear:${cliente.clienteId}` ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Unlock className="h-3.5 w-3.5" />
                          )}
                          Liberar
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            void handleBloquear(cliente.clienteId);
                          }}
                          className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={actionLoading !== null}
                        >
                          {actionLoading === `bloquear:${cliente.clienteId}` ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Lock className="h-3.5 w-3.5" />
                          )}
                          Bloquear
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
