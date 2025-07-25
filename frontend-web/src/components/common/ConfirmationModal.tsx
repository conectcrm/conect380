/**
 * Modal de Confirmação Personalizado
 * Substitui o window.confirm do navegador por um modal moderno e responsivo
 */

import React from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { ConfirmationState } from '../../hooks/useConfirmation';

interface ConfirmationModalProps {
  confirmationState: ConfirmationState;
}

const getIconComponent = (iconType: string) => {
  switch (iconType) {
    case 'danger':
      return <XCircle className="w-6 h-6 text-red-600" />;
    case 'success':
      return <CheckCircle className="w-6 h-6 text-green-600" />;
    case 'info':
      return <Info className="w-6 h-6 text-blue-600" />;
    case 'warning':
    default:
      return <AlertTriangle className="w-6 h-6 text-amber-600" />;
  }
};

const getIconBgClass = (iconType: string) => {
  switch (iconType) {
    case 'danger':
      return 'bg-red-100';
    case 'success':
      return 'bg-green-100';
    case 'info':
      return 'bg-blue-100';
    case 'warning':
    default:
      return 'bg-amber-100';
  }
};

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  confirmationState
}) => {
  const { isOpen, options, onConfirm, onCancel } = confirmationState;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className={`w-12 h-12 ${getIconBgClass(options.icon || 'warning')} rounded-full flex items-center justify-center`}>
              {getIconComponent(options.icon || 'warning')}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {options.title}
              </h3>
            </div>
          </div>
          
          <p className="text-gray-700 mb-6">
            {options.message}
          </p>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              {options.cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${options.confirmButtonClass}`}
            >
              {options.confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
