import React from 'react';
import { AlertTriangle, CheckCircle, X, Trash2, DollarSign, Download } from 'lucide-react';

interface ModalConfirmacaoProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  titulo: string;
  mensagem: string;
  tipo: 'excluir' | 'pagar' | 'exportar' | 'geral';
  loading?: boolean;
  dados?: {
    quantidade?: number;
    valor?: number;
    itens?: string[];
  };
}

const ModalConfirmacao: React.FC<ModalConfirmacaoProps> = ({
  isOpen,
  onClose,
  onConfirm,
  titulo,
  mensagem,
  tipo,
  loading = false,
  dados
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (tipo) {
      case 'excluir':
        return <Trash2 className="w-8 h-8 text-red-600" />;
      case 'pagar':
        return <DollarSign className="w-8 h-8 text-green-600" />;
      case 'exportar':
        return <Download className="w-8 h-8 text-blue-600" />;
      default:
        return <AlertTriangle className="w-8 h-8 text-yellow-600" />;
    }
  };

  const getColors = () => {
    switch (tipo) {
      case 'excluir':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          confirmBtn: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          confirmText: 'text-white'
        };
      case 'pagar':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          confirmBtn: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
          confirmText: 'text-white'
        };
      case 'exportar':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          confirmBtn: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
          confirmText: 'text-white'
        };
      default:
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          confirmBtn: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
          confirmText: 'text-white'
        };
    }
  };

  const colors = getColors();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className={`p-6 ${colors.bg} ${colors.border} border-b rounded-t-lg`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getIcon()}
              <h3 className="text-lg font-semibold text-gray-900">
                {titulo}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            {mensagem}
          </p>

          {/* Dados adicionais */}
          {dados && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              {dados.quantidade && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Quantidade:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {dados.quantidade} {dados.quantidade === 1 ? 'item' : 'itens'}
                  </span>
                </div>
              )}

              {dados.valor && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Valor total:</span>
                  <span className="text-sm font-semibold text-green-600">
                    {formatCurrency(dados.valor)}
                  </span>
                </div>
              )}

              {dados.itens && dados.itens.length > 0 && (
                <div className="mt-3">
                  <span className="text-sm font-medium text-gray-600 block mb-2">Itens:</span>
                  <div className="max-h-32 overflow-y-auto">
                    {dados.itens.map((item, index) => (
                      <div key={index} className="text-sm text-gray-700 py-1 px-2 bg-white rounded mb-1">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Aviso para ações irreversíveis */}
          {tipo === 'excluir' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <div className="flex items-center">
                <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
                <span className="text-sm text-red-700 font-medium">
                  Esta ação não pode ser desfeita
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium ${colors.confirmText} ${colors.confirmBtn} border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2`}
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <span>
                {loading ? 'Processando...' :
                  tipo === 'excluir' ? 'Excluir' :
                    tipo === 'pagar' ? 'Confirmar Pagamento' :
                      tipo === 'exportar' ? 'Exportar' : 'Confirmar'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirmacao;
