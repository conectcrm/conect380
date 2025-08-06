import React, { useState, useMemo } from 'react';
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
  Edit
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
  position
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Calcular posição do preview para não sair da tela (sempre executar hooks antes de early returns)
  const adjustedPosition = useMemo(() => {
    return calculateSafePosition(position, 400, 500);
  }, [position.x, position.y]);

  if (!isVisible || !proposta) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
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

  const getUrgenciaColor = () => {
    if (!diasRestantes) return 'gray';
    if (diasRestantes < 0) return 'red';
    if (diasRestantes <= 3) return 'orange';
    if (diasRestantes <= 7) return 'yellow';
    return 'green';
  };

  return (
    <>
      {/* Overlay transparente para fechar */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Preview Card */}
      <div
        className="fixed z-50 w-96 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
        style={{
          left: adjustedPosition.x,
          top: adjustedPosition.y,
          transform: 'translate(10px, -50%)'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              <h3 className="font-semibold text-lg">{proposta.numero || 'Proposta'}</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-blue-500 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-2">
            <p className="text-blue-100 text-sm font-medium">{proposta.titulo || 'Sem título'}</p>
          </div>
        </div>

        {/* Status Flow */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <StatusFluxo
            status={proposta.status}
            compact={true}
          />
        </div>

        {/* Conteúdo Principal */}
        <div className="p-4 space-y-4">
          {/* Cliente e Vendedor */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Building className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Cliente</span>
              </div>
              <p className="text-sm text-gray-900 font-medium">
                {proposta.cliente || 'Cliente não informado'}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Vendedor</span>
              </div>
              <p className="text-sm text-gray-900">
                {proposta.vendedor || 'Não atribuído'}
              </p>
            </div>
          </div>

          {/* Valor e Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Valor</span>
              </div>
              <p className="text-lg font-bold text-green-600">
                {formatCurrency(proposta.valor)}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Vencimento</span>
              </div>
              <p className="text-sm text-gray-900">
                {formatDate(proposta.data_vencimento)}
              </p>
              {diasRestantes !== null && (
                <p className={`text-xs font-medium mt-1 ${diasRestantes < 0 ? 'text-red-600' :
                  diasRestantes <= 3 ? 'text-orange-600' :
                    diasRestantes <= 7 ? 'text-yellow-600' :
                      'text-green-600'
                  }`}>
                  {diasRestantes < 0
                    ? `Vencida há ${Math.abs(diasRestantes)} dias`
                    : diasRestantes === 0
                      ? 'Vence hoje'
                      : `${diasRestantes} dias restantes`
                  }
                </p>
              )}
            </div>
          </div>

          {/* Informações Adicionais */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Criada em</span>
            </div>
            <p className="text-sm text-gray-900">
              {formatDate(proposta.data_criacao)}
            </p>
          </div>

          {/* Descrição (se houver) */}
          {proposta.descricao && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Descrição</h4>
              <p className="text-sm text-gray-600 line-clamp-3">
                {proposta.descricao}
              </p>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <button
              onClick={onViewFull}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              Ver Completa
            </button>

            <button
              onClick={onEdit}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
              title="Editar"
            >
              <Edit className="w-4 h-4" />
            </button>

            <button
              onClick={onDownload}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onSend}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
              title="Enviar"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Indicador de Urgência */}
        {diasRestantes !== null && diasRestantes <= 7 && (
          <div className={`absolute top-4 right-12 w-3 h-3 rounded-full ${diasRestantes < 0 ? 'bg-red-500' :
            diasRestantes <= 3 ? 'bg-orange-500' :
              'bg-yellow-500'
            } animate-pulse`} />
        )}
      </div>
    </>
  );
};

export default PreviewProposta;
