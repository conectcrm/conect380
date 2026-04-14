import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Bell,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp,
  X,
} from 'lucide-react';
import { Fatura, StatusFatura } from '../../services/faturamentoService';
import { formatarValorMonetario } from '../../utils/formatacao';
import { daysUntilDate, parseDateToLocalDay } from '../../utils/dateOnly';

interface Notificacao {
  id: string;
  tipo: 'vencimento' | 'vencida' | 'pagamento' | 'cobranca' | 'meta';
  titulo: string;
  descricao: string;
  faturaId?: number;
  data: Date;
  lida: boolean;
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
}

const STATUS_ELEGIVEIS_EM_ABERTO: StatusFatura[] = [
  StatusFatura.PENDENTE,
  StatusFatura.ENVIADA,
  StatusFatura.PARCIALMENTE_PAGA,
  StatusFatura.VENCIDA,
];

const STATUS_ELEGIVEIS_PRE_VENCIMENTO: StatusFatura[] = [
  StatusFatura.PENDENTE,
  StatusFatura.ENVIADA,
  StatusFatura.PARCIALMENTE_PAGA,
];

interface NotificacoesFaturamentoProps {
  faturas: Fatura[];
  onMarcarComoLida: (notificacaoId: string) => void;
  onAbrirFatura: (faturaId: number) => void;
}

const badgePorPrioridade: Record<Notificacao['prioridade'], string> = {
  critica: 'border-[#F2CACA] bg-[#FFF5F5] text-[#A12D2D]',
  alta: 'border-[#F6D7B2] bg-[#FFF8EE] text-[#9B5A00]',
  media: 'border-[#F5E4CC] bg-[#FFF9F2] text-[#A96A14]',
  baixa: 'border-[#D8EFE9] bg-[#F1FBF8] text-[#11795E]',
};

const rotuloPrioridade: Record<Notificacao['prioridade'], string> = {
  critica: 'Critica',
  alta: 'Alta',
  media: 'Media',
  baixa: 'Baixa',
};

