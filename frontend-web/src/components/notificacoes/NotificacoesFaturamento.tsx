import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { Fatura, StatusFatura } from '../../services/faturamentoService';
import { formatarValorMonetario } from '../../utils/formatacao';

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

interface NotificacoesFaturamentoProps {
  faturas: Fatura[];
  onMarcarComoLida: (notificacaoId: string) => void;
  onAbrirFatura: (faturaId: number) => void;
}

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
      const dataVencimento = new Date(fatura.dataVencimento);
      const diasParaVencimento = Math.ceil(
        (dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Faturas vencidas
      if (diasParaVencimento < 0 && fatura.status === StatusFatura.PENDENTE) {
        novas.push({
          id: `vencida-${fatura.id}`,
          tipo: 'vencida',
          titulo: 'Fatura Vencida',
          descricao: `Fatura #${fatura.numero} venceu há ${Math.abs(diasParaVencimento)} dias - R$ ${formatarValorMonetario(fatura.valorTotal)}`,
          faturaId: fatura.id,
          data: dataVencimento,
          lida: false,
          prioridade: 'critica',
        });
      }

      // Faturas próximas ao vencimento (7 dias)
      if (
        diasParaVencimento >= 0 &&
        diasParaVencimento <= 7 &&
        fatura.status === StatusFatura.PENDENTE
      ) {
        novas.push({
          id: `vencimento-${fatura.id}`,
          tipo: 'vencimento',
          titulo: 'Fatura Próxima ao Vencimento',
          descricao: `Fatura #${fatura.numero} vence em ${diasParaVencimento} dias - R$ ${formatarValorMonetario(fatura.valorTotal)}`,
          faturaId: fatura.id,
          data: dataVencimento,
          lida: false,
          prioridade: diasParaVencimento <= 3 ? 'alta' : 'media',
        });
      }

      // Pagamentos recebidos (últimos 7 dias)
      if (fatura.status === StatusFatura.PAGA) {
        const diasDesdePagamento = Math.ceil(
          (hoje.getTime() - new Date(fatura.atualizadoEm).getTime()) / (1000 * 60 * 60 * 24),
        );
        if (diasDesdePagamento <= 7) {
          novas.push({
            id: `pagamento-${fatura.id}`,
            tipo: 'pagamento',
            titulo: 'Pagamento Recebido',
            descricao: `Fatura #${fatura.numero} foi paga - R$ ${formatarValorMonetario(fatura.valorTotal)}`,
            faturaId: fatura.id,
            data: new Date(fatura.atualizadoEm),
            lida: false,
            prioridade: 'baixa',
          });
        }
      }
    });

    // Análises e metas
    const totalVencidas = faturas.filter((f) => {
      const diasVenc = Math.ceil(
        (new Date(f.dataVencimento).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
      );
      return diasVenc < 0 && f.status === StatusFatura.PENDENTE;
    }).length;

    if (totalVencidas > 5) {
      novas.push({
        id: 'meta-inadimplencia',
        tipo: 'meta',
        titulo: 'Alta Inadimplência',
        descricao: `${totalVencidas} faturas vencidas requerem atenção imediata`,
        data: hoje,
        lida: false,
        prioridade: 'critica',
      });
    }

    // Ordenar por prioridade e data
    novas.sort((a, b) => {
      const prioridades = { critica: 4, alta: 3, media: 2, baixa: 1 };
      const priA = prioridades[a.prioridade];
      const priB = prioridades[b.prioridade];

      if (priA !== priB) return priB - priA;
      return new Date(b.data).getTime() - new Date(a.data).getTime();
    });

    setNotificacoes(novas);
  };

  const getIconeNotificacao = (tipo: string) => {
    switch (tipo) {
      case 'vencida':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'vencimento':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'pagamento':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cobranca':
        return <DollarSign className="w-5 h-5 text-blue-500" />;
      case 'meta':
        return <TrendingUp className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getCorPrioridade = (prioridade: string) => {
    switch (prioridade) {
      case 'critica':
        return 'border-l-red-500 bg-red-50';
      case 'alta':
        return 'border-l-orange-500 bg-orange-50';
      case 'media':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'baixa':
        return 'border-l-green-500 bg-green-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const notificacoesNaoLidas = notificacoes.filter((n) => !n.lida).length;
  const notificacoesFiltradas =
    filtroTipo === 'todas' ? notificacoes : notificacoes.filter((n) => n.tipo === filtroTipo);

  return (
    <div className="relative">
      {/* Botão de Notificações */}
      <button
        onClick={() => setMostrarPainel(!mostrarPainel)}
        className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        title="Notificações"
      >
        <Bell className="w-6 h-6" />
        {notificacoesNaoLidas > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {notificacoesNaoLidas > 9 ? '9+' : notificacoesNaoLidas}
          </span>
        )}
      </button>

      {/* Painel de Notificações */}
      {mostrarPainel && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Notificações
                {notificacoesNaoLidas > 0 && (
                  <span className="ml-2 text-sm bg-red-100 text-red-600 px-2 py-1 rounded-full">
                    {notificacoesNaoLidas} novas
                  </span>
                )}
              </h3>
              <button
                onClick={() => setMostrarPainel(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Filtros */}
            <div className="mt-3">
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todas">Todas as notificações</option>
                <option value="vencida">Faturas vencidas</option>
                <option value="vencimento">Próximas ao vencimento</option>
                <option value="pagamento">Pagamentos recebidos</option>
                <option value="meta">Análises e metas</option>
              </select>
            </div>
          </div>

          {/* Lista de Notificações */}
          <div className="max-h-80 overflow-y-auto">
            {notificacoesFiltradas.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>Nenhuma notificação</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notificacoesFiltradas.slice(0, 10).map((notificacao) => (
                  <div
                    key={notificacao.id}
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 ${getCorPrioridade(notificacao.prioridade)} ${
                      !notificacao.lida ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => {
                      if (notificacao.faturaId) {
                        onAbrirFatura(notificacao.faturaId);
                      }
                      if (!notificacao.lida) {
                        onMarcarComoLida(notificacao.id);
                      }
                      setMostrarPainel(false);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getIconeNotificacao(notificacao.tipo)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium text-gray-900 ${
                            !notificacao.lida ? 'font-semibold' : ''
                          }`}
                        >
                          {notificacao.titulo}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">{notificacao.descricao}</p>
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {notificacao.data.toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      {!notificacao.lida && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {notificacoesFiltradas.length > 10 && (
              <div className="p-3 text-center border-t border-gray-200">
                <button className="text-sm text-blue-600 hover:text-blue-800">
                  Ver mais {notificacoesFiltradas.length - 10} notificações
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
