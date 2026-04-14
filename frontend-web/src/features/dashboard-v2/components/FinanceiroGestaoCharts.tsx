import React, { useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  FormaPagamento,
  StatusFatura,
  type EstatisticasPagamentos,
  type Fatura,
} from '../../../services/faturamentoService';

type FinanceiroGestaoChartsProps = {
  faturas: Fatura[];
  pagamentosStats?: EstatisticasPagamentos | null;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string; // YYYY-MM-DD
  periodLabel: string;
  onRefresh?: () => void;
};

type SeriesPoint = {
  key: string; // YYYY-MM-DD
  label: string; // dd/MM
  recebido: number;
  aberto: number;
  vencido: number;
  faturado: number;
};

type PiePoint = {
  name: string;
  value: number;
};

type AgingPoint = {
  faixa: string;
  valor: number;
};

const COLORS = {
  teal: '#159A9C',
  tealDark: '#0F7B7D',
  blue: '#2C708D',
  amber: '#D28A2C',
  red: '#B94A4A',
  slate: '#607B89',
  grid: '#E7EFF3',
} as const;

const PIE_COLORS = [COLORS.teal, '#10B981', COLORS.amber, COLORS.blue, '#8B5CF6', '#F97316'];

const clamp = (n: number): number => (Number.isFinite(n) ? n : 0);

const parseDateOnly = (dateOnly: string): Date => {
  const [yearRaw, monthRaw, dayRaw] = String(dateOnly || '').slice(0, 10).split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  return new Date(year, Math.max(0, month - 1), day);
};

const toDayKey = (value: string | undefined | null): string => String(value || '').slice(0, 10);

const toLabel = (dayKey: string): string => {
  const date = parseDateOnly(dayKey);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
};