export default function NotificacoesFaturamento({
  faturas,
  onMarcarComoLida,
  onAbrirFatura,
}: NotificacoesFaturamentoProps) {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [mostrarPainel, setMostrarPainel] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<string>('todas');

  useEffect(() => {
    gerarNotificacoes();
  }, [faturas]);

  const gerarNotificacoes = () => {
    const novas: Notificacao[] = [];
    const hoje = new Date();

    faturas.forEach((fatura) => {
      const dataVencimento = parseDateToLocalDay(fatura.dataVencimento);
      const diasParaVencimento = daysUntilDate(fatura.dataVencimento);
      const emAberto = STATUS_ELEGIVEIS_EM_ABERTO.includes(fatura.status);

      if (diasParaVencimento < 0 && emAberto) {
        novas.push({
          id: `vencida-${fatura.id}`,
          tipo: 'vencida',
          titulo: 'Fatura vencida',
          descricao: `Fatura #${fatura.numero} venceu ha ${Math.abs(diasParaVencimento)} dia(s) - R$ ${formatarValorMonetario(fatura.valorTotal)}`,
          faturaId: fatura.id,
          data: dataVencimento,
          lida: false,
          prioridade: 'critica',
        });
      }

      if (
        diasParaVencimento >= 0 &&
        diasParaVencimento <= 7 &&
        STATUS_ELEGIVEIS_PRE_VENCIMENTO.includes(fatura.status)
      ) {
        novas.push({
          id: `vencimento-${fatura.id}`,
          tipo: 'vencimento',
          titulo: 'Fatura proxima ao vencimento',
          descricao: `Fatura #${fatura.numero} vence em ${diasParaVencimento} dia(s) - R$ ${formatarValorMonetario(fatura.valorTotal)}`,
          faturaId: fatura.id,
          data: dataVencimento,
          lida: false,
          prioridade: diasParaVencimento <= 3 ? 'alta' : 'media',
        });
      }

      if (fatura.status === StatusFatura.PAGA) {
        const diasDesdePagamento = Math.ceil(
          (hoje.getTime() - new Date(fatura.atualizadoEm).getTime()) / (1000 * 60 * 60 * 24),
        );
        if (diasDesdePagamento <= 7) {
          novas.push({
            id: `pagamento-${fatura.id}`,
            tipo: 'pagamento',
            titulo: 'Pagamento recebido',
            descricao: `Fatura #${fatura.numero} foi paga - R$ ${formatarValorMonetario(fatura.valorTotal)}`,
            faturaId: fatura.id,
            data: new Date(fatura.atualizadoEm),
            lida: false,
            prioridade: 'baixa',
          });
        }
      }
    });

    const totalVencidas = faturas.filter((f) => {
      const diasVenc = daysUntilDate(f.dataVencimento);
      return diasVenc < 0 && STATUS_ELEGIVEIS_EM_ABERTO.includes(f.status);
    }).length;

    if (totalVencidas > 5) {
      novas.push({
        id: 'meta-inadimplencia',
        tipo: 'meta',
        titulo: 'Alta inadimplencia',
        descricao: `${totalVencidas} faturas vencidas requerem atencao imediata`,
        data: hoje,
        lida: false,
        prioridade: 'critica',
      });
    }

    novas.sort((a, b) => {
      const prioridades = { critica: 4, alta: 3, media: 2, baixa: 1 };
      const priA = prioridades[a.prioridade];
      const priB = prioridades[b.prioridade];

      if (priA !== priB) {
        return priB - priA;
      }
      return new Date(b.data).getTime() - new Date(a.data).getTime();
    });

    setNotificacoes((anteriores) => {
      const idsLidos = new Set(anteriores.filter((item) => item.lida).map((item) => item.id));
      return novas.map((item) => (idsLidos.has(item.id) ? { ...item, lida: true } : item));
    });
  };

  const getIconeNotificacao = (tipo: Notificacao['tipo']) => {
    switch (tipo) {
      case 'vencida':
        return <AlertCircle className="h-4 w-4 text-[#C03449]" />;
      case 'vencimento':
        return <Clock className="h-4 w-4 text-[#A96A14]" />;
      case 'pagamento':
        return <CheckCircle className="h-4 w-4 text-[#187C4C]" />;
      case 'cobranca':
        return <DollarSign className="h-4 w-4 text-[#226EA6]" />;
      case 'meta':
        return <TrendingUp className="h-4 w-4 text-[#0F7B7D]" />;
      default:
        return <Bell className="h-4 w-4 text-[#5D7A88]" />;
    }
  };

  const getCorPrioridade = (prioridade: Notificacao['prioridade']) => {
    switch (prioridade) {
      case 'critica':
        return 'border-[#F2CACA] bg-[#FFF6F7]';
      case 'alta':
        return 'border-[#F6D7B2] bg-[#FFF8EE]';
      case 'media':
        return 'border-[#F5E4CC] bg-[#FFF9F2]';
      case 'baixa':
        return 'border-[#D8EFE9] bg-[#F1FBF8]';
      default:
        return 'border-[#DCE7EC] bg-[#FAFCFD]';
    }
  };

  const notificacoesNaoLidas = notificacoes.filter((n) => !n.lida).length;
  const notificacoesFiltradas =
    filtroTipo === 'todas' ? notificacoes : notificacoes.filter((n) => n.tipo === filtroTipo);

  return (
    <div className="relative">
      <button
        onClick={() => setMostrarPainel((aberto) => !aberto)}
        className="relative inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#BFD0D8] bg-white px-3 text-sm font-medium text-[#244455] transition hover:bg-[#F6FAFB]"
        title="Notificacoes"
      >
        <Bell className="h-4 w-4" />
        <span className="hidden sm:inline">Notificacoes</span>
        {notificacoesNaoLidas > 0 && (
          <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C03449] px-1 text-[11px] font-semibold text-white">
            {notificacoesNaoLidas > 9 ? '9+' : notificacoesNaoLidas}
          </span>
        )}
      </button>

      {mostrarPainel && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[420px] max-w-[92vw] overflow-hidden rounded-2xl border border-[#CBDCE4] bg-white shadow-[0_28px_48px_-30px_rgba(10,44,62,0.45)]">
          <div className="border-b border-[#DFE9ED] bg-[#F7FBFD] p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#173A4D]">
                Notificacoes
                {notificacoesNaoLidas > 0 && (
                  <span className="ml-2 rounded-full border border-[#F2CACA] bg-[#FFF5F5] px-2 py-0.5 text-xs font-semibold text-[#A12D2D]">
                    {notificacoesNaoLidas} novas
                  </span>
                )}
              </h3>
              <button
                onClick={() => setMostrarPainel(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#5E7784] transition hover:bg-[#EEF4F7]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3">
              <select
                value={filtroTipo}
                onChange={(event) => setFiltroTipo(event.target.value)}
                className="h-9 w-full rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#159A9C]/45 focus:ring-2 focus:ring-[#159A9C]/15"
              >
                <option value="todas">Todas as notificacoes</option>
                <option value="vencida">Faturas vencidas</option>
                <option value="vencimento">Proximas ao vencimento</option>
                <option value="pagamento">Pagamentos recebidos</option>
                <option value="meta">Analises e metas</option>
              </select>
            </div>
          </div>

          <div className="max-h-[380px] overflow-y-auto bg-white">
            {notificacoesFiltradas.length === 0 ? (
              <div className="p-8 text-center text-[#5F7B89]">
                <Bell className="mx-auto mb-3 h-10 w-10 text-[#B7C8D0]" />
                <p className="text-sm">Nenhuma notificacao para exibir.</p>
              </div>
            ) : (
              <div className="space-y-2 p-3">
                {notificacoesFiltradas.slice(0, 10).map((notificacao) => (
                  <div
                    key={notificacao.id}
                    className={`cursor-pointer rounded-xl border p-3 transition ${getCorPrioridade(notificacao.prioridade)} ${
                      !notificacao.lida ? 'shadow-[0_12px_20px_-18px_rgba(15,57,74,0.55)]' : 'opacity-90'
                    }`}
                    onClick={() => {
                      if (notificacao.faturaId) {
                        onAbrirFatura(notificacao.faturaId);
                      }
                      if (!notificacao.lida) {
                        setNotificacoes((anteriores) =>
                          anteriores.map((item) =>
                            item.id === notificacao.id ? { ...item, lida: true } : item,
                          ),
                        );
                        onMarcarComoLida(notificacao.id);
                      }
                      setMostrarPainel(false);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-[#DCE7EC] bg-white">
                        {getIconeNotificacao(notificacao.tipo)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm text-[#173A4D] ${!notificacao.lida ? 'font-semibold' : ''}`}>
                          {notificacao.titulo}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-[#557181]">{notificacao.descricao}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${badgePorPrioridade[notificacao.prioridade]}`}
                          >
                            {rotuloPrioridade[notificacao.prioridade]}
                          </span>
                          <p className="flex items-center gap-1 text-[11px] text-[#6A8593]">
                            <Calendar className="h-3 w-3" />
                            {notificacao.data.toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                      {!notificacao.lida && (
                        <div className="mt-2 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-[#159A9C]" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {notificacoesFiltradas.length > 10 && (
              <div className="border-t border-[#DFE9ED] bg-[#F7FBFD] p-3 text-center">
                <button className="text-sm font-medium text-[#0F7B7D] transition hover:text-[#0D6769]">
                  Ver mais {notificacoesFiltradas.length - 10} notificacoes
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
