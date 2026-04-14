import React, { useMemo } from 'react';
import {
  Eye,
  Calendar,
  DollarSign,
  User,
  Building,
  FileText,
  Clock,
  X,
  ExternalLink,
  Download,
  Send,
  Edit,
} from 'lucide-react';
import StatusFluxo from './StatusFluxo';
import { calculateSafePosition } from '../../../utils/dom-helper';

interface PreviewPropostaProps {
  proposta: any;
  isVisible: boolean;
  onClose: () => void;
  onViewFull: () => void;
  onEdit: () => void;
  onDownload: () => void;
  onSend: () => void;
  position: { x: number; y: number };
}

export const PreviewProposta: React.FC<PreviewPropostaProps> = ({
  proposta,
  isVisible,
  onClose,
  onViewFull,
  onEdit,
  onDownload,
  onSend,
  position,
}) => {
  // Calcular posição do preview para não sair da tela (sempre executar hooks antes de early returns)
  const adjustedPosition = useMemo(() => {
    return calculateSafePosition(position, 400, 500);
  }, [position.x, position.y]);

  if (!isVisible || !proposta) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };

  const formatDate = (date: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const calcularDiasRestantes = () => {
    if (!proposta.data_vencimento) return null;
    const hoje = new Date();
    const vencimento = new Date(proposta.data_vencimento);
    const diffTime = vencimento.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const diasRestantes = calcularDiasRestantes();

  return (
    <>
      {/* Overlay transparente para fechar */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Preview Card */}
      <div
        className="fixed z-50 w-96 overflow-hidden rounded-2xl border border-[#D4E2E7] bg-white shadow-[0_24px_60px_-28px_rgba(15,57,74,0.5)]"
        style={{
          left: adjustedPosition.x,
          top: adjustedPosition.y,
          transform: 'translate(10px, -50%)',
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              <h3 className="font-semibold text-lg">{proposta.numero || 'Proposta'}</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 transition hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-2">
            <p className="text-sm font-medium text-[#D9F5F1]">{proposta.titulo || 'Sem título'}</p>
          </div>
        </div>

        {/* Status Flow */}
        <div className="border-b border-[#E4EDF0] bg-[#F7FBFC] p-4">
          <StatusFluxo status={proposta.status} compact={true} />
        </div>

        {/* Conteúdo Principal */}
        <div className="space-y-4 p-4">
          {/* Cliente e Vendedor */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Building className="h-4 w-4 text-[#607B89]" />
                <span className="text-sm font-medium text-[#607B89]">Cliente</span>
              </div>
              <p className="text-sm font-medium text-[#19384C]">
                {proposta.cliente || 'Cliente não informado'}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <User className="h-4 w-4 text-[#607B89]" />
                <span className="text-sm font-medium text-[#607B89]">Vendedor</span>
              </div>
              <p className="text-sm text-[#19384C]">{proposta.vendedor || 'Não atribuído'}</p>
            </div>
          </div>

          {/* Valor e Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-[#607B89]" />
                <span className="text-sm font-medium text-[#607B89]">Valor</span>
              </div>
              <p className="text-lg font-bold text-[#159A9C]">{formatCurrency(proposta.valor)}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-[#607B89]" />
                <span className="text-sm font-medium text-[#607B89]">Vencimento</span>
              </div>
              <p className="text-sm text-[#19384C]">{formatDate(proposta.data_vencimento)}</p>
              {diasRestantes !== null && (
                <p
                  className={`text-xs font-medium mt-1 ${
                    diasRestantes < 0
                      ? 'text-red-600'
                      : diasRestantes <= 3
                        ? 'text-orange-600'
                        : diasRestantes <= 7
                          ? 'text-yellow-600'
                          : 'text-green-600'
                  }`}
                >
                  {diasRestantes < 0
                    ? `Vencida há ${Math.abs(diasRestantes)} dias`
                    : diasRestantes === 0
                      ? 'Vence hoje'
                      : `${diasRestantes} dias restantes`}
                </p>
              )}
            </div>
          </div>

          {/* Informações Adicionais */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-[#607B89]" />
              <span className="text-sm font-medium text-[#607B89]">Criada em</span>
            </div>
            <p className="text-sm text-[#19384C]">{formatDate(proposta.data_criacao)}</p>
          </div>

          {/* Descrição (se houver) */}
          {proposta.descricao && (
            <div>
              <h4 className="mb-1 text-sm font-medium text-[#607B89]">Descrição</h4>
              <p className="line-clamp-3 text-sm text-[#4C6775]">{proposta.descricao}</p>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="border-t border-[#E4EDF0] bg-[#F7FBFC] p-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onViewFull}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#159A9C] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#0F7B7D]"
            >
              <ExternalLink className="w-4 h-4" />
              Ver Completa
            </button>

            <button
              type="button"
              onClick={onEdit}
              className="flex items-center justify-center gap-2 rounded-lg border border-[#D4E2E7] bg-white px-3 py-2 text-sm text-[#244455] transition hover:bg-[#F6FAFB]"
              title="Editar"
            >
              <Edit className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onDownload}
              className="flex items-center justify-center gap-2 rounded-lg border border-[#D4E2E7] bg-white px-3 py-2 text-sm text-[#244455] transition hover:bg-[#F6FAFB]"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onSend}
              className="flex items-center justify-center gap-2 rounded-lg border border-[#D4E2E7] bg-white px-3 py-2 text-sm text-[#244455] transition hover:bg-[#F6FAFB]"
              title="Enviar"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Indicador de Urgência */}
        {diasRestantes !== null && diasRestantes <= 7 && (
          <div
            className={`absolute top-4 right-12 w-3 h-3 rounded-full ${
              diasRestantes < 0
                ? 'bg-red-500'
                : diasRestantes <= 3
                  ? 'bg-orange-500'
                  : 'bg-yellow-500'
            } animate-pulse`}
          />
        )}
      </div>
    </>
  );
};

export default PreviewProposta;