const formatCurrencyCompact = (value: number): string => {
  const n = clamp(value);
  if (Math.abs(n) >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `R$ ${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatCurrency = (value: number): string =>
  clamp(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const humanizeMetodo = (metodo: string): string => {
  const key = String(metodo || '').trim().toLowerCase();
  switch (key) {
    case FormaPagamento.PIX:
      return 'Pix';
    case FormaPagamento.BOLETO:
      return 'Boleto';
    case FormaPagamento.CARTAO_CREDITO:
      return 'Cartao credito';
    case FormaPagamento.CARTAO_DEBITO:
      return 'Cartao debito';
    case FormaPagamento.TRANSFERENCIA:
      return 'Transferencia';
    case FormaPagamento.DINHEIRO:
      return 'Dinheiro';
    default:
      return key.length ? key.replace(/_/g, ' ') : 'Outros';
  }
};

const buildDayKeys = (start: string, end: string): string[] => {
  const startDate = parseDateOnly(start);
  const endDate = parseDateOnly(end);
  const result: string[] = [];
  const cursor = new Date(startDate);

  while (cursor.getTime() <= endDate.getTime()) {
    const yyyy = cursor.getFullYear();
    const mm = String(cursor.getMonth() + 1).padStart(2, '0');
    const dd = String(cursor.getDate()).padStart(2, '0');
    result.push(`${yyyy}-${mm}-${dd}`);
    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
};

const buildMetodoRecebimento = (
  faturas: Fatura[],
  pagamentosStats?: EstatisticasPagamentos | null,
): PiePoint[] => {
  const stats = pagamentosStats?.porMetodo;
  if (stats && typeof stats === 'object') {
    return Object.entries(stats)
      .map(([metodo, payload]) => ({
        name: humanizeMetodo(metodo),
        value: clamp(Number(payload?.valor || 0)),
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }

  // Fallback: soma por formaPagamento da fatura (quando estatisticas nao estao disponiveis).
  const totals = new Map<string, number>();
  for (const fatura of faturas) {
    if (String(fatura.status) !== StatusFatura.PAGA) continue;
    const key = humanizeMetodo(String(fatura.formaPagamento || 'outros'));
    const next = clamp(totals.get(key) || 0) + clamp(Number(fatura.valorTotal || 0));
    totals.set(key, next);
  }

  return Array.from(totals.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
};

const buildAging = (faturas: Fatura[]): AgingPoint[] => {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const buckets: AgingPoint[] = [
    { faixa: '1-7d', valor: 0 },
    { faixa: '8-15d', valor: 0 },
    { faixa: '16-30d', valor: 0 },
    { faixa: '31-60d', valor: 0 },
    { faixa: '60d+', valor: 0 },
  ];

  for (const fatura of faturas) {
    if (String(fatura.status) !== StatusFatura.VENCIDA) continue;
    const vencimentoKey = toDayKey(fatura.dataVencimento);
    if (!vencimentoKey) continue;
    const vencimento = parseDateOnly(vencimentoKey);
    const dias = Math.max(
      0,
      Math.round((todayStart.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24)),
    );
    const valor = clamp(Number(fatura.valorTotal || 0));

    if (dias <= 7) buckets[0].valor += valor;
    else if (dias <= 15) buckets[1].valor += valor;
    else if (dias <= 30) buckets[2].valor += valor;
    else if (dias <= 60) buckets[3].valor += valor;
    else buckets[4].valor += valor;
  }

  return buckets.filter((b) => b.valor > 0 || b.faixa === '1-7d');
};

const FinanceiroGestaoCharts: React.FC<FinanceiroGestaoChartsProps> = ({
  faturas,
  pagamentosStats,
  periodStart,
  periodEnd,
  periodLabel,
  onRefresh,
}) => {
  const series = useMemo(() => {
    const dayKeys = buildDayKeys(periodStart, periodEnd);
    const index = new Map<string, SeriesPoint>();

    for (const key of dayKeys) {
      index.set(key, {
        key,
        label: toLabel(key),
        recebido: 0,
        aberto: 0,
        vencido: 0,
        faturado: 0,
      });
    }

    for (const fatura of faturas) {
      const key = toDayKey(fatura.dataVencimento || fatura.dataEmissao);
      const bucket = index.get(key);
      if (!bucket) continue;

      const valor = clamp(Number(fatura.valorTotal || 0));
      bucket.faturado += valor;

      if (fatura.status === StatusFatura.PAGA) bucket.recebido += valor;
      else if (fatura.status === StatusFatura.VENCIDA) bucket.vencido += valor;
      else if (fatura.status === StatusFatura.CANCELADA) {
        // Canceladas nao entram na narrativa gerencial do periodo.
        bucket.faturado -= valor;
      } else bucket.aberto += valor;
    }

    return dayKeys.map((key) => index.get(key) as SeriesPoint);
  }, [faturas, periodEnd, periodStart]);

  const metodoPie = useMemo(
    () => buildMetodoRecebimento(faturas, pagamentosStats),
    [faturas, pagamentosStats],
  );

  const aging = useMemo(() => buildAging(faturas), [faturas]);

  const totals = useMemo(() => {
    return series.reduce(
      (acc, point) => {
        acc.recebido += point.recebido;
        acc.aberto += point.aberto;
        acc.vencido += point.vencido;
        acc.faturado += point.faturado;
        return acc;
      },
      { recebido: 0, aberto: 0, vencido: 0, faturado: 0 },
    );
  }, [series]);

  return (
    <div className="space-y-3.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="inline-flex items-center rounded-full border border-[#CFE6E8] bg-[#F5FAFB] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#4F7282]">
            Visao gerencial
          </span>
          <h3 className="mt-2 text-[20px] font-semibold tracking-[-0.012em] text-[#18374B]">
            Panorama de recebimentos
          </h3>
          <p className="mt-1 text-[13px] text-[#617D89]">
            Evolucao diaria do periodo {periodLabel} com destaque para risco (vencidos) e conversao
            (recebidos).
          </p>
        </div>

        <div className="flex flex-wrap items-stretch gap-2">
          {onRefresh ? (
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center justify-center rounded-[14px] border border-[#D5E3E8] bg-white px-3.5 py-3 text-[13px] font-semibold text-[#2A5C70] hover:bg-[#F3F9F8]"
            >
              Atualizar dados
            </button>
          ) : null}

          <div className="rounded-[14px] border border-[#E2ECEF] bg-[#FBFDFD] px-3.5 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6D8793]">
              Total do periodo
            </p>
            <p className="mt-1 text-[18px] font-semibold leading-none text-[#1C3B4E]">
              {formatCurrencyCompact(totals.faturado)}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-[#6D8793]">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#159A9C]" />
                Recebido {formatCurrencyCompact(totals.recebido)}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#D28A2C]" />
                Em aberto {formatCurrencyCompact(totals.aberto)}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#B94A4A]" />
                Vencido {formatCurrencyCompact(totals.vencido)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-12">
        <div className="rounded-[16px] border border-[#DCE7EB] bg-[linear-gradient(135deg,#FFFFFF_0%,#F4FBFB_60%,#FFFFFF_100%)] p-4 xl:col-span-8">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-[12px] font-semibold text-[#1C3B4E]">Recebido x risco</p>
              <p className="text-[12px] text-[#6D8793]">
                Baseado no vencimento das faturas no periodo selecionado.
              </p>
            </div>
          </div>

          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillRecebido" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.teal} stopOpacity={0.35} />
                    <stop offset="90%" stopColor={COLORS.teal} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="fillAberto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.amber} stopOpacity={0.22} />
                    <stop offset="90%" stopColor={COLORS.amber} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="fillVencido" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.red} stopOpacity={0.22} />
                    <stop offset="90%" stopColor={COLORS.red} stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                <CartesianGrid stroke={COLORS.grid} strokeDasharray="4 6" />
                <XAxis
                  dataKey="label"
                  stroke={COLORS.slate}
                  fontSize={12}
                  tickMargin={8}
                  minTickGap={18}
                />
                <YAxis
                  stroke={COLORS.slate}
                  fontSize={12}
                  tickFormatter={(value) => formatCurrencyCompact(Number(value))}
                  width={70}
                />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    const label =
                      name === 'recebido'
                        ? 'Recebido'
                        : name === 'aberto'
                          ? 'Em aberto'
                          : name === 'vencido'
                            ? 'Vencido'
                            : 'Total';
                    return [formatCurrency(value), label];
                  }}
                  labelFormatter={(label) => `Dia ${label}`}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #DCE7EB',
                    borderRadius: 12,
                    boxShadow: '0 12px 26px -18px rgba(16,57,74,0.35)',
                  }}
                />
                <Legend iconType="circle" />

                <Area
                  type="monotone"
                  dataKey="recebido"
                  stackId="1"
                  stroke={COLORS.tealDark}
                  fill="url(#fillRecebido)"
                  strokeWidth={2}
                  isAnimationActive={true}
                />
                <Area
                  type="monotone"
                  dataKey="aberto"
                  stackId="1"
                  stroke={COLORS.amber}
                  fill="url(#fillAberto)"
                  strokeWidth={2}
                  isAnimationActive={true}
                />
                <Area
                  type="monotone"
                  dataKey="vencido"
                  stackId="1"
                  stroke={COLORS.red}
                  fill="url(#fillVencido)"
                  strokeWidth={2}
                  isAnimationActive={true}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-3.5 xl:col-span-4">
          <div className="rounded-[16px] border border-[#DCE7EB] bg-white p-4">
            <p className="text-[12px] font-semibold text-[#1C3B4E]">Metodos de recebimento</p>
            <p className="mt-1 text-[12px] text-[#6D8793]">
              Distribuicao por valor (quando estatisticas estiverem disponiveis).
            </p>

            <div className="mt-2 h-[160px]">
              {metodoPie.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metodoPie}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={42}
                      outerRadius={68}
                      paddingAngle={2}
                      stroke="transparent"
                    >
                      {metodoPie.map((entry, index) => (
                        <Cell
                          key={`${entry.name}-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), 'Valor']}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #DCE7EB',
                        borderRadius: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-[12px] bg-[#F8FBFC] text-[12px] text-[#6D8793]">
                  Sem dados de metodos no periodo.
                </div>
              )}
            </div>

            {metodoPie.length ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {metodoPie.slice(0, 4).map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2 text-[12px]">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                    />
                    <span className="min-w-0 flex-1 truncate text-[#244556]">{item.name}</span>
                    <span className="font-semibold text-[#1C3B4E]">
                      {formatCurrencyCompact(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="rounded-[16px] border border-[#DCE7EB] bg-white p-4">
            <p className="text-[12px] font-semibold text-[#1C3B4E]">Aging do vencido</p>
            <p className="mt-1 text-[12px] text-[#6D8793]">
              Quanto do atraso esta concentrado em cada faixa.
            </p>

            <div className="mt-2 h-[160px]">
              {aging.some((item) => item.valor > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={aging} layout="vertical" margin={{ top: 0, right: 8, left: 18 }}>
                    <CartesianGrid stroke={COLORS.grid} strokeDasharray="4 6" horizontal={false} />
                    <XAxis
                      type="number"
                      stroke={COLORS.slate}
                      fontSize={11}
                      tickFormatter={(value) => formatCurrencyCompact(Number(value))}
                    />
                    <YAxis type="category" dataKey="faixa" stroke={COLORS.slate} fontSize={12} />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), 'Vencido']}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #DCE7EB',
                        borderRadius: 12,
                      }}
                    />
                    <Bar dataKey="valor" fill={COLORS.red} radius={[8, 8, 8, 8]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-[12px] bg-[#F8FBFC] text-[12px] text-[#6D8793]">
                  Sem atraso relevante no periodo.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(FinanceiroGestaoCharts);
